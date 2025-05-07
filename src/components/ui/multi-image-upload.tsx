'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, Upload, ImagePlus, Star } from 'lucide-react';
import Image from 'next/image';
import { Button } from './button';
import { Database } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  onError?: (error: Error) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export function MultiImageUpload({ 
  images = [], 
  onChange, 
  onError, 
  onUploadStateChange 
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClientComponentClient<Database>();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      onUploadStateChange?.(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Authentication required');

      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload directly to the pre-configured bucket
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      onChange([...images, ...newImageUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      onError?.(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return; // Already main image
    
    const newImages = [...images];
    const mainImage = newImages.splice(index, 1)[0];
    newImages.unshift(mainImage);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-[140px]"
          disabled={isUploading}
          onClick={() => document.getElementById('multi-image-upload')?.click()}
        >
          {isUploading ? 'Uploading...' : 'Upload Images'}
        </Button>
        <input
          id="multi-image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-full bg-gray-200 overflow-hidden rounded-full">
            <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
          </div>
          <span className="text-sm text-gray-500">Uploading...</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((imageUrl, idx) => (
            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
              <Image
                src={imageUrl}
                alt={`Product image ${idx + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    className="bg-black bg-opacity-50 text-yellow-400 rounded-full p-1.5 hover:bg-opacity-70 focus:outline-none transition-colors"
                    onClick={() => handleSetMainImage(idx)}
                    aria-label="Set as main image"
                    tabIndex={0}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  className="bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 focus:outline-none transition-colors"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label={`Remove image ${idx + 1}`}
                  tabIndex={0}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {idx === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
          <div className="border border-dashed rounded-md aspect-square flex items-center justify-center">
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => document.getElementById('multi-image-upload')?.click()}
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm mt-2">Add Image</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 