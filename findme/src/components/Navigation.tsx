'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User, LogOut, Heart, LayoutDashboard, Plus, Briefcase, MessageCircle } from 'lucide-react'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'job_seeker' | 'company' | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Determine user type
        const { data: jobSeeker } = await supabase
          .from('job_seekers')
          .select('id')
          .eq('id', user.id)
          .single()

        if (jobSeeker) {
          setUserType('job_seeker')
        } else {
          setUserType('company')
        }
      } else {
        setUserType(null)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const user = session?.user || null
        setUser(user)
        
        if (user) {
          // Determine user type
          const { data: jobSeeker } = await supabase
            .from('job_seekers')
            .select('id')
            .eq('id', user.id)
            .single()

          if (jobSeeker) {
            setUserType('job_seeker')
          } else {
            setUserType('company')
          }
        } else {
          setUserType(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserType(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Add small delay to prevent navigation hanging
    setTimeout(() => {
      router.push('/')
    }, 100)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              FindMe
            </Link>
            <div className="h-8 w-20"></div>
          </div>
        </div>
      </nav>
    )
  }

  if (loading) {
    return (
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              FindMe
            </Link>
            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            FindMe
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/swipe">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Swipe
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </Button>
                </Link>
                {userType === 'company' && (
                  <>
                    <Link href="/vacancies">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        My Vacancies
                      </Button>
                    </Link>
                    <Link href="/vacancies?create=true">
                      <Button size="sm" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4" />
                        Create Vacancy
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}