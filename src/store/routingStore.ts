import { create } from 'zustand';
import { MapboxRoutingService, type SafeRoute, type RouteOptions, type RoutePoint } from '../lib/mapboxRoutingService';
import type { DisasterRiskAssessment } from '../lib/gemini';

// Intelligent route selection logic
function selectBestRoute(routes: SafeRoute[], prioritizeSafety: boolean): SafeRoute | null {
  if (routes.length === 0) return null;
  if (routes.length === 1) return routes[0];

  console.log('🤖 Smart Route Selection Analysis:');
  console.log(`Available routes: ${routes.length}`);
  console.log(`Prioritize safety: ${prioritizeSafety}`);

  // Log all routes for analysis
  routes.forEach((route, index) => {
    console.log(`Route ${index + 1} (${route.type}):`, {
      safetyScore: route.safetyScore,
      maxRiskLevel: route.maxRiskLevel,
      riskAreasEncountered: route.riskAreasEncountered,
      duration: Math.round(route.duration / 60),
      warnings: route.warnings.length
    });
  });

  if (prioritizeSafety) {
    // When safety is prioritized, use sophisticated selection logic
    
    // First, try to find routes that completely avoid high-risk areas
    const safeRoutes = routes.filter(route => 
      route.maxRiskLevel !== 'high' && route.maxRiskLevel !== 'extreme'
    );
    
    if (safeRoutes.length > 0) {
      console.log(`✅ Found ${safeRoutes.length} routes avoiding high-risk areas`);
      // Among safe routes, pick the one with highest safety score
      const bestSafeRoute = safeRoutes.reduce((best, current) => 
        current.safetyScore > best.safetyScore ? current : best
      );
      console.log(`🏆 Selected safest route: ${bestSafeRoute.type} (safety: ${bestSafeRoute.safetyScore})`);
      return bestSafeRoute;
    }
    
    // If no completely safe routes, pick the one with highest safety score
    const highestSafetyRoute = routes.reduce((best, current) => 
      current.safetyScore > best.safetyScore ? current : best
    );
    console.log(`⚠️ No completely safe routes found. Selected least risky: ${highestSafetyRoute.type} (safety: ${highestSafetyRoute.safetyScore})`);
    return highestSafetyRoute;
    
  } else {
    // When safety is not prioritized, balance safety with efficiency
    const routeScores = routes.map(route => {
      // Combined score: 60% safety, 40% efficiency (inverse of duration)
      const safetyWeight = 0.6;
      const efficiencyWeight = 0.4;
      
      const maxDuration = Math.max(...routes.map(r => r.duration));
      const efficiencyScore = ((maxDuration - route.duration) / maxDuration) * 100;
      
      const combinedScore = (route.safetyScore * safetyWeight) + (efficiencyScore * efficiencyWeight);
      
      return { route, combinedScore };
    });
    
    const bestBalanced = routeScores.reduce((best, current) => 
      current.combinedScore > best.combinedScore ? current : best
    );
    
    console.log(`⚖️ Selected balanced route: ${bestBalanced.route.type} (combined score: ${bestBalanced.combinedScore.toFixed(1)})`);
    return bestBalanced.route;
  }
}

interface RoutingStore {
  routes: SafeRoute[];
  selectedRoute: SafeRoute | null;
  isCalculating: boolean;
  error: string | null;
  
  // Route points
  startPoint: RoutePoint | null;
  endPoint: RoutePoint | null;
  
  // Settings
  avoidHighRisk: boolean;
  vehicleType: 'driving' | 'walking' | 'cycling';
  
  // Actions
  calculateRoutes: (riskAssessments: DisasterRiskAssessment[]) => Promise<void>;
  selectRoute: (route: SafeRoute) => void;
  setStartPoint: (point: RoutePoint | null) => void;
  setEndPoint: (point: RoutePoint | null) => void;
  setAvoidHighRisk: (avoid: boolean) => void;
  setVehicleType: (type: 'driving' | 'walking' | 'cycling') => void;
  clearRoutes: () => void;
  clearError: () => void;
  testRoutingConnection: () => Promise<{ success: boolean; message: string }>;
}

export const useRoutingStore = create<RoutingStore>((set, get) => ({
  routes: [],
  selectedRoute: null,
  isCalculating: false,
  error: null,
  startPoint: null,
  endPoint: null,
  avoidHighRisk: true,
  vehicleType: 'driving',

  calculateRoutes: async (riskAssessments: DisasterRiskAssessment[]) => {
    const { startPoint, endPoint, avoidHighRisk, vehicleType } = get();
    
    if (!startPoint || !endPoint) {
      set({ error: 'Please select both start and end points' });
      return;
    }

    const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!apiKey) {
      set({ error: 'Mapbox API token not configured' });
      return;
    }

    set({ isCalculating: true, error: null, routes: [], selectedRoute: null });

    try {
      const routingService = new MapboxRoutingService(apiKey);
      
      const options: RouteOptions = {
        start: startPoint,
        destination: endPoint,
        avoidHighRisk,
        vehicleType,
      };

      const calculatedRoutes = await routingService.calculateSafeRoutes(options, riskAssessments);

      // Automatically select the best route based on safety and avoidance preferences
      const bestRoute = selectBestRoute(calculatedRoutes, avoidHighRisk);
      
      set({ 
        routes: calculatedRoutes,
        selectedRoute: bestRoute,
        isCalculating: false 
      });

    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to calculate routes',
        isCalculating: false,
        routes: [],
        selectedRoute: null,
      });
    }
  },

  selectRoute: (route: SafeRoute) => {
    set({ selectedRoute: route });
  },

  setStartPoint: (point: RoutePoint | null) => {
    set({ startPoint: point });
    // Clear existing routes when points change
    const { endPoint } = get();
    if (endPoint && point) {
      set({ routes: [], selectedRoute: null });
    }
  },

  setEndPoint: (point: RoutePoint | null) => {
    set({ endPoint: point });
    // Clear existing routes when points change
    const { startPoint } = get();
    if (startPoint && point) {
      set({ routes: [], selectedRoute: null });
    }
  },

  setAvoidHighRisk: (avoid: boolean) => {
    const { startPoint, endPoint, routes } = get();
    set({ avoidHighRisk: avoid });
    
    // If we have existing routes and valid points, automatically recalculate
    if (startPoint && endPoint && routes.length > 0) {
      console.log(`🔄 Risk avoidance setting changed to: ${avoid}. Recalculating routes...`);
      // Get the latest risk assessments and recalculate
      setTimeout(() => {
        const state = get();
        // We need to get risk assessments from somewhere - this would need to be passed or accessed
        // For now, just re-select the best route from existing ones
        const bestRoute = selectBestRoute(state.routes, avoid);
        set({ selectedRoute: bestRoute });
      }, 100);
    } else {
      // Clear routes when settings change if no valid calculation can be done
      set({ routes: [], selectedRoute: null });
    }
  },

  setVehicleType: (type: 'driving' | 'walking' | 'cycling') => {
    set({ vehicleType: type });
    // Clear routes when settings change
    set({ routes: [], selectedRoute: null });
  },

  clearRoutes: () => {
    set({ routes: [], selectedRoute: null });
  },

  clearError: () => {
    set({ error: null });
  },

  testRoutingConnection: async () => {
    const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        message: 'Mapbox API token not configured'
      };
    }

    try {
      const routingService = new MapboxRoutingService(apiKey);
      return await routingService.testApiConnection();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  },
}));
