import type { RoutePoint } from './mapboxRoutingService';

interface GeocodeResult {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number]; // [lon, lat]
  context?: Array<{
    id: string;
    text: string;
  }>;
  properties?: {
    address?: string;
    category?: string;
  };
}

interface GeocodeResponse {
  type: string;
  query: string[];
  features: GeocodeResult[];
  attribution: string;
}

class GeocodingService {
  private apiKey: string;
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPlaces(query: string, options?: {
    proximity?: [number, number]; // [lon, lat] - bias results towards this location
    bbox?: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat] - limit results to bounding box
    country?: string; // ISO 3166 alpha 2 country code
    types?: string; // comma-separated list of feature types
    limit?: number; // max number of results (1-10)
  }): Promise<RoutePoint[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const encodedQuery = encodeURIComponent(query.trim());
      const params = new URLSearchParams({
        access_token: this.apiKey,
        limit: (options?.limit || 10).toString(),
        language: 'en',
        fuzzyMatch: 'true', // Enable fuzzy matching for better results
        autocomplete: 'true', // Enable autocomplete mode
      });

      // Add optional parameters
      if (options?.proximity) {
        params.append('proximity', `${options.proximity[0]},${options.proximity[1]}`);
      }

      if (options?.bbox) {
        params.append('bbox', options.bbox.join(','));
      }

      if (options?.country) {
        params.append('country', options.country);
      }

      if (options?.types) {
        params.append('types', options.types);
      }

      const url = `${this.baseUrl}/${encodedQuery}.json?${params.toString()}`;
      
      console.log('Geocoding search URL:', url); // Debug logging
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Geocoding API error response:', errorText);
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data: GeocodeResponse = await response.json();
      
      console.log(`Geocoding search for "${query}" returned ${data.features.length} results:`, data.features.map(f => f.place_name));
      
      return data.features.map(this.formatGeocodeResult);

    } catch (error) {
      console.error('Geocoding search error:', error);
      throw new Error(`Failed to search for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPlacesInMalaysia(query: string, proximity?: [number, number]): Promise<RoutePoint[]> {
    // Default proximity to KL if not provided
    const klProximity: [number, number] = proximity || [101.6869, 3.139];

    // Try multiple search strategies for better results
    const searchStrategies = [
      // Strategy 1: Malaysia-focused search with proximity
      {
        proximity: klProximity,
        country: 'MY',
        limit: 10,
        types: undefined
      },
      // Strategy 2: Broader search without country restriction but with proximity
      {
        proximity: klProximity,
        limit: 8,
        types: undefined
      },
      // Strategy 3: POI-focused search for places like restaurants, malls
      {
        proximity: klProximity,
        country: 'MY',
        limit: 8,
        types: 'poi,address,place'
      }
    ];

    // Try each strategy and combine results
    const allResults: RoutePoint[] = [];
    const seenLocations = new Set<string>();

    for (const strategy of searchStrategies) {
      try {
        const results = await this.searchPlaces(query, strategy);
        
        // Add unique results (avoid duplicates)
        for (const result of results) {
          const locationKey = `${result.lat.toFixed(4)},${result.lon.toFixed(4)}`;
          if (!seenLocations.has(locationKey)) {
            seenLocations.add(locationKey);
            allResults.push(result);
          }
        }
        
        // If we have enough results, stop searching
        if (allResults.length >= 8) break;
        
      } catch (error) {
        console.warn('Search strategy failed:', strategy, error);
        continue;
      }
    }

    // If we don't have enough results from API, search local database
    if (allResults.length < 3) {
      console.log(`API returned only ${allResults.length} results, searching local database...`);
      const localResults = this.searchLocalDatabase(query);
      
      for (const result of localResults) {
        const locationKey = `${result.lat.toFixed(4)},${result.lon.toFixed(4)}`;
        if (!seenLocations.has(locationKey)) {
          seenLocations.add(locationKey);
          allResults.push(result);
        }
      }
    }

    console.log(`Total search results for "${query}": ${allResults.length}`);
    return allResults.slice(0, 10); // Return top 10 results
  }

  async reverseGeocode(lat: number, lon: number): Promise<RoutePoint | null> {
    try {
      const params = new URLSearchParams({
        access_token: this.apiKey,
        limit: '1',
        language: 'en',
      });

      const url = `${this.baseUrl}/${lon},${lat}.json?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
      }

      const data: GeocodeResponse = await response.json();
      
      if (data.features.length > 0) {
        return this.formatGeocodeResult(data.features[0]);
      }

      return {
        lat,
        lon,
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      };

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        lat,
        lon,
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      };
    }
  }

  private formatGeocodeResult = (feature: GeocodeResult): RoutePoint => {
    const [lon, lat] = feature.center;
    
    // Extract additional context for better naming
    let displayName = feature.place_name;
    
    // Clean up the display name for Malaysian locations
    if (displayName.includes('Malaysia')) {
      const parts = displayName.split(',');
      // Take the first 2-3 parts before 'Malaysia'
      const relevantParts = parts.slice(0, Math.min(3, parts.findIndex(part => part.trim() === 'Malaysia') || parts.length));
      if (relevantParts.length > 0) {
        displayName = relevantParts.join(',').trim();
      }
    }

    return {
      lat,
      lon,
      name: displayName,
    };
  };

  // Test geocoding connection
  async testGeocodingConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const results = await this.searchPlacesInMalaysia('KLCC');
      
      if (results.length > 0) {
        return {
          success: true,
          message: `Geocoding API connected successfully. Found ${results.length} results for "KLCC".`
        };
      }

      return {
        success: false,
        message: 'Geocoding API responded but returned no results for test query.'
      };

    } catch (error) {
      return {
        success: false,
        message: `Geocoding connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Comprehensive database of KL and Selangor locations
  getLocalKLSelangorDatabase(): RoutePoint[] {
    return [
      // KL City Areas
      { lat: 3.139, lon: 101.6869, name: "Kuala Lumpur City Centre (KLCC)" },
      { lat: 3.1347, lon: 101.6869, name: "KL Sentral" },
      { lat: 3.1319, lon: 101.6641, name: "Bangsar" },
      { lat: 3.1677, lon: 101.6505, name: "Mont Kiara" },
      { lat: 3.1516, lon: 101.6942, name: "Ampang" },
      { lat: 3.0347, lon: 101.7610, name: "Cheras" },
      { lat: 3.2185, lon: 101.6387, name: "Kepong" },
      { lat: 3.1619, lon: 101.5883, name: "Damansara" },
      { lat: 3.2021, lon: 101.7204, name: "Setapak" },
      { lat: 3.1458, lon: 101.7106, name: "Wangsa Maju" },
      
      // Shopping Malls
      { lat: 3.1187, lon: 101.6770, name: "Mid Valley Megamall" },
      { lat: 3.0574, lon: 101.7020, name: "IOI City Mall Putrajaya" },
      { lat: 3.1073, lon: 101.5951, name: "1 Utama Shopping Centre" },
      { lat: 3.0738, lon: 101.6014, name: "Sunway Pyramid" },
      { lat: 3.135, lon: 101.687, name: "Suria KLCC" },
      { lat: 3.147, lon: 101.693, name: "Pavilion KL" },
      { lat: 3.121, lon: 101.653, name: "The Gardens Mall" },
      { lat: 3.079, lon: 101.582, name: "Subang Parade" },
      
      // Selangor Cities/Towns
      { lat: 3.1073, lon: 101.5951, name: "Petaling Jaya" },
      { lat: 3.0733, lon: 101.5185, name: "Shah Alam" },
      { lat: 3.0738, lon: 101.6014, name: "Subang Jaya" },
      { lat: 3.2231, lon: 101.7183, name: "Gombak" },
      { lat: 3.0644, lon: 101.6003, name: "Puchong" },
      { lat: 3.2074, lon: 101.5272, name: "Klang" },
      { lat: 3.0319, lon: 101.4318, name: "Port Klang" },
      { lat: 2.9213, lon: 101.6559, name: "Cyberjaya" },
      { lat: 2.9264, lon: 101.6964, name: "Putrajaya" },
      { lat: 3.0167, lon: 101.4333, name: "Kapar" },
      { lat: 3.3026, lon: 101.5305, name: "Rawang" },
      { lat: 3.2090, lon: 101.6752, name: "Batu Caves" },
      
      // Universities
      { lat: 3.1251, lon: 101.6566, name: "University of Malaya" },
      { lat: 2.9300, lon: 101.6700, name: "Universiti Putra Malaysia" },
      { lat: 3.0733, lon: 101.5185, name: "Universiti Teknologi MARA Shah Alam" },
      { lat: 3.0738, lon: 101.6014, name: "Monash University Malaysia" },
      
      // Hospitals
      { lat: 3.1251, lon: 101.6566, name: "University Malaya Medical Centre" },
      { lat: 3.1319, lon: 101.6641, name: "Pantai Hospital Bangsar" },
      { lat: 3.1347, lon: 101.6869, name: "Kuala Lumpur Hospital" },
      { lat: 3.0738, lon: 101.6014, name: "Sunway Medical Centre" },
      
      // Landmarks & Attractions
      { lat: 3.158, lon: 101.712, name: "Petronas Twin Towers" },
      { lat: 3.153, lon: 101.703, name: "KL Tower" },
      { lat: 3.2090, lon: 101.6752, name: "Batu Caves Temple" },
      { lat: 3.0738, lon: 101.6014, name: "Sunway Lagoon" },
      { lat: 3.134, lon: 101.688, name: "KLCC Park" },
      { lat: 3.143, lon: 101.693, name: "Bukit Bintang" },
      
      // Transportation Hubs
      { lat: 3.1347, lon: 101.6869, name: "KL Sentral Station" },
      { lat: 3.2068, lon: 101.7370, name: "Terminal Bersepadu Selatan" },
      { lat: 2.7456, lon: 101.7072, name: "Kuala Lumpur International Airport KLIA" },
      { lat: 3.0738, lon: 101.6014, name: "Subang Airport Sultan Abdul Aziz Shah" },
      
      // Popular Food Areas
      { lat: 3.143, lon: 101.693, name: "Jalan Alor Food Street" },
      { lat: 3.1319, lon: 101.6641, name: "Bangsar Village" },
      { lat: 3.1073, lon: 101.5951, name: "SS2 Petaling Jaya" },
      { lat: 3.0738, lon: 101.6014, name: "SS15 Subang Jaya" },
    ];
  }

  // Search local database as fallback
  searchLocalDatabase(query: string): RoutePoint[] {
    const database = this.getLocalKLSelangorDatabase();
    const searchQuery = query.toLowerCase().trim();
    
    return database.filter(location => 
      location.name.toLowerCase().includes(searchQuery) ||
      searchQuery.split(' ').some(word => 
        location.name.toLowerCase().includes(word) && word.length > 2
      )
    ).slice(0, 5);
  }

  // Get popular suggestions for Malaysia
  getPopularMalaysianLocations(): RoutePoint[] {
    return this.getLocalKLSelangorDatabase().slice(0, 15);
  }
}

export { GeocodingService, type GeocodeResult, type RoutePoint };
