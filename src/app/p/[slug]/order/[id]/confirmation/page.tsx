import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';

interface PageProps {
  params: {
    slug: string;
    id: string;
  };
}

async function getOrder(orderId: string) {
  const supabase = createServerComponentClient({ cookies });

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        title,
        price,
        currency
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return null;
  }

  return order;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your order. We'll process it right away.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-gray-600">Order ID</dt>
                  <dd className="font-medium">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Product</dt>
                  <dd className="font-medium">{order.products.title}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Quantity</dt>
                  <dd className="font-medium">
                    {order.quantity} {order.quantity > 1 ? 'items' : 'item'} × {formatCurrency(order.products.price, order.products.currency)}
                  </dd>
                </div>
                {order.size && (
                  <div>
                    <dt className="text-gray-600">Size</dt>
                    <dd className="font-medium">{order.size}</dd>
                  </div>
                )}
                {order.color && (
                  <div>
                    <dt className="text-gray-600">Color</dt>
                    <dd className="font-medium flex items-center gap-2">
                      {order.color}
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-200" 
                        style={{ backgroundColor: order.color }}
                      />
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-600">Total Amount</dt>
                  <dd className="font-medium text-lg text-primary">
                    {formatCurrency(order.total_amount, order.products.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Name</dt>
                  <dd className="font-medium">{order.full_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Email</dt>
                  <dd className="font-medium">{order.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Shipping Address</dt>
                  <dd className="font-medium whitespace-pre-line">
                    {order.shipping_address}
                  </dd>
                </div>
              </dl>
            </div>

            <Link 
              href="/" 
              className={cn(buttonVariants({ variant: "default" }), "font-medium")}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 