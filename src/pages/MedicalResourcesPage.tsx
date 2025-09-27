// @ts-ignore - React type resolution issue
import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMedicalResourceStore } from '@/store/medicalResourceStore'
import DisasterMap from '@/components/map/DisasterMap'
import { resourceUtils, locationUtils } from '@/lib/utils'
import { 
  Heart, 
  Plus, 
  Search, 
  Filter,
  Map as MapIcon,
  List,
  MapPin,
  Phone,
  Navigation,
  Star,
  CheckCircle
} from 'lucide-react'
import type { ResourceType, ResourceStatus } from '@/lib/database.types'

function MedicalResourcesListView() {
  const navigate = useNavigate()
  const { 
    resources, 
    nearbyResources, 
    loading, 
    searchLocation, 
    searchRadius,
    fetchResources, 
    fetchNearbyResources,
    setSearchRadius 
  } = useMedicalResourceStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | 'all'>('available')
  const [showNearbyOnly, setShowNearbyOnly] = useState(false)

  useEffect(() => {
    fetchResources()
    // Get user location and fetch nearby resources
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.longitude, position.coords.latitude]
          fetchNearbyResources(location)
        },
        (error) => {
          console.log('Error getting location:', error)
        }
      )
    }
  }, [])

  const displayResources = showNearbyOnly ? nearbyResources : resources

  const filteredResources = displayResources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.address?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter
    const matchesStatus = statusFilter === 'all' || resource.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.longitude, position.coords.latitude]
          fetchNearbyResources(location, searchRadius)
          setShowNearbyOnly(true)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Medical Resources</h1>
          <p className="text-muted-foreground">Find nearby medical facilities and supplies</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.filter(r => r.status === 'available').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hospitals</CardTitle>
            <span className="text-lg">🏥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.filter(r => r.resource_type === 'hospital').length}
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
              {resources.filter(r => r.is_verified).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Find Nearby Resources
          </CardTitle>
          <CardDescription>
            Search for medical resources within a specific radius of your location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={handleLocationSearch} className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Use Current Location
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">Within</span>
                <span className="text-sm font-medium">{locationUtils.formatDistance(searchRadius)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Search Radius</span>
                <span>{locationUtils.formatDistance(searchRadius)}</span>
              </div>
              <Slider
                value={[searchRadius]}
                onValueChange={(value: number[]) => setSearchRadius(value[0])}
                max={50000}
                min={1000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1km</span>
                <span>50km</span>
              </div>
            </div>

            {searchLocation && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {nearbyResources.length} resources near your location
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                >
                  {showNearbyOnly ? 'Show All Resources' : 'Show Nearby Only'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: ResourceStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: ResourceType | 'all') => setTypeFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="ambulance">Ambulance</SelectItem>
                <SelectItem value="blood_bank">Blood Bank</SelectItem>
                <SelectItem value="medical_supplies">Medical Supplies</SelectItem>
                <SelectItem value="emergency_shelter">Emergency Shelter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources List */}
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
        ) : filteredResources.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No medical resources found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No medical resources have been added yet.'}
              </p>
              <Button className="mt-4" onClick={() => navigate('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medical Resource
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{resourceUtils.getIcon(resource.resource_type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{resource.name}</h3>
                          {resource.is_verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={resourceUtils.getColor(resource.resource_type)} variant="outline">
                            {resourceUtils.getDisplayName(resource.resource_type)}
                          </Badge>
                          <div className={`flex items-center gap-1 text-xs ${
                            resource.status === 'available' ? 'text-green-600' :
                            resource.status === 'busy' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              resource.status === 'available' ? 'bg-green-500' :
                              resource.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="capitalize">{resource.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="text-muted-foreground line-clamp-2 ml-11">
                        {resource.description}
                      </p>
                    )}

                    <div className="ml-11 space-y-1">
                      {resource.address && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{resource.address}</span>
                        </div>
                      )}
                      
                      {resource.contact_phone && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{resource.contact_phone}</span>
                        </div>
                      )}

                      {resource.capacity && resource.current_availability !== null && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span>Capacity:</span>
                            <span className="font-medium">
                              {resource.current_availability}/{resource.capacity}
                            </span>
                          </div>
                        </div>
                      )}

                      {showNearbyOnly && searchLocation && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Navigation className="h-4 w-4" />
                          <span>
                            {locationUtils.formatDistance(
                              locationUtils.calculateDistance(searchLocation, resource.location.coordinates)
                            )} away
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">4.8</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Navigation className="h-3 w-3 mr-1" />
                        Directions
                      </Button>
                      <Button size="sm">
                        <Phone className="h-3 w-3 mr-1" />
                        Contact
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

function MedicalResourcesMapView() {
  const { resources, fetchResources } = useMedicalResourceStore()

  useEffect(() => {
    fetchResources()
  }, [])

  const handleResourceClick = (resource: any) => {
    console.log('Resource clicked:', resource)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Medical Resources Map</h1>
          <p className="text-muted-foreground">Interactive map of medical facilities</p>
        </div>
      </div>

      <Card className="h-[600px]">
        <CardContent className="p-0 h-full">
          <DisasterMap
            disasters={[]}
            medicalResources={resources}
            showMedicalResources={true}
            onResourceClick={handleResourceClick}
            className="h-full rounded-lg overflow-hidden"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function MedicalResourcesPage() {
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
          <MedicalResourcesListView />
        </TabsContent>

        <TabsContent value="map">
          <MedicalResourcesMapView />
        </TabsContent>
      </Tabs>

      <Routes>
        <Route path="create" element={<div>Create Medical Resource Form (TODO)</div>} />
        <Route path=":id" element={<div>Medical Resource Details (TODO)</div>} />
      </Routes>
    </div>
  )
}
