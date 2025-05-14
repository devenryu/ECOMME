import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import { Shell } from "@/components/shells/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { OrdersTable } from "@/components/orders/orders-table";
import { ShoppingBag, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Management",
  description: "Manage and track your customer orders",
};

interface OrderItem {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  currency: string;
  product: {
    title: string;
    price: number;
    currency: string;
  };
}

export default async function OrdersPage() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch orders for the current seller
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      products!inner (
        title,
        price,
        currency,
        seller_id
      )
    `)
    .eq("products.seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  const orderItems: OrderItem[] = orders || [];

  // Get order metrics
  const totalOrders = orderItems.length;
  const pendingOrders = orderItems.filter(order => order.status === 'pending').length;
  const processingOrders = orderItems.filter(order => order.status === 'processing').length;
  const completedOrders = orderItems.filter(order => order.status === 'completed').length;
  
  // Calculate total revenue
  const totalRevenue = orderItems.reduce((sum, order) => sum + Number(order.total_amount), 0);
  
  // Get currency from first order or default to USD
  const currency = orderItems[0]?.currency || 'USD';
  
  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl">Order Management</h1>
          <p className="text-muted-foreground">Manage and track your customer orders</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{totalOrders}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{processingOrders}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue, currency)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-md border p-6">
        <OrdersTable initialOrders={orderItems} />
      </div>
    </Shell>
  );
} 