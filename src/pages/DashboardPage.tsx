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

  const stats = [
    {
      title: "Active Floods",
      value: activeDisasters.filter(d => d.disaster_type === 'flood').length,
      change: "+12%",
      icon: AlertTriangle,
      color: "text-red-500 bg-red-50 dark:bg-red-950",
    },
    {
      title: "Response Teams",
      value: 45, // This would come from emergency teams store
      change: "+7%",
      icon: Users,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Unread Alerts",
      value: unreadCount,
      change: "New",
      icon: Bell,
      color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your flood management system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color.split(' ')[0]}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Recent Floods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Floods
              </CardTitle>
              <CardDescription>
                Latest flood reports and updates
              </CardDescription>
            </div>
            <Link to="/dashboard/disasters">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDisasters.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent floods reported</p>
                  <p className="text-sm">That's good news!</p>
                </div>
              ) : (
                recentDisasters.map((disaster) => (
                  <div key={disaster.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="text-2xl">{disasterUtils.getIcon(disaster.disaster_type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{disaster.title}</h4>
                        <Badge className={severityUtils.getColor(disaster.severity)}>
                          {disaster.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {disaster.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{disasterUtils.getDisplayName(disaster.disaster_type)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{dateUtils.formatRelative(disaster.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar with Actions and Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/dashboard/disasters/create">
                <Button className="w-full justify-start" variant="outline">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Flood
                </Button>
              </Link>
              <Link to="/dashboard/chatbot">
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  Latest notifications and updates
                </CardDescription>
              </div>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent notifications</p>
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <div key={notification.id} className={`p-3 rounded-lg border transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' : 'hover:bg-muted/50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {dateUtils.formatRelative(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Platform health and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>API Response Time</span>
                  <span className="text-green-600">Good</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Database Health</span>
                  <span className="text-green-600">Excellent</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Real-time Updates</span>
                  <span className="text-green-600">Active</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Services</span>
                  <span className="text-green-600">Online</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
