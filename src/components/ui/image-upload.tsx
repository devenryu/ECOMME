'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from './button';
import { Database } from '@/lib/supabase/types';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onError?: (error: Error) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export function ImageUpload({ value, onChange, onError, onUploadStateChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClientComponentClient<Database>();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      onUploadStateChange?.(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Authentication required');

      // Upload directly to the pre-configured bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
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

      onChange(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      onError?.(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-[120px]"
          disabled={isUploading}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      {value && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={value}
            alt="Product image"
            fill
            className="object-cover"
          />
        </div>
      )}
      {isUploading && (
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-full bg-gray-200 overflow-hidden rounded-full">
            <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
          </div>
          <span className="text-sm text-gray-500">Uploading...</span>
        </div>
      )}
    </div>
  );
} 