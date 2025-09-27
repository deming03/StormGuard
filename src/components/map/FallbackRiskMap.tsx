import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRiskAssessmentStore } from '@/store/riskAssessmentStore';
import { useWeatherStore } from '@/store/weatherStore';
import type { DisasterRiskAssessment } from '@/lib/gemini';
import { MapPin, Navigation, AlertTriangle, Brain, Eye, EyeOff, Loader2 } from 'lucide-react';

interface FallbackRiskMapProps {
  locations: Array<{ lat: number; lon: number; name: string }>;
  onLocationSelect?: (lat: number, lon: number) => void;
  className?: string;
  showLegend?: boolean;
}

const FallbackRiskMap: React.FC<FallbackRiskMapProps> = ({ 
  locations = [],
  onLocationSelect,
  className = '',
  showLegend = true
}) => {
  const [selectedLocation, setSelectedLocation] = useState<DisasterRiskAssessment | null>(null);
  const [showRiskDetails, setShowRiskDetails] = useState(true);
  
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

  // Handle location click
  const handleLocationClick = (location: any, riskAssessment?: DisasterRiskAssessment) => {
    setSelectedLocation(riskAssessment || null);
    if (onLocationSelect) {
      onLocationSelect(location.lat, location.lon);
    }
  };

  return (
    <div className={`relative w-full h-96 ${className}`}>
      {/* Map Alternative - Grid Layout */}
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-300 overflow-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Risk Assessment Overview</h3>
            <span className="text-sm text-gray-500">(TomTom Map Alternative)</span>
          </div>
          <Button
            onClick={() => setShowRiskDetails(!showRiskDetails)}
            size="sm"
            variant="outline"
          >
            {showRiskDetails ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Details
          </Button>
        </div>

        {/* Loading indicator */}
        {(isLoading || isAssessing) && (
          <div className="p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {isLoading && isAssessing ? 'Loading weather & assessing risk...' :
                 isLoading ? 'Fetching weather data...' :
                 isAssessing ? 'AI assessing disaster risk...' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Locations Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location, index) => {
            const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
            const riskAssessment = riskAssessments.get(locationKey);
            const weather = weatherData.get(locationKey);
            
            return (
              <Card 
                key={index}
                className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${
                  selectedLocation === riskAssessment ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ 
                  borderLeftColor: riskAssessment ? getRiskColor(riskAssessment.overallRiskLevel) : '#gray' 
                }}
                onClick={() => handleLocationClick(location, riskAssessment)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <h4 className="font-semibold text-sm">{location.name}</h4>
                    </div>
                    {riskAssessment && (
                      <Badge className={getRiskBadgeColor(riskAssessment.overallRiskLevel)}>
                        {riskAssessment.overallRiskLevel.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                  </div>

                  {weather && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span>{weather.current.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conditions:</span>
                        <span className="capitalize">{weather.current.weatherDescription}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wind:</span>
                        <span>{weather.current.windSpeed} m/s</span>
                      </div>
                    </div>
                  )}

                  {riskAssessment && showRiskDetails && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span>Confidence:</span>
                        <span className="font-medium">{Math.round(riskAssessment.confidence * 100)}%</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>🌊 Flood:</span>
                          <span style={{ color: getRiskColor(riskAssessment.riskFactors.flooding) }}>
                            {riskAssessment.riskFactors.flooding}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>💨 Wind:</span>
                          <span style={{ color: getRiskColor(riskAssessment.riskFactors.windDamage) }}>
                            {riskAssessment.riskFactors.windDamage}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>🌡️ Heat:</span>
                          <span style={{ color: getRiskColor(riskAssessment.riskFactors.heatWave) }}>
                            {riskAssessment.riskFactors.heatWave}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>❄️ Cold:</span>
                          <span style={{ color: getRiskColor(riskAssessment.riskFactors.coldWave) }}>
                            {riskAssessment.riskFactors.coldWave}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs">
                        <strong>Affected Area:</strong> {riskAssessment.affectedRadius} km radius
                      </div>
                      
                      {/* Visual representation of risk area coverage */}
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1">Risk Area Coverage:</div>
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (riskAssessment.affectedRadius / 5) * 100)}%`,
                              backgroundColor: riskAssessment.overallRiskLevel === 'low' ? '#fbbf24' :
                                             riskAssessment.overallRiskLevel === 'medium' ? '#fed7aa' :
                                             riskAssessment.overallRiskLevel === 'high' ? '#fecaca' : '#dc2626',
                              border: riskAssessment.overallRiskLevel === 'low' ? '1px solid #f59e0b' :
                                     riskAssessment.overallRiskLevel === 'medium' ? '1px solid #ea580c' :
                                     riskAssessment.overallRiskLevel === 'high' ? '1px solid #dc2626' : '1px solid #991b1b'
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Area: ~{(Math.PI * Math.pow(riskAssessment.affectedRadius, 2)).toFixed(1)} km²
                        </div>
                      </div>
                    </div>
                  )}

                  {!weather && !riskAssessment && (
                    <div className="text-center text-gray-400 text-sm py-4">
                      Click "Load Demo Locations" to fetch data
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Location Details */}
        {selectedLocation && showRiskDetails && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Analysis: {selectedLocation.location.name}
            </h4>
            <div className="text-sm space-y-2">
              <p><strong>Reasoning:</strong> {selectedLocation.reasoning}</p>
              {selectedLocation.recommendations.length > 0 && (
                <div>
                  <strong>Recommendations:</strong>
                  <ul className="list-disc list-inside ml-2 text-xs space-y-1">
                    {selectedLocation.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {locations.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No locations to display</p>
              <p className="text-sm">Load demo locations to see risk assessment</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="absolute top-16 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
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
              <div className="w-4 h-3 rounded border" style={{backgroundColor: '#dc2626', border: '4px solid #991b1b'}}></div>
              <span>Extreme Risk Zone</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            Shows affected areas and radius coverage
          </div>
        </div>
      )}
    </div>
  );
};

export default FallbackRiskMap;
