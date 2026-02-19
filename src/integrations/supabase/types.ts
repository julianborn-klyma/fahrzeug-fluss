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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointment_assignments: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          person_id: string
          person_name: string | null
          team_id: string | null
          trade: Database["public"]["Enums"]["trade_type"] | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          person_id: string
          person_name?: string | null
          team_id?: string | null
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          person_id?: string
          person_name?: string | null
          team_id?: string | null
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_assignments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "trade_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_type_documents: {
        Row: {
          appointment_type_id: string
          created_at: string
          document_type_id: string
          id: string
        }
        Insert: {
          appointment_type_id: string
          created_at?: string
          document_type_id: string
          id?: string
        }
        Update: {
          appointment_type_id?: string
          created_at?: string
          document_type_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_type_documents_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_type_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_type_fields: {
        Row: {
          appointment_type_id: string
          created_at: string
          display_order: number
          field_type: string
          id: string
          is_required: boolean
          label: string
          options: Json
          placeholder: string
          width: string
        }
        Insert: {
          appointment_type_id: string
          created_at?: string
          display_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          label: string
          options?: Json
          placeholder?: string
          width?: string
        }
        Update: {
          appointment_type_id?: string
          created_at?: string
          display_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          options?: Json
          placeholder?: string
          width?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_type_fields_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          is_internal: boolean
          name: string
          requires_documents: boolean
          trade: Database["public"]["Enums"]["trade_type"] | null
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_internal?: boolean
          name: string
          requires_documents?: boolean
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_internal?: boolean
          name?: string
          requires_documents?: boolean
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Relationships: []
      }
      bonus_settings: {
        Row: {
          half_year_bonus_pool: number
          id: string
          module_fahrzeuglager_enabled: boolean
          module_kalkulation_enabled: boolean
          module_klyma_os_enabled: boolean
          module_performance_enabled: boolean
          require_approval: boolean
          threshold_min_bonus: number
          threshold_min_neutral: number
          updated_at: string
          weight_cleanliness: number
          weight_quality: number
          weight_reliability: number
          weight_speed: number
          weight_team: number
          work_day_end: string
          work_day_start: string
        }
        Insert: {
          half_year_bonus_pool?: number
          id?: string
          module_fahrzeuglager_enabled?: boolean
          module_kalkulation_enabled?: boolean
          module_klyma_os_enabled?: boolean
          module_performance_enabled?: boolean
          require_approval?: boolean
          threshold_min_bonus?: number
          threshold_min_neutral?: number
          updated_at?: string
          weight_cleanliness?: number
          weight_quality?: number
          weight_reliability?: number
          weight_speed?: number
          weight_team?: number
          work_day_end?: string
          work_day_start?: string
        }
        Update: {
          half_year_bonus_pool?: number
          id?: string
          module_fahrzeuglager_enabled?: boolean
          module_kalkulation_enabled?: boolean
          module_klyma_os_enabled?: boolean
          module_performance_enabled?: boolean
          require_approval?: boolean
          threshold_min_bonus?: number
          threshold_min_neutral?: number
          updated_at?: string
          weight_cleanliness?: number
          weight_quality?: number
          weight_reliability?: number
          weight_speed?: number
          weight_team?: number
          work_day_end?: string
          work_day_start?: string
        }
        Relationships: []
      }
      checklist_template_steps: {
        Row: {
          created_at: string
          description: string
          id: string
          is_required: boolean
          options: Json
          order_index: number
          parent_step_id: string | null
          step_type: string
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_required?: boolean
          options?: Json
          order_index?: number
          parent_step_id?: string | null
          step_type?: string
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_required?: boolean
          options?: Json
          order_index?: number
          parent_step_id?: string | null
          step_type?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_steps_parent_step_id_fkey"
            columns: ["parent_step_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_template_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          appointment_type_id: string | null
          created_at: string
          description: string
          id: string
          is_standard: boolean
          name: string
          trade: Database["public"]["Enums"]["trade_type"] | null
        }
        Insert: {
          appointment_type_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_standard?: boolean
          name: string
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Update: {
          appointment_type_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_standard?: boolean
          name?: string
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          contact_id: string
          created_at: string
          id: string
          role: string | null
        }
        Insert: {
          client_id: string
          contact_id: string
          created_at?: string
          id?: string
          role?: string | null
        }
        Update: {
          client_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_city: string | null
          billing_postal_code: string | null
          billing_street: string | null
          client_type: string
          company_name: string | null
          contact_id: string | null
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          billing_city?: string | null
          billing_postal_code?: string | null
          billing_street?: string | null
          client_type?: string
          company_name?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          billing_city?: string | null
          billing_postal_code?: string | null
          billing_street?: string | null
          client_type?: string
          company_name?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          applicable_trades: Database["public"]["Enums"]["trade_type"][] | null
          category: string | null
          created_at: string
          id: string
          is_required: boolean
          name: string
        }
        Insert: {
          applicable_trades?: Database["public"]["Enums"]["trade_type"][] | null
          category?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          name: string
        }
        Update: {
          applicable_trades?: Database["public"]["Enums"]["trade_type"][] | null
          category?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          name?: string
        }
        Relationships: []
      }
      inventory_status: {
        Row: {
          current_quantity: number
          id: string
          material_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          current_quantity?: number
          id?: string
          material_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          current_quantity?: number
          id?: string
          material_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_status_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_status_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_appointment_assignments: {
        Row: {
          created_at: string
          id: string
          job_appointment_id: string
          person_id: string
          person_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_appointment_id: string
          person_id: string
          person_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_appointment_id?: string
          person_id?: string
          person_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_appointment_assignments_job_appointment_id_fkey"
            columns: ["job_appointment_id"]
            isOneToOne: false
            referencedRelation: "job_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      job_appointments: {
        Row: {
          appointment_type_id: string
          created_at: string
          end_date: string | null
          field_values: Json
          id: string
          is_internal: boolean | null
          job_id: string
          monteur_visible: boolean
          notes: string
          signature_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          appointment_type_id: string
          created_at?: string
          end_date?: string | null
          field_values?: Json
          id?: string
          is_internal?: boolean | null
          job_id: string
          monteur_visible?: boolean
          notes?: string
          signature_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          appointment_type_id?: string
          created_at?: string
          end_date?: string | null
          field_values?: Json
          id?: string
          is_internal?: boolean | null
          job_id?: string
          monteur_visible?: boolean
          notes?: string
          signature_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_appointments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklist_steps: {
        Row: {
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          is_completed: boolean
          is_required: boolean
          order_index: number
          parent_step_id: string | null
          photo_url: string | null
          photo_urls: string[]
          step_type: string
          template_step_id: string | null
          text_value: string | null
          title: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_required?: boolean
          order_index?: number
          parent_step_id?: string | null
          photo_url?: string | null
          photo_urls?: string[]
          step_type?: string
          template_step_id?: string | null
          text_value?: string | null
          title: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_required?: boolean
          order_index?: number
          parent_step_id?: string | null
          photo_url?: string | null
          photo_urls?: string[]
          step_type?: string
          template_step_id?: string | null
          text_value?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_checklist_steps_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "job_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_steps_parent_step_id_fkey"
            columns: ["parent_step_id"]
            isOneToOne: false
            referencedRelation: "job_checklist_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_steps_template_step_id_fkey"
            columns: ["template_step_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklists: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          job_id: string
          name: string
          status: string
          template_id: string | null
          trade: Database["public"]["Enums"]["trade_type"] | null
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          job_id: string
          name: string
          status?: string
          template_id?: string | null
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          status?: string
          template_id?: string | null
          trade?: Database["public"]["Enums"]["trade_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_checklists_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "job_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklists_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documents: {
        Row: {
          created_at: string
          document_type_id: string | null
          file_name: string
          file_path: string
          id: string
          job_id: string
          trade: Database["public"]["Enums"]["trade_type"] | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type_id?: string | null
          file_name: string
          file_path: string
          id?: string
          job_id: string
          trade?: Database["public"]["Enums"]["trade_type"] | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          job_id?: string
          trade?: Database["public"]["Enums"]["trade_type"] | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_trade_details: {
        Row: {
          appointment_end: string | null
          appointment_start: string | null
          assigned_team_members: string[] | null
          created_at: string
          id: string
          job_id: string
          technical_info: string | null
          trade: Database["public"]["Enums"]["trade_type"]
        }
        Insert: {
          appointment_end?: string | null
          appointment_start?: string | null
          assigned_team_members?: string[] | null
          created_at?: string
          id?: string
          job_id: string
          technical_info?: string | null
          trade: Database["public"]["Enums"]["trade_type"]
        }
        Update: {
          appointment_end?: string | null
          appointment_start?: string | null
          assigned_team_members?: string[] | null
          created_at?: string
          id?: string
          job_id?: string
          technical_info?: string | null
          trade?: Database["public"]["Enums"]["trade_type"]
        }
        Relationships: [
          {
            foreignKeyName: "job_trade_details_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          active_trades: Database["public"]["Enums"]["trade_type"][]
          assigned_to: string[] | null
          client_id: string | null
          contact_person_id: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          job_number: string
          order_type_id: string | null
          planner_id: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          trades: Database["public"]["Enums"]["trade_type"][]
          updated_at: string
        }
        Insert: {
          active_trades?: Database["public"]["Enums"]["trade_type"][]
          assigned_to?: string[] | null
          client_id?: string | null
          contact_person_id?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          job_number?: string
          order_type_id?: string | null
          planner_id?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          trades?: Database["public"]["Enums"]["trade_type"][]
          updated_at?: string
        }
        Update: {
          active_trades?: Database["public"]["Enums"]["trade_type"][]
          assigned_to?: string[] | null
          client_id?: string | null
          contact_person_id?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          job_number?: string
          order_type_id?: string | null
          planner_id?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          trades?: Database["public"]["Enums"]["trade_type"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_order_type_id_fkey"
            columns: ["order_type_id"]
            isOneToOne: false
            referencedRelation: "order_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_planner_id_fkey"
            columns: ["planner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      kalkulation_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kalkulation_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kalkulation_package_items: {
        Row: {
          created_at: string
          id: string
          package_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "kalkulation_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kalkulation_package_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_products"
            referencedColumns: ["id"]
          },
        ]
      }
      kalkulation_package_prices: {
        Row: {
          created_at: string
          custom_override_vk: number | null
          id: string
          package_id: string
          pricebook_id: string
        }
        Insert: {
          created_at?: string
          custom_override_vk?: number | null
          id?: string
          package_id: string
          pricebook_id: string
        }
        Update: {
          created_at?: string
          custom_override_vk?: number | null
          id?: string
          package_id?: string
          pricebook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kalkulation_package_prices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kalkulation_package_prices_pricebook_id_fkey"
            columns: ["pricebook_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_pricebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      kalkulation_packages: {
        Row: {
          article_number: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          article_number?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          article_number?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "kalkulation_packages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kalkulation_pricebooks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      kalkulation_product_prices: {
        Row: {
          calculation_factor: number
          created_at: string
          final_vk: number
          hourly_rate: number
          id: string
          material_cost: number
          pricebook_id: string
          product_id: string
          time_budget: number
        }
        Insert: {
          calculation_factor?: number
          created_at?: string
          final_vk?: number
          hourly_rate?: number
          id?: string
          material_cost?: number
          pricebook_id: string
          product_id: string
          time_budget?: number
        }
        Update: {
          calculation_factor?: number
          created_at?: string
          final_vk?: number
          hourly_rate?: number
          id?: string
          material_cost?: number
          pricebook_id?: string
          product_id?: string
          time_budget?: number
        }
        Relationships: [
          {
            foreignKeyName: "kalkulation_product_prices_pricebook_id_fkey"
            columns: ["pricebook_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_pricebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kalkulation_product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_products"
            referencedColumns: ["id"]
          },
        ]
      }
      kalkulation_products: {
        Row: {
          article_number: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          article_number?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          article_number?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "kalkulation_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kalkulation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_catalog: {
        Row: {
          article_number: string | null
          category: string
          created_at: string
          id: string
          item_type: string
          name: string
          sort_order: number
          target_quantity: number
          type_id: string
        }
        Insert: {
          article_number?: string | null
          category: string
          created_at?: string
          id?: string
          item_type?: string
          name: string
          sort_order?: number
          target_quantity?: number
          type_id: string
        }
        Update: {
          article_number?: string | null
          category?: string
          created_at?: string
          id?: string
          item_type?: string
          name?: string
          sort_order?: number
          target_quantity?: number
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_catalog_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      order_type_appointment_types: {
        Row: {
          appointment_type_id: string
          created_at: string
          display_order: number
          id: string
          order_type_id: string
        }
        Insert: {
          appointment_type_id: string
          created_at?: string
          display_order?: number
          id?: string
          order_type_id: string
        }
        Update: {
          appointment_type_id?: string
          created_at?: string
          display_order?: number
          id?: string
          order_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_type_appointment_types_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_type_appointment_types_order_type_id_fkey"
            columns: ["order_type_id"]
            isOneToOne: false
            referencedRelation: "order_types"
            referencedColumns: ["id"]
          },
        ]
      }
      order_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          comment: string | null
          created_at: string
          id: string
          monteur_id: string
          monthly_bonus: number
          review_month: string
          reviewer_id: string
          score_cleanliness: number
          score_quality: number
          score_reliability: number
          score_speed: number
          score_team: number
          status: string
          total_score: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          monteur_id: string
          monthly_bonus?: number
          review_month: string
          reviewer_id: string
          score_cleanliness?: number
          score_quality?: number
          score_reliability?: number
          score_speed?: number
          score_team?: number
          status?: string
          total_score?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          monteur_id?: string
          monthly_bonus?: number
          review_month?: string
          reviewer_id?: string
          score_cleanliness?: number
          score_quality?: number
          score_reliability?: number
          score_speed?: number
          score_team?: number
          status?: string
          total_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_city: string | null
          address_lat: number | null
          address_lng: number | null
          address_postal_code: string | null
          address_street: string | null
          created_at: string
          email: string
          id: string
          name: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_postal_code?: string | null
          address_street?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_lat?: number | null
          address_lng?: number | null
          address_postal_code?: string | null
          address_street?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          city: string | null
          client_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          old_heating: string | null
          postal_code: string | null
          property_type: string | null
          street_address: string | null
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          old_heating?: string | null
          postal_code?: string | null
          property_type?: string | null
          street_address?: string | null
        }
        Update: {
          city?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          old_heating?: string | null
          postal_code?: string | null
          property_type?: string | null
          street_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      property_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          property_id: string
          role: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          property_id: string
          role?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          property_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_contacts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      teamleiter_monteur_assignments: {
        Row: {
          created_at: string
          id: string
          monteur_id: string
          teamleiter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monteur_id: string
          teamleiter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monteur_id?: string
          teamleiter_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      trade_appointments: {
        Row: {
          created_at: string
          end_date: string
          id: string
          job_id: string
          notes: string | null
          start_date: string
          trade: Database["public"]["Enums"]["trade_type"]
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          job_id: string
          notes?: string | null
          start_date: string
          trade: Database["public"]["Enums"]["trade_type"]
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          job_id?: string
          notes?: string | null
          start_date?: string
          trade?: Database["public"]["Enums"]["trade_type"]
        }
        Relationships: [
          {
            foreignKeyName: "trade_appointments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
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
      user_vehicle_assignments: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          license_plate: string
          name: string
          type_id: string
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          license_plate: string
          name?: string
          type_id: string
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          license_plate?: string
          name?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "monteur" | "teamleiter" | "office"
      appointment_status:
        | "neu"
        | "in_planung"
        | "vorbereitet"
        | "in_umsetzung"
        | "review"
        | "abgenommen"
      job_status:
        | "erstellt"
        | "vorbereitet"
        | "verplant"
        | "durchgefuehrt"
        | "abgerechnet"
        | "neu"
        | "in_planung"
        | "in_umsetzung"
        | "nacharbeiten"
        | "abgeschlossen"
        | "review"
        | "abgenommen"
        | "ausfuehrung"
      trade_type: "SHK" | "Elektro" | "Fundament" | "Dach" | "GaLa"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "monteur", "teamleiter", "office"],
      appointment_status: [
        "neu",
        "in_planung",
        "vorbereitet",
        "in_umsetzung",
        "review",
        "abgenommen",
      ],
      job_status: [
        "erstellt",
        "vorbereitet",
        "verplant",
        "durchgefuehrt",
        "abgerechnet",
        "neu",
        "in_planung",
        "in_umsetzung",
        "nacharbeiten",
        "abgeschlossen",
        "review",
        "abgenommen",
        "ausfuehrung",
      ],
      trade_type: ["SHK", "Elektro", "Fundament", "Dach", "GaLa"],
    },
  },
} as const
