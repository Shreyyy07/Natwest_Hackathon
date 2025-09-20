'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import {
  Bot,
  Send,
  User as UserIcon,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Plus,
  Trophy,
  Trash2,
  GitBranch,
  Code,
  PenLine,
  Brain,
  Settings,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type mermaidType from 'mermaid';
import { Message } from '../../components/types';

// ----------------------
// Utils
// ----------------------
const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  '/api/process-content';

// ----------------------
// UI Notification System
// ----------------------
const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'achievement' }>
  >([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'achievement' = 'success') => {
    const id = uuid();
    setToasts(prev => [...prev, { id, message, type }]);
    const timeout = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    (window as any).notify = addToast;
    return () => {
      (window as any).notify = undefined;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <div className="fixed top-6 right-6 z-[100] space-y-3">
        <AnimatePresence initial={false}>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              role="status"
              aria-live="polite"
              className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-base font-medium border ${
                toast.type === 'success' 
                  ? 'bg-white border-slate-200 text-slate-800'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {toast.type === 'achievement' && <Trophy size={18} className="text-amber-500" />}
              {toast.type === 'success' && <Check size={18} className="text-emerald-500" />}
              {toast.type === 'error' && <span className="text-red-500 font-bold" aria-hidden>!</span>}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

const notify = (message: string, type: 'success' | 'error' | 'achievement' = 'success') => {
  if (typeof window !== 'undefined' && (window as any).notify) {
    (window as any).notify(message, type);
  }
};

// ----------------------
// Mermaid Diagram Component (lazy-loaded)
// ----------------------
const MermaidDiagram = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let mermaid: typeof mermaidType | null = null;

    (async () => {
      try {
        const m = (await import('mermaid')).default;
        if (!isMounted) return;

        mermaid = m;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#f8fafc',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#e2e8f0',
            lineColor: '#94a3b8',
            background: '#ffffff',
            mainBkg: '#ffffff',
          },
        });

        if (!ref.current || !chart) return;

        const id = `mermaid-${uuid()}`;
        mermaid
          .render(id, chart)
          .then(({ svg }) => {
            if (ref.current) ref.current.innerHTML = svg;
          })
          .catch(() => {
            if (ref.current) {
              ref.current.innerHTML =
                '<p class="text-slate-400 text-sm p-4">Could not render diagram.</p>';
            }
          });
      } catch {
        if (ref.current) {
          ref.current.innerHTML =
            '<p class="text-slate-400 text-sm p-4">Could not render diagram.</p>';
        }
      }
    })();

    return () => {
      isMounted = false;
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [chart]);

  return <div ref={ref} className="[&>svg]:w-full [&>svg]:h-auto text-slate-800" />;
};

