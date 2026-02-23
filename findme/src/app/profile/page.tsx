'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import JobSeekerProfile from '@/components/profile/JobSeekerProfile'
import CompanyProfile from '@/components/profile/CompanyProfile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { handleAuthError } from '@/lib/auth-utils'

export default function ProfilePage() {
  const [userType, setUserType] = useState<'job_seeker' | 'company' | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth error:', error)
          await handleAuthError(error, router)
          return
        }
        
        if (!user) {
          router.push('/login')
          return
        }

      setUser(user)

      // Add a small delay to ensure the profile creation has completed
      await new Promise(resolve => setTimeout(resolve, 500))

      try {
        // Check which table the user exists in to determine type
        console.log('Checking profile for user ID:', user.id)
        
        const { data: jobSeeker, error: jobSeekerError } = await supabase
          .from('job_seekers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        console.log('Job seeker check:', { jobSeeker, jobSeekerError })

        if (jobSeeker) {
          console.log('Found job seeker profile')
          setUserType('job_seeker')
        } else {
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          console.log('Company check:', { company, companyError })

          if (company) {
            console.log('Found company profile')
            setUserType('company')
          } else {
            // User doesn't have a profile - this shouldn't happen after proper signup
            console.error('No profile found for authenticated user')
            console.log('User ID:', user.id)
            console.log('User email:', user.email)
            
            // Let's also check if there are any profiles in the tables at all
            const { data: allJobSeekers } = await supabase
              .from('job_seekers')
              .select('id, email')
              .limit(5)
              
            const { data: allCompanies } = await supabase
              .from('companies')
              .select('id, email')
              .limit(5)
              
            console.log('Sample job seekers:', allJobSeekers)
            console.log('Sample companies:', allCompanies)
            
            // Try one more time after a longer delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const { data: retryCompany } = await supabase
              .from('companies')
              .select('*')
              .eq('id', user.id)
              .maybeSingle()
              
            if (retryCompany) {
              console.log('Found company profile on retry')
              setUserType('company')
            } else {
              // Still no profile - redirect to signup
              router.push('/signup')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking user type:', error)
        // Clear any invalid session and redirect to signup
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      setLoading(false)
    } catch (authError) {
      console.error('Authentication error:', authError)
      await handleAuthError(authError, router)
      setLoading(false)
    }
    }

    getUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Redirecting...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userType === 'job_seeker' ? (
        <JobSeekerProfile user={user} />
      ) : (
        <CompanyProfile user={user} />
      )}
    </div>
  )
}