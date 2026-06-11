import Link from 'next/link';

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]
    ? `http://localhost:8000${product.images[0]}`
    : 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';

  return (
    <Link href={`/products/${product.slug}`} className="group rounded-xl bg-white p-3 shadow-sm border hover:shadow-md transition">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
        <img src={img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </div>
      <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{product.title}</h4>
      <div className="flex items-center gap-1">
        {product.salePrice ? (
          <>
            <span className="text-lg font-bold text-red-500">{product.salePrice.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString()}</span>
          </>
        ) : (
          <span className="text-lg font-bold text-gray-800">{product.price.toLocaleString()}</span>
        )}
        <span className="text-xs text-gray-400 mr-1">ریال</span>
      </div>
    </Link>
  );
}
