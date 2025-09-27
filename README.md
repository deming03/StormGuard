# 🌍 AI-Powered Disaster Management System

A comprehensive disaster management platform that leverages AI, real-time data, and community collaboration to predict, respond to, and recover from disasters more effectively.

![Platform Screenshot](docs/screenshot.png)

## 📋 Overview

This system addresses the critical challenges of disaster response, resource allocation, and real-time alerts by combining cutting-edge AI technology with intuitive user interfaces and robust backend infrastructure.

## ✨ Features

### 🚨 Real-Time Disaster Tracking
- Interactive 2D maps powered by Mapbox GL JS
- 3D globe visualization using COBE
- Live disaster monitoring with real-time updates
- Heat maps for disaster intensity visualization

### 🤖 AI-Powered Predictions
- Google Gemini integration for intelligent analysis
- LSTM models for time-series disaster forecasting
- Decision trees for response prioritization
- Misinformation detection for community reports

### 🏥 Medical Resource Discovery
- Location-based resource finding with radius search
- Real-time availability tracking
- Interactive maps showing nearby medical facilities
- Resource verification and rating system

### 📱 In-App Notifications
- Real-time alert system with severity filtering
- Location-based notifications
- Customizable notification preferences
- Multi-severity alert management

### 💬 Multilingual AI Chatbot
- Powered by Google Gemini AI
- Support for multiple languages (EN, ES, FR, ZH, AR)
- Context-aware emergency assistance
- 24/7 automated support

### 📸 Crowdsourced Incident Reports
- Geo-tagged photo and video submissions
- Community verification system
- AI-powered credibility analysis
- Upvoting and comment system

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with ShadCN UI components
- **State Management**: Zustand with real-time subscriptions
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Maps**: Mapbox GL JS with React Map GL
- **3D Visualization**: COBE globe
- **Charts**: Chart.js with React integration

### Backend & Database
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Authentication**: Supabase Auth with Row Level Security
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase storage for media files
- **Geospatial**: PostGIS for location queries

### AI & Machine Learning
- **Primary AI**: Google Gemini API
- **ML Framework**: TensorFlow.js for client-side processing
- **Time Series**: LSTM models for forecasting
- **Decision Support**: Custom algorithms for resource optimization

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

## 🗄️ Database Schema

The system uses PostgreSQL with PostGIS for geospatial capabilities:

### Core Tables
- **profiles** - User profiles with roles and preferences
- **disasters** - Disaster records with location and severity
- **medical_resources** - Location-based medical facilities
- **incident_reports** - Community-submitted incident reports
- **emergency_teams** - Response teams and deployments
- **notifications** - User notification system
- **chatbot_conversations** - AI chat history
- **ai_predictions** - ML predictions and analysis

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

### Real-time Disaster Tracking
- WebSocket connections through Supabase
- Live map updates with disaster markers
- Heat map visualization for intensity
- Automated severity classification

### Medical Resource Discovery
- Radius-based location search
- Real-time availability status
- Interactive resource mapping
- User-generated resource additions

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

## 📊 Performance & Scalability

- **Client-side State Management**: Zustand for efficient updates
- **Real-time Updates**: Optimized WebSocket subscriptions
- **Image Optimization**: Automatic compression and resizing
- **Caching Strategy**: Browser and CDN caching
- **Database Indexing**: Optimized geospatial queries

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security policies
- **Data Encryption**: End-to-end encryption for sensitive data
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API request throttling
- **CORS Protection**: Configured origin restrictions

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Ensure all environment variables are properly set in your production environment.

### Recommended Deployment Platforms
- **Vercel**: Excellent for React applications
- **Netlify**: Good for static deployments
- **Google Cloud Platform**: For full-stack deployment
- **AWS**: Enterprise-grade infrastructure

## 📈 Monitoring & Analytics

- **Error Tracking**: Integrated error boundaries
- **Performance Monitoring**: Core Web Vitals tracking
- **User Analytics**: Privacy-focused usage tracking
- **API Monitoring**: Response time and error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@disasterguard-ai.com

## 🙏 Acknowledgments

- Google Gemini AI team for advanced AI capabilities
- Mapbox for excellent mapping services
- Supabase for robust backend infrastructure
- Open source community for amazing tools and libraries

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] Real-time disaster tracking
- [x] Medical resource discovery
- [x] AI-powered chatbot
- [x] Community incident reporting
- [x] User authentication & profiles

### Phase 2: Advanced Features 🚧
- [ ] Mobile application (React Native)
- [ ] Advanced ML models for prediction
- [ ] Integration with government APIs
- [ ] Multi-tenant organization support

### Phase 3: Scale & Enterprise 📋
- [ ] Enterprise deployment options
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Multi-region deployment

---

Built with ❤️ for safer communities worldwide.

**Version**: 1.0.0  
**Last Updated**: September 2025
