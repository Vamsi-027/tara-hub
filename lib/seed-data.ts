import type {
  DBPost,
  DBHeroCategory,
  DBLaunchItem,
  DBPromoItem,
  DBChannelStrategy,
  DBSEOKeyword,
  DBBlogPost,
  DBCreativeGuideline,
} from "./db-schema"

export const seedPosts: Omit<DBPost, "id" | "createdAt" | "updatedAt">[] = [
  {
    date: "2025-08-01",
    status: "Published",
    theme: "End of Summer",
    goal: "Engagement",
    idea: "A perfect cozy corner to read in on a quiet summer evening. What are you reading?",
    type: "Static Photo",
    copy: "That Friday feeling. ✨ Time to unwind and soak in these last moments of summer.",
    keywords: "cozy reading nook, summer evening, homebody life",
    hashtags: "#cozyhome #summernights #readingnook #currentread #weekendvibes",
    channels: ["IG", "FB", "Pin"],
    cta: "Ask a question",
    kpi: "Engagement Rate",
    notes: "High-quality photo of a styled armchair with a book and mug.",
    boost: false,
  },
  {
    date: "2025-08-04",
    status: "Published",
    theme: "The Transition",
    goal: "Announce",
    idea: '**LAUNCH DAY!** Announcing "The Study Sanctuary" collection for dorms & small offices.',
    type: "Carousel",
    copy: "Introducing The Study Sanctuary! Curated pieces to make your small space stylish and functional.",
    keywords: "dorm decor, home office, small space solutions",
    hashtags: "#newarrivals #dormdecor #backtoschool #homeoffice #smallspaceliving",
    channels: ["All"],
    cta: "Shop the new collection!",
    kpi: "CTR, Collection Views",
    notes: "Needs polished product shots & one lifestyle image.",
    boost: false,
    event: "launch",
  },
  {
    date: "2025-08-05",
    status: "Published",
    theme: "The Transition",
    goal: "Education",
    idea: "3 ways to make a tiny dorm room feel bigger and cozier.",
    type: "Reel",
    copy: "From drab to fab! Watch how we transform this small corner into a cozy study haven.",
    keywords: "dorm room ideas, small space hacks, college apartment",
    hashtags: "#dormroom #collegehacks #smallspacehacks #roomtransformation #cozystudy",
    channels: ["IG", "Pin"],
    cta: "Shop the Dorm Edit.",
    kpi: "Saves, Shares, CTR",
    notes: "Fast-paced, before-and-after style.",
    boost: true,
  },
  {
    date: "2025-08-16",
    status: "Published",
    theme: "Sanctuary",
    goal: "Promotion",
    idea: "**SALE LIVE!** Reel showing various throws and pillows in different settings.",
    type: "Reel",
    copy: "Your weekend project: get cozy! Our textile sale is ON. Grab your favorites for 15% off.",
    keywords: "home textiles, pillow covers, throw blankets",
    hashtags: "#hometextiles #sale #cozyathome #livingroommakeover",
    channels: ["IG", "Pin"],
    cta: "Shop the sale! Link in bio.",
    kpi: "Revenue, CTR",
    notes: "Use upbeat music. Show quick, satisfying shots.",
    boost: true,
    event: "sale",
  },
  {
    date: "2025-08-18",
    status: "Scheduled",
    theme: "Gathering",
    goal: "Announce",
    idea: '**LAUNCH DAY!** Introducing the "Harvest Moon" candle collection.',
    type: "Carousel",
    copy: "It's here. ✨ Welcome the first hints of autumn with our new Harvest Moon candle collection.",
    keywords: "new candles, fall candles, scented candles",
    hashtags: "#newproduct #fallcandles #soycandles #candlelover #harvestmoon",
    channels: ["All"],
    cta: "Discover your new scent.",
    kpi: "Revenue, CTR",
    notes: "Aesthetic shots of candles, maybe with a flame flicker effect.",
    boost: false,
    event: "launch",
  },
  {
    date: "2025-08-28",
    status: "Scheduled",
    theme: "Labor Day",
    goal: "Promotion",
    idea: "**SALE IS LIVE!** 15% off sitewide for everyone.",
    type: "Reel",
    copy: "The sale you've been waiting for! Our Labor Day Sale is officially LIVE. 15% off sitewide!",
    keywords: "labor day sale, home decor sale, sitewide sale",
    hashtags: "#laborday #sale #homedecorsale #longweekendsale",
    channels: ["All"],
    cta: "Shop Now! Link in bio.",
    kpi: "Revenue, Conversion Rate",
    notes: "High-energy Reel showcasing a variety of products.",
    boost: true,
    event: "sale",
  },
]

