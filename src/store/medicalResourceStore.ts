import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { locationUtils } from '@/lib/utils'
import type { 
  MedicalResource, 
  MedicalResourceInsert, 
  MedicalResourceUpdate, 
  MedicalResourceWithLocation,
  ResourceType 
} from '@/lib/database.types'

interface MedicalResourceState {
  resources: MedicalResourceWithLocation[]
  nearbyResources: MedicalResourceWithLocation[]
  selectedResource: MedicalResourceWithLocation | null
  loading: boolean
  error: string | null
  searchLocation: [number, number] | null
  searchRadius: number // in meters
  filters: {
    types: ResourceType[]
    verified: boolean | null
    available: boolean
  }
}

interface MedicalResourceActions {
  fetchResources: () => Promise<void>
  fetchNearbyResources: (location: [number, number], radius?: number) => Promise<void>
  fetchResourceById: (id: string) => Promise<void>
  createResource: (resource: MedicalResourceInsert) => Promise<void>
  updateResource: (id: string, updates: MedicalResourceUpdate) => Promise<void>
  deleteResource: (id: string) => Promise<void>
  setSelectedResource: (resource: MedicalResourceWithLocation | null) => void
  setSearchLocation: (location: [number, number] | null) => void
  setSearchRadius: (radius: number) => void
  setFilters: (filters: Partial<MedicalResourceState['filters']>) => void
  clearFilters: () => void
  clearError: () => void
  subscribeToResources: () => () => void
}

type MedicalResourceStore = MedicalResourceState & MedicalResourceActions

const defaultFilters: MedicalResourceState['filters'] = {
  types: [],
  verified: null,
  available: true
}

