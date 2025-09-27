import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ChatMessage } from '@/lib/database.types'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

// Safety settings for emergency content
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE', // Allow disaster/emergency content
  },
] as any[]

// Generation config
const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
}

export class GeminiAIService {
  private model: any
  private chatModel: any

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      safetySettings,
      generationConfig,
    })
    
    this.chatModel = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      safetySettings,
      generationConfig,
    })
  }

  /**
   * Generate disaster-specific AI response for chatbot
   */
  async generateChatResponse(
    message: string, 
    language: string = 'en',
    context: ChatMessage[] = [],
    userProfile?: any
  ): Promise<string> {
    try {
      // Build context from previous messages
      const conversationHistory = context
        .slice(-10) // Last 10 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const systemPrompt = this.getSystemPrompt(language, userProfile)
      const userMessage = `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nUser: ${message}`

      const result = await this.model.generateContent(userMessage)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini AI Error:', error)
      return this.getFallbackResponse(language)
    }
  }

  /**
   * Analyze incident report for misinformation detection
   */
  async analyzeIncidentReport(
    title: string,
    description: string,
    location: string,
    images?: string[]
  ): Promise<{
    isCredible: boolean
    confidence: number
    analysis: string
    recommendations: string[]
  }> {
    try {
      const prompt = `
As an AI disaster management expert, analyze this incident report for credibility:

Title: ${title}
Description: ${description}
Location: ${location}
Images: ${images?.length ? `${images.length} images provided` : 'No images'}

Please analyze:
1. Credibility (true/false)
2. Confidence level (0-100)
3. Analysis reasoning
4. Recommendations for verification

Respond in JSON format:
{
  "isCredible": boolean,
  "confidence": number,
  "analysis": "detailed analysis",
  "recommendations": ["recommendation1", "recommendation2"]
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        // Fallback if JSON parsing fails
        return {
          isCredible: true,
          confidence: 70,
          analysis: "Unable to analyze report structure. Manual review recommended.",
          recommendations: ["Manual verification needed", "Contact local authorities"]
        }
      }
    } catch (error) {
      console.error('Incident analysis error:', error)
      return {
        isCredible: true,
        confidence: 50,
        analysis: "Analysis service temporarily unavailable.",
        recommendations: ["Manual review required"]
      }
    }
  }

  /**
   * Generate disaster predictions based on current conditions
   */
  async generateDisasterPrediction(
    location: [number, number],
    weatherData?: any,
    historicalData?: any[]
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    predictions: Array<{
      type: string
      probability: number
      timeframe: string
      description: string
    }>
    recommendations: string[]
  }> {
    try {
      const prompt = `
As a disaster prediction AI, analyze the following data and provide predictions:

Location: [${location[0]}, ${location[1]}]
Weather: ${weatherData ? JSON.stringify(weatherData) : 'Not available'}
Historical Data: ${historicalData ? JSON.stringify(historicalData.slice(-5)) : 'Limited'}

Provide predictions in JSON format:
{
  "riskLevel": "low|medium|high|critical",
  "predictions": [
    {
      "type": "earthquake|flood|hurricane|wildfire|etc",
      "probability": 0-100,
      "timeframe": "hours|days|weeks|months",
      "description": "detailed description"
    }
  ],
  "recommendations": ["action1", "action2"]
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        return {
          riskLevel: 'low',
          predictions: [],
          recommendations: ["Monitor weather conditions", "Stay informed through official channels"]
        }
      }
    } catch (error) {
      console.error('Prediction error:', error)
      return {
        riskLevel: 'low',
        predictions: [],
        recommendations: ["Prediction service temporarily unavailable"]
      }
    }
  }

  /**
   * Optimize resource allocation using AI
   */
  async optimizeResourceAllocation(
    disasters: any[],
    availableResources: any[],
    constraints?: any
  ): Promise<{
    allocations: Array<{
      resourceId: string
      disasterId: string
      priority: number
      reasoning: string
    }>
    efficiency: number
    recommendations: string[]
  }> {
    try {
      const prompt = `
Optimize resource allocation for disaster response:

Active Disasters:
${JSON.stringify(disasters.slice(0, 10))} // Limit data size

Available Resources:
${JSON.stringify(availableResources.slice(0, 20))}

Constraints:
${JSON.stringify(constraints)}

Provide optimal allocation in JSON format:
{
  "allocations": [
    {
      "resourceId": "resource_id",
      "disasterId": "disaster_id", 
      "priority": 1-10,
      "reasoning": "why this allocation"
    }
  ],
  "efficiency": 0-100,
  "recommendations": ["optimization suggestions"]
}
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        return {
          allocations: [],
          efficiency: 0,
          recommendations: ["Manual allocation required", "Review resource priorities"]
        }
      }
    } catch (error) {
      console.error('Resource optimization error:', error)
      return {
        allocations: [],
        efficiency: 0,
        recommendations: ["Optimization service unavailable"]
      }
    }
  }

  /**
   * Generate multilingual system prompt
   */
  private getSystemPrompt(language: string, userProfile?: any): string {
    const prompts = {
      en: `You are an AI assistant for DisasterGuard, an emergency management system. You help users with:
- Finding medical resources and emergency services
- Reporting incidents and disasters  
- Understanding disaster preparedness
- Navigating the emergency management platform
- Providing safety information and guidance

Be helpful, accurate, and prioritize user safety. Always direct users to emergency services (911, local authorities) for immediate life-threatening situations.

User context: ${userProfile ? `Role: ${userProfile.role}, Location: ${userProfile.location || 'Unknown'}` : 'Guest user'}`,
      
      es: `Eres un asistente de IA para DisasterGuard, un sistema de gestión de emergencias. Ayudas a los usuarios con:
- Encontrar recursos médicos y servicios de emergencia
- Reportar incidentes y desastres
- Entender la preparación para desastres  
- Navegar por la plataforma de gestión de emergencias
- Proporcionar información y orientación de seguridad

Sé útil, preciso y prioriza la seguridad del usuario. Siempre dirige a los usuarios a los servicios de emergencia para situaciones que amenacen la vida inmediatamente.`,
      
      fr: `Vous êtes un assistant IA pour DisasterGuard, un système de gestion d'urgence. Vous aidez les utilisateurs avec:
- Trouver des ressources médicales et services d'urgence
- Signaler des incidents et catastrophes
- Comprendre la préparation aux catastrophes
- Naviguer sur la plateforme de gestion d'urgence  
- Fournir des informations et conseils de sécurité

Soyez utile, précis et priorisez la sécurité de l'utilisateur.`,
    }
    
    return prompts[language as keyof typeof prompts] || prompts.en
  }

  /**
   * Fallback response when AI fails
   */
  private getFallbackResponse(language: string): string {
    const fallbacks = {
      en: "I'm having trouble processing your request right now. For immediate emergencies, please contact your local emergency services. You can also try asking your question differently or browse our medical resources section.",
      es: "Tengo problemas para procesar tu solicitud ahora mismo. Para emergencias inmediatas, contacta con los servicios de emergencia locales. También puedes intentar hacer tu pregunta de manera diferente.",
      fr: "J'ai des difficultés à traiter votre demande maintenant. Pour les urgences immédiates, contactez vos services d'urgence locaux."
    }
    
    return fallbacks[language as keyof typeof fallbacks] || fallbacks.en
  }

  /**
   * Start a chat session for ongoing conversation
   */
  async startChatSession(systemPrompt?: string) {
    const chat = this.chatModel.startChat({
      history: systemPrompt ? [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model', 
          parts: [{ text: 'I understand. I\'m ready to help with disaster management and emergency response questions.' }]
        }
      ] : [],
    })
    
    return chat
  }
}

