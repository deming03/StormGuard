import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Navigation, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Route, 
  Car,
  PersonStanding,
  Bike,
  Loader2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useRoutingStore } from '@/store/routingStore';
import { useRiskAssessmentStore } from '@/store/riskAssessmentStore';
import { GeocodingService } from '@/lib/geocodingService';
import type { SafeRoute, RoutePoint } from '@/lib/mapboxRoutingService';

interface SafeRoutingPanelProps {
  onRouteSelect?: (route: SafeRoute | null) => void;
  onPointSelect?: (type: 'start' | 'end', point: RoutePoint) => void;
  className?: string;
}

// Predefined KL area locations
const klAreaLocations = [
  { id: 'klcc', name: 'Kuala Lumpur City Centre (KLCC)', lat: 3.139, lon: 101.6869 },
  { id: 'pj', name: 'Petaling Jaya', lat: 3.1073, lon: 101.5951 },
  { id: 'shah_alam', name: 'Shah Alam', lat: 3.0733, lon: 101.5185 },
  { id: 'ampang', name: 'Ampang', lat: 3.1516, lon: 101.6942 },
  { id: 'subang', name: 'Subang Jaya', lat: 3.0738, lon: 101.6014 },
  { id: 'gombak', name: 'Gombak', lat: 3.2231, lon: 101.7183 },
  { id: 'cheras', name: 'Cheras', lat: 3.0347, lon: 101.7610 },
  { id: 'kepong', name: 'Kepong', lat: 3.2185, lon: 101.6387 },
  { id: 'damansara', name: 'Damansara', lat: 3.1619, lon: 101.5883 },
  { id: 'bangsar', name: 'Bangsar', lat: 3.1319, lon: 101.6641 },
  { id: 'mont_kiara', name: 'Mont Kiara', lat: 3.1677, lon: 101.6505 },
  { id: 'setapak', name: 'Setapak', lat: 3.2021, lon: 101.7204 },
  { id: 'mid_valley', name: 'Mid Valley', lat: 3.1187, lon: 101.6770 },
  { id: 'bukit_jalil', name: 'Bukit Jalil', lat: 3.0574, lon: 101.7020 },
  { id: 'kl_sentral', name: 'KL Sentral', lat: 3.1347, lon: 101.6869 },
];

