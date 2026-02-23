'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Users, 
  Building, 
  Briefcase, 
  GraduationCap, 
  Heart,
  Star,
  Globe,
  DollarSign,
  Clock,
  RotateCw,
  Eye,
  Home,
  Target
} from 'lucide-react'

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

interface SwipeCardProps {
  vacancy?: JobVacancy
  profile?: Profile
  userType: 'job_seeker' | 'company'
  onSwipe: (type: 'like' | 'pass') => void
  disabled?: boolean
}

export default function SwipeCard({ vacancy, profile, userType, onSwipe, disabled }: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return
    setDragOffset(e.clientX - window.innerWidth / 2)
  }

  const handleMouseUp = () => {
    if (!isDragging || disabled) return
    setIsDragging(false)
    
    if (Math.abs(dragOffset) > 100) {
      onSwipe(dragOffset > 0 ? 'like' : 'pass')
    }
    
    setDragOffset(0)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  // Job Seeker swiping on vacancies
  if (userType === 'job_seeker' && vacancy) {
    return (
      <div className="relative h-full w-full perspective-1000">
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translateX(${dragOffset}px) rotateZ(${dragOffset / 10}deg) ${isFlipped ? 'rotateY(180deg)' : ''}`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Front Side - Job Vacancy */}
          <Card className={`absolute inset-0 cursor-grab active:cursor-grabbing backface-hidden ${
            isDragging ? 'shadow-2xl scale-105' : 'hover:shadow-lg'
          }`}>
            <CardContent className="p-6 h-full flex flex-col">
              {/* Header with flip button */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{vacancy.title}</h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="font-medium">{vacancy.company.company_name}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlip}
                  className="shrink-0 ml-2"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Job Details */}
              <div className="space-y-4 flex-1">
                {/* Location and Remote */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{vacancy.location}</span>
                  </div>
                  {vacancy.remote_work && (
                    <Badge variant="secondary" className="text-xs">
                      <Home className="h-3 w-3 mr-1" />
                      Remote
                    </Badge>
                  )}
                </div>

                {/* Employment Type & Experience */}
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    <Clock className="h-3 w-3 mr-1" />
                    {vacancy.employment_type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    <Star className="h-3 w-3 mr-1" />
                    {vacancy.experience_level}
                  </Badge>
                </div>

                {/* Salary */}
                {vacancy.salary_range && (
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{vacancy.salary_range}</span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About the Role</h3>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                    {vacancy.description}
                  </p>
                </div>

                {/* Required Skills */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {vacancy.skills_required.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {vacancy.skills_required.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{vacancy.skills_required.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
                  <div className="flex flex-wrap gap-1">
                    {vacancy.benefits.slice(0, 4).map((benefit, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                    {vacancy.benefits.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{vacancy.benefits.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  Swipe right to apply • Swipe left to pass • Tap <RotateCw className="h-3 w-3 inline mx-1" /> to see company info
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back Side - Company Information */}
          <Card className="absolute inset-0 cursor-grab active:cursor-grabbing backface-hidden rotate-y-180">
            <CardContent className="p-6 h-full flex flex-col">
              {/* Header with flip button */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{vacancy.company.company_name}</h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>{vacancy.company.industry}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFlip}
                  className="shrink-0 ml-2"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Company Details */}
              <div className="space-y-4 flex-1">
                {/* Location and Size */}
                <div className="flex gap-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{vacancy.company.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm">{vacancy.company.company_size} employees</span>
                  </div>
                </div>

                {/* Company Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About the Company</h3>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-6">
                    {vacancy.company.description}
                  </p>
                </div>

                {/* Company Culture */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Company Culture
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {vacancy.company.culture}
                  </p>
                </div>

                {/* Company Benefits */}
                {vacancy.company.benefits && vacancy.company.benefits.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Company Benefits</h3>
                    <div className="flex flex-wrap gap-1">
                      {vacancy.company.benefits.slice(0, 6).map((benefit, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                      {vacancy.company.benefits.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{vacancy.company.benefits.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  Swipe right to apply • Swipe left to pass • Tap <RotateCw className="h-3 w-3 inline mx-1" /> to see job details
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Company swiping on job seekers (existing functionality)
  if (userType === 'company' && profile) {
    return (
      <div className="relative h-full w-full">
        <Card className={`w-full h-full cursor-grab active:cursor-grabbing ${
          isDragging ? 'shadow-2xl scale-105' : 'hover:shadow-lg'
        }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translateX(${dragOffset}px) rotateZ(${dragOffset / 10}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <CardContent className="p-6 h-full flex flex-col">
            {/* Job Seeker Profile Content */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {profile.name?.charAt(0).toUpperCase() || 'JS'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
              {profile.address && (
                <div className="flex items-center justify-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{profile.address}</span>
                </div>
              )}
            </div>

            <div className="space-y-4 flex-1">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Experience & Education */}
              <div className="grid grid-cols-1 gap-4">
                {profile.experience && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Experience
                    </h3>
                    <p className="text-gray-700 text-sm">{profile.experience}</p>
                  </div>
                )}

                {profile.education && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Education
                    </h3>
                    <p className="text-gray-700 text-sm">{profile.education}</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Personality */}
              {profile.personality && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Personality
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {profile.personality}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                Swipe right to connect • Swipe left to pass
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

// CSS classes for flip animation (add to global CSS)
const styles = `
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`