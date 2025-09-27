import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { locationUtils } from '@/lib/utils'
import { generateMedicalResourcesNearLocation, calculateDistance } from '@/lib/locationUtils'
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
  updateResourcesForLocation: (userLocation: [number, number]) => void
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

// Dummy medical resources around Rekascape, Cyberjaya
const generateDummyResources = (): MedicalResourceWithLocation[] => {
  const rekascapeCenter: [number, number] = [101.6559, 2.9213] // Rekascape, Cyberjaya coordinates
  
  const dummyResources = [
    {
      id: 'dummy-1',
      name: 'Rekascape Medical Clinic',
      resource_type: 'clinic' as ResourceType,
      description: 'Modern medical clinic located within Rekascape complex, providing general healthcare and emergency first aid services',
      contact_phone: '+603-8322-7000',
      contact_email: 'info@rekascapemedical.com.my',
      website: 'https://rekascapemedical.com.my',
      capacity: 50,
      current_availability: 35,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6560, 2.9215] // Right in Rekascape
      },
      address: 'Rekascape, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Emergency Care', 'Surgery', 'Cardiology', 'Pediatrics', 'Radiology'],
      equipment_available: ['MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'ECG'],
      emergency_contact: '+603-8322-7999',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-2',
      name: 'Cyberjaya Emergency Response Unit',
      resource_type: 'emergency_services' as ResourceType,
      description: 'Rapid response emergency medical services covering Rekascape and surrounding Cyberjaya areas',
      contact_phone: '+603-8911-0000',
      contact_email: 'emergency@cyberjaya.gov.my',
      capacity: 15,
      current_availability: 12,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6570, 2.9225] // Very close to Rekascape
      },
      address: 'Near Rekascape, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Emergency Response', 'Ambulance Services', 'First Aid', 'Medical Transport'],
      equipment_available: ['Ambulance', 'Defibrillator', 'First Aid Kits', 'Oxygen Tanks'],
      emergency_contact: '+603-8911-0000',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-3',
      name: 'Rekascape Pharmacy Plus',
      resource_type: 'pharmacy' as ResourceType,
      description: '24-hour pharmacy in Rekascape with prescription medicines, emergency supplies, and basic medical consultation',
      contact_phone: '+603-8318-2000',
      contact_email: 'rekascape@pharmacy.com.my',
      website: 'https://rekascapepharmacy.com.my',
      capacity: null,
      current_availability: null,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6562, 2.9218] // Right in Rekascape
      },
      address: 'Rekascape, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Prescription Dispensing', 'Health Screening', 'Vaccination', 'Medical Consultation'],
      equipment_available: ['Blood Pressure Monitor', 'Glucose Meter', 'Thermometer'],
      emergency_contact: '+603-8318-2000',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-4',
      name: 'Cyberjaya University College Medical Centre',
      resource_type: 'clinic' as ResourceType,
      description: 'University medical center providing primary healthcare and specialist consultations',
      contact_phone: '+603-8312-5000',
      contact_email: 'medical@cybermed.edu.my',
      website: 'https://cybermed.edu.my',
      capacity: 50,
      current_availability: 35,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6350, 2.9250] // ~1.2km from center
      },
      address: 'Persiaran Bestari, Cyber 11, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 6:00 PM',
        saturday: '8:00 AM - 2:00 PM',
        sunday: 'Closed'
      },
      services_offered: ['General Practice', 'Dental Care', 'Eye Care', 'Health Screening'],
      equipment_available: ['X-Ray', 'Ultrasound', 'ECG', 'Dental Equipment'],
      emergency_contact: '+603-8312-5999',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-5',
      name: 'Cyberjaya Emergency Response Team',
      resource_type: 'ambulance' as ResourceType,
      description: 'Professional ambulance service covering Cyberjaya and surrounding areas',
      contact_phone: '+603-8000-9999',
      contact_email: 'emergency@cyberjaya-ert.com',
      website: null,
      capacity: 5,
      current_availability: 4,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6400, 2.9150] // ~0.8km from center
      },
      address: 'Jalan Impact, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Emergency Transport', 'Basic Life Support', 'Advanced Life Support', 'Medical Escort'],
      equipment_available: ['Defibrillator', 'Oxygen Supply', 'Stretcher', 'First Aid Kit'],
      emergency_contact: '+603-8000-9999',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-6',
      name: 'National Blood Centre - Cyberjaya Branch',
      resource_type: 'blood_bank' as ResourceType,
      description: 'Blood donation center and blood bank serving the Klang Valley region',
      contact_phone: '+603-8312-6000',
      contact_email: 'cyberjaya@pdn.gov.my',
      website: 'https://pdn.gov.my',
      capacity: 100,
      current_availability: 85,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6500, 2.9280] // ~1.5km from center
      },
      address: 'Persiaran Teknologi, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '8:30 AM - 4:30 PM',
        tuesday: '8:30 AM - 4:30 PM',
        wednesday: '8:30 AM - 4:30 PM',
        thursday: '8:30 AM - 4:30 PM',
        friday: '8:30 AM - 4:30 PM',
        saturday: '8:30 AM - 12:30 PM',
        sunday: 'Closed'
      },
      services_offered: ['Blood Donation', 'Blood Testing', 'Blood Supply', 'Platelet Donation'],
      equipment_available: ['Blood Storage', 'Centrifuge', 'Blood Testing Equipment'],
      emergency_contact: '+603-8312-6999',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-7',
      name: 'Alpro Pharmacy Shaftsbury',
      resource_type: 'pharmacy' as ResourceType,
      description: 'Community pharmacy with wide range of medications and health products',
      contact_phone: '+603-8318-3000',
      contact_email: 'shaftsbury@alpro.com.my',
      website: 'https://alpro.com.my',
      capacity: null,
      current_availability: null,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6480, 2.9190] // ~0.4km from center
      },
      address: 'Shaftsbury Square, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '9:00 AM - 10:00 PM',
        tuesday: '9:00 AM - 10:00 PM',
        wednesday: '9:00 AM - 10:00 PM',
        thursday: '9:00 AM - 10:00 PM',
        friday: '9:00 AM - 10:00 PM',
        saturday: '9:00 AM - 10:00 PM',
        sunday: '9:00 AM - 10:00 PM'
      },
      services_offered: ['Prescription Dispensing', 'Health Products', 'Baby Care', 'Supplements'],
      equipment_available: ['Blood Pressure Monitor', 'Weight Scale', 'First Aid Supplies'],
      emergency_contact: '+603-8318-3000',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dummy-8',
      name: 'Klinik Kesihatan Cyberjaya',
      resource_type: 'clinic' as ResourceType,
      description: 'Government health clinic providing primary healthcare services to the community',
      contact_phone: '+603-8312-7000',
      contact_email: 'kkc@moh.gov.my',
      website: null,
      capacity: 80,
      current_availability: 60,
      status: 'available' as ResourceStatus,
      location: {
        type: 'Point' as const,
        coordinates: [101.6320, 2.9180] // ~1.1km from center
      },
      address: 'Persiaran Cyberpoint Selatan, Cyberjaya, 63000 Cyberjaya, Selangor',
      operating_hours: {
        monday: '8:00 AM - 5:00 PM',
        tuesday: '8:00 AM - 5:00 PM',
        wednesday: '8:00 AM - 5:00 PM',
        thursday: '8:00 AM - 5:00 PM',
        friday: '8:00 AM - 5:00 PM',
        saturday: '8:00 AM - 1:00 PM',
        sunday: 'Closed'
      },
      services_offered: ['General Practice', 'Vaccination', 'Maternal Health', 'Child Health'],
      equipment_available: ['Basic Medical Equipment', 'Vaccination Supplies', 'Health Screening Tools'],
      emergency_contact: '+603-8312-7999',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
  
  return dummyResources
}

