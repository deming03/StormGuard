import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  MapPin, 
  Heart, 
  Shield, 
  Brain, 
  Globe, 
  Users,
  MessageSquare,
  Camera,
  Zap
} from 'lucide-react'
import createGlobe from 'cobe'

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let phi = 0
    let width = 0
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
    
    window.addEventListener('resize', onResize)
    onResize()

    if (canvasRef.current) {
      const globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [0.1, 0.8, 1],
        glowColor: [1, 1, 1],
        markers: [
          // Sample disaster locations
          { location: [37.7595, -122.4367], size: 0.03 }, // San Francisco
          { location: [40.7128, -74.0060], size: 0.03 },  // New York
          { location: [35.6762, 139.6503], size: 0.03 },  // Tokyo
          { location: [51.5074, -0.1278], size: 0.03 },   // London
          { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
        ],
        onRender: (state) => {
          // Called on every animation frame.
          // `state` will be an empty object, return updated params.
          state.phi = phi
          phi += 0.01
        }
      })

      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.opacity = '1'
        }
      })

      return () => {
        globe.destroy()
        window.removeEventListener('resize', onResize)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">DisasterGuard AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/signin">
                <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Powered Emergency Response
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Smart Disaster
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}Management
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Harness the power of AI, real-time data, and community collaboration to predict, 
                  respond to, and recover from disasters faster than ever before.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/auth/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                    Start Protecting Lives
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10">
                  View Live Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>50,000+ Active Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Global Coverage</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', opacity: 0 }}
                className="transition-opacity duration-1000 max-w-[600px] max-h-[600px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-white">
              Comprehensive Disaster Management Suite
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From AI predictions to community response, our platform provides everything 
              needed for effective disaster management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <CardTitle className="text-white">Real-Time Disaster Tracking</CardTitle>
                <CardDescription className="text-gray-300">
                  Monitor active disasters with live updates, satellite imagery, and predictive analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Interactive 2D/3D Maps</CardTitle>
                <CardDescription className="text-gray-300">
                  Explore disasters and resources through advanced mapping with Mapbox and 3D globe visualization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Medical Resource Discovery</CardTitle>
                <CardDescription className="text-gray-300">
                  Find nearby hospitals, clinics, and medical supplies with location-based search.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">AI-Powered Predictions</CardTitle>
                <CardDescription className="text-gray-300">
                  Leverage Google Gemini and LSTM models for disaster forecasting and resource optimization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Multilingual AI Chatbot</CardTitle>
                <CardDescription className="text-gray-300">
                  Get instant help and information through our intelligent, multilingual chatbot assistant.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-orange-400" />
                </div>
                <CardTitle className="text-white">Crowdsourced Reporting</CardTitle>
                <CardDescription className="text-gray-300">
                  Enable citizens to report incidents with photos and location data for rapid response.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white">
              Ready to Transform Disaster Response?
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of emergency responders, coordinators, and citizens 
              making communities safer with AI-powered disaster management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Create Free Account
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10">
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-white font-semibold">DisasterGuard AI</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 DisasterGuard AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
