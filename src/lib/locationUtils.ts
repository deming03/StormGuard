import type { DisasterWithLocation, MedicalResourceWithLocation } from './database.types'

// Generate random offset within a radius (in degrees)
const randomOffset = (radiusKm: number): [number, number] => {
  const radiusDegrees = radiusKm / 111.32 // Approximate conversion: 1 degree ≈ 111.32 km
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radiusDegrees
  
  return [
    distance * Math.cos(angle), // longitude offset
    distance * Math.sin(angle)  // latitude offset
  ]
}

// Generate disasters around user's location
export const generateDisastersNearLocation = (
  userLocation: [number, number], 
  radiusKm: number = 2
): DisasterWithLocation[] => {
  const now = new Date()
  const [userLng, userLat] = userLocation
  
  const disasters: DisasterWithLocation[] = [
    {
      id: 'disaster-realtime-1',
      title: 'Flash Flood - Your Area',
      description: 'Heavy rainfall has caused flash flooding in your immediate area. Water levels are rising rapidly. Emergency services have been notified.',
      disaster_type: 'flood',
      severity: 'critical',
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(0.3)[0], 
          userLat + randomOffset(0.3)[1]
        ] // Within 300m
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [userLng - 0.005, userLat - 0.005],
          [userLng + 0.005, userLat - 0.005],
          [userLng + 0.005, userLat + 0.005],
          [userLng - 0.005, userLat + 0.005],
          [userLng - 0.005, userLat - 0.005]
        ]]
      },
      affected_radius: 500,
      estimated_affected_population: 1200,
      casualties_reported: 0,
      damage_assessment: 'Roads flooded, vehicles stranded, power outages reported',
      weather_conditions: {
        rainfall: '120mm in 2 hours',
        temperature: '28°C',
        humidity: '95%',
        wind_speed: '15 km/h'
      },
      ai_prediction_data: {
        risk_level: 'high',
        duration_estimate: '4-6 hours',
        improvement_probability: 0.6
      },
      lstm_forecast: null,
      created_by: null,
      verified_by: null,
      response_teams_assigned: ['Emergency Response Team A', 'Local Fire Department'],
      evacuation_status: 'partial',
      is_verified: true,
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      resolved_at: null
    },
    {
      id: 'disaster-realtime-2',
      title: 'Power Outage - Nearby',
      description: 'Widespread power outage affecting your neighborhood due to transformer failure. Estimated repair time: 2-3 hours.',
      disaster_type: 'other',
      severity: 'medium',
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(0.8)[0], 
          userLat + randomOffset(0.8)[1]
        ] // Within 800m
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [userLng - 0.01, userLat - 0.01],
          [userLng + 0.01, userLat - 0.01],
          [userLng + 0.01, userLat + 0.01],
          [userLng - 0.01, userLat + 0.01],
          [userLng - 0.01, userLat - 0.01]
        ]]
      },
      affected_radius: 1000,
      estimated_affected_population: 3000,
      casualties_reported: 0,
      damage_assessment: 'No power, traffic lights down, businesses affected',
      weather_conditions: {
        temperature: '30°C',
        humidity: '70%',
        wind_speed: '5 km/h'
      },
      ai_prediction_data: {
        risk_level: 'medium',
        duration_estimate: '2-3 hours',
        improvement_probability: 0.8
      },
      lstm_forecast: null,
      created_by: null,
      verified_by: null,
      response_teams_assigned: ['Utility Repair Team'],
      evacuation_status: 'none',
      is_verified: true,
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 mins ago
      updated_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 mins ago
      resolved_at: null
    },
    {
      id: 'disaster-realtime-3',
      title: 'Road Accident - Main Street',
      description: 'Multi-vehicle accident on main road near your location. Traffic is being diverted. Emergency services on scene.',
      disaster_type: 'other',
      severity: 'medium',
      status: 'monitoring',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(0.5)[0], 
          userLat + randomOffset(0.5)[1]
        ] // Within 500m
      },
      affected_area: {
        type: 'Polygon',
        coordinates: [[
          [userLng - 0.002, userLat - 0.002],
          [userLng + 0.002, userLat - 0.002],
          [userLng + 0.002, userLat + 0.002],
          [userLng - 0.002, userLat + 0.002],
          [userLng - 0.002, userLat - 0.002]
        ]]
      },
      affected_radius: 200,
      estimated_affected_population: 50,
      casualties_reported: 1,
      damage_assessment: 'Traffic disruption, emergency services response, minor injuries',
      weather_conditions: {
        visibility: 'Good',
        temperature: '29°C',
        humidity: '75%',
        wind_speed: '8 km/h',
        road_conditions: 'Dry'
      },
      ai_prediction_data: {
        risk_level: 'low',
        duration_estimate: '1 hour',
        improvement_probability: 0.9
      },
      lstm_forecast: null,
      created_by: null,
      verified_by: null,
      response_teams_assigned: ['Police Traffic Unit', 'Ambulance'],
      evacuation_status: 'none',
      is_verified: true,
      created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), // 20 mins ago
      updated_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      resolved_at: null
    }
  ]
  
  return disasters
}

