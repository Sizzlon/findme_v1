'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Eye, Edit, Trash2, MapPin, DollarSign, Users, Building, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

interface JobVacancy {
  id: string
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  salary_range: string
  employment_type: string
  experience_level: string
  location: string
  remote_work: boolean
  skills_required: string[]
  benefits: string[]
  department: string
  is_active: boolean
  applications_count: number
  views_count: number
  created_at: string
}

export default function CompanyVacancies() {
  const [vacancies, setVacancies] = useState<JobVacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingVacancy, setEditingVacancy] = useState<JobVacancy | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false) // Prevent concurrent submissions
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salary_range: '',
    employment_type: 'full-time',
    experience_level: 'mid',
    location: '',
    remote_work: false,
    skills_required: '',
    benefits: '',
    department: ''
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadVacancies()
  }, []) // Only run on mount

  useEffect(() => {
    // Check if create modal should be opened from query parameter
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
    }
  }, [searchParams])

  const loadVacancies = async () => {
    try {
      setLoading(true) // Add loading state to prevent multiple concurrent calls
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: vacancies, error } = await supabase
        .from('job_vacancies')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setVacancies(vacancies || [])
    } catch (error) {
      console.error('Error loading vacancies:', error)
      toast.error('Failed to load job vacancies')
    } finally {
      setLoading(false)
    }
  }

  const toggleVacancyStatus = async (vacancyId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('job_vacancies')
        .update({ is_active: !currentStatus })
        .eq('id', vacancyId)

      if (error) throw error

      setVacancies(vacancies.map(v => 
        v.id === vacancyId ? { ...v, is_active: !currentStatus } : v
      ))

      toast.success(`Job vacancy ${!currentStatus ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating vacancy status:', error)
      toast.error('Failed to update vacancy status')
    }
  }

  const deleteVacancy = async (vacancyId: string) => {
    if (!confirm('Are you sure you want to delete this job vacancy?')) return

    try {
      const { error } = await supabase
        .from('job_vacancies')
        .delete()
        .eq('id', vacancyId)

      if (error) throw error

      setVacancies(vacancies.filter(v => v.id !== vacancyId))
      toast.success('Job vacancy deleted')
    } catch (error) {
      console.error('Error deleting vacancy:', error)
      toast.error('Failed to delete vacancy')
    }
  }

  const handleCreateVacancy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormSubmitting) return // Prevent concurrent submissions
    
    setCreateLoading(true)
    setIsFormSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to create a vacancy')
        return
      }

      const vacancyData = {
        company_id: user.id,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        salary_range: formData.salary_range,
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        location: formData.location,
        remote_work: formData.remote_work,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
        benefits: formData.benefits.split(',').map(s => s.trim()).filter(s => s),
        department: formData.department,
        is_active: true,
        applications_count: 0
      }

      const { error } = await (supabase as any)
        .from('job_vacancies')
        .insert([vacancyData])

      if (error) throw error

      toast.success('Job vacancy created successfully!')
      setShowCreateModal(false)
      
      // Reset form data
      setFormData({
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        salary_range: '',
        employment_type: 'full-time',
        experience_level: 'mid',
        location: '',
        remote_work: false,
        skills_required: '',
        benefits: '',
        department: ''
      })
      
      // Reload vacancies after a small delay to avoid state conflicts
      setTimeout(() => {
        loadVacancies()
      }, 100)
      
      // Clear the query parameter without causing navigation conflicts
      if (searchParams.get('create') === 'true') {
        window.history.replaceState({}, '', '/vacancies')
      }
    } catch (error) {
      console.error('Error creating vacancy:', error)
      toast.error('Failed to create vacancy')
    } finally {
      setCreateLoading(false)
      setIsFormSubmitting(false)
    }
  }

  const handleEditVacancy = (vacancy: JobVacancy) => {
    setEditingVacancy(vacancy)
    setFormData({
      title: vacancy.title,
      description: vacancy.description || '',
      requirements: vacancy.requirements || '',
      responsibilities: vacancy.responsibilities || '',
      salary_range: vacancy.salary_range || '',
      employment_type: vacancy.employment_type,
      experience_level: vacancy.experience_level,
      location: vacancy.location || '',
      remote_work: vacancy.remote_work,
      skills_required: vacancy.skills_required?.join(', ') || '',
      benefits: vacancy.benefits?.join(', ') || '',
      department: vacancy.department || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateVacancy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVacancy || isFormSubmitting) return // Prevent concurrent submissions
    
    setEditLoading(true)
    setIsFormSubmitting(true)

    try {
      const vacancyData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        salary_range: formData.salary_range,
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        location: formData.location,
        remote_work: formData.remote_work,
        skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(s => s),
        benefits: formData.benefits.split(',').map(s => s.trim()).filter(s => s),
        department: formData.department,
        updated_at: new Date().toISOString()
      }

      const { error } = await (supabase as any)
        .from('job_vacancies')
        .update(vacancyData)
        .eq('id', editingVacancy.id)

      if (error) throw error

      toast.success('Job vacancy updated successfully!')
      setShowEditModal(false)
      setEditingVacancy(null)
      
      // Reset form data
      setFormData({
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        salary_range: '',
        employment_type: 'full-time',
        experience_level: 'mid',
        location: '',
        remote_work: false,
        skills_required: '',
        benefits: '',
        department: ''
      })
      
      // Reload vacancies after a small delay to avoid state conflicts
      setTimeout(() => {
        loadVacancies()
      }, 100)
    } catch (error) {
      console.error('Error updating vacancy:', error)
      toast.error('Failed to update vacancy')
    } finally {
      setEditLoading(false)
      setIsFormSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading vacancies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Vacancies</h1>
            <p className="text-gray-600">Manage your company's job postings</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Vacancy
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vacancies</p>
                  <p className="text-2xl font-bold text-gray-900">{vacancies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vacancies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vacancies.filter(v => v.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vacancies.reduce((sum, v) => sum + v.applications_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vacancies.reduce((sum, v) => sum + v.views_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vacancies List */}
        {vacancies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Vacancies</h3>
              <p className="text-gray-600 mb-6">Start by creating your first job posting to attract talent.</p>
              <Button onClick={() => router.push('/vacancies/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Vacancy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vacancies.map((vacancy) => (
              <Card key={vacancy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {vacancy.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {vacancy.location}
                        </div>
                        {vacancy.remote_work && (
                          <Badge variant="secondary">Remote</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={vacancy.is_active ? 'default' : 'secondary'}>
                        {vacancy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Employment Details */}
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {vacancy.employment_type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {vacancy.experience_level}
                      </Badge>
                      <Badge variant="outline">
                        {vacancy.department}
                      </Badge>
                    </div>

                    {/* Salary */}
                    {vacancy.salary_range && (
                      <div className="flex items-center text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {vacancy.salary_range}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {vacancy.description}
                    </p>

                    {/* Skills */}
                    <div>
                      <div className="flex flex-wrap gap-1">
                        {vacancy.skills_required.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {vacancy.skills_required.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{vacancy.skills_required.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{vacancy.applications_count} applications</span>
                      <span>{vacancy.views_count} views</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVacancy(vacancy)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVacancyStatus(vacancy.id, vacancy.is_active)}
                        className="flex-1"
                      >
                        {vacancy.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteVacancy(vacancy.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Vacancy Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job Vacancy</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateVacancy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Engineering"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => setFormData({...formData, employment_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData({...formData, experience_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g. $80,000 - $120,000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remote_work"
                  checked={formData.remote_work}
                  onCheckedChange={(checked) => setFormData({...formData, remote_work: checked})}
                />
                <Label htmlFor="remote_work">Remote Work Available</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role, company culture, and what makes this position exciting..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                placeholder="List the key responsibilities and day-to-day tasks..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                placeholder="List the required qualifications, skills, and experience..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="skills_required">Required Skills (comma-separated)</Label>
              <Input
                id="skills_required"
                value={formData.skills_required}
                onChange={(e) => setFormData({...formData, skills_required: e.target.value})}
                placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              />
            </div>

            <div>
              <Label htmlFor="benefits">Benefits (comma-separated)</Label>
              <Input
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                placeholder="e.g. Health insurance, 401k, Flexible PTO, Remote work"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading || isFormSubmitting}>
                {createLoading ? 'Creating...' : 'Create Vacancy'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vacancy Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Vacancy</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateVacancy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-title">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Engineering"
                />
              </div>

              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="edit-employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => setFormData({...formData, employment_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData({...formData, experience_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-salary_range">Salary Range</Label>
                <Input
                  id="edit-salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g. $80,000 - $120,000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-remote_work"
                  checked={formData.remote_work}
                  onCheckedChange={(checked) => setFormData({...formData, remote_work: checked})}
                />
                <Label htmlFor="edit-remote_work">Remote Work Available</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role, company culture, and what makes this position exciting..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-responsibilities">Responsibilities</Label>
              <Textarea
                id="edit-responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                placeholder="List the key responsibilities and day-to-day tasks..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-requirements">Requirements</Label>
              <Textarea
                id="edit-requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                placeholder="List the required qualifications, skills, and experience..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-skills_required">Required Skills (comma-separated)</Label>
              <Input
                id="edit-skills_required"
                value={formData.skills_required}
                onChange={(e) => setFormData({...formData, skills_required: e.target.value})}
                placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              />
            </div>

            <div>
              <Label htmlFor="edit-benefits">Benefits (comma-separated)</Label>
              <Input
                id="edit-benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                placeholder="e.g. Health insurance, 401k, Flexible PTO, Remote work"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading || isFormSubmitting}>
                {editLoading ? 'Updating...' : 'Update Vacancy'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}