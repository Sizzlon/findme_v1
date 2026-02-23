import { createClient } from '@/lib/supabase/client'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export const handleAuthError = async (error: any, router: AppRouterInstance) => {
  // Check if it's an authentication error
  if (
    error?.message?.includes('Invalid Refresh Token') || 
    error?.message?.includes('refresh_token_not_found') ||
    error?.message?.includes('invalid_grant') ||
    error?.name === 'AuthApiError'
  ) {
    console.log('Session expired or invalid, cleaning up and redirecting to login')
    
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (signOutError) {
      console.error('Error during sign out:', signOutError)
    }
    
    // Clear any stored session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
    }
    
    router.push('/login')
    return true
  }
  
  return false
}

export const withAuthErrorHandling = (fn: Function, router: AppRouterInstance) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handled = await handleAuthError(error, router)
      if (!handled) {
        throw error
      }
    }
  }
}