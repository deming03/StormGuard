# Weather-Based Disaster Risk Assessment & Routing Implementation Guide

## Overview
This guide implements a comprehensive weather-based disaster risk assessment system that integrates OpenWeather API, Gemini AI, and TomTom Maps/Routing APIs to provide intelligent disaster risk prediction and safe routing.

## Prerequisites
- OpenWeather API Key
- Gemini API Key (already configured)
- TomTom API Key
- React/TypeScript environment (already set up)

---

## Step 1: Fetch Weather Forecast Data

### 1.1 Set up OpenWeather API Integration

#### Install Dependencies
```bash
npm install axios
```

#### Create Weather Service
Create `src/lib/openWeatherService.ts`:

```typescript
interface WeatherData {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    weatherMain: string;
    weatherDescription: string;
  };
  forecast: {
    datetime: string;
    temperature: number;
    rainfall: number;
    windSpeed: number;
    windDirection: number;
    weatherMain: string;
    weatherDescription: string;
    alerts?: string[];
  }[];
  alerts: {
    event: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    start: string;
    end: string;
  }[];
}

class OpenWeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWeatherForecast(lat: number, lon: number, locationName: string): Promise<WeatherData> {
    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      const currentData = await currentResponse.json();

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      const forecastData = await forecastResponse.json();

      // Fetch weather alerts (if available)
      let alertsData = [];
      try {
        const alertsResponse = await fetch(
          `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`
        );
        const alerts = await alertsResponse.json();
        alertsData = alerts.alerts || [];
      } catch (error) {
        console.warn('Weather alerts not available for this location');
      }

      return this.formatWeatherData(currentData, forecastData, alertsData, { lat, lon, name: locationName });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  private formatWeatherData(current: any, forecast: any, alerts: any[], location: any): WeatherData {
    return {
      location,
      current: {
        temperature: current.main.temp,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        windDirection: current.wind.deg,
        pressure: current.main.pressure,
        visibility: current.visibility / 1000, // Convert to km
        weatherMain: current.weather[0].main,
        weatherDescription: current.weather[0].description,
      },
      forecast: forecast.list.map((item: any) => ({
        datetime: item.dt_txt,
        temperature: item.main.temp,
        rainfall: item.rain?.['3h'] || 0,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg,
        weatherMain: item.weather[0].main,
        weatherDescription: item.weather[0].description,
      })),
      alerts: alerts.map((alert: any) => ({
        event: alert.event,
        description: alert.description,
        severity: this.mapSeverity(alert.tags?.[0] || 'moderate'),
        start: new Date(alert.start * 1000).toISOString(),
        end: new Date(alert.end * 1000).toISOString(),
      })),
    };
  }

  private mapSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    const severityMap: { [key: string]: 'minor' | 'moderate' | 'severe' | 'extreme' } = {
      'minor': 'minor',
      'moderate': 'moderate',
      'severe': 'severe',
      'extreme': 'extreme',
    };
    return severityMap[severity.toLowerCase()] || 'moderate';
  }
}

export { OpenWeatherService, type WeatherData };
```

### 1.2 Create Weather Data Store
Create `src/store/weatherStore.ts`:

```typescript
import { create } from 'zustand';
import { WeatherData } from '../lib/openWeatherService';

interface WeatherStore {
  weatherData: Map<string, WeatherData>;
  isLoading: boolean;
  error: string | null;
  
  fetchWeatherForLocation: (lat: number, lon: number, name: string) => Promise<void>;
  getWeatherByLocation: (locationKey: string) => WeatherData | null;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  weatherData: new Map(),
  isLoading: false,
  error: null,

  fetchWeatherForLocation: async (lat: number, lon: number, name: string) => {
    const locationKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    set({ isLoading: true, error: null });

    try {
      const openWeatherService = new OpenWeatherService(process.env.VITE_OPENWEATHER_API_KEY!);
      const weatherData = await openWeatherService.getWeatherForecast(lat, lon, name);
      
      set(state => ({
        weatherData: new Map(state.weatherData.set(locationKey, weatherData)),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  getWeatherByLocation: (locationKey: string) => {
    return get().weatherData.get(locationKey) || null;
  },

  clearError: () => set({ error: null }),
}));
```

