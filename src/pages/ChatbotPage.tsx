// @ts-ignore - React type resolution issue
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/store/authStore'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Languages, 
  Loader2,
  Sparkles,
  Clock,
  RefreshCw,
  AlertTriangle,
  Heart,
  MapPin,
  Shield
} from 'lucide-react'
import { dateUtils } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  language?: string
}

interface ChatbotState {
  messages: ChatMessage[]
  isTyping: boolean
  currentLanguage: string
  sessionId: string
}

// Mock AI responses - in real implementation, this would call Google Gemini API
const generateAIResponse = async (message: string, language: string, _context: ChatMessage[]): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const lowerMessage = message.toLowerCase()

  // Emergency/Disaster responses
  if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('disaster')) {
    return language === 'es' 
      ? "Entiendo que necesitas ayuda de emergencia. He aquí lo que puedes hacer:\n\n1. Si estás en peligro inmediato, llama a los servicios de emergencia locales\n2. Usa nuestro mapa para encontrar recursos médicos cercanos\n3. Reporta incidentes usando nuestra función de informes comunitarios\n\n¿Necesitas ayuda para encontrar recursos específicos?"
      : "I understand you need emergency help. Here's what you can do:\n\n1. If you're in immediate danger, call local emergency services\n2. Use our map to find nearby medical resources\n3. Report incidents using our community reporting feature\n\n Do you need help finding specific resources?"
  }

  // Medical resources
  if (lowerMessage.includes('hospital') || lowerMessage.includes('medical') || lowerMessage.includes('doctor')) {
    return language === 'es'
      ? "Te puedo ayudar a encontrar recursos médicos. Puedes:\n\n1. Usar la sección 'Recursos Médicos' para encontrar hospitales y clínicas cercanas\n2. Filtrar por tipo de servicio (hospital, clínica, farmacia, etc.)\n3. Ver la disponibilidad en tiempo real\n4. Obtener direcciones y información de contacto\n\n¿Buscas algún tipo específico de atención médica?"
      : "I can help you find medical resources. You can:\n\n1. Use the 'Medical Resources' section to find nearby hospitals and clinics\n2. Filter by service type (hospital, clinic, pharmacy, etc.)\n3. View real-time availability\n4. Get directions and contact information\n\nAre you looking for a specific type of medical care?"
  }

  // Disaster reporting
  if (lowerMessage.includes('report') || lowerMessage.includes('incident') || lowerMessage.includes('disaster')) {
    return language === 'es'
      ? "Para reportar un incidente o desastre:\n\n1. Ve a la sección 'Reportes' en el menú\n2. Haz clic en 'Reportar Incidente'\n3. Completa el formulario con detalles\n4. Añade fotos o videos si es posible\n5. Proporciona tu ubicación para una respuesta más rápida\n\nTu reporte ayudará a las autoridades a responder más eficazmente. ¿Necesitas ayuda con algún paso específico?"
      : "To report an incident or disaster:\n\n1. Go to the 'Reports' section in the menu\n2. Click 'Report Incident'\n3. Fill out the form with details\n4. Add photos or videos if possible\n5. Provide your location for faster response\n\nYour report will help authorities respond more effectively. Do you need help with any specific step?"
  }

  // How-to questions
  if (lowerMessage.includes('how') || lowerMessage.includes('cómo')) {
    return language === 'es'
      ? "Estoy aquí para ayudarte a usar DisasterGuard AI. Puedo asistirte con:\n\n• Encontrar recursos médicos cercanos\n• Reportar incidentes y emergencias\n• Entender alertas de desastres\n• Navegar por el sistema\n• Conectarte con equipos de respuesta\n\n¿Con qué te gustaría empezar?"
      : "I'm here to help you use DisasterGuard AI. I can assist you with:\n\n• Finding nearby medical resources\n• Reporting incidents and emergencies\n• Understanding disaster alerts\n• Navigating the system\n• Connecting with response teams\n\nWhat would you like to start with?"
  }

  // Default responses by language
  const responses = {
    en: [
      "I'm here to help you with disaster management and emergency resources. How can I assist you today?",
      "I can help you find medical resources, report incidents, or answer questions about disaster preparedness. What do you need help with?",
      "As your AI assistant for DisasterGuard, I'm ready to help with emergency information, resource location, and disaster reporting. How may I help?",
    ],
    es: [
      "Estoy aquí para ayudarte con la gestión de desastres y recursos de emergencia. ¿Cómo puedo asistirte hoy?",
      "Puedo ayudarte a encontrar recursos médicos, reportar incidentes o responder preguntas sobre preparación para desastres. ¿Qué necesitas?",
      "Como tu asistente de IA para DisasterGuard, estoy listo para ayudar con información de emergencia, localización de recursos y reportes de desastres. ¿Cómo puedo ayudar?",
    ],
    fr: [
      "Je suis ici pour vous aider avec la gestion des catastrophes et les ressources d'urgence. Comment puis-je vous aider aujourd'hui?",
      "Je peux vous aider à trouver des ressources médicales, signaler des incidents ou répondre à des questions sur la préparation aux catastrophes. De quoi avez-vous besoin?",
    ],
  }

  const languageResponses = responses[language as keyof typeof responses] || responses.en
  return languageResponses[Math.floor(Math.random() * languageResponses.length)]
}

