import { useEffect, useRef, useState } from 'react'
import Map, { Marker, Popup, Layer, Source, NavigationControl, GeolocateControl } from 'react-map-gl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { severityUtils, disasterUtils, dateUtils } from '@/lib/utils'
import type { DisasterWithLocation } from '@/lib/database.types'
import { MapPin, Clock, Users, AlertTriangle, Navigation } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

interface DisasterMapProps {
  disasters?: DisasterWithLocation[]
  medicalResources?: any[] // Kept for compatibility but not used
  showMedicalResources?: boolean // Kept for compatibility but ignored
  initialViewport?: {
    longitude: number
    latitude: number
    zoom: number
  }
  onDisasterClick?: (disaster: DisasterWithLocation) => void
  className?: string
}

export default function DisasterMap({ 
  disasters = [], 
  medicalResources = [], // Ignored
  showMedicalResources = false, // Always false now
  initialViewport = { longitude: 101.6559, latitude: 2.9213, zoom: 15 }, // Centered on Rekascape
  onDisasterClick,
  className 
}: DisasterMapProps) {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterWithLocation | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  const [viewState, setViewState] = useState({
    longitude: initialViewport.longitude,
    latitude: initialViewport.latitude,
    zoom: initialViewport.zoom,
  })
  const [hasUserLocation, setHasUserLocation] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const mapRef = useRef<any>(null)

  // Enhanced location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    // Get initial location and center map
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [position.coords.longitude, position.coords.latitude]
        setUserLocation(location)
        setLocationError(null)
        setHasUserLocation(true)
        
        // Center map on user's real-time location with higher zoom
        setViewState({
          longitude: location[0],
          latitude: location[1],
          zoom: 16
        })

        // Update stores with real-time location
        updateStoresWithUserLocation(location)
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setLocationError(errorMessage)
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )

    // Start continuous location tracking
    if (isTrackingLocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const location: [number, number] = [position.coords.longitude, position.coords.latitude]
          setUserLocation(location)
          
          // Update stores when location changes
          updateStoresWithUserLocation(location)
        },
        (error) => {
          console.error('Location tracking error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000
        }
      )
    }

    // Cleanup function
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isTrackingLocation])

  // Function to update stores with user's real-time location
  const updateStoresWithUserLocation = (location: [number, number]) => {
    import('@/store/disasterStore').then(({ useDisasterStore }) => {
      // Update disasters with 2km radius
      useDisasterStore.getState().updateDisastersForLocation(location)
    })
  }

  // Function to start/stop location tracking
  const toggleLocationTracking = () => {
    setIsTrackingLocation(!isTrackingLocation)
  }

  // Function to center map on user location
  const centerOnUserLocation = () => {
    if (userLocation) {
      setViewState({
        longitude: userLocation[0],
        latitude: userLocation[1],
        zoom: 16
      })
    }
  }

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
      {/* Demo Mode Banner */}
      {!import.meta.env.VITE_MAPBOX_TOKEN && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-blue-500/90 text-white px-4 py-2 rounded-lg text-sm">
            🗺️ <strong>Demo Mode:</strong> Using demo Mapbox token. For production, configure VITE_MAPBOX_TOKEN.
          </div>
        </div>
      )}

      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute top-16 left-4 right-4 z-10">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
            📍 <strong>Location Error:</strong> {locationError}
          </div>
        </div>
      )}

      {/* Location Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          onClick={centerOnUserLocation}
          disabled={!userLocation}
          className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
          size="sm"
        >
          <Navigation className="h-4 w-4 mr-2" />
          My Location
        </Button>
        
        <Button
          onClick={toggleLocationTracking}
          className={`shadow-lg ${
            isTrackingLocation 
              ? 'bg-green-500/90 hover:bg-green-600 text-white' 
              : 'bg-white/90 hover:bg-white text-gray-800'
          }`}
          size="sm"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {isTrackingLocation ? 'Stop Tracking' : 'Track Location'}
        </Button>
      </div>

      {mapError ? (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <Button onClick={() => setMapError(null)}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"}
          onError={(e) => setMapError(e.error?.message || 'Failed to load map')}
          onClick={() => {
            setSelectedDisaster(null)
          }}
        >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl 
          position="bottom-right" 
          trackUserLocation={isTrackingLocation}
          showAccuracyCircle={true}
          showUserLocation={true}
          onGeolocate={(e) => {
            const location: [number, number] = [e.coords.longitude, e.coords.latitude]
            setUserLocation(location)
            setLocationError(null)
          }}
          onError={(error) => {
            setLocationError('Failed to get your location')
            console.error('GeolocateControl error:', error)
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
            <div className="relative">
              {/* Pulsing animation rings */}
              <div className="absolute -inset-2 w-8 h-8 bg-blue-400/20 rounded-full animate-ping"></div>
              <div className="absolute -inset-1 w-6 h-6 bg-blue-500/40 rounded-full animate-pulse"></div>
              {/* Main location dot */}
              <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
                <div className="absolute inset-0.5 w-3 h-3 bg-white rounded-full opacity-80"></div>
              </div>
              {/* Location accuracy indicator */}
              {isTrackingLocation && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
                  📍 Live Tracking
                </div>
              )}
              {!isTrackingLocation && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg">
                  📍 Your Location
                </div>
              )}
            </div>
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

      </Map>
      )}
    </div>
  )
}
