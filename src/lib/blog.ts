import { supabase } from "../utils/supabaseClient";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  category: string;
  reading_time_minutes: number;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  upvotes_count: number;
  comments_count: number;
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: "admin" | "moderator" | "user";
  credits?: number;
  hd_credits_remaining?: number;
  is_pro?: boolean;
}

// Built-in seed posts (cleared so user has 100% full control over post creation & deletion)
export const INITIAL_SEED_POSTS: BlogPost[] = [
  {
    "id": "post-1785262647257-nbfl",
    "slug": "masterclass-the-quadruple-threat-workflow-for-amazon-merch-seo-aaojf",
    "title": "Masterclass: The Quadruple Threat Workflow for Amazon Merch SEO",
    "excerpt": "Master the ultimate end-to-end Amazon Merch publishing stack: combine real-time niche research, trademark protection, batch subpixel image isolation, and AI vision-powered SEO listing optimization.",
    "content": "# Masterclass: The Quadruple Threat Workflow for Amazon Merch SEO\n\nIn the fiercely competitive world of Amazon Merch on Demand, having a great design is only half the battle. To scale your sales and tier up quickly, you need an end-to-end pipeline: **data-driven research, strict legal compliance, flawless visual assets, and dominant SEO keywords.**\n\nBy connecting [MerchHolmes](http://merchholmes.liveblog365.com/), [MerchSpark AI](http://merchspark.liveblog365.com/), [Pixel Isolate](https://pixelisolate.online, and [AmazonLister](https://amazonlister.liveblog365.com/) into a unified workspace, you can automate your publishing pipeline from initial niche discovery to front-page Amazon rankings.\n\n---\n\n## Step 1: Real-Time Niche Research with MerchHolmes\n\nEvery high-converting Print-on-Demand (POD) product starts with data-backed validation. [MerchHolmes](http://merchholmes.liveblog365.com/) acts as your digital research assistant, scraping real-time Amazon Merch listings to surface active buyers and profitable niches.\n\n* **BSR Analytics:** Instantly locate active sellers and filter out dead listings by defining target Best Seller Rank parameters.\n* **Niche Hunter Mode:** Dig deep into specific sub-categories to uncover underserved customer segments with high buying intent.\n* **Trend Radar:** Track emerging search volume spikes before a niche gets saturated by competitors.\n\n---\n\n## Step 2: Strategic Intelligence & IP Safety with MerchSpark AI\n\nOnce MerchHolmes identifies a high-potential market, [MerchSpark AI](http://merchspark.liveblog365.com/) transforms raw trend data into actionable design prompts while safeguarding your account health.\n\n* **Cross-Niche Trend Telemetry:** Blends buyer velocity spikes across markets to discover low-competition design angles.\n* **Class 25 Isolated IP Scanner:** Scans your target slogans and phrases against protected Class 25 trademark databases to protect your seller account from costly policy strikes.\n* **Design Blueprints:** Generates optimized image prompts tailored for Midjourney or Google Imagen 3, structured specifically for 300 DPI canvas layouts.\n\n---\n\n## Step 3: Pixel-Perfect Asset Isolation with Pixel Isolate\n\nWith a validated design concept generated, visual execution is everything. Standard background removers leave jagged borders or anti-aliased white halos—which ruin prints when applied to dark t-shirts.\n\n[Pixel Isolate](https://pixelisolate.online resolves this with a high-precision workspace built specifically for apparel sellers:\n\n1. **Subpixel Edge Feathering:** Preserves complex subject contours—including fine typography, distressing, and hair/fur—without leaving unwanted white fringe pixels on dark shirts.\n2. **50-File Batch Processing:** Upload and isolate up to 50 design variations simultaneously, downloading clean assets in a single `.zip` archive.\n3. **Print-Ready 4K PNGs:** Guarantees crisp alpha-transparency exports at 300 DPI, fully compliant with Direct-to-Garment (DTG) printing specs across Amazon, Printify, and Redbubble.\n\n---\n\n## Step 4: AI-Driven SEO Listing Domination with AmazonLister\n\nOnce your visual assets are cleaned, you need to ensure eager buyers can find your products in search results. [AmazonLister](https://amazonlister.liveblog365.com/) acts as your dedicated SEO Listing Optimizer:\n\n* **AI Vision Analysis:** Scans your high-resolution PNG assets directly from PixelIsolate to detect visual subjects, colors, and design themes.\n* **Amazon API Live Suggest:** Fetches real-time autocomplete search terms directly from Amazon's search bar to populate high-volume keywords.\n* **Automated Listing Drafts:** Generates fully optimized titles, bullet points, and descriptions packed with relevant search terms to maximize your organic rankings.\n\n---\n\n## The Unified Amazon Merch Pipeline\n\nConnecting these four tools establishes an automated, repeatable publishing engine:\n\n1. **Research:** Discover profitable niches with [MerchHolmes](http://merchholmes.liveblog365.com/).\n2. **Validate:** Ensure trademark compliance and prompt strategy with [MerchSpark AI](http://merchspark.liveblog365.com/).\n3. **Perfect:** Eliminate white halos and batch-isolate PNGs with PixelIsolate.online.\n4. **Optimize:** Rank on page one using [AmazonLister's](https://amazonlister.liveblog365.com/) vision-based SEO drafts.\n\nReady to streamline your design pipeline and clean up your graphics? Test your artwork edges and batch-process up to 50 images with **10 Free HD Credits** directly at [Pixel Isolate](https://pixelisolate.online)—no credit card required!",
    "cover_image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "author_id": "4a4cb8df-79b3-4c31-832a-a1bbda194881",
    "author_name": "Pixel Isolate",
    "author_avatar": "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
    "category": "POD Tips",
    "reading_time_minutes": 4,
    "meta_title": "Masterclass: The Quadruple Threat Workflow for Amazon Merch SEO | PixelIsolate Blog",
    "meta_description": "Master the ultimate end-to-end Amazon Merch publishing stack: combine real-time niche research, trademark protection, batch subpixel image isolation, and AI vision-powered SEO listing optimization.",
    "is_published": true,
    "upvotes_count": 1,
    "comments_count": 0,
    "published_at": "2026-07-28T18:17:27.257+00:00",
    "created_at": "2026-07-28T18:17:27.257+00:00",
    "updated_at": "2026-07-28T18:29:06.52+00:00"
  },
  {
    "id": "post-1785256525042-p6ty",
    "slug": "how-to-turn-ai-art-midjourney-flux-into-print-ready-t-shirt-graphics-hikmb",
    "title": "How to Turn AI Art (Midjourney & Flux) into Print-Ready T-Shirt Graphics",
    "excerpt": "Raw AI art isn't print-ready out of the box. Learn how to remove solid backgrounds, eliminate edge noise, and export 4K transparent PNGs for Merch by Amazon and Etsy without losing fine detail.",
    "content": "# How to Turn AI Art (Midjourney & Flux) into Print-Ready T-Shirt Graphics\n\nAI image generators like **Midjourney, Flux, and Stable Diffusion** have completely transformed the print-on-demand industry. Today, creators can generate intricate vintage illustrations, anime characters, and typography concepts in seconds.\n\nHowever, there’s a major catch: **raw AI generated images are not print-ready.** \n\nAI models generate complete, flat rectangular images—usually with solid black, white, or textured backdrops. If you upload a raw AI image directly to Printify or Amazon Merch, you’ll end up printing an ugly square box onto your apparel.\n\nIn this guide, we’ll cover the exact step-by-step workflow to isolate raw AI art, clean up edge artifacts, and create high-converting transparent PNGs.\n\n---\n\n## The 3 Common Pitfalls of AI-Generated Artwork\n\nBefore sending your AI art to a Direct-to-Garment (DTG) printer, watch out for these three technical issues:\n\n1. **Edge Noise & Compression Artifacts:** AI generators often introduce subtle color compression around fine details (hair, smoke, distress textures).\n2. **Solid Color Bleed:** Even if the background looks solid black or white, it often contains hidden color variations that standard magic wand tools fail to select.\n3. **Low DPI & Resolution:** Standard AI renders are typically 1024x1024 pixels—far below the **4500x5400 px at 300 DPI** requirement for t-shirt printing.\n\n---\n\n## Step-by-Step: From Raw AI Render to Print-Ready PNG\n\n### Step 1: Clean the Background with Subpixel AI\nDo not rely on basic color keying for complex AI art. Use **PixelIsolate's Subpixel AI** to analyze object semantics. \n\n* **For Vector/Flat Graphics:** Use Chroma Keying with tight threshold control to quickly erase solid studio backdrops.\n* **For Intricate/Photorealistic Art:** Use Neural AI Segmentation to preserve delicate elements like hair strands, fur, or glowing magic effects without cutting off details.\n\n---\n\n### Step 2: Eliminate Edge Halos for Dark Apparel\nWhen printing on black or navy t-shirts, printers lay down a solid white ink underbase. If your cutout has lingering light background pixels, your dark shirt will print with an ugly white outline.\n\n* Toggle the **Dark Preview Backdrop** inside PixelIsolate to inspect your cutout at 200% zoom.\n* Apply a **1px Edge Erosion / Shrink** if necessary to strip away residual anti-aliased background pixels.\n\n---\n\n### Step 3: Upscale & Batch Export in 4K\nOnce the background is completely transparent, batch-process your entire AI design collection:\n\n1. Upload up to 50 AI generations at once into PixelIsolate.\n2. Apply automated background removal across the entire batch.\n3. Export full-resolution 24-bit transparent PNGs with alpha channel enabled.\n\n---\n\n## Final Checklist for AI-to-POD Creators\n\n* [ ] Background is 100% transparent (no square box outline).\n* [ ] Edge halos checked against a black background canvas.\n* [ ] File dimensions scaled to at least 4500 x 5400 pixels at 300 DPI.\n* [ ] Exported as 24-bit PNG with alpha transparency.\n\nReady to turn your AI art renders into high-selling t-shirts? Try [Pixel Isolate](https://pixelisolate.online) today with **10 Free HD Credits**—no credit card required!",
    "cover_image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    "author_id": "1f817627-549f-4e4a-8aff-348f0b960dc3",
    "author_name": "Sam Geek",
    "author_avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=1f817627-549f-4e4a-8aff-348f0b960dc3",
    "category": "Design & Printing",
    "reading_time_minutes": 3,
    "meta_title": "How to Turn AI Art (Midjourney & Flux) into Print-Ready T-Shirt Graphics | PixelIsolate Blog",
    "meta_description": "Raw AI art isn't print-ready out of the box. Learn how to remove solid backgrounds, eliminate edge noise, and export 4K transparent PNGs for Merch by Amazon and Etsy without losing fine detail.",
    "is_published": true,
    "upvotes_count": 1,
    "comments_count": 0,
    "published_at": "2026-07-28T16:35:25.042+00:00",
    "created_at": "2026-07-28T16:35:25.042+00:00",
    "updated_at": "2026-07-28T16:35:41.484182+00:00"
  },
  {
    "id": "post-1785256129008-a2qd",
    "slug": "masterclass-the-ultimate-pod-workflow-with-merchholmes-merchspark-ai--oe7uz",
    "title": "Masterclass: The Ultimate POD Workflow with MerchHolmes, MerchSpark AI, &",
    "excerpt": "Discover how to build an unstoppable Print-on-Demand business by combining MerchHolmes for trend discovery, MerchSpark AI for strategic insights and trademark safety, and PixelIsolate.Online for pixel-perfect, bulk image isolation.",
    "content": "# Masterclass: The Ultimate POD Workflow with MerchHolmes, MerchSpark AI, & PixelIsolate\n\nIn the fast-paced world of Print-on-Demand (POD), scaling your sales hinges on three core pillars: **spotting winning trends early, maintaining strict trademark compliance, and delivering flawless visual assets.** \n\nIndividually, tools like **MerchHolmes**, **MerchSpark AI**, and **PixelIsolate.online** excel at solving specific seller pain points. But when linked into a single end-to-end strategy, they create an unstoppable publishing engine for Amazon Merch on Demand, Etsy, and Shopify stores.\n\nHere is how to combine all three tools into a high-speed, repeatable POD workflow.\n\n---\n\n## Step 1: Unearthing High-Velocity Niches with MerchHolmes\n\nEvery successful print-on-demand product starts with data-backed validation. MerchHolmes acts as your digital research assistant, scraping real-time Amazon Merch listings to surface profitable niches before they get saturated.\n\n* **Best Seller Rank (BSR) Analytics:** Instantly locate active sellers and filter out dead listings by defining target BSR parameters.\n* **Niche Hunter Mode:** Dig deep into specific sub-categories to uncover underserved customer segments with high buying intent.\n* **Trend Radar:** Track emerging seasonal demands and velocity spikes before competitors catch on.\n\nBy filtering out irrelevant search noise during this initial phase, you validate demand upfront and minimize wasted effort on low-converting ideas.\n\n---\n\n## Step 2: Strategic Blueprinting & Safety with MerchSpark AI\n\nOnce [MerchHolmes](http://merchholmes.liveblog365.com/) identifies a high-potential market, [MerchSpark AI](http://merchspark.liveblog365.com/) transforms raw trend data into actionable design prompts while safeguarding your account health.\n\n* **Cross-Niche Trend Synthesis:** Logically combines buyer velocity trends to generate unique, low-competition design concepts.\n* **Class 25 Isolated IP Scanner:** Scans your target slogans, catchphrases, and keywords against protected Class 25 trademark databases to protect your seller account from costly policy strikes.\n* **AI Prompt Engineering:** Formulates optimized text-to-image prompts tailored for Midjourney or Google Imagen 3, structured specifically for 300 DPI canvas layouts.\n\n---\n\n## Step 3: Pixel-Perfect Execution with Pixel Isolate\n\nWith a validated design concept generated, execution is everything. Standard background removers routinely leave jagged borders or anti-aliased white halos—which ruin prints when applied to dark t-shirts.\n\n[Pixel Isolate](https://pixelisolate.online) resolves this with a high-precision, technical workspace built for volume sellers:\n\n1. **Subpixel Edge Feathering:** Preserves complex subject contours—including fine typography, distressing, and hair/fur—without leaving unwanted white fringe pixels.\n2. **50-File Batch Processing:** Upload and isolate up to 50 design variations simultaneously, downloading clean assets in a unified `.zip` archive to save hours of manual editing.\n3. **Print-Ready 4K PNGs:** Guarantees crisp alpha-transparency exports at 300 DPI, fully compliant with Direct-to-Garment (DTG) printing specs across Amazon, Printify, and Redbubble.\n\n---\n\n## The Unified POD Powerhouse\n\nBy connecting [MerchHolmes](http://merchholmes.liveblog365.com/) (Research), [MerchSpark AI](http://merchspark.liveblog365.com/) (Strategy & Protection), and [Pixel Isolate](https://pixelisolate.online) (Precision Asset Isolation), you eliminate guesswork and build a scalable system:\n\n1. **Identify** profitable niches with real-time sales data.\n2. **Protect** your brand with automated trademark scanning.\n3. **Perfect** your artwork with subpixel background removal.\n\nReady to optimize your design pipeline? Test your artwork edges and batch process up to 50 graphics with **10 Free HD Credits** directly at [Pixel Isolate](https://pixelisolate.online)—no credit card required!",
    "cover_image": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    "author_id": "1f817627-549f-4e4a-8aff-348f0b960dc3",
    "author_name": "Sam Geek",
    "author_avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=1f817627-549f-4e4a-8aff-348f0b960dc3",
    "category": "Tutorials",
    "reading_time_minutes": 3,
    "meta_title": "Masterclass: The Ultimate POD Workflow with MerchHolmes, MerchSpark AI, & | PixelIsolate Blog",
    "meta_description": "Discover how to build an unstoppable Print-on-Demand business by combining MerchHolmes for trend discovery, MerchSpark AI for strategic insights and trademark safety, and PixelIsolate.Online for pixel-perfect, bulk image isolation.",
    "is_published": true,
    "upvotes_count": 3,
    "comments_count": 0,
    "published_at": "2026-07-28T16:28:49.008+00:00",
    "created_at": "2026-07-28T16:28:49.008+00:00",
    "updated_at": "2026-07-28T16:31:54.446+00:00"
  },
  {
    "id": "post-1785255218240-hrys",
    "slug": "masterclass-bulk-background-removal-for-high-converting-e-commerce-stores-lvd36",
    "title": "Masterclass: Bulk Background Removal for High-Converting E-Commerce Stores",
    "excerpt": "Learn how to batch-process product photography, meet strict Amazon and eBay pure white backdrop requirements, and preserve natural drop shadows to boost store conversions.",
    "content": "# Masterclass: Bulk Background Removal for High-Converting E-Commerce Stores\n\nIn e-commerce, your product photography **is** your digital storefront. Over 75% of online shoppers rely heavily on product photos when making a buying decision. Cluttered backdrops, bad lighting, and inconsistent margins lower customer trust and directly hurt conversion rates.\n\nIn this workflow guide, we’ll walk through how to isolate product photos in bulk, comply with strict marketplace guidelines, and keep your visual branding razor-sharp using PixelIsolate.\n\n---\n\n## 1. Amazon & Google Shopping Compliance\n\nMajor marketplaces like Amazon, Google Shopping, and eBay strictly enforce pure white backgrounds (**#FFFFFF**) for main hero listing photos.\n\n* **Avoid Suppressed Listings:** Non-compliant main images can cause your product listings to be automatically hidden from search results.\n* **Maintain Visual Consistency:** Standardized white backdrops create a cohesive look across your storefront and collection pages.\n* **Maximum Focus:** Eliminating studio clutter keeps 100% of the buyer's attention on your product's textures, colors, and materials.\n\n---\n\n## 2. Preserving Natural Contact Shadows\n\nA common mistake with standard background removers is completely stripping away subtle contact shadows. This leaves products looking like they are awkwardly floating, which reduces perceived product quality.\n\nWhen isolating products like footwear, cosmetics, or electronics:\n1. **Maintain Subpixel Edges:** Ensure crisp contour lines around hard materials (glass, metal, leather) without artificial edge blur.\n2. **Keep Soft Surface Grounding:** Retain realistic ambient shadows directly underneath the base of the item to maintain realistic depth.\n3. **Toggle Preview Backdrops:** Test your cutouts against both solid white (`#FFFFFF`) and dark charcoal backgrounds inside the workspace before exporting.\n\n---\n\n## 3. Scaling Inventory with Bulk Processing\n\nEditing product photos one by one is a major bottleneck during new product drops or seasonal catalog refreshes.\n\nWith PixelIsolate’s bulk workflow:\n* Drag and drop up to **50 high-resolution images** into a single batch session.\n* Automatically process full catalogs in seconds with AI neural segmentation.\n* Export full-resolution 4K transparent PNGs or studio-white JPGs in one click.\n\n---\n\nReady to upgrade your store's product images? Try [PixelIsolate.online](https://pixelisolate.online) with **10 Free HD Credits**—no credit card required!",
    "cover_image": "https://images.unsplash.com/photo-1542744094-3a3121699479?auto=format&fit=crop&w=800&q=80",
    "author_id": "4a4cb8df-79b3-4c31-832a-a1bbda194881",
    "author_name": "Pixel Isolate",
    "author_avatar": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "category": "E-Commerce",
    "reading_time_minutes": 2,
    "meta_title": "Masterclass: Bulk Background Removal for High-Converting E-Commerce Stores | PixelIsolate Blog",
    "meta_description": "Learn how to batch-process product photography, meet strict Amazon and eBay pure white backdrop requirements, and preserve natural drop shadows to boost store conversions.",
    "is_published": true,
    "upvotes_count": 2,
    "comments_count": 0,
    "published_at": "2026-07-28T16:13:38.24+00:00",
    "created_at": "2026-07-28T16:13:38.24+00:00",
    "updated_at": "2026-07-28T16:14:23.391084+00:00"
  },
  {
    "id": "post-1785219802354-bpde",
    "slug": "supercharge-your-pod-workflow-merchspark-ai-meets-pixelisolateonline-ac9zc",
    "title": "Supercharge Your POD Workflow: MerchSpark AI Meets PixelIsolate.Online",
    "excerpt": "The MerchSpark Advantage: Unlocking Print-on-Demand Trends",
    "content": "# Supercharge Your POD Workflow: MerchSpark AI Meets PixelIsolate.Online\n\nFor any serious print-on-demand (POD) seller, staying ahead of trends and ensuring legal compliance are paramount. This is where [MerchSpark](http://merchspark.liveblog365.com/) AI shines. As an Elite POD Trend Strategist and Class 25 Trademark Auditor, [MerchSpark](http://merchspark.liveblog365.com/) provides an unparalleled edge in a competitive market. Its powerful Trends Analyzer sifts through vast amounts of data, identifying buyer velocity spikes across platforms like Etsy and Amazon. Whether it's the surging demand for 'Cybersecurity & DevOps' themed apparel or the evergreen appeal of 'Golden Retriever Shadow Society' designs, MerchSpark pinpoints low-competition opportunities.\n\nBeyond trend identification, MerchSpark offers crucial **Daily RAW Telemetry**, giving you insights into BSR drops, Etsy in-cart counts, and viral social media signals. And in an industry fraught with copyright concerns, the Class 25 Isolated IP Scanner is a game-changer, ensuring your slogans and designs are commercially unique and legally safe before you even launch. MerchSpark doesn't just tell you what to sell; it helps you create the blueprint with its Design Re-imaginer, generating optimized image prompts for tools like Midjourney or Google Imagen 3, all scaled to 300 dpi on a transparent canvas.\n\n## The Missing Piece: Pixel-Perfect Isolation with Pixelisolate\n\n[MerchSpark](http://merchspark.liveblog365.com/) provides the vision and the blueprint, but what happens when you have dozens, or even hundreds, of design assets that need to be perfectly isolated from their backgrounds? This is where PixelIsolate.Online seamlessly integrates into your workflow, transforming raw design concepts into production-ready assets with unparalleled precision and speed.\n\n[Pixelisolate](https://PixelIsolate.Online) is a high-precision, technical, terminal-themed \"Pixel-Level Image Isolation Workspace\" built for the demands of professional digital creators. Unlike standard AI background removers that often leave jagged edges, white halos, or struggle with intricate details like fine hair or fur, PixelIsolate employs subpixel edge feathering. This advanced technology ensures that every alpha mask is flawlessly smooth, allowing your designs to blend seamlessly onto any product or background, maintaining the professional quality your brand deserves.\n\nBut for POD sellers and e-commerce store owners, time is money. [Pixelisolate](https://PixelIsolate.Online) addresses this directly with its powerful **\"Bulk/Batch Remover.\"** Imagine uploading up to 50 images simultaneously, watching them process concurrently, and then downloading your entire collection in a single, clean .zip archive. This eliminates the tedious, time-consuming process of one-by-one downloads and bypasses the frustrating batch limits imposed by other tools. It's mass production engineered for efficiency, without compromising on the pixel-perfect quality that MerchSpark's playbook demands.\n\n## A Synergistic Workflow for Unrivaled Efficiency\n\nTogether, [MerchSpark AI](http://merchspark.liveblog365.com/) and [Pixelisolate](https://PixelIsolate.Online) create a powerhouse workflow for any serious POD entrepreneur:\n\n1. Discover & Strategize with [MerchSpark:](http://merchspark.liveblog365.com/) Identify high-demand, low-competition niches and legally safe slogans.\n\n2. Design & Prompt with [MerchSpark:](http://merchspark.liveblog365.com/) Generate optimized visual concepts and prompts for your AI image generation tools.\n\n3. Isolate & Refine with [Pixelisolate:](https://PixelIsolate.Online) Take your generated design assets, or any product photos, and achieve pixel-perfect background removal at scale. Ensure every transparent PNG meets the 300 dpi standard with flawless edges, ready for print.\n\n4. Deploy with Confidence: Upload your perfectly prepared assets to your Amazon Merch, Etsy, or Shopify stores, knowing they meet the highest quality and legal standards.\n\nBoth platforms share a commitment to a professional, data-driven, and efficient user experience, making them natural companions in the digital creator's toolkit. [MerchSpark](http://merchspark.liveblog365.com/) tells you what to create and how to protect it, while [Pixelisolate](https://PixelIsolate.Online) ensures your creations are visually impeccable and ready for mass production.\n\n## Ready to Elevate Your POD Business?\n\nStop leaving money on the table due to missed trends or subpar image quality. Leverage the combined power of [MerchSpark AI](http://merchspark.liveblog365.com/) for strategic insights and [Pixelisolate](https://PixelIsolate.Online) for pixel-perfect execution. Visit both websites today to streamline your workflow and dominate the print-on-demand market.",
    "cover_image": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    "author_id": "4a4cb8df-79b3-4c31-832a-a1bbda194881",
    "author_name": "Pixel Isolate",
    "author_avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    "category": "POD Tips",
    "reading_time_minutes": 4,
    "meta_title": "Supercharge Your POD Workflow: MerchSpark AI Meets PixelIsolate.Online | PixelIsolate Blog",
    "meta_description": "The MerchSpark Advantage: Unlocking Print-on-Demand Trends",
    "is_published": true,
    "upvotes_count": 2,
    "comments_count": 0,
    "published_at": "2026-07-28T06:23:22.354+00:00",
    "created_at": "2026-07-28T06:23:22.354+00:00",
    "updated_at": "2026-07-28T06:26:34.899+00:00"
  },
  {
    "id": "post-1785215017857-42ba",
    "slug": "how-to-eliminate-white-halos-on-dark-t-shirts-pod-masterclass-liwfj",
    "title": "How to Eliminate White Halos on Dark T-Shirts (POD Masterclass)",
    "excerpt": "Learn how subpixel green screen chroma keying and neural AI segmentation eliminate white edge halos and color bleeding on black & dark garments.",
    "content": "# How to Eliminate White Halos on Dark T-Shirts\n\nWhen printing custom graphics on dark apparel (black, navy, charcoal t-shirts), nothing ruins a Print-on-Demand (POD) product faster than **ugly white fringe halos** around the subject.\n\nWhether you sell on Printify, Printful, Teespring, or Shopify, background removal tools often leave anti-aliased white border pixels that become stark white rings when printed with white underbase ink.\n\n---\n\n## 1. Why White Halos Happen in Print-on-Demand\n\nStandard background removal engines work by thresholding opacity. When removing a white or light background:\n\n1. **Anti-Aliasing Fringes:** The transition pixels between the subject and the white background contain mixed RGB colors (50% subject color, 50% white backdrop).\n2. **DTG Printing Underbase:** Direct-to-Garment (DTG) printers apply a solid white underbase layer beneath all colored inks to make colors pop on dark shirts.\n3. **Fringe Amplification:** Semi-transparent edge pixels trigger the printer to lay down white underbase ink, producing a visible white outline around text, fur, and intricate line art.\n\n---\n\n## 2. The Solution: Subpixel Isolation & Edge Erosion\n\nTo achieve crisp, retail-quality prints on dark garments:\n\n### A. Apply Morphological Erosion\nBy shrinking the outer alpha mask by **1 to 2 pixels**, you strip away the semi-transparent boundary layer without distorting the core artwork.\n\n### B. Use Neural AI Subpixel Segmentation\nUnlike standard magic-wand tools, **PixelIsolate's AI Magic Engine** calculates exact transparency alpha values down to sub-pixel resolution, completely separating subject edges from the background color.\n\n---\n\n## 3. Step-by-Step Workflow in PixelIsolate\n\n1. **Upload your artwork** into the PixelIsolate editor workspace.\n2. Select **Graphic / Artwork** mode.\n3. Enable **AI Magic** for sub-pixel boundary detection.\n4. Set **Erosion Size** to `1px` if any fringe bleed is present.\n5. Export at **100% Full HD PNG Resolution** with transparency intact.\n\n---\n\n## Conclusion\n\nReady to transform your POD designs? Try [PixelIsolate](https://pixelisolate.online) today with **10 Free HD Credits** — zero credit card required!",
    "cover_image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    "author_id": "4a4cb8df-79b3-4c31-832a-a1bbda194881",
    "author_name": "Pixel Isolate",
    "author_avatar": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    "category": "POD Tips",
    "reading_time_minutes": 2,
    "meta_title": "How to Eliminate White Halos on Dark T-Shirts (POD Masterclass) | PixelIsolate Blog",
    "meta_description": "Learn how subpixel green screen chroma keying and neural AI segmentation eliminate white edge halos and color bleeding on black & dark garments.",
    "is_published": true,
    "upvotes_count": 2,
    "comments_count": 0,
    "published_at": "2026-07-28T05:03:37.857+00:00",
    "created_at": "2026-07-28T05:03:37.857+00:00",
    "updated_at": "2026-07-28T05:03:57.643083+00:00"
  },
  {
    "id": "post-1785212778173-3agm",
    "slug": "how-to-remove-image-backgrounds-in-bulk-without-jagged-edges-2026-guide-45mff",
    "title": "How to Remove Image Backgrounds in Bulk Without Jagged Edges (2026 Guide)",
    "excerpt": "Learn how to eliminate white halos and jagged edges on dark POD designs. Batch process up to 50 image backgrounds at once with clean 4K PNG exports.",
    "content": "# How to Remove Image Backgrounds in Bulk Without Jagged Edges\n\nIf you sell t-shirts on Merch by Amazon, run an Etsy store, or manage a Shopify catalog, you’ve likely faced the frustration of standard AI background removers. You upload a detailed design, click process, and end up with pixelated edges and a faint white \"halo\" around your graphic when placed on a dark shirt.\n\nManually fixing cutouts in Photoshop takes hours—hours you could spend designing or scaling your business.\n\nIn this guide, we’ll break down why standard background removal tools fail on complex graphics, how subpixel edge isolation works, and how to batch-process dozens of images in seconds.\n\n## The Hidden Problem with Standard AI Background Removers\n\nMost standard background removal tools are built for basic product photography—like a shoe or a bottle on a plain white background. They use aggressive edge-thresholding algorithms that cut off pixels sharply.\n\nWhen applied to detailed artwork, fur, hair, or typography, standard tools cause two major problems:\n\n1- **White Halos on Dark Shirts:** Standard AI leaves a 1-to-2 pixel white border around the cutout. On a black or navy t-shirt, this halo makes the print look cheap and unrefined.\n\n2- **Loss of Fine Detail:** Delicate elements like distressing, thin typography, or fine hair tend to get completely erased or blurred into a muddy edge.\n\n## Why Bulk Processing is Essential for E-Commerce\n\nRemoving backgrounds one by one is a huge bottleneck. If you launch a collection of 30 designs across multiple apparel colors, editing individual files drains valuable time.\n\nA modern print-on-demand workflow requires batch processing. Being able to upload 20 to 50 files simultaneously, apply subpixel edge controls, and download high-resolution transparent PNGs keeps your store moving fast.\n\n## Step-by-Step: Clean Background Removal in Seconds\n\nHere is how to get studio-quality cutouts without white halos using [PixelIsolate](https://pixelisolate.online):\n\n**Step 1:** Batch Upload Your Design Assets\nDrag and drop up to 50 PNG, JPG, or WEBP files into the workspace. The tool accepts everything from vector illustrations to complex photographic assets.\n\n**Step 2:** Let Subpixel AI Detect the Edges\nUnlike generic removers, PixelIsolate uses fine subpixel edge feathering. This preserves intricate details like animal fur, semi-transparent gradients, and sharp lettering while eliminating unwanted white borders.\n\n**Step 3:** Choose Your Background Style\nDepending on where you are listing your product, choose the background format:\n\nTransparent PNG: Ideal for POD platforms (Etsy, Redbubble, Amazon Merch).\n\nSolid White (#FFFFFF): Complies with Amazon and eBay main image requirements.\n\nSolid Black or Custom Hex: Lets you preview exactly how the cutout looks against dark apparel before printing.\n\n**Step 4:** Export Full-Resolution 4K Assets\nDownload your isolated images in full resolution with zero loss in quality or forced compression.\n\n## E-Commerce Listing Checklist\n\nBefore publishing your newly isolated images to your online store, run through this quick checklist:\n\n[  ] Transparent Background: Saved as a 24-bit PNG with alpha transparency.\n\n[  ] No Edge Halos: Zoom in at 200% against a dark preview background to verify clean edges.\n\n[  ] Platform Specs: Ensure dimensions meet marketplace requirements (e.g., Merch by Amazon requires 4500 x 5400 px at 300 DPI).\n\n[  ] Solid White Main Image: Ensure the primary image on Amazon or eBay features a pure white background (#FFFFFF) to avoid listing suppression.\n\n## Start Cleaning Up Your Product Catalog\n\nStop wasting time on manual selection tools or settling for pixelated edges on dark t-shirts. Test out your own artwork with 10 Free HD Credits directly at [Pixelisolate](https://PixelIsolate.online) with no credit card required.",
    "cover_image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "author_id": "4a4cb8df-79b3-4c31-832a-a1bbda194881",
    "author_name": "Pixel Isolate",
    "author_avatar": "https://images.unsplash.com/photo-1542744094-3a3121699479?auto=format&fit=crop&w=800&q=80",
    "category": "Tutorials",
    "reading_time_minutes": 4,
    "meta_title": "How to Remove Image Backgrounds in Bulk Without Jagged Edges (2026 Guide) | PixelIsolate Blog",
    "meta_description": "Learn how to eliminate white halos and jagged edges on dark POD designs. Batch process up to 50 image backgrounds at once with clean 4K PNG exports.",
    "is_published": true,
    "upvotes_count": 1,
    "comments_count": 0,
    "published_at": "2026-07-28T04:26:18.173+00:00",
    "created_at": "2026-07-28T04:26:18.173+00:00",
    "updated_at": "2026-07-28T04:30:55.004+00:00"
  }
];

