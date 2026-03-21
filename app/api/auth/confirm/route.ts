import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/account'

  if (token_hash && type) {
    // Exchange the token hash for an authenticated session
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // successful verification, redirect to the intended page
      return NextResponse.redirect(new URL(`/${next.slice(1)}`, request.url))
    }
  }

  // Redirect to error page if token exchange fails or is missing
  return NextResponse.redirect(new URL('/login?error=Invalid verification link', request.url))
}
