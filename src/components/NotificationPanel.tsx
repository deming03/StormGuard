import React, { useState, useEffect, useRef } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DisasterSeverity } from '@/lib/database.types'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications 
  } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const getSeverityIcon = (severity: DisasterSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: DisasterSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/20 lg:hidden" onClick={onClose} />
      
      {/* Panel */}
      <div 
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl",
          "lg:absolute lg:right-0 lg:top-12 lg:h-auto lg:max-h-[700px] lg:w-[480px] lg:rounded-lg lg:border",
          "transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <Card className="h-full lg:h-auto border-0 lg:border rounded-none lg:rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-120px)] lg:h-[580px]">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">You'll see emergency alerts and updates here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-5 border-l-4 transition-colors hover:bg-gray-50 cursor-pointer",
                        getSeverityColor(notification.severity),
                        !notification.is_read && "bg-blue-50/50"
                      )}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="space-y-3">
                        {/* Header with icon, title, and actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getSeverityIcon(notification.severity)}
                            <h4 className={cn(
                              "text-base font-medium leading-tight",
                              !notification.is_read && "font-semibold"
                            )}>
                              {notification.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Message content */}
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          {/* Additional data */}
                          {notification.data && typeof notification.data === 'object' && (
                            <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
                              {(notification.data as any).location && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Location:</span>
                                  <span>📍 {(notification.data as any).location}</span>
                                </div>
                              )}
                              {(notification.data as any).duration && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Duration:</span>
                                  <span>⏱️ {(notification.data as any).duration}</span>
                                </div>
                              )}
                              {(notification.data as any).wind_speed && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Wind Speed:</span>
                                  <span>💨 {(notification.data as any).wind_speed}</span>
                                </div>
                              )}
                              {(notification.data as any).api_reading && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">API Reading:</span>
                                  <span>🌫️ {(notification.data as any).api_reading}</span>
                                </div>
                              )}
                              {(notification.data as any).alternate_route && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Alternate Route:</span>
                                  <span>🛣️ {(notification.data as any).alternate_route}</span>
                                </div>
                              )}
                              {(notification.data as any).capacity_level && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Capacity:</span>
                                  <span>🏥 {(notification.data as any).capacity_level}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Footer with time and badges */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                            
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs font-medium",
                                notification.severity === 'critical' && "border-red-500 text-red-700 bg-red-50",
                                notification.severity === 'high' && "border-orange-500 text-orange-700 bg-orange-50",
                                notification.severity === 'medium' && "border-yellow-500 text-yellow-700 bg-yellow-50",
                                notification.severity === 'low' && "border-blue-500 text-blue-700 bg-blue-50"
                              )}
                            >
                              {notification.severity.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NotificationPanel
