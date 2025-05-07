import * as z from 'zod';

export const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description is too long'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('USD'),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  template_type: z.enum(['minimal', 'standard', 'premium']).default('standard'),
  image_url: z.string().url('Invalid image URL').optional(),
  features: z.array(z.string()).default([]),
  slug: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  quantity: z.number().min(0, 'Quantity must be non-negative').default(0),
  min_order_quantity: z.number().min(1, 'Minimum order quantity must be at least 1').default(1),
  max_order_quantity: z.number().min(1, 'Maximum order quantity must be at least 1')
    .nullable()
    .refine(val => val === null || val >= 1, 'Maximum order quantity must be at least 1')
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>; 