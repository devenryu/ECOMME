'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Check, ArrowRight, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StandardTemplateProps {
  product: {
    title: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    features: string[];
    slug: string;
    quantity: number;
    min_order_quantity: number;
    max_order_quantity?: number | null;
  };
}

export function StandardTemplate({ product }: StandardTemplateProps) {
  const [orderQuantity, setOrderQuantity] = useState<number>(product.min_order_quantity || 1);
  const [productQuantity, setProductQuantity] = useState<number>(product.quantity || 0);

  // Update product quantity and order quantity when product data changes
  useEffect(() => {
    setProductQuantity(product.quantity || 0);
    setOrderQuantity(product.min_order_quantity || 1);
  }, [product]);

  const handleQuantityChange = (newQuantity: number) => {
    // Ensure quantity is within bounds
    const boundedQuantity = Math.max(
      product.min_order_quantity || 1,
      Math.min(
        newQuantity,
        product.max_order_quantity ?? Infinity,
        productQuantity
      )
    );
    setOrderQuantity(boundedQuantity);
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      handleQuantityChange(value);
    }
  };

  // Calculate if we can add more to cart
  const canIncrease = orderQuantity < (product.max_order_quantity ?? productQuantity);
  const canDecrease = orderQuantity > (product.min_order_quantity || 1);
  const isOutOfStock = productQuantity <= 0;

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
                    {formatCurrency(product.price * orderQuantity, product.currency)}
                  </span>
                  {orderQuantity > 1 && (
                    <span className="text-sm text-gray-500">
                      ({formatCurrency(product.price, product.currency)} each)
                    </span>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Quantity Selector */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Quantity</h3>
                      {!isOutOfStock && productQuantity < 10 && (
                        <span className="text-sm text-red-500">
                          Only {productQuantity} left in stock
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="text-sm text-red-500 font-medium">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg w-32">
                      <button 
                        className={cn(
                          "w-10 h-10 flex items-center justify-center text-lg border-r border-gray-200 transition-colors",
                          canDecrease && !isOutOfStock 
                            ? "hover:bg-primary/10 text-primary" 
                            : "text-gray-300 cursor-not-allowed"
                        )}
                        aria-label="Decrease quantity"
                        onClick={() => canDecrease && !isOutOfStock && handleQuantityChange(orderQuantity - 1)}
                        disabled={!canDecrease || isOutOfStock}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min={product.min_order_quantity || 1}
                        max={product.max_order_quantity ?? productQuantity}
                        value={orderQuantity}
                        onChange={handleQuantityInput}
                        disabled={isOutOfStock}
                        className={cn(
                          "w-12 h-10 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          isOutOfStock && "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Quantity"
                      />
                      <button 
                        className={cn(
                          "w-10 h-10 flex items-center justify-center text-lg border-l border-gray-200 transition-colors",
                          canIncrease && !isOutOfStock
                            ? "hover:bg-primary/10 text-primary" 
                            : "text-gray-300 cursor-not-allowed"
                        )}
                        aria-label="Increase quantity"
                        onClick={() => canIncrease && !isOutOfStock && handleQuantityChange(orderQuantity + 1)}
                        disabled={!canIncrease || isOutOfStock}
                      >
                        +
                      </button>
                    </div>
                    {!isOutOfStock && product.min_order_quantity > 1 && (
                      <p className="text-sm text-gray-500">
                        Minimum order: {product.min_order_quantity} items
                      </p>
                    )}
                    {!isOutOfStock && product.max_order_quantity && (
                      <p className="text-sm text-gray-500">
                        Maximum order: {product.max_order_quantity} items
                      </p>
                    )}
                  </div>

                  <Link
                    href={!isOutOfStock ? `/p/${product.slug}/order?quantity=${orderQuantity}` : '#'}
                    className={cn(
                      "flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group",
                      !isOutOfStock
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                    tabIndex={isOutOfStock ? -1 : 0}
                    aria-label={!isOutOfStock ? `Buy ${product.title} now for ${formatCurrency(product.price * orderQuantity, product.currency)}` : 'Out of stock'}
                    onClick={(e) => {
                      if (isOutOfStock) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {!isOutOfStock ? (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Buy Now
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    ) : (
                      "Out of Stock"
                    )}
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