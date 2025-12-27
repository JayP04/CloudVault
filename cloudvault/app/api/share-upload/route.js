import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const formData = await request.formData()
    const files = formData.getAll('media')

    if (files.length === 0) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Store file count in session storage for the upload page to handle
    // We can't actually process files here because we need to use the upload flow
    
    // Redirect to dashboard with a flag
    const redirectUrl = new URL('/dashboard', request.url)
    redirectUrl.searchParams.set('shared', files.length)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Share upload error:', error)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}