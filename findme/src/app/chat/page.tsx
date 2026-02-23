'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Conversation {
  partner_id: string
  partner_name: string
  last_message_text: string
  last_message_time: string
  unread_count: number
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - resetting')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    loadConversations()

    return () => clearTimeout(timeout)
  }, [])

  const loadConversations = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setLoading(false)
        router.push('/login')
        return
      }

      setUser(user)

      // Get conversation partners using the database function
      console.log('Attempting to load conversations for user:', user.id)
      const { data, error } = await supabase.rpc('get_conversation_partners', {
        user_id: user.id
      })

      console.log('RPC result:', { data, error })

      if (error) {
        console.error('Error loading conversations:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        
        // If the function doesn't exist, show a helpful message
        if (error.code === '42883' || error.message?.includes('does not exist')) {
          toast.error('Chat system not set up. Please run the database setup SQL.')
          console.error('SETUP REQUIRED: Please run create-chat-system.sql in Supabase SQL Editor')
        } else {
          toast.error('Failed to load conversations')
        }
        setConversations([])
      } else {
        setConversations(data || [])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load conversations')
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const openConversation = (partnerId: string) => {
    router.push(`/chat/${partnerId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Chat with your matches</p>
          </div>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h2>
              <p className="text-gray-600 mb-4">
                Start swiping and matching to begin conversations!
              </p>
              <Button onClick={() => router.push('/swipe')}>
                Start Swiping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.partner_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openConversation(conversation.partner_id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {conversation.partner_name.charAt(0).toUpperCase()}
                    </Avatar>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.partner_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {conversation.last_message_time && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_time)}
                            </span>
                          )}
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-blue-600">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message_text || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
