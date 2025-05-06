import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Check, ArrowRight, ShoppingCart } from 'lucide-react';

interface StandardTemplateProps {
  product: {
    title: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    features: string[];
    slug: string;
  };
}

export function StandardTemplate({ product }: StandardTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-12 md:gap-16 md:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{product.title}</h1>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              </div>

              {product.features.length > 0 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-semibold">Key Features</h2>
                  <ul className="space-y-4">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {product.image_url ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl duration-300">
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-2xl bg-gray-100 flex items-center justify-center shadow-lg">
                  <span className="text-gray-400 text-lg">No image available</span>
                </div>
              )}
              
              <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold text-primary">
                    {formatCurrency(product.price, product.currency)}
                  </span>
                  <span className="text-sm text-gray-500">One-time purchase</span>
                </div>
                
                <div className="space-y-4">
                  <Link
                    href={`/p/${product.slug}/order`}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                    tabIndex={0}
                    aria-label={`Buy ${product.title} now for ${formatCurrency(product.price, product.currency)}`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Buy Now
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  
                  <p className="text-center text-sm text-gray-500">
                    Secure checkout • Instant delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 