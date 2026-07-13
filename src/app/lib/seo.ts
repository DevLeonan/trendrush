export function getProductSchema(product: { title: string; description: string; price: number; slug: string; imageUrl: string }) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": [product.imageUrl],
    "description": product.description,
    "sku": product.slug,
    "offers": {
      "@type": "Offer",
      "url": `https://trendrush.com/product/${product.slug}`,
      "priceCurrency": "BRL",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "TrendRush"
      }
    }
  };
}