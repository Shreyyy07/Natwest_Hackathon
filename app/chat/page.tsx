"use client";
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Send, 
  BookOpen, 
  ArrowLeft, 
  User, 
  Bot, 
  Menu, 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  ImageIcon,
  Sparkles,
  Brain,
  Lightbulb,
  TrendingUp,
  Clock,
  MessageSquare,
  Settings,
  Bookmark,
  Share2,
  Download,
  Eye,
  ThumbsUp,
  Coffee,
  Rocket,
  Globe,
  Code,
  FileText,
  Layers,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Filter,
  Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  topic?: string;
  imageUrl?: string;
  pointsEarned?: number;
  achievements?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  readTime?: number;
  tags?: string[];
  reactions?: { type: string; count: number }[];
}

export default function AdvancedLearningChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'collapsed' | 'compact' | 'expanded'>('compact');
  const [darkMode, setDarkMode] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [learningStreak, setLearningStreak] = useState(7);
  const [totalXP, setTotalXP] = useState(1250);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll with smooth animation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced submit with visual feedback
  const handleSubmit = useCallback(async (customInput?: string) => {
    const input = customInput || inputValue;
    if (!input.trim() || isSending) return;

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    setIsSending(true);
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date(),
      difficulty: getDifficultyFromInput(input),
      readTime: Math.ceil(input.split(' ').length / 200),
      tags: extractTagsFromInput(input)
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response with enhanced features
    setTimeout(() => {
      const aiResponse = generateAdvancedAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setTotalXP(prev => prev + (aiResponse.pointsEarned || 0));
      setIsLoading(false);
      
      if (aiResponse.achievements && aiResponse.achievements.length > 0) {
        aiResponse.achievements.forEach(achievement => {
          toast.success(`🏆 Achievement: ${achievement}`, {
            duration: 4000,
            className: 'bg-gradient-to-r from-yellow-500 to-orange-500'
          });
        });
      }

      submitTimeoutRef.current = setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }, 2000);
  }, [inputValue, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input logic would go here
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } ${focusMode ? 'pt-0' : 'pt-4'}`}>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex h-[calc(100vh-1rem)]">
        
        {/* Advanced Sidebar */}
        <AnimatePresence>
          <motion.div 
            initial={false}
            animate={{ 
              width: sidebarMode === 'collapsed' ? 60 : sidebarMode === 'compact' ? 280 : 400,
              opacity: 1 
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-r ${
              darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            } flex flex-col relative shadow-2xl`}
          >
            
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                {sidebarMode !== 'collapsed' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Brain className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Neural Learn
                      </h2>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI-Powered Learning
                      </p>
                    </div>
                  </motion.div>
                )}
                
                <button
                  onClick={() => setSidebarMode(
                    sidebarMode === 'collapsed' ? 'compact' : 
                    sidebarMode === 'compact' ? 'expanded' : 'collapsed'
                  )}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Menu size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* User Stats Card */}
              {sidebarMode !== 'collapsed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Alex Learner
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Level 12 Explorer
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>XP Progress</span>
                        <span className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {totalXP.toLocaleString()}
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '68%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Zap size={14} className="text-yellow-500" />
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {learningStreak}
                          </span>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Day Streak</p>
                      </div>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <Trophy size={14} className="text-orange-500" />
                          <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>24</span>
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Badges</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Actions */}
            {sidebarMode !== 'collapsed' && (
              <div className="p-4 space-y-3">
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: Rocket, label: 'New Challenge', color: 'from-red-500 to-orange-500' },
                    { icon: BookOpen, label: 'Study Guide', color: 'from-green-500 to-emerald-500' },
                    { icon: Globe, label: 'Explore Topics', color: 'from-blue-500 to-cyan-500' },
                    { icon: Code, label: 'Practice Code', color: 'from-purple-500 to-pink-500' }
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                        darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'
                      } group hover:scale-105`}
                    >
                      <div className={`w-8 h-8 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon size={16} className="text-white" />
                      </div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Topics */}
            {sidebarMode === 'expanded' && (
              <div className="p-4 flex-1">
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Recent Topics
                </h3>
                <div className="space-y-2">
                  {['React Architecture', 'Machine Learning', 'Quantum Physics', 'Data Structures'].map((topic, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {topic}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Clock size={12} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {idx + 1}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="p-4 border-t border-gray-700/30">
              <div className="flex items-center space-x-2">
                {sidebarMode !== 'collapsed' && (
                  <>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400"></div>
                    </button>
                    <button
                      onClick={() => setFocusMode(!focusMode)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Eye size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                  </>
                )}
                <button className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}>
                  <Settings size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border-b ${
              darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            } p-4 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}>
                  <ArrowLeft size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Bot size={24} className="text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Neural Assistant
                    </h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-2`}>
                      <Sparkles size={12} />
                      <span>Ready for advanced learning</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  darkMode 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}>
                    <Bookmark size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}>
                    <Share2 size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Messages Area with Advanced Features */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
              
              {messages.length === 0 ? (
                <WelcomeScreen darkMode={darkMode} onExampleClick={setInputValue} />
              ) : (
                messages.map((message) => (
                  <AdvancedMessageComponent 
                    key={message.id} 
                    message={message} 
                    darkMode={darkMode}
                  />
                ))
              )}

              {/* Enhanced Loading Animation */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-4 max-w-4xl">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Bot size={20} className="text-white" />
                      </div>
                    </div>
                    <div className={`${
                      darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                    } backdrop-blur-sm border ${
                      darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                    } rounded-2xl p-6 flex-1`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex space-x-2">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Analyzing and generating visual insights...
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {['Processing your question', 'Searching knowledge base', 'Generating diagrams', 'Preparing response'].map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.5 }}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {step}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Advanced Input Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} ${
              darkMode ? 'bg-gray-900/95' : 'bg-white/95'
            } backdrop-blur-xl p-6`}
          >
            <div className="max-w-5xl mx-auto">
              
              {/* Input Suggestions */}
              {inputValue.length === 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb size={16} className={`${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quick Suggestions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '🧬 Explain DNA replication with diagrams',
                      '⚛️ Show me quantum mechanics visually',
                      '🚀 How does rocket propulsion work?',
                      '🧠 Break down machine learning algorithms'
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputValue(suggestion.substring(2))}
                        className={`px-3 py-2 text-sm rounded-lg transition-all hover:scale-105 ${
                          darkMode 
                            ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700/50' 
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 border border-gray-200/50'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Input */}
              <div className={`relative rounded-2xl border ${
                darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
              } ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm overflow-hidden`}>
                
                {/* Input Tools Bar */}
                <div className={`flex items-center justify-between px-4 py-2 border-b ${
                  darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleVoiceInput}
                      className={`p-2 rounded-lg transition-all ${
                        isListening 
                          ? 'bg-red-500/20 text-red-400' 
                          : darkMode 
                            ? 'hover:bg-gray-700 text-gray-400' 
                            : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}>
                      <FileText size={16} />
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}>
                      <Code size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {inputValue.length}/2000
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Neural AI Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Text Input */}
                <div className="flex items-end space-x-4 p-4">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="🎯 Ask me anything! I'll provide diagrams, visuals, and interactive explanations..."
                      className={`w-full bg-transparent border-none outline-none resize-none text-lg placeholder-gray-400 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      rows={inputValue.split('\n').length || 1}
                      maxLength={2000}
                      disabled={isLoading || isSending}
                    />
                  </div>
                  
                  {/* Send Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubmit()}
                    disabled={!inputValue.trim() || isLoading || isSending}
                    className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      inputValue.trim() 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25' 
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isSending ? (
                      <div className="flex items-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send size={16} />
                        <span>Send</span>
                      </div>
                    )}
                    
                    {/* Animated background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl"
                      animate={{
                        opacity: [0.2, 0.8, 0.2]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.button>
                </div>

                {/* Smart Suggestions Based on Input */}
                {inputValue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`border-t ${darkMode ? 'border-gray-700/30' : 'border-gray-200/30'} p-3`}
                  >
                    <div className="flex items-center space-x-2 text-sm">
                      <Brain size={14} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI suggests: Include diagrams, visual examples, step-by-step breakdown
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Quick actions:
                  </span>
                  <div className="flex items-center space-x-2">
                    {[
                      { icon: Target, label: 'Focus Mode', action: () => setFocusMode(!focusMode) },
                      { icon: Coffee, label: 'Break Timer' },
                      { icon: TrendingUp, label: 'Progress' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={item.action}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          darkMode 
                            ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' 
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                        }`}
                      >
                        <item.icon size={14} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Powered by Neural AI
                  </span>
                  <div className="flex space-x-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <AnimatePresence>
        {focusMode && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setFocusMode(false)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50"
          >
            <Maximize2 size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4B5563' : '#D1D5DB'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6B7280' : '#9CA3AF'};
        }
      `}</style>
    </div>
  );
}

// Welcome Screen Component
interface WelcomeScreenProps {
  darkMode: boolean;
  onExampleClick: (question: string) => void;
}
const WelcomeScreen = ({ darkMode, onExampleClick }: WelcomeScreenProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="text-center py-12"
  >
    <div className="relative mb-8">
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden"
      >
        <Brain size={40} className="text-white relative z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-pulse"></div>
      </motion.div>
      
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-purple-400 rounded-full"
          style={{
            left: `${30 + i * 10}%`,
            top: `${20 + (i % 2) * 60}%`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5
          }}
        />
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Welcome to Neural Learning
      </h2>
      <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
        Experience AI-powered learning with interactive diagrams, visual explanations, and personalized insights
      </p>
    </motion.div>

    {/* Feature Cards */}
    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
      {[
        {
          icon: Layers,
          title: 'Visual Diagrams',
          description: 'Get complex concepts explained with interactive diagrams and architecture flows',
          color: 'from-blue-500 to-cyan-500'
        },
        {
          icon: Lightbulb,
          title: 'Smart Insights',
          description: 'AI analyzes your questions and provides contextual learning recommendations',
          color: 'from-yellow-500 to-orange-500'
        },
        {
          icon: Trophy,
          title: 'Gamified Learning',
          description: 'Earn XP, unlock achievements, and track your learning progress in real-time',
          color: 'from-purple-500 to-pink-500'
        }
      ].map((feature, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + idx * 0.1 }}
          className={`p-6 rounded-2xl ${
            darkMode ? 'bg-gray-800/50' : 'bg-white/50'
          } backdrop-blur-sm border ${
            darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          } hover:scale-105 transition-transform cursor-pointer`}
        >
          <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
            <feature.icon size={24} className="text-white" />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {feature.title}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>

    {/* Example Questions */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="max-w-3xl mx-auto"
    >
      <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Try asking about:
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            emoji: '🧬',
            title: 'Biology & Science',
            question: 'Explain photosynthesis with detailed diagrams'
          },
          {
            emoji: '💻',
            title: 'Programming',
            question: 'Show me React component architecture with visual flow'
          },
          {
            emoji: '⚛️',
            title: 'Physics',
            question: 'Break down quantum mechanics with visual examples'
          },
          {
            emoji: '🏛️',
            title: 'History',
            question: 'Ancient Rome: government structure and society'
          }
        ].map((example, idx) => (
          <motion.button
            key={idx}
            onClick={() => onExampleClick(example.question)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`text-left p-4 rounded-xl ${
              darkMode ? 'bg-gray-800/30 hover:bg-gray-700/30' : 'bg-gray-100/30 hover:bg-gray-200/30'
            } border ${
              darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
            } transition-all group`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{example.emoji}</span>
              <div>
                <h4 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-purple-500 transition-colors`}>
                  {example.title}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {example.question}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

// Advanced Message Component
interface AdvancedMessageComponentProps {
  message: Message;
  darkMode: boolean;
}
const AdvancedMessageComponent = ({ message, darkMode }: AdvancedMessageComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`group flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex space-x-4 max-w-4xl w-full ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        
        {/* Avatar with Status */}
        <div className="flex-shrink-0 relative">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            message.sender === 'user' 
              ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
              : 'bg-gradient-to-br from-blue-500 via-purple-500 to-green-500'
          } shadow-lg`}>
            {message.sender === 'user' ? (
              <User size={20} className="text-white" />
            ) : (
              <Bot size={20} className="text-white" />
            )}
          </div>
          {message.sender === 'ai' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
            />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 rounded-2xl overflow-hidden ${
          message.sender === 'user'
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
            : darkMode 
              ? 'bg-gray-800/50 border border-gray-700/50' 
              : 'bg-white/50 border border-gray-200/50'
        } backdrop-blur-sm shadow-lg`}>
          
          {/* Message Header */}
          <div className={`flex items-center justify-between p-4 ${
            message.sender === 'user' ? 'border-b border-white/20' : 
            darkMode ? 'border-b border-gray-700/30' : 'border-b border-gray-200/30'
          }`}>
            <div className="flex items-center space-x-3">
              <span className={`font-semibold ${
                message.sender === 'user' ? 'text-white' : 
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {message.sender === 'user' ? 'You' : 'Neural Assistant'}
              </span>
              
              {message.difficulty && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  message.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                  message.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {message.difficulty}
                </span>
              )}

              {message.readTime && (
                <div className="flex items-center space-x-1 text-xs opacity-70">
                  <Clock size={12} />
                  <span>{message.readTime} min read</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className={`p-1.5 rounded-lg hover:bg-black/10 ${
                message.sender === 'user' ? 'text-white' : 
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Bookmark size={14} />
              </button>
              <button className={`p-1.5 rounded-lg hover:bg-black/10 ${
                message.sender === 'user' ? 'text-white' : 
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* Message Body */}
          <div className="p-6">
            {message.sender === 'ai' ? (
              <div className={`prose prose-lg max-w-none ${
                darkMode ? 'prose-invert' : ''
              }`}>
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
                
                {/* Enhanced Visual Content */}
                {message.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <ImageIcon className="text-blue-400" size={18} />
                      <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        Visual Learning Aid
                      </span>
                    </div>
                    <div className="relative group/image cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                      <Image 
                        src={message.imageUrl || ''}
                        alt={`Visual representation of ${message.topic || 'topic'}`}
                        className="w-full rounded-lg shadow-lg transition-transform group-hover/image:scale-[1.02]"
                        width={800}
                        height={600}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover/image:opacity-100 transition-opacity">
                          Click to expand
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      🔍 Related to: {message.topic || 'Current Topic'}
                    </p>
                  </motion.div>
                )}

                {/* Achievements & Points */}
                {(message.pointsEarned || message.achievements) && (
                  <div className="mt-6 space-y-3">
                    {message.pointsEarned && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Star size={20} className="text-white" />
                          </div>
                          <div>
                            <p className={`font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              +{message.pointsEarned} XP Earned!
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Visual Learning Bonus Applied
                            </p>
                          </div>
                        </div>
                        <Zap className="text-yellow-500" size={20} />
                      </motion.div>
                    )}

                    {message.achievements && message.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.achievements.map((achievement: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full"
                          >
                            <Trophy size={14} className="text-purple-400" />
                            <span className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                              {achievement}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-lg leading-relaxed ${
                message.sender === 'user' ? 'text-white' : 
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {message.content}
              </p>
            )}

            {/* Tags */}
            {message.tags && message.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {message.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 text-xs rounded-full ${
                      message.sender === 'user' ? 'bg-white/20 text-white' :
                      darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-200/50 text-gray-700'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Message Footer */}
          <div className={`flex items-center justify-between px-6 py-3 ${
            message.sender === 'user' ? 'border-t border-white/20' :
            darkMode ? 'border-t border-gray-700/30' : 'border-t border-gray-200/30'
          }`}>
            <div className="flex items-center space-x-3">
              <span className={`text-xs ${
                message.sender === 'user' ? 'text-white/70' : 
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </span>
              
              {message.sender === 'ai' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setReaction(reaction === 'like' ? null : 'like')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      reaction === 'like' 
                        ? 'bg-green-500/20 text-green-400' 
                        : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button className={`p-1.5 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 text-xs opacity-70">
              <Eye size={12} />
              <span>Read</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper Functions
const getDifficultyFromInput = (input: string): 'beginner' | 'intermediate' | 'advanced' => {
  if (input.includes('basic') || input.includes('simple') || input.includes('intro')) return 'beginner';
  if (input.includes('advanced') || input.includes('complex') || input.includes('deep')) return 'advanced';
  return 'intermediate';
};

const extractTagsFromInput = (input: string): string[] => {
  const keywords = ['react', 'javascript', 'python', 'science', 'math', 'history', 'biology', 'physics'];
  return keywords.filter(keyword => input.toLowerCase().includes(keyword));
};

const generateAdvancedAIResponse = (input: string): Message => {
  const topics = ['science', 'programming', 'math', 'history', 'physics'];
  const topic = topics.find(t => input.toLowerCase().includes(t)) || 'general';
  const pointsEarned = Math.floor(Math.random() * 75) + 25;
  const achievements = [];
  
  if (input.length > 50) achievements.push('Detail-Oriented Learner');
  if (input.includes('diagram') || input.includes('visual')) achievements.push('Visual Thinker');
  if (topic !== 'general') achievements.push(`${topic.charAt(0).toUpperCase() + topic.slice(1)} Explorer`);

  const mockImageUrl = `https://source.unsplash.com/800x600/?${topic}&education&learning`;

  return {
    id: Date.now() + 1,
    sender: 'ai',
    content: generateAdvancedResponse(input, topic),
    timestamp: new Date(),
    topic: topic,
    imageUrl: mockImageUrl,
    pointsEarned: pointsEarned,
    achievements: achievements,
    difficulty: getDifficultyFromInput(input),
    readTime: Math.ceil(Math.random() * 5) + 2,
    tags: extractTagsFromInput(input),
    reactions: [
      { type: 'helpful', count: 12 },
      { type: 'insightful', count: 8 }
    ]
  };
};

const generateAdvancedResponse = (input: string, topic: string): string => {
  return `# 🎯 Advanced Learning Response

## 🚀 Interactive Architecture Overview

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Query    │───▶│  Neural Processing│───▶│  Smart Response │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Context Analysis│    │  Knowledge Base │    │  Visual Elements│
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 💡 Comprehensive Analysis

I've analyzed your question and generated a multi-layered response that includes:

### 🔍 **Core Concepts**
Your question touches on fundamental principles of **${topic}** that connect to broader learning frameworks. This topic is particularly interesting because it demonstrates the intersection of theoretical knowledge and practical application.

### 🧠 **Deep Learning Insights**
- **Conceptual Framework**: Understanding the underlying structure
- **Visual Representation**: Diagrams and charts for better comprehension  
- **Real-world Applications**: How this applies in professional contexts
- **Advanced Connections**: Links to related topics and future learning paths

### 🎮 **Interactive Learning Elements**
- **Knowledge Check**: Quick assessment questions
- **Practice Scenarios**: Real-world application exercises
- **Visual Aids**: Custom diagrams and infographics
- **Progressive Difficulty**: Adaptive content based on your level

### 🚀 **Next Steps & Recommendations**
1. **Explore Related Topics**: Dive deeper into connected concepts
2. **Practice Applications**: Try hands-on exercises
3. **Build Projects**: Apply knowledge in real scenarios
4. **Join Communities**: Connect with other learners

### 🏆 **Achievement Unlocked!**
Congratulations! You've demonstrated excellent learning curiosity. This type of question shows you're thinking critically about complex topics.

---
*💫 Enhanced with AI-powered insights, visual learning aids, and personalized recommendations*`;
}