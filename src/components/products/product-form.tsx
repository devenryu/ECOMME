'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { productSchema, type ProductFormData } from '@/lib/validations/product';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TemplateSelector } from '@/components/products/template-selector';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';
import { Copy, ExternalLink, AlertTriangle } from 'lucide-react';

interface ProductFormProps {
  initialData?: ProductFormData;
  onSubmit?: (data: ProductFormData) => Promise<void>;
}

export function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      status: 'draft',
      template_type: 'standard',
      currency: 'USD',
      features: [],
    },
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    // Prevent submission if an image is still uploading
    if (isImageUploading) {
      toast.error('Please wait for the image to finish uploading');
      return;
    }

    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        const isUpdateMode = initialData?.id;
        let endpoint = isUpdateMode 
          ? `/api/products/${initialData.id}` 
          : '/api/products';
        
        const method = isUpdateMode ? 'PATCH' : 'POST';
        
        console.log(`[ProductForm] ${isUpdateMode ? 'Updating' : 'Creating'} product`, {
          endpoint,
          method,
          data
        });
        
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        // Improved error handling - try to parse response
        let errorMessage = `Failed to ${isUpdateMode ? 'update' : 'create'} product`;
        
        if (!response.ok) {
          // Clone the response before attempting to read its body
          const clonedResponse = response.clone();
          
          try {
            // Try to parse JSON error
            const errorData = await clonedResponse.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            // If not JSON, get text content
            try {
              const textError = await response.text();
              console.error(`[ProductForm] Error response (not JSON):`, textError);
              errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
            } catch (textError) {
              console.error(`[ProductForm] Failed to read response:`, textError);
              errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
            }
          }
          throw new Error(errorMessage);
        }

        try {
          // Clone the response before reading it to avoid "body already consumed" errors
          const clonedResponse = response.clone();
          const product = await clonedResponse.json();
          console.log(`[ProductForm] Product ${isUpdateMode ? 'updated' : 'created'} successfully:`, product);
          setCreatedProduct(product);
          toast.success(`Product ${isUpdateMode ? 'updated' : 'created'} successfully`);
        } catch (parseError) {
          console.error(`[ProductForm] Error parsing success response:`, parseError);
          throw new Error('Error processing the server response');
        }
      }
    } catch (error) {
      console.error('[ProductForm] Error submitting product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = watch('template_type');
  const hasImageUrl = !!watch('image_url');
  
  const handleCopyLink = () => {
    if (createdProduct?.slug) {
      const url = `${window.location.origin}/p/${createdProduct.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleVisitLink = () => {
    if (createdProduct?.slug) {
      window.open(`/p/${createdProduct.slug}`, '_blank');
    }
  };

  const handleImageUploadStateChange = (uploading: boolean) => {
    setIsImageUploading(uploading);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="space-y-4">
        {createdProduct && (
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Product {initialData ? 'Updated' : 'Created'} Successfully!</h3>
            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="product-link">Product Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="product-link"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${createdProduct.slug}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="outline" onClick={handleVisitLink}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => router.push('/dashboard/products')}
                >
                  Go to Products
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter product title"
            {...register('title')}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p className="text-sm text-red-500" id="title-error">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter product description"
            {...register('description')}
            aria-describedby={errors.description ? 'description-error' : undefined}
          />
          {errors.description && (
            <p className="text-sm text-red-500" id="description-error">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('price', { valueAsNumber: true })}
              aria-describedby={errors.price ? 'price-error' : undefined}
            />
            {errors.price && (
              <p className="text-sm text-red-500" id="price-error">
                {errors.price.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              defaultValue={watch('currency')}
              onValueChange={(value) => setValue('currency', value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            defaultValue={watch('status')}
            onValueChange={(value: 'draft' | 'active' | 'inactive') =>
              setValue('status', value)
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Template</Label>
          <TemplateSelector
            value={selectedTemplate}
            onChange={(value) => setValue('template_type', value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Product Image</Label>
          <ImageUpload
            value={watch('image_url')}
            onChange={(url) => setValue('image_url', url)}
            onError={(error) => toast.error('Failed to upload image')}
            onUploadStateChange={handleImageUploadStateChange}
          />
        </div>
      </div>

      {!createdProduct && (
        <div>
          {isImageUploading && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-yellow-700">Please wait for the image to finish uploading before saving the product.</p>
            </div>
          )}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading || isImageUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || isImageUploading}
              className={isImageUploading ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isLoading 
                ? 'Saving...' 
                : isImageUploading 
                  ? 'Waiting for upload...' 
                  : initialData 
                    ? 'Update Product' 
                    : 'Save Product'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
} 