// Helper: LocalStorage Persistence for Community Posts, Comments, & Votes
function getStoredPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem("pixelisolate_community_posts");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveStoredPosts(posts: BlogPost[]) {
  try {
    localStorage.setItem("pixelisolate_community_posts", JSON.stringify(posts));
  } catch (e) {}
}

function getStoredComments(postId: string): BlogComment[] {
  try {
    const raw = localStorage.getItem(`pixelisolate_comments_${postId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // Default sample comments for seed posts
  if (postId === "post-1") {
    return [
      {
        id: "c1",
        post_id: "post-1",
        user_id: "u-dev",
        user_name: "Alex Designer",
        user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop",
        content: "The 1px erosion tip completely saved my dark t-shirt graphics! No more white borders on Printify black hoodies.",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "c2",
        post_id: "post-1",
        user_id: "u-pod",
        user_name: "Sarah POD Pro",
        user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop",
        content: "Awesome guide! The subpixel AI matting handles complex typography gaps so well.",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];
  }
  return [];
}

function saveStoredComments(postId: string, comments: BlogComment[]) {
  try {
    localStorage.setItem(`pixelisolate_comments_${postId}`, JSON.stringify(comments));
  } catch (e) {}
}

function getStoredVotes(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem("pixelisolate_post_votes");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveStoredVotes(votes: Record<string, string[]>) {
  try {
    localStorage.setItem("pixelisolate_post_votes", JSON.stringify(votes));
  } catch (e) {}
}

let postsMemoryCache: BlogPost[] | null = null;

/**
 * Synchronously get cached posts for instant 0ms rendering.
 */
export function getCachedPosts(category?: string, search?: string, includeUnpublished = false): BlogPost[] {
  let basePosts: BlogPost[] = postsMemoryCache || [];

  if (!basePosts || basePosts.length === 0) {
    const allMap = new Map<string, BlogPost>();
    INITIAL_SEED_POSTS.forEach(p => allMap.set(p.id || p.slug, p));
    getStoredPosts().forEach(p => {
      const matchingSeed = INITIAL_SEED_POSTS.find(s => s.id === p.id || s.slug === p.slug);
      const key = matchingSeed ? matchingSeed.id : (p.id || p.slug);
      allMap.set(key, p);
    });
    basePosts = Array.from(allMap.values());
  }

  let posts = [...basePosts];

  if (!includeUnpublished) {
    posts = posts.filter(p => p.is_published);
  }

  if (category && category !== "All") {
    posts = posts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    posts = posts.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q)
    );
  }

  return posts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

/**
 * Fetch all posts (published or all for admin/moderator) with background revalidation.
 */
export async function getPublishedPosts(category?: string, search?: string, includeUnpublished = false): Promise<BlogPost[]> {
  let dbPosts: BlogPost[] = [];
  try {
    let query = supabase
      .from("posts")
      .select("id, slug, title, excerpt, cover_image, author_name, author_avatar, category, reading_time_minutes, is_published, upvotes_count, comments_count, published_at, created_at, updated_at")
      .order("published_at", { ascending: false });

    if (!includeUnpublished) {
      query = query.eq("is_published", true);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      dbPosts = data as BlogPost[];
    } else {
      // Direct REST API Fallback for guest visitors if client SDK fails
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXdpY3did3pqa2lqYW1xcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDUwODgsImV4cCI6MjA5OTc4MTA4OH0.Y34FVIh9iv6tobH238qAszhN6W3waL4Ko2lkjEqsUd4";
      const anonRes = await fetch("https://nyiwicwbwzjkijamqqsl.supabase.co/rest/v1/posts?select=id,slug,title,excerpt,cover_image,author_name,author_avatar,category,reading_time_minutes,is_published,upvotes_count,comments_count,published_at&order=published_at.desc", {
        headers: {
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`
        }
      });
      if (anonRes.ok) {
        const anonData = await anonRes.json();
        if (anonData && anonData.length > 0) {
          dbPosts = anonData;
        }
      }
    }
  } catch (err) {
    console.warn("DB posts query error:", err);
  }

  // Combine DB posts + LocalStorage community posts + Initial seed posts
  const localPosts = getStoredPosts();
  const allMap = new Map<string, BlogPost>();

  // 1. Add initial seed posts (keyed by unique ID)
  INITIAL_SEED_POSTS.forEach(p => {
    allMap.set(p.id || p.slug, p);
  });

  // 2. Add local posts (user created posts + edited seed posts)
  localPosts.forEach(p => {
    const matchingSeed = INITIAL_SEED_POSTS.find(s => s.id === p.id || s.slug === p.slug);
    const key = matchingSeed ? matchingSeed.id : (p.id || p.slug);
    allMap.set(key, p);
  });

  // 3. Add DB posts (takes ultimate precedence)
  dbPosts.forEach(p => {
    const matchingSeed = INITIAL_SEED_POSTS.find(s => s.id === p.id || s.slug === p.slug);
    const key = matchingSeed ? matchingSeed.id : (p.id || p.slug);
    allMap.set(key, p);
  });

  let result = Array.from(allMap.values());

  // Cache in memory for instant tab switches
  postsMemoryCache = result;

  if (!includeUnpublished) {
    result = result.filter(p => p.is_published);
  }

  if (category && category !== "All") {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    result = result.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author_name.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

/**
 * Synchronously retrieve cached post by slug for 0ms instant initial rendering.
 */
export function getCachedPostBySlug(slug: string): BlogPost | null {
  if (!slug) return null;
  const cleanSlug = slug.trim().replace(/^\//, "").replace(/\/$/, "").toLowerCase();

  // 1. Check in-memory RAM cache first
  if (postsMemoryCache) {
    const memMatch = postsMemoryCache.find(
      p => p.slug?.toLowerCase() === cleanSlug || p.id === cleanSlug
    );
    if (memMatch) return memMatch;
  }

  // 2. Check localStorage stored posts
  const localPosts = getStoredPosts();
  const localMatch = localPosts.find(
    p => p.slug?.toLowerCase() === cleanSlug || p.id === cleanSlug
  );
  if (localMatch) return localMatch;

  return null;
}

/**
 * Fetch a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) return null;
  const cleanSlug = slug.trim().replace(/^\//, "").replace(/\/$/, "");

  // 1. Check cached posts first (0ms RAM lookup)
  const cached = getCachedPostBySlug(cleanSlug);
  if (cached) return cached;

  // 2. Try DB query
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", cleanSlug)
      .single();

    if (!error && data) return data as BlogPost;
  } catch (e) {}

  // 3. Fallback check
  const all = await getPublishedPosts("All", "", true);
  return all.find(p => p.slug?.toLowerCase() === cleanSlug.toLowerCase() || p.id === cleanSlug) || null;
}

/**
 * Fetch all published slugs for sitemap.
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts("All", "", false);
  return posts.map(p => p.slug);
}

export async function triggerFacebookAutoScrape(slug: string) {
  try {
    const articleUrl = `https://pixelisolate.online/blog/${slug}`;
    fetch(`https://graph.facebook.com/?id=${encodeURIComponent(articleUrl)}&scrape=true`, {
      method: "POST"
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Create a new Blog Post (by user or admin).
 */
export async function createPost(
  postData: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image?: string;
  },
  user: any,
  profile: any
): Promise<BlogPost> {
  const slug = postData.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-") + `-${Math.random().toString(36).substring(2, 7)}`;

  const readingTime = Math.max(2, Math.ceil((postData.content || "").split(/\s+/).length / 180));
  const authorName = profile?.display_name || (user?.email ? user.email.split("@")[0] : "") || "Community Member";
  const authorAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || authorName}`;
  const userEmail = (user?.email || "").toLowerCase();
  const isAdminOrMod = profile?.role === "admin" || profile?.role === "moderator" || userEmail.includes("elborgy") || userEmail.includes("admin") || userEmail === "rjhustles@gmail.com" || userEmail === "detourdesignllc@gmail.com" || userEmail === "philip@philipanders.com";

  const newPost: BlogPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    slug,
    title: postData.title,
    excerpt: postData.excerpt,
    content: postData.content,
    cover_image: postData.cover_image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    author_id: user?.id,
    author_name: authorName,
    author_avatar: authorAvatar,
    category: postData.category || "Tutorials",
    reading_time_minutes: readingTime,
    meta_title: `${postData.title} | PixelIsolate Blog`,
    meta_description: postData.excerpt,
    is_published: true, // Auto-publish for smooth community sharing
    upvotes_count: 1,
    comments_count: 0,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  // 1. Save locally first so it is available instantly for UI and routing
  const stored = getStoredPosts();
  stored.unshift(newPost);
  saveStoredPosts(stored);

  // 2. Try API insert via backend (upsert as admin)
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });
  } catch (e) {}

  // 3. Try direct DB insert
  try {
    const { data } = await supabase.from("posts").insert(newPost).select().single();
    if (data) {
      newPost.id = data.id;
    }
  } catch (e) {}

  // 4. NOW trigger Facebook Graph API auto-scrape AFTER post exists in DB!
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    fetch(`${apiBase}/api/blog/scrape-fb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newPost.slug })
    }).catch(() => {});
  } catch (e) {}

  return newPost;
}

