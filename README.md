# 🌍 StormGuard by team Sirap Bandung
StormGuard addresses the critical challenges of disaster response, resource allocation, and real-time alerts by combining cutting-edge AI technology with intuitive user interfaces and robust backend infrastructure.

## 📋 Overview

StormGuard addresses the critical challenges of disaster response, resource allocation, and real-time alerts by combining cutting-edge AI technology with intuitive user interfaces and robust backend infrastructure.

## ✨ Features

### 🚨 Real-Time Disaster Tracking
- Interactive 2D maps powered by Mapbox GL JS
- Live disaster monitoring with real-time updates
- Heat maps for disaster intensity visualization

### 🌤️ Weather Forecast
- Real-time and forecasted weather data integrated from OpenWeather API
- Key parameters like rainfall, wind speed, and temperature displayed on maps
- Alerts for severe weather conditions to help users plan ahead
- Data structured for easy AI processing and visualization

### 🤖 AI Analysis
- Google Gemini AI analyzes weather and disaster data for risk assessment
- Predicts potential hazards like floods or storms based on historical and current data
- Classifies locations by risk levels: High, Medium, or Low
- Supports decision-making for safe navigation and emergency response

### 🗺️ Smart Routing
- Calculates safest routes by avoiding high-risk or flooded areas
- Dynamic rerouting in real time based on disaster and traffic updates
- Visual representation of high-risk zones on the map
-Prioritizes both safety and efficiency for normal users, delivery, and emergency services

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with ShadCN UI components
- **State Management**: Zustand with real-time subscriptions
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Maps**: Mapbox GL JS with React Map GL
- **Charts**: Chart.js with React integration

### Backend & Database
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Authentication**: Supabase Auth with Row Level Security
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase storage for media files
- **Geospatial**: PostGIS for location queries

### AI & Machine Learning
- **Primary AI**: Google Gemini API

### Development & Deployment
- **Language**: TypeScript for type safety
- **Linting**: ESLint with TypeScript rules
- **Date Handling**: date-fns for efficient manipulation
- **Icons**: Lucide React icon library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Mapbox account and access token
- Google Gemini AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-powered-Disaster-Management-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MAPBOX_TOKEN=your_mapbox_access_token
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Database Setup**
   ```bash
   # Run the database migration
   npm run db:migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 📚 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # ShadCN UI components
│   ├── map/             # Map-related components
│   └── layouts/         # Layout components
├── pages/               # Page components
│   ├── auth/           # Authentication pages
│   ├── HomePage.tsx    # Landing page
│   ├── DashboardPage.tsx
│   ├── DisastersPage.tsx
│   ├── MedicalResourcesPage.tsx
│   ├── ReportsPage.tsx
│   ├── ChatbotPage.tsx
│   └── ProfilePage.tsx
├── store/              # Zustand state management
│   ├── authStore.ts
│   ├── disasterStore.ts
│   ├── medicalResourceStore.ts
│   ├── notificationStore.ts
│   └── aiPredictionStore.ts
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client
│   ├── gemini.ts       # Google Gemini AI
│   ├── utils.ts        # Helper functions
│   └── database.types.ts
├── hooks/              # Custom React hooks
└── assets/             # Static assets
```

## 🌐 API Integration

### Supabase Functions
- Real-time subscriptions for live updates
- Row Level Security for data protection
- Geospatial queries with PostGIS
- File storage for incident media

### Google Gemini AI
- Conversational chatbot responses
- Incident report credibility analysis
- Disaster prediction generation
- Resource allocation optimization

### Mapbox Services
- Interactive mapping
- Geocoding and reverse geocoding
- Routing and directions
- Satellite imagery

## 🎯 Key Features Implementation

### Smart Routing
- Integrates real-time disaster and weather data for route planning
- Highlights high-risk or flooded areas on the map
- Automatically calculates the safest and fastest routes
- Dynamic rerouting to avoid hazards and delays
- 
### AI-Powered Chatbot
- Multi-language support (5+ languages)
- Context-aware emergency responses
- Integration with system resources
- Conversation history and memory

### Community Reporting
- Photo/video evidence upload
- GPS location tagging
- AI credibility scoring
- Community moderation system


**Last Updated**: September 2025 by team Sirap Bandung