---

## Step 2: Interpret Disaster Risk Using Gemini AI

### 2.1 Enhance Gemini Service for Risk Assessment
Update `src/lib/gemini.ts`:

```typescript
// Add to existing gemini.ts file
import { WeatherData } from './openWeatherService';

interface DisasterRiskAssessment {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  overallRiskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: {
    flooding: 'low' | 'medium' | 'high' | 'extreme';
    windDamage: 'low' | 'medium' | 'high' | 'extreme';
    heatWave: 'low' | 'medium' | 'high' | 'extreme';
    coldWave: 'low' | 'medium' | 'high' | 'extreme';
  };
  confidence: number; // 0-1
  reasoning: string;
  recommendations: string[];
  estimatedDuration: {
    start: string;
    end: string;
  };
  affectedRadius: number; // in kilometers
}

export async function assessDisasterRisk(weatherData: WeatherData): Promise<DisasterRiskAssessment> {
  const prompt = `
You are an expert meteorologist and disaster risk analyst. Analyze the following weather data and provide a comprehensive disaster risk assessment.

Weather Data:
Location: ${weatherData.location.name} (${weatherData.location.lat}, ${weatherData.location.lon})

Current Conditions:
- Temperature: ${weatherData.current.temperature}°C
- Wind Speed: ${weatherData.current.windSpeed} m/s
- Humidity: ${weatherData.current.humidity}%
- Pressure: ${weatherData.current.pressure} hPa
- Weather: ${weatherData.current.weatherDescription}

5-Day Forecast:
${weatherData.forecast.map(day => 
  `- ${day.datetime}: ${day.temperature}°C, Rainfall: ${day.rainfall}mm, Wind: ${day.windSpeed}m/s, ${day.weatherDescription}`
).join('\n')}

Weather Alerts:
${weatherData.alerts.length > 0 ? 
  weatherData.alerts.map(alert => `- ${alert.event}: ${alert.description} (${alert.severity})`).join('\n') :
  'No active weather alerts'
}

Based on this data, provide a risk assessment in the following JSON format:
{
  "overallRiskLevel": "low|medium|high|extreme",
  "riskFactors": {
    "flooding": "low|medium|high|extreme",
    "windDamage": "low|medium|high|extreme", 
    "heatWave": "low|medium|high|extreme",
    "coldWave": "low|medium|high|extreme"
  },
  "confidence": 0.85,
  "reasoning": "Detailed explanation of the risk assessment",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "estimatedDuration": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-02T00:00:00Z"
  },
  "affectedRadius": 15.5
}

Consider these factors:
1. Rainfall accumulation and intensity for flooding risk
2. Wind speed and gusts for wind damage risk  
3. Temperature extremes for heat/cold wave risk
4. Weather alert severity levels
5. Local topography and drainage (assume average conditions)
6. Population density impact (assume medium density)

Provide only the JSON response, no additional text.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const assessment = JSON.parse(text) as Omit<DisasterRiskAssessment, 'location'>;
    
    return {
      ...assessment,
      location: weatherData.location,
    };
  } catch (error) {
    console.error('Error assessing disaster risk:', error);
    throw new Error('Failed to assess disaster risk');
  }
}
```

### 2.2 Create Risk Assessment Store
Create `src/store/riskAssessmentStore.ts`:

```typescript
import { create } from 'zustand';
import { DisasterRiskAssessment } from '../lib/gemini';

interface RiskAssessmentStore {
  riskAssessments: Map<string, DisasterRiskAssessment>;
  isAssessing: boolean;
  error: string | null;

  assessRisk: (locationKey: string, weatherData: WeatherData) => Promise<void>;
  getRiskByLocation: (locationKey: string) => DisasterRiskAssessment | null;
  getHighRiskAreas: () => DisasterRiskAssessment[];
  clearError: () => void;
}

