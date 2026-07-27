import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

// SQL migration script for `posts` table
const createTableSql = `
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_name VARCHAR(100) DEFAULT 'PixelIsolate Team',
  author_avatar TEXT,
  category VARCHAR(100) DEFAULT 'Tutorials',
  reading_time_minutes INT DEFAULT 5,
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(is_published, published_at DESC);
`;

// Seed data articles
const seedPosts = [
  {
    slug: "how-to-eliminate-white-halos-on-dark-tshirts",
    title: "How to Eliminate White Halos on Dark T-Shirts (POD Masterclass)",
    category: "POD Tips",
    reading_time_minutes: 6,
    excerpt: "Learn how subpixel green screen chroma keying and neural AI segmentation eliminate white edge halos and color bleeding on black & dark garments.",
    cover_image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
    author_name: "PixelIsolate Engineering",
    author_avatar: "/logo.png",
    meta_title: "How to Eliminate White Halos on Dark T-Shirts | PixelIsolate",
    meta_description: "Discover how to eliminate ugly white border halos on dark apparel graphics using subpixel isolation and neural background matting.",
    is_published: true,
    published_at: new Date().toISOString(),
    content: `
# How to Eliminate White Halos on Dark T-Shirts

When printing custom graphics on dark apparel (black, navy, charcoal t-shirts), nothing ruins a Print-on-Demand (POD) product faster than **ugly white fringe halos** around the subject.

Whether you sell on Printify, Printful, Teespring, or Shopify, background removal tools often leave anti-aliased white border pixels that become stark white rings when printed with white underbase ink.

---

## 1. Why White Halos Happen in Print-on-Demand

Standard background removal engines work by thresholding opacity. When removing a white or light background:

1. **Anti-Aliasing Fringes:** The transition pixels between the subject and the white background contain mixed RGB colors (50% subject color, 50% white backdrop).
2. **DTG Printing Underbase:** Direct-to-Garment (DTG) printers apply a solid white underbase layer beneath all colored inks to make colors pop on dark shirts.
3. **Fringe Amplification:** Semi-transparent edge pixels trigger the printer to lay down white underbase ink, producing a visible white outline around text, fur, and intricate line art.

---

## 2. The Solution: Subpixel Isolation & Edge Erosion

To achieve crisp, retail-quality prints on dark garments:

### A. Apply Morphological Erosion
By shrinking the outer alpha mask by **1 to 2 pixels**, you strip away the semi-transparent boundary layer without distorting the core artwork.

### B. Use Neural AI Subpixel Segmentation
Unlike standard magic-wand tools, **PixelIsolate's AI Magic Engine** calculates exact transparency alpha values down to sub-pixel resolution, completely separating subject edges from the background color.

---

## 3. Step-by-Step Workflow in PixelIsolate

1. **Upload your artwork** into the PixelIsolate editor workspace.
2. Select **Graphic / Artwork** mode.
3. Enable **AI Magic** for sub-pixel boundary detection.
4. Set **Erosion Size** to \`1px\` if any fringe bleed is present.
5. Export at **100% Full HD PNG Resolution** with transparency intact.

---

## Conclusion

Ready to transform your POD designs? Try **PixelIsolate** today with **10 Free HD Credits** — zero credit card required!
    `.trim()
  },
  {
    slug: "e-commerce-product-photography-background-removal-guide",
    title: "The Ultimate Guide to E-Commerce Product Photography Background Removal",
    category: "E-Commerce",
    reading_time_minutes: 8,
    excerpt: "Boost your Shopify & Amazon conversion rates with clean, professional white & transparent background product photography.",
    cover_image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
    author_name: "PixelIsolate Team",
    author_avatar: "/logo.png",
    meta_title: "E-Commerce Product Photography Background Removal Guide | PixelIsolate",
    meta_description: "Learn how high-resolution background removal increases conversion rates on Shopify, Amazon, and Etsy.",
    is_published: true,
    published_at: new Date(Date.now() - 86400000).toISOString(),
    content: `
# The Ultimate Guide to E-Commerce Product Photography Background Removal

In e-commerce, **your product photos are your storefront**. Studies show that 75% of online shoppers rely on product photos when deciding to make a purchase.

Clean, consistent product images with pure white or transparent backdrops instantly communicate quality and professionalism.

---

## Key Benefits of Studio Background Removal

* **Amazon & Marketplace Compliance:** Amazon, Google Shopping, and eBay strictly require pure white (#FFFFFF) background images for main product listings.
* **Higher Conversion Rates:** Removing clutter and shadows keeps 100% of the customer's focus on product details, textures, and materials.
* **Versatility Across Marketing Channels:** Isolated PNG assets can be seamlessly overlaid onto seasonal banners, social media ads, and hero banners.

---

## Best Practices for Product Isolation

1. **Maintain Crisp Edge Contours:** Avoid aggressive blur or heavy feathering that makes product edges look fuzzy.
2. **Preserve Natural Drop Shadows:** Use safety backdrops or green-screen preview modes to verify that subtle contact shadows are preserved.
3. **Batch Processing:** When listing entire product catalogs, use **PixelIsolate Bulk Remover** to isolate dozens of images simultaneously at full original resolution.

---

## Start Isolating Products for Free

Transform your e-commerce store today. Sign up for **PixelIsolate** to claim **10 Free HD Credits**!
    `.trim()
  },
  {
    slug: "ai-background-removal-vs-chroma-keying-which-is-better",
    title: "AI Background Removal vs. Chroma Keying: Which Should You Use?",
    category: "AI Tools",
    reading_time_minutes: 5,
    excerpt: "Understand the technical differences between AI neural segmentation models and traditional RGB/HSV Chroma Keying to pick the perfect workflow.",
    cover_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    author_name: "PixelIsolate Engineering",
    author_avatar: "/logo.png",
    meta_title: "AI Background Removal vs Chroma Keying | PixelIsolate Blog",
    meta_description: "Compare AI neural background matting with Chroma Keying to choose the right technique for hair, products, and graphics.",
    is_published: true,
    published_at: new Date(Date.now() - 172800000).toISOString(),
    content: `
# AI Background Removal vs. Chroma Keying: Which Should You Use?

Choosing between **AI Neural Segmentation** and **Chroma Keying** depends on your subject material, backdrop uniformity, and required processing speed.

---

## 1. Chroma Keying (Color-Based Extraction)

Chroma keying works by targeting a specific key color (such as studio green, blue, white, or black) and calculating the Euclidean distance between pixel colors.

### Best For:
* Graphics, logos, and vector illustrations on solid backdrops.
* Rapid client-side processing with zero server latency.
* Fine manual control over color distance thresholds and connectivity flood-fill.

---

## 2. AI Neural Segmentation (RMBG / BiRefNet Architecture)

AI neural segmentation uses deep convolutional neural networks trained on millions of high-resolution images to understand object semantics (hair, eyes, fur, fabric edges).

### Best For:
* Complex portrait photography with messy hair strands.
* Transparent glass, water droplets, and semi-opaque fabrics.
* Unstructured real-world backgrounds without solid studio backdrops.

---

## Why Choose When You Have Both?

PixelIsolate uniquely integrates **both engines** into a unified browser workspace, giving you the precision of AI Magic alongside the speed and control of Chroma Keying.

Try **PixelIsolate** now with **10 Free HD Credits**!
    `.trim()
  }
];

async function seedData() {
  console.log("Seeding blog posts to Supabase...");
  for (const post of seedPosts) {
    const { data, error } = await supabase
      .from("posts")
      .upsert(post, { onConflict: "slug" })
      .select();
    
    if (error) {
      console.error(`Error seeding post '${post.slug}':`, error.message);
    } else {
      console.log(`Successfully seeded post: '${post.title}'`);
    }
  }
}

seedData();