// ----------------------
// Code Block Component
// ----------------------
const CodeBlock = memo(({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeText = useMemo(
    () => (Array.isArray(children) ? children.join('') : String(children || '')),
    [children]
  );

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[0.94em] font-mono">
        {children}
      </code>
    );
  }

  const language = (className || '').replace('language-', '') || 'text';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setIsCopied(true);
      notify('Copied to clipboard');
      setTimeout(() => setIsCopied(false), 1600);
    } catch {
      notify('Failed to copy', 'error');
    }
  };

  return (
    <div className="group relative my-5 rounded-xl border border-slate-200 bg-slate-50/60">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          aria-label={isCopied ? 'Code copied' : 'Copy code to clipboard'}
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[0.95rem] overflow-x-auto font-mono leading-relaxed" {...props}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

// ----------------------
// Markdown Rendering Components
// ----------------------
const markdownComponents = {
  h1: (props: any) => <h1 {...props} className="text-4xl font-bold text-slate-900 mt-8 mb-5" />,
  h2: (props: any) => <h2 {...props} className="text-3xl font-semibold text-slate-900 mt-7 mb-4 border-b border-slate-200 pb-3" />,
  h3: (props: any) => <h3 {...props} className="text-2xl font-semibold text-slate-900 mt-6 mb-3" />,
  p: (props: any) => <p {...props} className="text-slate-700 leading-relaxed my-4 text-[1.01rem]" />,
  ul: (props: any) => <ul {...props} className="list-disc list-outside space-y-2.5 text-slate-700 my-4 ml-6" />,
  ol: (props: any) => <ol {...props} className="list-decimal list-outside space-y-2.5 text-slate-700 my-4 ml-6" />,
  li: (props: any) => <li {...props} className="pl-2 text-[1.01rem]" />,
  a: (props: any) => (
    <a
      {...props}
      className="text-blue-600 hover:underline underline-offset-2 decoration-blue-400"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-slate-300 pl-5 my-5 text-slate-600 italic text-base">
      {props.children}
    </blockquote>
  ),
  code: CodeBlock as any,
};

// ----------------------
// Main Chat Interface
// ----------------------
export default function ElegantChat() {
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Persist chat to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tayyari.chat');
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        const revived: Message[] = parsed.map(m => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }));
        setMessages(revived);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tayyari.chat', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Autoscroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Inject prompt from query param
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !messages.length) {
      setInputValue(prompt);
      const t = setTimeout(() => handleSubmit(prompt), 400);
      return () => clearTimeout(t);
    }
  }, [searchParams, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize input
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [inputValue, isSending]);

  const handleSubmit = useCallback(async (customInput?: string) => {
    const input = (customInput ?? inputValue).trim();
    if (!input || isSending) return;

    setIsSending(true);
    setShowQuickActions(false);

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Abort any in-flight request
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/process-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: input, files: [] }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();

      if (data?.status === 'success') {
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          content: data.response,
          mermaidChart: data.mermaidChart,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        notify('Sorry, an error occurred. Please try again.', 'error');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        notify('Connection failed. Please check your network.', 'error');
      }
    } finally {
      setIsLoading(false);
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter to send, Shift+Enter for newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      // Ctrl/Cmd+K to toggle quick actions
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickActions(prev => !prev);
      }
    },
    [handleSubmit]
  );

  // ----------------------
  // Chat Message Component
  // ----------------------
  const ChatMessage = memo(({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    const [showVisuals, setShowVisuals] = useState(!!(message as any).mermaidChart);

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-start gap-4 md:gap-5 my-6 md:my-8"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
            isUser ? 'bg-slate-700' : 'bg-slate-800'
          }`}
          aria-hidden
        >
          {isUser ? <UserIcon size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        <div className="flex-1 max-w-4xl">
          <div className="prose max-w-none text-slate-800">
            <ReactMarkdown components={markdownComponents as any}>
              {message.content}
            </ReactMarkdown>
          </div>

          {!isUser && (message as any).mermaidChart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="mt-4"
            >
              <button
                type="button"
                onClick={() => setShowVisuals(v => !v)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                <GitBranch size={16} />
                <span>{showVisuals ? 'Hide' : 'Show'} Flowchart</span>
              </button>
            </motion.div>
          )}

          {showVisuals && !isUser && (message as any).mermaidChart && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '16px' }}
              className="bg-white border border-solid border-slate-200/80 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="p-5">
                <MermaidDiagram chart={(message as any).mermaidChart as string} />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  });
  ChatMessage.displayName = 'ChatMessage';

  // ----------------------
  // Empty State
  // ----------------------
  const EmptyState = () => (
    <div className="text-center py-20 md:py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="max-w-2xl mx-auto"
      >
        <div className="w-24 h-24 bg-slate-800 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-md">
          <Sparkles size={48} className="text-white" />
        </div>

        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Learning Starts Here
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          Ask me anything. I can help you understand complex topics, visualize data, and more.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
          {[
            { title: 'Explain a Concept', prompt: "Explain quantum computing to me like I'm five." },
            { title: 'Visualize a Process', prompt: 'Visualize the process of photosynthesis for me.' },
            { title: 'Write Code', prompt: 'Show me a Python code example for a simple web scraper.' },
            { title: 'Draft Content', prompt: 'Draft an email to my team about the new project timeline.' },
          ].map((item, index) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.06 }}
              onClick={() => handleSubmit(item.prompt)}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.99] transition-all text-left"
              type="button"
            >
              <div className="font-semibold text-slate-800">{item.title}</div>
              <div className="text-sm text-slate-500 mt-1">{item.prompt}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-slate-200/60">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="flex items-center gap-3">
                <Bot size={24} className="text-slate-800" />
                <span className="font-bold text-xl text-slate-900">Tayyari</span>
              </div>
              {user && (
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 text-base text-slate-600 px-3.5 py-2 bg-white border border-slate-200/80 rounded-lg"
                    title={`Welcome, ${user.firstName ?? ''}`}
                  >
                    <UserIcon size={16} className="text-slate-500" />
                    <span className="font-medium text-slate-800">{user.firstName}</span>
                  </div>
                  <button className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Open settings">
                    <Settings size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="px-6 pt-8 pb-44 md:pb-48 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)]">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div role="log" aria-live="polite" aria-relevant="additions">
                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 md:gap-5 my-6 md:my-8"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-slate-500">
                      <Loader2 size={20} className="animate-spin" aria-hidden />
                      <span className="text-base">Generating response...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-slate-50/0">
            <div className="max-w-4xl mx-auto px-6 pb-6 pt-8">
              <div className="relative">
                <AnimatePresence initial={false}>
                  {showQuickActions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 w-full grid grid-cols-2 md:grid-cols-4 gap-3 mb-3"
                    >
                      <button
                        type="button"
                        onClick={() => setInputValue('Explain... ')}
                        className="quick-action-btn"
                      >
                        <Brain size={16} />
                        Explain
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue('Write code for... ')}
                        className="quick-action-btn"
                      >
                        <Code size={16} />
                        Write Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue('Draft a... ')}
                        className="quick-action-btn"
                      >
                        <PenLine size={16} />
                        Draft Content
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessages([]);
                          notify('Chat cleared');
                        }}
                        className="quick-action-btn !text-red-500 hover:!bg-red-50 hover:!border-red-200"
                      >
                        <Trash2 size={16} />
                        Clear Chat
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuickActions(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
                    aria-label={showQuickActions ? 'Close quick actions' : 'Open quick actions'}
                  >
                    <Plus
                      size={18}
                      className={`text-slate-600 transition-transform ${showQuickActions ? 'rotate-45' : ''}`}
                    />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="w-full pl-14 pr-14 py-3.5 bg-white border border-slate-300 rounded-xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400 text-base"
                    rows={1}
                    maxLength={8000}
                    disabled={isSending}
                    aria-label="Message input"
                  />

                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!inputValue.trim() || isSending}
                    className="absolute bottom-2.5 right-2.5 w-10 h-10 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                    aria-label="Send message"
                  >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Press Enter to send • Shift+Enter for a new line • Cmd/Ctrl+K for quick actions
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 0.9rem;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: #475569;
          transition: all 0.2s;
          box-shadow: 0 1px 0 0 rgba(15, 23, 42, 0.02);
        }
        .quick-action-btn:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
        }
      `}</style>
    </ToastProvider>
  );
}