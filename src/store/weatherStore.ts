import { create } from 'zustand';
import { OpenWeatherService, WeatherData } from '../lib/openWeatherService';

interface WeatherStore {
  weatherData: Map<string, WeatherData>;
  isLoading: boolean;
  error: string | null;
  
  fetchWeatherForLocation: (lat: number, lon: number, name: string) => Promise<void>;
  getWeatherByLocation: (locationKey: string) => WeatherData | null;
  clearError: () => void;
  testApiConnection: () => Promise<{ success: boolean; message: string }>;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  weatherData: new Map(),
  isLoading: false,
  error: null,

  fetchWeatherForLocation: async (lat: number, lon: number, name: string) => {
    const locationKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    set({ isLoading: true, error: null });

    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenWeather API key not configured');
      }

      const openWeatherService = new OpenWeatherService(apiKey);
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

  testApiConnection: async () => {
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      
      if (!apiKey) {
        return {
          success: false,
          message: 'OpenWeather API key not configured'
        };
      }

      const openWeatherService = new OpenWeatherService(apiKey);
      return await openWeatherService.testApiConnection();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },
}));
