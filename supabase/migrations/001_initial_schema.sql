-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE disaster_type AS ENUM (
  'earthquake',
  'flood',
  'hurricane',
  'wildfire',
  'tornado',
  'tsunami',
  'volcano',
  'drought',
  'landslide',
  'blizzard',
  'other'
);

CREATE TYPE disaster_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE disaster_status AS ENUM ('active', 'monitoring', 'resolved', 'archived');
CREATE TYPE resource_type AS ENUM ('hospital', 'clinic', 'pharmacy', 'ambulance', 'blood_bank', 'medical_supplies', 'emergency_shelter');
CREATE TYPE resource_status AS ENUM ('available', 'busy', 'unavailable', 'maintenance');
CREATE TYPE user_role AS ENUM ('citizen', 'responder', 'coordinator', 'admin');
CREATE TYPE incident_status AS ENUM ('pending', 'verified', 'false_report', 'resolved');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role DEFAULT 'citizen',
  phone VARCHAR(20),
  organization VARCHAR(255),
  location GEOGRAPHY(POINT, 4326),
  is_verified BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disasters table
CREATE TABLE disasters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  disaster_type disaster_type NOT NULL,
  severity disaster_severity DEFAULT 'medium',
  status disaster_status DEFAULT 'active',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  affected_area GEOGRAPHY(POLYGON, 4326),
  affected_radius INTEGER, -- in meters
  estimated_affected_population INTEGER,
  casualties_reported INTEGER DEFAULT 0,
  damage_assessment TEXT,
  weather_conditions JSONB,
  ai_prediction_data JSONB,
  lstm_forecast JSONB,
  created_by UUID REFERENCES profiles(id),
  verified_by UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Medical Resources table
CREATE TABLE medical_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  resource_type resource_type NOT NULL,
  description TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  website VARCHAR(255),
  capacity INTEGER,
  current_availability INTEGER,
  status resource_status DEFAULT 'available',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  operating_hours JSONB,
  services_offered TEXT[],
  equipment_available TEXT[],
  emergency_contact VARCHAR(20),
  verification_documents TEXT[],
  added_by UUID REFERENCES profiles(id),
  verified_by UUID REFERENCES profiles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident Reports table (Crowdsourced)
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  incident_type disaster_type,
  severity disaster_severity DEFAULT 'medium',
  status incident_status DEFAULT 'pending',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  images TEXT[], -- URLs to uploaded images
  videos TEXT[], -- URLs to uploaded videos
  contact_info JSONB,
  is_anonymous BOOLEAN DEFAULT FALSE,
  reported_by UUID REFERENCES profiles(id),
  verified_by UUID REFERENCES profiles(id),
  verification_notes TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  ai_analysis JSONB, -- Gemini AI analysis results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Emergency Teams table
CREATE TABLE emergency_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  team_type VARCHAR(100), -- 'rescue', 'medical', 'fire', 'police', etc.
  description TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  leader_id UUID REFERENCES profiles(id),
  members UUID[], -- Array of profile IDs
  skills TEXT[],
  equipment TEXT[],
  current_location GEOGRAPHY(POINT, 4326),
  home_base GEOGRAPHY(POINT, 4326),
  status resource_status DEFAULT 'available',
  deployment_area GEOGRAPHY(POLYGON, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Deployments table
CREATE TABLE team_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES emergency_teams(id) ON DELETE CASCADE,
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  deployment_location GEOGRAPHY(POINT, 4326) NOT NULL,
  deployed_by UUID REFERENCES profiles(id),
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50), -- 'disaster_alert', 'resource_update', 'team_deployment', etc.
  severity disaster_severity DEFAULT 'medium',
  data JSONB, -- Additional notification data
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot Conversations table
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]', -- Array of {role, content, timestamp}
  language VARCHAR(10) DEFAULT 'en',
  context JSONB DEFAULT '{}', -- Conversation context for AI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Predictions table
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_type VARCHAR(100) NOT NULL, -- 'disaster_forecast', 'resource_demand', etc.
  model_name VARCHAR(100) NOT NULL, -- 'gemini', 'lstm', 'decision_tree', etc.
  input_data JSONB NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
  location GEOGRAPHY(POINT, 4326),
  prediction_horizon INTERVAL, -- How far into the future
  actual_outcome JSONB, -- For model training feedback
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_disasters_location ON disasters USING GIST (location);
CREATE INDEX idx_disasters_type_status ON disasters (disaster_type, status);
CREATE INDEX idx_disasters_severity ON disasters (severity);
CREATE INDEX idx_disasters_created_at ON disasters (created_at DESC);

CREATE INDEX idx_medical_resources_location ON medical_resources USING GIST (location);
CREATE INDEX idx_medical_resources_type_status ON medical_resources (resource_type, status);
CREATE INDEX idx_medical_resources_verified ON medical_resources (is_verified);

CREATE INDEX idx_incident_reports_location ON incident_reports USING GIST (location);
CREATE INDEX idx_incident_reports_status ON incident_reports (status);
CREATE INDEX idx_incident_reports_created_at ON incident_reports (created_at DESC);

CREATE INDEX idx_emergency_teams_location ON emergency_teams USING GIST (current_location);
CREATE INDEX idx_emergency_teams_status ON emergency_teams (status);

CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_scheduled ON notifications (scheduled_for);

CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_profiles_role ON profiles (role);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded based on requirements)
-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Disasters: Public read access, restricted write access
CREATE POLICY "Anyone can view disasters" ON disasters FOR SELECT USING (true);
CREATE POLICY "Verified users can create disasters" ON disasters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_verified = true OR role IN ('responder', 'coordinator', 'admin')))
);

-- Medical Resources: Public read access, restricted write access
CREATE POLICY "Anyone can view medical resources" ON medical_resources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add medical resources" ON medical_resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own medical resources" ON medical_resources FOR UPDATE USING (added_by = auth.uid());

-- Incident Reports: Public read access, authenticated write access
CREATE POLICY "Anyone can view verified incident reports" ON incident_reports FOR SELECT USING (status = 'verified' OR reported_by = auth.uid());
CREATE POLICY "Authenticated users can create incident reports" ON incident_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own incident reports" ON incident_reports FOR UPDATE USING (reported_by = auth.uid());

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Chatbot Conversations: Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON chatbot_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own conversations" ON chatbot_conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON chatbot_conversations FOR UPDATE USING (user_id = auth.uid());

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_disasters_updated_at BEFORE UPDATE ON disasters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_medical_resources_updated_at BEFORE UPDATE ON medical_resources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_incident_reports_updated_at BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_emergency_teams_updated_at BEFORE UPDATE ON emergency_teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_team_deployments_updated_at BEFORE UPDATE ON team_deployments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chatbot_conversations_updated_at BEFORE UPDATE ON chatbot_conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
