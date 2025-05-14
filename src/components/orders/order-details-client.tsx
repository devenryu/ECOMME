'use client';

interface OrderDetailsClientProps {
  order: {
    id: string;
    status: string;
    full_name: string;
    email: string;
    phone: string;
    shipping_address: any;
    total_amount: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    size?: string;
    color?: string;
    products: {
      title: string;
      price: number;
      currency: string;
    };
  };
}

export default function OrderDetailsClient({ order }: OrderDetailsClientProps) {
  // Remove useState to avoid potential context issues
  return (
    <>
      {/* Empty client component wrapper */}
    </>
  );
} 