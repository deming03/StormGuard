import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isAfter, parseISO } from "date-fns"
import type { DisasterSeverity, DisasterType, ResourceType } from "./database.types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const dateUtils = {
  formatRelative: (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
  },
  
  formatShort: (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'MMM dd, yyyy')
  },
  
  formatLong: (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'MMMM dd, yyyy HH:mm')
  },
  
  formatTime: (date: string | Date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'HH:mm')
  },
  
  isRecent: (date: string | Date, hoursAgo: number = 24) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const threshold = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    return isAfter(dateObj, threshold)
  }
}

// Disaster severity utilities
export const severityUtils = {
  getColor: (severity: DisasterSeverity): string => {
    switch (severity) {
      case 'low':
        return 'text-safe-600 bg-safe-50 border-safe-200'
      case 'medium':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'high':
        return 'text-emergency-600 bg-emergency-50 border-emergency-200'
      case 'critical':
        return 'text-emergency-700 bg-emergency-100 border-emergency-300'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  },
  
  getMapColor: (severity: DisasterSeverity): string => {
    switch (severity) {
      case 'low':
        return '#22c55e'
      case 'medium':
        return '#eab308'
      case 'high':
        return '#ef4444'
      case 'critical':
        return '#dc2626'
      default:
        return '#6b7280'
    }
  },
  
  getIcon: (severity: DisasterSeverity): string => {
    switch (severity) {
      case 'low':
        return '🟢'
      case 'medium':
        return '🟡'
      case 'high':
        return '🟠'
      case 'critical':
        return '🔴'
      default:
        return '⚪'
    }
  },
  
  getPriority: (severity: DisasterSeverity): number => {
    switch (severity) {
      case 'low':
        return 1
      case 'medium':
        return 2
      case 'high':
        return 3
      case 'critical':
        return 4
      default:
        return 0
    }
  }
}

// Disaster type utilities
export const disasterUtils = {
  getIcon: (type: DisasterType): string => {
    switch (type) {
      case 'earthquake':
        return '🌍'
      case 'flood':
        return '🌊'
      case 'hurricane':
        return '🌀'
      case 'wildfire':
        return '🔥'
      case 'tornado':
        return '🌪️'
      case 'tsunami':
        return '🌊'
      case 'volcano':
        return '🌋'
      case 'drought':
        return '🏜️'
      case 'landslide':
        return '⛰️'
      case 'blizzard':
        return '❄️'
      default:
        return '⚠️'
    }
  },
  
  getDisplayName: (type: DisasterType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  },
  
  getColor: (type: DisasterType): string => {
    switch (type) {
      case 'earthquake':
        return 'bg-amber-100 text-amber-800'
      case 'flood':
        return 'bg-blue-100 text-blue-800'
      case 'hurricane':
        return 'bg-gray-100 text-gray-800'
      case 'wildfire':
        return 'bg-red-100 text-red-800'
      case 'tornado':
        return 'bg-purple-100 text-purple-800'
      case 'tsunami':
        return 'bg-indigo-100 text-indigo-800'
      case 'volcano':
        return 'bg-orange-100 text-orange-800'
      case 'drought':
        return 'bg-yellow-100 text-yellow-800'
      case 'landslide':
        return 'bg-stone-100 text-stone-800'
      case 'blizzard':
        return 'bg-cyan-100 text-cyan-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}

// Resource type utilities
export const resourceUtils = {
  getIcon: (type: ResourceType): string => {
    switch (type) {
      case 'hospital':
        return '🏥'
      case 'clinic':
        return '🩺'
      case 'pharmacy':
        return '💊'
      case 'ambulance':
        return '🚑'
      case 'blood_bank':
        return '🩸'
      case 'medical_supplies':
        return '🧰'
      case 'emergency_shelter':
        return '🏠'
      default:
        return '⚕️'
    }
  },
  
  getDisplayName: (type: ResourceType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  },
  
  getColor: (type: ResourceType): string => {
    switch (type) {
      case 'hospital':
        return 'bg-red-100 text-red-800'
      case 'clinic':
        return 'bg-blue-100 text-blue-800'
      case 'pharmacy':
        return 'bg-green-100 text-green-800'
      case 'ambulance':
        return 'bg-yellow-100 text-yellow-800'
      case 'blood_bank':
        return 'bg-pink-100 text-pink-800'
      case 'medical_supplies':
        return 'bg-purple-100 text-purple-800'
      case 'emergency_shelter':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
}

// Location utilities
export const locationUtils = {
  // Get user's current location
  getCurrentPosition: (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude])
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      )
    })
  },
  
  // Convert address to coordinates (requires geocoding service)
  geocodeAddress: async (_address: string): Promise<[number, number]> => {
    // This would require a geocoding service like Mapbox Geocoding API
    // For now, return a placeholder
    throw new Error('Geocoding service not implemented')
  },
  
  // Format coordinates for display
  formatCoordinates: (coordinates: [number, number]): string => {
    const [lng, lat] = coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  },
  
  // Calculate distance between two points
  calculateDistance: (point1: [number, number], point2: [number, number]): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = toRad(point2[1] - point1[1])
    const dLon = toRad(point2[0] - point1[0])
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(point1[1])) * Math.cos(toRad(point2[1])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },
  
  // Format distance for display
  formatDistance: (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    } else {
      return `${(distance / 1000).toFixed(1)}km`
    }
  },
  
  // Check if point is within radius of another point
  isWithinRadius: (
    center: [number, number], 
    point: [number, number], 
    radius: number
  ): boolean => {
    return locationUtils.calculateDistance(center, point) <= radius
  }
}

function toRad(value: number): number {
  return value * Math.PI / 180
}

// Form validation utilities
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  },
  
  coordinates: (coordinates: [number, number]): boolean => {
    const [lng, lat] = coordinates
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
  },
  
  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

// Text processing utilities
export const textUtils = {
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  },
  
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1)
  },
  
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  },
  
  extractHashtags: (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g
    return text.match(hashtagRegex) || []
  },
  
  extractMentions: (text: string): string[] => {
    const mentionRegex = /@[\w]+/g
    return text.match(mentionRegex) || []
  }
}

// Environment utilities
export const env = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  get: (key: string, defaultValue?: string): string => {
    return import.meta.env[key] || defaultValue || ''
  },
  
  require: (key: string): string => {
    const value = import.meta.env[key]
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return value
  }
}

// Error handling utilities
export const errorUtils = {
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'An unknown error occurred'
  },
  
  isNetworkError: (error: unknown): boolean => {
    return error instanceof Error && (
      error.message.includes('Network') ||
      error.message.includes('fetch') ||
      error.message.includes('connection')
    )
  },
  
  isAuthError: (error: unknown): boolean => {
    return error instanceof Error && (
      error.message.includes('auth') ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden')
    )
  }
}

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}
