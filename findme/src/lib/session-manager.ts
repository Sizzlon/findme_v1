'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Hook to handle multi-tab session conflicts
 * Detects when the auth session changes and refreshes the page
 */
export function useSessionManager() {
  const router = useRouter()
  const currentUserIdRef = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Store the initial user ID
    const initializeUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserIdRef.current = user?.id || null
    }
    initializeUserId()

    // Check session when tab becomes visible
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const { data: { user } } = await supabase.auth.getUser()
        const newUserId = user?.id || null

        // If user ID changed, session was switched in another tab
        if (currentUserIdRef.current && newUserId && currentUserIdRef.current !== newUserId) {
          console.log('Session changed in another tab, redirecting to login...')
          // Clear the session and redirect
          await supabase.auth.signOut()
          router.push('/login')
          return
        }

        // If we had a user but now don't, we were logged out elsewhere
        if (currentUserIdRef.current && !newUserId) {
          console.log('Logged out in another tab, redirecting...')
          router.push('/login')
          return
        }

        // Update current user reference
        currentUserIdRef.current = newUserId
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          currentUserIdRef.current = null
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const newUserId = session?.user?.id || null
          
          // If user changed, force page reload
          if (currentUserIdRef.current && newUserId && currentUserIdRef.current !== newUserId) {
            console.log('User changed, forcing page reload...')
            window.location.href = '/dashboard'
          } else {
            currentUserIdRef.current = newUserId
          }
        }
      }
    )

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      subscription.unsubscribe()
    }
  }, [router, supabase])
}
