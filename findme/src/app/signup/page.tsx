'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SignupForm from '@/components/auth/SignupForm'
import { UserType } from '@/types'
import Link from 'next/link'
import { Users, Building2 } from 'lucide-react'

export default function SignupPage() {
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null)

  if (!selectedUserType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">FindMe</h1>
            <p className="text-gray-600">Choose your account type to get started</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => setSelectedUserType('job_seeker')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Job Seeker</CardTitle>
                <CardDescription className="text-sm">
                  Looking for your next opportunity? Create a profile and discover companies that match your values.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Browse company profiles</li>
                  <li>• Swipe on job opportunities</li>
                  <li>• Chat with matched companies</li>
                  <li>• Find culture-fit employers</li>
                </ul>
                <Button className="w-full mt-4">
                  Continue as Job Seeker
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={() => setSelectedUserType('company')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Company</CardTitle>
                <CardDescription className="text-sm">
                  Find the perfect candidates who align with your company culture and values.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Post job opportunities</li>
                  <li>• Review interested candidates</li>
                  <li>• Connect with talent</li>
                  <li>• Build your employer brand</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Continue as Company
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FindMe</h1>
          <p className="text-gray-600">Connect talent with opportunity</p>
        </div>
        
        <SignupForm userType={selectedUserType} />
        
        <div className="mt-6 text-center space-y-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedUserType(null)}
            className="text-sm text-gray-600"
          >
            ← Back to account type selection
          </Button>
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}