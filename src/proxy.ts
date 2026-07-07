import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the exact public routes that unauthenticated users can access
const publicRoutes = ['/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user has an authentication cookie from the backend
  const hasToken = request.cookies.has('refreshToken') || request.cookies.has('accessToken');

  const isPublicRoute = publicRoutes.includes(pathname);

  // If the user is on the login page but they are already authenticated, redirect to discover
  if (isPublicRoute && hasToken) {
    return NextResponse.redirect(new URL('/discover', request.url));
  }

  // If the user is trying to access a protected route but is not authenticated, redirect to login
  if (!isPublicRoute && !hasToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Otherwise, allow the request to proceed normally
  return NextResponse.next();
}

export const config = {
  // Apply this middleware to all routes EXCEPT:
  // - api routes (/api/*)
  // - _next/static (static files like css/js)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - images/assets in public folder (e.g. .png, .jpg, .svg)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
