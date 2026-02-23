'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  is_read: boolean
}

interface PartnerInfo {
  id: string
  name?: string
  company_name?: string
}

export default function ConversationPage() {
  const params = useParams()
  const partnerId = params.partnerId as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [currentMessage, setCurrentMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadPartnerInfo = async () => {
    // Try job_seekers first
    const { data: jobSeeker } = await supabase
      .from('job_seekers')
      .select('id, name')
      .eq('id', partnerId)
      .single()

    if (jobSeeker) {
      setPartnerInfo(jobSeeker)
      return
    }

    // Try companies
    const { data: company } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('id', partnerId)
      .single()

    if (company) {
      setPartnerInfo(company)
    } else {
      setPartnerInfo({ id: partnerId, name: 'Unknown User' })
    }
  }

  const loadMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } else {
      setMessages(data || [])
      setTimeout(scrollToBottom, 100)
    }
  }

  const markMessagesAsRead = async () => {
    if (!user) return

    await supabase.rpc('mark_messages_as_read', {
      p_sender_id: partnerId,
      p_receiver_id: user.id
    })
  }

  const initializeChat = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setLoading(false)
        router.push('/login')
        return
      }

      setUser(user)

      // Load partner info
      await loadPartnerInfo()
      
      // Load messages
      await loadMessages(user.id)

      // Mark messages as read
      await markMessagesAsRead()
      
      setLoading(false)
    } catch (error) {
      console.error('Error initializing chat:', error)
      toast.error('Failed to load conversation')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - resetting')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    initializeChat()

    return () => clearTimeout(timeout)
  }, [partnerId])

  useEffect(() => {
    if (user && partnerId) {
      // Subscribe to new messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message
            if (newMessage.sender_id === partnerId) {
              setMessages((prev) => [...prev, newMessage])
              scrollToBottom()
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, partnerId])

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user || sending) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: partnerId,
          message: currentMessage.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        toast.error('Failed to send message')
      } else {
        setMessages((prev) => [...prev, data])
        setCurrentMessage('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const partnerName = partnerInfo?.name || partnerInfo?.company_name || 'Loading...'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b flex-row items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/chat')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {partnerName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">{partnerName}</h2>
            <p className="text-xs text-gray-500">Matched user</p>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(messages[index - 1].created_at) !== formatDate(message.created_at)
                const isOwnMessage = message.sender_id === user?.id

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !currentMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
