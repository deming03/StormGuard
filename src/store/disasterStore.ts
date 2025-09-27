import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { generateDisastersNearLocation } from '@/lib/locationUtils'
import type { Disaster, DisasterInsert, DisasterUpdate, DisasterWithLocation } from '@/lib/database.types'

interface DisasterState {
  disasters: DisasterWithLocation[]
  selectedDisaster: DisasterWithLocation | null
  loading: boolean
  error: string | null
  filters: {
    types: string[]
    severities: string[]
    statuses: string[]
    dateRange: [Date | null, Date | null]
    bounds: {
      north: number
      south: number
      east: number
      west: number
    } | null
  }
}

interface DisasterActions {
  fetchDisasters: (bounds?: { north: number; south: number; east: number; west: number }) => Promise<void>
  updateDisastersForLocation: (userLocation: [number, number]) => void
  fetchDisasterById: (id: string) => Promise<void>
  createDisaster: (disaster: DisasterInsert) => Promise<void>
  updateDisaster: (id: string, updates: DisasterUpdate) => Promise<void>
  deleteDisaster: (id: string) => Promise<void>
  setSelectedDisaster: (disaster: DisasterWithLocation | null) => void
  setFilters: (filters: Partial<DisasterState['filters']>) => void
  clearFilters: () => void
  clearError: () => void
  subscribeToDisasters: () => () => void
}

type DisasterStore = DisasterState & DisasterActions

const defaultFilters: DisasterState['filters'] = {
  types: [],
  severities: [],
  statuses: ['active', 'monitoring'],
  dateRange: [null, null],
  bounds: null
}

// Generate dummy disasters around Rekascape, Cyberjaya area
const generateDummyDisasters = (): DisasterWithLocation[] => {
  const now = new Date()
  
  const disasters: DisasterWithLocation[] = [
    {
      id: 'disaster-1',
      title: 'Flash Flood near Rekascape',
      description: 'Heavy rainfall has caused flash flooding around Rekascape area, affecting nearby residential complexes and commercial buildings. Water levels reached up to 1.2 meters in parking areas.',
      disaster_type: 'flood',
      severity: 'critical',
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [101.6565, 2.9220] // Very close to Rekascape
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [101.6540, 2.9200],
          [101.6580, 2.9200],
          [101.6580, 2.9240],
          [101.6540, 2.9240],
          [101.6540, 2.9200]
        ]]
      },
      affected_radius: 800,
      estimated_affected_population: 3000,
      casualties_reported: 0,
      damage_assessment: 'Moderate infrastructure damage, roads flooded, some vehicles stranded',
      weather_conditions: {
        rainfall: '150mm in 3 hours',
        temperature: '28°C',
        humidity: '95%',
        wind_speed: '15 km/h'
      },
      ai_prediction_data: {
        risk_level: 'high',
        duration_estimate: '6-8 hours',
        spread_probability: 0.7
      },
      lstm_forecast: null,
      created_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      resolved_at: null
    },
    {
      id: 'disaster-2',
      title: 'Severe Thunderstorm - Rekascape Area',
      description: 'A severe thunderstorm is affecting the Rekascape and surrounding Cyberjaya areas, bringing strong winds up to 70 km/h and heavy rain. Some power outages reported in nearby buildings.',
      disaster_type: 'other',
      severity: 'high',
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [101.6555, 2.9205] // Near Rekascape
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [101.6500, 2.9150],
          [101.6600, 2.9150],
          [101.6600, 2.9250],
          [101.6500, 2.9250],
          [101.6500, 2.9150]
        ]]
      },
      affected_radius: 1500,
      estimated_affected_population: 5000,
      casualties_reported: 2,
      damage_assessment: 'Fallen trees, power lines down, minor structural damage',
      weather_conditions: {
        rainfall: '80mm/hour',
        temperature: '25°C',
        humidity: '90%',
        wind_speed: '80 km/h',
        lightning_activity: 'high'
      },
      ai_prediction_data: {
        risk_level: 'high',
        duration_estimate: '4-6 hours',
        spread_probability: 0.8
      },
      lstm_forecast: null,
      created_by: 'weather_station',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 mins ago
      updated_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 mins ago
      resolved_at: null
    },
    {
      id: 'disaster-3',
      title: 'Road Accident - Rekascape Junction',
      description: 'Multi-vehicle accident at the main junction near Rekascape. Emergency services on scene. Traffic is being diverted through alternative routes. No serious injuries reported.',
      disaster_type: 'other',
      severity: 'medium',
      status: 'monitoring',
      location: {
        type: 'Point',
        coordinates: [101.6558, 2.9215] // Right at Rekascape area
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [101.6550, 2.9210],
          [101.6570, 2.9210],
          [101.6570, 2.9220],
          [101.6550, 2.9220],
          [101.6550, 2.9210]
        ]]
      },
      affected_radius: 200,
      estimated_affected_population: 100,
      casualties_reported: 0,
      damage_assessment: 'Traffic disruption, emergency services response, minor vehicle damage',
      weather_conditions: {
        visibility: 'Good',
        temperature: '30°C',
        humidity: '75%',
        wind_speed: '10 km/h',
        road_conditions: 'Wet from earlier rain'
      },
      ai_prediction_data: {
        risk_level: 'medium',
        duration_estimate: '3-5 days',
        improvement_probability: 0.3
      },
      lstm_forecast: null,
      created_by: 'environmental_agency',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      resolved_at: null
    },
    {
      id: 'disaster-4',
      title: 'Landslide Risk - Cameron Highlands',
      description: 'Heavy rainfall has saturated soil conditions in Cameron Highlands, creating high risk of landslides. Several roads have been closed as precautionary measure.',
      disaster_type: 'landslide',
      severity: 'high',
      status: 'monitoring',
      location: {
        type: 'Point',
        coordinates: [101.3833, 4.4833] // Cameron Highlands
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [101.3000, 4.4000],
          [101.5000, 4.4000],
          [101.5000, 4.6000],
          [101.3000, 4.6000],
          [101.3000, 4.4000]
        ]]
      },
      affected_radius: 15000,
      estimated_affected_population: 25000,
      casualties_reported: 0,
      damage_assessment: 'Road closures, evacuation of high-risk areas recommended',
      weather_conditions: {
        rainfall: '200mm in 24 hours',
        temperature: '18°C',
        humidity: '95%',
        soil_saturation: 'critical'
      },
      ai_prediction_data: {
        risk_level: 'high',
        landslide_probability: 0.75,
        monitoring_required: true
      },
      lstm_forecast: null,
      created_by: 'geological_survey',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      resolved_at: null
    },
    {
      id: 'disaster-5',
      title: 'Building Fire - Petaling Jaya',
      description: 'Major fire at a commercial building in Petaling Jaya. Fire department and emergency services are on scene. Building evacuation completed successfully.',
      disaster_type: 'other',
      severity: 'medium',
      status: 'resolved',
      location: {
        type: 'Point',
        coordinates: [101.6060, 3.1073] // Petaling Jaya
      },
      affected_area: undefined,
      affected_radius: 500,
      estimated_affected_population: 2000,
      casualties_reported: 1,
      damage_assessment: 'Building partially damaged, smoke damage to adjacent buildings',
      weather_conditions: {
        temperature: '30°C',
        humidity: '65%',
        wind_speed: '10 km/h'
      },
      ai_prediction_data: {
        risk_level: 'medium',
        spread_probability: 0.2,
        containment_time: '2 hours'
      },
      lstm_forecast: null,
      created_by: 'fire_department',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      updated_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      resolved_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    }
  ]
  
  return disasters
}

