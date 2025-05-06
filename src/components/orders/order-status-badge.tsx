import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, PackageCheck, Truck, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: PackageCheck,
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border',
        config.className
      )}
    >
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {config.label}
    </span>
  );
} 