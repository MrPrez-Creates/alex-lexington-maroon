/**
 * generate-marketing-html.js
 *
 * Post-build script that creates per-route HTML files for marketing pages.
 * Each file has correct <title>, <meta>, canonical, OG tags, and structured data
 * so Google can crawl them without executing JavaScript.
 *
 * The SPA hydrates on top for actual users — this just gives crawlers real HTML.
 *
 * Usage: node scripts/generate-marketing-html.js
 * Runs automatically after `vite build` via package.json build script.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const BASE_URL = 'https://maroon.alexlexington.com';

// Marketing pages with their SEO metadata
const MARKETING_PAGES = [
  {
    path: '/about',
    title: 'About Alex Lexington | 4th-Generation Precious Metals & Fine Jewelry | Atlanta',
    description: 'Alex Lexington is a 4th-generation precious metals dealer and fine jeweler in Atlanta, Georgia. Specializing in gold, silver, platinum coins and bullion, custom jewelry, and expert assay services since 1976.',
  },
  {
    path: '/how-it-works',
    title: 'How It Works | Buy & Sell Gold, Silver, Precious Metals | Alex Lexington',
    description: 'Learn how to buy and sell precious metals with Alex Lexington. Simple process: browse our catalog, get a live quote, choose your payment method, and receive your metals. Competitive wholesale pricing.',
  },
  {
    path: '/services/invest',
    title: 'Invest in Gold, Silver & Platinum | Coins & Bullion | Alex Lexington Atlanta',
    description: 'Invest in physical gold, silver, platinum, and palladium coins and bullion. American Eagles, Maple Leafs, Krugerrands, PAMP bars, and more at wholesale-based pricing from Atlanta dealer since 1976.',
  },
  {
    path: '/services/indulge',
    title: 'Fine Jewelry & Custom Design | Engagement Rings | Alex Lexington Atlanta',
    description: 'Custom engagement rings, wedding bands, and fine jewelry from Alex Lexington in Atlanta. GIA-certified diamonds, expert craftsmanship, and personalized design consultations.',
  },
  {
    path: '/services/secure',
    title: 'Precious Metals Services | Alex Lexington Atlanta',
    description: 'Comprehensive precious metals services from Alex Lexington in Atlanta, Georgia. Expert assay testing, authentication, and personalized wealth preservation guidance since 1976.',
  },
  {
    path: '/pricing',
    title: 'Pricing | Gold & Silver Spot-Based Pricing | Alex Lexington Atlanta',
    description: 'Transparent, competitive pricing based on live precious metals spot rates. No hidden fees. Gold margins 3-3.5%, silver 6-10%. See our pricing tiers and services.',
  },
  {
    path: '/contact',
    title: 'Contact Alex Lexington | Atlanta Precious Metals Dealer | 404.815.8893',
    description: 'Contact Alex Lexington at 3335 Chamblee Dunwoody Rd, Chamblee, GA 30341. Call 404.815.8893. Open Monday-Friday 10am-4pm. Schedule a consultation today.',
  },
];

// LocalBusiness structured data (same as Shopify homepage)
const LOCAL_BUSINESS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": ["JewelryStore", "LocalBusiness"],
  "name": "Alex Lexington",
  "description": "4th-generation precious metals dealer and fine jeweler in Atlanta, Georgia since 1976.",
  "url": "https://alexlexington.com",
  "telephone": "+14048158893",
  "email": "info@alexlexington.com",
  "foundingDate": "1976",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "3335 Chamblee Dunwoody Rd",
    "addressLocality": "Chamblee",
    "addressRegion": "GA",
    "postalCode": "30341",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.8884,
    "longitude": -84.3005
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "10:00",
    "closes": "16:00"
  }],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "52",
    "bestRating": "5"
  },
  "sameAs": [
    "https://www.bbb.org/us/ga/atlanta/profile/precious-metal-dealers/alex-lexington-0443-27303634",
    "https://www.yelp.com/biz/alex-lexington-atlanta-3",
    "https://www.instagram.com/alexlexingtoncom/",
    "https://www.facebook.com/alexlexington"
  ]
});

function generateHTML(baseHTML, page) {
  let html = baseHTML;

  // Replace <title> tag
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${page.title}</title>`
  );

  // Replace or add meta description
  if (html.includes('<meta name="description"')) {
    html = html.replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${page.description}"`
    );
  } else {
    html = html.replace(
      '</title>',
      `</title>\n    <meta name="description" content="${page.description}">`
    );
  }

  // Replace or add canonical
  const canonicalUrl = `${BASE_URL}${page.path}`;
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${canonicalUrl}"`
    );
  } else {
    html = html.replace(
      '</title>',
      `</title>\n    <link rel="canonical" href="${canonicalUrl}">`
    );
  }

  // Replace OG tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${page.title}"`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${page.description}"`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${canonicalUrl}"`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${page.title}"`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${page.description}"`
  );

  // Add page-specific structured data before </head>
  const pageJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": page.title,
    "description": page.description,
    "url": canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Maroon by Alex Lexington",
      "url": BASE_URL
    }
  });

  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">${LOCAL_BUSINESS_JSON_LD}</script>\n    <script type="application/ld+json">${pageJsonLd}</script>\n  </head>`
  );

  return html;
}

function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const baseHTML = fs.readFileSync(indexPath, 'utf-8');
  let created = 0;

  for (const page of MARKETING_PAGES) {
    const dirPath = path.join(DIST_DIR, ...page.path.split('/').filter(Boolean));
    const filePath = path.join(dirPath, 'index.html');

    // Create directory
    fs.mkdirSync(dirPath, { recursive: true });

    // Generate and write HTML
    const html = generateHTML(baseHTML, page);
    fs.writeFileSync(filePath, html, 'utf-8');
    created++;
    console.log(`  ✅ ${page.path} → dist${page.path}/index.html`);
  }

  console.log(`\nGenerated ${created} marketing HTML files for SEO.`);
}

main();
