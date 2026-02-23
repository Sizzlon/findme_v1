'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { UserType } from '@/types'

interface SignupFormProps {
  userType: UserType
}

export default function SignupForm({ userType }: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // Validate required fields based on user type
    if (userType === 'job_seeker' && !formData.name.trim()) {
      toast.error('Please enter your full name')
      return
    }

    if (userType === 'company' && !formData.companyName.trim()) {
      toast.error('Please enter your company name')
      return
    }

    setLoading(true)

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: userType,
            name: userType === 'job_seeker' ? formData.name : formData.companyName,
            company_name: userType === 'company' ? formData.companyName : undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?userType=${userType}&redirectTo=/profile`,
        },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        // Wait a moment for the session to be properly established
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if user has a session (for immediate profile creation)
        const { data: session } = await supabase.auth.getSession()
        console.log('Session after signup:', session?.session?.user?.id)
        console.log('Auth data user ID:', authData.user.id)
        console.log('Auth data session exists:', !!authData.session)
        console.log('Current session exists:', !!session?.session)
        
        // Check if we have an active session (either from signup or current)
        const hasActiveSession = session?.session || authData.session
        
        if (!hasActiveSession) {
          // No immediate session - email confirmation is required
          console.log('No immediate session - email confirmation required')
          toast.success('Please check your email to confirm your account!')
          router.push('/login')
          return
        }
        
        console.log('Active session found - proceeding with profile creation')

        // Create profile based on user type
        try {
          if (userType === 'job_seeker') {
            console.log('Creating job seeker profile for:', authData.user.id)
            console.log('Form data:', { name: formData.name, email: formData.email })
            
            const { data: insertData, error: profileError } = await supabase
              .from('job_seekers')
              .insert({
                id: authData.user.id,
                name: formData.name,
                email: formData.email,
              } as any)
              .select()

            console.log('Job seeker insert result:', { insertData, profileError })

            if (profileError) {
              console.error('Error creating job seeker profile:', profileError)
              toast.error(`Profile creation failed: ${profileError.message}`)
              // Don't redirect - let user try again
              setLoading(false)
              return
            }
          } else {
            console.log('Creating company profile for:', authData.user.id)
            console.log('Form data:', { companyName: formData.companyName, email: formData.email })
            
            const { data: insertData, error: profileError } = await supabase
              .from('companies')
              .insert({
                id: authData.user.id,
                company_name: formData.companyName,
                email: formData.email,
                subscription_status: 'trial' as const,
              } as any)
              .select()

            console.log('Company insert result:', { insertData, profileError })

            if (profileError) {
              console.error('Error creating company profile:', profileError)
              toast.error(`Profile creation failed: ${profileError.message}`)
              // Don't redirect - let user try again
              setLoading(false)
              return
            }
          }

          toast.success('Account created successfully!')
          
          // Add a small delay to ensure profile creation is fully committed
          await new Promise(resolve => setTimeout(resolve, 500))
          
          router.push('/profile')
        } catch (error) {
          console.error('Unexpected error during profile creation:', error)
          toast.error('Profile creation failed. Please try again.')
          setLoading(false)
          return
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?userType=${userType}`,
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Create {userType === 'job_seeker' ? 'Job Seeker' : 'Company'} Account
        </CardTitle>
        <CardDescription>
          {userType === 'job_seeker' 
            ? 'Start your job search journey' 
            : 'Find the perfect candidates for your team'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">
              {userType === 'job_seeker' ? 'Full Name' : 'Company Name'}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={userType === 'job_seeker' ? 'Enter your full name' : 'Enter company name'}
              value={userType === 'job_seeker' ? formData.name : formData.companyName}
              onChange={(e) => 
                setFormData({ 
                  ...formData, 
                  [userType === 'job_seeker' ? 'name' : 'companyName']: e.target.value 
                })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full"
        >
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}