import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface MinimalTemplateProps {
  product: {
    title: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    slug: string;
  };
}

export function MinimalTemplate({ product }: MinimalTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {product.image_url ? (
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] duration-300">
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-lg">No image available</span>
              </div>
            )}
            <div className="space-y-8">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.title}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
              </div>
              
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(product.price, product.currency)}
              </div>
              
              <Link
                href={`/p/${product.slug}/order`}
                className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group w-full sm:w-auto"
                tabIndex={0}
                aria-label={`Buy ${product.title} now for ${formatCurrency(product.price, product.currency)}`}
              >
                Buy Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 