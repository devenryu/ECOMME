import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const PROTECTED_PATHS = [
  '/api/products',
  '/api/orders',
  '/dashboard'
];

// Paths that should be public even if they match protected paths
const PUBLIC_EXCEPTIONS = [
  '/api/products/(.+)/public',
  '/api/products-by-slug/(.+)/public'
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Add CORS headers
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Check if the path is a public exception
  const isPublicException = PUBLIC_EXCEPTIONS.some(pattern => {
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(req.nextUrl.pathname);
  });

  if (isPublicException) {
    console.log(`[Middleware] Public exception for: ${req.nextUrl.pathname}`);
    return res;
  }

  // Check if the path requires authentication
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return res;
  }

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

// Configure paths that require authentication
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 