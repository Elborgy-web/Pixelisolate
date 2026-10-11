const https = require("https");

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.TOKEN || "";
const OLD_REF = process.env.OLD_SUPABASE_REF || "nyiwicwbwzjkijamqqsl";
const NEW_REF = process.env.NEW_SUPABASE_REF || "wnzgwwtidscjwfnapleb";

// ID Mappings between old database auth.users and new database auth.users
const ID_MAP = {
  "4a4cb8df-79b3-4c31-832a-a1bbda194881": "e02a11d1-3cb1-4a02-a126-be42f4dd2e61", // muhammad.elborgy@gmail.com
  "45350ded-d373-4c9e-abcb-e0a064c6aa4e": "3239fe0c-56f7-44d7-a2cb-5ef627528d68", // nouranmuhammed700@gmail.com
};

function queryDatabase(projectRef, sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const req = https.request(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`[${projectRef}] HTTP ${res.statusCode}: ${body}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function runMigration() {
  console.log("=== Starting Automated Migration from Old to New Supabase Project ===\n");

  // Step 1: Prepare Schema on New Project
  console.log("1. Preparing schema and column types on new project...");
  const prepareSql = `
    -- Enable UUID extension if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Drop policies depending on posts columns
    DROP POLICY IF EXISTS "Authors can manage own posts" ON public.posts;
    DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
    DROP POLICY IF EXISTS "Service role full access on posts" ON public.posts;
    DROP POLICY IF EXISTS "Enable all access for all users" ON public.posts;
    DROP POLICY IF EXISTS "Allow authenticated manage posts" ON public.posts;

    -- Adjust posts table to allow string or UUID IDs and drop restrictive foreign keys
    ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN id TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN author_id TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN slug TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN title TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN excerpt TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN content TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN cover_image TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN author_name TYPE text;
    ALTER TABLE IF EXISTS public.posts ALTER COLUMN author_avatar TYPE text;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS category text DEFAULT 'Tutorials';
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS reading_time_minutes integer DEFAULT 5;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS meta_title text;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS meta_description text;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS upvotes_count integer DEFAULT 0;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT now();
    ALTER TABLE IF EXISTS public.posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    -- Re-enable open policies on posts
    ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public can view published posts" ON public.posts FOR SELECT USING (true);
    CREATE POLICY "Allow authenticated manage posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

    -- Ensure paddle_subscriptions table exists
    CREATE TABLE IF NOT EXISTS public.paddle_subscriptions (
      id text PRIMARY KEY,
      user_id uuid NOT NULL,
      customer_id text,
      status text,
      price_id text,
      current_period_end timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Ensure post_comments table exists with text post_id
    CREATE TABLE IF NOT EXISTS public.post_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id text NOT NULL,
      user_id uuid,
      author_name text,
      author_avatar text,
      content text,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE IF EXISTS public.post_comments ALTER COLUMN post_id TYPE text;

    -- Ensure post_votes table exists with text post_id
    CREATE TABLE IF NOT EXISTS public.post_votes (
      post_id text NOT NULL,
      user_id uuid NOT NULL,
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY (post_id, user_id)
    );
    ALTER TABLE IF EXISTS public.post_votes ALTER COLUMN post_id TYPE text;

    -- Ensure profiles has all needed columns
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS display_name text;
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS bio text;
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
    ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

    -- Drop foreign key on history temporarily during migration if needed, or re-link
    ALTER TABLE IF EXISTS public.history DROP CONSTRAINT IF EXISTS history_user_id_fkey;
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE IF EXISTS public.paddle_subscriptions DROP CONSTRAINT IF EXISTS paddle_subscriptions_user_id_fkey;
  `;

  await queryDatabase(NEW_REF, prepareSql);
  console.log("   Schema prepared successfully!\n");

  // Step 2: Migrate auth.users (to satisfy user relations and retain account history)
  console.log("2. Fetching auth.users from old database...");
  const oldUsers = await queryDatabase(
    OLD_REF,
    "SELECT id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at FROM auth.users;"
  );
  console.log(`   Found ${oldUsers.length} users in old database.`);

  const newExistingUsers = await queryDatabase(NEW_REF, "SELECT id, email FROM auth.users;");
  const newEmailSet = new Set(newExistingUsers.map((u) => u.email?.toLowerCase()));
  const newIdSet = new Set(newExistingUsers.map((u) => u.id));

  let insertedUsersCount = 0;
  for (const u of oldUsers) {
    if (newEmailSet.has(u.email?.toLowerCase()) || newIdSet.has(u.id)) {
      continue;
    }
    const userSql = `
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        ${escapeSql(u.id)},
        ${escapeSql(u.instance_id)},
        ${escapeSql(u.aud || "authenticated")},
        ${escapeSql(u.role || "authenticated")},
        ${escapeSql(u.email)},
        ${escapeSql(u.encrypted_password || "")},
        ${escapeSql(u.email_confirmed_at || u.created_at)},
        ${escapeSql(u.raw_app_meta_data || {})},
        ${escapeSql(u.raw_user_meta_data || {})},
        ${escapeSql(u.created_at)},
        ${escapeSql(u.updated_at)}
      ) ON CONFLICT (id) DO NOTHING;
    `;
    await queryDatabase(NEW_REF, userSql);
    insertedUsersCount++;
  }
  console.log(`   Migrated ${insertedUsersCount} additional user accounts into new auth.users.\n`);

  // Step 3: Migrate profiles
  console.log("3. Fetching and migrating profiles...");
  const oldProfiles = await queryDatabase(OLD_REF, "SELECT * FROM public.profiles;");
  console.log(`   Found ${oldProfiles.length} profiles in old database.`);

  for (const p of oldProfiles) {
    const targetUserId = ID_MAP[p.id] || p.id;
    const profileSql = `
      INSERT INTO public.profiles (
        id, email, full_name, avatar_url, is_pro, subscription_status,
        paddle_subscription_id, paddle_customer_id, hd_credits, solid_bg_trials_remaining,
        email_notifications_enabled, unsubscribe_token, created_at, updated_at
      ) VALUES (
        ${escapeSql(targetUserId)},
        ${escapeSql(p.email)},
        ${escapeSql(p.full_name)},
        ${escapeSql(p.avatar_url)},
        ${escapeSql(p.is_pro || false)},
        ${escapeSql(p.subscription_status || "inactive")},
        ${escapeSql(p.paddle_subscription_id)},
        ${escapeSql(p.paddle_customer_id)},
        ${escapeSql(p.hd_credits || 0)},
        ${escapeSql(p.solid_bg_trials_remaining ?? 3)},
        ${escapeSql(p.email_notifications_enabled ?? true)},
        ${escapeSql(p.unsubscribe_token || "token_" + targetUserId)},
        ${escapeSql(p.created_at || new Date().toISOString())},
        ${escapeSql(p.updated_at || new Date().toISOString())}
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        is_pro = EXCLUDED.is_pro,
        hd_credits = GREATEST(profiles.hd_credits, EXCLUDED.hd_credits),
        subscription_status = EXCLUDED.subscription_status,
        paddle_subscription_id = COALESCE(EXCLUDED.paddle_subscription_id, profiles.paddle_subscription_id),
        paddle_customer_id = COALESCE(EXCLUDED.paddle_customer_id, profiles.paddle_customer_id);
    `;
    await queryDatabase(NEW_REF, profileSql);
  }
  console.log(`   Profiles migrated successfully!\n`);

  // Step 4: Migrate posts (31 blog posts)
  console.log("4. Fetching and migrating blog posts...");
  const oldPosts = await queryDatabase(OLD_REF, "SELECT * FROM public.posts;");
  console.log(`   Found ${oldPosts.length} posts in old database.`);

  for (const post of oldPosts) {
    const targetAuthorId = post.author_id && ID_MAP[post.author_id] ? ID_MAP[post.author_id] : post.author_id;
    const postSql = `
      INSERT INTO public.posts (
        id, slug, title, excerpt, content, cover_image, author_id, author_name, author_avatar,
        category, reading_time_minutes, meta_title, meta_description, is_published,
        upvotes_count, comments_count, published_at, created_at, updated_at
      ) VALUES (
        ${escapeSql(post.id)},
        ${escapeSql(post.slug)},
        ${escapeSql(post.title)},
        ${escapeSql(post.excerpt)},
        ${escapeSql(post.content)},
        ${escapeSql(post.cover_image)},
        ${escapeSql(targetAuthorId)},
        ${escapeSql(post.author_name || "PixelIsolate Team")},
        ${escapeSql(post.author_avatar)},
        ${escapeSql(post.category || "Tutorials")},
        ${escapeSql(post.reading_time_minutes || 5)},
        ${escapeSql(post.meta_title || post.title)},
        ${escapeSql(post.meta_description || post.excerpt)},
        ${escapeSql(post.is_published ?? true)},
        ${escapeSql(post.upvotes_count || 0)},
        ${escapeSql(post.comments_count || 0)},
        ${escapeSql(post.published_at || new Date().toISOString())},
        ${escapeSql(post.created_at || new Date().toISOString())},
        ${escapeSql(post.updated_at || new Date().toISOString())}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content,
        cover_image = EXCLUDED.cover_image,
        category = EXCLUDED.category,
        is_published = EXCLUDED.is_published;
    `;
    await queryDatabase(NEW_REF, postSql);
  }
  console.log(`   Migrated ${oldPosts.length} blog posts into new database!\n`);

  // Step 5: Migrate post_comments and post_votes
  console.log("5. Fetching and migrating post_comments & post_votes...");
  const oldComments = await queryDatabase(OLD_REF, "SELECT * FROM public.post_comments;");
  for (const c of oldComments) {
    const targetUserId = c.user_id && ID_MAP[c.user_id] ? ID_MAP[c.user_id] : c.user_id;
    const commentSql = `
      INSERT INTO public.post_comments (id, post_id, user_id, user_name, user_avatar, content, created_at)
      VALUES (
        ${escapeSql(c.id)},
        ${escapeSql(c.post_id)},
        ${escapeSql(targetUserId)},
        ${escapeSql(c.user_name || c.author_name || "Community User")},
        ${escapeSql(c.user_avatar || c.author_avatar || "")},
        ${escapeSql(c.content)},
        ${escapeSql(c.created_at)}
      ) ON CONFLICT (id) DO NOTHING;
    `;
    await queryDatabase(NEW_REF, commentSql);
  }
  console.log(`   Migrated ${oldComments.length} comments.\n`);

  // Step 6: Migrate paddle_subscriptions
  console.log("6. Fetching and migrating paddle_subscriptions...");
  const oldSubs = await queryDatabase(OLD_REF, "SELECT * FROM public.paddle_subscriptions;");
  for (const s of oldSubs) {
    const targetUserId = ID_MAP[s.user_id] || s.user_id;
    const subSql = `
      INSERT INTO public.paddle_subscriptions (
        id, user_id, customer_id, status, price_id, current_period_end, created_at, updated_at
      ) VALUES (
        ${escapeSql(s.id)},
        ${escapeSql(targetUserId)},
        ${escapeSql(s.customer_id)},
        ${escapeSql(s.status)},
        ${escapeSql(s.price_id)},
        ${escapeSql(s.current_period_end)},
        ${escapeSql(s.created_at)},
        ${escapeSql(s.updated_at)}
      ) ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end;
    `;
    await queryDatabase(NEW_REF, subSql);
  }
  console.log(`   Migrated ${oldSubs.length} paddle subscriptions.\n`);

  // Step 7: Migrate history (221 rows)
  console.log("7. Fetching and migrating user history records (221 rows)...");
  const oldHistory = await queryDatabase(OLD_REF, "SELECT * FROM public.history ORDER BY created_at ASC;");
  console.log(`   Found ${oldHistory.length} history records in old database.`);

  let batchSize = 25;
  for (let i = 0; i < oldHistory.length; i += batchSize) {
    const batch = oldHistory.slice(i, i + batchSize);
    const values = batch
      .map((h) => {
        const targetUserId = ID_MAP[h.user_id] || h.user_id;
        return `(
          ${escapeSql(h.id)},
          ${escapeSql(targetUserId)},
          ${escapeSql(h.original_url)},
          ${escapeSql(h.processed_url)},
          ${escapeSql(h.created_at)}
        )`;
      })
      .join(",\n");

    const batchSql = `
      INSERT INTO public.history (id, user_id, original_url, processed_url, created_at)
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        original_url = EXCLUDED.original_url,
        processed_url = EXCLUDED.processed_url;
    `;
    await queryDatabase(NEW_REF, batchSql);
    process.stdout.write(`   Transferred ${Math.min(i + batchSize, oldHistory.length)}/${oldHistory.length} history records...\r`);
  }
  console.log(`\n   Transferred all ${oldHistory.length} history records into new database!\n`);

  // Step 8: Verify totals in New Database
  console.log("8. Verifying counts in new database...");
  const counts = await queryDatabase(
    NEW_REF,
    `SELECT 'posts' as table_name, count(*) FROM public.posts
     UNION ALL SELECT 'profiles', count(*) FROM public.profiles
     UNION ALL SELECT 'history', count(*) FROM public.history
     UNION ALL SELECT 'paddle_subscriptions', count(*) FROM public.paddle_subscriptions
     UNION ALL SELECT 'post_comments', count(*) FROM public.post_comments;`
  );
  console.log("   Final table row counts in wnzgwwtidscjwfnapleb:");
  console.table(counts);

  console.log("\n=== Automated Migration Complete! ===");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
