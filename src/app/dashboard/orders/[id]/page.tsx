import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { OrderStatusSelect } from '@/components/orders/order-status-select';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatCurrency } from '@/lib/utils';
import { Package, User, Truck, Calendar, CreditCard } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

async function getOrder(orderId: string) {
  const supabase = createServerComponentClient({ cookies });

  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return null;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (
        title,
        price,
        currency,
        seller_id,
        image_url
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order || order.products.seller_id !== session.user.id) {
    return null;
  }

  return order;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          {/* Header with order ID and status selector */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-blue-100 text-sm">Order ID</p>
              <h1 className="text-white text-2xl font-bold tracking-tight">{order.id}</h1>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <p className="text-blue-100 text-sm mb-2">Status</p>
              <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
            </div>
          </div>

          {/* Order summary */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">
                  Ordered on {new Date(order.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Product details */}
            <div className="md:col-span-7 space-y-6">
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Product Information</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {order.products.image_url && (
                    <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={order.products.image_url} 
                        alt={order.products.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{order.products.title}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Unit Price</span>
                        <span className="font-medium">
                          {formatCurrency(order.products.price, order.products.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-medium">
                          {order.quantity} {order.quantity > 1 ? 'items' : 'item'}
                        </span>
                      </div>
                      {order.size && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Size</span>
                          <span className="font-medium">{order.size}</span>
                        </div>
                      )}
                      {order.color && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Color</span>
                          <span className="font-medium flex items-center gap-2">
                            {order.color}
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-200" 
                              style={{ backgroundColor: order.color }}
                            />
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(order.total_amount, order.products.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping information */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Shipping Information</h2>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium whitespace-pre-line">{order.shipping_address}</p>
                  </div>
                  {order.notes && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500">Special Instructions</p>
                      <p className="font-medium">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer details */}
            <div className="md:col-span-5 space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Customer Details</h2>
                </div>
                <dl className="mt-4 divide-y">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="font-medium text-right">{order.full_name}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="font-medium text-right">{order.email}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Phone</dt>
                    <dd className="font-medium text-right">{order.phone}</dd>
                  </div>
                </dl>
              </div>

              {/* Payment Information */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Payment Information</h2>
                </div>
                <dl className="mt-4 divide-y">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Unit Price</dt>
                    <dd className="font-medium text-right">
                      {formatCurrency(order.products.price, order.products.currency)}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Quantity</dt>
                    <dd className="font-medium text-right">
                      {order.quantity} {order.quantity > 1 ? 'items' : 'item'}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Total Amount</dt>
                    <dd className="font-bold text-right text-blue-600">
                      {formatCurrency(order.total_amount, order.products.currency)}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm text-gray-500">Payment Method</dt>
                    <dd className="font-medium text-right">Cash on Delivery</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}