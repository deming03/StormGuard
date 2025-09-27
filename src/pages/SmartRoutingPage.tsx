import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Navigation, Map } from 'lucide-react';
import { useWeatherStore } from '@/store/weatherStore';
import { useRiskAssessmentStore } from '@/store/riskAssessmentStore';
import MapboxSmartDisasterMap from '@/components/map/MapboxSmartDisasterMap';
import FallbackRiskMap from '@/components/map/FallbackRiskMap';
import SafeRoutingPanel from '@/components/routing/SafeRoutingPanel';
import { useRoutingStore } from '@/store/routingStore';
import type { SafeRoute, RoutePoint } from '@/lib/mapboxRoutingService';

const SmartRoutingPage: React.FC = () => {
  const [demoLocations] = useState([
    { lat: 3.139, lon: 101.6869, name: "Kuala Lumpur City Centre (KLCC)" },
    { lat: 3.1073, lon: 101.5951, name: "Petaling Jaya" },
    { lat: 3.0733, lon: 101.5185, name: "Shah Alam" },
    { lat: 3.1516, lon: 101.6942, name: "Ampang" },
    { lat: 3.0738, lon: 101.6014, name: "Subang Jaya" },
    { lat: 3.2231, lon: 101.7183, name: "Gombak" },
    { lat: 3.1319, lon: 101.6641, name: "Bangsar" },
    { lat: 3.1677, lon: 101.6505, name: "Mont Kiara" },
  ]);

  // Memoize map locations to prevent unnecessary re-renders
  const allMapLocations = useMemo(() => demoLocations, [demoLocations]);
  
  const [mapType, setMapType] = useState<'mapbox' | 'fallback'>('mapbox');
  
  const { fetchWeatherForLocation } = useWeatherStore();
  const { assessRisk } = useRiskAssessmentStore();

  // Routing store
  const {
    routes,
    selectedRoute,
    startPoint,
    endPoint,
    setStartPoint,
    setEndPoint,
  } = useRoutingStore();

  // Auto-load demo data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
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
    };

    loadInitialData();
  }, [demoLocations, fetchWeatherForLocation, assessRisk]);

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
            AI-powered disaster-aware routing system. Get safe routes that automatically avoid high-risk areas based on real-time weather and risk analysis.
          </p>
        </div>
      </div>

      {/* Main Layout: Route Planning (Left 40%) + Map (Right 60%) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Left Panel: Safe Route Planning (40%) */}
        <Card className="flex flex-col xl:col-span-2">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Safe Route Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            <div className="space-y-6">
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
                    How to Use Smart Routing
                  </h5>
                  <div className="text-sm text-blue-700 space-y-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>🗺️ Click on the map or use the search to set your start location</li>
                      <li>📍 Set your destination using the same method</li>
                      <li>⚙️ Choose your vehicle type (driving, walking, cycling)</li>
                      <li>🛡️ Enable "Avoid high-risk areas" for maximum safety</li>
                      <li>🚗 Click "Calculate Safe Routes" to get AI-powered recommendations</li>
                      <li>📊 Review routes with safety scores and select the best option</li>
                    </ol>
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <strong>💡 Tip:</strong> The system automatically selects the safest route when risk avoidance is enabled!
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <h6 className="font-semibold text-green-800 mb-1">🛡️ Safety Features</h6>
                    <ul className="text-green-700 text-xs space-y-1">
                      <li>• Real-time weather monitoring</li>
                      <li>• AI disaster risk assessment</li>
                      <li>• Automatic high-risk area avoidance</li>
                      <li>• Safety scoring (0-100)</li>
                      <li>• Multiple route alternatives</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <h6 className="font-semibold text-orange-800 mb-1">⚡ Smart Features</h6>
                    <ul className="text-orange-700 text-xs space-y-1">
                      <li>• Intelligent route selection</li>
                      <li>• Risk-aware pathfinding</li>
                      <li>• Emergency recommendations</li>
                      <li>• Real-time risk updates</li>
                      <li>• Multi-modal transport support</li>
                    </ul>
                  </div>
                </div>

                {routes.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-semibold mb-2">📊 Current Route Analysis</h6>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Routes Available:</strong> {routes.length}
                      </div>
                      <div>
                        <strong>Active Route:</strong> {selectedRoute ? selectedRoute.routeType : 'None'}
                      </div>
                      {selectedRoute && (
                        <>
                          <div>
                            <strong>Safety Score:</strong> 
                            <Badge className={`ml-2 ${selectedRoute.safetyScore >= 80 ? 'bg-green-100 text-green-800' : 
                                                   selectedRoute.safetyScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                                   'bg-red-100 text-red-800'}`}>
                              {selectedRoute.safetyScore}/100
                            </Badge>
                          </div>
                          <div>
                            <strong>Risk Level:</strong>
                            <Badge className={`ml-2 ${selectedRoute.riskLevel === 'low' ? 'bg-green-100 text-green-800' : 
                                                    selectedRoute.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'}`}>
                              {selectedRoute.riskLevel.toUpperCase()}
                            </Badge>
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

        {/* Right Panel: Interactive Map (60%) */}
        <Card className="flex flex-col xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Interactive Risk Map
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            {/* Map Type Selector */}
            <div className="flex gap-1 border rounded-lg p-1 w-fit">
              <Button 
                onClick={() => setMapType('mapbox')}
                variant={mapType === 'mapbox' ? 'default' : 'ghost'}
                size="sm"
              >
                Interactive Map
              </Button>
              <Button 
                onClick={() => setMapType('fallback')}
                variant={mapType === 'fallback' ? 'default' : 'ghost'}
                size="sm"
              >
                List View
              </Button>
            </div>

            {/* Map Component */}
            <div className="flex-1 border rounded-lg overflow-hidden">
              {mapType === 'fallback' ? (
                <FallbackRiskMap
                  locations={allMapLocations}
                  onLocationSelect={handleMapClickForRouting}
                  className="h-full min-h-[400px]"
                  showLegend={true}
                />
              ) : (
                <MapboxSmartDisasterMap
                  locations={allMapLocations}
                  onLocationSelect={handleMapClickForRouting}
                  className="h-full min-h-[400px]"
                  showLegend={true}
                  routes={routes}
                  selectedRoute={selectedRoute}
                  startPoint={startPoint}
                  endPoint={endPoint}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartRoutingPage;