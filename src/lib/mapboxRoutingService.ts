import type { DisasterRiskAssessment } from './gemini';

interface RoutePoint {
  lat: number;
  lon: number;
  name?: string;
}

interface RouteOptions {
  start: RoutePoint;
  destination: RoutePoint;
  avoidHighRisk?: boolean;
  routeType?: 'fastest' | 'shortest' | 'scenic';
  vehicleType?: 'driving' | 'walking' | 'cycling';
}

interface SafeRoute {
  id: string;
  route: any; // Mapbox route object
  geometry: Array<[number, number]>; // [lon, lat] coordinates
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  riskAreasEncountered: number;
  riskAreasAvoided: number;
  estimatedTime: number; // in minutes
  distance: number; // in meters
  safetyScore: number; // 0-100
  routeType: string;
  riskDetails: Array<{
    location: string;
    riskLevel: string;
    distance: number; // distance from route in km
    recommendation: string;
  }>;
}

interface RoutingError {
  code: string;
  message: string;
}

class MapboxRoutingService {
  private apiKey: string;
  private baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateSafeRoutes(
    options: RouteOptions,
    riskAssessments: DisasterRiskAssessment[]
  ): Promise<SafeRoute[]> {
    try {
      const routes: SafeRoute[] = [];

      // Calculate multiple route alternatives
      const routeTypes = ['fastest', 'shortest'];
      const routePromises = routeTypes.map(type => 
        this.calculateSingleRoute(options, type, riskAssessments)
      );

      const results = await Promise.allSettled(routePromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          routes.push(result.value);
        } else if (result.status === 'rejected') {
          console.warn(`Route calculation failed for ${routeTypes[index]}:`, result.reason);
        }
      });

      // Always calculate avoidance routes if there are risk areas, regardless of user preference
      // This gives users options to compare
      if (riskAssessments.length > 0) {
        console.log(`🛡️ Calculating risk avoidance routes for ${riskAssessments.length} risk areas...`);
        
        try {
          // Try multiple avoidance strategies
          const avoidanceRoute = await this.calculateAvoidanceRoute(options, riskAssessments);
          if (avoidanceRoute) {
            console.log(`✅ Generated avoidance route with safety score: ${avoidanceRoute.safetyScore}`);
            routes.push(avoidanceRoute);
          }
          
          // If user wants to avoid high-risk areas, try additional alternative routes
          if (options.avoidHighRisk) {
            const alternativeRoute = await this.calculateAlternativeAvoidanceRoute(options, riskAssessments);
            if (alternativeRoute && !this.isDuplicateRoute(alternativeRoute, routes)) {
              console.log(`✅ Generated alternative avoidance route with safety score: ${alternativeRoute.safetyScore}`);
              routes.push(alternativeRoute);
            }
          }
          
        } catch (error) {
          console.warn('Avoidance route calculation failed:', error);
        }
      }

