import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
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

export const useDisasterStore = create<DisasterStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    disasters: [],
    selectedDisaster: null,
    loading: false,
    error: null,
    filters: defaultFilters,

    // Actions
    fetchDisasters: async (bounds) => {
      set({ loading: true, error: null })
      
      try {
        const { filters } = get()
        let query = supabase
          .from('disasters')
          .select('*')
          .order('created_at', { ascending: false })
        
        // Apply status filter
        if (filters.statuses.length > 0) {
          query = query.in('status', filters.statuses)
        }
        
        // Apply type filter
        if (filters.types.length > 0) {
          query = query.in('disaster_type', filters.types)
        }
        
        // Apply severity filter
        if (filters.severities.length > 0) {
          query = query.in('severity', filters.severities)
        }
        
        // Apply date range filter
        if (filters.dateRange[0]) {
          query = query.gte('created_at', filters.dateRange[0].toISOString())
        }
        if (filters.dateRange[1]) {
          query = query.lte('created_at', filters.dateRange[1].toISOString())
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Parse location data
        const disastersWithLocation: DisasterWithLocation[] = data.map((disaster: any) => ({
          ...disaster,
          location: JSON.parse(disaster.location),
          affected_area: disaster.affected_area ? JSON.parse(disaster.affected_area) : undefined
        }))
        
        // Filter by bounds if provided
        let filteredDisasters = disastersWithLocation
        if (bounds) {
          filteredDisasters = disastersWithLocation.filter(disaster => {
            const [lng, lat] = disaster.location.coordinates
            return (
              lat <= bounds.north &&
              lat >= bounds.south &&
              lng <= bounds.east &&
              lng >= bounds.west
            )
          })
        }
        
        set({ 
          disasters: filteredDisasters,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch disasters',
          loading: false 
        })
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
