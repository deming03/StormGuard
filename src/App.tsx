import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'
import LoadingScreen from '@/components/LoadingScreen'
import AuthLayout from '@/components/layouts/AuthLayout'
import MainLayout from '@/components/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import DashboardPage from '@/pages/DashboardPage'
import DisastersPage from '@/pages/DisastersPage'
import SmartRoutingPage from '@/pages/SmartRoutingPage'
import ChatbotPage from '@/pages/ChatbotPage'
import ProfilePage from '@/pages/ProfilePage'
import SignInPage from '@/pages/auth/SignInPage'
import SignUpPage from '@/pages/auth/SignUpPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function App() {
  const { loading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Any global initialization can go here
    console.log('StormGuard System initialized')
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Auth Routes */}
          <Route
            path="/auth/*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthLayout>
                  <Routes>
                    <Route path="signin" element={<SignInPage />} />
                    <Route path="signup" element={<SignUpPage />} />
                    <Route path="*" element={<Navigate to="/auth/signin" replace />} />
                  </Routes>
                </AuthLayout>
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard/*"
            element={
              isAuthenticated ? (
                <MainLayout>
                  <Routes>
                    <Route index element={<SmartRoutingPage />} />
                    <Route path="overview" element={<DashboardPage />} />
                    <Route path="disasters/*" element={<DisastersPage />} />
                    <Route path="smart-routing" element={<SmartRoutingPage />} />
                    <Route path="chatbot" element={<ChatbotPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Routes>
                </MainLayout>
              ) : (
                <Navigate to="/auth/signin" replace />
              )
            }
          />

          {/* Redirect any unknown routes */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
        
        {/* Global toast notifications */}
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}

export default App
