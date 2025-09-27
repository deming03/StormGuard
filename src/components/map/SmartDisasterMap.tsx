import React, { useEffect, useRef, useState } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRiskAssessmentStore } from '@/store/riskAssessmentStore';
import { useWeatherStore } from '@/store/weatherStore';
import type { DisasterRiskAssessment } from '@/lib/gemini';
import { MapPin, Navigation, AlertTriangle, Cloud, Brain, Loader2, Eye, EyeOff } from 'lucide-react';

interface SmartDisasterMapProps {
  locations: Array<{ lat: number; lon: number; name: string }>;
  onLocationSelect?: (lat: number, lon: number) => void;
  className?: string;
  initialCenter?: { lat: number; lon: number };
  initialZoom?: number;
  showLegend?: boolean;
}

const SmartDisasterMap: React.FC<SmartDisasterMapProps> = ({ 
  locations = [],
  onLocationSelect,
  className = '',
  initialCenter = { lat: 3.139, lon: 101.6869 }, // Kuala Lumpur default
  initialZoom = 8,
  showLegend = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<tt.Map | null>(null);
  const markers = useRef<Map<string, tt.Marker>>(new Map());
  const circles = useRef<Map<string, any>>(new Map());
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showRiskAreas, setShowRiskAreas] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<DisasterRiskAssessment | null>(null);
  
  const { riskAssessments, assessRisk, isAssessing } = useRiskAssessmentStore();
  const { weatherData, fetchWeatherForLocation, isLoading } = useWeatherStore();

  // Initialize TomTom map
  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
    console.log('TomTom API Key check:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      setMapError('TomTom API key not configured. Please set VITE_TOMTOM_API_KEY in your environment variables.');
      return;
    }

    // Add timeout to detect stuck loading
    const loadingTimeout = setTimeout(() => {
      if (!isMapReady) {
        console.warn('TomTom map loading timeout');
        setMapError('Map loading timeout. This might be due to network issues or invalid API key.');
      }
    }, 10000); // 10 second timeout

    try {
      console.log('Initializing TomTom map...');
      
      // Initialize TomTom map
      map.current = tt.map({
        key: apiKey,
        container: mapRef.current,
        center: [initialCenter.lon, initialCenter.lat],
        zoom: initialZoom,
        style: 'main',
      });

      console.log('TomTom map instance created');

      // Add zoom and pan controls
      map.current.addControl(new tt.NavigationControl());

      // Add fullscreen control
      map.current.addControl(new tt.FullscreenControl());

      // Map ready event
      map.current.on('load', () => {
        clearTimeout(loadingTimeout);
        setIsMapReady(true);
        console.log('TomTom map loaded successfully');
      });

      // Handle map clicks
      map.current.on('click', (event) => {
        const lat = event.lngLat.lat;
        const lon = event.lngLat.lng;
        
        if (onLocationSelect) {
          onLocationSelect(lat, lon);
        }
      });

      // Handle errors
      map.current.on('error', (error) => {
        clearTimeout(loadingTimeout);
        console.error('TomTom map error:', error);
        setMapError(`TomTom map error: ${(error as any).message || 'Unknown error'}. Please check your API key.`);
      });

      // Handle source errors
      map.current.on('sourcedataloading', () => {
        console.log('TomTom map source data loading...');
      });

      map.current.on('sourcedata', () => {
        console.log('TomTom map source data loaded');
      });

    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error('Error initializing TomTom map:', error);
      setMapError(`Failed to initialize TomTom map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return () => {
      clearTimeout(loadingTimeout);
      if (map.current) {
        try {
          map.current.remove();
          map.current = null;
        } catch (error) {
          console.warn('Error removing TomTom map:', error);
        }
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear existing markers and circles
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();
    circles.current.forEach(circle => map.current?.removeLayer(circle));
    circles.current.clear();

    // Add markers for each location
    locations.forEach(async (location, index) => {
      const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
      
      // Fetch weather and assess risk if not already done
      if (!weatherData.has(locationKey)) {
        await fetchWeatherForLocation(location.lat, location.lon, location.name);
      }
      
      const weather = weatherData.get(locationKey);
      if (weather && !riskAssessments.has(locationKey)) {
        await assessRisk(locationKey, weather);
      }

      const riskAssessment = riskAssessments.get(locationKey);
      addLocationMarker(location, riskAssessment);
    });

    // Fit map to show all locations
    if (locations.length > 0) {
      const bounds = new tt.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.lon, location.lat]);
      });
      
      if (locations.length === 1) {
        map.current.setCenter([locations[0].lon, locations[0].lat]);
        map.current.setZoom(12);
      } else {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [locations, weatherData, riskAssessments, isMapReady]);

  // Add location marker with risk visualization
  const addLocationMarker = (location: any, riskAssessment?: DisasterRiskAssessment) => {
    if (!map.current) return;

    const riskLevel = riskAssessment?.overallRiskLevel || 'low';
    const riskColor = getRiskColor(riskLevel);
    const locationKey = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;

    // Create risk area circle for all risk levels when showing risk areas
    if (showRiskAreas && riskAssessment) {
      const riskRadius = riskAssessment.affectedRadius * 1000; // Convert km to meters
      
      // Use area-focused colors for better visualization
      const areaColor = getAreaColor(riskLevel);
      const borderColor = getBorderColor(riskLevel);
      const opacity = getOpacityByRiskLevel(riskLevel);
      
      // Add risk area as a circle layer
      const circleData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [location.lon, location.lat]
          },
          properties: {
            radius: riskRadius,
            riskLevel: riskLevel
          }
        }]
      };

      const sourceId = `risk-area-${locationKey}`;
      const layerId = `risk-circle-${locationKey}`;

      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: circleData as any
        });

        map.current.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': {
              stops: [
                [0, 0],
                [20, riskRadius / 100] // Approximate conversion for visualization
              ],
              base: 2
            },
            'circle-color': areaColor,
            'circle-opacity': opacity,
            'circle-stroke-color': borderColor,
            'circle-stroke-width': riskLevel === 'extreme' ? 4 : 
                                 riskLevel === 'high' ? 3 : 
                                 riskLevel === 'medium' ? 2 : 1,
            'circle-stroke-opacity': 0.8
          }
        });

        circles.current.set(locationKey, layerId);
      }
    }

    // Create marker element
    const markerElement = createRiskMarker(riskLevel, location.name, riskAssessment);
    
    // Create TomTom marker
    const marker = new tt.Marker({ element: markerElement })
      .setLngLat([location.lon, location.lat])
      .addTo(map.current);

    // Add click handler
    marker.getElement().addEventListener('click', () => {
      setSelectedLocation(riskAssessment || null);
      showLocationPopup(location, riskAssessment);
    });

    markers.current.set(locationKey, marker);
  };

  // Create risk marker element
  const createRiskMarker = (riskLevel: string, locationName: string, riskAssessment?: DisasterRiskAssessment): HTMLElement => {
    const element = document.createElement('div');
    element.className = 'risk-marker';
    
    const size = riskLevel === 'extreme' ? 40 : riskLevel === 'high' ? 35 : 30;
    const pulseClass = riskLevel === 'extreme' ? 'animate-pulse' : '';
    
    element.innerHTML = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${getRiskColor(riskLevel)};
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 30 ? '14px' : '12px'};
        cursor: pointer;
        transition: transform 0.2s ease;
      " class="${pulseClass}">
        ${getRiskIcon(riskLevel)}
      </div>
    `;
    
    element.title = `${locationName} - ${riskLevel.toUpperCase()} risk${riskAssessment ? ` (${Math.round(riskAssessment.confidence * 100)}% confidence)` : ''}`;
    
    // Add hover effect
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.1)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
    });
    
    return element;
  };

  // Show location popup
  const showLocationPopup = (location: any, riskAssessment?: DisasterRiskAssessment) => {
    if (!map.current || !riskAssessment) return;

    const popup = new tt.Popup({ closeOnClick: true })
      .setLngLat(new tt.LngLat(location.lon, location.lat))
      .setHTML(createPopupContent(location, riskAssessment))
      .addTo(map.current);
  };

  // Create popup content
  const createPopupContent = (location: any, riskAssessment: DisasterRiskAssessment): string => {
    const riskColor = getRiskColor(riskAssessment.overallRiskLevel);
    
    return `
      <div style="min-width: 280px; font-family: system-ui, -apple-system, sans-serif; line-height: 1.4;">
        <div style="padding: 16px;">
          <h3 style="margin: 0 0 12px 0; color: ${riskColor}; font-size: 16px; font-weight: 600;">
            📍 ${location.name}
          </h3>
          
          <div style="margin-bottom: 12px;">
            <span style="background-color: ${getRiskBadgeColor(riskAssessment.overallRiskLevel)}; 
                        color: ${getRiskTextColor(riskAssessment.overallRiskLevel)}; 
                        padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${riskAssessment.overallRiskLevel.toUpperCase()} RISK
            </span>
            <span style="margin-left: 8px; font-size: 12px; color: #666;">
              ${Math.round(riskAssessment.confidence * 100)}% Confidence
            </span>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 12px;">
            <div>
              <strong>🌊 Flooding:</strong> <span style="color: ${getRiskColor(riskAssessment.riskFactors.flooding)};">${riskAssessment.riskFactors.flooding}</span><br>
              <strong>💨 Wind:</strong> <span style="color: ${getRiskColor(riskAssessment.riskFactors.windDamage)};">${riskAssessment.riskFactors.windDamage}</span>
            </div>
            <div>
              <strong>🌡️ Heat:</strong> <span style="color: ${getRiskColor(riskAssessment.riskFactors.heatWave)};">${riskAssessment.riskFactors.heatWave}</span><br>
              <strong>❄️ Cold:</strong> <span style="color: ${getRiskColor(riskAssessment.riskFactors.coldWave)};">${riskAssessment.riskFactors.coldWave}</span>
            </div>
          </div>
          
          <div style="margin-bottom: 12px; font-size: 12px;">
            <strong>📏 Affected Radius:</strong> ${riskAssessment.affectedRadius} km<br>
            <strong>⏱️ Duration:</strong> ${new Date(riskAssessment.estimatedDuration.start).toLocaleDateString()} - ${new Date(riskAssessment.estimatedDuration.end).toLocaleDateString()}
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="font-size: 12px;">🤖 AI Analysis:</strong><br>
            <div style="font-size: 11px; color: #555; line-height: 1.3; margin-top: 4px;">
              ${riskAssessment.reasoning}
            </div>
          </div>
          
          ${riskAssessment.recommendations.length > 0 ? `
          <div>
            <strong style="font-size: 12px;">💡 Recommendations:</strong>
            <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 11px; color: #555;">
              ${riskAssessment.recommendations.map(rec => `<li style="margin-bottom: 2px;">${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Get risk color for markers
  const getRiskColor = (riskLevel: string): string => {
    const colors = {
      'low': '#dc2626',      // Red - All risk levels use red
      'medium': '#dc2626',   // Red - All risk levels use red
      'high': '#dc2626',     // Red - All risk levels use red
      'extreme': '#dc2626',  // Red - All risk levels use red
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Get area color for risk zones (lighter, area-focused colors)
  const getAreaColor = (riskLevel: string): string => {
    const colors = {
      'low': '#fbbf24',      // Darker yellow for low risk
      'medium': '#fed7aa',   // Light orange for medium risk  
      'high': '#fecaca',     // Light red for high risk
      'extreme': '#dc2626',  // Dark red for extreme risk
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Get border color for risk zones
  const getBorderColor = (riskLevel: string): string => {
    const colors = {
      'low': '#f59e0b',      // Orange border for low risk
      'medium': '#ea580c',   // Dark orange for medium risk
      'high': '#dc2626',     // Red for high risk
      'extreme': '#991b1b',  // Dark red for extreme risk
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Get opacity by risk level
  const getOpacityByRiskLevel = (riskLevel: string): number => {
    const opacities = {
      'low': 0.3,
      'medium': 0.4,
      'high': 0.5,
      'extreme': 0.6,
    };
    return opacities[riskLevel as keyof typeof opacities] || 0.3;
  };

  // Get risk badge background color
  const getRiskBadgeColor = (riskLevel: string): string => {
    const colors = {
      'low': '#dcfce7',
      'medium': '#dbeafe',
      'high': '#fed7aa',
      'extreme': '#fecaca',
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Get risk text color
  const getRiskTextColor = (riskLevel: string): string => {
    const colors = {
      'low': '#166534',
      'medium': '#1e40af',
      'high': '#ea580c',
      'extreme': '#dc2626',
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  // Get risk icon
  const getRiskIcon = (riskLevel: string): string => {
    const icons = {
      'low': '✓',
      'medium': '⚠',
      'high': '⚠',
      'extreme': '⚠',
    };
    return icons[riskLevel as keyof typeof icons] || icons.low;
  };

  // Toggle risk areas visibility
  const toggleRiskAreas = () => {
    setShowRiskAreas(!showRiskAreas);
    
    if (map.current) {
      circles.current.forEach((layerId) => {
        const visibility = showRiskAreas ? 'none' : 'visible';
        map.current?.setLayoutProperty(layerId, 'visibility', visibility);
      });
    }
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
      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-600">Loading TomTom Map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          onClick={toggleRiskAreas}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          {showRiskAreas ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          Risk Areas
        </Button>
      </div>

      {/* Status indicators */}
      {(isLoading || isAssessing) && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">
            {isLoading && isAssessing ? 'Loading weather & assessing risk...' :
             isLoading ? 'Fetching weather data...' :
             isAssessing ? 'AI assessing disaster risk...' : ''}
          </span>
        </div>
      )}

      {/* Risk Legend */}
      {showLegend && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
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

export default SmartDisasterMap;
