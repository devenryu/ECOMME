'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusSelectProps {
  orderId: string;
  initialStatus: OrderStatus;
}

export function OrderStatusSelect({
  orderId,
  initialStatus,
}: OrderStatusSelectProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    // Save previous status in case we need to roll back
    const previousStatus = status;
    
    try {
      // Set loading state and update UI optimistically
      setIsLoading(true);
      setStatus(newStatus as OrderStatus);
      
      console.log(`Updating order ${orderId} status to ${newStatus}...`);
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      // Process the response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      // Handle error responses
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to update status';
        const errorDetails = data.details ? `: ${data.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      console.log('Status update successful:', data);
      
      // Force a refresh to ensure the UI shows the latest server state
      router.refresh();
      
      // Show success message
      showNotification(
        `Status updated to ${newStatus}`, 
        'success'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Revert to the previous status
      setStatus(previousStatus);
      
      // Show error message
      showNotification(
        error instanceof Error ? error.message : 'Failed to update order status',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    
    // Set appropriate styling based on notification type
    const baseClasses = 'fixed top-4 right-4 p-4 rounded shadow-md z-50 flex items-center';
    const typeClasses = type === 'success' 
      ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
      : 'bg-red-100 border-l-4 border-red-500 text-red-700';
    
    notification.className = `${baseClasses} ${typeClasses}`;
    notification.innerHTML = message;
    
    // Add to DOM and remove after delay
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => notification.remove(), 500);
    }, type === 'success' ? 3000 : 5000);
  };

  // Get color styling for the current status
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={isLoading}
      >
        <SelectTrigger className={`w-[180px] font-medium ${getStatusStyles()} transition-all duration-200`}>
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Updating...</span>
            </div>
          ) : (
            <SelectValue placeholder="Select status" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending" className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
            Pending
          </SelectItem>
          <SelectItem value="processing" className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
            Processing
          </SelectItem>
          <SelectItem value="shipped" className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
            Shipped
          </SelectItem>
          <SelectItem value="delivered" className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Delivered
          </SelectItem>
          <SelectItem value="cancelled" className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
            Cancelled
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 