// Export singleton instance
export const geminiAI = new GeminiAIService()

// Helper functions
export const aiUtils = {
  /**
   * Classify disaster type from text description
   */
  classifyDisasterType: async (description: string): Promise<string> => {
    const keywords = {
      earthquake: ['earthquake', 'tremor', 'seismic', 'shake', 'fault'],
      flood: ['flood', 'water', 'river', 'overflow', 'rain', 'storm'],
      fire: ['fire', 'smoke', 'burn', 'flame', 'wildfire'],
      hurricane: ['hurricane', 'typhoon', 'cyclone', 'wind', 'storm'],
      tornado: ['tornado', 'twister', 'funnel', 'wind'],
    }
    
    const lowerDesc = description.toLowerCase()
    
    for (const [type, terms] of Object.entries(keywords)) {
      if (terms.some(term => lowerDesc.includes(term))) {
        return type
      }
    }
    
    return 'other'
  },

  /**
   * Extract location from text description
   */
  extractLocation: async (text: string): Promise<string | null> => {
    // Simple regex for common location patterns
    const locationPatterns = [
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:area|region|city|town)/g,
    ]
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return matches[0].replace(/(?:in|at|near)\s+/i, '').trim()
      }
    }
    
    return null
  },

  /**
   * Determine severity from description
   */
  determineSeverity: async (description: string, casualties?: number): Promise<'low' | 'medium' | 'high' | 'critical'> => {
    const lowerDesc = description.toLowerCase()
    
    // Check for critical keywords
    if (casualties && casualties > 50 || 
        lowerDesc.includes('mass casualty') || 
        lowerDesc.includes('catastrophic') ||
        lowerDesc.includes('major disaster')) {
      return 'critical'
    }
    
    // Check for high severity
    if (casualties && casualties > 10 ||
        lowerDesc.includes('severe') ||
        lowerDesc.includes('extensive damage') ||
        lowerDesc.includes('evacuate')) {
      return 'high'
    }
    
    // Check for medium severity
    if (casualties && casualties > 0 ||
        lowerDesc.includes('damage') ||
        lowerDesc.includes('injured') ||
        lowerDesc.includes('affected')) {
      return 'medium'
    }
    
    return 'low'
  }
}
