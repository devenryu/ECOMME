'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface OrderStatusBadgeProps {
  status: string;
  large?: boolean;
}

export function OrderStatusBadge({ status, large = false }: OrderStatusBadgeProps) {
  const statusLower = status.toLowerCase();
  
  const getStatusConfig = () => {
    switch (statusLower) {
      case 'pending':
        return {
          label: 'Pending',
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'processing':
        return {
          label: 'Processing',
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'shipped':
        return {
          label: 'Shipped',
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          classes: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'completed':
        return {
          label: 'Completed',
          classes: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          classes: 'bg-red-50 text-red-700 border-red-200',
        };
      default:
        return {
          label: status,
          classes: 'bg-gray-50 text-gray-700 border-gray-200',
        };
    }
  };
  
  const { label, classes } = getStatusConfig();
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        classes,
        large && 'px-4 py-1 text-sm font-medium',
      )}
    >
      {label}
    </Badge>
  );
} 