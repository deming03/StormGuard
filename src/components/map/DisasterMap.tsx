import { useEffect, useRef, useState } from 'react'
import Map, { Marker, Popup, Layer, Source, NavigationControl, GeolocateControl } from 'react-map-gl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { severityUtils, disasterUtils, dateUtils } from '@/lib/utils'
import type { DisasterWithLocation, MedicalResourceWithLocation } from '@/lib/database.types'
import { MapPin, Clock, Users, AlertTriangle, Heart, Navigation } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

interface DisasterMapProps {
  disasters?: DisasterWithLocation[]
  medicalResources?: MedicalResourceWithLocation[]
  showMedicalResources?: boolean
  initialViewport?: {
    longitude: number
    latitude: number
    zoom: number
  }
  onDisasterClick?: (disaster: DisasterWithLocation) => void
  onResourceClick?: (resource: MedicalResourceWithLocation) => void
  className?: string
}

export default function DisasterMap({ 
  disasters = [], 
  medicalResources = [],
  showMedicalResources = true,
  initialViewport = { longitude: -74.0060, latitude: 40.7128, zoom: 10 },
  onDisasterClick,
  onResourceClick,
  className 
}: DisasterMapProps) {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterWithLocation | null>(null)
  const [selectedResource, setSelectedResource] = useState<MedicalResourceWithLocation | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [viewState, setViewState] = useState({
    longitude: initialViewport.longitude,
    latitude: initialViewport.latitude,
    zoom: initialViewport.zoom,
  })

  const mapRef = useRef<any>(null)

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.longitude, position.coords.latitude]
          setUserLocation(location)
        },
        (error) => {
          console.log('Error getting location:', error)
        }
      )
    }
  }, [])

  // Create heat map data for disaster intensity
  const heatmapData = {
    type: 'FeatureCollection' as const,
    features: disasters.map(disaster => ({
      type: 'Feature' as const,
      properties: {
        intensity: severityUtils.getPriority(disaster.severity),
      },
      geometry: disaster.location
    }))
  }

  const heatmapLayer: any = {
    id: 'disasters-heat',
    type: 'heatmap',
    source: 'disasters',
    maxzoom: 15,
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'intensity'],
        1, 0,
        4, 1
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11, 1,
        15, 3
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11, 15,
        15, 20
      ],
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14, 1,
        15, 0
      ]
    }
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        onClick={() => {
          setSelectedDisaster(null)
          setSelectedResource(null)
        }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl 
          position="top-right" 
          trackUserLocation={true}
          onGeolocate={(e) => {
            setUserLocation([e.coords.longitude, e.coords.latitude])
          }}
        />

        {/* Disaster Heatmap */}
        {disasters.length > 0 && (
          <Source id="disasters" type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation[0]}
            latitude={userLocation[1]}
            anchor="center"
          >
            <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
          </Marker>
        )}

        {/* Disaster Markers */}
        {disasters.map((disaster) => (
          <Marker
            key={disaster.id}
            longitude={disaster.location.coordinates[0]}
            latitude={disaster.location.coordinates[1]}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedDisaster(disaster)
              setSelectedResource(null)
              onDisasterClick?.(disaster)
            }}
          >
            <div 
              className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                disaster.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                disaster.severity === 'high' ? 'bg-orange-500' :
                disaster.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              {disaster.severity === 'critical' && (
                <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping" />
              )}
            </div>
          </Marker>
        ))}

        {/* Medical Resource Markers */}
        {showMedicalResources && medicalResources.map((resource) => (
          <Marker
            key={resource.id}
            longitude={resource.location.coordinates[0]}
            latitude={resource.location.coordinates[1]}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedResource(resource)
              setSelectedDisaster(null)
              onResourceClick?.(resource)
            }}
          >
            <div 
              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                resource.status === 'available' ? 'bg-green-500' :
                resource.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            >
              <Heart className="w-3 h-3 text-white" />
            </div>
          </Marker>
        ))}

        {/* Disaster Popup */}
        {selectedDisaster && (
          <Popup
            longitude={selectedDisaster.location.coordinates[0]}
            latitude={selectedDisaster.location.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedDisaster(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{selectedDisaster.title}</h3>
                    <Badge className={severityUtils.getColor(selectedDisaster.severity)}>
                      {selectedDisaster.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {selectedDisaster.description}
                  </p>
                  
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <span>{disasterUtils.getIcon(selectedDisaster.disaster_type)}</span>
                      <span>{disasterUtils.getDisplayName(selectedDisaster.disaster_type)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{dateUtils.formatRelative(selectedDisaster.created_at)}</span>
                    </div>
                    {selectedDisaster.estimated_affected_population && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{selectedDisaster.estimated_affected_population.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button size="sm" className="w-full mt-2" variant="outline">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Popup>
        )}

        {/* Medical Resource Popup */}
        {selectedResource && (
          <Popup
            longitude={selectedResource.location.coordinates[0]}
            latitude={selectedResource.location.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedResource(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{selectedResource.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${
                      selectedResource.status === 'available' ? 'bg-green-500' :
                      selectedResource.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span>{selectedResource.resource_type === 'hospital' ? '🏥' : '⚕️'}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedResource.resource_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {selectedResource.address && (
                    <div className="flex items-start space-x-1">
                      <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{selectedResource.address}</span>
                    </div>
                  )}
                  
                  {selectedResource.contact_phone && (
                    <div className="text-xs">
                      <strong>Phone:</strong> {selectedResource.contact_phone}
                    </div>
                  )}
                  
                  {selectedResource.capacity && selectedResource.current_availability && (
                    <div className="text-xs">
                      <strong>Capacity:</strong> {selectedResource.current_availability}/{selectedResource.capacity}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                    <Button size="sm" className="flex-1">
                      Contact
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Popup>
        )}
      </Map>
    </div>
  )
}
