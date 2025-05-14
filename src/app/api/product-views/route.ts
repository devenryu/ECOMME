import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const headersList = headers();
  
  try {
    const body = await request.json();
    const { product_id } = body;
    
    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();
      
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get user information (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Generate a session ID if user is not logged in
    const sessionId = !user ? (request.cookies.get('product_view_session')?.value || uuidv4()) : null;
    
    // Record the view
    const { data, error } = await supabase
      .from('product_views')
      .insert({
        product_id,
        viewer_id: user?.id || null,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: ip,
        referrer: referer,
      });
      
    if (error) {
      console.error('Error recording product view:', error);
      return NextResponse.json(
        { error: 'Failed to record view' },
        { status: 500 }
      );
    }
    
    // Set a cookie for anonymous users to prevent duplicate views
    const response = NextResponse.json({ success: true });
    
    if (sessionId && !request.cookies.get('product_view_session')) {
      response.cookies.set('product_view_session', sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Unexpected error recording view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 