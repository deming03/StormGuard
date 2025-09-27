import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useDisasterStore } from '@/store/disasterStore'
import { useNotificationStore } from '@/store/notificationStore'
import { 
  AlertTriangle, 
  Users, 
  Bell,
  MapPin,
  Clock,
  Shield,
  Activity,
  Plus
} from 'lucide-react'
import { severityUtils, disasterUtils, dateUtils } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { disasters, fetchDisasters } = useDisasterStore()
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    fetchDisasters()
    fetchNotifications()
  }, [])

  const activeDisasters = disasters.filter(d => d.status === 'active')
  const recentDisasters = disasters.slice(0, 5)
  const recentNotifications = notifications.slice(0, 3)
  const currentTime = new Date().getHours()
  const greeting = currentTime < 12 ? 'Good morning' : currentTime < 18 ? 'Good afternoon' : 'Good evening'

  const stats = [
    {
      title: "Active Floods",
      value: activeDisasters.filter(d => d.disaster_type === 'flood').length,
      change: "+12%",
      icon: AlertTriangle,
      gradient: "from-red-500 to-pink-500",
      bgGradient: "from-red-50 to-pink-50",
      description: "Currently monitored"
    },
    {
      title: "Response Teams",
      value: 45,
      change: "+7%",
      icon: Users,
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50",
      description: "Ready to assist"
    },
    {
      title: "Unread Alerts",
      value: unreadCount,
      change: "New",
      icon: Bell,
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-50 to-yellow-50",
      description: "Requires attention"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center py-8">
        <div className="mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Stay safe and informed with real-time flood monitoring
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System is monitoring your area</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className={`bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-green-600 font-medium">{stat.change} from last week</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{stat.title}</h3>
                <p className="text-sm text-gray-600">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Floods */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                  🌊 Recent Flood Activity
                </CardTitle>
                <CardDescription className="mt-1">
                  Stay informed about flood incidents in your area
                </CardDescription>
              </div>
              <Link to="/dashboard/disasters">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  View All Reports
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDisasters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">All Clear! ✨</h3>
                  <p className="text-gray-500 mb-4">No recent flood incidents reported in your area</p>
                  <p className="text-sm text-gray-400">We're continuously monitoring for your safety</p>
                </div>
              ) : (
                recentDisasters.map((disaster) => (
                  <div key={disaster.id} className="bg-white/60 rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:bg-white transition-all duration-200 cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl p-2 bg-blue-100 rounded-lg">
                        {disasterUtils.getIcon(disaster.disaster_type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-800 text-lg">{disaster.title}</h4>
                          <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${
                            disaster.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            disaster.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            disaster.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {disaster.severity}
                          </Badge>
                        </div>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">
                          {disaster.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{disasterUtils.getDisplayName(disaster.disaster_type)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{dateUtils.formatRelative(disaster.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions and Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">🚀 Quick Actions</CardTitle>
              <CardDescription>
                Get help or report incidents instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/dashboard/disasters/create">
                <Button className="w-full justify-start bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  <AlertTriangle className="mr-3 h-4 w-4" />
                  Report Flood Emergency
                </Button>
              </Link>
              <Link to="/dashboard/chatbot">
                <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  <Activity className="mr-3 h-4 w-4" />
                  Ask AI Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  🔔 Recent Alerts
                </CardTitle>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <CardDescription>
                Stay updated with the latest information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">All clear! ✨</p>
                    <p className="text-xs text-gray-500 mt-1">No urgent alerts at the moment</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <div key={notification.id} className={`p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                      !notification.is_read 
                        ? 'bg-white border-l-4 border-blue-500 shadow-sm' 
                        : 'bg-white/60 hover:bg-white'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{notification.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {dateUtils.formatRelative(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                📊 System Health
              </CardTitle>
              <CardDescription>
                Everything is running smoothly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-lg font-semibold text-green-600 mb-1">All Systems Operational</p>
                <p className="text-sm text-gray-600">Last checked: just now</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium text-gray-700">Monitoring</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium text-gray-700">AI Assistant</p>
                  <p className="text-xs text-green-600">Online</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium text-gray-700">Alerts</p>
                  <p className="text-xs text-green-600">Ready</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-medium text-gray-700">Updates</p>
                  <p className="text-xs text-green-600">Live</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
