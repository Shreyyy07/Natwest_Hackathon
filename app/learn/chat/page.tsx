'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Send, BookOpen, ArrowLeft, User, Bot, ChevronLeft, ChevronRight, Menu, Trophy, Target, Zap, Star, ImageIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import EnhancedMessageWithVisuals from '../../components/EnhancedMessageWithVisuals';
import { Message } from '../../components/types';

export default function EnhancedChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Debug: log response status
      console.log('Backend response status:', response.status);
      let data = null;
      try {
        data = await response.json();
        console.log('Backend response JSON:', data);
      } catch (jsonErr) {
        console.error('Error parsing backend response JSON:', jsonErr);
        toast.error('Error parsing backend response JSON');
      }

      if (data && data.status === 'success') {
        // Generate enhanced response with architecture diagram and image
        const enhancedResponse = await generateEnhancedResponse(input, data.response);

        // Generate image based on user prompt
        // Use Unsplash API to search for an image
        let imageUrl: string | undefined = undefined;
        try {
          const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
          const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(input)}&per_page=1&client_id=${accessKey}`);
          const unsplashData = await unsplashRes.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            imageUrl = unsplashData.results[0].urls.regular;
          }
        } catch (err) {
          console.error('Unsplash API error:', err);
        }
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          content: enhancedResponse.content,
          timestamp: new Date(),
          topic: input,
          imageUrl: imageUrl,
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
      } else {
        console.warn('Backend did not return success:', data);
        toast.error('Backend did not return a successful response');
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

  // Auto-scroll to bottom with a small delay to ensure proper rendering
  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(scrollTimeout);
  }, [messages]);

  // Initialize with URL prompt (run only once)
  const hasInitializedRef = useRef(false);
  const hasProcessedPromptRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInputValue(prompt);
      hasInitializedRef.current = true;
    }
  }, [searchParams]);

  // Trigger handleSubmit after inputValue is set from URL prompt
  useEffect(() => {
    if (
      hasInitializedRef.current &&
      inputValue &&
      !hasProcessedPromptRef.current
    ) {
      handleSubmit(inputValue);
      hasProcessedPromptRef.current = true;
    }
    // Only run when inputValue changes after URL prompt
  }, [inputValue, handleSubmit]);

  // Generate relevant image for topic
  const generatePromptImage = async (prompt: string): Promise<string | null> => {
    try {
      // Clean up prompt for better image results
      const cleanPrompt = prompt.toLowerCase()
        .replace(/[^\w\s]/gi, '') // Remove special characters
        .replace(/\s+/g, ','); // Use comma for multi-keyword search
      // Use basic Unsplash Source API format
      const unsplashUrl = `https://source.unsplash.com/800x600/?${cleanPrompt}`;
      return unsplashUrl;
    } catch (error) {
      console.error('Error generating prompt image:', error);
      return null;
    }
  };

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
    <div className="min-h-screen bg-[#1E1F23] text-white flex">
      {/* Left Sidebar like ChatGPT */}
      <div className="w-[260px] bg-[#131314] flex flex-col border-r border-gray-800 hidden md:block">
        <div className="p-3 flex items-center space-x-2 border-b border-gray-800">
          <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Bot size={16} />
          </div>
          <h1 className="text-base font-medium text-white">Learning Assistant</h1>
        </div>
        
        <div className="p-3">
          <button
            onClick={() => router.push('/learn')}
            className="w-full flex items-center space-x-2 py-2 px-3 bg-transparent hover:bg-gray-800 rounded-md text-gray-200 text-sm transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to Learning</span>
          </button>
        </div>
        
        <div className="p-3 border-t border-gray-800 mt-auto">
          {user && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-sm text-gray-300">{user.firstName || 'User'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Collapsible Sidebar */}
        {/* Mobile menu button - only shows on mobile */}
        <div className="md:hidden absolute top-3 left-3 z-50">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-md transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* Mobile sidebar - shows when toggled */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setSidebarCollapsed(true)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ duration: 0.3 }}
                className="w-[260px] h-full bg-[#131314] flex flex-col border-r border-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 flex items-center space-x-2 border-b border-gray-800">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <h1 className="text-base font-medium text-white">Learning Assistant</h1>
                </div>
                
                <div className="p-3">
                  <button
                    onClick={() => router.push('/learn')}
                    className="w-full flex items-center space-x-2 py-2 px-3 bg-transparent hover:bg-gray-800 rounded-md text-gray-200 text-sm transition-colors"
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Learning</span>
                  </button>
                </div>
                
                <div className="p-3 border-t border-gray-800 mt-auto">
                  {user && (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="text-sm text-gray-300">{user?.firstName || 'User'}</span>
                      <SignOutButton>
                        <button className="ml-auto text-gray-400 hover:text-gray-200 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </SignOutButton>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
  <div className="flex-1 flex flex-col h-full">
          {/* Chat Header - Sticky within the main content area */}
          <div className="border-b border-gray-800 p-3 flex items-center md:justify-between md:px-4 sticky top-0 z-10 bg-[#1E1F23]">
            <div className="flex-1 flex justify-center md:justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <h2 className="text-base font-medium text-white">AI Learning Assistant</h2>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto" id="messages-container">
            <div className="max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-8 max-w-md px-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot size={24} />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">How can I help you learn today?</h3>
                    <p className="text-gray-400 mb-5">Ask me anything and I&apos;ll provide visual explanations and diagrams.</p>
                    
                    {/* Example prompts */}
                    <div className="space-y-2">
                      {[
                        { prompt: "Explain photosynthesis with diagrams" },
                        { prompt: "Show me how React works with architecture" },
                        { prompt: "Visualize calculus concepts" },
                        { prompt: "Ancient Rome architecture and culture" }
                      ].map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInputValue(example.prompt)}
                          className="w-full text-left p-3 border border-gray-700 rounded-md bg-[#202123] hover:bg-gray-800 transition-colors text-sm text-gray-200"
                        >
                          {example.prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {messages.map((message) => (
                    <EnhancedMessageWithVisuals key={message.id} message={message} />
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Like ChatGPT */}
          <div className="border-t border-gray-800 p-4 md:p-4 sticky bottom-0 bg-[#1E1F23] z-10">
            <div className="max-w-3xl mx-auto relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for diagrams and visual explanations..."
                className="w-full bg-[#343541] border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-gray-400 transition-colors text-sm"
                rows={1}
                disabled={isLoading || isSending}
                style={{ paddingRight: '40px' }}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!inputValue.trim() || isLoading || isSending}
                className="absolute right-3 bottom-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
              <p className="text-gray-500 text-xs mt-2 text-center">
                AI Learning Assistant may produce inaccurate information. Verify important content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Component - Using our enhanced component instead
// const EnhancedMessageWithVisuals = ({ message }: { message: Message }) => { ... };

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
  const diagrams: { [key: string]: string; programming: string; science: string; math: string; history: string; general: string } = {
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
  const titles: { [key: string]: string; science: string; programming: string; math: string; history: string; design: string; business: string; general: string } = {
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
  const milestones: { [key: string]: string; science: string; programming: string; math: string; history: string; design: string; business: string; general: string } = {
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
  const tips: { [key: string]: string; science: string; programming: string; math: string; history: string; design: string; business: string; general: string } = {
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
  const concepts: { [key: string]: string; science: string; programming: string; math: string; history: string; design: string; business: string; general: string } = {
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
  const examples: { [key: string]: string; science: string; programming: string; math: string; history: string; design: string; business: string; general: string } = {
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
  const applications: { [key: string]: string; science: string; programming: string; math: string; history: string; design: string; business: string; general: string } = {
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
