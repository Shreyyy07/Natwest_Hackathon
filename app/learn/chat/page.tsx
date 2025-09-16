'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Send, BookOpen, ArrowLeft, User, Bot, ChevronLeft, ChevronRight, Menu, Trophy, Target, Zap, Star, ImageIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
}

export default function EnhancedChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with URL prompt
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !isSending) {
      setInputValue(prompt);
      handleSubmit(prompt);
    }
  }, [searchParams]);

  // Generate relevant image for topic
  const generateTopicImage = async (topic: string): Promise<string | null> => {
  try {
    // Clean up topic for better image results
    const cleanTopic = topic.toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '+'); // Replace spaces with +
    
    // Unsplash Source API (free, no API key needed)
    const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(cleanTopic)}&auto=format&fit=crop&w=800&q=80`;
    
    return unsplashUrl;
  } catch (error) {
    console.error('Error generating topic image:', error);
    return null;
  }
};

  // Enhanced submit with architecture diagrams and images
  const handleSubmit = useCallback(async (customInput?: string) => {
    const input = customInput || inputValue;
    if (!input.trim() || isSending) return;

    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    setIsSending(true);
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call your backend API
      const response = await fetch('http://localhost:5000/process-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: input,
          files: []
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Generate enhanced response with architecture diagram and image
        const enhancedResponse = await generateEnhancedResponse(input, data.response);
        
        // Generate topic image
        const topicImage = await generateTopicImage(enhancedResponse.topic);
        
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          content: enhancedResponse.content,
          timestamp: new Date(),
          topic: enhancedResponse.topic,
          imageUrl: topicImage || undefined,
          pointsEarned: enhancedResponse.pointsEarned,
          achievements: enhancedResponse.achievements
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Show achievement notifications
        if (enhancedResponse.achievements.length > 0) {
          enhancedResponse.achievements.forEach(achievement => {
            toast.success(`🏆 Achievement Unlocked: ${achievement}`, {
              duration: 4000,
              className: 'bg-gradient-to-r from-yellow-500 to-orange-500'
            });
          });
        }

        // Update recent learning
        updateRecentLearning(input, enhancedResponse.content);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Oops! Something went wrong. Try again!');
    } finally {
      setIsLoading(false);
      // Debounce to prevent rapid submissions
      submitTimeoutRef.current = setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }
  }, [inputValue, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const updateRecentLearning = (userMessage: string, aiResponse: string) => {
    const LOCALSTORAGE_KEY = "tayyari-chat-messages-v2";
    try {
      const existing = localStorage.getItem(LOCALSTORAGE_KEY);
      const messages = existing ? JSON.parse(existing) : [];
      
      const newMessages = [
        ...messages,
        { id: Date.now(), sender: 'user', content: userMessage, timestamp: new Date() },
        { id: Date.now() + 1, sender: 'ai', content: aiResponse, timestamp: new Date() }
      ];
      
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error updating recent learning:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-8">
      <div className="flex h-[calc(100vh-2rem)]"> {/* Reduced height calculation */}
        
        {/* Collapsible Sidebar */}
        <AnimatePresence>
          <motion.div 
            initial={false}
            animate={{ 
              width: sidebarCollapsed ? 60 : 320,
              opacity: sidebarCollapsed ? 0.7 : 1 
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex flex-col relative"
          >
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-1 z-10 bg-gray-700 hover:bg-gray-600 text-white p-1 rounded-full border border-gray-600 transition-colors" // Reduced top position
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Sidebar Content - Compact */}
            <div className="p-2 border-b border-gray-700/50"> {/* Reduced padding */}
              <div className={`flex items-center justify-between mb-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                {!sidebarCollapsed && (
                  <h2 className="text-base font-semibold text-white">Learning Hub</h2> 
                )}
                {sidebarCollapsed && (
                  <Menu size={18} className="text-gray-400" />
                )}
              </div>
              
              {/* User Profile - Compact */}
              <div className={`flex items-center space-x-2 p-2 bg-gray-700/30 rounded-lg ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={12} />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {user?.firstName || 'Learner'}
                      </p>
                      <p className="text-xs text-gray-400">🎯 Level Up Mode</p>
                    </div>
                    <SignOutButton>
                      <button className="text-gray-400 hover:text-red-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </SignOutButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header - Reduced padding */}
          <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 p-2"> {/* Reduced padding */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/learn')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Back to Learning</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">AI Learning Companion</h1>
                  <p className="text-xs text-gray-400">🚀 Visual Learning Experience!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area - Compact */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2"> {/* Reduced padding */}
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-6"> {/* Reduced padding */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bot size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">🎯 Ready for Visual Learning?</h3>
                  <p className="text-gray-400 mb-4">Ask me anything and get diagrams + images!</p>
                  
                  {/* Quick Start Examples - Compact */}
                  <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      { emoji: "🔬", title: "Science", prompt: "Explain photosynthesis with diagrams" },
                      { emoji: "💻", title: "Programming", prompt: "Show me how React works with architecture" },
                      { emoji: "📊", title: "Math", prompt: "Visualize calculus concepts" },
                      { emoji: "🏛️", title: "History", prompt: "Ancient Rome architecture and culture" }
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputValue(example.prompt)}
                        className="bg-gray-800/50 hover:bg-gray-700/50 p-3 rounded-lg border border-gray-600 transition-all hover:scale-105 text-left"
                      >
                        <div className="text-xl mb-1">{example.emoji}</div>
                        <div className="text-white font-medium text-sm">{example.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <EnhancedMessageWithVisuals key={message.id} message={message} />
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-3 max-w-3xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4">
                      <div className="flex space-x-2 mb-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-xs text-gray-400">🧠 Creating diagrams & finding visuals...</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Compact */}
          <div className="border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm p-2"> {/* Reduced padding */}
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-2"> {/* Reduced gap */}
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="🎯 Ask for diagrams and visual explanations..."
                  className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm" // Reduced text size
                  rows={1}
                  disabled={isLoading || isSending}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!inputValue.trim() || isLoading || isSending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg transition-all hover:scale-105 flex items-center justify-center min-w-[45px]" // Reduced size
                >
                  <Send size={12} /> {/* Reduced icon size */}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Message Component with Architecture Diagrams and Images
const EnhancedMessageWithVisuals = ({ message }: { message: Message }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`flex space-x-3 max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.sender === 'user' 
            ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
            : 'bg-gradient-to-br from-blue-500 to-green-500'
        }`}>
          {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 rounded-2xl p-4 ${
          message.sender === 'user'
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
            : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-100'
        }`}>
          {message.sender === 'ai' ? (
            <div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
              
              {/* Related Topic Image at Bottom */}
              {message.imageUrl && (
  <div className="mt-4 p-3 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-lg border border-gray-600/30">
    <div className="flex items-center space-x-2 mb-2">
      <ImageIcon className="text-blue-400" size={16} />
      <span className="text-sm font-medium text-blue-300">Visual Learning Aid</span>
    </div>
    <img 
      src={message.imageUrl} // <- This displays your Unsplash image
      alt={`Visual representation of ${message.topic || 'topic'}`}
      className="w-full rounded-lg shadow-lg hover:scale-105 transition-transform cursor-pointer"
      loading="lazy"
      onError={(e) => {
        // Fallback if image fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
    <p className="text-xs text-gray-400 mt-2 text-center">
      🔍 Related to: {message.topic || 'Current Topic'}
    </p>
  </div>
)}

              {/* Gamification Elements */}
              {message.pointsEarned && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="text-yellow-400" size={16} />
                      <span className="text-yellow-400 font-semibold">+{message.pointsEarned} XP Earned!</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="text-blue-400" size={14} />
                      <span className="text-xs text-gray-300">Visual Learning Bonus</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Achievement Badges */}
              {message.achievements && message.achievements.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {message.achievements.map((achievement, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                        <div className="flex items-center space-x-1">
                          <Trophy size={12} className="text-purple-400" />
                          <span className="text-xs font-medium text-purple-300">{achievement}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          <div className="mt-2 text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Generate enhanced response with architecture diagrams and comprehensive content
const generateEnhancedResponse = async (input: string, baseResponse: string) => {
  const topics = ['science', 'programming', 'math', 'history', 'architecture', 'design', 'business'];
  const topic = topics.find(t => input.toLowerCase().includes(t)) || extractTopicFromInput(input);
  
  const basePointsEarned = Math.floor(Math.random() * 50) + 30;
  const achievements = [];
  
  // Add contextual achievements
  if (input.length > 50) achievements.push('Detail-Oriented Questioner');
  if (input.includes('?')) achievements.push('Curious Explorer');
  if (input.includes('diagram') || input.includes('visual')) achievements.push('Visual Learner');
  if (topic !== 'general') achievements.push(`${topic.charAt(0).toUpperCase() + topic.slice(1)} Enthusiast`);
  
  const architectureDiagram = generateArchitectureDiagram(topic, input);
  
  const enhancedContent = `# 🎯 ${getEngagingTitle(topic, input)}

${architectureDiagram}

## 🚀 Comprehensive Learning Experience

${baseResponse}

### 🎮 **Interactive Challenge Unlocked!**
- **Difficulty Level**: ${getDifficultyLevel(input)}
- **Knowledge Points**: +${basePointsEarned} XP
- **Visual Elements**: Diagram + Topic Image included
- **Next Milestone**: ${getNextMilestone(topic)}

### 🧠 **Deep Dive Insights**
${generateDeepInsights(input, topic)}

### 🔥 **Pro Learning Tips**
${generateProTips(topic)}

### 🎯 **Practice Challenge**
${generatePracticeChallenge(topic, input)}

---
*🏆 Visual learning activated! Check the architecture diagram above and topic image below for enhanced understanding.*`;

  return {
    content: enhancedContent,
    topic: topic,
    pointsEarned: basePointsEarned,
    achievements: achievements
  };
};

// Generate ASCII architecture diagrams based on topic
const generateArchitectureDiagram = (topic: string, input: string) => {
  const diagrams = {
    programming: `
## 📐 **Architecture Overview: React Component Flow**

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  State Manager  │───▶│   UI Renderer   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Event Handler │    │   Props Flow    │    │   DOM Updates   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`
`,
    science: `
## 🔬 **Scientific Process Diagram**

\`\`\`
    ┌──────────────┐
    │  Observation │
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  Hypothesis  │
    └──────┬───────┘
           │
    ┌──────▼───────┐     ┌─────────────┐
    │ Experiment   │────▶│   Analysis  │
    └──────────────┘     └─────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  Conclusion  │
                         └──────────────┘
\`\`\`
`,
    math: `
## 📊 **Mathematical Concept Map**

\`\`\`
           ┌─────────────┐
           │   Problem   │
           └──────┬──────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼─────┐ ┌───▼────┐ ┌───▼────┐
│  Method 1 │ │Method 2│ │Method 3│
└─────┬─────┘ └───┬────┘ └───┬────┘
      │           │           │
      └───────────┼───────────┘
                  │
           ┌──────▼──────┐
           │  Solution   │
           └─────────────┘
\`\`\`
`,
    history: `
## 🏛️ **Historical Timeline Structure**

\`\`\`
Past ←─────────────────────────────────────→ Present
  │                   │                   │
┌─▼─┐               ┌─▼─┐               ┌─▼─┐
│Era│               │Era│               │Era│
│ 1 │──────────────▶│ 2 │──────────────▶│ 3 │
└───┘               └───┘               └───┘
  │                   │                   │
  ▼                   ▼                   ▼
Events              Events              Events
Causes              Causes              Causes
Effects             Effects             Effects
\`\`\`
`,
    general: `
## 🎯 **Learning Framework**

\`\`\`
     ┌─────────────┐
     │   QUESTION  │
     └──────┬──────┘
            │
    ┌───────▼───────┐
    │   RESEARCH    │
    └───────┬───────┘
            │
    ┌───────▼───────┐
    │   ANALYZE     │
    └───────┬───────┘
            │
    ┌───────▼───────┐
    │   UNDERSTAND  │
    └───────┬───────┘
            │
    ┌───────▼───────┐
    │    APPLY      │
    └───────────────┘
\`\`\`
`
  };
  
  return diagrams[topic] || diagrams.general;
};

// Helper functions for engaging content
const extractTopicFromInput = (input: string): string => {
  const keywords = {
    'react': 'programming',
    'javascript': 'programming',
    'python': 'programming',
    'photosynthesis': 'science',
    'biology': 'science',
    'chemistry': 'science',
    'calculus': 'math',
    'algebra': 'math',
    'rome': 'history',
    'war': 'history',
    'design': 'design',
    'business': 'business'
  };
  
  const lowerInput = input.toLowerCase();
  for (const [keyword, topic] of Object.entries(keywords)) {
    if (lowerInput.includes(keyword)) return topic;
  }
  return 'general';
};

const getEngagingTitle = (topic: string, input: string) => {
  const titles = {
    science: 'Scientific Discovery Mission',
    programming: 'Code Architecture Quest',
    math: 'Mathematical Exploration',
    history: 'Time Travel Journey',
    design: 'Creative Design Workshop',
    business: 'Strategic Business Analysis',
    general: 'Knowledge Discovery Adventure'
  };
  return titles[topic] || titles.general;
};

const getDifficultyLevel = (input: string) => {
  if (input.includes('basic') || input.includes('simple') || input.includes('intro')) return '🟢 Beginner';
  if (input.includes('advanced') || input.includes('complex') || input.includes('deep')) return '🔴 Expert';
  return '🟡 Intermediate';
};

const getNextMilestone = (topic: string) => {
  const milestones = {
    science: 'Unlock "Lab Master" badge at 500 XP',
    programming: 'Achieve "Code Architect" status at 750 XP',
    math: 'Reach "Number Wizard" level at 600 XP',
    history: 'Become a "Time Guardian" at 550 XP',
    design: 'Unlock "Creative Genius" at 650 XP',
    business: 'Reach "Strategy Expert" at 700 XP',
    general: 'Achieve "Knowledge Master" rank at 400 XP'
  };
  return milestones[topic] || milestones.general;
};

const generateDeepInsights = (input: string, topic: string) => {
  return `💡 **Key Connections**: This concept links to ${getRelatedConcepts(topic)}
  
🔗 **Real-World Applications**: See how this applies in ${getRealWorldExamples(topic)}
  
🚀 **Future Implications**: This knowledge opens doors to ${getFutureApplications(topic)}`;
};

const generateProTips = (topic: string) => {
  const tips = {
    science: '🔬 Connect theories to experiments\n🌍 Look for patterns in nature\n📊 Use visual models and simulations',
    programming: '💻 Practice with real projects\n🔍 Debug systematically\n🚀 Learn by building, not just reading',
    math: '📐 Visualize abstract concepts\n🔢 Practice mental calculations\n📊 Apply to real-world problems',
    history: '📚 Connect events chronologically\n🗺️ Study maps and timelines\n🎭 Understand human motivations',
    design: '🎨 Study great examples\n✏️ Sketch ideas quickly\n👥 Get feedback early and often',
    business: '📈 Analyze market trends\n💼 Study successful case studies\n🤝 Network with industry experts',
    general: '🧠 Ask deeper "why" questions\n📝 Take visual notes\n🔄 Teach others to solidify understanding'
  };
  return tips[topic] || tips.general;
};

const generatePracticeChallenge = (topic: string, input: string) => {
  return `🎯 **Your Challenge**: Try to explain this concept to someone else in under 2 minutes
  
🧩 **Bonus Task**: Find 3 real-world examples of this concept in action
  
🔄 **Reflection**: How does this connect to something you learned before?`;
};

const getRelatedConcepts = (topic: string) => {
  const concepts = {
    science: 'physics, chemistry, and environmental science',
    programming: 'algorithms, data structures, and system design',
    math: 'statistics, geometry, and applied mathematics',
    history: 'sociology, politics, and cultural studies',
    design: 'psychology, art theory, and user experience',
    business: 'economics, marketing, and organizational behavior',
    general: 'critical thinking, problem-solving, and analytical reasoning'
  };
  return concepts[topic] || concepts.general;
};

const getRealWorldExamples = (topic: string) => {
  const examples = {
    science: 'medicine, technology, and environmental solutions',
    programming: 'web development, mobile apps, and AI systems',
    math: 'finance, engineering, and data analysis',
    history: 'current politics, social movements, and cultural trends',
    design: 'user interfaces, marketing, and product development',
    business: 'startups, corporate strategy, and market analysis',
    general: 'daily decision-making and problem-solving'
  };
  return examples[topic] || examples.general;
};

const getFutureApplications = (topic: string) => {
  const applications = {
    science: 'breakthrough research, innovation, and discovery',
    programming: 'advanced software engineering and system architecture',
    math: 'data science, machine learning, and quantitative analysis',
    history: 'understanding future trends and making informed decisions',
    design: 'creative leadership and innovative product development',
    business: 'strategic planning and entrepreneurial ventures',
    general: 'lifelong learning and intellectual growth'
  };
  return applications[topic] || applications.general;
};
