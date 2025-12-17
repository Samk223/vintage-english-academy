import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Moon, Globe, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Message = { role: 'user' | 'assistant'; content: string };
type Language = 'en' | 'hi';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/laila-chat`;

export default function LailaChatbot() {
  const [isAwake, setIsAwake] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [userName, setUserName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const wakeUpLaila = () => {
    setIsAwake(true);
    setIsOpen(true);
    // Initial greeting
    const greeting: Message = {
      role: 'assistant',
      content: language === 'hi' 
        ? "नमस्ते! 🌟 मैं लैला हूं, आपकी इंग्लिश कोर्स एडवाइजर। मैं अभी जाग गई! आपका नाम क्या है?"
        : "Hello! 🌟 I'm Laila, your English course advisor. I just woke up! What's your name?"
    };
    setMessages([greeting]);
  };

  const resetChat = () => {
    setMessages([]);
    setUserName('');
    setIsAwake(false);
    setIsOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    toast({
      title: newLang === 'hi' ? 'भाषा बदली गई' : 'Language Changed',
      description: newLang === 'hi' ? 'अब हिंदी में बात करेंगे' : 'Now chatting in English',
    });
  };

  const streamChat = async (userMessages: Message[]) => {
    setIsLoading(true);
    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: userMessages, language, userName }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Detect if this is the first user message (likely their name)
      if (!userName && userMessages.length === 1) {
        const possibleName = userMessages[0].content.trim();
        if (possibleName.length < 30 && !possibleName.includes(' ') || possibleName.split(' ').length <= 3) {
          setUserName(possibleName);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    await streamChat(newMessages);
  };

  return (
    <>
      {/* Sleeping Laila Button */}
      <AnimatePresence>
        {!isAwake && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={wakeUpLaila}
            className="fixed bottom-6 right-6 z-50 group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <Moon className="w-8 h-8 text-primary-foreground" />
              </div>
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg px-3 py-1 text-xs font-medium shadow-md whitespace-nowrap"
              >
                💤 Wake Laila
              </motion.div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Awake Laila - Chat Window */}
      <AnimatePresence>
        {isAwake && (
          <>
            {/* Minimized button when chat is closed */}
            {!isOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50"
              >
                <div className="w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center">
                    {messages.filter(m => m.role === 'assistant').length}
                  </span>
                )}
              </motion.button>
            )}

            {/* Chat Window */}
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Laila</h3>
                      <p className="text-xs opacity-80">Course Advisor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLanguage}
                      className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
                      title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="sr-only">Toggle Language</span>
                    </button>
                    <button
                      onClick={resetChat}
                      className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
                      title="End Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={language === 'hi' ? 'अपना संदेश लिखें...' : 'Type your message...'}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
