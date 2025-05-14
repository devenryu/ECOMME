'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Clock, AlertTriangle, Package, Truck, XCircle } from 'lucide-react';

interface TimelineEvent {
  status: string;
  timestamp: string;
  message: string;
}

interface OrderTimelineProps {
  orderId: string;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderTimeline = async () => {
      try {
        // Fetch the order history
        const response = await fetch(`/api/orders/${orderId}/timeline`);
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        } else {
          // If the API doesn't exist yet, we'll use placeholder data
          // This can be removed once the actual API is implemented
          const mockEvents = generateMockEvents(orderId);
          setEvents(mockEvents);
        }
      } catch (error) {
        console.error('Error fetching order timeline:', error);
        // Fallback to mock data if API fails
        const mockEvents = generateMockEvents(orderId);
        setEvents(mockEvents);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderTimeline();
  }, [orderId]);

  // Function to generate mock events (can be removed when real API is implemented)
  const generateMockEvents = (orderId: string): TimelineEvent[] => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    
    return [
      {
        status: 'created',
        timestamp: twelveHoursAgo.toISOString(),
        message: 'Order placed',
      },
      {
        status: 'pending',
        timestamp: twelveHoursAgo.toISOString(),
        message: 'Payment confirmed',
      },
      {
        status: 'processing',
        timestamp: sixHoursAgo.toISOString(),
        message: 'Order is being processed',
      },
      {
        status: 'shipped',
        timestamp: oneHourAgo.toISOString(),
        message: 'Order has been shipped',
      },
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border">
        <h3 className="text-lg font-medium mb-4">Order Timeline</h3>
        <div className="flex justify-center p-6">
          <Clock className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-medium mb-4">Order Timeline</h3>
      
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No timeline events found.</p>
        ) : (
          <ol className="relative border-l border-gray-200">
            {events.map((event, index) => (
              <li key={index} className="mb-6 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-white rounded-full -left-4 ring-4 ring-white">
                  {getStatusIcon(event.status)}
                </span>
                <h3 className="mb-1 text-sm font-semibold">{event.message}</h3>
                <time className="block text-xs text-gray-500">
                  {formatDate(event.timestamp, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
} 