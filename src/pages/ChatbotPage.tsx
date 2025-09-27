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
  MapPin,
  Shield,
  Navigation
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

  // Emergency/Flood responses
  if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('flood') || lowerMessage.includes('banjir')) {
    if (language === 'zh') {
      return "我理解您需要紧急帮助。您可以这样做：\n\n1. 如果您处于即时危险中，请拨打当地紧急服务电话\n2. 使用我们的地图查看附近区域\n3. 使用我们的社区报告功能报告洪水事件\n\n您需要帮助寻找特定资源吗？"
    } else if (language === 'ms') {
      return "Saya faham anda memerlukan bantuan kecemasan. Inilah yang boleh anda lakukan:\n\n1. Jika anda dalam bahaya segera, hubungi perkhidmatan kecemasan tempatan\n2. Gunakan peta kami untuk mencari kawasan berhampiran\n3. Laporkan insiden menggunakan ciri pelaporan komuniti kami\n\nAdakah anda memerlukan bantuan mencari sumber tertentu?"
    } else {
      return "I understand you need emergency help. Here's what you can do:\n\n1. If you're in immediate danger, call local emergency services\n2. Use our map to find nearby areas\n3. Report flood incidents using our community reporting feature\n\nDo you need help finding specific resources?"
    }
  }

  // Flood reporting and management
  if (lowerMessage.includes('flood') || lowerMessage.includes('banjir') || lowerMessage.includes('洪水')) {
    if (language === 'zh') {
      return "我可以帮助您进行洪水管理。您可以：\n\n1. 使用'洪水管理'部分查看洪水事件\n2. 按严重程度筛选洪水事件\n3. 查看实时洪水信息\n4. 获取路线和联系信息\n\n您需要特定类型的洪水信息吗？"
    } else if (language === 'ms') {
      return "Saya boleh membantu anda dengan pengurusan banjir. Anda boleh:\n\n1. Gunakan bahagian 'Pengurusan Banjir' untuk melihat kejadian banjir\n2. Tapis mengikut tahap keterukan\n3. Lihat maklumat banjir masa nyata\n4. Dapatkan arah dan maklumat hubungan\n\nAdakah anda mencari jenis maklumat banjir tertentu?"
    } else {
      return "I can help you with flood management. You can:\n\n1. Use the 'Flood Management' section to view flood incidents\n2. Filter by severity level\n3. View real-time flood information\n4. Get directions and contact information\n\nAre you looking for a specific type of flood information?"
    }
  }

  // Flood reporting
  if (lowerMessage.includes('report') || lowerMessage.includes('incident') || lowerMessage.includes('lapor')) {
    if (language === 'zh') {
      return "要报告洪水事件：\n\n1. 转到菜单中的'洪水管理'部分\n2. 点击'报告洪水'\n3. 填写详细信息表格\n4. 如可能，添加照片或视频\n5. 提供您的位置以获得更快响应\n\n您的报告将帮助当局更有效地响应。您需要任何特定步骤的帮助吗？"
    } else if (language === 'ms') {
      return "Untuk melaporkan kejadian banjir:\n\n1. Pergi ke bahagian 'Pengurusan Banjir' dalam menu\n2. Klik 'Lapor Banjir'\n3. Isi borang dengan butiran\n4. Tambah foto atau video jika boleh\n5. Berikan lokasi anda untuk respons yang lebih cepat\n\nLaporan anda akan membantu pihak berkuasa bertindak balas dengan lebih berkesan. Adakah anda memerlukan bantuan dengan mana-mana langkah tertentu?"
    } else {
      return "To report a flood incident:\n\n1. Go to the 'Flood Management' section in the menu\n2. Click 'Report Flood'\n3. Fill out the form with details\n4. Add photos or videos if possible\n5. Provide your location for faster response\n\nYour report will help authorities respond more effectively. Do you need help with any specific step?"
    }
  }

  // How-to questions
  if (lowerMessage.includes('how') || lowerMessage.includes('怎么') || lowerMessage.includes('bagaimana')) {
    if (language === 'zh') {
      return "我在这里帮助您使用 DisasterGuard AI。我可以协助您：\n\n• 报告洪水事件和紧急情况\n• 理解洪水警报\n• 导航系统\n• 连接响应团队\n• 智能路线规划\n\n您想从什么开始？"
    } else if (language === 'ms') {
      return "Saya di sini untuk membantu anda menggunakan DisasterGuard AI. Saya boleh membantu anda dengan:\n\n• Melaporkan kejadian banjir dan kecemasan\n• Memahami amaran banjir\n• Menavigasi sistem\n• Menghubungkan dengan pasukan respons\n• Perancangan laluan pintar\n\nApa yang anda ingin mulakan?"
    } else {
      return "I'm here to help you use DisasterGuard AI. I can assist you with:\n\n• Reporting flood incidents and emergencies\n• Understanding flood alerts\n• Navigating the system\n• Connecting with response teams\n• Smart route planning\n\nWhat would you like to start with?"
    }
  }

  // Default responses by language
  const responses = {
    en: [
      "I'm here to help you with flood management and emergency resources. How can I assist you today?",
      "I can help you report flood incidents, find safe routes, or answer questions about flood preparedness. What do you need help with?",
      "As your AI assistant for DisasterGuard, I'm ready to help with flood information, route planning, and incident reporting. How may I help?",
    ],
    zh: [
      "我在这里帮助您进行洪水管理和紧急资源。今天我如何帮助您？",
      "我可以帮助您报告洪水事件、寻找安全路线或回答有关洪水预防的问题。您需要什么帮助？",
      "作为您的 DisasterGuard AI 助手，我准备帮助您获取洪水信息、路线规划和事件报告。我如何帮助您？",
    ],
    ms: [
      "Saya di sini untuk membantu anda dengan pengurusan banjir dan sumber kecemasan. Bagaimana saya boleh membantu anda hari ini?",
      "Saya boleh membantu anda melaporkan kejadian banjir, mencari laluan selamat, atau menjawab soalan tentang persediaan banjir. Apa yang anda perlukan?",
      "Sebagai pembantu AI anda untuk DisasterGuard, saya bersedia membantu dengan maklumat banjir, perancangan laluan, dan pelaporan kejadian. Bagaimana saya boleh membantu?",
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
            content: "Hello! I'm your AI assistant for DisasterGuard. I can help you with flood management, emergency resources, safe routing, and answer questions about our platform. How can I help you today?",
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
      en: "I've switched to English. How can I help you with flood management today?",
      zh: "我已切换到中文。今天我如何帮助您进行洪水管理？",
      ms: "Saya telah bertukar kepada Bahasa Melayu. Bagaimana saya boleh membantu anda dengan pengurusan banjir hari ini?",
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
            content: "Chat cleared. How can I help you with flood management today?",
          timestamp: new Date().toISOString(),
        }
      ],
      sessionId: Date.now().toString(),
    }))
  }

  const suggestedQuestions = [
    { text: "How to report a flood?", icon: AlertTriangle },
    { text: "Emergency contact numbers", icon: Shield },
    { text: "Flood preparedness tips", icon: MapPin },
    { text: "Find safe routes", icon: Navigation },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            AI Assistant 🤖
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Get instant help with flood management and emergency assistance
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <Select value={chatState.currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[160px] bg-white/60 border-0 shadow-md">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ms">Bahasa Melayu</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearChat}
            className="bg-white/60 border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">StormGuard AI Assistant</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 font-medium">Online & Ready to Help</span>
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-0 px-3 py-1">
                <Languages className="h-3 w-3 mr-1" />
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

            <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex space-x-3">
                <Input
                  ref={inputRef}
                  placeholder="Ask me anything about flood safety... 💬"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={chatState.isTyping}
                  className="flex-1 bg-white border-0 shadow-md focus:shadow-lg transition-all duration-200 rounded-full px-4 py-3"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatState.isTyping}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-6"
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
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-semibold text-gray-800">
                ✨ Quick Help
              </CardTitle>
              <CardDescription>
                Get started with these common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3 text-xs"
                  onClick={() => setInputMessage(question.text)}
                >
                  <question.icon className="h-3 w-3 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs truncate">{question.text}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">🤖 AI Capabilities</CardTitle>
              <CardDescription>
                Here's what I can help you with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2">
                  <Navigation className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs">Smart Routing</p>
                    <p className="text-muted-foreground text-xs leading-tight">Find safe routes and avoid flooded areas</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs">Flood Reporting</p>
                    <p className="text-muted-foreground text-xs leading-tight">Guide you through flood incident reporting process</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Languages className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs">Multilingual Support</p>
                    <p className="text-muted-foreground text-xs leading-tight">Communicate in multiple languages</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Shield className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs">Flood Preparedness</p>
                    <p className="text-muted-foreground text-xs leading-tight">Tips and guidance for flood emergency planning</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Stats */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">📊 Session Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Messages</span>
                  <span>{chatState.messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="capitalize">{chatState.currentLanguage === 'ms' ? 'Malay' : chatState.currentLanguage === 'zh' ? 'Chinese' : 'English'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="truncate max-w-20">{profile?.full_name || 'Guest'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
