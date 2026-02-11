export interface WeatherData {
  temperature: number
  windSpeed: number
  windDirection: number
  pressure: number
  humidity: number
  visibility: number
  condition: string
  location: string
}

export const WeatherService = {
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      // @ts-ignore
      const data = await window.api.weather.get(lat, lon)
      const current = data.current

      return {
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        pressure: current.surface_pressure,
        humidity: current.relative_humidity_2m,
        visibility: current.visibility || 10000,
        condition: this.getWeatherCondition(current.weather_code),
        location: 'Athens Intl. (LGAV)' 
      }
    } catch (error) {
      console.error('Failed to fetch weather', error)
      // Fallback (so app doesn't crash)
      return {
        temperature: 20,
        windSpeed: 5,
        windDirection: 180,
        pressure: 1013,
        humidity: 50,
        visibility: 10000,
        condition: 'Unknown',
        location: 'Athens Intl. (Offline)'
      }
    }
  },

  async getMetar(icao: string): Promise<string> {
    try {
      // @ts-ignore
      return await window.api.weather.getMetar(icao)
    } catch (error: any) {
      console.error('Failed to fetch METAR', error)
      return `Error: ${error.message || String(error)}`
    }
  },

  getWeatherCondition(code: number): string {
    if (code === 0) return 'Clear Sky'
    if (code >= 1 && code <= 3) return 'Partly Cloudy'
    if (code >= 45 && code <= 48) return 'Fog'
    if (code >= 51 && code <= 67) return 'Rain'
    if (code >= 71 && code <= 77) return 'Snow'
    if (code >= 95) return 'Thunderstorm'
    return 'Cloudy'
  }
}
