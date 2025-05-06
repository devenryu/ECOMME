import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown, DollarSign, Package, ShoppingCart, TrendingUp, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getDashboardStats(userId: string) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get total products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', userId);
  
  // Get orders related to user's products
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      products!inner (
        title,
        price,
        currency,
        seller_id
      )
    `)
    .eq('products.seller_id', userId)
    .order('created_at', { ascending: false });
  
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return {
      productsCount: productsCount || 0,
      totalOrders: 0,
      newOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      currency: 'USD',
      recentOrders: [],
      monthlyOrdersData: [],
      comparisonWithLastMonth: 0
    };
  }
  
  // Calculate total and new orders (last 7 days)
  const totalOrders = orders?.length || 0;
  const now = new Date();
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
  
  const newOrders = orders?.filter(order => 
    new Date(order.created_at) >= sevenDaysAgo
  ).length || 0;
  
  // Calculate pending orders
  const pendingOrders = orders?.filter(order => 
    order.status === 'pending'
  ).length || 0;
  
  // Calculate total revenue
  const totalRevenue = orders?.reduce((sum, order) => 
    sum + Number(order.total_amount), 0
  ) || 0;
  
  // Get currency from first order if available
  const currency = orders?.[0]?.products?.currency || 'USD';
  
  // Get recent orders (last 5)
  const recentOrders = orders?.slice(0, 5) || [];
  
  // Create monthly orders data for charts
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      value: 0
    };
  }).reverse();
  
  // Count orders by month
  const monthlyOrdersData = last6Months.map(monthData => {
    const monthOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === new Date(`${monthData.month} 1, ${monthData.year}`).getMonth() &&
             orderDate.getFullYear() === monthData.year;
    }).length || 0;
    
    return {
      ...monthData,
      value: monthOrders
    };
  });
  
  // Calculate month-over-month growth
  const currentMonthOrders = monthlyOrdersData[5].value;
  const lastMonthOrders = monthlyOrdersData[4].value;
  const comparisonWithLastMonth = lastMonthOrders === 0 
    ? 100 
    : Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100);
  
  return {
    productsCount: productsCount || 0,
    totalOrders,
    newOrders,
    pendingOrders,
    totalRevenue,
    currency,
    recentOrders,
    monthlyOrdersData,
    comparisonWithLastMonth
  };
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, return empty dashboard
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold">Please log in to view your dashboard</h1>
        </div>
      </div>
    );
  }
  
  const stats = await getDashboardStats(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome back! Here's an overview of your store's performance.
        </p>
      </div>
      
      {/* Main stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow-sm border relative overflow-hidden">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(stats.totalRevenue, stats.currency)}
              </h3>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-sm border relative overflow-hidden">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalOrders}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500"></div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-sm border relative overflow-hidden group">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <h3 className="text-2xl font-bold mt-1">{stats.pendingOrders}</h3>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <Link 
            href="/dashboard/orders?status=pending" 
            className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-sm font-medium text-blue-600 flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </Link>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-sm border relative overflow-hidden">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Products</p>
              <h3 className="text-2xl font-bold mt-1">{stats.productsCount}</h3>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500"></div>
        </div>
      </div>
      
      {/* New orders and monthly chart */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">New Orders</h3>
            <div className="flex items-center">
              <span className={`inline-flex items-center text-sm ${stats.comparisonWithLastMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.comparisonWithLastMonth >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                {Math.abs(stats.comparisonWithLastMonth)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative h-36 w-36">
              {/* This would be a chart in a real implementation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <p className="text-4xl font-bold text-center">{stats.newOrders}</p>
                  <p className="text-sm text-gray-500 text-center">last 7 days</p>
                </div>
              </div>
            </div>
          </div>
          
          <Link 
            href="/dashboard/orders" 
            className="w-full mt-4 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-md flex items-center justify-center transition-colors"
          >
            View All Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Orders Overview</h3>
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              Monthly Trend
            </div>
          </div>
          
          <div className="h-64 w-full">
            {/* This would be a chart in a real implementation */}
            <div className="flex h-48 items-end justify-between">
              {stats.monthlyOrdersData.map((month, index) => {
                // Calculate height percentage based on max value
                const maxValue = Math.max(...stats.monthlyOrdersData.map(d => d.value));
                const heightPercentage = maxValue === 0 ? 0 : (month.value / maxValue) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-10 bg-blue-500 rounded-t"
                      style={{ height: `${heightPercentage}%` }}
                    ></div>
                    <div className="mt-2 text-xs text-gray-500">{month.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent orders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
        </div>
        
        {stats.recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No recent orders found.</p>
          </div>
        ) : (
          <div className="divide-y">
            {stats.recentOrders.map((order: any) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="p-4 flex items-center hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{order.products.title}</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="mr-4">
                    <p className="font-medium">
                      {formatCurrency(order.total_amount, order.products.currency)}
                    </p>
                  </div>
                  <div>
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }
                      `}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {stats.recentOrders.length > 0 && (
          <div className="p-4 border-t">
            <Link 
              href="/dashboard/orders" 
              className="text-sm text-blue-600 font-medium flex items-center"
            >
              View All Orders
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 