'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Users, Building, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { handleAuthError } from '@/lib/auth-error-handler'

interface Match {
  id: string
  job_seeker_id: string
  company_id: string
  matched_at: string
  is_active: boolean
  job_seeker?: {
    name: string
    bio?: string
    skills?: string[]
    address?: string
  }
  company?: {
    company_name: string
    description?: string
    industry?: string
    location?: string
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'job_seeker' | 'company' | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      // Handle authentication errors (invalid refresh token, etc.)
      if (authError) {
        console.error('Authentication error:', authError)
        // Clear any invalid session data
        await supabase.auth.signOut()
        router.push('/login')
        return
      }
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Determine user type
      const { data: jobSeeker } = await supabase
        .from('job_seekers')
        .select('id')
        .eq('id', user.id)
        .single()

      if (jobSeeker) {
        setUserType('job_seeker')
        await loadJobSeekerMatches(user.id)
      } else {
        setUserType('company')
        await loadCompanyMatches(user.id)
      }
    } catch (error: any) {
      console.error('Error initializing dashboard:', error)
      
      // Use the auth error handler
      const handled = await handleAuthError(error, router)
      if (!handled) {
        // For other errors, show a generic error but don't redirect
        console.error('Dashboard initialization failed:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadJobSeekerMatches = async (userId: string) => {
    try {
      console.log('Loading job seeker matches for user:', userId)
      
      // Simplified approach: get matches first, then get company details separately
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('job_seeker_id', userId)
        .eq('is_active', true)
        .order('matched_at', { ascending: false })

      console.log('Matches query result:', { data: matchesData, error: matchesError })

      if (matchesError) {
        console.error('Matches query error:', matchesError)
        throw matchesError
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('No matches found')
        setMatches([])
        return
      }

      // Get company details for each match
      const companyIds = matchesData.map((match: any) => match.company_id)
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name, description, industry, location')
        .in('id', companyIds)

      console.log('Companies query result:', { data: companiesData, error: companiesError })

      if (companiesError) {
        console.error('Companies query error:', companiesError)
        throw companiesError
      }

      // Combine matches with company data
      const formattedMatches = matchesData.map((match: any) => {
        const company = companiesData?.find((c: any) => c.id === match.company_id)
        return {
          ...match,
          company
        }
      })

      console.log('Formatted matches:', formattedMatches)
      setMatches(formattedMatches)
    } catch (error) {
      console.error('Error loading job seeker matches:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    }
  }

  const loadCompanyMatches = async (userId: string) => {
    try {
      console.log('Loading company matches for user:', userId)
      
      // Simplified approach: get matches first, then get job seeker details separately
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('company_id', userId)
        .eq('is_active', true)
        .order('matched_at', { ascending: false })

      console.log('Company matches query result:', { data: matchesData, error: matchesError })

      if (matchesError) {
        console.error('Company matches query error:', matchesError)
        throw matchesError
      }

      if (!matchesData || matchesData.length === 0) {
        console.log('No company matches found')
        setMatches([])
        return
      }

      // Get job seeker details for each match
      const jobSeekerIds = matchesData.map((match: any) => match.job_seeker_id)
      const { data: jobSeekersData, error: jobSeekersError } = await supabase
        .from('job_seekers')
        .select('id, name, bio, skills, address')
        .in('id', jobSeekerIds)

      console.log('Job seekers query result:', { data: jobSeekersData, error: jobSeekersError })

      if (jobSeekersError) {
        console.error('Job seekers query error:', jobSeekersError)
        throw jobSeekersError
      }

      // Combine matches with job seeker data
      const formattedMatches = matchesData.map((match: any) => {
        const jobSeeker = jobSeekersData?.find((js: any) => js.id === match.job_seeker_id)
        return {
          ...match,
          job_seeker: jobSeeker
        }
      })

      console.log('Formatted company matches:', formattedMatches)
      setMatches(formattedMatches)
    } catch (error) {
      console.error('Error loading company matches:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading dashboard...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              {userType === 'job_seeker' 
                ? 'Your company matches and opportunities' 
                : 'Your talent matches and candidates'
              }
            </p>
          </div>
          <div className="flex gap-3">
            {userType === 'company' && (
              <Link href="/vacancies?create=true">
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Vacancy
                </Button>
              </Link>
            )}
            <Link href="/swipe">
              <Button className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Continue Swiping
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
                <p className="text-sm text-gray-600">Total Matches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <MessageCircle className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Active Chats</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              {userType === 'job_seeker' ? (
                <Building className="h-8 w-8 text-green-500 mr-4" />
              ) : (
                <Users className="h-8 w-8 text-purple-500 mr-4" />
              )}
              <div>
                <p className="text-2xl font-bold text-gray-900">{matches.filter(m => new Date(m.matched_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Your Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No matches yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start swiping to find your {userType === 'job_seeker' ? 'dream job' : 'ideal candidates'}!
                </p>
                <Link href="/swipe">
                  <Button>
                    <Heart className="h-4 w-4 mr-2" />
                    Start Swiping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {userType === 'job_seeker' 
                              ? match.company?.company_name 
                              : match.job_seeker?.name
                            }
                          </h3>
                          <p className="text-sm text-gray-600">
                            {userType === 'job_seeker' 
                              ? match.company?.location 
                              : match.job_seeker?.address
                            }
                          </p>
                        </div>
                        <div className="ml-2">
                          {userType === 'job_seeker' ? (
                            <Building className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Users className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                      </div>
                      
                      {userType === 'job_seeker' && match.company?.industry && (
                        <Badge variant="secondary" className="mb-2">
                          {match.company.industry}
                        </Badge>
                      )}
                      
                      {userType === 'company' && match.job_seeker?.skills && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1">
                            {match.job_seeker.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {match.job_seeker.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{match.job_seeker.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {userType === 'job_seeker' 
                          ? match.company?.description 
                          : match.job_seeker?.bio
                        }
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(match.matched_at).toLocaleDateString()}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const partnerId = userType === 'job_seeker' 
                              ? match.company_id 
                              : match.job_seeker_id
                            router.push(`/chat/${partnerId}`)
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}