'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { orderSchema, type OrderFormData } from '@/lib/validations/order';
import { cn, formatCurrency } from '@/lib/utils';

interface OrderFormProps {
  productId: string;
  productSlug: string;
  initialQuantity: number;
  initialSize?: string;
  initialColor?: string;
  product: {
    min_order_quantity: number;
    max_order_quantity?: number | null;
    quantity: number;
    sizes?: string[];
    colors?: Array<{
      id: string;
      name: string;
      hex_code: string;
      custom?: boolean;
    }>;
    price: number;
    currency: string;
  };
}

export function OrderForm({ 
  productId, 
  productSlug, 
  initialQuantity,
  initialSize,
  initialColor,
  product 
}: OrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Find the color object that matches the initialColor (which could be an id or hex code)
  const selectedColorObject = product.colors?.find(c => 
    c.id === initialColor || c.hex_code === initialColor
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: initialQuantity,
      size: initialSize,
      color: initialColor,
    }
  });

  const handleFormSubmit = async (data: OrderFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          productId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      router.push(`/p/${productSlug}/order/${order.id}/confirmation`);
    } catch (error) {
      console.error('Error submitting order:', error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="font-medium text-gray-900">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium">{initialQuantity}</span>
          </div>
          {initialSize && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{initialSize}</span>
            </div>
          )}
          {initialColor && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Color:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-200" 
                  style={{ backgroundColor: selectedColorObject?.hex_code || initialColor }}
                  aria-label={selectedColorObject?.name || 'Selected color'}
                ></div>
                <span className="font-medium">{selectedColorObject?.name || initialColor}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatCurrency(product.price * initialQuantity, product.currency)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              {...register('fullName')}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500" id="fullName-error">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p className="text-sm text-red-500" id="email-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              {...register('phone')}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p className="text-sm text-red-500" id="phone-error">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingAddress">Shipping Address</Label>
            <Textarea
              id="shippingAddress"
              placeholder="Enter your shipping address"
              {...register('shippingAddress')}
              aria-describedby={errors.shippingAddress ? 'shippingAddress-error' : undefined}
            />
            {errors.shippingAddress && (
              <p className="text-sm text-red-500" id="shippingAddress-error">
                {errors.shippingAddress.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes"
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Place Order'}
      </Button>
      
      {/* Hidden form fields for the data */}
      <input type="hidden" {...register('quantity')} />
      <input type="hidden" {...register('size')} />
      <input type="hidden" {...register('color')} />
    </form>
  );
} 