export const useRiskAssessmentStore = create<RiskAssessmentStore>((set, get) => ({
  riskAssessments: new Map(),
  isAssessing: false,
  error: null,

  assessRisk: async (locationKey: string, weatherData: WeatherData) => {
    set({ isAssessing: true, error: null });

    try {
      const assessment = await assessDisasterRisk(weatherData);
      
      set(state => ({
        riskAssessments: new Map(state.riskAssessments.set(locationKey, assessment)),
        isAssessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Risk assessment failed',
        isAssessing: false,
      });
    }
  },

  getRiskByLocation: (locationKey: string) => {
    return get().riskAssessments.get(locationKey) || null;
  },

  getHighRiskAreas: () => {
    const assessments = Array.from(get().riskAssessments.values());
    return assessments.filter(assessment => 
      assessment.overallRiskLevel === 'high' || assessment.overallRiskLevel === 'extreme'
    );
  },

  clearError: () => set({ error: null }),
}));
```

---

## Step 3: Mark Disaster-Affected Areas on Map

### 3.1 Install TomTom SDK
```bash
npm install @tomtom-international/web-sdk-maps @tomtom-international/web-sdk-services
```

### 3.2 Create Enhanced Disaster Map Component
Update `src/components/map/DisasterMap.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { useRiskAssessmentStore } from '../../store/riskAssessmentStore';
import { useWeatherStore } from '../../store/weatherStore';
import { DisasterRiskAssessment } from '../../lib/gemini';

interface DisasterMapProps {
  locations: Array<{ lat: number; lon: number; name: string }>;
  onLocationSelect?: (lat: number, lon: number) => void;
}

const DisasterMap: React.FC<DisasterMapProps> = ({ locations, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<tt.Map | null>(null);
  const markers = useRef<Map<string, tt.Marker>>(new Map());
  
  const { riskAssessments, assessRisk } = useRiskAssessmentStore();
  const { weatherData, fetchWeatherForLocation } = useWeatherStore();

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize TomTom map
    map.current = tt.map({
      key: process.env.VITE_TOMTOM_API_KEY!,
      container: mapRef.current,
      center: locations.length > 0 ? [locations[0].lon, locations[0].lat] : [0, 0],
      zoom: 8,
      style: 'main',
    });

    // Add zoom and pan controls
    map.current.addControl(new tt.NavigationControl());

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Add markers for each location with risk-based coloring
    locations.forEach(async (location) => {
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
      const riskColor = getRiskColor(riskAssessment?.overallRiskLevel || 'low');
      
      // Create risk area circle
      const riskRadius = riskAssessment?.affectedRadius || 5; // km
      
      const riskCircle = new tt.CircleLayer({
        center: [location.lon, location.lat],
        radius: riskRadius * 1000, // Convert to meters
        color: riskColor,
        opacity: 0.3,
        strokeColor: riskColor,
        strokeWidth: 2,
        strokeOpacity: 0.8,
      });

      map.current!.addLayer(riskCircle);

      // Create marker
      const markerElement = createRiskMarker(riskAssessment?.overallRiskLevel || 'low', location.name);
      
      const marker = new tt.Marker({ element: markerElement })
        .setLngLat([location.lon, location.lat])
        .addTo(map.current!);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        if (onLocationSelect) {
          onLocationSelect(location.lat, location.lon);
        }
        showRiskPopup(location, riskAssessment);
      });

      markers.current.set(locationKey, marker);
    });

    // Fit map to show all locations
    if (locations.length > 0) {
      const bounds = new tt.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.lon, location.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locations, weatherData, riskAssessments]);

  const getRiskColor = (riskLevel: string): string => {
    const colors = {
      'low': '#22c55e',      // Green - Safe
      'medium': '#3b82f6',   // Light Blue - Medium risk  
      'high': '#1e40af',     // Dark Blue - High risk
      'extreme': '#dc2626',  // Red - Extreme risk
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  const createRiskMarker = (riskLevel: string, locationName: string): HTMLElement => {
    const element = document.createElement('div');
    element.className = 'risk-marker';
    element.innerHTML = `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${getRiskColor(riskLevel)};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
      ">
        ${riskLevel.charAt(0).toUpperCase()}
      </div>
    `;
    element.title = `${locationName} - ${riskLevel.toUpperCase()} risk`;
    return element;
  };

  const showRiskPopup = (location: any, riskAssessment?: DisasterRiskAssessment) => {
    if (!map.current || !riskAssessment) return;

    const popup = new tt.Popup({ closeOnClick: true })
      .setLngLat([location.lon, location.lat])
      .setHTML(`
        <div style="min-width: 250px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: ${getRiskColor(riskAssessment.overallRiskLevel)};">
            ${location.name}
          </h3>
          <div style="margin-bottom: 10px;">
            <strong>Overall Risk: </strong>
            <span style="color: ${getRiskColor(riskAssessment.overallRiskLevel)}; font-weight: bold;">
              ${riskAssessment.overallRiskLevel.toUpperCase()}
            </span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Risk Factors:</strong><br>
            🌊 Flooding: ${riskAssessment.riskFactors.flooding}<br>
            💨 Wind Damage: ${riskAssessment.riskFactors.windDamage}<br>
            🌡️ Heat Wave: ${riskAssessment.riskFactors.heatWave}<br>
            ❄️ Cold Wave: ${riskAssessment.riskFactors.coldWave}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Confidence:</strong> ${Math.round(riskAssessment.confidence * 100)}%
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Affected Radius:</strong> ${riskAssessment.affectedRadius} km
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Reasoning:</strong><br>
            <small>${riskAssessment.reasoning}</small>
          </div>
          ${riskAssessment.recommendations.length > 0 ? `
          <div>
            <strong>Recommendations:</strong><br>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${riskAssessment.recommendations.map(rec => `<li><small>${rec}</small></li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      `)
      .addTo(map.current);
  };

  return (
    <div className="relative w-full h-96">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Risk Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <h4 className="font-semibold mb-2 text-sm">Risk Levels</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-800 mr-2"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
            <span>Extreme Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterMap;
```

---

## Step 4: TomTom Routing API Integration

### 4.1 Create Routing Service
Create `src/lib/tomtomRoutingService.ts`:

```typescript
import * as tt from '@tomtom-international/web-sdk-services';
import { DisasterRiskAssessment } from './gemini';

interface RouteOptions {
  start: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  avoidAreas?: Array<{
    lat: number;
    lon: number;
    radius: number; // in meters
  }>;
  routeType?: 'fastest' | 'shortest' | 'eco';
  vehicleType?: 'car' | 'truck' | 'motorcycle' | 'bicycle' | 'pedestrian';
}

interface SafeRoute {
  route: any; // TomTom route object
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  avoidedAreas: number;
  estimatedTime: number; // in minutes
  distance: number; // in meters
  safetyScore: number; // 0-100
}

class TomTomRoutingService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateSafeRoute(
    options: RouteOptions,
    riskAssessments: DisasterRiskAssessment[]
  ): Promise<SafeRoute[]> {
    try {
      // Convert high-risk areas to avoidance zones
      const highRiskAreas = riskAssessments.filter(
        assessment => assessment.overallRiskLevel === 'high' || assessment.overallRiskLevel === 'extreme'
      );

      const avoidAreas = [
        ...(options.avoidAreas || []),
        ...highRiskAreas.map(area => ({
          lat: area.location.lat,
          lon: area.location.lon,
          radius: area.affectedRadius * 1000, // Convert km to meters
        })),
      ];

      // Generate multiple route options
      const routePromises = [
        this.calculateRoute({ ...options, avoidAreas }, 'fastest'),
        this.calculateRoute({ ...options, avoidAreas }, 'shortest'),
      ];

      // If no safe route with avoidance, try without avoidance as backup
      if (avoidAreas.length > 0) {
        routePromises.push(
          this.calculateRoute({ ...options, avoidAreas: [] }, 'fastest')
        );
      }

      const routes = await Promise.allSettled(routePromises);
      const validRoutes = routes
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(route => route !== null);

      if (validRoutes.length === 0) {
        throw new Error('No routes found');
      }

      // Analyze each route for risk
      const safeRoutes = validRoutes.map((route, index) => 
        this.analyzeRouteSafety(route, riskAssessments, index < 2 ? avoidAreas.length : 0)
      );

      // Sort by safety score (descending)
      return safeRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

    } catch (error) {
      console.error('Error calculating safe routes:', error);
      throw new Error('Failed to calculate safe routes');
    }
  }

  private async calculateRoute(
    options: RouteOptions,
    routeType: string
  ): Promise<any | null> {
    try {
      const requestOptions: any = {
        key: this.apiKey,
        locations: `${options.start.lat},${options.start.lon}:${options.destination.lat},${options.destination.lon}`,
        routeType: routeType,
        traffic: true,
        travelMode: options.vehicleType || 'car',
      };

      // Add avoidance areas if specified
      if (options.avoidAreas && options.avoidAreas.length > 0) {
        const avoidPolygons = options.avoidAreas.map(area => {
          // Create a simple circular polygon around the point
          const points = this.generateCirclePoints(area.lat, area.lon, area.radius);
          return points.map(p => `${p.lat},${p.lon}`).join(':');
        });
        requestOptions.avoid = `area:${avoidPolygons.join('|')}`;
      }

      const response = await tt.services.calculateRoute(requestOptions);
      return response.routes?.[0] || null;
    } catch (error) {
      console.warn(`Failed to calculate ${routeType} route:`, error);
      return null;
    }
  }

  private generateCirclePoints(
    centerLat: number, 
    centerLon: number, 
    radiusMeters: number, 
    numPoints: number = 16
  ): Array<{ lat: number; lon: number }> {
    const points = [];
    const radiusInDegrees = radiusMeters / 111320; // Approximate conversion

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const lat = centerLat + radiusInDegrees * Math.cos(angle);
      const lon = centerLon + radiusInDegrees * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);
      points.push({ lat, lon });
    }

    return points;
  }

  private analyzeRouteSafety(
    route: any,
    riskAssessments: DisasterRiskAssessment[],
    avoidedAreasCount: number
  ): SafeRoute {
    const warnings: string[] = [];
    let maxRiskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    let riskAreasEncountered = 0;

    // Check if route passes through any risk areas
    const routeGeometry = route.legs?.[0]?.points || [];
    
    for (const riskAssessment of riskAssessments) {
      const isRouteAtRisk = this.checkRouteProximityToRisk(
        routeGeometry,
        riskAssessment.location,
        riskAssessment.affectedRadius * 1000
      );

      if (isRouteAtRisk) {
        riskAreasEncountered++;
        
        if (this.comparePriority(riskAssessment.overallRiskLevel, maxRiskLevel) > 0) {
          maxRiskLevel = riskAssessment.overallRiskLevel;
        }

        warnings.push(
          `Route passes near ${riskAssessment.location.name} (${riskAssessment.overallRiskLevel} risk)`
        );

        // Add specific risk factor warnings
        if (riskAssessment.riskFactors.flooding !== 'low') {
          warnings.push(`Flooding risk in ${riskAssessment.location.name}`);
        }
        if (riskAssessment.riskFactors.windDamage !== 'low') {
          warnings.push(`High winds expected in ${riskAssessment.location.name}`);
        }
      }
    }

    // Calculate safety score (0-100)
    let safetyScore = 100;
    
    // Deduct points for risk areas
    safetyScore -= riskAreasEncountered * 20;
    
    // Deduct more points for higher risk levels
    const riskPenalty = {
      'low': 0,
      'medium': 10,
      'high': 30,
      'extreme': 50,
    };
    safetyScore -= riskPenalty[maxRiskLevel];

    // Bonus points for avoiding high-risk areas
    safetyScore += avoidedAreasCount * 5;

    safetyScore = Math.max(0, Math.min(100, safetyScore));

    return {
      route,
      riskLevel: maxRiskLevel,
      warnings,
      avoidedAreas: avoidedAreasCount,
      estimatedTime: Math.round((route.summary?.travelTimeInSeconds || 0) / 60),
      distance: route.summary?.lengthInMeters || 0,
      safetyScore,
    };
  }

  private checkRouteProximityToRisk(
    routePoints: Array<{ latitude: number; longitude: number }>,
    riskLocation: { lat: number; lon: number },
    radiusMeters: number
  ): boolean {
    const EARTH_RADIUS = 6371000; // meters

    for (const point of routePoints) {
      const distance = this.haversineDistance(
        point.latitude,
        point.longitude,
        riskLocation.lat,
        riskLocation.lon
      );

      if (distance <= radiusMeters) {
        return true;
      }
    }

    return false;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const EARTH_RADIUS = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS * c;
  }

  private comparePriority(level1: string, level2: string): number {
    const priorities = { 'low': 1, 'medium': 2, 'high': 3, 'extreme': 4 };
    return (priorities[level1 as keyof typeof priorities] || 1) - 
           (priorities[level2 as keyof typeof priorities] || 1);
  }
}

export { TomTomRoutingService, type RouteOptions, type SafeRoute };
```

---

## Step 5: Integrated Safe Routing Component

### 5.1 Create Safe Routing Component
Create `src/components/SafeRoutingComponent.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, Navigation, Route, Shield } from 'lucide-react';
import { TomTomRoutingService, SafeRoute } from '../lib/tomtomRoutingService';
import { useRiskAssessmentStore } from '../store/riskAssessmentStore';
import DisasterMap from './map/DisasterMap';

interface LocationInput {
  lat: number;
  lon: number;
  name: string;
}

const SafeRoutingComponent: React.FC = () => {
  const [startLocation, setStartLocation] = useState<LocationInput | null>(null);
  const [endLocation, setEndLocation] = useState<LocationInput | null>(null);
  const [routes, setRoutes] = useState<SafeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SafeRoute | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { riskAssessments, getHighRiskAreas } = useRiskAssessmentStore();

  const routingService = new TomTomRoutingService(process.env.VITE_TOMTOM_API_KEY!);

  const calculateRoutes = async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both start and destination locations');
      return;
    }

    setIsCalculating(true);
    setError(null);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      const allRiskAssessments = Array.from(riskAssessments.values());
      
      const safeRoutes = await routingService.calculateSafeRoute(
        {
          start: { lat: startLocation.lat, lon: startLocation.lon },
          destination: { lat: endLocation.lat, lon: endLocation.lon },
          routeType: 'fastest',
        },
        allRiskAssessments
      );

      setRoutes(safeRoutes);
      if (safeRoutes.length > 0) {
        setSelectedRoute(safeRoutes[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate routes');
    } finally {
      setIsCalculating(false);
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'extreme': 'bg-red-100 text-red-800',
    };
    return colors[riskLevel as keyof typeof colors] || colors.low;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return km < 1 ? `${meters}m` : `${km.toFixed(1)}km`;
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Safe Route Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Location</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Click on map or enter coordinates"
                  value={startLocation ? `${startLocation.name} (${startLocation.lat}, ${startLocation.lon})` : ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStartLocation(null)}
                  disabled={!startLocation}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Destination</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Click on map or enter coordinates"
                  value={endLocation ? `${endLocation.name} (${endLocation.lat}, ${endLocation.lon})` : ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEndLocation(null)}
                  disabled={!endLocation}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
          
          <Button
            onClick={calculateRoutes}
            disabled={!startLocation || !endLocation || isCalculating}
            className="w-full"
          >
            {isCalculating ? 'Calculating Safe Routes...' : 'Find Safe Routes'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Options */}
      {routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.map((route, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoute === route
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRoute(route)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskBadgeColor(route.riskLevel)}>
                        {route.riskLevel.toUpperCase()} RISK
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{route.safetyScore}/100</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>{formatDuration(route.estimatedTime)}</div>
                      <div>{formatDistance(route.distance)}</div>
                    </div>
                  </div>

                  {route.avoidedAreas > 0 && (
                    <div className="text-sm text-green-600 mb-2">
                      ✓ Avoiding {route.avoidedAreas} high-risk area{route.avoidedAreas > 1 ? 's' : ''}
                    </div>
                  )}

                  {route.warnings.length > 0 && (
                    <div className="space-y-1">
                      {route.warnings.map((warning, wIndex) => (
                        <div key={wIndex} className="flex items-start gap-2 text-sm text-orange-600">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
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

      {/* Map with risk areas and selected route */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Map</CardTitle>
        </CardHeader>
        <CardContent>
          <DisasterMap
            locations={Array.from(riskAssessments.values()).map(assessment => ({
              lat: assessment.location.lat,
              lon: assessment.location.lon,
              name: assessment.location.name,
            }))}
            onLocationSelect={(lat, lon) => {
              const locationName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
              const newLocation = { lat, lon, name: locationName };
              
              if (!startLocation) {
                setStartLocation(newLocation);
              } else if (!endLocation) {
                setEndLocation(newLocation);
              } else {
                // If both are filled, replace the start location
                setStartLocation(newLocation);
                setEndLocation(null);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* High-Risk Areas Summary */}
      {getHighRiskAreas().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              High-Risk Areas Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getHighRiskAreas().map((area, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-red-800">{area.location.name}</h4>
                    <Badge className="bg-red-100 text-red-800">
                      {area.overallRiskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{area.reasoning}</p>
                  <div className="text-sm text-red-600">
                    <strong>Affected radius:</strong> {area.affectedRadius} km
                  </div>
                  {area.recommendations.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm text-red-700">Recommendations:</strong>
                      <ul className="text-sm text-red-600 list-disc list-inside mt-1">
                        {area.recommendations.map((rec, recIndex) => (
                          <li key={recIndex}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SafeRoutingComponent;
```

---

## Environment Configuration

### 6.1 Add Required Environment Variables
Update your `.env` file:

```env
# Existing variables...
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_TOMTOM_API_KEY=your_tomtom_api_key
```

### 6.2 Update Package.json Dependencies
Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "@tomtom-international/web-sdk-maps": "^6.24.0",
    "@tomtom-international/web-sdk-services": "^6.24.0",
    "axios": "^1.6.0"
  }
}
```

---

## Integration Steps

### 7.1 Add to Main Router
Update your main app to include the safe routing component:

```typescript
// In App.tsx or your router configuration
import SafeRoutingComponent from './components/SafeRoutingComponent';

// Add route
{
  path: "/safe-routing",
  element: <SafeRoutingComponent />,
}
```

### 7.2 Create Demo Data Loader
Create `src/utils/demoDataLoader.ts` for testing:

```typescript
import { useWeatherStore } from '../store/weatherStore';
import { useRiskAssessmentStore } from '../store/riskAssessmentStore';

const demoLocations = [
  { lat: 40.7128, lon: -74.0060, name: "New York City" },
  { lat: 34.0522, lon: -118.2437, name: "Los Angeles" },
  { lat: 41.8781, lon: -87.6298, name: "Chicago" },
  { lat: 29.7604, lon: -95.3698, name: "Houston" },
  { lat: 39.9526, lon: -75.1652, name: "Philadelphia" },
];

export const loadDemoData = async () => {
  const { fetchWeatherForLocation } = useWeatherStore.getState();
  const { assessRisk } = useRiskAssessmentStore.getState();

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
```

---

## Testing & Usage

### 8.1 Testing Checklist
- [ ] OpenWeather API returns valid data
- [ ] Gemini AI provides risk assessments
- [ ] TomTom map displays with risk markers
- [ ] Risk-based color coding works
- [ ] Routing avoids high-risk areas
- [ ] Route warnings display correctly
- [ ] Safety scores calculate properly
- [ ] Multiple route options provided

### 8.2 Usage Flow
1. Component loads and fetches weather data for demo locations
2. Gemini AI assesses disaster risk for each location
3. Map displays locations with color-coded risk levels
4. User selects start and destination points
5. System calculates multiple route options avoiding high-risk areas
6. Routes are displayed with safety scores and warnings
7. User can select preferred route based on risk tolerance

### 8.3 Performance Optimization
- Cache weather data for 1 hour
- Cache risk assessments for 30 minutes
- Debounce route calculations
- Implement loading states
- Add error boundaries

---

## Deployment Considerations

- Ensure all API keys are properly configured
- Set up CORS policies for external APIs
- Implement rate limiting for API calls
- Add monitoring for API usage
- Consider fallback options for API failures
- Implement proper error handling and user feedback

This implementation provides a complete weather-based disaster risk assessment and safe routing system that intelligently combines weather data, AI risk analysis, and advanced routing algorithms to ensure user safety during potential disaster events.
