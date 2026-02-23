export interface Database {
  public: {
    Tables: {
      job_seekers: {
        Row: {
          id: string
          name: string
          email: string
          address: string | null
          preferences: string[] | null
          skills: string[] | null
          personality: string | null
          bio: string | null
          experience: string | null
          education: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          address?: string | null
          preferences?: string[] | null
          skills?: string[] | null
          personality?: string | null
          bio?: string | null
          experience?: string | null
          education?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          address?: string | null
          preferences?: string[] | null
          skills?: string[] | null
          personality?: string | null
          bio?: string | null
          experience?: string | null
          education?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          company_name: string
          email: string
          description: string | null
          culture: string | null
          benefits: string[] | null
          location: string | null
          website: string | null
          company_size: string | null
          industry: string | null
          logo_url: string | null
          subscription_status: 'active' | 'inactive' | 'trial'
          subscription_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          email: string
          description?: string | null
          culture?: string | null
          benefits?: string[] | null
          location?: string | null
          website?: string | null
          company_size?: string | null
          industry?: string | null
          logo_url?: string | null
          subscription_status?: 'active' | 'inactive' | 'trial'
          subscription_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          email?: string
          description?: string | null
          culture?: string | null
          benefits?: string[] | null
          location?: string | null
          website?: string | null
          company_size?: string | null
          industry?: string | null
          logo_url?: string | null
          subscription_status?: 'active' | 'inactive' | 'trial'
          subscription_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_vacancies: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          requirements: string | null
          responsibilities: string | null
          salary_range: string | null
          employment_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null
          experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'executive' | null
          location: string | null
          remote_work: boolean
          skills_required: string[] | null
          benefits: string[] | null
          department: string | null
          is_active: boolean
          applications_count: number
          posted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          employment_type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive' | null
          location?: string | null
          remote_work?: boolean
          skills_required?: string[] | null
          benefits?: string[] | null
          department?: string | null
          is_active?: boolean
          applications_count?: number
          posted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          employment_type?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null
          experience_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'executive' | null
          location?: string | null
          remote_work?: boolean
          skills_required?: string[] | null
          benefits?: string[] | null
          department?: string | null
          is_active?: boolean
          applications_count?: number
          posted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      vacancies: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string
          preferred_skills: string[] | null
          personality_preferred: string | null
          contact_person: string | null
          contact_email: string | null
          location: string | null
          job_type: 'full-time' | 'part-time' | 'contract' | 'internship'
          salary_range: string | null
          remote_policy: 'remote' | 'hybrid' | 'office'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description: string
          preferred_skills?: string[] | null
          personality_preferred?: string | null
          contact_person?: string | null
          contact_email?: string | null
          location?: string | null
          job_type?: 'full-time' | 'part-time' | 'contract' | 'internship'
          salary_range?: string | null
          remote_policy?: 'remote' | 'hybrid' | 'office'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string
          preferred_skills?: string[] | null
          personality_preferred?: string | null
          contact_person?: string | null
          contact_email?: string | null
          location?: string | null
          job_type?: 'full-time' | 'part-time' | 'contract' | 'internship'
          salary_range?: string | null
          remote_policy?: 'remote' | 'hybrid' | 'office'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          job_seeker_id: string
          company_id: string
          vacancy_id: string
          job_seeker_interested: boolean
          company_accepted: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_seeker_id: string
          company_id: string
          vacancy_id: string
          job_seeker_interested?: boolean
          company_accepted?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_seeker_id?: string
          company_id?: string
          vacancy_id?: string
          job_seeker_interested?: boolean
          company_accepted?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          sender_type: 'job_seeker' | 'company'
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          sender_type: 'job_seeker' | 'company'
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          sender_type?: 'job_seeker' | 'company'
          message?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}