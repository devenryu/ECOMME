import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { OrderStatusSelect } from '@/components/orders/order-status-select';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatCurrency } from '@/lib/utils';

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
        seller_id
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Product Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-500">Product</dt>
                  <dd className="font-medium">{order.products.title}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Price</dt>
                  <dd className="font-medium">
                    {formatCurrency(order.products.price, order.products.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Order Status</h2>
              <div className="space-y-2">
                <div>
                  <dt className="text-gray-500">Current Status</dt>
                  <dd className="mt-1">
                    <OrderStatusBadge status={order.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Order Date</dt>
                  <dd className="font-medium">
                    {new Date(order.created_at).toLocaleString()}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium">{order.full_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium">{order.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium">{order.phone}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-500">Address</dt>
                  <dd className="font-medium whitespace-pre-line">
                    {order.shipping_address}
                  </dd>
                </div>
                {order.notes && (
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd className="font-medium">{order.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 