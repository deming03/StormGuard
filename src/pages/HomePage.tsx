import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Waves, 
  MapPin, 
  Shield, 
  Brain, 
  Globe, 
  Users,
  MessageSquare,
  Camera,
  Zap,
  Navigation,
  AlertTriangle,
  Droplets
} from 'lucide-react'
import createGlobe from 'cobe'

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let phi = 0
    let globe: any = null

    const initializeGlobe = () => {
      if (canvasRef.current) {
        try {
          globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 1,
            width: 600,
            height: 600,
            phi: 0,
            theta: 0,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.3, 0.3, 0.3],
            markerColor: [0.1, 0.8, 1],
            glowColor: [1, 1, 1],
            scale: 1,
            offset: [0, 0],
            markers: [
              // Sample flood monitoring locations
              { location: [29.7604, -95.3698], size: 0.03 }, // Houston (flood-prone)
              { location: [25.7617, -80.1918], size: 0.03 },  // Miami (coastal flooding)
              { location: [40.7128, -74.0060], size: 0.03 },  // New York (storm surge)
              { location: [51.5074, -0.1278], size: 0.03 },   // London (Thames flooding)
              { location: [22.3193, 114.1694], size: 0.03 },  // Hong Kong (typhoon flooding)
            ],
            onRender: (state) => {
              state.phi = phi
              phi += 0.008
            }
          })

          // Make globe visible with a smooth fade-in
          setTimeout(() => {
            if (canvasRef.current) {
              canvasRef.current.style.opacity = '0.9'
            }
          }, 800)
        } catch (error) {
          console.error('Globe initialization failed:', error)
        }
      }
    }

    // Initialize with a delay to ensure DOM is ready
    const timer = setTimeout(initializeGlobe, 200)

    return () => {
      clearTimeout(timer)
      if (globe) {
        try {
          globe.destroy()
        } catch (error) {
          console.warn('Error destroying globe:', error)
        }
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">StormGuard AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/signin">
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white bg-transparent">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
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
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
            <div className="space-y-8 flex flex-col justify-center">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Waves className="w-3 h-3 mr-1" />
                  AI-Powered Storm Protection
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Smart Storm
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}Management
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Stay ahead of storms with AI-powered predictions, real-time monitoring, 
                  and community-driven early warning systems. Protect your community before disaster strikes.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/auth/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                    Start Storm Monitoring
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white bg-transparent">
                  View Live Storm Data
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>25,000+ Protected Communities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4" />
                  <span>Real-time Monitoring</span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-[600px] flex items-center justify-center">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl scale-75"></div>
              
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                style={{ 
                  width: '600px', 
                  height: '600px', 
                  opacity: 0
                }}
                className="relative z-10 transition-opacity duration-1000"
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
              Complete Storm Protection Suite
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From AI storm predictions to community alerts, our platform provides everything 
              needed for comprehensive storm management and protection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Waves className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Real-Time Storm Monitoring</CardTitle>
                <CardDescription className="text-gray-300">
                  Monitor storm conditions with live weather data, rainfall measurements, and predictive analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Interactive Storm Maps</CardTitle>
                <CardDescription className="text-gray-300">
                  Visualize storm risks and current conditions through advanced mapping with real-time overlays.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Navigation className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Smart Routing</CardTitle>
                <CardDescription className="text-gray-300">
                  Find safe routes and avoid storm-affected areas with AI-powered navigation and real-time updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">AI Storm Predictions</CardTitle>
                <CardDescription className="text-gray-300">
                  Leverage advanced AI models to predict storm risks and receive early warnings before storms arrive.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle className="text-white">Multilingual AI Assistant</CardTitle>
                <CardDescription className="text-gray-300">
                  Get instant storm safety guidance and emergency information through our intelligent chatbot.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-orange-400" />
                </div>
                <CardTitle className="text-white">Community Storm Reporting</CardTitle>
                <CardDescription className="text-gray-300">
                  Enable citizens to report storm conditions with photos and location data for rapid community response.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">99.2%</div>
              <div className="text-gray-300">Storm Prediction Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">15min</div>
              <div className="text-gray-300">Average Early Warning Time</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">50K+</div>
              <div className="text-gray-300">Lives Protected Daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white/5 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white">
              Ready to Protect Your Community from Storms?
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of communities, emergency responders, and citizens 
              making their areas safer with AI-powered storm management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Start Free Monitoring
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white bg-transparent">
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
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold">StormGuard AI</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 StormGuard AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}