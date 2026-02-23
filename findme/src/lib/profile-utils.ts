// Profile creation utilities for handling RLS-compliant user profiles
import { createClient } from '@/lib/supabase/client'

export async function createUserProfile(
  userId: string,
  userType: 'job_seeker' | 'company',
  formData: any
) {
  const supabase = createClient()

  try {
    if (userType === 'job_seeker') {
      const { error } = await supabase
        .from('job_seekers')
        .insert({
          id: userId,
          name: formData.name,
          email: formData.email,
        } as any)

      if (error) {
        console.error('Error creating job seeker profile:', error)
        throw new Error(`Failed to create job seeker profile: ${error.message}`)
      }
    } else {
      const { error } = await supabase
        .from('companies')
        .insert({
          id: userId,
          company_name: formData.companyName,
          email: formData.email,
          subscription_status: 'trial',
        } as any)

      if (error) {
        console.error('Error creating company profile:', error)
        throw new Error(`Failed to create company profile: ${error.message}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Profile creation error:', error)
    return { success: false, error }
  }
}

export async function checkUserProfile(userId: string) {
  const supabase = createClient()

  try {
    // Check if user exists in job_seekers table
    const { data: jobSeeker } = await supabase
      .from('job_seekers')
      .select('id')
      .eq('id', userId)
      .single()

    if (jobSeeker) {
      return { userType: 'job_seeker', hasProfile: true }
    }

    // Check if user exists in companies table
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', userId)
      .single()

    if (company) {
      return { userType: 'company', hasProfile: true }
    }

    return { userType: null, hasProfile: false }
  } catch (error) {
    console.error('Error checking user profile:', error)
    return { userType: null, hasProfile: false }
  }
}