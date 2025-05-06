import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrdersTable } from '@/components/orders/orders-table';

async function getOrders() {
  const supabase = createServerComponentClient({ cookies });

  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  const { data: orders } = await supabase
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
    .eq('products.seller_id', session.user.id)
    .order('created_at', { ascending: false });

  return orders || [];
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="container mx-auto px-4 py-8">
      <OrdersTable initialOrders={orders} />
    </div>
  );
} 