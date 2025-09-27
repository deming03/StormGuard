import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Camera, 
  MapPin, 
  Upload, 
  X, 
  AlertTriangle,
  Navigation,
  Loader2
} from 'lucide-react'
import type { DisasterType, DisasterSeverity } from '@/lib/database.types'

interface CreateIncidentReportFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const CreateIncidentReportForm: React.FC<CreateIncidentReportFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'flood' as DisasterType,
    severity: '' as DisasterSeverity | '',
    location_description: '',
    reporter_contact: '',
    casualties_count: 0,
    damage_description: ''
  })

  const [location, setLocation] = useState<[number, number] | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const floodTypes: { value: DisasterType; label: string }[] = [
    { value: 'flood', label: '🌊 Flash Flood' },
    { value: 'flood', label: '🌊 River Flood' },
    { value: 'flood', label: '🌊 Urban Flood' },
    { value: 'flood', label: '🌊 Coastal Flood' }
  ]

  const severityLevels: { value: DisasterSeverity; label: string; color: string }[] = [
    { value: 'low', label: '🟢 Low', color: 'text-green-600' },
    { value: 'medium', label: '🟡 Medium', color: 'text-yellow-600' },
    { value: 'high', label: '🟠 High', color: 'text-orange-600' },
    { value: 'critical', label: '🔴 Critical', color: 'text-red-600' }
  ]

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      })
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude]
        setLocation(coords)
        setLocationLoading(false)
        toast({
          title: "Location captured",
          description: `Coordinates: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`,
        })
      },
      (error) => {
        setLocationLoading(false)
        toast({
          title: "Location error",
          description: "Unable to get your current location. Please enter location manually.",
          variant: "destructive"
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      setSelectedFiles(prev => [...prev, ...fileArray])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (reportId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${reportId}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('incident-reports')
        .upload(fileName, file)
      
      if (error) {
        console.error('File upload error:', error)
        continue
      }
      
      const { data: publicUrl } = supabase.storage
        .from('incident-reports')
        .getPublicUrl(fileName)
      
      uploadedUrls.push(publicUrl.publicUrl)
    }
    
    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.severity) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Create the incident report
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        incident_type: formData.incident_type,
        severity: formData.severity,
        location: location ? {
          type: 'Point',
          coordinates: location
        } : null,
        location_description: formData.location_description.trim() || null,
        reporter_contact: formData.reporter_contact.trim() || null,
        casualties_count: formData.casualties_count || 0,
        damage_description: formData.damage_description.trim() || null,
        status: 'pending' as const,
        is_verified: false,
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // In demo mode, create a mock report
      const reportId = 'report-' + Date.now()
      
      // Simulate file upload in demo mode
      let mediaUrls: string[] = []
      if (selectedFiles.length > 0) {
        // In demo mode, just create placeholder URLs
        mediaUrls = selectedFiles.map((file, index) => 
          `https://demo-storage.com/reports/${reportId}/file-${index}-${file.name}`
        )
      }

      // Create the report with media URLs
      const finalReportData = {
        ...reportData,
        id: reportId,
        media_urls: mediaUrls,
        reporter_id: 'demo-user-' + Date.now()
      }

      console.log('Created incident report:', finalReportData)

      toast({
        title: "Flood report submitted successfully!",
        description: "Your flood report has been submitted and will be reviewed by flood management authorities.",
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        incident_type: 'flood' as DisasterType,
        severity: '' as DisasterSeverity | '',
        location_description: '',
        reporter_contact: '',
        casualties_count: 0,
        damage_description: ''
      })
      setLocation(null)
      setSelectedFiles([])

      // Navigate back or call success callback
      if (onSuccess) {
        onSuccess()
      } else {
        // Navigate back to the parent route
        navigate(-1)
      }

    } catch (error) {
      console.error('Error creating report:', error)
      toast({
        title: "Submission failed",
        description: "Failed to submit your report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      // Navigate back to the parent route
      navigate(-1)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
Report Flood Incident
          </CardTitle>
          <CardDescription>
Report a flood incident to help authorities respond quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Flood Incident Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Flash flood on Main Street"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            {/* Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incident_type">Flood Type</Label>
                <Select 
                  value="flood" 
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="🌊 Flood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flood">🌊 Flood</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level *</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={(value) => handleInputChange('severity', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the flood situation, water levels, affected areas, and current conditions..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-4">
              <Label>Location Information</Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-2"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  Get Current Location
                </Button>
                
                {location && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <MapPin className="h-4 w-4" />
                    Location captured
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_description">Location Description</Label>
                <Input
                  id="location_description"
                  placeholder="e.g., Near City Mall, Main Street intersection"
                  value={formData.location_description}
                  onChange={(e) => handleInputChange('location_description', e.target.value)}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="casualties_count">Casualties Count</Label>
                <Input
                  id="casualties_count"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.casualties_count}
                  onChange={(e) => handleInputChange('casualties_count', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporter_contact">Your Contact (Optional)</Label>
                <Input
                  id="reporter_contact"
                  placeholder="Phone or email for follow-up"
                  value={formData.reporter_contact}
                  onChange={(e) => handleInputChange('reporter_contact', e.target.value)}
                />
              </div>
            </div>

            {/* Damage Description */}
            <div className="space-y-2">
              <Label htmlFor="damage_description">Damage Assessment</Label>
              <Textarea
                id="damage_description"
                placeholder="Describe flood damage to property, roads, infrastructure, or environment..."
                value={formData.damage_description}
                onChange={(e) => handleInputChange('damage_description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <Label>Photos/Videos (Optional)</Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Add Photos/Videos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Selected files ({selectedFiles.length}):
                  </p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Demo Mode Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                🎭 <strong>Demo Mode:</strong> This is a demonstration version. Your flood report will be created locally for testing purposes. In a real deployment, this would be sent to flood management authorities.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateIncidentReportForm
