import * as z from 'zod';

export const orderSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  shippingAddress: z.string().min(10, 'Please enter a complete shipping address'),
  notes: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  size: z.string().optional(),
  color: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>; 