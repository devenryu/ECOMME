import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrdersTable } from '@/components/orders/orders-table';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

async function getOrders(statusFilter?: string) {
  const supabase = createServerComponentClient({ cookies });

  // Get the current user's session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { orders: [], statusCounts: {} };
  }

  // Build the query
  let query = supabase
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
    .eq('products.seller_id', user.id);
    
  // Apply status filter if provided
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  
  // Execute the query
  const { data: orders } = await query.order('created_at', { ascending: false });

  // Get counts for all statuses (for the filter tabs)
  const { data: allOrders } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      products!inner (
        seller_id
      )
    `)
    .eq('products.seller_id', user.id);
    
  // Count orders by status
  const statusCounts = {
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  if (allOrders) {
    statusCounts.all = allOrders.length;
    
    allOrders.forEach(order => {
      if (statusCounts[order.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });
  }

  return { 
    orders: orders || [],
    statusCounts
  };
}

export default async function OrdersPage({ 
  searchParams 
}: { 
  searchParams: { status?: string } 
}) {
  const statusFilter = searchParams.status || '';
  const { orders, statusCounts } = await getOrders(statusFilter);
  
  const statuses = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-gray-500 mt-2">
          Manage and track your customer orders
        </p>
      </div>
      
      {/* Status filter tabs */}
      <div className="border-b">
        <nav className="flex -mb-px space-x-8">
          {statuses.map(status => {
            const count = status.value === '' 
              ? statusCounts.all 
              : statusCounts[status.value as keyof typeof statusCounts];
              
            const isActive = status.value === statusFilter;
            
            return (
              <Link
                key={status.value}
                href={status.value ? `/dashboard/orders?status=${status.value}` : '/dashboard/orders'}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {status.label}
                <span className={`ml-2 rounded-full text-xs px-2 py-0.5 ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Table or empty state */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-2 text-gray-500">
            {statusFilter 
              ? `You don't have any ${statusFilter} orders yet.` 
              : "You don't have any orders yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <OrdersTable initialOrders={orders} />
        </div>
      )}
    </div>
  );
} 