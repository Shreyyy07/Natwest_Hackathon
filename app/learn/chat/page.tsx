'use client';
// ... your other imports
import PointsProvider from '../../components/points/PointsProvider';

// ... rest of your file
import PointsBadge from '../../components/PointsBadge';
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from '@clerk/nextjs';
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
  Menu,
  X,
  PlusCircle,
  ExternalLink,
  LogOut,
  Wand2,
  Rocket,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type mermaidType from 'mermaid';
import Quiz from '../../components/Quiz';
import { Message as ChatMessageType } from '../../components/types';
import {
  ChatSession,
  loadChats,
  saveChats,
  newChatSession,
  deriveTitleFromMessage,
  getActiveChatId,
  setActiveChatId as persistActiveChatId,
  upsertChat,
  deleteChat as removeChat,
} from './chatStore';
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
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : toast.type === 'error'
                  ? 'bg-rose-950 border-rose-900 text-rose-200'
                  : 'bg-amber-950 border-amber-900 text-amber-200'
              }`}
            >
              {toast.type === 'achievement' && <Trophy size={18} className="text-amber-300" />}
              {toast.type === 'success' && <Check size={18} className="text-emerald-300" />}
              {toast.type === 'error' && <span className="text-rose-300 font-bold" aria-hidden>!</span>}
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
// Mermaid Diagram (lazy)
// ----------------------
const MermaidDiagram = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let isMounted = true;
    let mermaid: typeof mermaidType | null = null;
    const localRef = ref.current;

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

        if (!localRef || !chart) return;

        const id = `mermaid-${uuid()}`;
        mermaid
          .render(id, chart)
          .then(({ svg }) => {
            if (localRef) localRef.innerHTML = svg;
          })
          .catch(() => {
            if (localRef) {
              localRef.innerHTML =
                '<p class="text-slate-400 text-sm p-4">Could not render diagram.</p>';
            }
          });
      } catch {
        if (localRef) {
          localRef.innerHTML =
            '<p class="text-slate-400 text-sm p-4">Could not render diagram.</p>';
        }
      }
    })();

    return () => {
      isMounted = false;
      if (localRef) localRef.innerHTML = '';
    };
  }, [chart]);

  return <div ref={ref} className="[&>svg]:w-full [&>svg]:h-auto text-slate-200" />;
};

// ----------------------
// Code Block
// ----------------------
const CodeBlock = memo(({ inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeText = useMemo(
    () => (Array.isArray(children) ? children.join('') : String(children || '')),
    [children]
  );

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 bg-slate-800/80 text-slate-200 rounded-md text-[0.94em] font-mono">
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
    <div className="group relative my-5 rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-300 hover:text-white transition-colors"
          aria-label={isCopied ? 'Code copied' : 'Copy code to clipboard'}
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[0.95rem] overflow-x-auto font-mono leading-relaxed text-slate-200" {...props}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

// ----------------------
// Markdown components
// ----------------------
const markdownComponents = {
  h1: (props: any) => <h1 {...props} className="text-4xl font-bold text-white mt-8 mb-5" />,
  h2: (props: any) => <h2 {...props} className="text-3xl font-semibold text-white mt-7 mb-4 border-b border-slate-800 pb-3" />,
  h3: (props: any) => <h3 {...props} className="text-2xl font-semibold text-white mt-6 mb-3" />,
  p: (props: any) => <p {...props} className="text-slate-300 leading-relaxed my-4 text-[1.01rem]" />,
  ul: (props: any) => <ul {...props} className="list-disc list-outside space-y-2.5 text-slate-300 my-4 ml-6" />,
  ol: (props: any) => <ol {...props} className="list-decimal list-outside space-y-2.5 text-slate-300 my-4 ml-6" />,
  li: (props: any) => <li {...props} className="pl-2 text-[1.01rem]" />,
  a: (props: any) => (
    <a
      {...props}
      className="text-violet-400 hover:underline underline-offset-2 decoration-violet-400"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-slate-700 pl-5 my-5 text-slate-400 italic text-base">
      {props.children}
    </blockquote>
  ),
  code: CodeBlock as any,
};

// ----------------------
// Sidebar Button (dark)
// ----------------------
const SidebarButton = ({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger' | 'link';
}) => {
  const base = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium';
  const styles =
    variant === 'danger'
      ? 'text-rose-300 hover:bg-rose-900/30 border border-rose-900/50'
      : variant === 'link'
      ? 'text-slate-300 hover:bg-slate-800/60 border border-slate-800'
      : 'text-slate-200 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80';
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
};

function formatRelTime(ts: number) {
  const d = Date.now() - ts;
  const mins = Math.floor(d / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ----------------------
// Main
// ----------------------
export default function ElegantChat() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();

  // Mode: Learn | Quiz (both dark UI now)
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');

  // Sessions
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveId] = useState<string | null>(null);

  // Transcript (all modes; filtered per view)
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Persisted mode
  useEffect(() => {
    try {
      const m = localStorage.getItem('tayyari.mode') as 'learn' | 'quiz' | null;
      if (m === 'learn' || m === 'quiz') setMode(m);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('tayyari.mode', mode);
    } catch {}
  }, [mode]);

  // Initialize chats
  useEffect(() => {
    const stored = loadChats();
    if (stored.length === 0) {
      const fresh = newChatSession();
      saveChats([fresh]);
      setChats([fresh]);
      setActiveId(fresh.id);
      persistActiveChatId(fresh.id);
      setMessages([]);
    }
  }, []);

  const handleSubmit = useCallback(async (customInput?: string) => {
    const input = (customInput ?? inputValue).trim();
    if (!input || isSending || !activeChatId) return;

    setIsSending(true);
    setShowQuickActions(false);

    // tag message with mode
    const userMessage: ChatMessageType = {
      id: Date.now(),
      sender: 'user',
      content: input,
      timestamp: new Date(),
    } as any;
    (userMessage as any).mode = mode;

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

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
        if (mode === 'quiz') {
          const quizMsg: ChatMessageType = {
            id: Date.now() + 1,
            sender: 'ai',
            content: data.response,
            timestamp: new Date(),
          } as any;
          (quizMsg as any).mode = 'quiz';
          (quizMsg as any).forceQuiz = true;
          setMessages(prev => [...prev, quizMsg]);
        } else {
          const aiMessage: ChatMessageType = {
            id: Date.now() + 1,
            sender: 'ai',
            content: data.response,
            mermaidChart: data.mermaidChart,
            timestamp: new Date(),
          } as any;
          (aiMessage as any).mode = 'learn';
          setMessages(prev => [...prev, aiMessage]);
        }
      } else {
        if (mode === 'quiz') {
          const quizMsg: ChatMessageType = {
            id: Date.now() + 1,
            sender: 'ai',
            content: input,
            timestamp: new Date(),
          } as any;
          (quizMsg as any).mode = 'quiz';
          (quizMsg as any).forceQuiz = true;
          setMessages(prev => [...prev, quizMsg]);
        } else {
          notify('Sorry, an error occurred. Please try again.', 'error');
        }
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        if (mode === 'quiz') {
          const quizMsg: ChatMessageType = {
            id: Date.now() + 1,
            sender: 'ai',
            content: input,
            timestamp: new Date(),
          } as any;
          (quizMsg as any).mode = 'quiz';
          (quizMsg as any).forceQuiz = true;
          setMessages(prev => [...prev, quizMsg]);
          notify('Network issue; generated quiz from your prompt text.', 'error');
        } else {
          notify('Connection failed. Please check your network.', 'error');
        }
      }
    } finally {
      setIsLoading(false);
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending, activeChatId, mode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickActions(prev => !prev);
      }
    },
    [handleSubmit]
  );

  // Session actions
  const createNewChat = () => {
    const fresh = newChatSession();
    const nextList = upsertChat(chats, fresh);
    saveChats(nextList);
    setChats(nextList);
    setActiveId(fresh.id);
    persistActiveChatId(fresh.id);
    setMessages([]);
  };

  const openChat = (id: string) => {
    if (id === activeChatId) return;
    const target = chats.find(c => c.id === id);
    if (!target) return;
    setActiveId(id);
    persistActiveChatId(id);
    setMessages((target.messages || []) as ChatMessageType[]);
  };

  const clearActiveChat = () => {
    if (!activeChatId) return;
    setMessages([]);
    notify('Chat cleared');
  };

  const deleteChat = (id: string) => {
    const next = removeChat(chats, id);
    saveChats(next);
    setChats(next);
    if (activeChatId === id) {
      const fallback = next[0] || newChatSession();
      if (!next.length) {
        const arr = [fallback];
        saveChats(arr);
        setChats(arr);
      }
      setActiveId(fallback.id);
      persistActiveChatId(fallback.id);
      setMessages(next[0]?.messages as ChatMessageType[] || []);
    }
    notify('Chat deleted');
  };

  // ----------------------
  // Message Row (dark UI for both modes)
  // ----------------------
  const ChatMessage = memo(({ message }: { message: ChatMessageType }) => {
    const isUser = message.sender === 'user';
    const [showVisuals, setShowVisuals] = useState(!!(message as any).mermaidChart);
    const [showQuiz, setShowQuiz] = useState(false);

    const forceQuiz = !!(message as any).forceQuiz;
    const hasAIQuiz = !isUser && message.content && message.content.trim().length > 0;

    // Quiz-mode dedicated quiz block
    if (!isUser && forceQuiz) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="group max-w-4xl mx-auto flex items-start gap-4 md:gap-5 my-6 md:my-8 px-2 sm:px-0"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm bg-slate-800" aria-hidden>
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <Quiz text={message.content} />
            </div>
          </div>
        </motion.div>
      );
    }

    // Unified dark bubbles
    const userBubble = 'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg';
    const aiCard = 'bg-slate-900/60 border border-slate-800 text-slate-200';

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="group max-w-4xl mx-auto flex items-start gap-4 md:gap-5 my-6 md:my-8 px-2 sm:px-0"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
            isUser ? 'bg-violet-700' : 'bg-slate-800'
          }`}
          aria-hidden
        >
          {isUser ? <UserIcon size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        <div className="flex-1">
          {isUser && (
            <div className={`rounded-2xl px-4 py-3 ${userBubble}`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}

          {/* AI content (Learn: markdown; Quiz non-forceQuiz won't appear due to handleSubmit) */}
          {!isUser && (
            <div className={`rounded-2xl px-5 py-4 ${aiCard}`}>
              <div className="prose max-w-none">
                <ReactMarkdown components={markdownComponents as any}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* AI Toolbar (only meaningful for Learn messages) */}
          {!isUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="mt-4 flex items-center gap-4"
            >
              {(message as any).mermaidChart && (
                <button
                  type="button"
                  onClick={() => setShowVisuals(v => !v)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors font-medium"
                >
                  <GitBranch size={16} />
                  <span>{showVisuals ? 'Hide' : 'Show'} Flowchart</span>
                </button>
              )}

              {hasAIQuiz && (
                <button
                  type="button"
                  onClick={() => setShowQuiz(v => !v)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors font-medium"
                >
                  <Brain size={16} />
                  <span>{showQuiz ? 'Hide' : 'Quiz me'}</span>
                </button>
              )}
            </motion.div>
          )}

          {/* Learn extras */}
          {showVisuals && !isUser && (message as any).mermaidChart && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '16px' }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="p-5">
                <MermaidDiagram chart={(message as any).mermaidChart as string} />
              </div>
            </motion.div>
          )}

          {showQuiz && !isUser && hasAIQuiz && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: '16px' }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
            >
              <Quiz text={message.content} />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  });
  ChatMessage.displayName = 'ChatMessage';

  // ----------------------
  // Empty State (unified dark)
  // ----------------------
  const EmptyState = () => (
    <div className="text-center py-20 md:py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="max-w-3xl mx-auto"
      >
        <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 border border-slate-800 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-md">
          <Sparkles size={40} className="text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          {mode === 'quiz' ? 'Quiz Mode' : 'Learn Mode'}
        </h1>

        <p className="text-lg text-slate-400 mt-4 mb-10">
          {mode === 'quiz'
            ? 'Type a topic or paste content. I will generate a focused quiz from it.'
            : 'Ask me anything. I will provide diagrams, visuals, and clear explanations.'}
        </p>

        <div className="mx-auto flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-slate-400 inline-flex items-center gap-1">
            <Sparkles size={14} /> Quick Suggestions
          </span>
          <button
            onClick={() => handleSubmit('Explain DNA replication with diagrams')}
            className="px-3 py-1.5 rounded-full text-sm bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900"
            type="button"
          >
            🧬 Explain DNA replication with diagrams
          </button>
          <button
            onClick={() => handleSubmit('Show me quantum mechanics visually')}
            className="px-3 py-1.5 rounded-full text-sm bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900"
            type="button"
          >
            🧪 Show me quantum mechanics visually
          </button>
          <button
            onClick={() => handleSubmit('How does rocket propulsion work?')}
            className="px-3 py-1.5 rounded-full text-sm bg-slate-900/60 border border-slate-800 text-slate-200 hover:bg-slate-900"
            type="button"
          >
            🚀 How does rocket propulsion work?
          </button>
        </div>
      </motion.div>
    </div>
  );

  // Sidebar chat list item (dark)
  const ChatListItem = ({
    chat,
    active,
    onOpen,
    onDelete,
  }: {
    chat: ChatSession;
    active: boolean;
    onOpen: () => void;
    onDelete: () => void;
  }) => {
    return (
      <div
        className={`group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
          active ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/60'
        }`}
        onClick={onOpen}
        title={chat.title}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{chat.title || 'New chat'}</div>
          <div className="text-[11px] text-slate-500">{formatRelTime(chat.updatedAt)}</div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-900/30"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete chat"
          title="Delete chat"
        >
          <Trash2 size={14} className="text-rose-300" />
        </button>
      </div>
    );
  };

  return (
    <ToastProvider>
      <div className="min-h-screen font-sans bg-slate-950 text-slate-200">
        {/* Header: dark, centered switch */}
        <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-slate-800">
          {/* ...existing code... */}
        </header>
        {/* ...existing code... */}
      </div>
    </ToastProvider>
  );
}