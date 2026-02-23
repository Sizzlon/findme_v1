'use client'

import { useSessionManager } from '@/lib/session-manager'

export function SessionManagerProvider({ children }: { children: React.ReactNode }) {
  useSessionManager()
  return <>{children}</>
}
