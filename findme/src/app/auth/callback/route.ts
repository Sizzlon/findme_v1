import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const userType = searchParams.get('userType')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Handle both OAuth and email confirmation - create profile if it doesn't exist
      const userTypeFromUrl = userType
      const userTypeFromMetadata = data.user.user_metadata?.user_type
      const finalUserType = userTypeFromUrl || userTypeFromMetadata
      
      console.log('Auth callback:', {
        userTypeFromUrl,
        userTypeFromMetadata,
        finalUserType,
        userMetadata: data.user.user_metadata
      })

      if (finalUserType) {
        try {
          if (finalUserType === 'job_seeker') {
            const { data: existingProfile } = await supabase
              .from('job_seekers')
              .select('id')
              .eq('id', data.user.id)
              .maybeSingle()

            if (!existingProfile) {
              console.log('Creating job seeker profile in callback for:', data.user.id)
              await supabase
                .from('job_seekers')
                .insert({
                  id: data.user.id,
                  name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                  email: data.user.email!,
                } as any)
            }
          } else if (finalUserType === 'company') {
            const { data: existingProfile } = await supabase
              .from('companies')
              .select('id')
              .eq('id', data.user.id)
              .maybeSingle()

            if (!existingProfile) {
              console.log('Creating company profile in callback for:', data.user.id)
              await supabase
                .from('companies')
                .insert({
                  id: data.user.id,
                  company_name: data.user.user_metadata?.company_name || data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Company',
                  email: data.user.email!,
                  subscription_status: 'trial' as const,
                } as any)
            }
          }
        } catch (error) {
          console.error('Error creating profile in callback:', error)
        }
      }
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}