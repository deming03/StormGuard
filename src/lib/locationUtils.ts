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
      resource_type: 'clinic',
      description: 'Walk-in clinic providing emergency medical care, located close to your current position',
      contact_phone: '+603-8000-1111',
      contact_email: 'emergency@nearbymedical.com.my',
      website: 'https://nearbymedical.com.my',
      capacity: 30,
      current_availability: 20,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.2)[0], 
          userLat + randomOffset(radiusKm * 0.2)[1]
        ] // Within 20% of radius
      },
      address: `Near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Emergency Care', 'First Aid', 'Minor Surgery', 'Consultation'],
      equipment_available: ['Defibrillator', 'X-Ray', 'Ultrasound', 'ECG'],
      emergency_contact: '+603-8000-1111',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-2',
      name: 'Local Pharmacy Plus',
      resource_type: 'pharmacy',
      description: '24/7 pharmacy with emergency medications and basic medical supplies, very close to you',
      contact_phone: '+603-8000-2222',
      contact_email: 'info@localpharmacy.com.my',
      capacity: null,
      current_availability: null,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.1)[0], 
          userLat + randomOffset(radiusKm * 0.1)[1]
        ] // Within 10% of radius
      },
      address: `Very close to your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Prescription Dispensing', 'Emergency Medications', 'Health Consultation'],
      equipment_available: ['Blood Pressure Monitor', 'Thermometer', 'First Aid Supplies'],
      emergency_contact: '+603-8000-2222',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-3',
      name: 'Mobile Emergency Unit',
      resource_type: 'emergency_services',
      description: 'Mobile emergency response unit currently stationed near your area',
      contact_phone: '+603-8000-3333',
      contact_email: 'mobile@emergency.gov.my',
      capacity: 5,
      current_availability: 4,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.3)[0], 
          userLat + randomOffset(radiusKm * 0.3)[1]
        ] // Within 30% of radius
      },
      address: `Mobile unit near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
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
      equipment_available: ['Ambulance', 'Defibrillator', 'Oxygen Tanks', 'Emergency Medications'],
      emergency_contact: '+603-8000-3333',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-4',
      name: 'General Hospital - Main Campus',
      resource_type: 'hospital',
      description: 'Full-service hospital with emergency department, ICU, and specialized medical services',
      contact_phone: '+603-8000-4444',
      contact_email: 'info@generalhospital.com.my',
      website: 'https://generalhospital.com.my',
      capacity: 200,
      current_availability: 150,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.8)[0], 
          userLat + randomOffset(radiusKm * 0.8)[1]
        ] // Within 80% of radius
      },
      address: `Hospital near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Emergency Care', 'Surgery', 'ICU', 'Cardiology', 'Pediatrics', 'Radiology'],
      equipment_available: ['MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'ECG', 'Dialysis'],
      emergency_contact: '+603-8000-4444',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-5',
      name: 'Community Health Center',
      resource_type: 'clinic',
      description: 'Community health center providing primary healthcare and preventive care services',
      contact_phone: '+603-8000-5555',
      contact_email: 'info@communityhealthcenter.com.my',
      capacity: 50,
      current_availability: 35,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.5)[0], 
          userLat + randomOffset(radiusKm * 0.5)[1]
        ] // Within 50% of radius
      },
      address: `Community center near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
      operating_hours: {
        monday: '8:00 AM - 8:00 PM',
        tuesday: '8:00 AM - 8:00 PM',
        wednesday: '8:00 AM - 8:00 PM',
        thursday: '8:00 AM - 8:00 PM',
        friday: '8:00 AM - 8:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: '9:00 AM - 5:00 PM'
      },
      services_offered: ['Primary Care', 'Vaccination', 'Health Screening', 'Maternal Care'],
      equipment_available: ['Blood Pressure Monitor', 'Glucose Meter', 'Thermometer', 'Basic Lab'],
      emergency_contact: '+603-8000-5555',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-6',
      name: 'Guardian Pharmacy 24/7',
      resource_type: 'pharmacy',
      description: 'Round-the-clock pharmacy with comprehensive medication inventory and health products',
      contact_phone: '+603-8000-6666',
      contact_email: 'info@guardianpharmacy.com.my',
      website: 'https://guardian.com.my',
      capacity: null,
      current_availability: null,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.4)[0], 
          userLat + randomOffset(radiusKm * 0.4)[1]
        ] // Within 40% of radius
      },
      address: `Pharmacy near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
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
      equipment_available: ['Blood Pressure Monitor', 'Glucose Meter', 'Thermometer', 'Weight Scale'],
      emergency_contact: '+603-8000-6666',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-7',
      name: 'Specialist Medical Center',
      resource_type: 'hospital',
      description: 'Private medical center with specialized treatments and advanced medical technology',
      contact_phone: '+603-8000-7777',
      contact_email: 'info@specialistmedical.com.my',
      website: 'https://specialistmedical.com.my',
      capacity: 120,
      current_availability: 80,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.7)[0], 
          userLat + randomOffset(radiusKm * 0.7)[1]
        ] // Within 70% of radius
      },
      address: `Specialist center near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Specialist Care', 'Surgery', 'Diagnostics', 'Emergency Care', 'Rehabilitation'],
      equipment_available: ['MRI', 'CT Scan', 'PET Scan', 'X-Ray', 'Ultrasound', 'Laboratory'],
      emergency_contact: '+603-8000-7777',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'medical-realtime-8',
      name: 'Emergency Response Station',
      resource_type: 'emergency_services',
      description: 'Dedicated emergency response station with ambulance services and rapid response team',
      contact_phone: '+603-8000-8888',
      contact_email: 'emergency@responsestation.gov.my',
      capacity: 10,
      current_availability: 8,
      status: 'available',
      location: {
        type: 'Point',
        coordinates: [
          userLng + randomOffset(radiusKm * 0.6)[0], 
          userLat + randomOffset(radiusKm * 0.6)[1]
        ] // Within 60% of radius
      },
      address: `Emergency station near your location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
      operating_hours: {
        monday: '24/7',
        tuesday: '24/7',
        wednesday: '24/7',
        thursday: '24/7',
        friday: '24/7',
        saturday: '24/7',
        sunday: '24/7'
      },
      services_offered: ['Emergency Response', 'Ambulance Services', 'Fire Rescue', 'Medical Transport', 'Disaster Response'],
      equipment_available: ['Ambulance Fleet', 'Fire Trucks', 'Rescue Equipment', 'Medical Supplies', 'Communication Systems'],
      emergency_contact: '+603-8000-8888',
      verification_documents: [],
      added_by: 'system',
      verified_by: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
