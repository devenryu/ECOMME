import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Check, Star, ArrowRight, ShoppingCart, Shield } from 'lucide-react';

interface PremiumTemplateProps {
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

export function PremiumTemplate({ product }: PremiumTemplateProps) {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-black text-white">
        <div className="absolute inset-0 z-0 opacity-80">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt=""
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-primary/30 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium">
              <Star className="h-4 w-4 mr-2 text-amber-400" />
              Premium Product
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              {product.title}
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              {product.description}
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
              <Link
                href={`/p/${product.slug}/order`}
                className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-medium text-gray-900 transition-all hover:bg-gray-100 hover:shadow-glow-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 group"
                tabIndex={0}
                aria-label={`Buy ${product.title} now for ${formatCurrency(product.price, product.currency)}`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Buy Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <div className="text-2xl font-bold text-white flex items-center">
                {formatCurrency(product.price, product.currency)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Premium Experience</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need, crafted with attention to detail.
            </p>
          </div>

          {product.features.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {product.features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:translate-y-[-4px]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-lg font-medium">{feature}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-6 w-6 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xl md:text-2xl font-medium text-gray-700 italic">
                "This premium product exceeded all my expectations. The quality is outstanding."
              </p>
              <div>
                <p className="font-semibold">Satisfied Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold">Ready to Experience Premium?</h2>
            <p className="text-gray-300 text-lg">
              Join our exclusive community of satisfied customers today.
            </p>
            
            <Link
              href={`/p/${product.slug}/order`}
              className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-medium text-gray-900 transition-all hover:bg-gray-100 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              tabIndex={0}
              aria-label={`Buy ${product.title} now for ${formatCurrency(product.price, product.currency)}`}
            >
              <Shield className="h-5 w-5 mr-2" />
              Secure Checkout - {formatCurrency(product.price, product.currency)}
            </Link>
            
            <p className="text-sm text-gray-400">
              30-day money-back guarantee • Secure payment • Instant access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 