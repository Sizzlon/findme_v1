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
  Globe
} from 'lucide-react'

interface Profile {
  id: string
  name?: string
  company_name?: string
  bio?: string
  description?: string
  skills?: string[]
  preferences?: string[]
  benefits?: string[]
  location?: string
  address?: string
  culture?: string
  experience?: string
  education?: string
  personality?: string
  industry?: string
  company_size?: string
}

interface SwipeCardProps {
  profile: Profile
  userType: 'job_seeker' | 'company'
  onSwipe: (type: 'like' | 'pass') => void
  disabled?: boolean
}

export default function SwipeCard({ profile, userType, onSwipe, disabled }: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const offset = e.clientX - centerX
    setDragOffset(Math.max(-100, Math.min(100, offset)))
  }

  const handleMouseUp = () => {
    if (!isDragging || disabled) return
    
    if (Math.abs(dragOffset) > 50) {
      onSwipe(dragOffset > 0 ? 'like' : 'pass')
    }
    
    setIsDragging(false)
    setDragOffset(0)
  }

  const displayName = profile.company_name || profile.name || 'Unknown'
  const displayLocation = profile.location || profile.address || 'Location not specified'

  const getCardStyle = () => {
    if (!isDragging) return {}
    
    const rotation = dragOffset * 0.1
    const opacity = Math.max(0.7, 1 - Math.abs(dragOffset) / 100)
    
    return {
      transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
      opacity,
      transition: 'none'
    }
  }

  const getOverlayStyle = () => {
    if (Math.abs(dragOffset) < 20) return { opacity: 0 }
    
    const opacity = Math.min(0.8, Math.abs(dragOffset) / 100)
    return { opacity }
  }

  return (
    <div className="relative w-full h-full">
      <Card
        className={`w-full h-full cursor-grab active:cursor-grabbing transition-all duration-300 shadow-xl ${
          disabled ? 'pointer-events-none' : ''
        }`}
        style={getCardStyle()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Swipe Overlays */}
        {isDragging && dragOffset > 20 && (
          <div 
            className="absolute inset-0 bg-green-500 rounded-lg flex items-center justify-center z-10"
            style={getOverlayStyle()}
          >
            <div className="text-white text-6xl font-bold transform rotate-12">
              <Heart className="h-20 w-20" />
            </div>
          </div>
        )}
        
        {isDragging && dragOffset < -20 && (
          <div 
            className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-center z-10"
            style={getOverlayStyle()}
          >
            <div className="text-white text-6xl font-bold transform -rotate-12">
              PASS
            </div>
          </div>
        )}

        <CardContent className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {displayName}
              </h2>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{displayLocation}</span>
              </div>
            </div>
            <div className="ml-4">
              {userType === 'job_seeker' ? (
                <Building className="h-8 w-8 text-blue-600" />
              ) : (
                <Users className="h-8 w-8 text-purple-600" />
              )}
            </div>
          </div>

          {/* Company-specific content */}
          {userType === 'job_seeker' && (
            <div className="flex-1 space-y-4">
              {profile.industry && (
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {profile.industry}
                  </Badge>
                  {profile.company_size && (
                    <Badge variant="outline" className="ml-2">
                      {profile.company_size}
                    </Badge>
                  )}
                </div>
              )}

              {profile.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    About the Company
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {profile.description}
                  </p>
                </div>
              )}

              {profile.culture && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Company Culture
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {profile.culture}
                  </p>
                </div>
              )}

              {profile.benefits && profile.benefits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Benefits
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.benefits.slice(0, 6).map((benefit, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                    {profile.benefits.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.benefits.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Job seeker-specific content */}
          {userType === 'company' && (
            <div className="flex-1 space-y-4">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    About Me
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile.experience && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Experience
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {profile.experience}
                  </p>
                </div>
              )}

              {profile.education && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Education
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {profile.education}
                  </p>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 8).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.skills.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {profile.preferences && profile.preferences.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Preferences
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.preferences.slice(0, 4).map((pref, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                    {profile.preferences.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.preferences.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

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
          )}

          {/* Footer Instructions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Swipe right to like • Swipe left to pass
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}