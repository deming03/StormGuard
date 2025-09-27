import { create } from 'zustand';
import { DisasterRiskAssessment, assessDisasterRisk } from '../lib/gemini';
import type { WeatherData } from '../lib/openWeatherService';

interface RiskAssessmentStore {
  riskAssessments: Map<string, DisasterRiskAssessment>;
  isAssessing: boolean;
  error: string | null;

  assessRisk: (locationKey: string, weatherData: WeatherData) => Promise<void>;
  getRiskByLocation: (locationKey: string) => DisasterRiskAssessment | null;
  getHighRiskAreas: () => DisasterRiskAssessment[];
  getAllRiskAssessments: () => DisasterRiskAssessment[];
  clearError: () => void;
  clearAllAssessments: () => void;
}

export const useRiskAssessmentStore = create<RiskAssessmentStore>((set, get) => ({
  riskAssessments: new Map(),
  isAssessing: false,
  error: null,

  assessRisk: async (locationKey: string, weatherData: WeatherData) => {
    set({ isAssessing: true, error: null });

    try {
      const assessment = await assessDisasterRisk(weatherData);
      
      set(state => ({
        riskAssessments: new Map(state.riskAssessments.set(locationKey, assessment)),
        isAssessing: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Risk assessment failed',
        isAssessing: false,
      });
    }
  },

  getRiskByLocation: (locationKey: string) => {
    return get().riskAssessments.get(locationKey) || null;
  },

  getHighRiskAreas: () => {
    const assessments = Array.from(get().riskAssessments.values());
    return assessments.filter(assessment => 
      assessment.overallRiskLevel === 'high' || assessment.overallRiskLevel === 'extreme'
    );
  },

  getAllRiskAssessments: () => {
    return Array.from(get().riskAssessments.values());
  },

  clearError: () => set({ error: null }),

  clearAllAssessments: () => set({ riskAssessments: new Map() }),
}));
