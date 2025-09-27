import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { locationUtils, validation } from '@/lib/utils'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Bell, 
  Shield, 
  Save,
  Camera,
  Loader2,
  CheckCircle,
  Globe
} from 'lucide-react'
import type { UserRole, NotificationPreferences } from '@/lib/database.types'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().refine((val) => !val || validation.phone(val), {
    message: 'Please enter a valid phone number'
  }),
  organization: z.string().optional(),
  role: z.enum(['citizen', 'responder', 'coordinator', 'admin'] as const),
})

type ProfileForm = z.infer<typeof profileSchema>

const defaultNotificationPreferences: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  disasters: true,
  medical_resources: true,
  team_updates: true,
  chat_responses: false,
  severity_filter: ['medium', 'high', 'critical'],
  location_radius: 10000, // 10km
}

export default function ProfilePage() {
  const { profile, user, updateProfile, loading } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { toast } = useToast()
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    (profile?.notification_preferences as NotificationPreferences) || defaultNotificationPreferences
  )

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      organization: profile?.organization || '',
      role: profile?.role || 'citizen',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email,
        phone: profile.phone || '',
        organization: profile.organization || '',
        role: profile.role,
      })
      
      if (profile.notification_preferences) {
        setNotificationPrefs(profile.notification_preferences as NotificationPreferences)
      }

      // Parse location if available
      if (profile.location) {
        try {
          const locationData = JSON.parse(profile.location)
          if (locationData.coordinates) {
            setCurrentLocation(locationData.coordinates)
          }
        } catch (error) {
          console.error('Error parsing location:', error)
        }
      }
    }
  }, [profile, form])

  const onSubmitProfile = async (data: ProfileForm) => {
    try {
      await updateProfile(data)
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      })
    }
  }

  const updateLocation = async () => {
    setIsLocationLoading(true)
    try {
      const location = await locationUtils.getCurrentPosition()
      setCurrentLocation(location)
      
      const locationData = {
        type: 'Point',
        coordinates: location
      }

      await updateProfile({
        location: JSON.stringify(locationData)
      })

      toast({
        title: "Location updated",
        description: "Your location has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Location update failed",
        description: "Failed to get your current location. Please ensure location permissions are enabled.",
        variant: "destructive",
      })
    } finally {
      setIsLocationLoading(false)
    }
  }

  const updateNotificationPreferences = async () => {
    try {
      await updateProfile({
        notification_preferences: notificationPrefs
      })
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to save notification preferences.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'coordinator': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'responder': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src="" />
          <AvatarFallback className="text-lg">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile?.full_name || 'User Profile'}</h1>
          <p className="text-muted-foreground">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getRoleBadgeColor(profile?.role || 'citizen')} variant="outline">
              <User className="h-3 w-3 mr-1" />
              {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
            </Badge>
            {profile?.is_verified && (
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
                <Bell className="h-3 w-3 mr-1" />
                {unreadCount} alerts
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Change Photo
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      {...form.register('full_name')}
                    />
                    {form.formState.errors.full_name && (
                      <p className="text-sm text-red-500">{form.formState.errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...form.register('phone')}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={form.watch('role')} 
                      onValueChange={(value: UserRole) => form.setValue('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">Citizen</SelectItem>
                        <SelectItem value="responder">First Responder</SelectItem>
                        <SelectItem value="coordinator">Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.role && (
                      <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
                    )}
                  </div>
                </div>

                {(form.watch('role') === 'responder' || form.watch('role') === 'coordinator') && (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      placeholder="Fire Department, Red Cross, etc."
                      {...form.register('organization')}
                    />
                  </div>
                )}

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Settings
              </CardTitle>
              <CardDescription>
                Manage your location for better emergency response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Current Location</p>
                  <p className="text-sm text-muted-foreground">
                    {currentLocation 
                      ? locationUtils.formatCoordinates(currentLocation)
                      : 'Location not set'
                    }
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={updateLocation}
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="mr-2 h-4 w-4" />
                  )}
                  Update Location
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Notification Radius</Label>
                <Select 
                  value={notificationPrefs.location_radius.toString()}
                  onValueChange={(value) => setNotificationPrefs(prev => ({
                    ...prev,
                    location_radius: parseInt(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000">5 km</SelectItem>
                    <SelectItem value="10000">10 km</SelectItem>
                    <SelectItem value="25000">25 km</SelectItem>
                    <SelectItem value="50000">50 km</SelectItem>
                    <SelectItem value="100000">100 km</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for disasters within this radius
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Customize your alert preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Alerts</Label>
                  <Switch
                    id="email-notifications"
                    checked={notificationPrefs.email}
                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                      ...prev,
                      email: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={notificationPrefs.push}
                    onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                      ...prev,
                      push: checked
                    }))}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alert Types</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="disaster-alerts" className="text-sm">Disaster Alerts</Label>
                      <Switch
                        id="disaster-alerts"
                        checked={notificationPrefs.disasters}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                          ...prev,
                          disasters: checked
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="resource-alerts" className="text-sm">Medical Resources</Label>
                      <Switch
                        id="resource-alerts"
                        checked={notificationPrefs.medical_resources}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                          ...prev,
                          medical_resources: checked
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="team-alerts" className="text-sm">Team Updates</Label>
                      <Switch
                        id="team-alerts"
                        checked={notificationPrefs.team_updates}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                          ...prev,
                          team_updates: checked
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="chat-alerts" className="text-sm">Chat Responses</Label>
                      <Switch
                        id="chat-alerts"
                        checked={notificationPrefs.chat_responses}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                          ...prev,
                          chat_responses: checked
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Severity Filter</Label>
                  <p className="text-xs text-muted-foreground">
                    Only receive alerts for selected severity levels
                  </p>
                  <div className="space-y-2">
                    {['low', 'medium', 'high', 'critical'].map((severity) => (
                      <div key={severity} className="flex items-center justify-between">
                        <Label htmlFor={`severity-${severity}`} className="text-sm capitalize">
                          {severity}
                        </Label>
                        <Switch
                          id={`severity-${severity}`}
                          checked={notificationPrefs.severity_filter.includes(severity as any)}
                          onCheckedChange={(checked) => setNotificationPrefs(prev => ({
                            ...prev,
                            severity_filter: checked 
                              ? [...prev.severity_filter, severity as any]
                              : prev.severity_filter.filter(s => s !== severity)
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={updateNotificationPreferences} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Account Type</span>
                  <span className="text-sm font-medium capitalize">{profile?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Verification Status</span>
                  <span className={`text-sm font-medium ${
                    profile?.is_verified ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {profile?.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
