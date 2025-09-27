export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DisasterType = 
  | 'earthquake'
  | 'flood'
  | 'hurricane'
  | 'wildfire'
  | 'tornado'
  | 'tsunami'
  | 'volcano'
  | 'drought'
  | 'landslide'
  | 'blizzard'
  | 'other'

export type DisasterSeverity = 'low' | 'medium' | 'high' | 'critical'
export type DisasterStatus = 'active' | 'monitoring' | 'resolved' | 'archived'
export type UserRole = 'citizen' | 'responder' | 'coordinator' | 'admin'
export type IncidentStatus = 'pending' | 'verified' | 'false_report' | 'resolved'
export type ResourceStatus = 'available' | 'deployed' | 'maintenance' | 'unavailable'
export type ResourceType = 'medical' | 'shelter' | 'food' | 'water' | 'transport' | 'communication' | 'rescue' | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          phone: string | null
          organization: string | null
          location: string | null // GeoJSON Point as string
          is_verified: boolean
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          organization?: string | null
          location?: string | null
          is_verified?: boolean
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          phone?: string | null
          organization?: string | null
          location?: string | null
          is_verified?: boolean
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      disasters: {
        Row: {
          id: string
          title: string
          description: string | null
          disaster_type: DisasterType
          severity: DisasterSeverity
          status: DisasterStatus
          location: string // GeoJSON Point as string
          affected_area: string | null // GeoJSON Polygon as string
          affected_radius: number | null
          estimated_affected_population: number | null
          casualties_reported: number
          damage_assessment: string | null
          weather_conditions: Json | null
          ai_prediction_data: Json | null
          lstm_forecast: Json | null
          created_by: string | null
          verified_by: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          disaster_type: DisasterType
          severity?: DisasterSeverity
          status?: DisasterStatus
          location: string
          affected_area?: string | null
          affected_radius?: number | null
          estimated_affected_population?: number | null
          casualties_reported?: number
          damage_assessment?: string | null
          weather_conditions?: Json | null
          ai_prediction_data?: Json | null
          lstm_forecast?: Json | null
          created_by?: string | null
          verified_by?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          disaster_type?: DisasterType
          severity?: DisasterSeverity
          status?: DisasterStatus
          location?: string
          affected_area?: string | null
          affected_radius?: number | null
          estimated_affected_population?: number | null
          casualties_reported?: number
          damage_assessment?: string | null
          weather_conditions?: Json | null
          ai_prediction_data?: Json | null
          lstm_forecast?: Json | null
          created_by?: string | null
          verified_by?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      incident_reports: {
        Row: {
          id: string
          title: string
          description: string
          incident_type: DisasterType | null
          severity: DisasterSeverity
          status: IncidentStatus
          location: string // GeoJSON Point as string
          address: string | null
          images: string[] | null
          videos: string[] | null
          contact_info: Json | null
          is_anonymous: boolean
          reported_by: string | null
          verified_by: string | null
          verification_notes: string | null
          upvotes: number
          downvotes: number
          ai_analysis: Json | null
          created_at: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          incident_type?: DisasterType | null
          severity?: DisasterSeverity
          status?: IncidentStatus
          location: string
          address?: string | null
          images?: string[] | null
          videos?: string[] | null
          contact_info?: Json | null
          is_anonymous?: boolean
          reported_by?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          upvotes?: number
          downvotes?: number
          ai_analysis?: Json | null
          created_at?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          incident_type?: DisasterType | null
          severity?: DisasterSeverity
          status?: IncidentStatus
          location?: string
          address?: string | null
          images?: string[] | null
          videos?: string[] | null
          contact_info?: Json | null
          is_anonymous?: boolean
          reported_by?: string | null
          verified_by?: string | null
          verification_notes?: string | null
          upvotes?: number
          downvotes?: number
          ai_analysis?: Json | null
          created_at?: string
          updated_at?: string
          verified_at?: string | null
        }
      }
      emergency_teams: {
        Row: {
          id: string
          name: string
          team_type: string | null
          description: string | null
          contact_phone: string | null
          contact_email: string | null
          leader_id: string | null
          members: string[] | null
          skills: string[] | null
          equipment: string[] | null
          current_location: string | null // GeoJSON Point as string
          home_base: string | null // GeoJSON Point as string
          status: ResourceStatus
          deployment_area: string | null // GeoJSON Polygon as string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          team_type?: string | null
          description?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          leader_id?: string | null
          members?: string[] | null
          skills?: string[] | null
          equipment?: string[] | null
          current_location?: string | null
          home_base?: string | null
          status?: ResourceStatus
          deployment_area?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          team_type?: string | null
          description?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          leader_id?: string | null
          members?: string[] | null
          skills?: string[] | null
          equipment?: string[] | null
          current_location?: string | null
          home_base?: string | null
          status?: ResourceStatus
          deployment_area?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_deployments: {
        Row: {
          id: string
          team_id: string
          disaster_id: string
          deployment_location: string // GeoJSON Point as string
          deployed_by: string | null
          deployed_at: string
          estimated_completion: string | null
          actual_completion: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          disaster_id: string
          deployment_location: string
          deployed_by?: string | null
          deployed_at?: string
          estimated_completion?: string | null
          actual_completion?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          disaster_id?: string
          deployment_location?: string
          deployed_by?: string | null
          deployed_at?: string
          estimated_completion?: string | null
          actual_completion?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          notification_type: string | null
          severity: DisasterSeverity
          data: Json | null
          is_read: boolean
          is_sent: boolean
          scheduled_for: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          notification_type?: string | null
          severity?: DisasterSeverity
          data?: Json | null
          is_read?: boolean
          is_sent?: boolean
          scheduled_for?: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          notification_type?: string | null
          severity?: DisasterSeverity
          data?: Json | null
          is_read?: boolean
          is_sent?: boolean
          scheduled_for?: string
          sent_at?: string | null
          created_at?: string
        }
      }
      chatbot_conversations: {
        Row: {
          id: string
          user_id: string
          session_id: string
          messages: Json
          language: string
          context: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          messages?: Json
          language?: string
          context?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          messages?: Json
          language?: string
          context?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_predictions: {
        Row: {
          id: string
          prediction_type: string
          model_name: string
          input_data: Json
          prediction_data: Json
          confidence_score: number | null
          location: string | null // GeoJSON Point as string
          prediction_horizon: string | null
          actual_outcome: Json | null
          is_validated: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          prediction_type: string
          model_name: string
          input_data: Json
          prediction_data: Json
          confidence_score?: number | null
          location?: string | null
          prediction_horizon?: string | null
          actual_outcome?: Json | null
          is_validated?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          prediction_type?: string
          model_name?: string
          input_data?: Json
          prediction_data?: Json
          confidence_score?: number | null
          location?: string | null
          prediction_horizon?: string | null
          actual_outcome?: Json | null
          is_validated?: boolean
          created_at?: string
          expires_at?: string | null
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
      disaster_type: DisasterType
      disaster_severity: DisasterSeverity
      disaster_status: DisasterStatus
      user_role: UserRole
      incident_status: IncidentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Utility types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Disaster = Database['public']['Tables']['disasters']['Row']
export type DisasterInsert = Database['public']['Tables']['disasters']['Insert']
export type DisasterUpdate = Database['public']['Tables']['disasters']['Update']


export type IncidentReport = Database['public']['Tables']['incident_reports']['Row']
export type IncidentReportInsert = Database['public']['Tables']['incident_reports']['Insert']
export type IncidentReportUpdate = Database['public']['Tables']['incident_reports']['Update']

export type EmergencyTeam = Database['public']['Tables']['emergency_teams']['Row']
export type EmergencyTeamInsert = Database['public']['Tables']['emergency_teams']['Insert']
export type EmergencyTeamUpdate = Database['public']['Tables']['emergency_teams']['Update']

export type TeamDeployment = Database['public']['Tables']['team_deployments']['Row']
export type TeamDeploymentInsert = Database['public']['Tables']['team_deployments']['Insert']
export type TeamDeploymentUpdate = Database['public']['Tables']['team_deployments']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type ChatbotConversation = Database['public']['Tables']['chatbot_conversations']['Row']
export type ChatbotConversationInsert = Database['public']['Tables']['chatbot_conversations']['Insert']
export type ChatbotConversationUpdate = Database['public']['Tables']['chatbot_conversations']['Update']

export type AiPrediction = Database['public']['Tables']['ai_predictions']['Row']
export type AiPredictionInsert = Database['public']['Tables']['ai_predictions']['Insert']
export type AiPredictionUpdate = Database['public']['Tables']['ai_predictions']['Update']

// GeoJSON types for location data
export interface Point {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface Polygon {
  type: 'Polygon'
  coordinates: [number, number][][] // Array of linear rings
}

// Extended types with parsed locations
export type DisasterWithLocation = Omit<Disaster, 'location' | 'affected_area'> & {
  location: Point
  affected_area?: Polygon
  response_teams_assigned?: string[]
  evacuation_status?: string
}


export type IncidentReportWithLocation = Omit<IncidentReport, 'location'> & {
  location: Point
}

// Chat message structure
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Notification preferences structure
export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  disasters: boolean
  team_updates: boolean
  chat_responses: boolean
  medical_resources: boolean
  severity_filter: DisasterSeverity[]
  location_radius: number // in meters
}

// Medical Resource types
export interface MedicalResource {
  id: string
  name: string
  resource_type: ResourceType
  description: string | null
  status: ResourceStatus
  capacity: number | null
  current_usage: number
  location: string // GeoJSON Point as string
  contact_info: Json | null
  specialties: string[] | null
  available_24_7: boolean
  created_at: string
  updated_at: string
}

export type MedicalResourceWithLocation = Omit<MedicalResource, 'location'> & {
  location: Point
}

// Safe Route types
export interface SafeRoute {
  id: string
  type: 'safest' | 'fastest' | 'shortest'
  routeType?: string
  coordinates: [number, number][]
  geometry?: [number, number][]
  distance: number
  duration: number
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  maxRiskLevel: 'low' | 'medium' | 'high' | 'extreme'
  safetyScore: number
  riskAreasEncountered?: number
  riskAreasAvoided?: number
  warnings: Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'extreme'
  }>
  waypoints: Array<{
    location: [number, number]
    description: string
    riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  }>
  hazards: Array<{
    type: string
    location: [number, number]
    severity: 'low' | 'medium' | 'high' | 'extreme'
    description: string
  }>
  instructions: Array<{
    instruction: string
    distance: number
    duration: number
    riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  }>
}
