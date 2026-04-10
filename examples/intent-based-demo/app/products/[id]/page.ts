/**
 * app/products/[id]/page.ts → Route: /products/:id
 * 
 * E-ticaret ürün sayfası - Rich SEO + Structured Data
 */

import { definePage, html, generateJsonLd, memoAsync } from "@fiyuu/core";
import { z } from "zod";

// DB call - memoized
const getProduct = memoAsync(
  async (id: string) => ({
    id,
    name: "Fiyuu Pro",
    price: 99.99,
    currency: "USD",
    description: "AI-native fullstack framework license",
    image: "https://fiyuu.work/og-image.png",
    availability: "InStock",
    brand: "Fiyuu",
    sku: "FIYUU-PRO-001",
    rating: 4.8,
    reviewCount: 128,
  }),
  { ttl: 300, tags: ["products"] }
);

export default definePage({
  input: {
    params: z.object({ id: z.string() }),
  },
  
  load: ({ params }) => getProduct(params.id),
  
  render: ({ data: product }) => html`
    <div class="product" itemscope itemtype="https://schema.org/Product">
      <img src="${product.image}" alt="${product.name}" itemprop="image" />
      <h1 itemprop="name">${product.name}</h1>
      <p itemprop="description">${product.description}</p>
      <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <span itemprop="price" content="${product.price}">${product.price}</span>
        <span itemprop="priceCurrency" content="${product.currency}">${product.currency}</span>
        <link itemprop="availability" href="https://schema.org/${product.availability}" />
      </div>
      <div class="rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
        <span itemprop="ratingValue">${product.rating}</span>/5
        (<span itemprop="reviewCount">${product.reviewCount}</span> reviews)
      </div>
    </div>
  `,
  
  seo: {
    meta: (product) => ({
      title: `${product.name} - ${product.price} ${product.currency}`,
      description: product.description,
      ogImage: product.image,
      og: {
        type: "product",
      },
      // Product structured data - JSON-LD
      jsonLd: generateJsonLd("Product", {
        name: product.name,
        image: product.image,
        description: product.description,
        sku: product.sku,
        brand: {
          "@type": "Brand",
          name: product.brand,
        },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.currency,
          availability: `https://schema.org/${product.availability}`,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        },
      }),
    }),
    
    sitemap: {
      priority: 0.9,
      changefreq: "daily",
    },
  },
  
  cache: {
    revalidate: 60, // 1 dakika - fiyat değişebilir
    tags: ["products", `product:${product => product.id}`],
  },
});
