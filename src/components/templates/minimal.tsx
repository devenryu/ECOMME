'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCw, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Color {
  id?: string;
  name: string;
  hex_code: string;
  custom?: boolean;
}

interface MinimalTemplateProps {
  product: {
    title: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    slug: string;
    sizes?: string[];
    colors?: Color[];
    images?: string[];
    quantity: number;
    min_order_quantity: number;
    max_order_quantity?: number | null;
  };
}

export function MinimalTemplate({ product }: MinimalTemplateProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string | undefined>(
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image_url
  );
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
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:gap-12 md:grid-cols-2 items-start">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              {mainImage ? (
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-md transition-transform hover:scale-[1.02] duration-300 bg-white">
                  <Image
                    src={mainImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="relative aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No image available</span>
                </div>
              )}
              {/* Thumbnails */}
              {Array.isArray(product.images) && product.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={img}
                      className={`relative aspect-square rounded-md overflow-hidden bg-white border border-border cursor-pointer transition-colors ${mainImage === img ? 'border-primary ring-2 ring-primary' : 'hover:border-primary'}`}
                      aria-label={`Show image ${i + 1}`}
                      tabIndex={0}
                      onClick={() => setMainImage(img)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setMainImage(img);
                      }}
                      aria-pressed={mainImage === img}
                    >
                      <Image
                        src={img}
                        alt={`${product.title} view ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{product.title}</h1>
                <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{product.description}</p>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(product.price, product.currency)}
                  </span>
                  <span className="ml-3 text-sm line-through text-muted-foreground">
                    {formatCurrency(product.price * 1.2, product.currency)}
                  </span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Save 20%
                  </span>
                </div>
              </div>
              
              {/* Color options */}
              {Array.isArray(product.colors) && product.colors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Color</h3>
                  <div className="flex space-x-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.id || `color-${color.hex_code}`}
                        className={`w-8 h-8 rounded-full border-2 border-white ring-1 ring-border focus:outline-none focus:ring-primary transition-colors ${selectedColor === (color.id || `color-${color.hex_code}`) ? 'ring-2 ring-primary' : 'hover:ring-primary'}`}
                        style={{ backgroundColor: color.hex_code }}
                        aria-label={`Select color ${color.name}`}
                        title={color.name}
                        tabIndex={0}
                        onClick={() => setSelectedColor(color.id || `color-${color.hex_code}`)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedColor(color.id || `color-${color.hex_code}`);
                        }}
                        aria-pressed={selectedColor === (color.id || `color-${color.hex_code}`)}
                      >
                        <span className="sr-only">{color.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedColor && (
                    <div className="text-sm text-gray-600">
                      Selected: {product.colors.find(c => (c.id || `color-${c.hex_code}`) === selectedColor)?.name || 'Color'}
                    </div>
                  )}
                </div>
              )}
              
              {/* Size options */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Size</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        className={`py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-colors ${selectedSize === size ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}
                        aria-label={`Select size ${size}`}
                        tabIndex={0}
                        onClick={() => setSelectedSize(size)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedSize(size);
                        }}
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity */}
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
                <div className="flex items-center border border-border rounded-md w-32">
                  <button 
                    className={cn(
                      "w-10 h-10 flex items-center justify-center text-lg border-r border-border transition-colors",
                      canDecrease && !isOutOfStock
                        ? "hover:bg-primary/10 text-primary" 
                        : "text-muted-foreground cursor-not-allowed"
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
                      "w-10 h-10 flex items-center justify-center text-lg border-l border-border transition-colors",
                      canIncrease && !isOutOfStock
                        ? "hover:bg-primary/10 text-primary" 
                        : "text-muted-foreground cursor-not-allowed"
                    )}
                    aria-label="Increase quantity"
                    onClick={() => canIncrease && !isOutOfStock && handleQuantityChange(orderQuantity + 1)}
                    disabled={!canIncrease || isOutOfStock}
                  >
                    +
                  </button>
                </div>
                {!isOutOfStock && product.min_order_quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Minimum order: {product.min_order_quantity} items
                  </p>
                )}
                {!isOutOfStock && product.max_order_quantity && (
                  <p className="text-sm text-muted-foreground">
                    Maximum order: {product.max_order_quantity} items
                  </p>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={!isOutOfStock ? `/p/${product.slug}/order?quantity=${orderQuantity}${selectedSize ? `&size=${selectedSize}` : ''}${selectedColor ? `&color=${selectedColor}` : ''}` : '#'}
                  className={cn(
                    "inline-flex h-12 items-center justify-center rounded-full px-8 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group flex-1",
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
                      Buy Now ({formatCurrency(product.price * orderQuantity, product.currency)})
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    "Out of Stock"
                  )}
                </Link>
              </div>
            </div>
          </div>
          
          {/* Product details tabs - would be expanded in a real implementation */}
          <div className="mt-16 border-t border-border pt-8">
            <div className="flex border-b border-border">
              <button className="px-6 py-3 font-medium text-primary border-b-2 border-primary">Description</button>
            </div>
            <div className="py-6">
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}