export const useMedicalResourceStore = create<MedicalResourceStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    resources: [],
    nearbyResources: [],
    selectedResource: null,
    loading: false,
    error: null,
    searchLocation: null,
    searchRadius: 5000, // 5km default
    filters: defaultFilters,

    // Actions
    fetchResources: async () => {
      set({ loading: true, error: null })
      
      try {
        const { filters } = get()
        let query = supabase
          .from('medical_resources')
          .select('*')
          .order('created_at', { ascending: false })
        
        // Apply type filter
        if (filters.types.length > 0) {
          query = query.in('resource_type', filters.types)
        }
        
        // Apply verified filter
        if (filters.verified !== null) {
          query = query.eq('is_verified', filters.verified)
        }
        
        // Apply availability filter
        if (filters.available) {
          query = query.eq('status', 'available')
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Parse location data
        const resourcesWithLocation: MedicalResourceWithLocation[] = data.map((resource: any) => ({
          ...resource,
          location: JSON.parse(resource.location)
        }))
        
        set({ 
          resources: resourcesWithLocation,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch resources',
          loading: false 
        })
      }
    },

    fetchNearbyResources: async (location: [number, number], radius = 5000) => {
      set({ loading: true, error: null, searchLocation: location, searchRadius: radius })
      
      try {
        const { filters } = get()
        
        // First get all resources with basic filters
        let query = supabase
          .from('medical_resources')
          .select('*')
        
        // Apply type filter
        if (filters.types.length > 0) {
          query = query.in('resource_type', filters.types)
        }
        
        // Apply verified filter
        if (filters.verified !== null) {
          query = query.eq('is_verified', filters.verified)
        }
        
        // Apply availability filter
        if (filters.available) {
          query = query.eq('status', 'available')
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Parse location data and filter by distance
        const resourcesWithLocation: MedicalResourceWithLocation[] = data
          .map((resource: any) => ({
            ...resource,
            location: JSON.parse(resource.location)
          }))
          .filter((resource: any) => {
            const distance = locationUtils.calculateDistance(
              location, 
              resource.location.coordinates
            )
            return distance <= radius
          })
          .sort((a: any, b: any) => {
            const distanceA = locationUtils.calculateDistance(location, a.location.coordinates)
            const distanceB = locationUtils.calculateDistance(location, b.location.coordinates)
            return distanceA - distanceB
          })
        
        set({ 
          nearbyResources: resourcesWithLocation,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch nearby resources',
          loading: false 
        })
      }
    },

    fetchResourceById: async (id: string) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('medical_resources')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) throw error
        
        const resourceWithLocation: MedicalResourceWithLocation = {
          ...data,
          location: JSON.parse(data.location)
        }
        
        set({ 
          selectedResource: resourceWithLocation,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch resource',
          loading: false 
        })
      }
    },

    createResource: async (resource: MedicalResourceInsert) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('medical_resources')
          .insert(resource)
          .select()
          .single()
        
        if (error) throw error
        
        const resourceWithLocation: MedicalResourceWithLocation = {
          ...data,
          location: JSON.parse(data.location)
        }
        
        set(state => ({ 
          resources: [resourceWithLocation, ...state.resources],
          loading: false 
        }))

        // Update nearby resources if search location is set
        const { searchLocation, searchRadius } = get()
        if (searchLocation) {
          get().fetchNearbyResources(searchLocation, searchRadius)
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create resource',
          loading: false 
        })
        throw error
      }
    },

    updateResource: async (id: string, updates: MedicalResourceUpdate) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('medical_resources')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        const resourceWithLocation: MedicalResourceWithLocation = {
          ...data,
          location: JSON.parse(data.location)
        }
        
        set(state => ({
          resources: state.resources.map(r => r.id === id ? resourceWithLocation : r),
          nearbyResources: state.nearbyResources.map(r => r.id === id ? resourceWithLocation : r),
          selectedResource: state.selectedResource?.id === id ? resourceWithLocation : state.selectedResource,
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update resource',
          loading: false 
        })
        throw error
      }
    },

    deleteResource: async (id: string) => {
      set({ loading: true, error: null })
      
      try {
        const { error } = await supabase
          .from('medical_resources')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        set(state => ({
          resources: state.resources.filter(r => r.id !== id),
          nearbyResources: state.nearbyResources.filter(r => r.id !== id),
          selectedResource: state.selectedResource?.id === id ? null : state.selectedResource,
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete resource',
          loading: false 
        })
        throw error
      }
    },

    setSelectedResource: (resource: MedicalResourceWithLocation | null) => {
      set({ selectedResource: resource })
    },

    setSearchLocation: (location: [number, number] | null) => {
      set({ searchLocation: location })
      if (location) {
        get().fetchNearbyResources(location)
      }
    },

    setSearchRadius: (radius: number) => {
      set({ searchRadius: radius })
      const { searchLocation } = get()
      if (searchLocation) {
        get().fetchNearbyResources(searchLocation, radius)
      }
    },

    setFilters: (newFilters: Partial<MedicalResourceState['filters']>) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters }
      }))
      
      // Refetch resources with new filters
      get().fetchResources()
      
      // Also refetch nearby resources if search location is set
      const { searchLocation, searchRadius } = get()
      if (searchLocation) {
        get().fetchNearbyResources(searchLocation, searchRadius)
      }
    },

    clearFilters: () => {
      set({ filters: defaultFilters })
      get().fetchResources()
      
      const { searchLocation, searchRadius } = get()
      if (searchLocation) {
        get().fetchNearbyResources(searchLocation, searchRadius)
      }
    },

    clearError: () => set({ error: null }),

    subscribeToResources: () => {
      const subscription = supabase
        .channel('medical-resources-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'medical_resources' },
          (payload: any) => {
            const { eventType, new: newRecord, old: oldRecord } = payload
            
            set(state => {
              switch (eventType) {
                case 'INSERT':
                  if (newRecord) {
                    const newResource: MedicalResourceWithLocation = {
                      ...newRecord as MedicalResource,
                      location: JSON.parse((newRecord as MedicalResource).location)
                    }
                    
                    const updatedResources = [newResource, ...state.resources]
                    
                    // Update nearby resources if within search radius
                    let updatedNearbyResources = state.nearbyResources
                    if (state.searchLocation) {
                      const distance = locationUtils.calculateDistance(
                        state.searchLocation,
                        newResource.location.coordinates
                      )
                      if (distance <= state.searchRadius) {
                        updatedNearbyResources = [newResource, ...state.nearbyResources]
                          .sort((a, b) => {
                            const distA = locationUtils.calculateDistance(state.searchLocation!, a.location.coordinates)
                            const distB = locationUtils.calculateDistance(state.searchLocation!, b.location.coordinates)
                            return distA - distB
                          })
                      }
                    }
                    
                    return {
                      ...state,
                      resources: updatedResources,
                      nearbyResources: updatedNearbyResources
                    }
                  }
                  break
                case 'UPDATE':
                  if (newRecord) {
                    const updatedResource: MedicalResourceWithLocation = {
                      ...newRecord as MedicalResource,
                      location: JSON.parse((newRecord as MedicalResource).location)
                    }
                    return {
                      ...state,
                      resources: state.resources.map(r => 
                        r.id === updatedResource.id ? updatedResource : r
                      ),
                      nearbyResources: state.nearbyResources.map(r => 
                        r.id === updatedResource.id ? updatedResource : r
                      ),
                      selectedResource: state.selectedResource?.id === updatedResource.id 
                        ? updatedResource 
                        : state.selectedResource
                    }
                  }
                  break
                case 'DELETE':
                  if (oldRecord) {
                    const deletedId = (oldRecord as MedicalResource).id
                    return {
                      ...state,
                      resources: state.resources.filter(r => r.id !== deletedId),
                      nearbyResources: state.nearbyResources.filter(r => r.id !== deletedId),
                      selectedResource: state.selectedResource?.id === deletedId 
                        ? null 
                        : state.selectedResource
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
