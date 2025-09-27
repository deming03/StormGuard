import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import CreateIncidentReportForm from '@/components/CreateIncidentReportForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDisasterStore } from '@/store/disasterStore'
import { useMedicalResourceStore } from '@/store/medicalResourceStore'
import DisasterMap from '@/components/map/DisasterMap'
import { severityUtils, disasterUtils, dateUtils } from '@/lib/utils'
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  Map as MapIcon,
  List,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  Eye
} from 'lucide-react'
import type { DisasterSeverity, DisasterType, DisasterStatus } from '@/lib/database.types'

function DisastersListView() {
  const navigate = useNavigate()
  const { disasters, loading, fetchDisasters } = useDisasterStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<DisasterSeverity | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<DisasterType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DisasterStatus | 'all'>('active')

  useEffect(() => {
    fetchDisasters()
  }, [])

  const filteredDisasters = disasters.filter(disaster => {
    const matchesSearch = disaster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disaster.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || disaster.severity === severityFilter
    const matchesType = typeFilter === 'all' || disaster.disaster_type === typeFilter
    const matchesStatus = statusFilter === 'all' || disaster.status === statusFilter
    
    return matchesSearch && matchesSeverity && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Disaster Management</h1>
          <p className="text-muted-foreground">Monitor and manage active disasters</p>
        </div>
        <Button onClick={() => {
          console.log('Report Disaster button clicked')
          navigate('create')
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Report Disaster
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disasters</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disasters.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {disasters.filter(d => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {disasters.filter(d => d.severity === 'critical').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {disasters.reduce((sum, d) => sum + (d.estimated_affected_population || 0), 0).toLocaleString()}
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
                  placeholder="Search disasters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: DisasterStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(value: DisasterSeverity | 'all') => setSeverityFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
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
                <SelectItem value="tsunami">Tsunami</SelectItem>
                <SelectItem value="volcano">Volcano</SelectItem>
                <SelectItem value="drought">Drought</SelectItem>
                <SelectItem value="landslide">Landslide</SelectItem>
                <SelectItem value="blizzard">Blizzard</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disasters List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDisasters.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No disasters found</h3>
              <p className="text-muted-foreground">
                {searchTerm || severityFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No disasters have been reported yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDisasters.map((disaster) => (
            <Card key={disaster.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{disasterUtils.getIcon(disaster.disaster_type)}</div>
                      <div>
                        <h3 className="text-lg font-semibold">{disaster.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {disasterUtils.getDisplayName(disaster.disaster_type)} • {dateUtils.formatRelative(disaster.created_at)}
                        </p>
                      </div>
                    </div>

                    {disaster.description && (
                      <p className="text-muted-foreground line-clamp-2 ml-11">
                        {disaster.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-muted-foreground ml-11">
                      {disaster.estimated_affected_population && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{disaster.estimated_affected_population.toLocaleString()} affected</span>
                        </div>
                      )}
                      {disaster.casualties_reported > 0 && (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{disaster.casualties_reported} casualties</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Status: {disaster.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={severityUtils.getColor(disaster.severity)}>
                      {disaster.severity}
                    </Badge>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      View Details
                    </Button>
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

function DisastersMapView() {
  const { disasters, fetchDisasters } = useDisasterStore()
  const { resources } = useMedicalResourceStore()

  useEffect(() => {
    fetchDisasters()
  }, [])

  const handleDisasterClick = (disaster: any) => {
    console.log('Disaster clicked:', disaster)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Disaster Map</h1>
          <p className="text-muted-foreground">Real-time disaster visualization</p>
        </div>
      </div>

      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <DisasterMap
            disasters={disasters}
            medicalResources={resources}
            showMedicalResources={true}
            onDisasterClick={handleDisasterClick}
            className="h-full rounded-lg overflow-hidden"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function DisastersPage() {
  const location = useLocation()
  
  // Check if we're on a sub-route
  const isCreateRoute = location.pathname.includes('/create')
  const isDetailRoute = location.pathname.includes('/disasters/') && !isCreateRoute && location.pathname !== '/dashboard/disasters'

  // If we're on create route, show the form
  if (isCreateRoute) {
    return <CreateIncidentReportForm />
  }
  
  // If we're on detail route, show the detail view
  if (isDetailRoute) {
    return <div>Disaster Details (TODO)</div>
  }

  // Otherwise show the main disasters view
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
          <DisastersListView />
        </TabsContent>

        <TabsContent value="map">
          <DisastersMapView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
