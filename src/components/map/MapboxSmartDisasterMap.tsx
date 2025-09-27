import React, { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup, Layer, Source, NavigationControl, GeolocateControl } from 'react-map-gl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRiskAssessmentStore } from '@/store/riskAssessmentStore';
import { useWeatherStore } from '@/store/weatherStore';
import type { DisasterRiskAssessment } from '@/lib/gemini';
import type { SafeRoute, RoutePoint } from '@/lib/mapboxRoutingService';
import { MapPin, Navigation, AlertTriangle, Brain, Eye, EyeOff, Loader2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxSmartDisasterMapProps {
  locations: Array<{ lat: number; lon: number; name: string }>;
  onLocationSelect?: (lat: number, lon: number) => void;
  className?: string;
  initialViewport?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  showLegend?: boolean;
  // Routing props
  routes?: SafeRoute[];
  selectedRoute?: SafeRoute | null;
  startPoint?: RoutePoint | null;
  endPoint?: RoutePoint | null;
  onRouteClick?: (route: SafeRoute) => void;
}

const MapboxSmartDisasterMap: React.FC<MapboxSmartDisasterMapProps> = ({ 
  locations = [],
  onLocationSelect,
  className = '',
  initialViewport = { longitude: 101.6869, latitude: 3.139, zoom: 10 }, // Kuala Lumpur default
  showLegend = true,
  routes = [],
  selectedRoute = null,
  startPoint = null,
  endPoint = null,
  onRouteClick
}) => {
  const [viewState, setViewState] = useState({
    longitude: initialViewport.longitude,
    latitude: initialViewport.latitude,
    zoom: initialViewport.zoom,
  });
  
  const [selectedLocation, setSelectedLocation] = useState<DisasterRiskAssessment | null>(null);
  const [showRiskAreas, setShowRiskAreas] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const { riskAssessments, assessRisk, isAssessing } = useRiskAssessmentStore();
  const { weatherData, fetchWeatherForLocation, isLoading } = useWeatherStore();

  // Auto-load weather and risk data for locations
  useEffect(() => {
    locations.forEach(async (location) => {
      const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
      
      // Fetch weather if not already done
      if (!weatherData.has(locationKey)) {
        await fetchWeatherForLocation(location.lat, location.lon, location.name);
      }
      
      const weather = weatherData.get(locationKey);
      if (weather && !riskAssessments.has(locationKey)) {
        await assessRisk(locationKey, weather);
      }
    });
  }, [locations, weatherData, riskAssessments]);

  // Fit map to show all locations when locations change
  useEffect(() => {
    if (locations.length > 0) {
      // Calculate bounds
      let minLat = locations[0].lat;
      let maxLat = locations[0].lat;
      let minLon = locations[0].lon;
      let maxLon = locations[0].lon;

      locations.forEach(location => {
        minLat = Math.min(minLat, location.lat);
        maxLat = Math.max(maxLat, location.lat);
        minLon = Math.min(minLon, location.lon);
        maxLon = Math.max(maxLon, location.lon);
      });

      // Add padding
      const padding = 0.1;
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      
      if (locations.length === 1) {
        setViewState({
          longitude: locations[0].lon,
          latitude: locations[0].lat,
          zoom: 10,
        });
      } else {
        const latRange = maxLat - minLat;
        const lonRange = maxLon - minLon;
        const zoom = Math.min(10, Math.max(3, 8 - Math.max(latRange, lonRange) * 10));
        
        setViewState({
          longitude: centerLon,
          latitude: centerLat,
          zoom: zoom,
        });
      }
    }
  }, [locations]);

  // Get risk color
  const getRiskColor = (riskLevel: string): string => {
    const colors = {
      'low': '#dc2626',      // Red - All risk levels use red
      'medium': '#dc2626',   // Red - All risk levels use red
      'high': '#dc2626',     // Red - All risk levels use red
      'extreme': '#dc2626',  // Red - All risk levels use red
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Get risk badge color
  const getRiskBadgeColor = (riskLevel: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'extreme': 'bg-red-100 text-red-800',
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Handle map click
  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  // Handle marker click
  const handleMarkerClick = (location: any, riskAssessment?: DisasterRiskAssessment) => {
    setSelectedLocation(riskAssessment || null);
    if (onLocationSelect) {
      onLocationSelect(location.lat, location.lon);
    }
  };

  // Create risk area circles data for all risk locations
  const createRiskAreasData = () => {
    const features = locations
      .map(location => {
        const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
        const riskAssessment = riskAssessments.get(locationKey);
        
        if (!riskAssessment) {
          return null;
        }

        // Create a circle using turf-style buffer approximation
        const radiusKm = riskAssessment.affectedRadius;
        const radiusDegrees = radiusKm / 111; // Approximate conversion
        const points = 64;
        const coordinates = [];
        
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const lat = location.lat + radiusDegrees * Math.cos(angle);
          const lon = location.lon + radiusDegrees * Math.sin(angle) / Math.cos(location.lat * Math.PI / 180);
          coordinates.push([lon, lat]);
        }
        coordinates.push(coordinates[0]); // Close the polygon

        return {
          type: 'Feature',
          properties: {
            riskLevel: riskAssessment.overallRiskLevel,
            locationName: location.name,
            confidence: riskAssessment.confidence,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        };
      })
      .filter(Boolean);

    return {
      type: 'FeatureCollection',
      features,
    };
  };

  // Create route lines data for all routes
  const createRoutesData = () => {
    if (routes.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: routes.map((route, index) => ({
        type: 'Feature',
        properties: {
          routeId: route.id,
          routeType: route.routeType,
          safetyScore: route.safetyScore,
          riskLevel: route.riskLevel,
          isSelected: selectedRoute?.id === route.id,
          routeIndex: index,
        },
        geometry: {
          type: 'LineString',
          coordinates: route.geometry,
        },
      })),
    };
  };

  // Get route color based on safety score and selection
  const getRouteColor = (route: any) => {
    const isSelected = route.properties.isSelected;
    const safetyScore = route.properties.safetyScore;
    
    if (isSelected) {
      return '#2563eb'; // Blue for selected route
    }
    
    // Color based on safety score
    if (safetyScore >= 80) return '#10b981'; // Green
    if (safetyScore >= 60) return '#f59e0b'; // Yellow
    if (safetyScore >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Get route width based on selection
  const getRouteWidth = (isSelected: boolean) => {
    return isSelected ? 6 : 4;
  };

  if (mapError) {
    return (
      <div className={`relative w-full h-96 ${className}`}>
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Map Error</h3>
            <p className="text-gray-600 text-sm">{mapError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-96 ${className}`}>
      {/* Status indicators */}
      {(isLoading || isAssessing) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm">
            {isLoading && isAssessing ? 'Loading weather & assessing risk...' :
             isLoading ? 'Fetching weather data...' :
             isAssessing ? 'AI assessing disaster risk...' : ''}
          </span>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          onClick={() => setShowRiskAreas(!showRiskAreas)}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          {showRiskAreas ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          Risk Areas
        </Button>
      </div>

      {/* Mapbox Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"}
        onError={(e) => setMapError(e.error?.message || 'Failed to load map')}
        onClick={handleMapClick}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl 
          position="bottom-right" 
          trackUserLocation={true}
          showAccuracyCircle={true}
          showUserLocation={true}
        />

        {/* Risk Areas Layer */}
        {showRiskAreas && (
          <Source id="risk-areas" type="geojson" data={createRiskAreasData() as any}>
            <Layer
              id="risk-areas-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'riskLevel'],
                  'low', '#fbbf24',      // Darker yellow for low risk
                  'medium', '#fed7aa',   // Light orange for medium risk  
                  'high', '#fecaca',     // Light red for high risk
                  'extreme', '#dc2626',  // Dark red for extreme risk
                  '#fbbf24'             // Default to darker yellow
                ],
                'fill-opacity': [
                  'match',
                  ['get', 'riskLevel'],
                  'low', 0.3,
                  'medium', 0.4,
                  'high', 0.5,
                  'extreme', 0.6,
                  0.3
                ],
              }}
            />
            <Layer
              id="risk-areas-stroke"
              type="line"
              paint={{
                'line-color': [
                  'match',
                  ['get', 'riskLevel'],
                  'low', '#f59e0b',      // Orange border for low risk
                  'medium', '#ea580c',   // Dark orange for medium risk
                  'high', '#dc2626',     // Red for high risk
                  'extreme', '#991b1b',  // Dark red for extreme risk
                  '#f59e0b'             // Default border
                ],
                'line-width': [
                  'match',
                  ['get', 'riskLevel'],
                  'low', 1,
                  'medium', 2,
                  'high', 3,
                  'extreme', 4,
                  1
                ],
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Routes Layer */}
        {routes.length > 0 && createRoutesData() && (
          <Source id="routes" type="geojson" data={createRoutesData() as any}>
            <Layer
              id="routes"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['get', 'isSelected'],
                  '#2563eb',
                  [
                    'case',
                    ['>=', ['get', 'safetyScore'], 80], '#10b981',
                    ['>=', ['get', 'safetyScore'], 60], '#f59e0b',
                    ['>=', ['get', 'safetyScore'], 40], '#f97316',
                    '#ef4444'
                  ]
                ],
                'line-width': [
                  'case',
                  ['get', 'isSelected'],
                  6,
                  4
                ],
                'line-opacity': [
                  'case',
                  ['get', 'isSelected'],
                  0.9,
                  0.7
                ],
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </Source>
        )}

        {/* Start Point Marker */}
        {startPoint && (
          <Marker
            longitude={startPoint.lon}
            latitude={startPoint.lat}
            anchor="center"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg">
              <Navigation className="w-4 h-4 text-white" />
            </div>
          </Marker>
        )}

        {/* End Point Marker */}
        {endPoint && (
          <Marker
            longitude={endPoint.lon}
            latitude={endPoint.lat}
            anchor="center"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </Marker>
        )}

        {/* Location Markers */}
        {locations.map((location, index) => {
          const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
          const riskAssessment = riskAssessments.get(locationKey);
          const riskLevel = riskAssessment?.overallRiskLevel || 'low';
          const riskColor = getRiskColor(riskLevel);
          
          return (
            <Marker
              key={index}
              longitude={location.lon}
              latitude={location.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(location, riskAssessment);
              }}
            >
              <div
                className={`flex items-center justify-center rounded-full border-3 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                  riskLevel === 'extreme' ? 'w-10 h-10 animate-pulse' :
                  riskLevel === 'high' ? 'w-9 h-9' :
                  'w-8 h-8'
                }`}
                style={{ backgroundColor: riskColor }}
                title={`${location.name} - ${riskLevel.toUpperCase()} risk${riskAssessment ? ` (${Math.round(riskAssessment.confidence * 100)}% confidence)` : ''}`}
              >
                <AlertTriangle className="w-4 h-4 text-white" />
                {riskLevel === 'extreme' && (
                  <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping" />
                )}
              </div>
            </Marker>
          );
        })}

        {/* Selected Location Popup */}
        {selectedLocation && (
          <Popup
            longitude={selectedLocation.location.lon}
            latitude={selectedLocation.location.lat}
            anchor="bottom"
            onClose={() => setSelectedLocation(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="320px"
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{selectedLocation.location.name}</h3>
                    <Badge className={getRiskBadgeColor(selectedLocation.overallRiskLevel)}>
                      {selectedLocation.overallRiskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Confidence:</span>
                      <span>{Math.round(selectedLocation.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Affected Radius:</span>
                      <span>{selectedLocation.affectedRadius} km</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>🌊 Flooding:</span>
                      <Badge size="sm" className={getRiskBadgeColor(selectedLocation.riskFactors.flooding)}>
                        {selectedLocation.riskFactors.flooding}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>💨 Wind:</span>
                      <Badge size="sm" className={getRiskBadgeColor(selectedLocation.riskFactors.windDamage)}>
                        {selectedLocation.riskFactors.windDamage}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>🌡️ Heat:</span>
                      <Badge size="sm" className={getRiskBadgeColor(selectedLocation.riskFactors.heatWave)}>
                        {selectedLocation.riskFactors.heatWave}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>❄️ Cold:</span>
                      <Badge size="sm" className={getRiskBadgeColor(selectedLocation.riskFactors.coldWave)}>
                        {selectedLocation.riskFactors.coldWave}
                      </Badge>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <strong className="text-sm font-medium flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      AI Analysis:
                    </strong>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {selectedLocation.reasoning}
                    </p>
                  </div>

                  {selectedLocation.recommendations.length > 0 && (
                    <div className="border-t pt-3">
                      <strong className="text-sm font-medium">💡 Recommendations:</strong>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1 list-disc list-inside">
                        {selectedLocation.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 border-t pt-2">
                    Duration: {new Date(selectedLocation.estimatedDuration.start).toLocaleDateString()} - {new Date(selectedLocation.estimatedDuration.end).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Popup>
        )}
      </Map>

      {/* Demo Mode Banner for Mapbox */}
      {!import.meta.env.VITE_MAPBOX_TOKEN && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-blue-500/90 text-white px-4 py-2 rounded-lg text-sm">
            🗺️ <strong>Demo Mode:</strong> Using demo Mapbox token. For production, configure VITE_MAPBOX_TOKEN.
          </div>
        </div>
      )}

      {/* Risk Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-10">
          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Risk Areas
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded border" style={{backgroundColor: '#fbbf24', border: '1px solid #f59e0b'}}></div>
              <span>Low Risk Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded border" style={{backgroundColor: '#fed7aa', border: '2px solid #ea580c'}}></div>
              <span>Medium Risk Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded border" style={{backgroundColor: '#fecaca', border: '3px solid #dc2626'}}></div>
              <span>High Risk Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded border animate-pulse" style={{backgroundColor: '#dc2626', border: '4px solid #991b1b'}}></div>
              <span>Extreme Risk Zone</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            Areas show affected radius based on AI assessment
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxSmartDisasterMap;
