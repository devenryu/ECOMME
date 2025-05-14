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

interface StatusToggleProps {
  productId: string;
  initialStatus: 'active' | 'inactive' | 'draft';
  onStatusChange?: (productId: string, newStatus: 'active' | 'inactive' | 'draft') => void;
}

export function StatusToggle({ productId, initialStatus, onStatusChange }: StatusToggleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const validStatus = newStatus as 'active' | 'inactive' | 'draft';
      setStatus(validStatus);
      
      // Call the callback if provided
      if (onStatusChange) {
        onStatusChange(productId, validStatus);
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select
      value={status}
      onValueChange={handleStatusChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[120px] h-8 text-sm">
        <SelectValue placeholder="Select status">
          <div className="flex items-center">
            <span className={`h-2 w-2 rounded-full mr-2 ${
              status === 'active' ? 'bg-green-500' : 
              status === 'inactive' ? 'bg-red-500' : 
              'bg-amber-500'
            }`}></span>
            <span className="capitalize">{status}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft" className="flex items-center">
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
            <span>Draft</span>
          </div>
        </SelectItem>
        <SelectItem value="active">
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span>Active</span>
          </div>
        </SelectItem>
        <SelectItem value="inactive">
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
            <span>Inactive</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 