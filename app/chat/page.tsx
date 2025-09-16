'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Send, Mic, Upload, BookOpen, Trophy, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import PointsDisplay from '@/components/PointsDisplay';
import QuizComponent from '@/components/QuizComponent';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type?: 'text' | 'quiz';
  quizData?: any[];
  topic?: string;
}

interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  diagram?: string;
}

export default function ChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with URL prompt if provided
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setInputValue(prompt);
      handleSubmit(prompt);
    }
  }, [searchParams]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('tayyari-chat-messages-v2');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('tayyari-chat-messages-v2', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSubmit = async (customInput?: string) => {
    const input = customInput || inputValue;
    if (!input.trim()) return;

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
      // Process with your existing content processing
      const payload = JSON.parse(localStorage.getItem('chatPayload') || '{}');
      
      const response = await fetch('http://localhost:5000/process-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: input,
          files: payload.files || []
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          content: data.response,
          timestamp: new Date(),
          topic: input.substring(0, 50) // Store topic for quiz context
        };

        setMessages(prev => [...prev, aiMessage]);
        setCurrentTopic(input.substring(0, 50));
      } else {
        throw new Error(data.error || 'Failed to process content');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process your request');
    } finally {
      setIsLoading(false);
    }
  };

  // **THIS IS THE QUIZ SUBMISSION LOGIC YOU NEED TO MODIFY**
  const handleQuizGeneration = async (context: string) => {
    try {
      setIsLoading(true);
      
const response = await fetch('http://localhost:5000/interactive-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: context,
    user_id: user?.id // THIS IS CRUCIAL - sends user ID to backend
  })
});

      const data = await response.json();

      if (data.status === 'success' && data.questions) {
        setCurrentQuizQuestions(data.questions);
        setShowQuiz(true);
        
        // Award points for generating quiz (handled in backend)
        toast.success('Quiz generated! Complete it to earn points! 🎯');
      } else {
        throw new Error('Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // **CRITICAL: Quiz Submission with Points Integration**
  const handleQuizSubmission = async (answers: string[], correctCount: number, totalQuestions: number) => {
    if (!user?.id) {
      toast.error('Please sign in to earn points');
      return;
    }

    const score = correctCount / totalQuestions;

    try {
      const response = await fetch('http://localhost:5000/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          score: score,
          quiz_data: {
            topic: currentTopic || 'General Quiz',
            questions_count: totalQuestions,
            timestamp: new Date().toISOString(),
            answers: answers
          }
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Trigger floating points animation
        if ((window as any).showFloatingPoints) {
          const message = result.points_awarded.activity_type === 'perfect_quiz' 
            ? 'Perfect Score! 🎯' 
            : result.points_awarded.is_first_quiz 
              ? 'First Quiz Bonus! 🎉' 
              : 'Quiz Complete! ✅';
              
          (window as any).showFloatingPoints(
            result.points_awarded.points_earned,
            message
          );
        }

        // Show special celebration for first quiz
        if (result.points_awarded.is_first_quiz) {
          toast.success('🎉 Congratulations on your first quiz! Bonus points earned!');
        } else {
          toast.success(`Great job! You earned ${result.points_awarded.points_earned} points! 🎯`);
        }

        console.log('Points awarded:', result.points_awarded);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz results');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Points Display at Top */}
      {user && (
        <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
          <div className="container mx-auto p-4">
            <PointsDisplay />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.push('/learn')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Learning</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <BookOpen className="text-blue-500" size={24} />
            <h1 className="text-2xl font-bold">AI Learning Chat</h1>
          </div>
        </div>

        {/* Quiz Modal */}
        <AnimatePresence>
          {showQuiz && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <Trophy className="text-yellow-500" />
                    <span>Interactive Quiz - Earn Points!</span>
                  </h2>
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <QuizComponent 
                  questions={currentQuizQuestions} 
                  topic={currentTopic}
                  onComplete={handleQuizSubmission}  // Connect to points system
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="space-y-6 mb-6 min-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Start learning by asking a question or uploading content!</p>
              <p className="text-sm">Complete quizzes to earn points and level up! 🎯</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-4xl p-4 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <div>
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown 
                          components={{
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold text-blue-400 mb-3 flex items-center space-x-2">
                                {children}
                              </h2>
                            ),
                            p: ({ children }) => <p className="text-gray-300 mb-2">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 space-y-1">{children}</ul>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => handleQuizGeneration(message.topic || message.content.substring(0, 200))}
                          disabled={isLoading}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trophy size={16} />
                          <span>Take Quiz & Earn Points</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            // Add explain more functionality
                            toast.info('Explain more feature coming soon!');
                          }}
                          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          <BookOpen size={16} />
                          <span>Learn More</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white">{message.content}</p>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-gray-700/50">
          <div className="flex space-x-4 items-end max-w-4xl mx-auto">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything to learn and earn points..."
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            <button
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3 max-w-4xl mx-auto">
            <button
              onClick={() => setInputValue('Explain quantum physics basics')}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
            >
              🔬 Science
            </button>
            <button
              onClick={() => setInputValue('Teach me JavaScript fundamentals')}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
            >
              💻 Programming
            </button>
            <button
              onClick={() => setInputValue('Help me learn calculus')}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
            >
              📊 Math
            </button>
            <button
              onClick={() => setInputValue('Explain world history timeline')}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
            >
              🏛️ History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
