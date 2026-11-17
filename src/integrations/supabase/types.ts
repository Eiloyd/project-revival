export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ack_form_counters: {
        Row: {
          form_code: string
          form_name: string
          last_serial: number
        }
        Insert: {
          form_code: string
          form_name: string
          last_serial?: number
        }
        Update: {
          form_code?: string
          form_name?: string
          last_serial?: number
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          day: string
          id: string
          note: string
          request_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          day: string
          id?: string
          note?: string
          request_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          day?: string
          id?: string
          note?: string
          request_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string
          id?: string
        }
        Relationships: []
      }
      c_critical_write_context: {
        Row: {
          actor: string
          tx: number
        }
        Insert: {
          actor: string
          tx: number
        }
        Update: {
          actor?: string
          tx?: number
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          ack_number: string
          admin_notes: string
          coordinator_code: string | null
          coordinator_id: string | null
          created_at: string
          email: string
          id: string
          industry: string
          message: string
          name: string
          phone: string
          service: string
          status: string
        }
        Insert: {
          ack_number?: string
          admin_notes?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          email: string
          id?: string
          industry: string
          message: string
          name: string
          phone: string
          service: string
          status?: string
        }
        Update: {
          ack_number?: string
          admin_notes?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string
          message?: string
          name?: string
          phone?: string
          service?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinators: {
        Row: {
          active: boolean
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string
          phone: string
          referral_code: string
        }
        Insert: {
          active?: boolean
          city?: string
          created_at?: string
          email?: string
          full_name: string
          id?: string
          notes?: string
          phone?: string
          referral_code: string
        }
        Update: {
          active?: boolean
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string
          phone?: string
          referral_code?: string
        }
        Relationships: []
      }
      country_logos: {
        Row: {
          country: string
          file_path: string
          theme: string
          updated_at: string
        }
        Insert: {
          country: string
          file_path: string
          theme: string
          updated_at?: string
        }
        Update: {
          country?: string
          file_path?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_programme_fees: {
        Row: {
          amount: number | null
          country: string
          currency: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          country: string
          currency: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          country?: string
          currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      critical_changes: {
        Row: {
          code: string
          current: Json
          decided_at: string | null
          decided_by: string | null
          id: string
          kind: string
          note: string
          payload: Json
          requested_at: string
          requested_by: string
          status: string
          summary: string
          target: string
        }
        Insert: {
          code?: string
          current?: Json
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind: string
          note?: string
          payload: Json
          requested_at?: string
          requested_by: string
          status?: string
          summary?: string
          target: string
        }
        Update: {
          code?: string
          current?: Json
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind?: string
          note?: string
          payload?: Json
          requested_at?: string
          requested_by?: string
          status?: string
          summary?: string
          target?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          actor_id: string
          body: string
          created_at: string
          id: string
          kind: string
          lead_id: string | null
          owner_id: string
          ticket_id: string | null
        }
        Insert: {
          actor_id: string
          body?: string
          created_at?: string
          id?: string
          kind: string
          lead_id?: string | null
          owner_id: string
          ticket_id?: string | null
        }
        Update: {
          actor_id?: string
          body?: string
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string | null
          owner_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_collections: {
        Row: {
          amount: number
          code: string
          collected_on: string
          created_at: string
          id: string
          lead_id: string | null
          mode: string
          note: string
          owner_id: string
          payer_name: string
          recorded_by: string
          reference: string
          status: string
          verified_at: string | null
          verified_by: string | null
          verify_note: string
        }
        Insert: {
          amount: number
          code?: string
          collected_on: string
          created_at?: string
          id?: string
          lead_id?: string | null
          mode: string
          note?: string
          owner_id: string
          payer_name?: string
          recorded_by?: string
          reference?: string
          status?: string
          verified_at?: string | null
          verified_by?: string | null
          verify_note?: string
        }
        Update: {
          amount?: number
          code?: string
          collected_on?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          mode?: string
          note?: string
          owner_id?: string
          payer_name?: string
          recorded_by?: string
          reference?: string
          status?: string
          verified_at?: string | null
          verified_by?: string | null
          verify_note?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_collections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customers: {
        Row: {
          acknowledgement: string | null
          company: string
          created_at: string
          customer_code: string
          email: string
          full_name: string
          id: string
          owner_id: string | null
          phone: string
        }
        Insert: {
          acknowledgement?: string | null
          company?: string
          created_at?: string
          customer_code?: string
          email?: string
          full_name: string
          id?: string
          owner_id?: string | null
          phone?: string
        }
        Update: {
          acknowledgement?: string | null
          company?: string
          created_at?: string
          customer_code?: string
          email?: string
          full_name?: string
          id?: string
          owner_id?: string | null
          phone?: string
        }
        Relationships: []
      }
      crm_employee_profiles: {
        Row: {
          designation: string
          employee_code: string
          full_name: string
          joining_date: string
          phone: string
          photo_url: string | null
          user_id: string
        }
        Insert: {
          designation?: string
          employee_code: string
          full_name: string
          joining_date?: string
          phone?: string
          photo_url?: string | null
          user_id: string
        }
        Update: {
          designation?: string
          employee_code?: string
          full_name?: string
          joining_date?: string
          phone?: string
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_employee_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "crm_memberships"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crm_incentive_plans: {
        Row: {
          active: boolean
          role: string
          slabs: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          role: string
          slabs?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          role?: string
          slabs?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          next_follow_up: string | null
          notes: string
          owner_id: string | null
          referral_code: string | null
          source: string
          source_id: string | null
          stage: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          id?: string
          next_follow_up?: string | null
          notes?: string
          owner_id?: string | null
          referral_code?: string | null
          source?: string
          source_id?: string | null
          stage?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          next_follow_up?: string | null
          notes?: string
          owner_id?: string | null
          referral_code?: string | null
          source?: string
          source_id?: string | null
          stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_memberships: {
        Row: {
          active: boolean
          created_at: string
          manager_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          manager_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          manager_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_memberships_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "crm_memberships"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crm_targets: {
        Row: {
          calls_target: number
          id: string
          month: string
          owner_id: string
          revenue_target: number
          wins_target: number
        }
        Insert: {
          calls_target?: number
          id?: string
          month: string
          owner_id: string
          revenue_target?: number
          wins_target?: number
        }
        Update: {
          calls_target?: number
          id?: string
          month?: string
          owner_id?: string
          revenue_target?: number
          wins_target?: number
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          assigned_by: string | null
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          owner_id: string
          priority: string
          status: string
          title: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date: string
          id?: string
          owner_id: string
          priority?: string
          status?: string
          title: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          owner_id?: string
          priority?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tickets: {
        Row: {
          created_at: string
          customer_id: string
          description: string
          id: string
          owner_id: string
          priority: string
          status: string
          subject: string
          ticket_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string
          id?: string
          owner_id: string
          priority?: string
          status?: string
          subject: string
          ticket_code?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          owner_id?: string
          priority?: string
          status?: string
          subject?: string
          ticket_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reports: {
        Row: {
          active: boolean
          category: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          publish_date: string
          report_number: string
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          publish_date: string
          report_number: string
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          publish_date?: string
          report_number?: string
          title?: string
        }
        Relationships: []
      }
      customer_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          customer_reference: string | null
          description: string
          email: string
          full_name: string
          id: string
          phone: string
          priority: string
          private_notes: string
          resolution: string
          status: string
          subject: string
          ticket_code: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          customer_reference?: string | null
          description: string
          email: string
          full_name: string
          id?: string
          phone?: string
          priority?: string
          private_notes?: string
          resolution?: string
          status?: string
          subject: string
          ticket_code: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          customer_reference?: string | null
          description?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          priority?: string
          private_notes?: string
          resolution?: string
          status?: string
          subject?: string
          ticket_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      department_staff: {
        Row: {
          active: boolean
          approval_limit: number | null
          created_at: string
          department: string
          level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          approval_limit?: number | null
          created_at?: string
          department: string
          level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          approval_limit?: number | null
          created_at?: string
          department?: string
          level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education_district_codes: {
        Row: {
          code: number
          district_key: string
          district_name: string
          state_code: string
        }
        Insert: {
          code: number
          district_key: string
          district_name: string
          state_code: string
        }
        Update: {
          code?: number
          district_key?: string
          district_name?: string
          state_code?: string
        }
        Relationships: []
      }
      education_staff_access: {
        Row: {
          active: boolean
          created_at: string
          designation: string
          manager_id: string | null
          referral_code: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          designation: string
          manager_id?: string | null
          referral_code: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          designation?: string
          manager_id?: string | null
          referral_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_staff_access_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "education_staff_access"
            referencedColumns: ["user_id"]
          },
        ]
      }
      education_support_registrations: {
        Row: {
          aadhaar_last_four: string | null
          ack_number: string
          ai_review: string
          application_type: string
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          city: string
          completed_at: string | null
          coordinator: Json
          coordinator_code: string | null
          coordinator_id: string | null
          course_name: string | null
          created_at: string
          current_address: string
          current_class: string | null
          date_of_birth: string
          declarations: Json
          district: string
          education: Json
          education_sector: string | null
          email: string
          employee_verification_note: string
          employee_verified_at: string | null
          employee_verified_by: string | null
          father_name: string
          flags_checked_at: string | null
          flags_confirm_note: string
          flags_confirmed_at: string | null
          flags_confirmed_by: string | null
          form_status: string
          gender: string
          guardian_consent_at: string | null
          guardian_email: string | null
          guardian_mobile: string | null
          guardian_name: string | null
          guardian_relationship: string | null
          id: string
          institution_name: string
          is_minor: boolean
          mobile: string
          mother_name: string
          nationality: string
          payment_reference: string | null
          payment_reference_at: string | null
          payment_status: string
          permanent_address: string
          pin_code: string
          private_details_ciphertext: string | null
          receipt_token_hash: string
          registration_fee: number
          registration_id: string | null
          review_flags: Json
          state: string
          status: string
          status_reason: string
          student_category: string
          student_name: string
          updated_at: string
          whatsapp: string | null
          without_coordinator: boolean
        }
        Insert: {
          aadhaar_last_four?: string | null
          ack_number?: string
          ai_review?: string
          application_type: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          city: string
          completed_at?: string | null
          coordinator?: Json
          coordinator_code?: string | null
          coordinator_id?: string | null
          course_name?: string | null
          created_at?: string
          current_address: string
          current_class?: string | null
          date_of_birth: string
          declarations?: Json
          district: string
          education?: Json
          education_sector?: string | null
          email: string
          employee_verification_note?: string
          employee_verified_at?: string | null
          employee_verified_by?: string | null
          father_name: string
          flags_checked_at?: string | null
          flags_confirm_note?: string
          flags_confirmed_at?: string | null
          flags_confirmed_by?: string | null
          form_status?: string
          gender: string
          guardian_consent_at?: string | null
          guardian_email?: string | null
          guardian_mobile?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          id?: string
          institution_name: string
          is_minor?: boolean
          mobile: string
          mother_name: string
          nationality: string
          payment_reference?: string | null
          payment_reference_at?: string | null
          payment_status?: string
          permanent_address: string
          pin_code: string
          private_details_ciphertext?: string | null
          receipt_token_hash: string
          registration_fee: number
          registration_id?: string | null
          review_flags?: Json
          state: string
          status?: string
          status_reason?: string
          student_category: string
          student_name: string
          updated_at?: string
          whatsapp?: string | null
          without_coordinator?: boolean
        }
        Update: {
          aadhaar_last_four?: string | null
          ack_number?: string
          ai_review?: string
          application_type?: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          city?: string
          completed_at?: string | null
          coordinator?: Json
          coordinator_code?: string | null
          coordinator_id?: string | null
          course_name?: string | null
          created_at?: string
          current_address?: string
          current_class?: string | null
          date_of_birth?: string
          declarations?: Json
          district?: string
          education?: Json
          education_sector?: string | null
          email?: string
          employee_verification_note?: string
          employee_verified_at?: string | null
          employee_verified_by?: string | null
          father_name?: string
          flags_checked_at?: string | null
          flags_confirm_note?: string
          flags_confirmed_at?: string | null
          flags_confirmed_by?: string | null
          form_status?: string
          gender?: string
          guardian_consent_at?: string | null
          guardian_email?: string | null
          guardian_mobile?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          id?: string
          institution_name?: string
          is_minor?: boolean
          mobile?: string
          mother_name?: string
          nationality?: string
          payment_reference?: string | null
          payment_reference_at?: string | null
          payment_status?: string
          permanent_address?: string
          pin_code?: string
          private_details_ciphertext?: string | null
          receipt_token_hash?: string
          registration_fee?: number
          registration_id?: string | null
          review_flags?: Json
          state?: string
          status?: string
          status_reason?: string
          student_category?: string
          student_name?: string
          updated_at?: string
          whatsapp?: string | null
          without_coordinator?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "education_support_registrations_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_verification_attempts: {
        Row: {
          created_at: string
          employee_id: string
          id: number
          success: boolean
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: never
          success?: boolean
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: never
          success?: boolean
        }
        Relationships: []
      }
      employees: {
        Row: {
          code_hash: string
          created_at: string
          department: string
          designation: string
          employee_id: string
          full_name: string
          id: string
          photo_url: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          department: string
          designation: string
          employee_id: string
          full_name: string
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          department?: string
          designation?: string
          employee_id?: string
          full_name?: string
          id?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      fin_accounts: {
        Row: {
          account_last4: string
          active: boolean
          bank_name: string
          created_at: string
          created_by: string | null
          id: string
          kind: string
          low_balance_alert: number
          name: string
          opening_balance: number
          opening_date: string
        }
        Insert: {
          account_last4?: string
          active?: boolean
          bank_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          low_balance_alert?: number
          name: string
          opening_balance?: number
          opening_date?: string
        }
        Update: {
          account_last4?: string
          active?: boolean
          bank_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          low_balance_alert?: number
          name?: string
          opening_balance?: number
          opening_date?: string
        }
        Relationships: []
      }
      fin_bank_lines: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          description: string
          id: string
          imported_by: string | null
          line_date: string
          note: string
          reconciled_at: string | null
          reconciled_by: string | null
          ref: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          description?: string
          id?: string
          imported_by?: string | null
          line_date: string
          note?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          ref?: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          description?: string
          id?: string
          imported_by?: string | null
          line_date?: string
          note?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          ref?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_bank_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_bank_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          department: string
          id: string
          month: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          department?: string
          id?: string
          month: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          department?: string
          id?: string
          month?: string
        }
        Relationships: []
      }
      fin_dues: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          direction: string
          due_date: string
          hold_status: string
          id: string
          invoice_ref: string
          next_follow_up: string | null
          party_id: string | null
          party_name: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string
          direction: string
          due_date: string
          hold_status?: string
          id?: string
          invoice_ref?: string
          next_follow_up?: string | null
          party_id?: string | null
          party_name?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          direction?: string
          due_date?: string
          hold_status?: string
          id?: string
          invoice_ref?: string
          next_follow_up?: string | null
          party_id?: string | null
          party_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_dues_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "fin_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          corrects_id: string | null
          created_at: string
          created_by: string | null
          department: string
          description: string
          direction: string
          due_id: string | null
          id: string
          mode: string
          party_id: string | null
          party_name: string
          proof_path: string
          reconciled_at: string | null
          reconciled_by: string | null
          ref: string
          source: string
          source_id: string | null
          status: string
          txn_date: string
          type: string
          utr: string
          verified_at: string | null
          verified_by: string | null
          void_reason: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string
          corrects_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          direction: string
          due_id?: string | null
          id?: string
          mode?: string
          party_id?: string | null
          party_name?: string
          proof_path?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          ref?: string
          source?: string
          source_id?: string | null
          status?: string
          txn_date?: string
          type: string
          utr?: string
          verified_at?: string | null
          verified_by?: string | null
          void_reason?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          corrects_id?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          direction?: string
          due_id?: string | null
          id?: string
          mode?: string
          party_id?: string | null
          party_name?: string
          proof_path?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          ref?: string
          source?: string
          source_id?: string | null
          status?: string
          txn_date?: string
          type?: string
          utr?: string
          verified_at?: string | null
          verified_by?: string | null
          void_reason?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_corrects_id_fkey"
            columns: ["corrects_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_due_id_fkey"
            columns: ["due_id"]
            isOneToOne: false
            referencedRelation: "fin_dues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "fin_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_vendors: {
        Row: {
          active: boolean
          bank_last4: string
          contact_name: string
          created_at: string
          created_by: string | null
          email: string
          gstin: string
          id: string
          kind: string
          name: string
          notes: string
          phone: string
        }
        Insert: {
          active?: boolean
          bank_last4?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          gstin?: string
          id?: string
          kind?: string
          name: string
          notes?: string
          phone?: string
        }
        Update: {
          active?: boolean
          bank_last4?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          gstin?: string
          id?: string
          kind?: string
          name?: string
          notes?: string
          phone?: string
        }
        Relationships: []
      }
      form_submission_limits: {
        Row: {
          attempts: number
          key_hash: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          key_hash: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          key_hash?: string
          window_started_at?: string
        }
        Relationships: []
      }
      foundation_submissions: {
        Row: {
          ack_number: string
          admin_notes: string
          coordinator_code: string | null
          coordinator_id: string | null
          created_at: string
          details: Json
          email: string
          full_name: string
          id: string
          kind: string
          phone: string
          status: string
        }
        Insert: {
          ack_number?: string
          admin_notes?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          details?: Json
          email: string
          full_name: string
          id?: string
          kind: string
          phone: string
          status?: string
        }
        Update: {
          ack_number?: string
          admin_notes?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          details?: Json
          email?: string
          full_name?: string
          id?: string
          kind?: string
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_submissions_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          category: string
          description: string
          is_public: boolean
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          description?: string
          is_public?: boolean
          key: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          description?: string
          is_public?: boolean
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      google_copy_settings: {
        Row: {
          drive_folder_id: string | null
          drive_folder_title: string
          id: number
          sheet_id: string | null
          sheet_title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          drive_folder_id?: string | null
          drive_folder_title?: string
          id?: number
          sheet_id?: string | null
          sheet_title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          drive_folder_id?: string | null
          drive_folder_title?: string
          id?: number
          sheet_id?: string | null
          sheet_title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      hero_images: {
        Row: {
          image_url: string
          page: string
          storage_path: string
          theme: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          image_url: string
          page: string
          storage_path: string
          theme: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          image_url?: string
          page?: string
          storage_path?: string
          theme?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      integration_connections: {
        Row: {
          config: Json
          connected_at: string | null
          connected_by: string | null
          created_at: string
          enabled: boolean
          last_error: string
          last_sync_at: string | null
          last_tested_at: string | null
          provider: string
          secret_cipher: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          enabled?: boolean
          last_error?: string
          last_sync_at?: string | null
          last_tested_at?: string | null
          provider: string
          secret_cipher?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          enabled?: boolean
          last_error?: string
          last_sync_at?: string | null
          last_tested_at?: string | null
          provider?: string
          secret_cipher?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          items: number
          message: string
          ok: boolean
          provider: string
        }
        Insert: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          items?: number
          message?: string
          ok: boolean
          provider: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          items?: number
          message?: string
          ok?: boolean
          provider?: string
        }
        Relationships: []
      }
      leave_policies: {
        Row: {
          days_per_year: number
          label: string
          leave_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          days_per_year: number
          label: string
          leave_type: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          days_per_year?: number
          label?: string
          leave_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      meeting_attendees: {
        Row: {
          meeting_id: string
          response: string
          user_id: string
        }
        Insert: {
          meeting_id: string
          response?: string
          user_id: string
        }
        Update: {
          meeting_id?: string
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string
          created_at: string
          duration_min: number
          id: string
          location: string
          minutes: string
          organizer_id: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string
          created_at?: string
          duration_min?: number
          id?: string
          location?: string
          minutes?: string
          organizer_id: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string
          created_at?: string
          duration_min?: number
          id?: string
          location?: string
          minutes?: string
          organizer_id?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_options: {
        Row: {
          amount: number | null
          embed_code: string | null
          key: string
          label: string
          payment_link: string | null
          programme: string
          razorpay_button_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          embed_code?: string | null
          key: string
          label: string
          payment_link?: string | null
          programme: string
          razorpay_button_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          embed_code?: string | null
          key?: string
          label?: string
          payment_link?: string | null
          programme?: string
          razorpay_button_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_provider_tokens: {
        Row: {
          access_token: string
          expires_at: string
          provider: string
          refresh_token: string | null
        }
        Insert: {
          access_token: string
          expires_at: string
          provider: string
          refresh_token?: string | null
        }
        Update: {
          access_token?: string
          expires_at?: string
          provider?: string
          refresh_token?: string | null
        }
        Relationships: []
      }
      people_profiles: {
        Row: {
          bio: string
          created_at: string
          focus: string[]
          id: string
          location: string
          name: string
          person_group: string
          photo_url: string | null
          role: string
          slug: string
          sort_order: number
          source_application_id: string | null
          summary: string
        }
        Insert: {
          bio?: string
          created_at?: string
          focus?: string[]
          id?: string
          location?: string
          name: string
          person_group: string
          photo_url?: string | null
          role?: string
          slug: string
          sort_order?: number
          source_application_id?: string | null
          summary?: string
        }
        Update: {
          bio?: string
          created_at?: string
          focus?: string[]
          id?: string
          location?: string
          name?: string
          person_group?: string
          photo_url?: string | null
          role?: string
          slug?: string
          sort_order?: number
          source_application_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_profiles_source_application_id_fkey"
            columns: ["source_application_id"]
            isOneToOne: true
            referencedRelation: "registration_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          display_name: string
          id: string
          preferences: Json
        }
        Insert: {
          avatar_url?: string
          display_name?: string
          id: string
          preferences?: Json
        }
        Update: {
          avatar_url?: string
          display_name?: string
          id?: string
          preferences?: Json
        }
        Relationships: []
      }
      programme_applications: {
        Row: {
          admin_notes: string
          amount_paise: number
          application_code: string
          coordinator_code: string | null
          coordinator_id: string | null
          created_at: string
          details: Json
          email: string
          full_name: string
          id: string
          phone: string
          programme: string
          status: string
          submission_status: string
          submitted_at: string | null
        }
        Insert: {
          admin_notes?: string
          amount_paise: number
          application_code?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          details?: Json
          email: string
          full_name: string
          id?: string
          phone: string
          programme: string
          status?: string
          submission_status?: string
          submitted_at?: string | null
        }
        Update: {
          admin_notes?: string
          amount_paise?: number
          application_code?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          details?: Json
          email?: string
          full_name?: string
          id?: string
          phone?: string
          programme?: string
          status?: string
          submission_status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programme_applications_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_payments: {
        Row: {
          amount_paise: number
          application_id: string | null
          application_kind: string | null
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payer_email: string
          payer_name: string
          payer_phone: string
          programme: string
          provider: string
          provider_payment_id: string | null
          provider_reference: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
        }
        Insert: {
          amount_paise: number
          application_id?: string | null
          application_kind?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payer_email: string
          payer_name: string
          payer_phone?: string
          programme?: string
          provider?: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
        }
        Update: {
          amount_paise?: number
          application_id?: string | null
          application_kind?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payer_email?: string
          payer_name?: string
          payer_phone?: string
          programme?: string
          provider?: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
        }
        Relationships: []
      }
      prototype_ai_access_state: {
        Row: {
          blocked_at: string
          message: string
          model_id: string
          status_code: number
        }
        Insert: {
          blocked_at?: string
          message?: string
          model_id: string
          status_code: number
        }
        Update: {
          blocked_at?: string
          message?: string
          model_id?: string
          status_code?: number
        }
        Relationships: []
      }
      prototype_submissions: {
        Row: {
          ai_output: string
          created_at: string
          eligibility_context: string
          funding_goal: string
          id: string
          idea: string
          prototype: string
        }
        Insert: {
          ai_output?: string
          created_at?: string
          eligibility_context?: string
          funding_goal?: string
          id?: string
          idea: string
          prototype: string
        }
        Update: {
          ai_output?: string
          created_at?: string
          eligibility_context?: string
          funding_goal?: string
          id?: string
          idea?: string
          prototype?: string
        }
        Relationships: []
      }
      registration_applications: {
        Row: {
          admin_notes: string
          application_code: string
          category: string
          coordinator_code: string | null
          coordinator_id: string | null
          created_at: string
          details: Json
          document_name: string | null
          document_path: string | null
          drive_file_url: string | null
          email: string
          full_name: string
          id: string
          phone: string
          status: string
        }
        Insert: {
          admin_notes?: string
          application_code?: string
          category: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          details?: Json
          document_name?: string | null
          document_path?: string | null
          drive_file_url?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          status?: string
        }
        Update: {
          admin_notes?: string
          application_code?: string
          category?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          details?: Json
          document_name?: string | null
          document_path?: string | null
          drive_file_url?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_applications_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
        ]
      }
      request_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          request_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          request_id: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          request_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: string
          note: string
          request_id: string
          step: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          note?: string
          request_id: string
          step?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          note?: string
          request_id?: string
          step?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_routes: {
        Row: {
          active: boolean
          audience: string
          category: string
          kind: string
          label: string
          sla_hours: number
          sort_order: number
          steps: string[]
          steps_no_manager: string[]
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          audience?: string
          category?: string
          kind?: string
          label: string
          sla_hours?: number
          sort_order?: number
          steps?: string[]
          steps_no_manager?: string[]
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          audience?: string
          category?: string
          kind?: string
          label?: string
          sla_hours?: number
          sort_order?: number
          steps?: string[]
          steps_no_manager?: string[]
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          amount: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at: string
          current_step: string | null
          days: number | null
          description: string
          details: Json
          due_at: string | null
          escalated_at: string | null
          from_date: string | null
          id: string
          manager_id: string | null
          priority: string
          proof_path: string
          resolution: string
          status: string
          step_index: number
          steps: string[]
          title: string
          to_date: string | null
          transaction_ref: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at?: string
          current_step?: string | null
          days?: number | null
          description?: string
          details?: Json
          due_at?: string | null
          escalated_at?: string | null
          from_date?: string | null
          id?: string
          manager_id?: string | null
          priority?: string
          proof_path?: string
          resolution?: string
          status?: string
          step_index?: number
          steps: string[]
          title: string
          to_date?: string | null
          transaction_ref?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          applicant_id?: string
          applicant_name?: string
          applicant_role?: string
          code?: string
          created_at?: string
          current_step?: string | null
          days?: number | null
          description?: string
          details?: Json
          due_at?: string | null
          escalated_at?: string | null
          from_date?: string | null
          id?: string
          manager_id?: string | null
          priority?: string
          proof_path?: string
          resolution?: string
          status?: string
          step_index?: number
          steps?: string[]
          title?: string
          to_date?: string | null
          transaction_ref?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "request_routes"
            referencedColumns: ["type"]
          },
        ]
      }
      research_feedback: {
        Row: {
          comment: string
          created_at: string
          created_by: string
          id: string
          relevance: number
          request_id: string
          usefulness: number
        }
        Insert: {
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          relevance: number
          request_id: string
          usefulness: number
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          relevance?: number
          request_id?: string
          usefulness?: number
        }
        Relationships: [
          {
            foreignKeyName: "research_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "research_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      research_leads: {
        Row: {
          company: string
          contact_name: string
          created_at: string
          created_by: string | null
          designation: string
          email: string
          id: string
          industry: string
          location: string
          notes: string
          phone: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string
        }
        Insert: {
          company: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          designation?: string
          email?: string
          id?: string
          industry?: string
          location?: string
          notes?: string
          phone?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string
        }
        Update: {
          company?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          designation?: string
          email?: string
          id?: string
          industry?: string
          location?: string
          notes?: string
          phone?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string
        }
        Relationships: []
      }
      research_request_leads: {
        Row: {
          created_at: string
          delivered_at: string | null
          lead_id: string
          request_id: string
          reused: boolean
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          lead_id: string
          request_id: string
          reused?: boolean
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          lead_id?: string
          request_id?: string
          reused?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "research_request_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "research_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_request_leads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "research_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      research_requests: {
        Row: {
          code: string
          created_at: string
          criteria: string
          department: string
          difficulty: string
          due_date: string
          id: string
          industry: string
          location: string
          quantity: number
          requested_by: string
          requester_name: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          criteria?: string
          department?: string
          difficulty: string
          due_date: string
          id?: string
          industry?: string
          location?: string
          quantity: number
          requested_by?: string
          requester_name?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          criteria?: string
          department?: string
          difficulty?: string
          due_date?: string
          id?: string
          industry?: string
          location?: string
          quantity?: number
          requested_by?: string
          requester_name?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings_change_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          area: string
          changes: Json
          created_at: string
          id: string
          item: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          area: string
          changes?: Json
          created_at?: string
          id?: string
          item: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          area?: string
          changes?: Json
          created_at?: string
          id?: string
          item?: string
        }
        Relationships: []
      }
      sheet_mirror_queue: {
        Row: {
          attempts: number
          id: number
          kind: string
          last_error: string
          queued_at: string
          row_id: string
          source_table: string
        }
        Insert: {
          attempts?: number
          id?: number
          kind?: string
          last_error?: string
          queued_at?: string
          row_id: string
          source_table: string
        }
        Update: {
          attempts?: number
          id?: number
          kind?: string
          last_error?: string
          queued_at?: string
          row_id?: string
          source_table?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_availability: {
        Row: {
          days: string[]
          hours: string
          note: string
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          days?: string[]
          hours?: string
          note?: string
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          days?: string[]
          hours?: string
          note?: string
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_availability_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: true
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_commissions: {
        Row: {
          amount: number
          application_code: string
          created_at: string
          credited_at: string | null
          fee_amount: number
          flat_amount: number
          form_key: string
          id: string
          percent: number
          reversed_at: string | null
          source_id: string
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          amount: number
          application_code?: string
          created_at?: string
          credited_at?: string | null
          fee_amount?: number
          flat_amount?: number
          form_key: string
          id?: string
          percent?: number
          reversed_at?: string | null
          source_id: string
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          amount?: number
          application_code?: string
          created_at?: string
          credited_at?: string | null
          fee_amount?: number
          flat_amount?: number
          form_key?: string
          id?: string
          percent?: number
          reversed_at?: string | null
          source_id?: string
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_commissions_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_form_commissions: {
        Row: {
          active: boolean
          flat_amount: number
          form_key: string
          label: string
          percent: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          flat_amount?: number
          form_key: string
          label: string
          percent?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          flat_amount?: number
          form_key?: string
          label?: string
          percent?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      volunteer_notices: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          sender_id: string | null
          title: string
          volunteer_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          sender_id?: string | null
          title: string
          volunteer_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          sender_id?: string | null
          title?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_notices_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_payout_details: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          ifsc: string
          updated_at: string
          updated_by: string | null
          upi_id: string
          volunteer_id: string
        }
        Insert: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          ifsc?: string
          updated_at?: string
          updated_by?: string | null
          upi_id?: string
          volunteer_id: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          ifsc?: string
          updated_at?: string
          updated_by?: string | null
          upi_id?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_payout_details_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: true
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_settings: {
        Row: {
          id: boolean
          max_percent: number
          min_withdrawal: number
          payout_note: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          max_percent?: number
          min_withdrawal?: number
          payout_note?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          max_percent?: number
          min_withdrawal?: number
          payout_note?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      volunteer_ticket_messages: {
        Row: {
          author_id: string
          author_role: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          author_role: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "volunteer_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_tickets: {
        Row: {
          category: string
          created_at: string
          escalated: boolean
          id: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          category: string
          created_at?: string
          escalated?: boolean
          id?: string
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          category?: string
          created_at?: string
          escalated?: boolean
          id?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_tickets_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_withdrawals: {
        Row: {
          amount: number
          escalated_at: string | null
          escalation_note: string
          id: string
          method: string
          paid_at: string | null
          payout_masked: string
          processed_at: string | null
          proof_path: string | null
          rejection_reason: string
          request_number: string
          requested_at: string
          status: string
          transaction_id: string
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
          volunteer_id: string
        }
        Insert: {
          amount: number
          escalated_at?: string | null
          escalation_note?: string
          id?: string
          method: string
          paid_at?: string | null
          payout_masked?: string
          processed_at?: string | null
          proof_path?: string | null
          rejection_reason?: string
          request_number?: string
          requested_at?: string
          status?: string
          transaction_id?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          volunteer_id: string
        }
        Update: {
          amount?: number
          escalated_at?: string | null
          escalation_note?: string
          id?: string
          method?: string
          paid_at?: string | null
          payout_masked?: string
          processed_at?: string | null
          proof_path?: string | null
          rejection_reason?: string
          request_number?: string
          requested_at?: string
          status?: string
          transaction_id?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_withdrawals_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          activated_at: string | null
          address: string
          commission_percent: number | null
          created_at: string
          date_of_birth: string | null
          district: string
          email: string
          employee_id: string
          full_name: string
          gender: string
          id: string
          kyc_note: string
          kyc_status: string
          last_login_at: string | null
          mobile: string
          monthly_target: number
          payout_masked: string
          payout_method: string | null
          photo_path: string | null
          qualification: string
          referral_code: string
          state: string
          status: string
          updated_at: string
          user_id: string | null
          volunteer_code: string
        }
        Insert: {
          activated_at?: string | null
          address?: string
          commission_percent?: number | null
          created_at?: string
          date_of_birth?: string | null
          district?: string
          email: string
          employee_id: string
          full_name: string
          gender?: string
          id?: string
          kyc_note?: string
          kyc_status?: string
          last_login_at?: string | null
          mobile: string
          monthly_target?: number
          payout_masked?: string
          payout_method?: string | null
          photo_path?: string | null
          qualification?: string
          referral_code?: string
          state?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          volunteer_code?: string
        }
        Update: {
          activated_at?: string | null
          address?: string
          commission_percent?: number | null
          created_at?: string
          date_of_birth?: string | null
          district?: string
          email?: string
          employee_id?: string
          full_name?: string
          gender?: string
          id?: string
          kyc_note?: string
          kyc_status?: string
          last_login_at?: string | null
          mobile?: string
          monthly_target?: number
          payout_masked?: string
          payout_method?: string | null
          photo_path?: string | null
          qualification?: string
          referral_code?: string
          state?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          volunteer_code?: string
        }
        Relationships: []
      }
      young_innovators_registrations: {
        Row: {
          application_code: string
          city: string
          consent_at: string
          coordinator_code: string | null
          coordinator_id: string | null
          created_at: string
          fee_amount: number
          gst_percent: number
          guardian_consent: boolean
          guardian_email: string
          guardian_name: string
          guardian_phone: string
          id: string
          idea: string
          idea_title: string
          school_class: number
          status: string
          student_name: string
          submission_status: string
          submitted_at: string | null
        }
        Insert: {
          application_code?: string
          city: string
          consent_at?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          fee_amount: number
          gst_percent?: number
          guardian_consent: boolean
          guardian_email: string
          guardian_name: string
          guardian_phone: string
          id?: string
          idea: string
          idea_title: string
          school_class: number
          status?: string
          student_name: string
          submission_status?: string
          submitted_at?: string | null
        }
        Update: {
          application_code?: string
          city?: string
          consent_at?: string
          coordinator_code?: string | null
          coordinator_id?: string | null
          created_at?: string
          fee_amount?: number
          gst_percent?: number
          guardian_consent?: boolean
          guardian_email?: string
          guardian_name?: string
          guardian_phone?: string
          id?: string
          idea?: string
          idea_title?: string
          school_class?: number
          status?: string
          student_name?: string
          submission_status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "young_innovators_registrations_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
        ]
      }
      zoho_invoices: {
        Row: {
          balance: number
          currency: string
          customer_name: string
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string
          status: string
          synced_at: string
          total: number
          zoho_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          customer_name?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          status?: string
          synced_at?: string
          total?: number
          zoho_id: string
        }
        Update: {
          balance?: number
          currency?: string
          customer_name?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          status?: string
          synced_at?: string
          total?: number
          zoho_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _meeting_visible: { Args: { _id: string }; Returns: boolean }
      _request_dispatch: { Args: { _id: string }; Returns: undefined }
      _request_event: {
        Args: { _action: string; _id: string; _note: string; _step: string }
        Returns: undefined
      }
      _request_visible: { Args: { _id: string }; Returns: boolean }
      _work_department: { Args: { _dept: string }; Returns: boolean }
      _work_manager: { Args: { _uid: string }; Returns: string }
      _work_team: { Args: { _uid: string }; Returns: boolean }
      ack_state_code: { Args: { _state: string }; Returns: string }
      admin_department_staff: {
        Args: never
        Returns: {
          active: boolean
          approval_limit: number
          department: string
          email: string
          full_name: string
          level: string
          user_id: string
        }[]
      }
      admin_import_records: {
        Args: { _rows: Json; _table: string }
        Returns: Json
      }
      admin_integration_status: {
        Args: never
        Returns: {
          config: Json
          enabled: boolean
          has_secret: boolean
          last_error: string
          last_sync_at: string
          last_tested_at: string
          provider: string
          status: string
        }[]
      }
      admin_save_employee: {
        Args: {
          _code: string
          _department: string
          _designation: string
          _employee_id: string
          _full_name: string
          _photo_url: string
          _status: string
          _valid_until: string
        }
        Returns: undefined
      }
      admin_set_department_staff: {
        Args: {
          _active: boolean
          _department: string
          _email: string
          _level?: string
          _limit?: number
        }
        Returns: undefined
      }
      admin_setup_metadata: { Args: never; Returns: Json }
      attendance_mark: {
        Args: { _action: string }
        Returns: {
          check_in: string | null
          check_out: string | null
          created_at: string
          day: string
          id: string
          note: string
          request_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      c_department_access: { Args: { _department: string }; Returns: boolean }
      can_view_people_profiles: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      consume_form_submission_limit: {
        Args: { _key_hash: string }
        Returns: boolean
      }
      coordinator_name_for_code: { Args: { _code: string }; Returns: string }
      coordinator_referral_stats: {
        Args: never
        Returns: {
          coordinator_id: string
          leads: number
          submitted: number
        }[]
      }
      critical_change_decide: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: boolean
      }
      critical_change_propose: {
        Args: {
          _kind: string
          _payload: Json
          _summary: string
          _target: string
        }
        Returns: string
      }
      crm_assign_lead: {
        Args: { _lead: string; _owner: string }
        Returns: undefined
      }
      crm_can_access: { Args: { _owner: string }; Returns: boolean }
      crm_create_lead: { Args: { _input: Json }; Returns: string }
      crm_customer_lookup: { Args: { _reference: string }; Returns: Json }
      crm_import_submission: {
        Args: { _id: string; _kind: string; _owner: string }
        Returns: undefined
      }
      crm_my_manager: { Args: never; Returns: string }
      crm_onboard_member: {
        Args: { _input: Json; _user_id: string }
        Returns: undefined
      }
      crm_owner_for_code: { Args: { _code: string }; Returns: string }
      crm_record_collection: {
        Args: {
          _amount: number
          _date: string
          _lead: string
          _mode: string
          _note: string
          _owner: string
          _payer: string
          _reference: string
        }
        Returns: string
      }
      crm_role: { Args: never; Returns: string }
      crm_route_submission: {
        Args: {
          _acknowledgement: string
          _amount: number
          _code: string
          _company: string
          _email: string
          _full_name: string
          _owner?: string
          _phone: string
          _source: string
          _source_id: string
          _title: string
        }
        Returns: string
      }
      crm_submission_lead: {
        Args: { _kind: string; _owner?: string; r: Json }
        Returns: string
      }
      crm_verify_collection: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: string
      }
      department_requests: {
        Args: { _dept: string; _status?: string }
        Returns: {
          amount: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at: string
          current_step: string | null
          days: number | null
          description: string
          details: Json
          due_at: string | null
          escalated_at: string | null
          from_date: string | null
          id: string
          manager_id: string | null
          priority: string
          proof_path: string
          resolution: string
          status: string
          step_index: number
          steps: string[]
          title: string
          to_date: string | null
          transaction_ref: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      escalation_enabled: { Args: never; Returns: boolean }
      fin_access: { Args: { _scope?: string }; Returns: boolean }
      fin_account_balances: {
        Args: never
        Returns: {
          account_last4: string
          active: boolean
          balance: number
          bank_name: string
          id: string
          kind: string
          low_balance_alert: number
          name: string
          opening_balance: number
          opening_date: string
          unreconciled: number
        }[]
      }
      fin_bank_line_action: {
        Args: { _action: string; _line: string; _note?: string; _txn?: string }
        Returns: undefined
      }
      fin_budget_status: {
        Args: { _month?: string }
        Returns: {
          amount: number
          category: string
          department: string
          id: string
          month: string
          percent: number
          spent: number
        }[]
      }
      fin_dues_list: {
        Args: never
        Returns: {
          amount: number
          description: string
          direction: string
          due_date: string
          hold_status: string
          id: string
          invoice_ref: string
          next_follow_up: string
          outstanding: number
          party_name: string
          settled: number
          status: string
        }[]
      }
      fin_import_bank_lines: {
        Args: { _account: string; _lines: Json }
        Returns: Json
      }
      fin_overview: { Args: never; Returns: Json }
      fin_record_transaction: { Args: { _input: Json }; Returns: string }
      fin_verify_transaction: { Args: { _id: string }; Returns: undefined }
      fin_void_transaction: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      finance_withdrawals: {
        Args: never
        Returns: {
          amount: number
          id: string
          kyc_status: string
          method: string
          paid_at: string
          payout_masked: string
          processed_at: string
          proof_path: string
          rejection_reason: string
          request_number: string
          requested_at: string
          status: string
          transaction_id: string
          verified_at: string
          verified_by: string
          verified_by_name: string
          volunteer_code: string
          volunteer_id: string
          volunteer_name: string
        }[]
      }
      first_admin_setup_status: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      integration_report: {
        Args: {
          _items?: number
          _message?: string
          _ok: boolean
          _provider: string
        }
        Returns: undefined
      }
      is_active_employee: { Args: { _uid: string }; Returns: boolean }
      issue_ack_number: {
        Args: { _form: string; _state: string }
        Returns: string
      }
      json_text_list: { Args: { _value: Json }; Returns: string[] }
      leave_summary: {
        Args: never
        Returns: {
          allowed: number
          available: number
          label: string
          leave_type: string
          pending: number
          used: number
        }[]
      }
      meeting_create: {
        Args: {
          _agenda: string
          _attendees: string[]
          _duration: number
          _location: string
          _starts: string
          _title: string
        }
        Returns: string
      }
      meeting_update: {
        Args: {
          _id: string
          _minutes?: string
          _response?: string
          _status?: string
        }
        Returns: undefined
      }
      my_approval_queue: {
        Args: never
        Returns: {
          amount: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at: string
          current_step: string | null
          days: number | null
          description: string
          details: Json
          due_at: string | null
          escalated_at: string | null
          from_date: string | null
          id: string
          manager_id: string | null
          priority: string
          proof_path: string
          resolution: string
          status: string
          step_index: number
          steps: string[]
          title: string
          to_date: string | null
          transaction_ref: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      my_dashboards: { Args: never; Returns: string[] }
      notifications_mark_read: { Args: { _id?: string }; Returns: undefined }
      people_profile_safe_text: { Args: { _value: string }; Returns: string }
      person_name: { Args: { _uid: string }; Returns: string }
      request_act: {
        Args: {
          _account_id?: string
          _action: string
          _id: string
          _note?: string
          _proof_path?: string
          _ref?: string
        }
        Returns: {
          amount: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at: string
          current_step: string | null
          days: number | null
          description: string
          details: Json
          due_at: string | null
          escalated_at: string | null
          from_date: string | null
          id: string
          manager_id: string | null
          priority: string
          proof_path: string
          resolution: string
          status: string
          step_index: number
          steps: string[]
          title: string
          to_date: string | null
          transaction_ref: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_can_act: { Args: { _id: string }; Returns: boolean }
      request_cancel: {
        Args: { _id: string; _note?: string }
        Returns: undefined
      }
      request_comment: {
        Args: { _id: string; _note: string }
        Returns: undefined
      }
      request_submit: {
        Args: {
          _amount?: number
          _description?: string
          _details?: Json
          _from?: string
          _priority?: string
          _title: string
          _to?: string
          _type: string
        }
        Returns: {
          amount: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at: string
          current_step: string | null
          days: number | null
          description: string
          details: Json
          due_at: string | null
          escalated_at: string | null
          from_date: string | null
          id: string
          manager_id: string | null
          priority: string
          proof_path: string
          resolution: string
          status: string
          step_index: number
          steps: string[]
          title: string
          to_date: string | null
          transaction_ref: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      requeue_all_google_copies: {
        Args: { _include_documents?: boolean }
        Returns: number
      }
      research_add_lead: {
        Args: { _lead: Json; _request: string; _verified: boolean }
        Returns: string
      }
      research_cancel: { Args: { _request: string }; Returns: boolean }
      research_deliver: { Args: { _request: string }; Returns: number }
      research_request_create: {
        Args: {
          _criteria: string
          _department: string
          _difficulty: string
          _industry: string
          _location: string
          _quantity: number
          _title: string
        }
        Returns: string
      }
      research_reuse_leads: {
        Args: { _limit: number; _request: string }
        Returns: number
      }
      research_reverify: { Args: { _lead: string }; Returns: boolean }
      run_request_escalations: { Args: never; Returns: number }
      team_attendance: {
        Args: { _from: string; _to: string }
        Returns: {
          check_in: string
          check_out: string
          day: string
          full_name: string
          status: string
          user_id: string
        }[]
      }
      team_requests: {
        Args: never
        Returns: {
          amount: number | null
          applicant_id: string
          applicant_name: string
          applicant_role: string
          code: string
          created_at: string
          current_step: string | null
          days: number | null
          description: string
          details: Json
          due_at: string | null
          escalated_at: string | null
          from_date: string | null
          id: string
          manager_id: string | null
          priority: string
          proof_path: string
          resolution: string
          status: string
          step_index: number
          steps: string[]
          title: string
          to_date: string | null
          transaction_ref: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      verify_employee: {
        Args: { _code: string; _employee_id: string }
        Returns: {
          department: string
          designation: string
          employee_id: string
          full_name: string
          photo_url: string
          status: string
          valid_until: string
        }[]
      }
      volunteer_access: { Args: { _volunteer: string }; Returns: string }
      volunteer_available_balance: {
        Args: { _volunteer: string }
        Returns: number
      }
      volunteer_claim_account: { Args: never; Returns: string }
      volunteer_escalate_withdrawal: {
        Args: { _id: string; _note: string }
        Returns: undefined
      }
      volunteer_folder_access: { Args: { _name: string }; Returns: string }
      volunteer_mark_notices_read: { Args: never; Returns: undefined }
      volunteer_notify: {
        Args: {
          _body: string
          _kind: string
          _sender?: string
          _title: string
          _volunteer: string
        }
        Returns: undefined
      }
      volunteer_open_ticket: {
        Args: { _body: string; _category: string; _subject: string }
        Returns: string
      }
      volunteer_process_withdrawal: {
        Args: {
          _account_id?: string
          _id: string
          _proof_path?: string
          _reason?: string
          _status: string
          _transaction_id?: string
        }
        Returns: undefined
      }
      volunteer_referrals: {
        Args: { _volunteer?: string }
        Returns: {
          application_code: string
          commission_amount: number
          commission_status: string
          completed_at: string
          form_key: string
          form_status: string
          payment_status: string
          review_status: string
          source_id: string
          status_reason: string
          student_name: string
          submitted_at: string
          volunteer_id: string
        }[]
      }
      volunteer_reply_ticket: {
        Args: { _body: string; _ticket: string }
        Returns: undefined
      }
      volunteer_request_withdrawal: {
        Args: { _amount: number; _method: string }
        Returns: string
      }
      volunteer_send_message: {
        Args: {
          _body: string
          _kind: string
          _title: string
          _volunteers: string[]
        }
        Returns: number
      }
      volunteer_set_availability: {
        Args: {
          _days: string[]
          _hours: string
          _note: string
          _status: string
        }
        Returns: undefined
      }
      volunteer_set_payout: {
        Args: {
          _account: string
          _bank: string
          _holder: string
          _ifsc: string
          _upi: string
          _volunteer: string
        }
        Returns: string
      }
      volunteer_set_ticket_status: {
        Args: { _status: string; _ticket: string }
        Returns: undefined
      }
      volunteer_submit_kyc: { Args: never; Returns: undefined }
      volunteer_touch_login: { Args: never; Returns: undefined }
      work_contacts: {
        Args: never
        Returns: {
          full_name: string
          kind: string
          user_id: string
        }[]
      }
      work_people: {
        Args: never
        Returns: {
          department: string
          email: string
          full_name: string
          joining_date: string
          manager_name: string
          phone: string
          role: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
