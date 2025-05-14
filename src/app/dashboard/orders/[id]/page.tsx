'use client';

import { Metadata } from "next";
import { notFound, redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Shell } from "@/components/shells/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Package, 
  User, 
  Calendar, 
  Clock, 
  CircleDollarSign, 
  Truck, 
  MapPin, 
  FileText, 
  Send, 
  Printer,
  Loader2
} from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusUpdate } from "@/components/orders/order-status-update";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { useEffect, useState } from "react";

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

// Metadata can't be used in client components, we'll remove it
// export const metadata: Metadata = {
//   title: "Order Details",
//   description: "Manage and review order details",
// };

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params;
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string>("Not provided");

  useEffect(() => {
    // Fetch the order data
    async function fetchOrder() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/login');
          return;
        }

        // Fetch the order with all details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            products!inner (
              *,
              seller_id
            )
          `)
          .eq('id', id)
          .eq('products.seller_id', user.id)
          .single();

        if (orderError || !orderData) {
          setError("Order not found");
          return;
        }

        setOrder(orderData);
        
        // Format shipping address if it exists
        if (orderData.shipping_address && typeof orderData.shipping_address === 'object') {
          const address = orderData.shipping_address;
          const addressParts = [
            address.street,
            address.city,
            address.state,
            address.postal_code,
            address.country
          ].filter(Boolean);
          
          if (addressParts.length > 0) {
            setFormattedAddress(addressParts.join(', '));
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError("An error occurred while loading the order");
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrder();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </Shell>
    );
  }
  
  if (error || !order) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Order not found</h1>
            <p className="text-muted-foreground mb-4">{error || "The requested order could not be found."}</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">Back to Orders</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to orders</span>
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold">Order #{id.substring(0, 8)}</h1>
            <p className="text-muted-foreground text-sm">{formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" /> 
            Email Receipt
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" /> 
            Print
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Order Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Product</div>
                  <div className="text-sm">
                    <div className="font-medium">{order.products.title}</div>
                    <div className="text-muted-foreground">
                      {formatCurrency(order.products.price, order.products.currency)}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {order.quantity > 1 ? `${order.quantity} items` : '1 item'}
                    </div>
                    {order.size && <div className="text-muted-foreground">Size: {order.size}</div>}
                    {order.color && <div className="text-muted-foreground">Color: {order.color}</div>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Order Details</div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(order.total_amount, order.currency || order.products.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Ordered on {formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Last updated {formatDate(order.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">Contact Information</div>
                  <div className="text-sm">
                    <div className="font-medium">{order.full_name || 'Not provided'}</div>
                    <div className="text-muted-foreground">{order.email || 'No email provided'}</div>
                    <div className="text-muted-foreground mt-1">{order.phone || 'No phone provided'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Shipping Address</div>
                  <div className="text-sm">
                    <div className="text-muted-foreground flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="whitespace-pre-line">{formattedAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium mb-1">Order Notes</div>
                  <div className="text-sm text-muted-foreground flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{order.notes}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Order Timeline */}
          <OrderTimeline orderId={id} />
        </div>
        
        {/* Status and Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <OrderStatusBadge status={order.status} large />
              </div>
              <OrderStatusUpdate 
                orderId={id} 
                currentStatus={order.status}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {order.status === 'shipped' || order.status === 'delivered' 
                    ? 'Order has been shipped' 
                    : 'Order not yet shipped'}
                </span>
              </div>
              
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <Button variant="outline" className="w-full">
                  <Truck className="h-4 w-4 mr-2" />
                  Update Tracking
                </Button>
              )}
              
              {(order.status === 'pending' || order.status === 'processing') && (
                <Button variant="default" className="w-full">
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Shipped
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}