export const useDisasterStore = create<DisasterStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    disasters: generateDummyDisasters(), // Initialize with dummy data
    selectedDisaster: null,
    loading: false,
    error: null,
    filters: defaultFilters,

    // Actions
    fetchDisasters: async (bounds) => {
      set({ loading: true, error: null })
      
      try {
        // In demo mode, use dummy disasters
        const { filters } = get()
        let allDisasters = generateDummyDisasters()
        
        // Apply status filter
        if (filters.statuses.length > 0) {
          allDisasters = allDisasters.filter(d => filters.statuses.includes(d.status))
        }
        
        // Apply type filter
        if (filters.types.length > 0) {
          allDisasters = allDisasters.filter(d => filters.types.includes(d.disaster_type))
        }
        
        // Apply severity filter
        if (filters.severities.length > 0) {
          allDisasters = allDisasters.filter(d => filters.severities.includes(d.severity))
        }
        
        // Apply date range filter
        if (filters.dateRange[0]) {
          allDisasters = allDisasters.filter(d => new Date(d.created_at) >= filters.dateRange[0]!)
        }
        if (filters.dateRange[1]) {
          allDisasters = allDisasters.filter(d => new Date(d.created_at) <= filters.dateRange[1]!)
        }
        
        // Filter by bounds if provided
        if (bounds) {
          allDisasters = allDisasters.filter(disaster => {
            const [lng, lat] = disaster.location.coordinates
            return (
              lat <= bounds.north &&
              lat >= bounds.south &&
              lng <= bounds.east &&
              lng >= bounds.west
            )
          })
        }
        
        // Sort by created date (newest first)
        allDisasters.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        set({ 
          disasters: allDisasters,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch disasters',
          loading: false 
        })
      }
    },
    
    updateDisastersForLocation: (userLocation: [number, number]) => {
      try {
        // Generate location-based disasters
        const locationBasedDisasters = generateDisastersNearLocation(userLocation, 2)
        
        set({ 
          disasters: locationBasedDisasters,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error updating disasters for location:', error)
      }
    },
    
    fetchDisasterById: async (id: string) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('disasters')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) throw error
        
        const disasterWithLocation: DisasterWithLocation = {
          ...data,
          location: JSON.parse(data.location),
          affected_area: data.affected_area ? JSON.parse(data.affected_area) : undefined
        }
        
        set({ 
          selectedDisaster: disasterWithLocation,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch disaster',
          loading: false 
        })
      }
    },

    createDisaster: async (disaster: DisasterInsert) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('disasters')
          .insert(disaster)
          .select()
          .single()
        
        if (error) throw error
        
        const disasterWithLocation: DisasterWithLocation = {
          ...data,
          location: JSON.parse(data.location),
          affected_area: data.affected_area ? JSON.parse(data.affected_area) : undefined
        }
        
        set(state => ({ 
          disasters: [disasterWithLocation, ...state.disasters],
          loading: false 
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create disaster',
          loading: false 
        })
        throw error
      }
    },

    updateDisaster: async (id: string, updates: DisasterUpdate) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('disasters')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        const disasterWithLocation: DisasterWithLocation = {
          ...data,
          location: JSON.parse(data.location),
          affected_area: data.affected_area ? JSON.parse(data.affected_area) : undefined
        }
        
        set(state => ({
          disasters: state.disasters.map(d => d.id === id ? disasterWithLocation : d),
          selectedDisaster: state.selectedDisaster?.id === id ? disasterWithLocation : state.selectedDisaster,
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update disaster',
          loading: false 
        })
        throw error
      }
    },

    deleteDisaster: async (id: string) => {
      set({ loading: true, error: null })
      
      try {
        const { error } = await supabase
          .from('disasters')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        set(state => ({
          disasters: state.disasters.filter(d => d.id !== id),
          selectedDisaster: state.selectedDisaster?.id === id ? null : state.selectedDisaster,
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete disaster',
          loading: false 
        })
        throw error
      }
    },

    setSelectedDisaster: (disaster: DisasterWithLocation | null) => {
      set({ selectedDisaster: disaster })
    },

    setFilters: (newFilters: Partial<DisasterState['filters']>) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters }
      }))
      // Refetch disasters with new filters
      get().fetchDisasters()
    },

    clearFilters: () => {
      set({ filters: defaultFilters })
      get().fetchDisasters()
    },

    clearError: () => set({ error: null }),

    subscribeToDisasters: () => {
      const subscription = supabase
        .channel('disasters-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'disasters' },
          (payload: any) => {
            const { eventType, new: newRecord, old: oldRecord } = payload
            
            set(state => {
              switch (eventType) {
                case 'INSERT':
                  if (newRecord) {
                    const newDisaster: DisasterWithLocation = {
                      ...newRecord as Disaster,
                      location: JSON.parse((newRecord as Disaster).location || ''),
                      affected_area: (newRecord as Disaster).affected_area 
                        ? JSON.parse((newRecord as Disaster).affected_area || '') 
                        : undefined
                    }
                    return {
                      ...state,
                      disasters: [newDisaster, ...state.disasters]
                    }
                  }
                  break
                case 'UPDATE':
                  if (newRecord) {
                    const updatedDisaster: DisasterWithLocation = {
                      ...newRecord as Disaster,
                      location: JSON.parse((newRecord as Disaster).location || ''),
                      affected_area: (newRecord as Disaster).affected_area 
                        ? JSON.parse((newRecord as Disaster).affected_area || '') 
                        : undefined
                    }
                    return {
                      ...state,
                      disasters: state.disasters.map(d => 
                        d.id === updatedDisaster.id ? updatedDisaster : d
                      ),
                      selectedDisaster: state.selectedDisaster?.id === updatedDisaster.id 
                        ? updatedDisaster 
                        : state.selectedDisaster
                    }
                  }
                  break
                case 'DELETE':
                  if (oldRecord) {
                    return {
                      ...state,
                      disasters: state.disasters.filter(d => d.id !== (oldRecord as Disaster).id),
                      selectedDisaster: state.selectedDisaster?.id === (oldRecord as Disaster).id 
                        ? null 
                        : state.selectedDisaster
                    }
                  }
                  break
              }
              return state
            })
          }
        )
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }))
)