      // Remove duplicates and sort by safety score
      const uniqueRoutes = this.removeDuplicateRoutes(routes);
      return uniqueRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

    } catch (error) {
      console.error('Error calculating safe routes:', error);
      throw new Error('Failed to calculate safe routes');
    }
  }

  private async calculateSingleRoute(
    options: RouteOptions,
    routeType: string,
    riskAssessments: DisasterRiskAssessment[]
  ): Promise<SafeRoute | null> {
    try {
      const profile = options.vehicleType || 'driving';
      const coordinates = `${options.start.lon},${options.start.lat};${options.destination.lon},${options.destination.lat}`;
      
      const params = new URLSearchParams({
        access_token: this.apiKey,
        alternatives: 'true',
        geometries: 'geojson',
        steps: 'true',
        banner_instructions: 'true',
        overview: 'full',
        annotations: 'duration,distance',
      });

      // Add route-specific preferences
      if (routeType === 'fastest') {
        // Default is already fastest route
      } else if (routeType === 'shortest') {
        // Mapbox doesn't have a direct "shortest" option, but we can prefer avoid_tolls which sometimes gives shorter routes
        params.append('exclude', 'ferry');
      }

      const url = `${this.baseUrl}/${profile}/${coordinates}?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mapbox API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found');
      }

      // Use the first route (Mapbox returns routes sorted by preference)
      const route = data.routes[0];
      
      return this.analyzeRouteSafety(route, riskAssessments, routeType, options);

    } catch (error) {
      console.error(`Error calculating ${routeType} route:`, error);
      return null;
    }
  }

  private async calculateAvoidanceRoute(
    options: RouteOptions,
    riskAssessments: DisasterRiskAssessment[]
  ): Promise<SafeRoute | null> {
    try {
      // Get high-risk areas
      const highRiskAreas = riskAssessments.filter(
        assessment => assessment.overallRiskLevel === 'high' || assessment.overallRiskLevel === 'extreme'
      );

      if (highRiskAreas.length === 0) {
        return null; // No high-risk areas to avoid
      }

      // Create waypoints to avoid high-risk areas
      const avoidanceWaypoints = this.calculateAvoidanceWaypoints(
        options.start,
        options.destination,
        highRiskAreas
      );

      if (avoidanceWaypoints.length === 0) {
        return null; // No effective avoidance waypoints found
      }

      // Build coordinates string with waypoints
      const allPoints = [
        options.start,
        ...avoidanceWaypoints,
        options.destination
      ];
      
      const coordinates = allPoints
        .map(point => `${point.lon},${point.lat}`)
        .join(';');

      const profile = options.vehicleType || 'driving';
      const params = new URLSearchParams({
        access_token: this.apiKey,
        geometries: 'geojson',
        steps: 'true',
        overview: 'full',
        annotations: 'duration,distance',
      });

      const url = `${this.baseUrl}/${profile}/${coordinates}?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Avoidance route API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const safeRoute = this.analyzeRouteSafety(route, riskAssessments, 'avoidance', options);
      
      if (safeRoute) {
        safeRoute.riskAreasAvoided = highRiskAreas.length;
        safeRoute.safetyScore += 15; // Bonus for explicit avoidance
      }

      return safeRoute;

    } catch (error) {
      console.warn('Failed to calculate avoidance route:', error);
      return null;
    }
  }

  private async calculateAlternativeAvoidanceRoute(
    options: RouteOptions,
    riskAssessments: DisasterRiskAssessment[]
  ): Promise<SafeRoute | null> {
    try {
      // Get high-risk areas
      const highRiskAreas = riskAssessments.filter(
        assessment => assessment.overallRiskLevel === 'high' || assessment.overallRiskLevel === 'extreme'
      );

      if (highRiskAreas.length === 0) {
        return null;
      }

      // Use different avoidance strategy - try going around the other side
      const waypoints = this.calculateAlternativeAvoidanceWaypoints(options.start, options.destination, highRiskAreas);
      
      if (waypoints.length === 0) {
        return null;
      }

      // Build coordinates string with waypoints
      const coordinates = [
        `${options.start.lon},${options.start.lat}`,
        ...waypoints.map(wp => `${wp.lon},${wp.lat}`),
        `${options.destination.lon},${options.destination.lat}`
      ].join(';');

      const profile = options.vehicleType || 'driving';
      const params = new URLSearchParams({
        access_token: this.apiKey,
        geometries: 'geojson',
        steps: 'true',
        overview: 'full',
        annotations: 'duration,distance',
      });

      const url = `${this.baseUrl}/${profile}/${coordinates}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Alternative avoidance route failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const safeRoute = this.analyzeRouteSafety(route, riskAssessments, 'alternative-avoidance', options);
      
      if (safeRoute) {
        safeRoute.riskAreasAvoided = highRiskAreas.length;
        safeRoute.safetyScore += 10; // Bonus for alternative avoidance
      }

      return safeRoute;

    } catch (error) {
      console.warn('Failed to calculate alternative avoidance route:', error);
      return null;
    }
  }

  private calculateAvoidanceWaypoints(
    start: RoutePoint,
    destination: RoutePoint,
    highRiskAreas: DisasterRiskAssessment[]
  ): RoutePoint[] {
    const waypoints: RoutePoint[] = [];

    // Simple avoidance strategy: create waypoints that detour around high-risk areas
    for (const riskArea of highRiskAreas) {
      const riskCenter = { lat: riskArea.location.lat, lon: riskArea.location.lon };
      
      // Check if risk area is between start and destination
      if (this.isPointNearLine(start, destination, riskCenter, riskArea.affectedRadius)) {
        // Create waypoint to go around the risk area
        const avoidancePoint = this.createAvoidanceWaypoint(start, destination, riskCenter, riskArea.affectedRadius);
        if (avoidancePoint) {
          waypoints.push(avoidancePoint);
        }
      }
    }

    return waypoints.slice(0, 3); // Limit to 3 waypoints to avoid overly complex routes
  }

  private calculateAlternativeAvoidanceWaypoints(
    start: RoutePoint,
    destination: RoutePoint,
    highRiskAreas: DisasterRiskAssessment[]
  ): RoutePoint[] {
    const waypoints: RoutePoint[] = [];
    
    // Use a different strategy for alternative routing - go around the opposite side
    for (const riskArea of highRiskAreas) {
      const riskLat = riskArea.location.lat;
      const riskLon = riskArea.location.lon;
      const radius = riskArea.affectedRadius / 111; // Convert km to degrees (rough)
      
      // Calculate direction from start to destination
      const routeAngle = Math.atan2(
        destination.lat - start.lat,
        destination.lon - start.lon
      );
      
      // Calculate direction from risk area center to start
      const riskToStartAngle = Math.atan2(
        start.lat - riskLat,
        start.lon - riskLon
      );
      
      // For alternative route, go to the opposite side
      const avoidanceAngle = riskToStartAngle + Math.PI; // Opposite direction
      
      // Create waypoint further from risk area
      const waypointLat = riskLat + Math.sin(avoidanceAngle) * radius * 2;
      const waypointLon = riskLon + Math.cos(avoidanceAngle) * radius * 2;
      
      waypoints.push({
        lat: waypointLat,
        lon: waypointLon,
        name: `Alternative avoidance point for ${riskArea.location.name}`
      });
    }
    
    return waypoints.slice(0, 2); // Limit alternative waypoints
  }

  private isDuplicateRoute(route: SafeRoute, existingRoutes: SafeRoute[]): boolean {
    const threshold = 0.1; // 10% difference threshold
    
    return existingRoutes.some(existing => {
      const durationDiff = Math.abs(route.duration - existing.duration) / existing.duration;
      const distanceDiff = Math.abs(route.distance - existing.distance) / existing.distance;
      
      return durationDiff < threshold && distanceDiff < threshold;
    });
  }

  private isPointNearLine(
    start: RoutePoint,
    end: RoutePoint,
    point: RoutePoint,
    radiusKm: number
  ): boolean {
    // Calculate distance from point to line segment
    const distance = this.pointToLineDistance(start, end, point);
    return distance <= radiusKm;
  }

  private pointToLineDistance(
    lineStart: RoutePoint,
    lineEnd: RoutePoint,
    point: RoutePoint
  ): number {
    const A = point.lat - lineStart.lat;
    const B = point.lon - lineStart.lon;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lon - lineStart.lon;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Line start and end are the same point
      return this.haversineDistance(point.lat, point.lon, lineStart.lat, lineStart.lon);
    }

    let param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lon;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lon;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lon + param * D;
    }

    return this.haversineDistance(point.lat, point.lon, xx, yy);
  }

  private createAvoidanceWaypoint(
    start: RoutePoint,
    end: RoutePoint,
    riskCenter: RoutePoint,
    radiusKm: number
  ): RoutePoint | null {
    // Create a waypoint that goes around the risk area
    const midLat = (start.lat + end.lat) / 2;
    const midLon = (start.lon + end.lon) / 2;

    // Calculate perpendicular direction from the line
    const dx = end.lat - start.lat;
    const dy = end.lon - start.lon;

    // Perpendicular vector
    const perpX = -dy;
    const perpY = dx;

    // Normalize and scale by avoidance distance
    const length = Math.sqrt(perpX * perpX + perpY * perpY);
    if (length === 0) return null;

    const avoidanceDistance = radiusKm * 1.5; // Go 1.5x the radius away
    const normalizedX = (perpX / length) * (avoidanceDistance / 111); // Rough degree conversion
    const normalizedY = (perpY / length) * (avoidanceDistance / 111);

    // Try both sides of the line, choose the one further from risk center
    const option1 = {
      lat: midLat + normalizedX,
      lon: midLon + normalizedY,
    };

    const option2 = {
      lat: midLat - normalizedX,
      lon: midLon - normalizedY,
    };

    const dist1 = this.haversineDistance(option1.lat, option1.lon, riskCenter.lat, riskCenter.lon);
    const dist2 = this.haversineDistance(option2.lat, option2.lon, riskCenter.lat, riskCenter.lon);

    return dist1 > dist2 ? option1 : option2;
  }

  private analyzeRouteSafety(
    route: any,
    riskAssessments: DisasterRiskAssessment[],
    routeType: string,
    options: RouteOptions
  ): SafeRoute {
    const warnings: string[] = [];
    const riskDetails: SafeRoute['riskDetails'] = [];
    let maxRiskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    let riskAreasEncountered = 0;

    // Extract route geometry
    const geometry: Array<[number, number]> = route.geometry.coordinates;

    // Check proximity to risk areas
    for (const riskAssessment of riskAssessments) {
      const riskLocation = { lat: riskAssessment.location.lat, lon: riskAssessment.location.lon };
      const minDistance = this.getMinimumDistanceToRoute(geometry, riskLocation);

      // Consider area affected if route passes within the risk radius
      if (minDistance <= riskAssessment.affectedRadius) {
        riskAreasEncountered++;
        
        if (this.getRiskPriority(riskAssessment.overallRiskLevel) > this.getRiskPriority(maxRiskLevel)) {
          maxRiskLevel = riskAssessment.overallRiskLevel;
        }

        warnings.push(
          `Route passes through ${riskAssessment.location.name} (${riskAssessment.overallRiskLevel} risk)`
        );

        riskDetails.push({
          location: riskAssessment.location.name,
          riskLevel: riskAssessment.overallRiskLevel,
          distance: minDistance,
          recommendation: riskAssessment.recommendations[0] || 'Exercise caution in this area',
        });

        // Add specific risk factor warnings
        if (riskAssessment.riskFactors.flooding !== 'low') {
          warnings.push(`Potential flooding risk in ${riskAssessment.location.name}`);
        }
        if (riskAssessment.riskFactors.windDamage !== 'low') {
          warnings.push(`High wind risk in ${riskAssessment.location.name}`);
        }
      }
    }

    // Calculate safety score (0-100)
    let safetyScore = 100;
    
    // Deduct points for risk areas encountered
    safetyScore -= riskAreasEncountered * 15;
    
    // Deduct more points for higher risk levels
    const riskPenalty = {
      'low': 0,
      'medium': 5,
      'high': 20,
      'extreme': 40,
    };
    safetyScore -= riskPenalty[maxRiskLevel];

    // Bonus for avoiding high-risk areas (if this was an avoidance route)
    if (routeType === 'avoidance') {
      safetyScore += 10;
    }

    // Slight penalty for longer routes (to balance safety vs efficiency)
    const routeDistance = route.distance;
    if (routeDistance > 50000) { // Routes longer than 50km
      safetyScore -= Math.min(10, (routeDistance - 50000) / 10000);
    }

    safetyScore = Math.max(0, Math.min(100, safetyScore));

    return {
      id: `${routeType}-${Date.now()}`,
      route,
      geometry,
      riskLevel: maxRiskLevel,
      warnings,
      riskAreasEncountered,
      riskAreasAvoided: 0, // Will be set by calling function if applicable
      estimatedTime: Math.round(route.duration / 60), // Convert seconds to minutes
      distance: route.distance,
      safetyScore,
      routeType,
      riskDetails,
    };
  }

  private getMinimumDistanceToRoute(
    routeGeometry: Array<[number, number]>,
    point: { lat: number; lon: number }
  ): number {
    let minDistance = Infinity;

    for (const [lon, lat] of routeGeometry) {
      const distance = this.haversineDistance(point.lat, point.lon, lat, lon);
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const EARTH_RADIUS = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return EARTH_RADIUS * c;
  }

  private getRiskPriority(level: string): number {
    const priorities = { 'low': 1, 'medium': 2, 'high': 3, 'extreme': 4 };
    return priorities[level as keyof typeof priorities] || 1;
  }

  private removeDuplicateRoutes(routes: SafeRoute[]): SafeRoute[] {
    // Remove routes with very similar paths or identical safety scores and distances
    const uniqueRoutes: SafeRoute[] = [];
    
    for (const route of routes) {
      const isDuplicate = uniqueRoutes.some(existing => 
        Math.abs(existing.distance - route.distance) < 1000 && // Within 1km
        Math.abs(existing.estimatedTime - route.estimatedTime) < 2 && // Within 2 minutes
        Math.abs(existing.safetyScore - route.safetyScore) < 5 // Within 5 points
      );

      if (!isDuplicate) {
        uniqueRoutes.push(route);
      }
    }

    return uniqueRoutes;
  }

  // Test API connection
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test with a simple route request
      const coordinates = '101.6869,3.139;101.5951,3.1073'; // KL City Centre to Petaling Jaya
      const url = `${this.baseUrl}/driving/${coordinates}?access_token=${this.apiKey}&geometries=geojson`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return {
          success: false,
          message: `Mapbox API Error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          success: true,
          message: `Mapbox Routing API connected successfully. Test route: ${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)} minutes`
        };
      }

      return {
        success: false,
        message: 'Mapbox API responded but returned no routes'
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export { MapboxRoutingService, type RouteOptions, type SafeRoute, type RoutePoint };
