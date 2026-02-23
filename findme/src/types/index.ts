import { Database } from './database'

export type JobSeeker = Database['public']['Tables']['job_seekers']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Vacancy = Database['public']['Tables']['vacancies']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type JobSeekerInsert = Database['public']['Tables']['job_seekers']['Insert']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type VacancyInsert = Database['public']['Tables']['vacancies']['Insert']
export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']

export type JobSeekerUpdate = Database['public']['Tables']['job_seekers']['Update']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type VacancyUpdate = Database['public']['Tables']['vacancies']['Update']
export type MatchUpdate = Database['public']['Tables']['matches']['Update']

export type UserType = 'job_seeker' | 'company'

export interface VacancyWithCompany extends Vacancy {
  companies: Company
}

export interface MatchWithDetails extends Match {
  job_seekers: JobSeeker
  companies: Company
  vacancies: Vacancy
}

export interface MessageWithSender extends Message {
  sender_name?: string
}

export interface DashboardStats {
  totalMatches: number
  pendingApplications: number
  activeChats: number
  newNotifications: number
}

export interface SwipeCardData {
  id: string
  type: 'vacancy' | 'job_seeker'
  vacancy?: VacancyWithCompany
  jobSeeker?: JobSeeker
}