const SafeRoutingPanel: React.FC<SafeRoutingPanelProps> = ({
  onRouteSelect,
  onPointSelect,
  className = ''
}) => {
  // Location selection states
  const [selectedStartLocation, setSelectedStartLocation] = useState('');
  const [selectedEndLocation, setSelectedEndLocation] = useState('');
  
  // Search states
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<RoutePoint[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<RoutePoint[]>([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  
  // Other states
  const [geocodingService, setGeocodingService] = useState<GeocodingService | null>(null);

  const {
    routes,
    selectedRoute,
    isCalculating,
    error,
    startPoint,
    endPoint,
    avoidHighRisk,
    vehicleType,
    calculateRoutes,
    selectRoute,
    setStartPoint,
    setEndPoint,
    setAvoidHighRisk,
    setVehicleType,
    clearError,
  } = useRoutingStore();

  const { getAllRiskAssessments } = useRiskAssessmentStore();

  // Initialize geocoding service
  useEffect(() => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (mapboxToken) {
      setGeocodingService(new GeocodingService(mapboxToken));
    }
  }, []);

  // Update selection when points change from map selection
  useEffect(() => {
    if (startPoint) {
      // Try to find matching location or use coordinates as fallback
      const matchingLocation = klAreaLocations.find(loc => 
        Math.abs(loc.lat - startPoint.lat) < 0.01 && Math.abs(loc.lon - startPoint.lon) < 0.01
      );
      if (matchingLocation) {
        setSelectedStartLocation(matchingLocation.id);
      } else {
        setSelectedStartLocation(''); // Custom location from map
      }
      // Update search query to reflect selected location
      setStartSearchQuery(startPoint.name || `${startPoint.lat.toFixed(4)}, ${startPoint.lon.toFixed(4)}`);
    }
  }, [startPoint]);

  useEffect(() => {
    if (endPoint) {
      // Try to find matching location or use coordinates as fallback
      const matchingLocation = klAreaLocations.find(loc => 
        Math.abs(loc.lat - endPoint.lat) < 0.01 && Math.abs(loc.lon - endPoint.lon) < 0.01
      );
      if (matchingLocation) {
        setSelectedEndLocation(matchingLocation.id);
      } else {
        setSelectedEndLocation(''); // Custom location from map
      }
      // Update search query to reflect selected location
      setEndSearchQuery(endPoint.name || `${endPoint.lat.toFixed(4)}, ${endPoint.lon.toFixed(4)}`);
    }
  }, [endPoint]);

  // Notify parent when route selection changes
  useEffect(() => {
    if (onRouteSelect && selectedRoute) {
      onRouteSelect(selectedRoute);
    }
  }, [selectedRoute]); // Removed onRouteSelect from dependencies to prevent infinite loops

  // Handle start location selection
  const handleStartLocationChange = (locationId: string) => {
    setSelectedStartLocation(locationId);
    const location = klAreaLocations.find(loc => loc.id === locationId);
    if (location) {
      const point: RoutePoint = {
        lat: location.lat,
        lon: location.lon,
        name: location.name,
      };
      setStartPoint(point);
      if (onPointSelect) {
        onPointSelect('start', point);
      }
    }
  };

  // Handle end location selection
  const handleEndLocationChange = (locationId: string) => {
    setSelectedEndLocation(locationId);
    const location = klAreaLocations.find(loc => loc.id === locationId);
    if (location) {
      const point: RoutePoint = {
        lat: location.lat,
        lon: location.lon,
        name: location.name,
      };
      setEndPoint(point);
      if (onPointSelect) {
        onPointSelect('end', point);
      }
    }
  };

  // Get location display name
  const getLocationDisplayName = (point: RoutePoint | null): string => {
    if (!point) return 'Not selected';
    
    const matchingLocation = klAreaLocations.find(loc => 
      Math.abs(loc.lat - point.lat) < 0.01 && Math.abs(loc.lon - point.lon) < 0.01
    );
    
    return matchingLocation ? matchingLocation.name : 
      `Custom location (${point.lat.toFixed(4)}, ${point.lon.toFixed(4)})`;
  };

  // Search functions
  const searchStartLocation = async (query: string) => {
    if (!geocodingService || !query.trim()) {
      setStartSuggestions([]);
      return;
    }

    setIsSearchingStart(true);
    try {
      const results = await geocodingService.searchPlacesInMalaysia(query);
      setStartSuggestions(results);
      setShowStartSuggestions(true);
    } catch (error) {
      console.error('Start location search error:', error);
      setStartSuggestions([]);
    } finally {
      setIsSearchingStart(false);
    }
  };

  const searchEndLocation = async (query: string) => {
    if (!geocodingService || !query.trim()) {
      setEndSuggestions([]);
      return;
    }

    setIsSearchingEnd(true);
    try {
      const results = await geocodingService.searchPlacesInMalaysia(query);
      setEndSuggestions(results);
      setShowEndSuggestions(true);
    } catch (error) {
      console.error('End location search error:', error);
      setEndSuggestions([]);
    } finally {
      setIsSearchingEnd(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (startSearchQuery.length > 1) {
        searchStartLocation(startSearchQuery);
      } else {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [startSearchQuery, geocodingService]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (endSearchQuery.length > 1) {
        searchEndLocation(endSearchQuery);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [endSearchQuery, geocodingService]);

  // Handle search input changes
  const handleStartSearchChange = (value: string) => {
    setStartSearchQuery(value);
    setSelectedStartLocation(''); // Clear dropdown selection when typing
  };

  const handleEndSearchChange = (value: string) => {
    setEndSearchQuery(value);
    setSelectedEndLocation(''); // Clear dropdown selection when typing
  };

  // Handle suggestion selection
  const handleStartSuggestionSelect = (location: RoutePoint) => {
    setStartPoint(location);
    setStartSearchQuery(location.name);
    setShowStartSuggestions(false);
    if (onPointSelect) {
      onPointSelect('start', location);
    }
  };

  const handleEndSuggestionSelect = (location: RoutePoint) => {
    setEndPoint(location);
    setEndSearchQuery(location.name);
    setShowEndSuggestions(false);
    if (onPointSelect) {
      onPointSelect('end', location);
    }
  };


  // Calculate routes
  const handleCalculateRoutes = async () => {
    clearError();
    const riskAssessments = getAllRiskAssessments();
    await calculateRoutes(riskAssessments);
  };

  // Get safety score color
  const getSafetyScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get risk level badge color
  const getRiskBadgeColor = (riskLevel: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800', 
      'high': 'bg-orange-100 text-orange-800',
      'extreme': 'bg-red-100 text-red-800',
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return km < 1 ? `${meters}m` : `${km.toFixed(1)}km`;
  };

  // Get vehicle icon
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'driving': return <Car className="h-4 w-4" />;
      case 'walking': return <PersonStanding className="h-4 w-4" />;
      case 'cycling': return <Bike className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Route Planning Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Safe Route Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Route Points - Search Interface */}
          <div className="space-y-4">
            {/* Start Location Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Location</label>
              <div className="relative">
                <div className="relative">
                  <Input
                    placeholder="Try: KLCC, Mid Valley, Sunway Pyramid, Batu Caves..."
                    value={startSearchQuery}
                    onChange={(e) => handleStartSearchChange(e.target.value)}
                    className="w-full pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSearchingStart && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {/* Search Suggestions */}
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {startSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleStartSuggestionSelect(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{suggestion.name}</div>
                          <div className="text-xs text-gray-500">
                            {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quick Access Popular Locations */}
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Quick access:</div>
                  <div className="flex flex-wrap gap-1">
                    {klAreaLocations.slice(0, 4).map((location) => (
                      <Button
                        key={location.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartSuggestionSelect({
                          lat: location.lat,
                          lon: location.lon,
                          name: location.name
                        })}
                        className="text-xs h-7"
                      >
                        {location.name.split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Destination</label>
              <div className="relative">
                <div className="relative">
                  <Input
                    placeholder="Try: Pavilion KL, 1 Utama, Bangsar Village..."
                    value={endSearchQuery}
                    onChange={(e) => handleEndSearchChange(e.target.value)}
                    className="w-full pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSearchingEnd && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {/* Search Suggestions */}
                {showEndSuggestions && endSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {endSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleEndSuggestionSelect(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{suggestion.name}</div>
                          <div className="text-xs text-gray-500">
                            {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quick Access Popular Locations */}
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Quick access:</div>
                  <div className="flex flex-wrap gap-1">
                    {klAreaLocations.slice(4, 8).map((location) => (
                      <Button
                        key={location.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleEndSuggestionSelect({
                          lat: location.lat,
                          lon: location.lon,
                          name: location.name
                        })}
                        className="text-xs h-7"
                      >
                        {location.name.split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Locations Display */}
            {(startPoint || endPoint) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm space-y-1">
                  {startPoint && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-800 font-medium">Start:</span>
                      <span className="text-gray-700">{startPoint.name}</span>
                    </div>
                  )}
                  {endPoint && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-800 font-medium">End:</span>
                      <span className="text-gray-700">{endPoint.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Route Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type</label>
              <Select value={vehicleType} onValueChange={(value: any) => setVehicleType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driving">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Driving
                    </div>
                  </SelectItem>
                  <SelectItem value="walking">
                    <div className="flex items-center gap-2">
                      <PersonStanding className="h-4 w-4" />
                      Walking
                    </div>
                  </SelectItem>
                  <SelectItem value="cycling">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4" />
                      Cycling
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  checked={avoidHighRisk}
                  onCheckedChange={setAvoidHighRisk}
                />
                <label className="text-sm font-medium">
                  Avoid high-risk areas
                </label>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculateRoutes} 
            disabled={!startPoint || !endPoint || isCalculating}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating Safe Routes...
              </>
            ) : (
              <>
                <Route className="h-4 w-4 mr-2" />
                Calculate Safe Routes
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Results */}
      {routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Options ({routes.length})
              {selectedRoute && avoidHighRisk && (
                <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                  🤖 Auto-Selected Best Route
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Smart Selection Explanation */}
            {selectedRoute && avoidHighRisk && (
              <div className="mb-4 bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="text-sm text-green-800">
                  <div className="font-medium mb-1 flex items-center gap-2">
                    🤖 Smart Route Selection Active
                    <Badge className="text-xs bg-green-200 text-green-800">
                      Safety Score: {selectedRoute.safetyScore}/100
                    </Badge>
                  </div>
                  <div className="text-green-700">
                    {selectedRoute.safetyScore >= 80 ? 
                      "✅ System automatically selected the safest available route" :
                      "⚠️ System selected the least risky option available"
                    }
                    {selectedRoute.riskAreasAvoided > 0 && 
                      ` and successfully avoided ${selectedRoute.riskAreasAvoided} high-risk area(s).`
                    }
                    {selectedRoute.maxRiskLevel === 'high' || selectedRoute.maxRiskLevel === 'extreme' ?
                      " ⚠️ Warning: This route still passes through risk areas - consider alternative transportation." :
                      " 🛡️ This route avoids all major risk areas."
                    }
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {routes.map((route, index) => (
                <div
                  key={route.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRoute?.id === route.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => selectRoute(route)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedRoute?.id === route.id && avoidHighRisk && (
                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                          🤖 Auto-Selected
                        </Badge>
                      )}
                      <Badge className={getRiskBadgeColor(route.riskLevel)}>
                        {route.riskLevel.toUpperCase()} RISK
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Shield className={`h-4 w-4 ${getSafetyScoreColor(route.safetyScore)}`} />
                        <span className={`text-sm font-medium ${getSafetyScoreColor(route.safetyScore)}`}>
                          {route.safetyScore}/100
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {route.routeType}
                      </Badge>
                      {route.riskAreasAvoided > 0 && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">
                          🛡️ {route.riskAreasAvoided} Avoided
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        {formatDuration(route.estimatedTime)}
                      </div>
                      <div className="text-gray-500">
                        {formatDistance(route.distance)}
                      </div>
                    </div>
                  </div>

                  {/* Route Statistics */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <div>
                      Risk areas encountered: {route.riskAreasEncountered}
                    </div>
                    {route.riskAreasAvoided > 0 && (
                      <div className="text-green-600">
                        ✓ Avoided {route.riskAreasAvoided} high-risk area{route.riskAreasAvoided > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {route.warnings.length > 0 && (
                    <div className="space-y-1">
                      {route.warnings.slice(0, 2).map((warning, wIndex) => (
                        <div key={wIndex} className="flex items-start gap-2 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                      {route.warnings.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{route.warnings.length - 2} more warning{route.warnings.length > 3 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risk Details (for selected route) */}
                  {selectedRoute?.id === route.id && route.riskDetails.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <h5 className="text-sm font-medium flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        Risk Areas Along Route:
                      </h5>
                      {route.riskDetails.map((detail, dIndex) => (
                        <div key={dIndex} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{detail.location}</span>
                            <Badge size="sm" className={getRiskBadgeColor(detail.riskLevel)}>
                              {detail.riskLevel}
                            </Badge>
                          </div>
                          <div className="text-gray-600 mt-1">
                            Distance from route: {detail.distance.toFixed(1)}km
                          </div>
                          <div className="text-gray-600">
                            {detail.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Summary */}
      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Selected Route Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Duration:</strong> {formatDuration(selectedRoute.estimatedTime)}
              </div>
              <div>
                <strong>Distance:</strong> {formatDistance(selectedRoute.distance)}
              </div>
              <div>
                <strong>Safety Score:</strong> 
                <span className={`ml-1 font-semibold ${getSafetyScoreColor(selectedRoute.safetyScore)}`}>
                  {selectedRoute.safetyScore}/100
                </span>
              </div>
              <div>
                <strong>Vehicle:</strong> {getVehicleIcon(vehicleType)} {vehicleType}
              </div>
            </div>
            
            {selectedRoute.warnings.length > 0 && (
              <div className="mt-4">
                <strong className="text-sm">⚠️ Important Warnings:</strong>
                <ul className="text-xs text-orange-600 mt-1 space-y-1">
                  {selectedRoute.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SafeRoutingPanel;
