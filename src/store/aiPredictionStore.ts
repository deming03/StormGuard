import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { geminiAI } from '@/lib/gemini'
import type { AiPrediction, AiPredictionInsert } from '@/lib/database.types'

interface PredictionState {
  predictions: AiPrediction[]
  activePredictions: AiPrediction[]
  loading: boolean
  error: string | null
}

interface PredictionActions {
  fetchPredictions: () => Promise<void>
  fetchActivePredictions: () => Promise<void>
  createDisasterPrediction: (location: [number, number], data?: any) => Promise<void>
  createResourceOptimization: (disasters: any[], resources: any[]) => Promise<void>
  analyzeIncidentCredibility: (reportId: string, title: string, description: string) => Promise<any>
  validatePrediction: (id: string, outcome: any) => Promise<void>
  clearError: () => void
}

type AiPredictionStore = PredictionState & PredictionActions

export const useAiPredictionStore = create<AiPredictionStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    predictions: [],
    activePredictions: [],
    loading: false,
    error: null,

    // Actions
    fetchPredictions: async () => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('ai_predictions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (error) throw error
        
        set({ 
          predictions: data || [],
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch predictions',
          loading: false 
        })
      }
    },

    fetchActivePredictions: async () => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('ai_predictions')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .order('confidence_score', { ascending: false })
          .limit(20)
        
        if (error) throw error
        
        set({ 
          activePredictions: data || [],
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch active predictions',
          loading: false 
        })
      }
    },

    createDisasterPrediction: async (location: [number, number], inputData = {}) => {
      set({ loading: true, error: null })
      
      try {
        // Get AI prediction
        const prediction = await geminiAI.generateDisasterPrediction(
          location,
          inputData.weather,
          inputData.historical
        )

        // Store each prediction in the database
        const predictionInserts: AiPredictionInsert[] = prediction.predictions.map(pred => ({
          prediction_type: 'disaster_forecast',
          model_name: 'gemini-pro',
          input_data: {
            location,
            weather: inputData.weather,
            historical: inputData.historical,
          },
          prediction_data: {
            ...pred,
            riskLevel: prediction.riskLevel,
            recommendations: prediction.recommendations,
          },
          confidence_score: pred.probability / 100,
          location: JSON.stringify({ type: 'Point', coordinates: location }),
          prediction_horizon: pred.timeframe === 'hours' ? '1 day' : 
                            pred.timeframe === 'days' ? '1 week' : '1 month',
          expires_at: new Date(Date.now() + 
            (pred.timeframe === 'hours' ? 24 * 60 * 60 * 1000 :
             pred.timeframe === 'days' ? 7 * 24 * 60 * 60 * 1000 :
             30 * 24 * 60 * 60 * 1000)).toISOString(),
        }))

        if (predictionInserts.length > 0) {
          const { data, error } = await supabase
            .from('ai_predictions')
            .insert(predictionInserts)
            .select()

          if (error) throw error

          set(state => ({
            predictions: [...(data || []), ...state.predictions],
            activePredictions: [...(data || []), ...state.activePredictions],
            loading: false
          }))
        } else {
          set({ loading: false })
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create prediction',
          loading: false 
        })
        throw error
      }
    },

    createResourceOptimization: async (disasters: any[], resources: any[]) => {
      set({ loading: true, error: null })
      
      try {
        const optimization = await geminiAI.optimizeResourceAllocation(
          disasters,
          resources
        )

        const predictionInsert: AiPredictionInsert = {
          prediction_type: 'resource_optimization',
          model_name: 'gemini-pro',
          input_data: {
            disasters: disasters.map(d => ({ id: d.id, severity: d.severity, location: d.location })),
            resources: resources.map(r => ({ id: r.id, type: r.resource_type, status: r.status })),
          },
          prediction_data: optimization,
          confidence_score: optimization.efficiency / 100,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }

        const { data, error } = await supabase
          .from('ai_predictions')
          .insert(predictionInsert)
          .select()
          .single()

        if (error) throw error

        set(state => ({
          predictions: [data, ...state.predictions],
          activePredictions: [data, ...state.activePredictions],
          loading: false
        }))

        return optimization
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create resource optimization',
          loading: false 
        })
        throw error
      }
    },

    analyzeIncidentCredibility: async (reportId: string, title: string, description: string) => {
      try {
        const analysis = await geminiAI.analyzeIncidentReport(title, description, '')

        // Store the analysis result
        const predictionInsert: AiPredictionInsert = {
          prediction_type: 'misinformation_detection',
          model_name: 'gemini-pro',
          input_data: {
            reportId,
            title,
            description,
          },
          prediction_data: analysis,
          confidence_score: analysis.confidence / 100,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        }

        await supabase
          .from('ai_predictions')
          .insert(predictionInsert)

        return analysis
      } catch (error) {
        console.error('Credibility analysis error:', error)
        throw error
      }
    },

    validatePrediction: async (id: string, outcome: any) => {
      set({ loading: true, error: null })
      
      try {
        const { error } = await supabase
          .from('ai_predictions')
          .update({
            actual_outcome: outcome,
            is_validated: true,
          })
          .eq('id', id)

        if (error) throw error

        set(state => ({
          predictions: state.predictions.map(p => 
            p.id === id ? { ...p, actual_outcome: outcome, is_validated: true } : p
          ),
          activePredictions: state.activePredictions.map(p => 
            p.id === id ? { ...p, actual_outcome: outcome, is_validated: true } : p
          ),
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to validate prediction',
          loading: false 
        })
        throw error
      }
    },

    clearError: () => set({ error: null }),
  }))
)

// Helper functions for AI predictions
export const predictionUtils = {
  /**
   * Get risk level color for UI
   */
  getRiskLevelColor: (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  },

  /**
   * Format prediction timeframe
   */
  formatTimeframe: (timeframe: string): string => {
    return timeframe.charAt(0).toUpperCase() + timeframe.slice(1)
  },

  /**
   * Calculate prediction accuracy based on historical data
   */
  calculateAccuracy: (predictions: AiPrediction[]): number => {
    const validatedPredictions = predictions.filter(p => p.is_validated)
    if (validatedPredictions.length === 0) return 0

    const accurateCount = validatedPredictions.filter(p => {
      // Simple accuracy check - in real implementation, this would be more sophisticated
      return p.confidence_score && p.confidence_score > 0.7
    }).length

    return (accurateCount / validatedPredictions.length) * 100
  },

  /**
   * Get model performance stats
   */
  getModelStats: (predictions: AiPrediction[]) => {
    const total = predictions.length
    const validated = predictions.filter(p => p.is_validated).length
    const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / total || 0
    
    return {
      total,
      validated,
      validationRate: total > 0 ? (validated / total) * 100 : 0,
      avgConfidence: avgConfidence * 100,
      accuracy: predictionUtils.calculateAccuracy(predictions),
    }
  },
}