/**
 * Toggle Upvote on a post.
 */
export async function toggleUpvote(postId: string, userId: string): Promise<{ upvoted: boolean; count: number }> {
  const votes = getStoredVotes();
  const userVotes = votes[postId] || [];
  const hasVoted = userVotes.includes(userId);

  let newCount = 0;
  let newVoted = !hasVoted;

  if (hasVoted) {
    votes[postId] = userVotes.filter(id => id !== userId);
  } else {
    votes[postId] = [...userVotes, userId];
  }
  saveStoredVotes(votes);

  // Update post upvote count
  const allPosts = await getPublishedPosts("All", "", true);
  const target = allPosts.find(p => p.id === postId || p.slug === postId);
  if (target) {
    target.upvotes_count = Math.max(0, target.upvotes_count + (newVoted ? 1 : -1));
    newCount = target.upvotes_count;

    const stored = getStoredPosts();
    const idx = stored.findIndex(p => p.id === target.id || p.slug === target.slug);
    if (idx !== -1) {
      stored[idx].upvotes_count = newCount;
      saveStoredPosts(stored);
    }

    try {
      await supabase.from("posts").update({ upvotes_count: newCount }).eq("id", target.id);
    } catch (e) {}
  }

  return { upvoted: newVoted, count: newCount };
}