export default function ChatbotPage() {
  const { profile } = useAuthStore()
  const [chatState, setChatState] = useState<ChatbotState>({
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI assistant for DisasterGuard. I can help you with emergency resources, disaster reporting, and answer questions about our platform. How can I help you today?",
        timestamp: new Date().toISOString(),
      }
    ],
    isTyping: false,
    currentLanguage: 'en',
    sessionId: Date.now().toString(),
  })

  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatState.messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatState.isTyping) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      isTyping: true,
    }))

    setInputMessage('')

    try {
      const response = await generateAIResponse(inputMessage, chatState.currentLanguage, chatState.messages)
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false,
      }))
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      }

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
      }))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLanguageChange = (language: string) => {
    setChatState(prev => ({ ...prev, currentLanguage: language }))
    
    const welcomeMessages = {
      en: "I've switched to English. How can I help you with disaster management today?",
      es: "He cambiado al español. ¿Cómo puedo ayudarte con la gestión de desastres hoy?",
      fr: "Je suis passé au français. Comment puis-je vous aider avec la gestion des catastrophes aujourd'hui?",
      zh: "我已切换到中文。今天我如何帮助您进行灾难管理？",
      ar: "لقد تحولت إلى العربية. كيف يمكنني مساعدتك في إدارة الكوارث اليوم؟",
    }

    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages.en,
      timestamp: new Date().toISOString(),
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }

  const clearChat = () => {
    setChatState(prev => ({
      ...prev,
      messages: [
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Chat cleared. How can I help you today?",
          timestamp: new Date().toISOString(),
        }
      ],
      sessionId: Date.now().toString(),
    }))
  }

  const suggestedQuestions = [
    { text: "Find nearby hospitals", icon: Heart },
    { text: "How to report an incident?", icon: AlertTriangle },
    { text: "Emergency contact numbers", icon: Shield },
    { text: "Disaster preparedness tips", icon: MapPin },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Get instant help with emergency resources and disaster management
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={chatState.currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇺🇸 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="zh">🇨🇳 中文</SelectItem>
              <SelectItem value="ar">🇸🇦 العربية</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">DisasterGuard AI</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online & Ready to Help
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Languages className="h-3 w-3" />
                Multilingual
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {chatState.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={
                        message.role === 'user' 
                          ? "bg-gray-500 text-white" 
                          : "bg-blue-500 text-white"
                      }>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-muted'
                        } inline-block`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dateUtils.formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {chatState.isTyping && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  placeholder="Type your message... (Press Enter to send)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={chatState.isTyping}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatState.isTyping}
                >
                  {chatState.isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Quick Help
              </CardTitle>
              <CardDescription>
                Common questions and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInputMessage(question.text)}
                >
                  <question.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{question.text}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Capabilities</CardTitle>
              <CardDescription>
                What I can help you with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Medical Resources</p>
                    <p className="text-muted-foreground">Find nearby hospitals, clinics, and medical supplies</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Emergency Reporting</p>
                    <p className="text-muted-foreground">Guide you through incident reporting process</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Languages className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Multilingual Support</p>
                    <p className="text-muted-foreground">Communicate in multiple languages</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Disaster Preparedness</p>
                    <p className="text-muted-foreground">Tips and guidance for emergency planning</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages</span>
                  <span>{chatState.messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="capitalize">{chatState.currentLanguage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span>{profile?.full_name || 'Guest'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