export const seedHeroCategories: Omit<DBHeroCategory, "id" | "createdAt" | "updatedAt">[] = [
  { text: "Dorm & Small Space Solutions: Desk accessories, cozy lighting, decorative storage.", order: 1 },
  { text: "Early Fall / Transitional Decor: Chunky knit throws, earth-toned pillows, new candles.", order: 2 },
  { text: "Kitchen & Hosting Essentials: Serving boards, ceramic mugs, linen napkins.", order: 3 },
]

export const seedLaunchItems: Omit<DBLaunchItem, "id" | "createdAt" | "updatedAt">[] = [
  {
    date: "AUG 04",
    title: '"The Study Sanctuary" Collection',
    description: "Focus on dorm and home office decor.",
    order: 1,
  },
  {
    date: "AUG 18",
    title: '"Harvest Moon" Candle Collection',
    description: "Debut new signature fall scents.",
    order: 2,
  },
]

export const seedPromoItems: Omit<DBPromoItem, "id" | "createdAt" | "updatedAt">[] = [
  {
    title: "Back to School Bundle",
    dates: "Aug 5-18",
    details: "Buy a lamp, get 20% off a storage basket.",
    order: 1,
  },
  { title: "Weekend Flash Sale", dates: "Aug 16-17", details: "15% off all textiles.", order: 2 },
  { title: "Labor Day Sale", dates: "Aug 28-Sep 2", details: "20% off for subscribers, 15% for public.", order: 3 },
]

export const seedChannelStrategies: Omit<DBChannelStrategy, "id" | "createdAt" | "updatedAt">[] = [
  {
    platform: "Instagram",
    points: [
      "Reels (3-4x/week): Focus on quick transformations, styling tips ('3 Ways To...'), and behind-the-scenes content.",
      "Carousels (2x/week): Educational content and product spotlights.",
      "Stories (Daily): Interactive polls, Q&As, link stickers, UGC, and countdowns.",
    ],
    order: 1,
  },
  {
    platform: "Pinterest",
    points: [
      "Idea Pins (3x/week): Repurpose Reels into step-by-step guides. Focus on 'How-To' and 'Inspiration'.",
      "Static Pins (5-7x/day): Pin all products and blog posts with keyword-rich descriptions.",
      "Boards: Create 'Cozy Dorm Room Ideas 2025,' 'Early Autumn Decor,' and 'Labor Day Hosting.'",
    ],
    order: 2,
  },
  {
    platform: "Facebook",
    points: [
      "Community Building (3-4x/week): Post conversation-starting questions, lifestyle photo albums, and share blog posts.",
      "Events: Create a Facebook Event for the Labor Day Sale.",
      "Live (1x/month): Host a live Q&A or styling session.",
    ],
    order: 3,
  },
]

export const seedSEOKeywords: Omit<DBSEOKeyword, "id" | "createdAt" | "updatedAt">[] = [
  { text: "transitional home decor", type: "primary" },
  { text: "early fall decorating ideas", type: "primary" },
  { text: "cozy dorm room", type: "primary" },
  { text: "how to style a bookshelf for fall", type: "longTail" },
  { text: "best scented candles for autumn", type: "longTail" },
  { text: "labor day tablescape ideas", type: "longTail" },
]

export const seedBlogPosts: Omit<DBBlogPost, "id" | "createdAt" | "updatedAt">[] = [
  { date: "Aug 6", title: "Beyond the Basics: 5 Dorm Decor Ideas for a Stylish & Functional Space", published: true },
  {
    date: "Aug 20",
    title: "The Transition: How to Welcome Autumn into Your Home (Without a Pumpkin in Sight)",
    published: false,
  },
]

export const seedCreativeGuidelines: Omit<DBCreativeGuideline, "id" | "createdAt" | "updatedAt">[] = [
  { text: "Brand Voice: Welcoming, Warm, Curated Comfort.", order: 1 },
  {
    text: "Visuals: Warm, soft lighting. Emphasize texture (wood grain, woven fabrics). Lifestyle shots should feel lived-in and authentic.",
    order: 2,
  },
  { text: "Messaging: Use inviting and evocative language. Focus on the *feeling* the products create.", order: 3 },
  { text: "Alt Text: All images must have descriptive alt text for accessibility and SEO.", order: 4 },
]