/**
 * Check if user upvoted post.
 */
export function hasUserUpvoted(postId: string, userId: string): boolean {
  if (!userId) return false;
  const votes = getStoredVotes();
  const userVotes = votes[postId] || [];
  return userVotes.includes(userId);
}

/**
 * Get comments for a post.
 */
export async function getPostComments(postId: string): Promise<BlogComment[]> {
  try {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) return data as BlogComment[];
  } catch (e) {}

  return getStoredComments(postId);
}

/**
 * Add comment to a post.
 */
export async function addComment(
  postId: string,
  user: any,
  profile: any,
  content: string
): Promise<BlogComment> {
  const authorName = profile?.display_name || (user?.email ? user.email.split("@")[0] : "") || "Community Member";
  const authorAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || authorName}`;

  const comment: BlogComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    post_id: postId,
    user_id: user.id,
    user_name: authorName,
    user_avatar: authorAvatar,
    content: content.trim(),
    created_at: new Date().toISOString()
  };

  try {
    await supabase.from("post_comments").insert(comment);
  } catch (e) {}

  const current = getStoredComments(postId);
  current.push(comment);
  saveStoredComments(postId, current);

  // Update comments count on post
  const allPosts = await getPublishedPosts("All", "", true);
  const target = allPosts.find(p => p.id === postId || p.slug === postId);
  if (target) {
    target.comments_count = (target.comments_count || 0) + 1;
    const stored = getStoredPosts();
    const idx = stored.findIndex(p => p.id === target.id || p.slug === target.slug);
    if (idx !== -1) {
      stored[idx].comments_count = target.comments_count;
      saveStoredPosts(stored);
    }
  }

  return comment;
}

/**
 * Delete a comment (by author or admin/moderator).
 */
export async function deleteComment(commentId: string, postId: string): Promise<void> {
  try {
    await supabase.from("post_comments").delete().eq("id", commentId);
  } catch (e) {}

  const current = getStoredComments(postId);
  const filtered = current.filter(c => c.id !== commentId);
  saveStoredComments(postId, filtered);
}

/**
 * Update an existing Blog Post (by author or admin/moderator).
 */
export async function updatePost(
  postId: string,
  postData: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image?: string;
  }
): Promise<BlogPost | null> {
  const readingTime = Math.max(2, Math.ceil((postData?.content || "").split(/\s+/).length / 180));
  const updatedFields = {
    title: postData.title,
    excerpt: postData.excerpt,
    content: postData.content,
    category: postData.category,
    cover_image: postData.cover_image,
    reading_time_minutes: readingTime,
    updated_at: new Date().toISOString()
  };

  let updatedPostResult: BlogPost | null = null;

  // 1. Try DB update
  try {
    const { data } = await supabase
      .from("posts")
      .update(updatedFields)
      .eq("id", postId)
      .select()
      .single();
    if (data) {
      updatedPostResult = data as BlogPost;
    }
  } catch (e) {}

  // 2. Mutate in-memory seed post if editing a seed post
  const seedItem = INITIAL_SEED_POSTS.find(p => p.id === postId || p.slug === postId);
  if (seedItem) {
    Object.assign(seedItem, updatedFields);
    updatedPostResult = seedItem;
  }

  // 3. Persistent Local Storage Update (Ensures edited seed posts persist across page refreshes!)
  const stored = getStoredPosts();
  const idx = stored.findIndex(p => p.id === postId || p.slug === postId || (seedItem && p.id === seedItem.id));

  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...updatedFields };
    updatedPostResult = stored[idx];
  } else if (seedItem) {
    stored.unshift({ ...seedItem });
    updatedPostResult = seedItem;
  }

  // 4. Try backend API update
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts/${encodeURIComponent(postId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields)
    });
  } catch (e) {}

  if (updatedPostResult) {
    triggerFacebookAutoScrape(updatedPostResult.slug);
  }

  return updatedPostResult;
}

/**
 * Toggle post publish status (Admin/Moderator).
 */
export async function togglePostPublishStatus(postId: string, isPublished: boolean): Promise<void> {
  const stored = getStoredPosts();
  const target = stored.find(p => p.id === postId || p.slug === postId);
  if (target) {
    target.is_published = isPublished;
    saveStoredPosts(stored);
  }

  try {
    await supabase.from("posts").update({ is_published: isPublished }).eq("id", postId);
  } catch (e) {}
}

/**
 * Delete post (Admin/Moderator).
 */
export async function deletePost(postId: string): Promise<void> {
  const stored = getStoredPosts();
  const filtered = stored.filter(p => p.id !== postId && p.slug !== postId);
  saveStoredPosts(filtered);

  try {
    const apiBase = (import.meta.env.VITE_API_URL || "").trim();
    await fetch(`${apiBase}/api/blog/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE"
    });
  } catch (e) {}

  try {
    await supabase.from("posts").delete().eq("id", postId);
    await supabase.from("posts").delete().eq("slug", postId);
  } catch (e) {}
}
