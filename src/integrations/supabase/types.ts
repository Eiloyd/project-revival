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
      admin_view_as_log: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          reason: string
          target_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string
          id?: string
          reason: string
          target_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          reason?: string
          target_id?: string
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
      company_policies: {
        Row: {
          active: boolean
          body: string
          created_by: string | null
          id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          body: string
          created_by?: string | null
          id?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          body?: string
          created_by?: string | null
          id?: string
          title?: string
          updated_at?: string
          version?: number
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
      crm_coaching_notes: {
        Row: {
          acknowledged_at: string | null
          action_items: string
          coach_id: string
          created_at: string
          employee_id: string
          follow_up_date: string | null
          id: string
          kind: string
          notes: string
          session_date: string
          topic: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_items?: string
          coach_id?: string
          created_at?: string
          employee_id: string
          follow_up_date?: string | null
          id?: string
          kind?: string
          notes?: string
          session_date?: string
          topic: string
        }
        Update: {
          acknowledged_at?: string | null
          action_items?: string
          coach_id?: string
          created_at?: string
          employee_id?: string
          follow_up_date?: string | null
          id?: string
          kind?: string
          notes?: string
          session_date?: string
          topic?: string
        }
        Relationships: []
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
      crm_daily_reports: {
        Row: {
          blockers: string
          calls: number
          collected: number
          created_at: string
          follow_ups_done: number
          id: string
          meetings: number
          new_leads: number
          owner_id: string
          plan_tomorrow: string
          report_date: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          summary: string
          updated_at: string
          won_deals: number
        }
        Insert: {
          blockers?: string
          calls?: number
          collected?: number
          created_at?: string
          follow_ups_done?: number
          id?: string
          meetings?: number
          new_leads?: number
          owner_id: string
          plan_tomorrow?: string
          report_date: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          summary?: string
          updated_at?: string
          won_deals?: number
        }
        Update: {
          blockers?: string
          calls?: number
          collected?: number
          created_at?: string
          follow_ups_done?: number
          id?: string
          meetings?: number
          new_leads?: number
          owner_id?: string
          plan_tomorrow?: string
          report_date?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          summary?: string
          updated_at?: string
          won_deals?: number
        }
        Relationships: []
      }
      crm_documents: {
        Row: {
          created_at: string
          customer_id: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          lead_id: string | null
          note: string
          owner_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          doc_type?: string
          file_name: string
          file_path: string
          id?: string
          lead_id?: string | null
          note?: string
          owner_id?: string | null
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          lead_id?: string | null
          note?: string
          owner_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
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
      crm_lead_assignments: {
        Row: {
          changed_by: string | null
          created_at: string
          from_owner: string | null
          id: string
          lead_id: string
          reason: string
          to_owner: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_owner?: string | null
          id?: string
          lead_id: string
          reason?: string
          to_owner?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_owner?: string | null
          id?: string
          lead_id?: string
          reason?: string
          to_owner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
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
      crm_manufacturers: {
        Row: {
          capacity: string
          certifications: string
          company: string
          contact_name: string
          created_at: string
          factory_address: string
          gstin: string
          id: string
          kyc_status: string
          machinery: string
          notes: string
          owner_id: string
          phone: string
          products: string
          stage: string
          updated_at: string
        }
        Insert: {
          capacity?: string
          certifications?: string
          company: string
          contact_name?: string
          created_at?: string
          factory_address?: string
          gstin?: string
          id?: string
          kyc_status?: string
          machinery?: string
          notes?: string
          owner_id?: string
          phone?: string
          products?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          capacity?: string
          certifications?: string
          company?: string
          contact_name?: string
          created_at?: string
          factory_address?: string
          gstin?: string
          id?: string
          kyc_status?: string
          machinery?: string
          notes?: string
          owner_id?: string
          phone?: string
          products?: string
          stage?: string
          updated_at?: string
        }
        Relationships: []
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
      crm_pay_settings: {
        Row: {
          collection_attendance: boolean
          id: boolean
          min_daily_collection: number
          nudge_every_minutes: number
          updated_at: string
          updated_by: string | null
          work_start: string
          zero_cutoff: string
        }
        Insert: {
          collection_attendance?: boolean
          id?: boolean
          min_daily_collection?: number
          nudge_every_minutes?: number
          updated_at?: string
          updated_by?: string | null
          work_start?: string
          zero_cutoff?: string
        }
        Update: {
          collection_attendance?: boolean
          id?: boolean
          min_daily_collection?: number
          nudge_every_minutes?: number
          updated_at?: string
          updated_by?: string | null
          work_start?: string
          zero_cutoff?: string
        }
        Relationships: []
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
          completed_at: string | null
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
          completed_at?: string | null
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
          completed_at?: string | null
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
      customer_ticket_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: string
          note: string
          ticket_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          note?: string
          ticket_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          note?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          channel: string
          created_at: string
          csat_at: string | null
          csat_comment: string | null
          csat_rating: number | null
          customer_reference: string | null
          description: string
          due_at: string | null
          email: string
          escalated_at: string | null
          escalation_level: number
          finance_request_id: string | null
          finance_status: string
          first_response_at: string | null
          full_name: string
          id: string
          phone: string
          priority: string
          private_notes: string
          refund_amount: number | null
          request_type: string
          resolution: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_code: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          channel?: string
          created_at?: string
          csat_at?: string | null
          csat_comment?: string | null
          csat_rating?: number | null
          customer_reference?: string | null
          description: string
          due_at?: string | null
          email: string
          escalated_at?: string | null
          escalation_level?: number
          finance_request_id?: string | null
          finance_status?: string
          first_response_at?: string | null
          full_name: string
          id?: string
          phone?: string
          priority?: string
          private_notes?: string
          refund_amount?: number | null
          request_type?: string
          resolution?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_code: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          channel?: string
          created_at?: string
          csat_at?: string | null
          csat_comment?: string | null
          csat_rating?: number | null
          customer_reference?: string | null
          description?: string
          due_at?: string | null
          email?: string
          escalated_at?: string | null
          escalation_level?: number
          finance_request_id?: string | null
          finance_status?: string
          first_response_at?: string | null
          full_name?: string
          id?: string
          phone?: string
          priority?: string
          private_notes?: string
          refund_amount?: number | null
          request_type?: string
          resolution?: string
          resolved_at?: string | null
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
          card_issued_at: string | null
          card_reprints: number
          card_status: string
          code_hash: string
          created_at: string
          department: string
          designation: string
          employee_id: string
          full_name: string
          id: string
          joining_date: string | null
          photo_url: string | null
          public_listing: boolean
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          card_issued_at?: string | null
          card_reprints?: number
          card_status?: string
          code_hash: string
          created_at?: string
          department: string
          designation: string
          employee_id: string
          full_name: string
          id?: string
          joining_date?: string | null
          photo_url?: string | null
          public_listing?: boolean
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          card_issued_at?: string | null
          card_reprints?: number
          card_status?: string
          code_hash?: string
          created_at?: string
          department?: string
          designation?: string
          employee_id?: string
          full_name?: string
          id?: string
          joining_date?: string | null
          photo_url?: string | null
          public_listing?: boolean
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
      funding_applications: {
        Row: {
          category: string
          client_id: string
          created_at: string
          created_by: string | null
          funding_ask: number | null
          funding_type: string
          id: string
          internal_notes: string
          next_action: string
          stage_id: string | null
          status: string
          updated_at: string
          use_of_funds: string
        }
        Insert: {
          category?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          funding_ask?: number | null
          funding_type?: string
          id?: string
          internal_notes?: string
          next_action?: string
          stage_id?: string | null
          status?: string
          updated_at?: string
          use_of_funds?: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          funding_ask?: number | null
          funding_type?: string
          id?: string
          internal_notes?: string
          next_action?: string
          stage_id?: string | null
          status?: string
          updated_at?: string
          use_of_funds?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_applications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_applications_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funding_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_stage_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_stage: string | null
          id: string
          note: string
          status: string | null
          to_stage: string | null
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          note?: string
          status?: string | null
          to_stage?: string | null
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          note?: string
          status?: string | null
          to_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "funding_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_stages: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          jury_round: number | null
          name: string
          position: number
          required_docs: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          jury_round?: number | null
          name: string
          position: number
          required_docs?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          jury_round?: number | null
          name?: string
          position?: number
          required_docs?: string
        }
        Relationships: []
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
      hr_advances: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          monthly_recovery: number
          note: string
          request_id: string | null
          start_month: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          monthly_recovery: number
          note?: string
          request_id?: string | null
          start_month: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          monthly_recovery?: number
          note?: string
          request_id?: string | null
          start_month?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_advances_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_appraisals: {
        Row: {
          created_at: string
          id: string
          improvements: string
          increment_percent: number
          kpi_score: number | null
          period: string
          rating: number | null
          reviewer_id: string | null
          status: string
          strengths: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          improvements?: string
          increment_percent?: number
          kpi_score?: number | null
          period: string
          rating?: number | null
          reviewer_id?: string | null
          status?: string
          strengths?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          improvements?: string
          increment_percent?: number
          kpi_score?: number | null
          period?: string
          rating?: number | null
          reviewer_id?: string | null
          status?: string
          strengths?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_assessments: {
        Row: {
          candidate_id: string
          created_at: string
          created_by: string | null
          due_at: string | null
          evaluator_notes: string
          id: string
          instructions: string
          kind: string
          link: string
          marks: number | null
          max_marks: number
          result: string
          share_score: boolean
          status: string
          submission_note: string
          submission_path: string | null
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          evaluator_notes?: string
          id?: string
          instructions?: string
          kind: string
          link?: string
          marks?: number | null
          max_marks?: number
          result?: string
          share_score?: boolean
          status?: string
          submission_note?: string
          submission_path?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          evaluator_notes?: string
          id?: string
          instructions?: string
          kind?: string
          link?: string
          marks?: number | null
          max_marks?: number
          result?: string
          share_score?: boolean
          status?: string
          submission_note?: string
          submission_path?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_assessments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_attendance_corrections: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          day: string
          id: string
          reason: string
          requested_status: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          day: string
          id?: string
          reason: string
          requested_status: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          day?: string
          id?: string
          reason?: string
          requested_status?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_candidate_events: {
        Row: {
          actor_id: string | null
          actor_name: string
          candidate_id: string
          created_at: string
          from_stage: string | null
          id: string
          to_stage: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string
          candidate_id: string
          created_at?: string
          from_stage?: string | null
          id?: string
          to_stage: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          candidate_id?: string
          created_at?: string
          from_stage?: string | null
          id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_candidate_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_candidate_messages: {
        Row: {
          body: string
          candidate_id: string
          created_at: string
          file_path: string | null
          id: string
          kind: string
          sender: string
          sender_id: string | null
        }
        Insert: {
          body: string
          candidate_id: string
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          sender: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          candidate_id?: string
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          sender?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_candidate_messages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_candidates: {
        Row: {
          application_ref: string | null
          assigned_recruiter: string | null
          availability: string
          candidate_user_id: string | null
          city: string
          course: string
          created_at: string
          created_by: string | null
          current_address: string
          current_ctc: number | null
          current_designation: string
          current_org: string
          dob: string | null
          email: string
          employee_user_id: string | null
          expected_ctc: number | null
          experience_years: number | null
          full_name: string
          gender: string
          id: string
          institute_id: string | null
          interview_at: string | null
          interviewer: string
          is_fresher: boolean
          job_id: string | null
          joining_date: string | null
          languages: string
          notes: string
          notice_period: string
          offer_note: string
          offer_responded_at: string | null
          offer_status: string
          offered_ctc: number | null
          passing_year: number | null
          permanent_address: string
          phone: string
          pincode: string
          priority: string
          probation_months: number | null
          qualification: string
          rating: number | null
          referral_code: string
          referral_conflict: boolean
          referral_link_id: string | null
          referral_name: string
          rejection_reason: string
          resume_path: string | null
          score: string
          skills: string
          source: string
          source_detail: string
          specialisation: string
          stage: string
          state: string
          university: string
          updated_at: string
          why_join: string
        }
        Insert: {
          application_ref?: string | null
          assigned_recruiter?: string | null
          availability?: string
          candidate_user_id?: string | null
          city?: string
          course?: string
          created_at?: string
          created_by?: string | null
          current_address?: string
          current_ctc?: number | null
          current_designation?: string
          current_org?: string
          dob?: string | null
          email?: string
          employee_user_id?: string | null
          expected_ctc?: number | null
          experience_years?: number | null
          full_name: string
          gender?: string
          id?: string
          institute_id?: string | null
          interview_at?: string | null
          interviewer?: string
          is_fresher?: boolean
          job_id?: string | null
          joining_date?: string | null
          languages?: string
          notes?: string
          notice_period?: string
          offer_note?: string
          offer_responded_at?: string | null
          offer_status?: string
          offered_ctc?: number | null
          passing_year?: number | null
          permanent_address?: string
          phone?: string
          pincode?: string
          priority?: string
          probation_months?: number | null
          qualification?: string
          rating?: number | null
          referral_code?: string
          referral_conflict?: boolean
          referral_link_id?: string | null
          referral_name?: string
          rejection_reason?: string
          resume_path?: string | null
          score?: string
          skills?: string
          source?: string
          source_detail?: string
          specialisation?: string
          stage?: string
          state?: string
          university?: string
          updated_at?: string
          why_join?: string
        }
        Update: {
          application_ref?: string | null
          assigned_recruiter?: string | null
          availability?: string
          candidate_user_id?: string | null
          city?: string
          course?: string
          created_at?: string
          created_by?: string | null
          current_address?: string
          current_ctc?: number | null
          current_designation?: string
          current_org?: string
          dob?: string | null
          email?: string
          employee_user_id?: string | null
          expected_ctc?: number | null
          experience_years?: number | null
          full_name?: string
          gender?: string
          id?: string
          institute_id?: string | null
          interview_at?: string | null
          interviewer?: string
          is_fresher?: boolean
          job_id?: string | null
          joining_date?: string | null
          languages?: string
          notes?: string
          notice_period?: string
          offer_note?: string
          offer_responded_at?: string | null
          offer_status?: string
          offered_ctc?: number | null
          passing_year?: number | null
          permanent_address?: string
          phone?: string
          pincode?: string
          priority?: string
          probation_months?: number | null
          qualification?: string
          rating?: number | null
          referral_code?: string
          referral_conflict?: boolean
          referral_link_id?: string | null
          referral_name?: string
          rejection_reason?: string
          resume_path?: string | null
          score?: string
          skills?: string
          source?: string
          source_detail?: string
          specialisation?: string
          stage?: string
          state?: string
          university?: string
          updated_at?: string
          why_join?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_candidates_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "hr_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "hr_job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_candidates_referral_link_id_fkey"
            columns: ["referral_link_id"]
            isOneToOne: false
            referencedRelation: "hr_referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_master: {
        Row: {
          bank_last4: string
          department: string
          designation: string
          emergency_contact: string
          employee_code: string
          employee_record_id: string | null
          employment_type: string
          full_name: string
          joining_date: string | null
          pan_last4: string
          reporting_manager: string | null
          shift: string
          status: string
          updated_at: string
          user_id: string
          work_location: string
        }
        Insert: {
          bank_last4?: string
          department?: string
          designation?: string
          emergency_contact?: string
          employee_code: string
          employee_record_id?: string | null
          employment_type?: string
          full_name: string
          joining_date?: string | null
          pan_last4?: string
          reporting_manager?: string | null
          shift?: string
          status?: string
          updated_at?: string
          user_id: string
          work_location?: string
        }
        Update: {
          bank_last4?: string
          department?: string
          designation?: string
          emergency_contact?: string
          employee_code?: string
          employee_record_id?: string | null
          employment_type?: string
          full_name?: string
          joining_date?: string | null
          pan_last4?: string
          reporting_manager?: string | null
          shift?: string
          status?: string
          updated_at?: string
          user_id?: string
          work_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_master_employee_record_id_fkey"
            columns: ["employee_record_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_exits: {
        Row: {
          assets_returned: boolean
          fnf_amount: number | null
          id: string
          last_working_day: string | null
          leave_encashment: number
          other_dues: number
          pending_salary: number
          reason: string
          recoveries: number
          resignation_date: string
          settled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assets_returned?: boolean
          fnf_amount?: number | null
          id?: string
          last_working_day?: string | null
          leave_encashment?: number
          other_dues?: number
          pending_salary?: number
          reason?: string
          recoveries?: number
          resignation_date?: string
          settled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assets_returned?: boolean
          fnf_amount?: number | null
          id?: string
          last_working_day?: string | null
          leave_encashment?: number
          other_dues?: number
          pending_salary?: number
          reason?: string
          recoveries?: number
          resignation_date?: string
          settled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_grievances: {
        Row: {
          anonymous: boolean
          category: string
          created_at: string
          details: string
          hr_response: string | null
          id: string
          status: string
          submitted_by: string | null
          tracking_code: string
          updated_at: string
        }
        Insert: {
          anonymous?: boolean
          category: string
          created_at?: string
          details: string
          hr_response?: string | null
          id?: string
          status?: string
          submitted_by?: string | null
          tracking_code: string
          updated_at?: string
        }
        Update: {
          anonymous?: boolean
          category?: string
          created_at?: string
          details?: string
          hr_response?: string | null
          id?: string
          status?: string
          submitted_by?: string | null
          tracking_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_holidays: {
        Row: {
          created_at: string
          day: string
          kind: string
          name: string
        }
        Insert: {
          created_at?: string
          day: string
          kind?: string
          name: string
        }
        Update: {
          created_at?: string
          day?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      hr_institute_members: {
        Row: {
          active: boolean
          added_by: string | null
          created_at: string
          institute_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          added_by?: string | null
          created_at?: string
          institute_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          added_by?: string | null
          created_at?: string
          institute_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_institute_members_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "hr_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_institutes: {
        Row: {
          active: boolean
          city: string
          contact_name: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          kind: string
          name: string
          phone: string
        }
        Insert: {
          active?: boolean
          city?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          kind?: string
          name: string
          phone?: string
        }
        Update: {
          active?: boolean
          city?: string
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          kind?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      hr_interview_rounds: {
        Row: {
          candidate_feedback: string
          candidate_id: string
          created_at: string
          created_by: string | null
          id: string
          internal_feedback: string
          interviewer_name: string
          interviewer_user_id: string | null
          location_or_link: string
          mode: string
          recommendation: string
          round_type: string
          scheduled_at: string
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_feedback?: string
          candidate_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_feedback?: string
          interviewer_name?: string
          interviewer_user_id?: string | null
          location_or_link?: string
          mode?: string
          recommendation?: string
          round_type: string
          scheduled_at: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_feedback?: string
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          internal_feedback?: string
          interviewer_name?: string
          interviewer_user_id?: string | null
          location_or_link?: string
          mode?: string
          recommendation?: string
          round_type?: string
          scheduled_at?: string
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_interview_rounds_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_job_openings: {
        Row: {
          apply_end: string | null
          apply_start: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          department: string
          description: string
          designation: string
          employment_type: string
          experience_required: string
          id: string
          job_code: string
          location: string
          openings: number
          qualification: string
          recruiter_id: string | null
          reporting_manager: string
          required_docs: string
          responsibilities: string
          salary_range: string
          selection_process: string
          show_salary: boolean
          skills: string
          status: string
          title: string
          updated_at: string
          visibility: string
          work_mode: string
          working_days: string
          working_hours: string
        }
        Insert: {
          apply_end?: string | null
          apply_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          designation?: string
          employment_type?: string
          experience_required?: string
          id?: string
          job_code?: string
          location?: string
          openings?: number
          qualification?: string
          recruiter_id?: string | null
          reporting_manager?: string
          required_docs?: string
          responsibilities?: string
          salary_range?: string
          selection_process?: string
          show_salary?: boolean
          skills?: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
          work_mode?: string
          working_days?: string
          working_hours?: string
        }
        Update: {
          apply_end?: string | null
          apply_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          designation?: string
          employment_type?: string
          experience_required?: string
          id?: string
          job_code?: string
          location?: string
          openings?: number
          qualification?: string
          recruiter_id?: string | null
          reporting_manager?: string
          required_docs?: string
          responsibilities?: string
          salary_range?: string
          selection_process?: string
          show_salary?: boolean
          skills?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
          work_mode?: string
          working_days?: string
          working_hours?: string
        }
        Relationships: []
      }
      hr_letter_templates: {
        Row: {
          active: boolean
          body: string
          id: string
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          id?: string
          kind?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_letters: {
        Row: {
          body: string
          id: string
          issued_at: string
          issued_by: string | null
          kind: string
          ref_no: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          kind: string
          ref_no?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          kind?: string
          ref_no?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_onboarding_tasks: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          done_by: string | null
          employee_id: string
          id: string
          sort: number
          task: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          employee_id: string
          id?: string
          sort?: number
          task: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          employee_id?: string
          id?: string
          sort?: number
          task?: string
        }
        Relationships: []
      }
      hr_payslip_items: {
        Row: {
          advance_id: string | null
          amount: number
          created_at: string
          id: string
          kind: string
          label: string
          payslip_id: string
          request_id: string | null
          user_id: string
        }
        Insert: {
          advance_id?: string | null
          amount: number
          created_at?: string
          id?: string
          kind: string
          label?: string
          payslip_id: string
          request_id?: string | null
          user_id: string
        }
        Update: {
          advance_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          label?: string
          payslip_id?: string
          request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_payslip_items_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "hr_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payslip_items_payslip_id_fkey"
            columns: ["payslip_id"]
            isOneToOne: false
            referencedRelation: "hr_payslips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payslip_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payslips: {
        Row: {
          advance_recovery: number
          allowances: number
          basic: number
          created_by: string | null
          deductions: number
          gross: number
          hra: number
          id: string
          incentive: number
          lop_amount: number
          lop_days: number
          month: string
          net: number
          paid_ref: string
          reimbursement: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_recovery?: number
          allowances?: number
          basic?: number
          created_by?: string | null
          deductions?: number
          gross?: number
          hra?: number
          id?: string
          incentive?: number
          lop_amount?: number
          lop_days?: number
          month: string
          net?: number
          paid_ref?: string
          reimbursement?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_recovery?: number
          allowances?: number
          basic?: number
          created_by?: string | null
          deductions?: number
          gross?: number
          hra?: number
          id?: string
          incentive?: number
          lop_amount?: number
          lop_days?: number
          month?: string
          net?: number
          paid_ref?: string
          reimbursement?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_referral_links: {
        Row: {
          active: boolean
          clicks: number
          code: string
          commission_amount: number
          coordinator_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          institute_id: string | null
          job_id: string | null
          kind: string
          owner_contact: string
          owner_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          clicks?: number
          code: string
          commission_amount?: number
          coordinator_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          institute_id?: string | null
          job_id?: string | null
          kind: string
          owner_contact?: string
          owner_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          clicks?: number
          code?: string
          commission_amount?: number
          coordinator_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          institute_id?: string | null
          job_id?: string | null
          kind?: string
          owner_contact?: string
          owner_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_referral_links_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_referral_links_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "hr_institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_referral_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "hr_job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_referral_payouts: {
        Row: {
          amount: number
          candidate_id: string
          created_at: string
          id: string
          link_id: string | null
          note: string
          paid_reference: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          candidate_id: string
          created_at?: string
          id?: string
          link_id?: string | null
          note?: string
          paid_reference?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          candidate_id?: string
          created_at?: string
          id?: string
          link_id?: string | null
          note?: string
          paid_reference?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_referral_payouts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hr_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_referral_payouts_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "hr_referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_roster: {
        Row: {
          day: string
          note: string
          shift_code: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          day: string
          note?: string
          shift_code: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          day?: string
          note?: string
          shift_code?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_roster_shift_code_fkey"
            columns: ["shift_code"]
            isOneToOne: false
            referencedRelation: "hr_shifts"
            referencedColumns: ["code"]
          },
        ]
      }
      hr_salary_structures: {
        Row: {
          allowances: number
          basic: number
          deductions: number
          effective_from: string
          hra: number
          monthly_gross: number
          note: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          allowances?: number
          basic?: number
          deductions?: number
          effective_from?: string
          hra?: number
          monthly_gross?: number
          note?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          allowances?: number
          basic?: number
          deductions?: number
          effective_from?: string
          hra?: number
          monthly_gross?: number
          note?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hr_settings: {
        Row: {
          card_color: string
          card_footer: string
          id: boolean
          updated_at: string
        }
        Insert: {
          card_color?: string
          card_footer?: string
          id?: boolean
          updated_at?: string
        }
        Update: {
          card_color?: string
          card_footer?: string
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hr_shifts: {
        Row: {
          active: boolean
          code: string
          end_time: string | null
          is_off: boolean
          name: string
          sort_order: number
          start_time: string | null
        }
        Insert: {
          active?: boolean
          code: string
          end_time?: string | null
          is_off?: boolean
          name: string
          sort_order?: number
          start_time?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          end_time?: string | null
          is_off?: boolean
          name?: string
          sort_order?: number
          start_time?: string | null
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
      jury_evaluations: {
        Row: {
          application_id: string
          created_at: string
          decision: string
          feasibility: number
          id: string
          innovation: number
          juror_id: string
          market: number
          public_remarks: string
          remarks: string
          round: number
          team: number
        }
        Insert: {
          application_id: string
          created_at?: string
          decision: string
          feasibility: number
          id?: string
          innovation: number
          juror_id?: string
          market: number
          public_remarks?: string
          remarks?: string
          round: number
          team: number
        }
        Update: {
          application_id?: string
          created_at?: string
          decision?: string
          feasibility?: number
          id?: string
          innovation?: number
          juror_id?: string
          market?: number
          public_remarks?: string
          remarks?: string
          round?: number
          team?: number
        }
        Relationships: [
          {
            foreignKeyName: "jury_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "funding_applications"
            referencedColumns: ["id"]
          },
        ]
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
      manpower_candidates: {
        Row: {
          client_feedback: string
          client_id: string
          created_at: string
          created_by: string | null
          email: string
          expected_salary: number | null
          experience_years: number | null
          full_name: string
          id: string
          internal_note: string
          interview_at: string | null
          location: string
          phone: string
          requirement_id: string
          resume_path: string | null
          skills: string
          stage: string
          updated_at: string
        }
        Insert: {
          client_feedback?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          email?: string
          expected_salary?: number | null
          experience_years?: number | null
          full_name: string
          id?: string
          internal_note?: string
          interview_at?: string | null
          location?: string
          phone?: string
          requirement_id: string
          resume_path?: string | null
          skills?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          client_feedback?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          expected_salary?: number | null
          experience_years?: number | null
          full_name?: string
          id?: string
          internal_note?: string
          interview_at?: string | null
          location?: string
          phone?: string
          requirement_id?: string
          resume_path?: string | null
          skills?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manpower_candidates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manpower_candidates_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "manpower_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      manpower_deployments: {
        Row: {
          billing_rate: number
          candidate_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          designation: string
          end_date: string | null
          esic_applicable: boolean
          exit_reason: string
          id: string
          monthly_salary: number
          ot_rate: number
          pf_applicable: boolean
          replaced_by: string | null
          replacement_reason: string
          requirement_id: string | null
          start_date: string
          status: string
          updated_at: string
          worker_code: string
          worker_name: string
          worker_phone: string
        }
        Insert: {
          billing_rate?: number
          candidate_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          designation?: string
          end_date?: string | null
          esic_applicable?: boolean
          exit_reason?: string
          id?: string
          monthly_salary?: number
          ot_rate?: number
          pf_applicable?: boolean
          replaced_by?: string | null
          replacement_reason?: string
          requirement_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
          worker_code?: string
          worker_name: string
          worker_phone?: string
        }
        Update: {
          billing_rate?: number
          candidate_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          designation?: string
          end_date?: string | null
          esic_applicable?: boolean
          exit_reason?: string
          id?: string
          monthly_salary?: number
          ot_rate?: number
          pf_applicable?: boolean
          replaced_by?: string | null
          replacement_reason?: string
          requirement_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          worker_code?: string
          worker_name?: string
          worker_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "manpower_deployments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "manpower_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manpower_deployments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manpower_deployments_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "manpower_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manpower_deployments_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "manpower_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      manpower_events: {
        Row: {
          actor_id: string | null
          client_id: string
          estimated: boolean
          event: string
          happened_at: string
          id: string
          item_id: string
          item_table: string
          requirement_id: string | null
        }
        Insert: {
          actor_id?: string | null
          client_id: string
          estimated?: boolean
          event: string
          happened_at?: string
          id?: string
          item_id: string
          item_table: string
          requirement_id?: string | null
        }
        Update: {
          actor_id?: string | null
          client_id?: string
          estimated?: boolean
          event?: string
          happened_at?: string
          id?: string
          item_id?: string
          item_table?: string
          requirement_id?: string | null
        }
        Relationships: []
      }
      manpower_invoices: {
        Row: {
          cancel_reason: string
          client_id: string
          client_name: string
          created_at: string
          created_by: string | null
          gst: number
          gst_percent: number
          id: string
          invoice_no: string
          lines: Json
          month: string
          paid_at: string | null
          paid_by: string | null
          paid_reference: string
          service_fee: number
          service_fee_percent: number
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          cancel_reason?: string
          client_id: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          gst: number
          gst_percent?: number
          id?: string
          invoice_no: string
          lines?: Json
          month: string
          paid_at?: string | null
          paid_by?: string | null
          paid_reference?: string
          service_fee: number
          service_fee_percent: number
          status?: string
          subtotal: number
          total: number
        }
        Update: {
          cancel_reason?: string
          client_id?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          gst?: number
          gst_percent?: number
          id?: string
          invoice_no?: string
          lines?: Json
          month?: string
          paid_at?: string | null
          paid_by?: string | null
          paid_reference?: string
          service_fee?: number
          service_fee_percent?: number
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "manpower_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      manpower_requirements: {
        Row: {
          budget: string
          client_id: string
          contract_type: string
          created_at: string
          description: string
          experience: string
          filled: number
          headcount: number
          id: string
          location: string
          needed_by: string | null
          priority: string
          role_title: string
          shift: string
          status: string
          update_note: string
          updated_at: string
        }
        Insert: {
          budget?: string
          client_id: string
          contract_type?: string
          created_at?: string
          description?: string
          experience?: string
          filled?: number
          headcount?: number
          id?: string
          location?: string
          needed_by?: string | null
          priority?: string
          role_title: string
          shift?: string
          status?: string
          update_note?: string
          updated_at?: string
        }
        Update: {
          budget?: string
          client_id?: string
          contract_type?: string
          created_at?: string
          description?: string
          experience?: string
          filled?: number
          headcount?: number
          id?: string
          location?: string
          needed_by?: string | null
          priority?: string
          role_title?: string
          shift?: string
          status?: string
          update_note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manpower_requirements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      manpower_timesheets: {
        Row: {
          approved_at: string | null
          client_id: string
          client_note: string
          created_at: string
          created_by: string | null
          deployment_id: string
          id: string
          month: string
          ot_hours: number
          present_days: number
          status: string
          updated_at: string
          working_days: number
        }
        Insert: {
          approved_at?: string | null
          client_id: string
          client_note?: string
          created_at?: string
          created_by?: string | null
          deployment_id: string
          id?: string
          month: string
          ot_hours?: number
          present_days: number
          status?: string
          updated_at?: string
          working_days: number
        }
        Update: {
          approved_at?: string | null
          client_id?: string
          client_note?: string
          created_at?: string
          created_by?: string | null
          deployment_id?: string
          id?: string
          month?: string
          ot_hours?: number
          present_days?: number
          status?: string
          updated_at?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "manpower_timesheets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manpower_timesheets_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "manpower_deployments"
            referencedColumns: ["id"]
          },
        ]
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
      policy_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          policy_id: string
          user_id: string
          version: number
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          policy_id: string
          user_id?: string
          version: number
        }
        Update: {
          acknowledged_at?: string
          id?: string
          policy_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_acknowledgements_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "company_policies"
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
      research_milestones: {
        Row: {
          created_at: string
          done_at: string | null
          due_date: string | null
          id: string
          note: string
          position: number
          request_id: string
          step: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          due_date?: string | null
          id?: string
          note?: string
          position?: number
          request_id: string
          step: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          done_at?: string | null
          due_date?: string | null
          id?: string
          note?: string
          position?: number
          request_id?: string
          step?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_milestones_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "research_requests"
            referencedColumns: ["id"]
          },
        ]
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
      site_errors: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          id: number
          kind: string
          message: string
          name: string | null
          path: string
          resolved: boolean
          session_id: string | null
          source: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: never
          kind: string
          message: string
          name?: string | null
          path: string
          resolved?: boolean
          session_id?: string | null
          source?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: never
          kind?: string
          message?: string
          name?: string | null
          path?: string
          resolved?: boolean
          session_id?: string | null
          source?: string | null
        }
        Relationships: []
      }
      site_page_views: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device: string | null
          id: number
          load_ms: number | null
          os: string | null
          path: string
          referrer_host: string | null
          session_id: string
          source: string
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: never
          load_ms?: number | null
          os?: string | null
          path: string
          referrer_host?: string | null
          session_id: string
          source?: string
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: never
          load_ms?: number | null
          os?: string | null
          path?: string
          referrer_host?: string | null
          session_id?: string
          source?: string
        }
        Relationships: []
      }
      support_kb_articles: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          status: string
          tags: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          tags?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          tags?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      target_revisions: {
        Row: {
          action: string
          changed_by: string
          changed_by_name: string
          changed_by_role: string
          created_at: string
          id: string
          month: string
          new_calls: number
          new_revenue: number
          new_wins: number
          old_calls: number | null
          old_revenue: number | null
          old_wins: number | null
          owner_id: string
          reason: string
        }
        Insert: {
          action: string
          changed_by: string
          changed_by_name?: string
          changed_by_role: string
          created_at?: string
          id?: string
          month: string
          new_calls: number
          new_revenue: number
          new_wins: number
          old_calls?: number | null
          old_revenue?: number | null
          old_wins?: number | null
          owner_id: string
          reason?: string
        }
        Update: {
          action?: string
          changed_by?: string
          changed_by_name?: string
          changed_by_role?: string
          created_at?: string
          id?: string
          month?: string
          new_calls?: number
          new_revenue?: number
          new_wins?: number
          old_calls?: number | null
          old_revenue?: number | null
          old_wins?: number | null
          owner_id?: string
          reason?: string
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          attempts: number
          bucket: string
          copied_at: string | null
          drive_file_id: string | null
          drive_link: string | null
          file_name: string
          file_type: string
          id: string
          last_error: string
          object_path: string
          section: string
          size_bytes: number
          status: string
          uploaded_at: string
        }
        Insert: {
          attempts?: number
          bucket: string
          copied_at?: string | null
          drive_file_id?: string | null
          drive_link?: string | null
          file_name: string
          file_type?: string
          id?: string
          last_error?: string
          object_path: string
          section: string
          size_bytes?: number
          status?: string
          uploaded_at?: string
        }
        Update: {
          attempts?: number
          bucket?: string
          copied_at?: string | null
          drive_file_id?: string | null
          drive_link?: string | null
          file_name?: string
          file_type?: string
          id?: string
          last_error?: string
          object_path?: string
          section?: string
          size_bytes?: number
          status?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          created_at: string
          dashboard: string
          email: string
          event: string
          id: string
          path: string
          section: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard?: string
          email?: string
          event: string
          id?: string
          path?: string
          section?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard?: string
          email?: string
          event?: string
          id?: string
          path?: string
          section?: string
          user_agent?: string
          user_id?: string
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
      venture_clients: {
        Row: {
          assigned_bde: string | null
          category: string
          cin: string
          city: string
          created_at: string
          email: string
          founder_name: string
          gst: string
          id: string
          internal_notes: string
          kind: string
          monthly_revenue: number | null
          name: string
          owner_user_id: string | null
          phone: string
          pitch: string
          sector: string
          status: string
          team_size: number | null
          updated_at: string
          website: string
        }
        Insert: {
          assigned_bde?: string | null
          category?: string
          cin?: string
          city?: string
          created_at?: string
          email?: string
          founder_name?: string
          gst?: string
          id?: string
          internal_notes?: string
          kind?: string
          monthly_revenue?: number | null
          name: string
          owner_user_id?: string | null
          phone?: string
          pitch?: string
          sector?: string
          status?: string
          team_size?: number | null
          updated_at?: string
          website?: string
        }
        Update: {
          assigned_bde?: string | null
          category?: string
          cin?: string
          city?: string
          created_at?: string
          email?: string
          founder_name?: string
          gst?: string
          id?: string
          internal_notes?: string
          kind?: string
          monthly_revenue?: number | null
          name?: string
          owner_user_id?: string | null
          phone?: string
          pitch?: string
          sector?: string
          status?: string
          team_size?: number | null
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      venture_documents: {
        Row: {
          application_id: string | null
          client_id: string
          created_at: string
          doc_type: string
          file_name: string
          file_path: string | null
          id: string
          requested_by: string | null
          review_note: string
          status: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id?: string | null
          client_id: string
          created_at?: string
          doc_type: string
          file_name?: string
          file_path?: string | null
          id?: string
          requested_by?: string | null
          review_note?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string | null
          client_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string | null
          id?: string
          requested_by?: string | null
          review_note?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venture_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "funding_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_jurors: {
        Row: {
          active: boolean
          created_at: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          name?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      venture_orders: {
        Row: {
          amount: number | null
          assigned_to: string | null
          client_id: string
          client_note: string
          created_at: string
          id: string
          progress_note: string
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          client_id: string
          client_note?: string
          created_at?: string
          id?: string
          progress_note?: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          client_id?: string
          client_note?: string
          created_at?: string
          id?: string
          progress_note?: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venture_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "venture_services"
            referencedColumns: ["id"]
          },
        ]
      }
      venture_services: {
        Row: {
          active: boolean
          description: string
          id: string
          name: string
          pillar: string
          position: number
          price_note: string
        }
        Insert: {
          active?: boolean
          description?: string
          id?: string
          name: string
          pillar?: string
          position?: number
          price_note?: string
        }
        Update: {
          active?: boolean
          description?: string
          id?: string
          name?: string
          pillar?: string
          position?: number
          price_note?: string
        }
        Relationships: []
      }
      venture_tickets: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          reply: string
          status: string
          subject: string
          topic: string
          updated_at: string
        }
        Insert: {
          body?: string
          client_id: string
          created_at?: string
          id?: string
          reply?: string
          status?: string
          subject: string
          topic?: string
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          reply?: string
          status?: string
          subject?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venture_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "venture_clients"
            referencedColumns: ["id"]
          },
        ]
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
      volunteer_reward_schemes: {
        Row: {
          audience: string
          badge: string
          banner_tone: string
          created_at: string
          created_by: string
          criteria: string
          criteria_target: number
          description: string
          ends_on: string
          id: string
          reward: string
          reward_amount: number
          reward_type: string
          starts_on: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          badge?: string
          banner_tone?: string
          created_at?: string
          created_by?: string
          criteria: string
          criteria_target: number
          description?: string
          ends_on: string
          id?: string
          reward: string
          reward_amount?: number
          reward_type?: string
          starts_on: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          badge?: string
          banner_tone?: string
          created_at?: string
          created_by?: string
          criteria?: string
          criteria_target?: number
          description?: string
          ends_on?: string
          id?: string
          reward?: string
          reward_amount?: number
          reward_type?: string
          starts_on?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      volunteer_verify_codes: {
        Row: {
          code_hash: string
          set_by: string | null
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          code_hash: string
          set_by?: string | null
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          code_hash?: string
          set_by?: string | null
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_verify_codes_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: true
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
          fixed_incentive: number
          full_name: string
          gender: string
          id: string
          incentive_mode: string
          kyc_note: string
          kyc_status: string
          last_login_at: string | null
          mobile: string
          monthly_target: number
          payout_masked: string
          payout_method: string | null
          photo_path: string | null
          public_listing: boolean
          qualification: string
          referral_code: string
          revenue_target: number
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
          fixed_incentive?: number
          full_name: string
          gender?: string
          id?: string
          incentive_mode?: string
          kyc_note?: string
          kyc_status?: string
          last_login_at?: string | null
          mobile: string
          monthly_target?: number
          payout_masked?: string
          payout_method?: string | null
          photo_path?: string | null
          public_listing?: boolean
          qualification?: string
          referral_code?: string
          revenue_target?: number
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
          fixed_incentive?: number
          full_name?: string
          gender?: string
          id?: string
          incentive_mode?: string
          kyc_note?: string
          kyc_status?: string
          last_login_at?: string | null
          mobile?: string
          monthly_target?: number
          payout_masked?: string
          payout_method?: string | null
          photo_path?: string | null
          public_listing?: boolean
          qualification?: string
          referral_code?: string
          revenue_target?: number
          state?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          volunteer_code?: string
        }
        Relationships: []
      }
      work_request_counters: {
        Row: {
          last_serial: number
          period: string
        }
        Insert: {
          last_serial?: number
          period: string
        }
        Update: {
          last_serial?: number
          period?: string
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
      admin_automation_status: { Args: never; Returns: Json }
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
      admin_period_report: {
        Args: { _from: string; _to: string }
        Returns: Json
      }
      admin_retry_sheet_copies: { Args: never; Returns: number }
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
      admin_user_directory: {
        Args: never
        Returns: {
          access: string[]
          confirmed: boolean
          created_at: string
          email: string
          employee_code: string
          full_name: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      admin_view_as: {
        Args: { _reason: string; _target: string }
        Returns: Json
      }
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
      c_staff_name: { Args: { _uid: string }; Returns: string }
      can_view_people_profiles: { Args: never; Returns: boolean }
      candidate_email: { Args: never; Returns: string }
      candidate_my_applications: { Args: never; Returns: Json }
      candidate_owns: { Args: { _candidate: string }; Returns: boolean }
      candidate_respond_offer: {
        Args: { _accept: boolean; _candidate: string; _note?: string }
        Returns: undefined
      }
      candidate_send_message: {
        Args: { _body: string; _candidate: string; _file_path?: string }
        Returns: undefined
      }
      candidate_set_resume: {
        Args: { _candidate: string; _path: string }
        Returns: undefined
      }
      candidate_submit_assessment: {
        Args: { _assessment: string; _file_path?: string; _note: string }
        Returns: undefined
      }
      candidate_withdraw: { Args: { _candidate: string }; Returns: undefined }
      careers_apply: {
        Args: { _d: Json; _job: string; _ref?: string }
        Returns: Json
      }
      careers_open_jobs: {
        Args: never
        Returns: {
          apply_end: string
          created_at: string
          department: string
          description: string
          designation: string
          employment_type: string
          experience_required: string
          id: string
          job_code: string
          location: string
          openings: number
          qualification: string
          required_docs: string
          responsibilities: string
          salary_range: string
          selection_process: string
          skills: string
          title: string
          work_mode: string
          working_days: string
          working_hours: string
        }[]
      }
      careers_referral_click: { Args: { _code: string }; Returns: undefined }
      careers_referral_lookup: {
        Args: { _code: string; _job?: string }
        Returns: Json
      }
      careers_status: {
        Args: { _phone: string; _ref: string }
        Returns: {
          applied_at: string
          interview_at: string
          job_title: string
          stage: string
          stage_label: string
        }[]
      }
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
      crm_ack_coaching: { Args: { _id: string }; Returns: undefined }
      crm_assign_lead: {
        Args: { _lead: string; _owner: string }
        Returns: undefined
      }
      crm_can_access: { Args: { _owner: string }; Returns: boolean }
      crm_collection_present: {
        Args: { _day: string; _user: string }
        Returns: boolean
      }
      crm_create_lead: { Args: { _input: Json }; Returns: string }
      crm_customer_lookup: { Args: { _reference: string }; Returns: Json }
      crm_doc_folder_ok: { Args: { _name: string }; Returns: boolean }
      crm_import_submission: {
        Args: { _id: string; _kind: string; _owner: string }
        Returns: undefined
      }
      crm_leaderboard: {
        Args: { _month: string }
        Returns: {
          full_name: string
          rank: number
          role: string
          user_id: string
          verified: number
          won_deals: number
        }[]
      }
      crm_my_daily_wage: { Args: never; Returns: number }
      crm_my_manager: { Args: never; Returns: string }
      crm_onboard_member: {
        Args: { _input: Json; _user_id: string }
        Returns: undefined
      }
      crm_owner_for_code: { Args: { _code: string }; Returns: string }
      crm_reassign_leads: {
        Args: { _leads: string[]; _owner: string; _reason: string }
        Returns: number
      }
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
      crm_review_daily_report: {
        Args: { _id: string; _note?: string; _status: string }
        Returns: undefined
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
      crm_sales_month: {
        Args: { _month: string; _user: string }
        Returns: {
          collection_days: number
          direct_verified: number
          revenue_target: number
          sales_role: string
          volunteer_revenue: number
        }[]
      }
      crm_sales_role: { Args: { _user: string }; Returns: string }
      crm_submission_lead: {
        Args: { _kind: string; _owner?: string; r: Json }
        Returns: string
      }
      crm_submit_daily_report: {
        Args: {
          _blockers?: string
          _date: string
          _plan?: string
          _summary: string
        }
        Returns: string
      }
      crm_team_ids: { Args: { _user: string }; Returns: string[] }
      crm_verify_collection: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: string
      }
      crm_volunteer_revenue: {
        Args: { _since: string }
        Returns: {
          day: string
          employee_id: string
          forms: number
          revenue: number
        }[]
      }
      crm_zero_collection_nudge: { Args: never; Returns: number }
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
      funding_move: {
        Args: { _app: string; _note?: string; _stage: string; _status: string }
        Returns: undefined
      }
      funding_public_feedback: {
        Args: { _app: string }
        Returns: {
          created_at: string
          decision: string
          public_remarks: string
          round: number
        }[]
      }
      g4_report_rows: { Args: { _table: string }; Returns: Json[] }
      grievance_status: {
        Args: { _code: string }
        Returns: {
          hr_response: string
          status: string
          updated_at: string
        }[]
      }
      grievance_submit: {
        Args: { _anonymous: boolean; _category: string; _details: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hr_add_institute_member: {
        Args: { _email: string; _institute: string }
        Returns: string
      }
      hr_advance_balances: {
        Args: never
        Returns: {
          amount: number
          balance: number
          created_at: string
          id: string
          monthly_recovery: number
          note: string
          recovered: number
          request_id: string
          start_month: string
          status: string
          user_id: string
        }[]
      }
      hr_advance_cancel: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      hr_advance_plan: {
        Args: {
          _amount: number
          _monthly: number
          _note?: string
          _request?: string
          _start: string
          _user: string
        }
        Returns: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          monthly_recovery: number
          note: string
          request_id: string | null
          start_month: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hr_advances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hr_bulk_candidates: {
        Args: { _institute: string; _job: string; _rows: Json }
        Returns: Json
      }
      hr_correction_review: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      hr_generate_payroll: { Args: { _month: string }; Returns: number }
      hr_is_manager: { Args: never; Returns: boolean }
      hr_notify_staff: {
        Args: { _body: string; _link?: string; _title: string }
        Returns: undefined
      }
      hr_onboarding_start: { Args: { _employee_id: string }; Returns: number }
      hr_or_finance: { Args: never; Returns: boolean }
      hr_people_overview: {
        Args: { _month?: string }
        Returns: {
          absent: number
          deductions: number
          departments: string
          designation: string
          employee_code: string
          full_name: string
          half_days: number
          leave_days: number
          manager_name: string
          marked_days: number
          monthly_gross: number
          net_pay: number
          plan_active: boolean
          plan_slabs: Json
          present: number
          revenue_target: number
          team_role: string
          unverified_revenue: number
          user_id: string
          verified_revenue: number
          wfh: number
        }[]
      }
      hr_staff: { Args: never; Returns: boolean }
      hr_stage_text: { Args: { _s: string }; Returns: string }
      institute_candidates: {
        Args: { _institute?: string }
        Returns: {
          absent_days: number
          applied_on: string
          days_tracked: number
          employment_status: string
          full_name: string
          id: string
          institute_id: string
          institute_name: string
          job_title: string
          joining_date: string
          leave_days: number
          present_days: number
          stage: string
          tracking_until: string
        }[]
      }
      institute_of_caller: { Args: never; Returns: string }
      integration_report: {
        Args: {
          _items?: number
          _message?: string
          _ok: boolean
          _provider: string
        }
        Returns: undefined
      }
      interviewer_my_rounds: {
        Args: never
        Returns: {
          candidate_id: string
          candidate_name: string
          experience_years: number
          id: string
          internal_feedback: string
          job_title: string
          location_or_link: string
          mode: string
          qualification: string
          recommendation: string
          round_type: string
          scheduled_at: string
          score: number
          skills: string
          status: string
        }[]
      }
      is_active_employee: { Args: { _uid: string }; Returns: boolean }
      is_linked_volunteer: {
        Args: { _active_only?: boolean; _uid: string }
        Returns: boolean
      }
      is_staff_member: { Args: { _uid: string }; Returns: boolean }
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
      manpower_client_candidates: {
        Args: never
        Returns: {
          client_feedback: string
          experience_years: number
          full_name: string
          id: string
          interview_at: string
          location: string
          requirement_id: string
          role_title: string
          skills: string
          stage: string
        }[]
      }
      manpower_client_decide: {
        Args: {
          _decision: string
          _feedback?: string
          _id: string
          _interview_at?: string
        }
        Returns: undefined
      }
      manpower_client_deployments: {
        Args: never
        Returns: {
          billing_rate: number
          designation: string
          end_date: string
          id: string
          replacement_reason: string
          role_title: string
          start_date: string
          status: string
          worker_code: string
          worker_name: string
        }[]
      }
      manpower_client_timesheet: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      manpower_generate_invoice: {
        Args: { _client: string; _fee_percent: number; _month: string }
        Returns: string
      }
      manpower_in_rpc: { Args: never; Returns: boolean }
      manpower_invoice_action: {
        Args: { _action: string; _id: string; _note?: string }
        Returns: undefined
      }
      manpower_request_replacement: {
        Args: { _id: string; _reason: string }
        Returns: undefined
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
      my_id_card: {
        Args: never
        Returns: {
          card_color: string
          card_footer: string
          department: string
          designation: string
          employee_id: string
          full_name: string
          joining_date: string
          photo_url: string
          valid_until: string
        }[]
      }
      my_target_progress: {
        Args: { _month: string }
        Returns: {
          calls: number
          calls_target: number
          has_target: boolean
          revenue_target: number
          verified_collection: number
          wins_target: number
          won_deals: number
          won_value: number
        }[]
      }
      notifications_mark_read: { Args: { _id?: string }; Returns: undefined }
      people_profile_safe_text: { Args: { _value: string }; Returns: string }
      person_name: { Args: { _uid: string }; Returns: string }
      public_team_directory: {
        Args: never
        Returns: {
          department: string
          designation: string
          full_name: string
          kind: string
          location: string
          member_id: string
          photo_url: string
        }[]
      }
      queue_new_uploaded_files: { Args: never; Returns: number }
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
      reward_scheme_for_employee: {
        Args: { _audience: string; _creator: string; _employee: string }
        Returns: boolean
      }
      run_request_escalations: { Args: never; Returns: number }
      support_is_manager: { Args: never; Returns: boolean }
      support_log_ticket: {
        Args: {
          _category?: string
          _channel: string
          _description: string
          _email: string
          _full_name: string
          _phone: string
          _priority?: string
          _reference?: string
          _request_type: string
          _subject: string
        }
        Returns: {
          assigned_to: string | null
          category: string
          channel: string
          created_at: string
          csat_at: string | null
          csat_comment: string | null
          csat_rating: number | null
          customer_reference: string | null
          description: string
          due_at: string | null
          email: string
          escalated_at: string | null
          escalation_level: number
          finance_request_id: string | null
          finance_status: string
          first_response_at: string | null
          full_name: string
          id: string
          phone: string
          priority: string
          private_notes: string
          refund_amount: number | null
          request_type: string
          resolution: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_code: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "customer_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      support_send_refund: {
        Args: { _amount: number; _note?: string; _ticket: string }
        Returns: {
          assigned_to: string | null
          category: string
          channel: string
          created_at: string
          csat_at: string | null
          csat_comment: string | null
          csat_rating: number | null
          customer_reference: string | null
          description: string
          due_at: string | null
          email: string
          escalated_at: string | null
          escalation_level: number
          finance_request_id: string | null
          finance_status: string
          first_response_at: string | null
          full_name: string
          id: string
          phone: string
          priority: string
          private_notes: string
          refund_amount: number | null
          request_type: string
          resolution: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_code: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "customer_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      support_sla: { Args: { _priority: string }; Returns: string }
      support_team: {
        Args: never
        Returns: {
          active: boolean
          full_name: string
          level: string
          user_id: string
        }[]
      }
      target_set: {
        Args: {
          _calls: number
          _month: string
          _owner: string
          _reason?: string
          _revenue: number
          _wins: number
        }
        Returns: {
          action: string
          changed_by: string
          changed_by_name: string
          changed_by_role: string
          created_at: string
          id: string
          month: string
          new_calls: number
          new_revenue: number
          new_wins: number
          old_calls: number | null
          old_revenue: number | null
          old_wins: number | null
          owner_id: string
          reason: string
        }
        SetofOptions: {
          from: "*"
          to: "target_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      venture_can_see: { Args: { _client: string }; Returns: boolean }
      venture_can_see_ops: { Args: { _client: string }; Returns: boolean }
      venture_can_work: { Args: { _client: string }; Returns: boolean }
      venture_folder_client: { Args: { _name: string }; Returns: string }
      venture_is_admin: { Args: never; Returns: boolean }
      venture_is_desk: { Args: never; Returns: boolean }
      venture_is_juror: { Args: never; Returns: boolean }
      venture_is_owner: { Args: { _client: string }; Returns: boolean }
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
      verify_volunteer: {
        Args: { _code: string; _volunteer_id: string }
        Returns: {
          full_name: string
          location: string
          member_since: string
          status: string
          volunteer_id: string
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
      volunteer_has_verify_code: {
        Args: { _volunteer: string }
        Returns: boolean
      }
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
      volunteer_set_incentive: {
        Args: {
          _fixed?: number
          _mode: string
          _target?: number
          _volunteer: string
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
      volunteer_set_verify_code: {
        Args: { _code: string; _volunteer: string }
        Returns: boolean
      }
      volunteer_settle_fixed_incentives: {
        Args: { _month: string }
        Returns: number
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
