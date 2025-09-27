import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Route, Navigation, Cloud, TestTube, MapPin, Brain, AlertTriangle, Map, Settings } from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { useRiskAssessmentStore } from '@/store/riskAssessmentStore';
import SmartDisasterMap from '@/components/map/SmartDisasterMap';
import MapboxSmartDisasterMap from '@/components/map/MapboxSmartDisasterMap';
import FallbackRiskMap from '@/components/map/FallbackRiskMap';
import SafeRoutingPanel from '@/components/routing/SafeRoutingPanel';
import { useRoutingStore } from '@/store/routingStore';
import type { SafeRoute, RoutePoint } from '@/lib/mapboxRoutingService';

// Single high-risk area for route avoidance demonstration
const RISK_AREAS = [
  { 
    lat: 3.0631, 
    lon: 101.6727, 
    name: "Serdang Highway Junction", 
    riskLevel: "high", 
    reason: "SEVERE FLOODING - Road completely blocked with 2m water level and emergency vehicles on site" 
  },
];

const SmartRoutingPage: React.FC = () => {
  const [testLat, setTestLat] = useState('3.139');
  const [testLon, setTestLon] = useState('101.6869');
  const [testLocationName, setTestLocationName] = useState('Kuala Lumpur City Centre');
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [demoLocations, setDemoLocations] = useState([
    { lat: 3.139, lon: 101.6869, name: "Kuala Lumpur City Centre (KLCC)" },
    { lat: 3.1073, lon: 101.5951, name: "Petaling Jaya" },
    { lat: 3.0733, lon: 101.5185, name: "Shah Alam" },
    { lat: 3.1516, lon: 101.6942, name: "Ampang" },
    { lat: 3.0738, lon: 101.6014, name: "Subang Jaya" },
    { lat: 3.2231, lon: 101.7183, name: "Gombak" },
    { lat: 3.1319, lon: 101.6641, name: "Bangsar" },
    { lat: 3.1677, lon: 101.6505, name: "Mont Kiara" },
  ]);

  // Use the stable risk areas constant to prevent re-renders
  const riskAreas = RISK_AREAS;
  
  // Memoize map locations to prevent unnecessary re-renders
  const allMapLocations = useMemo(() => [
    ...demoLocations, 
    ...riskAreas.map(area => ({ 
      lat: area.lat, 
      lon: area.lon, 
      name: area.name 
    }))
  ], [demoLocations]);
  const [mapType, setMapType] = useState<'mapbox' | 'tomtom' | 'fallback'>('mapbox'); // Start with Mapbox since user has API key
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const { 
    weatherData, 
    isLoading, 
    error, 
    fetchWeatherForLocation, 
    testApiConnection,
    clearError 
  } = useWeatherStore();

  const {
    riskAssessments,
    isAssessing,
    error: riskError,
    assessRisk,
    getRiskByLocation,
    clearError: clearRiskError
  } = useRiskAssessmentStore();

  // Routing store
  const {
    routes,
    selectedRoute,
    startPoint,
    endPoint,
    setStartPoint,
    setEndPoint,
  } = useRoutingStore();

  const handleTestApiConnection = async () => {
    setApiTestResult('Testing...');
    const result = await testApiConnection();
    setApiTestResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
  };

  const handleTestWeatherFetch = async () => {
    clearError();
    const lat = parseFloat(testLat);
    const lon = parseFloat(testLon);
    
    if (isNaN(lat) || isNaN(lon)) {
      setApiTestResult('❌ Invalid coordinates');
      return;
    }

    await fetchWeatherForLocation(lat, lon, testLocationName);
  };

  const handleTestRiskAssessment = async () => {
    const locationKey = `${parseFloat(testLat).toFixed(4)},${parseFloat(testLon).toFixed(4)}`;
    const weatherData = useWeatherStore.getState().weatherData.get(locationKey);
    
    if (!weatherData) {
      setApiTestResult('❌ No weather data found. Fetch weather data first.');
      return;
    }

    clearRiskError();
    await assessRisk(locationKey, weatherData);
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    const locationName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    setTestLat(lat.toString());
    setTestLon(lon.toString());
    setTestLocationName(locationName);
    setApiTestResult(`📍 Selected: ${locationName}`);
  };

  // Handle routing point selection (memoized to prevent unnecessary re-renders)
  const handleRoutingPointSelect = useCallback((type: 'start' | 'end', point: RoutePoint) => {
    if (type === 'start') {
      setStartPoint(point);
    } else {
      setEndPoint(point);
    }
  }, [setStartPoint, setEndPoint]);

  // Handle map click for routing (memoized to prevent unnecessary re-renders)
  const handleMapClickForRouting = useCallback((lat: number, lon: number) => {
    const point: RoutePoint = {
      lat,
      lon,
      name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    };

    // Logic: if no start point, set as start; if start but no end, set as end; if both exist, replace start
    if (!startPoint) {
      setStartPoint(point);
    } else if (!endPoint) {
      setEndPoint(point);
    } else {
      // Both exist, replace start and clear end
      setStartPoint(point);
      setEndPoint(null);
    }
  }, [startPoint, endPoint, setStartPoint, setEndPoint]);

  const loadDemoData = useCallback(async () => {
    setApiTestResult('Loading demo data for all locations...');
    
    // Load weather data and risk assessments for main demo locations
    for (const location of demoLocations) {
      try {
        await fetchWeatherForLocation(location.lat, location.lon, location.name);
        
        const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
        const weatherData = useWeatherStore.getState().weatherData.get(locationKey);
        
        if (weatherData) {
          await assessRisk(locationKey, weatherData);
        }
      } catch (error) {
        console.error(`Failed to load data for ${location.name}:`, error);
      }
    }
    
    // Create dummy risk assessments for specific risk areas
    console.log('Creating dummy risk assessments for risk areas...');
    
    // Create detailed high-risk assessment for route avoidance demonstration
    const riskAssessments = riskAreas.map(riskArea => ({
      location: {
        lat: riskArea.lat,
        lon: riskArea.lon,
        name: riskArea.name,
      },
      overallRiskLevel: 'high' as const,
      riskFactors: {
        flooding: 'extreme' as const,
        windDamage: 'high' as const,
        heatWave: 'low' as const,
        coldWave: 'low' as const,
      },
      confidence: 0.95,
      reasoning: riskArea.reason,
      recommendations: [
        '🚨 CRITICAL: DO NOT ENTER - Road completely impassable',
        '🚗 Use alternative routes immediately',
        '📞 Emergency services are active in this area',
        '⏰ Estimated clearance time: 6-12 hours',
        '📍 Consider routes via Shah Alam or Subang instead',
      ],
      estimatedDuration: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10 hours
      },
      affectedRadius: 3.0, // 3km radius to ensure route avoidance
    }));
    
    // Add all risk assessments at once to minimize state updates
    const { addRiskAssessment } = useRiskAssessmentStore.getState();
    riskAssessments.forEach(assessment => {
      addRiskAssessment(assessment);
    });
    
    console.log(`✅ Added ${riskAssessments.length} risk assessments`);
    
    // Small delay to ensure state is updated before showing result
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setApiTestResult(`✅ Demo data loaded! ${demoLocations.length} locations + 1 high-risk zone for route avoidance demo`);
  }, [demoLocations, riskAreas, fetchWeatherForLocation, assessRisk, setApiTestResult]);

  const locationKey = `${parseFloat(testLat).toFixed(4)},${parseFloat(testLon).toFixed(4)}`;
  const currentWeatherData = weatherData.get(locationKey);
  const currentRiskAssessment = getRiskByLocation(locationKey);

  const getRiskBadgeColor = (riskLevel: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'extreme': 'bg-red-100 text-red-800',
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Route className="h-8 w-8 text-blue-600" />
            Smart Routing
          </h1>
              <p className="text-gray-600 mt-1">
                AI-powered route avoidance demo - watch how the system automatically avoids high-risk areas and calculates safer alternative routes!
              </p>
        </div>
      </div>

      {/* OpenWeather API Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            OpenWeather API Integration (Step 2)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleTestApiConnection} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Test API Connection
            </Button>
          </div>

          {apiTestResult && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              {apiTestResult}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Test Weather Data Fetch
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">Latitude</label>
                <Input 
                  value={testLat}
                  onChange={(e) => setTestLat(e.target.value)}
                  placeholder="40.7128"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Longitude</label>
                <Input 
                  value={testLon}
                  onChange={(e) => setTestLon(e.target.value)}
                  placeholder="-74.0060"
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Location Name</label>
                <Input 
                  value={testLocationName}
                  onChange={(e) => setTestLocationName(e.target.value)}
                  placeholder="New York City"
                  size="sm"
                />
              </div>
            </div>
            <Button 
              onClick={handleTestWeatherFetch} 
              disabled={isLoading}
              className="mb-3"
            >
              {isLoading ? 'Fetching Weather...' : 'Fetch Weather Data'}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {currentWeatherData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h5 className="font-semibold text-green-800 mb-2">✅ Weather Data Retrieved Successfully</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Location:</strong> {currentWeatherData.location.name}<br />
                    <strong>Temperature:</strong> {currentWeatherData.current.temperature}°C<br />
                    <strong>Weather:</strong> {currentWeatherData.current.weatherDescription}<br />
                    <strong>Wind Speed:</strong> {currentWeatherData.current.windSpeed} m/s
                  </div>
                  <div>
                    <strong>Humidity:</strong> {currentWeatherData.current.humidity}%<br />
                    <strong>Pressure:</strong> {currentWeatherData.current.pressure} hPa<br />
                    <strong>Visibility:</strong> {currentWeatherData.current.visibility} km<br />
                    <strong>Forecast Points:</strong> {currentWeatherData.forecast.length}
                  </div>
                </div>
                {currentWeatherData.alerts.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <strong className="text-yellow-800">Weather Alerts:</strong>
                    {currentWeatherData.alerts.map((alert, index) => (
                      <div key={index} className="text-yellow-700 text-xs mt-1">
                        {alert.event}: {alert.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gemini AI Risk Assessment Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gemini AI Risk Assessment (Step 3)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleTestRiskAssessment} 
              variant="outline"
              disabled={isAssessing || !currentWeatherData}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isAssessing ? 'Assessing Risk...' : 'Assess Disaster Risk'}
            </Button>
            {!currentWeatherData && (
              <p className="text-sm text-gray-500 self-center">
                ⚠️ Fetch weather data first
              </p>
            )}
          </div>

          {riskError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {riskError}
            </div>
          )}

          {currentRiskAssessment && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                🤖 AI Risk Assessment Complete
                <Badge className={getRiskBadgeColor(currentRiskAssessment.overallRiskLevel)}>
                  {currentRiskAssessment.overallRiskLevel.toUpperCase()} RISK
                </Badge>
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div className="space-y-2">
                  <div><strong>Location:</strong> {currentRiskAssessment.location.name}</div>
                  <div><strong>Confidence:</strong> {Math.round(currentRiskAssessment.confidence * 100)}%</div>
                  <div><strong>Affected Radius:</strong> {currentRiskAssessment.affectedRadius} km</div>
                  <div>
                    <strong>Duration:</strong> {new Date(currentRiskAssessment.estimatedDuration.start).toLocaleDateString()} - {new Date(currentRiskAssessment.estimatedDuration.end).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div><strong>Risk Factors:</strong></div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex justify-between">
                      <span>🌊 Flooding:</span>
                      <Badge size="sm" className={getRiskBadgeColor(currentRiskAssessment.riskFactors.flooding)}>
                        {currentRiskAssessment.riskFactors.flooding}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>💨 Wind:</span>
                      <Badge size="sm" className={getRiskBadgeColor(currentRiskAssessment.riskFactors.windDamage)}>
                        {currentRiskAssessment.riskFactors.windDamage}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>🌡️ Heat:</span>
                      <Badge size="sm" className={getRiskBadgeColor(currentRiskAssessment.riskFactors.heatWave)}>
                        {currentRiskAssessment.riskFactors.heatWave}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>❄️ Cold:</span>
                      <Badge size="sm" className={getRiskBadgeColor(currentRiskAssessment.riskFactors.coldWave)}>
                        {currentRiskAssessment.riskFactors.coldWave}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <strong className="text-blue-800">AI Analysis:</strong>
                <p className="text-blue-700 text-sm mt-1">{currentRiskAssessment.reasoning}</p>
              </div>

              {currentRiskAssessment.recommendations.length > 0 && (
                <div>
                  <strong className="text-blue-800">Recommendations:</strong>
                  <ul className="text-blue-700 text-sm mt-1 list-disc list-inside space-y-1">
                    {currentRiskAssessment.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TomTom Maps Integration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Interactive Maps with AI Risk Visualization (Step 4)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap items-center">
                <Button onClick={loadDemoData} variant="outline" disabled={isLoading || isAssessing}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Load Demo + High Risk Zone
                </Button>
                
                <Button 
                  onClick={() => {
                    try {
                      const { clearRiskAssessments } = useRiskAssessmentStore.getState();
                      clearRiskAssessments();
                      setApiTestResult('✅ Risk assessments cleared');
                    } catch (error) {
                      console.error('Error clearing risk assessments:', error);
                      setApiTestResult('❌ Failed to clear risk assessments');
                    }
                  }} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading || isAssessing}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Clear Risk Data
                </Button>
            
            {/* Map Type Selector */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button 
                onClick={() => setMapType('mapbox')}
                variant={mapType === 'mapbox' ? 'default' : 'ghost'}
                size="sm"
              >
                Mapbox
              </Button>
              <Button 
                onClick={() => setMapType('tomtom')}
                variant={mapType === 'tomtom' ? 'default' : 'ghost'}
                size="sm"
              >
                TomTom
              </Button>
              <Button 
                onClick={() => setMapType('fallback')}
                variant={mapType === 'fallback' ? 'default' : 'ghost'}
                size="sm"
              >
                List View
              </Button>
            </div>

            <Button 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-1" />
              Debug
            </Button>
          </div>

          {showDebugInfo && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h5 className="font-semibold mb-2">🔧 Debug Information</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>API Keys:</strong>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>OpenWeather: {import.meta.env.VITE_OPENWEATHER_API_KEY ? '✅ Present' : '❌ Missing'}</li>
                    <li>Gemini AI: {import.meta.env.VITE_GEMINI_API_KEY ? '✅ Present' : '❌ Missing'}</li>
                    <li>Mapbox: {import.meta.env.VITE_MAPBOX_TOKEN ? '✅ Present' : '❌ Missing'}</li>
                    <li>TomTom: {import.meta.env.VITE_TOMTOM_API_KEY ? '✅ Present' : '❌ Missing'}</li>
                  </ul>
                </div>
                <div>
                  <strong>Status:</strong>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>Map Type: {mapType.charAt(0).toUpperCase() + mapType.slice(1)}</li>
                    <li>Weather Loading: {isLoading ? 'Yes' : 'No'}</li>
                    <li>Risk Assessing: {isAssessing ? 'Yes' : 'No'}</li>
                    <li>Demo Locations: {demoLocations.length}</li>
                    <li>Risk Zone: {riskAreas.length} high-risk area for route avoidance demo</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <strong>High-Risk Zone for Route Avoidance Demo:</strong>
                <div className="mt-2">
                  {riskAreas.map((area, idx) => (
                    <div key={idx} className="text-xs flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                      <span className="px-3 py-1 rounded text-xs font-bold bg-red-100 text-red-800">
                        {area.riskLevel.toUpperCase()} RISK
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{area.name}</div>
                        <div className="text-gray-600">📍 {area.lat.toFixed(4)}, {area.lon.toFixed(4)}</div>
                        <div className="text-red-700 mt-1">{area.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {!import.meta.env.VITE_TOMTOM_API_KEY && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>⚠️ TomTom API Key Missing:</strong> Add VITE_TOMTOM_API_KEY=your_key to your .env file to use TomTom maps.
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600">
            {mapType === 'mapbox' ? 
              'Using Mapbox interactive map with high-risk zone visualization. Load the demo data to see the route avoidance in action!' :
            mapType === 'tomtom' ?
              'Using TomTom interactive map. If it\'s stuck loading, try Mapbox or List View.' :
              'Using fallback list view. Load the demo data to see the high-risk zone and try route calculations.'
            }
          </p>

          {/* Map Component */}
          <div className="border rounded-lg overflow-hidden">
              {mapType === 'fallback' ? (
                <FallbackRiskMap
                  locations={allMapLocations}
                  onLocationSelect={handleMapClickForRouting}
                  className="h-96"
                  showLegend={true}
                />
                ) : mapType === 'mapbox' ? (
                  <MapboxSmartDisasterMap
                    locations={allMapLocations}
                    onLocationSelect={handleMapClickForRouting}
                    className="h-96"
                    showLegend={true}
                    routes={routes}
                    selectedRoute={selectedRoute}
                    startPoint={startPoint}
                    endPoint={endPoint}
                  />
                ) : (
                  <SmartDisasterMap
                    locations={allMapLocations}
                    onLocationSelect={handleMapClickForRouting}
                    className="h-96"
                    showLegend={true}
                  />
                )}
          </div>

          {/* Instructions for TomTom API Key */}
          {!import.meta.env.VITE_TOMTOM_API_KEY && mapType === 'tomtom' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                TomTom API Setup Required
              </h5>
              <div className="text-sm text-blue-700 space-y-2">
                <p>To use the interactive TomTom map, you need to configure the API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Visit <a href="https://developer.tomtom.com/" target="_blank" rel="noopener noreferrer" className="underline">developer.tomtom.com</a></li>
                  <li>Sign up for a free account</li>
                  <li>Create a new API key from the dashboard</li>
                  <li>Add <code className="bg-blue-100 px-1 rounded">VITE_TOMTOM_API_KEY=your_key</code> to your .env file</li>
                  <li>Restart your development server</li>
                </ol>
                <p className="text-xs">
                  <strong>Alternative:</strong> Use the "Use Fallback Map" button above to see the risk assessment in list format.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
            <div className="space-y-1">
              <strong className="text-gray-700">🗺️ Map Features:</strong>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• {mapType === 'fallback' ? 'List-based view' : mapType === 'mapbox' ? 'Interactive Mapbox map' : 'Interactive TomTom map'}</li>
                <li>• {mapType === 'fallback' ? 'Click cards to select' : 'Click anywhere to select locations'}</li>
                <li>• {mapType === 'fallback' ? 'Detailed risk cards' : 'Zoom and pan controls'}</li>
                <li>• {mapType === 'fallback' ? 'Toggle view modes' : mapType === 'mapbox' ? 'Geolocation support' : 'Fullscreen support'}</li>
              </ul>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-700">🎯 Risk Visualization:</strong>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• Color-coded risk {mapType === 'fallback' ? 'cards' : 'markers'}</li>
                <li>• {mapType === 'fallback' ? 'Risk factor breakdown' : 'Risk area circles'}</li>
                <li>• Real-time AI analysis</li>
                <li>• {mapType === 'fallback' ? 'Expandable details' : 'Interactive popups'}</li>
              </ul>
            </div>
            <div className="space-y-1">
              <strong className="text-gray-700">🤖 AI Integration:</strong>
              <ul className="text-xs space-y-1 text-gray-600">
                <li>• Weather data analysis</li>
                <li>• Disaster risk assessment</li>
                <li>• Confidence scoring</li>
                <li>• Safety recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safe Routing Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Safe Routing with AI Risk Avoidance (Step 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Routing Panel */}
            <div>
              <SafeRoutingPanel
                onPointSelect={handleRoutingPointSelect}
                className="h-full"
              />
            </div>

            {/* Instructions & Info */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Route Avoidance Demo Instructions
                </h5>
                <div className="text-sm text-blue-700 space-y-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>📊 First, click "Load Demo + High Risk Zone" to activate the flooding scenario</li>
                    <li>🗺️ Notice the red high-risk zone at Serdang Highway Junction on the map</li>
                    <li>📍 Set your start point north of the risk zone (e.g., KLCC, Bangsar)</li>
                    <li>📍 Set your destination south of the risk zone (e.g., Cyberjaya, Putrajaya)</li>
                    <li>⚠️ Make sure "Avoid high-risk areas" is enabled</li>
                    <li>🚗 Click "Calculate Safe Routes" and watch the system avoid the flooded area</li>
                    <li>📈 Compare the safe route vs. direct route to see the avoidance in action</li>
                  </ol>
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <strong>💡 Demo Tip:</strong> Try routing from KLCC to Cyberjaya to see clear route avoidance!
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <h6 className="font-semibold text-green-800 mb-1">✅ Safety Features</h6>
                  <ul className="text-green-700 text-xs space-y-1">
                    <li>• AI-powered risk assessment</li>
                    <li>• High-risk area avoidance</li>
                    <li>• Safety score (0-100)</li>
                    <li>• Route warnings & alerts</li>
                    <li>• Multiple route alternatives</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <h6 className="font-semibold text-yellow-800 mb-1">⚡ Route Options</h6>
                  <ul className="text-yellow-700 text-xs space-y-1">
                    <li>• Fastest route</li>
                    <li>• Shortest route</li>
                    <li>• Risk avoidance route</li>
                    <li>• Real-time weather analysis</li>
                    <li>• Disaster risk consideration</li>
                  </ul>
                </div>
              </div>

              {routes.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-semibold mb-2">📊 Route Calculation Results</h6>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Routes Found:</strong> {routes.length}
                    </div>
                    <div>
                      <strong>Selected:</strong> {selectedRoute ? selectedRoute.routeType : 'None'}
                    </div>
                    {selectedRoute && (
                      <>
                        <div>
                          <strong>Safety Score:</strong> {selectedRoute.safetyScore}/100
                        </div>
                        <div>
                          <strong>Risk Level:</strong> {selectedRoute.riskLevel.toUpperCase()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Implementation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm">Navigation and page structure created</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm">OpenWeather API integration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm">Gemini AI risk assessment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm">Interactive Maps integration (Mapbox)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-xs">5</span>
              </div>
              <span className="text-sm font-medium">Safe routing with risk avoidance (In Progress)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartRoutingPage;
