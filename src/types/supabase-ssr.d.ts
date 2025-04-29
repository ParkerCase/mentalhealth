declare module '@supabase/ssr' {
    import { NextRequest, NextResponse } from 'next/server'
    
    export function createMiddlewareClient(options: { 
      req: NextRequest; 
      res: NextResponse 
    }): any
    
    export function createServerClient(
      supabaseUrl: string,
      supabaseKey: string,
      options: {
        cookies: {
          get(name: string): string | undefined
          set(name: string, value: string, options: any): void
          remove(name: string, options: any): void
        }
      }
    ): any
  }