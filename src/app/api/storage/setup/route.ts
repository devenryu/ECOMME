import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json(
        { error: 'Failed to list storage buckets' },
        { status: 500 }
      );
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');

    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage
        .createBucket('product-images', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });

      if (bucketError) {
        console.error('Error creating bucket:', bucketError);
        return NextResponse.json(
          { error: 'Failed to create storage bucket' },
          { status: 500 }
        );
      }
    }

    // Update bucket to public
    const { error: updateError } = await supabase.storage.updateBucket('product-images', {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });
    
    if (updateError) {
      console.error('Error updating bucket:', updateError);
      return NextResponse.json(
        { error: 'Failed to update storage bucket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Storage setup completed successfully',
      bucket: 'product-images',
      public: true
    });
  } catch (error) {
    console.error('Storage setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 