'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SwipeCard from '@/components/swipe/SwipeCard'
import JobVacancySwipeCard from '@/components/swipe/JobVacancySwipeCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, X, RotateCcw, Loader2, Users } from 'lucide-react'
import { toast } from '@/lib/toast'
import { handleAuthError } from '@/lib/auth-error-handler'

interface JobVacancy {
  id: string
  title: string
  description: string
  requirements: string
  responsibilities: string
  salary_range: string
  employment_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'
  experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive'
  location: string
  remote_work: boolean
  skills_required: string[]
  benefits: string[]
  department: string
  company: {
    id: string
    company_name: string
    description: string
    industry: string
    location: string
    company_size: string
    culture: string
    benefits: string[]
  }
}

interface Profile {
  id: string
  name?: string
  bio?: string
  skills?: string[]
  address?: string
  experience?: string
  education?: string
  personality?: string
}

export default function SwipePage() {
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'job_seeker' | 'company' | null>(null)
  const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [matches, setMatches] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Save swipe session state to sessionStorage
  const saveSwipeState = (index: number, userId: string, type: string) => {
    if (typeof window !== 'undefined') {
      const sessionKey = `swipe_session_${userId}_${type}`
      sessionStorage.setItem(sessionKey, JSON.stringify({
        currentIndex: index,
        timestamp: Date.now()
      }))
    }
  }

  // Load swipe session state from sessionStorage
  const loadSwipeState = (userId: string, type: string): number => {
    if (typeof window !== 'undefined') {
      const sessionKey = `swipe_session_${userId}_${type}`
      const saved = sessionStorage.getItem(sessionKey)
      if (saved) {
        try {
          const { currentIndex, timestamp } = JSON.parse(saved)
          // Only restore if session is less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            return currentIndex
          }
        } catch (error) {
          console.error('Error loading swipe state:', error)
        }
      }
    }
    return 0
  }

  // Clear swipe session when all items are swiped
  const clearSwipeState = (userId: string, type: string) => {
    if (typeof window !== 'undefined') {
      const sessionKey = `swipe_session_${userId}_${type}`
      sessionStorage.removeItem(sessionKey)
    }
  }

  // Helper function to advance to next item and save state
  const advanceToNextItem = () => {
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    
    // Save swipe session state
    if (user && userType) {
      saveSwipeState(newIndex, user.id, userType)
      
      // Clear session if we've reached the end
      const isSwipingVacancies = userType === 'job_seeker'
      const totalItems = isSwipingVacancies ? jobVacancies.length : profiles.length
      if (newIndex >= totalItems) {
        clearSwipeState(user.id, userType)
      }
    }
  }

  useEffect(() => {
    initializeSwipeSession()
  }, [])

  const initializeSwipeSession = async () => {
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

      // Determine user type and load profiles
      const { data: jobSeeker } = await supabase
        .from('job_seekers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (jobSeeker) {
        setUserType('job_seeker')
        await loadJobVacancies(user.id)
      } else {
        setUserType('company')
        await loadJobSeekerProfiles(user.id)
      }

      // Load match count
      await loadMatchCount(user.id)
    } catch (error: any) {
      console.error('Error initializing swipe session:', error)
      
      // Use the auth error handler
      const handled = await handleAuthError(error, router)
      if (!handled) {
        toast.error('Failed to load profiles')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadJobVacancies = async (userId: string) => {
    try {
      console.log('Loading job vacancies for job seeker user:', userId)
      
      // First check if job_vacancies table exists
      const { data: tableCheck } = await supabase
        .from('job_vacancies')
        .select('id')
        .limit(1)

      if (!tableCheck) {
        console.warn('job_vacancies table does not exist. Please run add-job-vacancies.sql')
        toast.error('Job vacancies feature not set up. Please contact support.')
        setJobVacancies([])
        return
      }
      
      // Get all active job vacancies with company information
      const { data: allVacancies, error: vacanciesError } = await supabase
        .from('job_vacancies')
        .select(`
          *,
          company:companies (
            id,
            company_name,
            description,
            industry,
            location,
            company_size,
            culture,
            benefits
          )
        `)
        .eq('is_active', true) // Only active vacancies

      console.log('Job vacancies query result:', { data: allVacancies, error: vacanciesError })

      if (vacanciesError) {
        console.error('Job vacancies query error:', vacanciesError)
        toast.error('Failed to load job vacancies. Please ensure the database is properly set up.')
        setJobVacancies([])
        return
      }

      // Get user's LIKED swipes on vacancies to filter them out
      // We only exclude liked vacancies, allowing users to re-swipe on passed vacancies
      // Note: vacancy_id column might not exist in older database versions
      let userLikedSwipes: any[] = []
      let swipesError: any = null
      
      try {
        const { data, error } = await supabase
          .from('swipes')
          .select('vacancy_id, swipe_type')
          .eq('swiper_id', userId)
          .eq('swipe_type', 'like') // Only get liked swipes
          .not('vacancy_id', 'is', null) // Only swipes on vacancies

        userLikedSwipes = data || []
        swipesError = error
      } catch (error) {
        console.warn('Vacancy swipes query failed, probably vacancy_id column does not exist yet:', error)
        // If the column doesn't exist, just continue with empty swipes
        userLikedSwipes = []
        swipesError = null
      }

      console.log('User liked vacancy swipes query result:', { data: userLikedSwipes, error: swipesError })

      if (swipesError) {
        console.error('Vacancy swipes query error:', swipesError)
        throw swipesError
      }

      // Filter out only LIKED vacancies (allow re-swiping on passed vacancies)
      const likedVacancyIds = new Set(userLikedSwipes?.map((s: any) => s.vacancy_id) || [])
      const availableVacancies = (allVacancies as any || []).filter((vacancy: any) => 
        !likedVacancyIds.has(vacancy.id)
      ).slice(0, 20) // Limit to 20 vacancies

      console.log('Final availableVacancies (excluding only liked):', availableVacancies)
      
      if (availableVacancies.length === 0) {
        console.log('No job vacancies available')
        toast.error('No job vacancies available. Companies need to post jobs first.')
      }
      
      setJobVacancies(availableVacancies)
      
      // Restore saved swipe position for this session
      const savedIndex = loadSwipeState(userId, 'job_seeker')
      if (savedIndex > 0 && savedIndex < availableVacancies.length) {
        setCurrentIndex(savedIndex)
        console.log('Restored swipe position:', savedIndex)
      }
    } catch (error) {
      console.error('Error loading job vacancies:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Check if it's a table not found error
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message
        if (errorMessage?.includes('relation "job_vacancies" does not exist')) {
          toast.error('Job vacancies feature not set up. Please run the database migration first.')
          console.error('SETUP REQUIRED: Please run add-job-vacancies.sql to set up the job vacancies feature')
        } else {
          toast.error('Failed to load job vacancies')
        }
      } else {
        toast.error('Failed to load job vacancies')
      }
      
      setJobVacancies([])
    }
  }

  const loadJobSeekerProfiles = async (userId: string) => {
    try {
      console.log('Loading job seeker profiles for company user:', userId)
      
      // First get all job seekers
      const { data: allJobSeekers, error: jobSeekersError } = await supabase
        .from('job_seekers')
        .select('*')
        .neq('id', userId) // Exclude self

      console.log('Job seekers query result:', { data: allJobSeekers, error: jobSeekersError })

      if (jobSeekersError) {
        console.error('Job seekers query error:', jobSeekersError)
        throw jobSeekersError
      }

      // Then get user's LIKED swipes to filter them out (allow re-swiping on passed profiles)
      const { data: userSwipes, error: swipesError } = await supabase
        .from('swipes')
        .select('swiped_id, swipe_type')
        .eq('swiper_id', userId)
        .eq('swipe_type', 'like') // Only get liked swipes

      console.log('User liked swipes query result:', { data: userSwipes, error: swipesError })

      if (swipesError) {
        console.error('Swipes query error:', swipesError)
        throw swipesError
      }

      // Filter out only LIKED profiles (allow re-swiping on passed profiles)
      const likedProfileIds = new Set((userSwipes as any)?.map((s: any) => s.swiped_id) || [])
      const availableJobSeekers = (allJobSeekers as any || []).filter((jobSeeker: any) => 
        !likedProfileIds.has(jobSeeker.id)
      ).slice(0, 20) // Limit to 20 profiles

      console.log('Final availableJobSeekers (excluding only liked):', availableJobSeekers)
      setProfiles(availableJobSeekers)
      
      // Restore saved swipe position for this session
      const savedIndex = loadSwipeState(userId, 'company')
      if (savedIndex > 0 && savedIndex < availableJobSeekers.length) {
        setCurrentIndex(savedIndex)
        console.log('Restored swipe position:', savedIndex)
      }
    } catch (error) {
      console.error('Error loading job seeker profiles:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error('Failed to load job seeker profiles')
    }
  }

  const loadMatchCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact' })
        .or(`job_seeker_id.eq.${userId},company_id.eq.${userId}`)
        .eq('is_active', true)

      if (error) throw error
      setMatches(count || 0)
    } catch (error) {
      console.error('Error loading match count:', error)
    }
  }

  const handleSwipe = async (swipeType: 'like' | 'pass') => {
    console.log('🎯 handleSwipe called with:', swipeType)
    
    if (swiping || !user) {
      console.log('⚠️ Swipe blocked:', { swiping, hasUser: !!user })
      return
    }

    // Determine what we're swiping on
    const isSwipingVacancies = userType === 'job_seeker'
    const currentItem = isSwipingVacancies 
      ? (currentIndex >= jobVacancies.length ? null : jobVacancies[currentIndex])
      : (currentIndex >= profiles.length ? null : profiles[currentIndex])

    console.log('📊 Swipe context:', {
      userType,
      isSwipingVacancies,
      currentIndex,
      totalVacancies: jobVacancies.length,
      totalProfiles: profiles.length,
      currentItem: currentItem ? { id: currentItem.id, title: (currentItem as any).title || (currentItem as any).name } : null
    })

    if (!currentItem) {
      console.log('❌ No current item to swipe on')
      return
    }

    setSwiping(true)

    try {
      console.log('Recording swipe:', { swipeType, userId: user.id, itemId: currentItem.id, type: isSwipingVacancies ? 'vacancy' : 'profile' })
      
      // Prepare swipe data based on what we're swiping
      let swipeData: any
      
      console.log('Step 1: Preparing swipe data...')
      if (isSwipingVacancies) {
        console.log('Step 1a: Job seeker swiping on vacancy')
        const vacancy = currentItem as JobVacancy
        console.log('Step 1b: Vacancy company check:', { hasCompany: !!vacancy.company, companyId: vacancy.company?.id })
        
        // For job seekers swiping on vacancies - use both vacancy_id and swiped_id
        // vacancy_id for the specific vacancy, swiped_id for the company that posted it
        swipeData = {
          swiper_id: user.id,
          swiped_id: vacancy.company?.id, // Company that posted the vacancy
          vacancy_id: currentItem.id, // The specific vacancy being swiped on
          swipe_type: swipeType
        }
        console.log('Step 1c: Swipe data prepared:', swipeData)
      } else {
        console.log('Step 1a: Company swiping on job seeker')
        // For companies swiping on job seekers - only use swiped_id
        swipeData = {
          swiper_id: user.id,
          swiped_id: currentItem.id,
          swipe_type: swipeType
        }
        console.log('Step 1b: Swipe data prepared:', swipeData)
      }

      console.log('Step 2: Checking for existing swipe...')
      // Check if this exact swipe already exists
      // For vacancies, we need to check vacancy_id too since users can swipe on multiple vacancies from same company
      let existingSwipeQuery = supabase
        .from('swipes')
        .select('id, vacancy_id, swipe_type')
        .eq('swiper_id', user.id)
        .eq('swiped_id', swipeData.swiped_id)

      // If we're swiping on a vacancy and have vacancy_id, check for that specific vacancy
      if (isSwipingVacancies && swipeData.vacancy_id) {
        existingSwipeQuery = existingSwipeQuery.eq('vacancy_id', swipeData.vacancy_id)
      }

      console.log('Step 2a: Executing existing swipe query...')
      const { data: existingSwipe, error: checkError } = await existingSwipeQuery.maybeSingle()
      console.log('Step 2b: Query result:', { existingSwipe, checkError })

      if (existingSwipe) {
        console.log('Step 2c: Swipe already exists for this vacancy, skipping...')
        advanceToNextItem()
        return
      }

      if (checkError) {
        console.error('Step 2d: Error checking existing swipe:', checkError)
        // Continue anyway, let the insert handle any duplicate errors
      }
      console.log('Step 2e: No existing swipe found, proceeding with insert')

      // Record the swipe
      console.log('Step 3: Inserting swipe into database...')
      const { data: insertResult, error } = await supabase
        .from('swipes')
        .insert(swipeData)
        .select() // Return the inserted record for verification

      console.log('Step 3a: Insert result:', { insertResult, error })

      if (error) {
        console.error('Step 3b: Swipe insert error:', error)
        
        // Handle duplicate key error specifically
        if (error.code === '23505') {
          console.log('Step 3c: Duplicate swipe detected from insert, skipping...')
          advanceToNextItem()
          return
        }
        
        // If vacancy_id column doesn't exist, try without it
        if (error.message?.includes('vacancy_id') || error.code === '42703') {
          console.warn('vacancy_id column not found, trying without it')
          const fallbackData = {
            swiper_id: user.id,
            swiped_id: swipeData.swiped_id,
            swipe_type: swipeType
          }
          
          // Check if this fallback swipe already exists
          const { data: existingFallbackSwipe } = await supabase
            .from('swipes')
            .select('id')
            .eq('swiper_id', user.id)
            .eq('swiped_id', fallbackData.swiped_id)
            .single()

          if (existingFallbackSwipe) {
            console.log('Fallback swipe already exists, skipping...')
            advanceToNextItem()
            return
          }

          const { error: fallbackError } = await supabase
            .from('swipes')
            .insert(fallbackData as any)
          
          if (fallbackError) {
            // Handle duplicate key error in fallback as well
            if (fallbackError.code === '23505') {
              console.log('Duplicate fallback swipe detected, skipping...')
              advanceToNextItem()
              return
            }
            console.error('Fallback swipe insert error:', fallbackError)
            throw fallbackError
          }
        } else {
          throw error
        }
      }

      console.log('Step 4: Swipe recorded successfully')

      // Check if this created a match
      if (swipeType === 'like') {
        console.log('Step 5: Checking for mutual like...')
        
        if (isSwipingVacancies) {
          // For job seekers swiping on vacancies, check if the company liked them back
          const companyId = (currentItem as JobVacancy).company.id
          const { data: existingSwipe } = await supabase
            .from('swipes')
            .select('id')
            .eq('swiper_id', companyId)
            .eq('swiped_id', user.id)
            .eq('swipe_type', 'like')
            .single()

          if (existingSwipe) {
            console.log('Match found!')
            toast.success("🎉 It's a match!")
            setMatches(prev => prev + 1)
          }
        } else {
          // For companies swiping on job seekers (existing logic)
          const { data: existingSwipe } = await supabase
            .from('swipes')
            .select('id')
            .eq('swiper_id', currentItem.id)
            .eq('swiped_id', user.id)
            .eq('swipe_type', 'like')
            .single()

          if (existingSwipe) {
            console.log('Match found!')
            toast.success("🎉 It's a match!")
            setMatches(prev => prev + 1)
          }
        }
      }

      // Move to next item
      console.log('Step 6: Advancing to next item')
      advanceToNextItem()
      console.log('Step 7: Advanced to next item successfully')
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleSwipe:')
      console.error('Error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Stack trace:', (error as Error).stack)
      toast.error('Failed to record swipe')
      setSwiping(false)
    } finally {
      console.log('Step 8: Finally block - setting swiping to false')
      setSwiping(false)
    }
  }

  const resetSwipes = () => {
    setCurrentIndex(0)
    
    // Clear session state
    if (user && userType) {
      clearSwipeState(user.id, userType)
    }
    
    if (userType === 'job_seeker') {
      setJobVacancies([])
      loadJobVacancies(user.id)
      toast.success('Refreshed! Showing all available vacancies (excluding your likes)')
    } else {
      setProfiles([])
      loadJobSeekerProfiles(user.id)
      toast.success('Refreshed! Showing all available profiles (excluding your likes)')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading profiles...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
            <p className="text-gray-600 mb-4">
              Please complete your profile to start swiping
            </p>
            <Button 
              onClick={() => {
                // Add small delay to prevent navigation hanging
                setTimeout(() => {
                  router.push('/profile')
                }, 100)
              }}
            >
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine current item and availability based on user type
  const isSwipingVacancies = userType === 'job_seeker'
  const currentItem = isSwipingVacancies 
    ? jobVacancies[currentIndex]
    : profiles[currentIndex]
  const hasMoreItems = isSwipingVacancies 
    ? currentIndex < jobVacancies.length
    : currentIndex < profiles.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FindMe</h1>
            <p className="text-sm text-gray-600">
              {userType === 'job_seeker' ? 'Find Your Dream Job' : 'Find Great Talent'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-600">{matches}</span>
          </div>
        </div>

        {/* Swipe Area */}
        <div className="relative h-[600px] mb-6">
          {hasMoreItems ? (
            isSwipingVacancies ? (
              <JobVacancySwipeCard
                vacancy={currentItem as JobVacancy}
                userType={userType}
                onSwipe={handleSwipe}
                disabled={swiping}
              />
            ) : (
              <SwipeCard
                profile={currentItem as Profile}
                userType={userType}
                onSwipe={handleSwipe}
                disabled={swiping}
              />
            )
          ) : (
            <Card className="w-full h-full flex items-center justify-center">
              <CardContent className="text-center">
                <div className="mb-4">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No More {isSwipingVacancies ? 'Job Vacancies' : 'Profiles'}</h3>
                  <p className="text-gray-600 mb-4">
                    You've seen all available {userType === 'job_seeker' ? 'job vacancies' : 'job seekers'}!
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Check back later for new {isSwipingVacancies ? 'job postings' : 'profiles'}, or view your matches.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={resetSwipes} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reload {isSwipingVacancies ? 'Vacancies' : 'Profiles'}
                  </Button>
                  <Button 
                    onClick={() => {
                      // Add small delay to prevent navigation hanging
                      setTimeout(() => {
                        router.push('/dashboard')
                      }, 100)
                    }} 
                    className="w-full"
                  >
                    View Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        {hasMoreItems && (
          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-red-200 hover:bg-red-50"
              onClick={() => handleSwipe('pass')}
              disabled={swiping}
            >
              <X className="h-6 w-6 text-red-500" />
            </Button>
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
              onClick={() => handleSwipe('like')}
              disabled={swiping}
            >
              <Heart className="h-6 w-6 text-white" />
            </Button>
          </div>
        )}

        {/* Progress Indicator */}
        {hasMoreItems && (
          <div className="mt-6 bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600">
              {isSwipingVacancies ? 'Vacancy' : 'Profile'} {currentIndex + 1} of {isSwipingVacancies ? jobVacancies.length : profiles.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / (isSwipingVacancies ? jobVacancies.length : profiles.length)) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}