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
      
      if (!currentResponse.ok) {
        throw new Error(`Current weather API error: ${currentResponse.status} ${currentResponse.statusText}`);
      }
      
      const currentData = await currentResponse.json();

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
      }
      
      const forecastData = await forecastResponse.json();

      // Fetch weather alerts (if available)
      let alertsData = [];
      try {
        const alertsResponse = await fetch(
          `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`
        );
        
        if (alertsResponse.ok) {
          const alerts = await alertsResponse.json();
          alertsData = alerts.alerts || [];
        }
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
        windSpeed: current.wind?.speed || 0,
        windDirection: current.wind?.deg || 0,
        pressure: current.main.pressure,
        visibility: (current.visibility || 10000) / 1000, // Convert to km
        weatherMain: current.weather[0].main,
        weatherDescription: current.weather[0].description,
      },
      forecast: forecast.list.map((item: any) => ({
        datetime: item.dt_txt,
        temperature: item.main.temp,
        rainfall: item.rain?.['3h'] || 0,
        windSpeed: item.wind?.speed || 0,
        windDirection: item.wind?.deg || 0,
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

  // Test method to verify API connection
  async testApiConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test with a simple weather request for New York City
      const response = await fetch(
        `${this.baseUrl}/weather?lat=40.7128&lon=-74.0060&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        return {
          success: false,
          message: `API Error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `Successfully connected to OpenWeather API. Test location: ${data.name}, Temperature: ${data.main.temp}°C`
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export { OpenWeatherService, type WeatherData };
