'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, User, Briefcase, Plus, X } from 'lucide-react'
import { toast } from '@/lib/toast'

const jobSeekerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  preferences: z.array(z.string()).optional(),
  personality: z.string().optional()
})

type JobSeekerFormData = z.infer<typeof jobSeekerSchema>

interface JobSeekerProfileProps {
  user: any
}

const commonSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'Go',
  'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
  'Git', 'Agile', 'Scrum', 'Project Management', 'Leadership', 'Communication'
]

const commonPreferences = [
  'Remote work', 'Flexible hours', 'Startup environment', 'Corporate culture',
  'Work-life balance', 'Growth opportunities', 'Team collaboration', 'Innovation',
  'Learning opportunities', 'Competitive salary', 'Health benefits', 'Stock options'
]

export default function JobSeekerProfile({ user }: JobSeekerProfileProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [skillInput, setSkillInput] = useState('')
  const [preferenceInput, setPreferenceInput] = useState('')
  const supabase = createClient()

  const form = useForm<JobSeekerFormData>({
    resolver: zodResolver(jobSeekerSchema),
    defaultValues: {
      name: '',
      bio: '',
      experience: '',
      education: '',
      address: '',
      skills: [],
      preferences: [],
      personality: ''
    }
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('job_seekers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        return
      }

      if (data) {
        setProfile(data)
        form.reset({
          name: (data as any).name || '',
          bio: (data as any).bio || '',
          experience: (data as any).experience || '',
          education: (data as any).education || '',
          address: (data as any).address || '',
          skills: (data as any).skills || [],
          preferences: (data as any).preferences || [],
          personality: (data as any).personality || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: JobSeekerFormData) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('job_seekers')
        .upsert({
          id: user.id,
          email: user.email,
          ...data,
          updated_at: new Date().toISOString()
        } as any)

      if (error) throw error

      toast.success('Profile updated successfully!')
      setProfile({ ...profile, ...data })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (skill: string) => {
    const currentSkills = form.getValues('skills')
    if (skill && !currentSkills.includes(skill)) {
      form.setValue('skills', [...currentSkills, skill])
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills')
    form.setValue('skills', currentSkills.filter(skill => skill !== skillToRemove))
  }

  const addPreference = (preference: string) => {
    const current = form.getValues('preferences') || []
    if (preference && !current.includes(preference)) {
      form.setValue('preferences', [...current, preference])
    }
  }

  const removePreference = (preferenceToRemove: string) => {
    const current = form.getValues('preferences') || []
    form.setValue('preferences', current.filter(pref => pref !== preferenceToRemove))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Seeker Profile</h1>
          <p className="text-gray-600">
            Complete your profile to get better job matches
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Tell us about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell companies about yourself, your passion, and what drives you..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Share your story and what makes you unique.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personality</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Creative, Analytical, Team player" {...field} />
                      </FormControl>
                      <FormDescription>
                        Describe your work personality and style.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your experience and skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your work experience, previous roles, achievements..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your educational background, degrees, certifications..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Add your technical and soft skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill(skillInput)
                      setSkillInput('')
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    addSkill(skillInput)
                    setSkillInput('')
                  }}
                  variant="outline"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {commonSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => addSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.watch('skills').map((skill) => (
                  <Badge key={skill} variant="default" className="flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
              <CardDescription>
                What kind of work environment do you prefer?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a preference"
                  value={preferenceInput}
                  onChange={(e) => setPreferenceInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPreference(preferenceInput)
                      setPreferenceInput('')
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    addPreference(preferenceInput)
                    setPreferenceInput('')
                  }}
                  variant="outline"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Common preferences:</p>
                <div className="flex flex-wrap gap-2">
                  {commonPreferences.map((preference) => (
                    <Badge
                      key={preference}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => addPreference(preference)}
                    >
                      {preference}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(form.watch('preferences') || []).map((preference) => (
                  <Badge key={preference} variant="default" className="flex items-center gap-1">
                    {preference}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removePreference(preference)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}