export const useMedicalResourceStore = create<MedicalResourceStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    resources: generateDummyResources(), // Initialize with dummy data
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
        // In demo mode, we already have dummy resources loaded
        // Just apply filters to the existing resources
        const { resources, filters } = get()
        let filteredResources = resources
        
        // Apply type filter
        if (filters.types.length > 0) {
          filteredResources = filteredResources.filter(r => filters.types.includes(r.resource_type))
        }
        
        // Apply verified filter
        if (filters.verified !== null) {
          filteredResources = filteredResources.filter(r => r.is_verified === filters.verified)
        }
        
        // Apply availability filter
        if (filters.available) {
          filteredResources = filteredResources.filter(r => r.status === 'available')
        }
        
        // Sort by created date (newest first)
        filteredResources.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        set({ 
          resources: filteredResources.length > 0 ? filteredResources : generateDummyResources(),
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
        const { resources, filters } = get()
        
        // Use dummy data if we're in demo mode (no real database connection)
        let filteredResources = resources
        
        // Apply type filter
        if (filters.types.length > 0) {
          filteredResources = filteredResources.filter(r => filters.types.includes(r.resource_type))
        }
        
        // Apply verified filter
        if (filters.verified !== null) {
          filteredResources = filteredResources.filter(r => r.is_verified === filters.verified)
        }
        
        // Apply availability filter
        if (filters.available) {
          filteredResources = filteredResources.filter(r => r.status === 'available')
        }
        
        // Filter by distance and sort by proximity
        const resourcesWithDistance = filteredResources
          .map((resource: any) => ({
            ...resource,
            distance: calculateDistance(location, resource.location.coordinates)
          }))
          .filter((resource: any) => resource.distance <= radius / 1000) // Convert radius to km
          .sort((a: any, b: any) => a.distance - b.distance)
          .map(({ distance, ...resource }) => resource) // Remove distance property
        
        set({ 
          nearbyResources: resourcesWithDistance,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch nearby resources',
          loading: false 
        })
      }
    },

    updateResourcesForLocation: (userLocation: [number, number]) => {
      try {
        // Generate location-based medical resources with 5km radius
        const locationBasedResources = generateMedicalResourcesNearLocation(userLocation, 5)
        
        set({ 
          resources: locationBasedResources,
          nearbyResources: locationBasedResources,
          searchLocation: userLocation,
          searchRadius: 5000, // 5km in meters
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error updating medical resources for location:', error)
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

// Auto-populate nearby resources for Rekascape location on store initialization
const rekascapeLocation: [number, number] = [101.6559, 2.9213] // Rekascape, Cyberjaya
useMedicalResourceStore.getState().fetchNearbyResources(rekascapeLocation, 2000)
