export type ProductStatus = 'draft' | 'active' | 'inactive';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type TemplateType = 'minimal' | 'standard' | 'premium';

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  template_type: TemplateType;
  status: ProductStatus;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  order_total: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
} 