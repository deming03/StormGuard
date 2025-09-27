import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import CreateIncidentReportForm from '@/components/CreateIncidentReportForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { disasterUtils, severityUtils, dateUtils } from '@/lib/utils'
import { 
  Camera, 
  Plus, 
  Search, 
  Filter,
  Map as MapIcon,
  List,
  Clock,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Upload,
  Users
} from 'lucide-react'
import type { IncidentReport, IncidentStatus, DisasterType } from '@/lib/database.types'

// Create a basic incident reports store (simplified for this implementation)
const useIncidentReportsStore = () => {
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setReports(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const updateReportVotes = async (id: string, type: 'upvote' | 'downvote') => {
    try {
      const report = reports.find(r => r.id === id)
      if (!report) return

      const updates = type === 'upvote' 
        ? { upvotes: report.upvotes + 1 }
        : { downvotes: report.downvotes + 1 }

      const { error } = await supabase
        .from('incident_reports')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setReports(prev => prev.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update votes')
    }
  }

  return {
    reports,
    loading,
    error,
    fetchReports,
    updateReportVotes,
    clearError: () => setError(null)
  }
}

function IncidentReportsListView() {
  const navigate = useNavigate()
  const { reports, loading, fetchReports, updateReportVotes } = useIncidentReportsStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<DisasterType | 'all'>('all')

  useEffect(() => {
    fetchReports()
  }, [])

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.incident_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'verified': return 'bg-green-100 text-green-800 border-green-200'
      case 'false_report': return 'bg-red-100 text-red-800 border-red-200'
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />
      case 'verified': return <CheckCircle className="h-3 w-3" />
      case 'false_report': return <AlertCircle className="h-3 w-3" />
      case 'resolved': return <CheckCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Incident Reports</h1>
          <p className="text-muted-foreground">Community-reported incidents and disasters</p>
        </div>
        <Button onClick={() => navigate('create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'verified').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Reporters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(reports.filter(r => r.reported_by).map(r => r.reported_by)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search incident reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: IncidentStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="false_report">False Report</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: DisasterType | 'all') => setTypeFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earthquake">Earthquake</SelectItem>
                <SelectItem value="flood">Flood</SelectItem>
                <SelectItem value="hurricane">Hurricane</SelectItem>
                <SelectItem value="wildfire">Wildfire</SelectItem>
                <SelectItem value="tornado">Tornado</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No incident reports found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No incidents have been reported yet.'}
              </p>
              <Button className="mt-4" onClick={() => navigate('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Report First Incident
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {report.is_anonymous ? 'A' : 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{report.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(report.status)} variant="outline">
                            {getStatusIcon(report.status)}
                            <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                          </Badge>
                          
                          {report.incident_type && (
                            <Badge className={disasterUtils.getColor(report.incident_type)} variant="outline">
                              <span className="mr-1">{disasterUtils.getIcon(report.incident_type)}</span>
                              {disasterUtils.getDisplayName(report.incident_type)}
                            </Badge>
                          )}

                          {report.severity && (
                            <Badge className={severityUtils.getColor(report.severity)}>
                              {report.severity}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {dateUtils.formatRelative(report.created_at)}
                        </p>
                        {!report.is_anonymous && (
                          <p className="text-xs text-muted-foreground">
                            by Community Reporter
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>

                    {report.address && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{report.address}</span>
                      </div>
                    )}

                    {(report.images?.length || report.videos?.length) && (
                      <div className="flex items-center space-x-2">
                        {report.images?.length && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Camera className="h-4 w-4" />
                            <span>{report.images.length} photos</span>
                          </div>
                        )}
                        {report.videos?.length && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <span>{report.videos.length} videos</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => updateReportVotes(report.id, 'upvote')}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {report.upvotes}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => updateReportVotes(report.id, 'downvote')}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {report.downvotes}
                        </Button>

                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Comment
                        </Button>
                      </div>

                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function IncidentReportsMapView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Incident Reports Map</h1>
          <p className="text-muted-foreground">Geographical view of reported incidents</p>
        </div>
      </div>

      <Card className="h-[600px]">
        <CardContent className="p-0 h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Incident reports map coming soon...</p>
            <p className="text-sm">This feature will show incident locations on an interactive map</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ReportsPage() {
  const location = useLocation()
  
  // Check if we're on a sub-route
  const isCreateRoute = location.pathname.includes('/create')
  const isDetailRoute = location.pathname.includes('/reports/') && !isCreateRoute && location.pathname !== '/dashboard/reports'

  // If we're on create route, show the form
  if (isCreateRoute) {
    return <CreateIncidentReportForm />
  }
  
  // If we're on detail route, show the detail view
  if (isDetailRoute) {
    return <div>Incident Report Details (TODO)</div>
  }

  // Otherwise show the main reports view
  return (
    <div>
      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          <IncidentReportsListView />
        </TabsContent>

        <TabsContent value="map">
          <IncidentReportsMapView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
