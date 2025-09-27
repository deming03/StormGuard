import React from 'react'
import { Card } from '@/components/ui/card'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding/Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              StormGuard
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              Real-time storm monitoring, AI-powered storm predictions, and efficient resource management for storm emergency response.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <span className="text-lg">🌊</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-Time Storm Tracking</h3>
                <p className="text-blue-100 text-sm">
                  Monitor storm events as they unfold with live weather data and interactive storm maps
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Storm Predictions</h3>
                <p className="text-blue-100 text-sm">
                  Leverage Google Gemini AI and LSTM models for storm forecasting and early warning
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <span className="text-lg">🚁</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Emergency Resources</h3>
                <p className="text-blue-100 text-sm">
                  Find and manage storm emergency resources including evacuation centers and rescue teams
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-10 right-20 w-20 h-20 border border-white/10 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/30 rounded-full"></div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              StormGuard
            </h1>
            <p className="text-gray-600">
              Storm monitoring and emergency response platform
            </p>
          </div>
          
          <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            {children}
          </Card>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
