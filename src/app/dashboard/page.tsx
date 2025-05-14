import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  BarChart3,
  ExternalLink,
  Star,
  Truck,
  Users,
  PieChart,
  TrendingDown,
  Calendar,
  Activity
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductViewAnalytics } from "@/components/dashboard/ProductViewAnalytics";

async function getDashboardStats(userId: string) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get total products count
  const { count: productsCount, error: productsError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', userId);
  
  if (productsError) {
    console.error('Error fetching products:', productsError);
  }
  
  // Get active products count
  const { count: activeProductsCount, error: activeProductsError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('status', 'active');
  
  if (activeProductsError) {
    console.error('Error fetching active products:', activeProductsError);
  }
  
  // Get orders related to user's products
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      products!inner (
        title,
        price,
        currency,
        seller_id,
        template_type
      )
    `)
    .eq('products.seller_id', userId)
    .order('created_at', { ascending: false });
  
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return {
      productsCount: productsCount || 0,
      activeProductsCount: activeProductsCount || 0,
      totalOrders: 0,
      newOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      currency: 'USD',
      recentOrders: [],
      monthlyOrdersData: [],
      comparisonWithLastMonth: 0,
      salesByTemplate: [],
      dailyRevenue: [],
      customerStats: {
        newCustomers: 0,
        returningCustomers: 0,
        totalCustomers: 0,
        growthRate: 0
      }
    };
  }
  
  // Calculate total and new orders (last 7 days)
  const totalOrders = orders?.length || 0;
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  
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
  
  // Create monthly orders data for charts - get last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i)); // This ensures months are in correct order
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      value: 0,
      monthIndex: date.getMonth()
    };
  });
  
  // Count orders by month
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      
      const monthData = last6Months.find(m => 
        m.monthIndex === orderMonth && m.year === orderYear
      );
      
      if (monthData) {
        monthData.value += 1;
      }
    });
  }
  
  // Create monthly orders data array without the monthIndex property
  const monthlyOrdersData = last6Months.map(({ month, year, value }) => ({
    month,
    year,
    value
  }));
  
  // Calculate month-over-month growth
  const currentMonthIndex = last6Months.findIndex(m => 
    m.monthIndex === new Date().getMonth() && m.year === new Date().getFullYear()
  );
  
  const previousMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 0;
  
  const currentMonthOrders = last6Months[currentMonthIndex]?.value || 0;
  const previousMonthOrders = last6Months[previousMonthIndex]?.value || 0;
  
  const comparisonWithLastMonth = previousMonthOrders === 0 
    ? currentMonthOrders > 0 ? 100 : 0
    : Math.round(((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100);
  
  // NEW: Calculate sales by template type
  const salesByTemplate = orders?.reduce((result: any[], order) => {
    const templateType = order.products.template_type;
    const existingTemplate = result.find(item => item.template === templateType);
    
    if (existingTemplate) {
      existingTemplate.orders += 1;
      existingTemplate.revenue += Number(order.total_amount);
    } else {
      result.push({
        template: templateType,
        orders: 1,
        revenue: Number(order.total_amount)
      });
    }
    
    return result;
  }, []) || [];
  
  // NEW: Calculate daily revenue for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i)); // Start 6 days ago
    return {
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: 0,
      orders: 0
    };
  });
  
  // Add revenue data for each day
  if (orders && orders.length > 0) {
    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === orderDate);
      
      if (dayData) {
        dayData.revenue += Number(order.total_amount);
        dayData.orders += 1;
      }
    });
  }
  
  // NEW: Customer statistics
  // For demo purposes, let's simulate some customer data
  // In a real app, you would query the actual customer data
  const customerIds = orders?.map(order => order.customer_id).filter(Boolean);
  const uniqueCustomerIds = [...new Set(customerIds)];
  const totalCustomers = uniqueCustomerIds.length;
  
  // Get new customers (from last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const newCustomersOrders = orders?.filter(order => 
    new Date(order.created_at) >= thirtyDaysAgo
  ) || [];
  
  const newCustomerIds = [...new Set(newCustomersOrders.map(order => order.customer_id))];
  const newCustomers = newCustomerIds.length;
  
  // Returning customers = total - new
  const returningCustomers = Math.max(0, totalCustomers - newCustomers);
  
  // Growth rate (30-day period)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(now.getDate() - 60);
  
  const previousPeriodOrders = orders?.filter(order => 
    new Date(order.created_at) >= sixtyDaysAgo && new Date(order.created_at) < thirtyDaysAgo
  ) || [];
  
  const previousPeriodCustomerIds = [...new Set(previousPeriodOrders.map(order => order.customer_id))];
  const previousPeriodCustomers = previousPeriodCustomerIds.length;
  
  const customerGrowthRate = previousPeriodCustomers === 0
    ? newCustomers > 0 ? 100 : 0
    : Math.round(((newCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100);
    
  return {
    productsCount: productsCount || 0,
    activeProductsCount: activeProductsCount || 0,
    totalOrders,
    newOrders,
    pendingOrders,
    totalRevenue,
    currency,
    recentOrders,
    monthlyOrdersData,
    comparisonWithLastMonth,
    salesByTemplate,
    dailyRevenue: last7Days,
    customerStats: {
      newCustomers,
      returningCustomers,
      totalCustomers,
      growthRate: customerGrowthRate
    }
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your store today.
            </p>
          </div>
          <div className="hidden md:flex space-x-2">
            <Link 
              href="/dashboard/products/new" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Package className="mr-2 h-4 w-4" />
              Add New Product
            </Link>
            <Link 
              href="/dashboard/orders" 
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalRevenue, stats.currency)}
                </h3>
              </div>
            </div>
            <div className={`flex items-center mt-4 text-sm ${stats.comparisonWithLastMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.comparisonWithLastMonth >= 0 ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(stats.comparisonWithLastMonth)}% from last month</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-blue-600">{stats.newOrders}</span> new this week
              </div>
              <Link href="/dashboard/orders" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Needs your attention
              </div>
              <Link href="/dashboard/orders?status=pending" className="text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors flex items-center">
                Process <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Products</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.productsCount}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-purple-600">{stats.activeProductsCount}</span> active
              </div>
              <Link href="/dashboard/products" className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors flex items-center">
                Manage <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Daily Revenue</h2>
            <div className="text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Last 7 days
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64">
            {stats.dailyRevenue.every(day => day.revenue === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Activity className="h-16 w-16 mb-2 opacity-30" />
                <p>No revenue data available for this period</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-end space-x-2">
                  {stats.dailyRevenue.map((day, index) => {
                    const maxRevenue = Math.max(...stats.dailyRevenue.map(d => d.revenue));
                    const heightPercentage = maxRevenue === 0 ? 0 : (day.revenue / maxRevenue) * 100;
                    
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center">
                        <div className="relative w-full group">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {formatCurrency(day.revenue, stats.currency)} ({day.orders} orders)
                          </div>
                          
                          {/* Bar */}
                          <div className="w-full bg-indigo-100 hover:bg-indigo-200 transition-colors rounded-t relative overflow-hidden">
                            <div 
                              className="absolute bottom-0 left-0 right-0 bg-indigo-500" 
                              style={{ 
                                height: `${heightPercentage}%`,
                                minHeight: day.revenue > 0 ? '4px' : '0' 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="h-full" style={{ height: `${Math.max(80, 200 - heightPercentage * 2)}px` }}></div>
                        <div className="text-xs text-gray-500 mt-2 font-medium">{day.day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales by Template and Customer Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Product Template */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sales by Template</h2>
          </div>
          <div className="p-6">
            {stats.salesByTemplate.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                <PieChart className="h-12 w-12 mb-2 opacity-30" />
                <p>No sales data available yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stats.salesByTemplate.map((item, index) => {
                  const totalRevenue = stats.totalRevenue || 1;
                  const percentage = Math.round((item.revenue / totalRevenue) * 100);
                  
                  const colors = {
                    premium: {
                      bg: 'bg-purple-100',
                      text: 'text-purple-800',
                      bar: 'bg-purple-500',
                    },
                    standard: {
                      bg: 'bg-blue-100',
                      text: 'text-blue-800',
                      bar: 'bg-blue-500',
                    },
                    minimal: {
                      bg: 'bg-gray-100',
                      text: 'text-gray-800',
                      bar: 'bg-gray-500',
                    }
                  };
                  
                  // Default to minimal colors if template type is unknown
                  const templateColors = colors[item.template as keyof typeof colors] || colors.minimal;
                  
                  return (
                    <div key={item.template} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`inline-block h-3 w-3 rounded-full ${templateColors.bar} mr-2`}></span>
                          <span className="capitalize text-sm font-medium">{item.template}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.revenue, stats.currency)} ({percentage}%)
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${templateColors.bar}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.orders} order{item.orders !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
  
        {/* Customer Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Customer Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Total Customers</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">
                      {stats.customerStats.totalCustomers}
                    </h3>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">New</span>
                    <span className="text-xs font-medium">
                      {Math.round((stats.customerStats.newCustomers / Math.max(stats.customerStats.totalCustomers, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ 
                        width: `${Math.round((stats.customerStats.newCustomers / Math.max(stats.customerStats.totalCustomers, 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500">Returning</span>
                    <span className="text-xs font-medium">
                      {Math.round((stats.customerStats.returningCustomers / Math.max(stats.customerStats.totalCustomers, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ 
                        width: `${Math.round((stats.customerStats.returningCustomers / Math.max(stats.customerStats.totalCustomers, 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
  
              <div className="flex flex-col justify-between">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700">Customer Growth</div>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.customerStats.newCustomers}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">new (30d)</span>
                  </div>
                  <div className={`flex items-center mt-2 text-sm ${
                    stats.customerStats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.customerStats.growthRate >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    <span>
                      {Math.abs(stats.customerStats.growthRate)}% from previous 30 days
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="#"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                  >
                    View Customer Analytics <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product View Analytics */}
      <div className="mt-6">
        <ProductViewAnalytics className="shadow-sm" />
      </div>

      {/* Recent Orders and Performance */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm col-span-2">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No orders yet. Orders will appear here once customers make purchases.
              </div>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-indigo-600">Order #{order.id.substring(0, 8)}</div>
                      <div className="flex items-center mt-1">
                        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                          order.status === 'completed' ? 'bg-green-500' : 
                          order.status === 'pending' ? 'bg-amber-500' : 
                          order.status === 'processing' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></div>
                        <p className="text-sm text-gray-500 capitalize">{order.status}</p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount, order.products?.currency || stats.currency)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                        Details <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Performance</h2>
          </div>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
              <div className="text-sm text-gray-500 mt-1">Total Orders</div>
              <div className={`inline-flex items-center mt-2 text-sm ${
                stats.comparisonWithLastMonth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.comparisonWithLastMonth >= 0 ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                <span>{Math.abs(stats.comparisonWithLastMonth)}% from last month</span>
              </div>
            </div>
            
            <div className="h-48 flex items-end">
              {stats.monthlyOrdersData.map((month: any, index: number) => (
                <div key={`${month.month}-${month.year}`} className="flex-1 flex flex-col items-center">
                  <div className="w-full px-1">
                    <div 
                      className="w-full bg-indigo-100 hover:bg-indigo-200 transition-colors rounded-t" 
                      style={{ height: `${month.value ? (month.value / Math.max(...stats.monthlyOrdersData.map((m: any) => m.value || 1)) * 100) : 0}px`, minHeight: month.value ? '16px' : '0' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{month.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col h-full justify-between">
            <div>
              <Package className="h-8 w-8 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Add New Product</h3>
              <p className="text-indigo-100">Create a new product listing to expand your catalog.</p>
            </div>
            <Link 
              href="/dashboard/products/new" 
              className="mt-4 inline-flex items-center text-white bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
            >
              Add Product <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col h-full justify-between">
            <div>
              <Truck className="h-8 w-8 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Manage Orders</h3>
              <p className="text-amber-100">Process pending orders and track shipments.</p>
            </div>
            <Link 
              href="/dashboard/orders" 
              className="mt-4 inline-flex items-center text-white bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
            >
              Go to Orders <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col h-full justify-between">
            <div>
              <Star className="h-8 w-8 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Store Performance</h3>
              <p className="text-green-100">View detailed analytics about your store.</p>
            </div>
            <Link 
              href="#" 
              className="mt-4 inline-flex items-center text-white bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
            >
              View Analytics <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 