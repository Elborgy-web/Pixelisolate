const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('posts').select('id, slug, title, cover_image, is_published, content').order('published_at', { ascending: false });
  if (error) {
    console.error('Error fetching posts:', error);
  } else {
    console.log('Posts count:', data.length);
    data.forEach(p => {
      console.log('---');
      console.log('ID:', p.id);
      console.log('Slug:', p.slug);
      console.log('Title:', p.title);
      console.log('Cover Image start:', (p.cover_image || '').substring(0, 80));
      console.log('Content length:', (p.content || '').length);
    });
  }
}
test();