// Generate medical resources around user's location
export const generateMedicalResourcesNearLocation = (
  userLocation: [number, number], 
  radiusKm: number = 2
): MedicalResourceWithLocation[] => {
  const [userLng, userLat] = userLocation
  
  const resources: MedicalResourceWithLocation[] = [
    {
      id: 'medical-realtime-1',
      name: 'Emergency Medical Clinic - Nearby',
      resource_type: 'medical',
      description: 'Walk-in clinic providing emergency medical care, located close to your current position',
      status: 'available',
      capacity: 30,
      current_usage: 10,
      contact_info: {
        phone: '+603-8000-1111',
        email: 'emergency@nearbymedical.com.my',
        website: 'https://nearbymedical.com.my'
      },
      specialties: ['emergency', 'general'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.2)[0], 
          userLat + randomOffset(radiusKm * 0.2)[1]
        ] // Within 20% of radius
      },
      address: `Near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
    },
    {
      id: 'medical-realtime-2',
      name: 'Local Pharmacy Plus',
      resource_type: 'medical',
      description: '24/7 pharmacy with emergency medications and basic medical supplies, very close to you',
      status: 'available',
      capacity: null,
      current_usage: 0,
      contact_info: {
        phone: '+603-8000-2222',
        email: 'info@localpharmacy.com.my'
      },
      specialties: ['pharmacy', 'emergency_medications'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.1)[0], 
          userLat + randomOffset(radiusKm * 0.1)[1]
        ] // Within 10% of radius
      }
    },
    {
      id: 'medical-realtime-3',
      name: 'Mobile Emergency Unit',
      resource_type: 'rescue',
      description: 'Mobile emergency response unit currently stationed near your area',
      status: 'available',
      capacity: 5,
      current_usage: 1,
      contact_info: {
        phone: '+603-8000-3333',
        email: 'mobile@emergency.gov.my'
      },
      specialties: ['emergency_response', 'ambulance'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.3)[0], 
          userLat + randomOffset(radiusKm * 0.3)[1]
        ] // Within 30% of radius
      }
    },
    {
      id: 'medical-realtime-4',
      name: 'General Hospital - Main Campus',
      resource_type: 'medical',
      description: 'Full-service hospital with emergency department, ICU, and specialized medical services',
      status: 'available',
      capacity: 200,
      current_usage: 50,
      contact_info: {
        phone: '+603-8000-4444',
        email: 'info@generalhospital.com.my',
        website: 'https://generalhospital.com.my'
      },
      specialties: ['emergency', 'surgery', 'icu'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.8)[0], 
          userLat + randomOffset(radiusKm * 0.8)[1]
        ] // Within 80% of radius
      },
    },
    {
      id: 'medical-realtime-5',
      name: 'Community Health Center',
      resource_type: 'medical',
      description: 'Community health center providing primary healthcare and preventive care services',
      status: 'available',
      capacity: 50,
      current_usage: 15,
      contact_info: {
        phone: '+603-8000-5555',
        email: 'info@communityhealthcenter.com.my'
      },
      specialties: ['primary_care', 'preventive'],
      available_24_7: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.5)[0], 
          userLat + randomOffset(radiusKm * 0.5)[1]
        ] // Within 50% of radius
      },
    },
    {
      id: 'medical-realtime-6',
      name: 'Guardian Pharmacy 24/7',
      resource_type: 'medical',
      description: 'Round-the-clock pharmacy with comprehensive medication inventory and health products',
      status: 'available',
      capacity: null,
      current_usage: 0,
      contact_info: {
        phone: '+603-8000-6666',
        email: 'info@guardianpharmacy.com.my',
        website: 'https://guardian.com.my'
      },
      specialties: ['pharmacy', '24_7'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.4)[0], 
          userLat + randomOffset(radiusKm * 0.4)[1]
        ] // Within 40% of radius
      }
    },
    {
      id: 'medical-realtime-7',
      name: 'Specialist Medical Center',
      resource_type: 'medical',
      description: 'Private medical center with specialized treatments and advanced medical technology',
      status: 'available',
      capacity: 120,
      current_usage: 40,
      contact_info: {
        phone: '+603-8000-7777',
        email: 'info@specialistmedical.com.my',
        website: 'https://specialistmedical.com.my'
      },
      specialties: ['cardiology', 'neurology', 'oncology'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.7)[0], 
          userLat + randomOffset(radiusKm * 0.7)[1]
        ] // Within 70% of radius
      }
    },
    {
      id: 'medical-realtime-8',
      name: 'Emergency Response Station',
      resource_type: 'rescue',
      description: 'Dedicated emergency response station with ambulance services and rapid response team',
      status: 'available',
      capacity: 10,
      current_usage: 2,
      contact_info: {
        phone: '+603-8000-8888',
        email: 'emergency@responsestation.gov.my'
      },
      specialties: ['emergency_response', 'ambulance', 'rescue'],
      available_24_7: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.6)[0], 
          userLat + randomOffset(radiusKm * 0.6)[1]
        ] // Within 60% of radius
      }
    }
  ]
  
  return resources
}

// Calculate distance between two coordinates (in km)
export const calculateDistance = (
  coord1: [number, number], 
  coord2: [number, number]
): number => {
  const [lon1, lat1] = coord1
  const [lon2, lat2] = coord2
  
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}
