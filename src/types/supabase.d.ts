declare module '@supabase/auth-helpers-nextjs' {
    import { NextRequest, NextResponse } from 'next/server';
    
    export function createMiddlewareClient(
      req: NextRequest,
      res: NextResponse
    ): any;
    
    export function createRouteHandlerClient(options: { cookies: any }): any;
  }