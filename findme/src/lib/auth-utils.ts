import { createClient } from '@/lib/supabase/client'

/**
 * Clear invalid auth session and redirect to login
 * Use this when encountering "Invalid Refresh Token" errors
 */
export const clearInvalidSession = async (router?: any) => {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
    
    // Clear local storage items related to Supabase
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    if (router) {
      router.push('/login')
    }
  } catch (error) {
    console.error('Error clearing session:', error)
    if (router) {
      router.push('/login')
    }
  }
}

/**
 * Handle auth errors gracefully
 */
export const handleAuthError = async (error: any, router?: any) => {
  console.error('Auth error:', error)
  
  // Check if it's a refresh token error
  if (error.message?.includes('refresh') || error.message?.includes('token')) {
    await clearInvalidSession(router)
    return
  }
  
  // For other auth errors, just log them
  console.error('Authentication error:', error)
}