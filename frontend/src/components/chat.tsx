'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  Send,
  Bot,
  User,
  FileText,
  Copy,
  Check,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SkeletonChatMessage } from '@/components/ui/skeleton';
import { TypingIndicator, StreamingCursor } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  ChatMessage,
  SourceCitation,
  sendChatMessage,
  getDocumentCount,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatProps {
  sessionId?: string;
}

// Avatar components
function UserAvatar() {
  return (
    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}

function BotAvatar() {
  return (
    <Avatar className="h-8 w-8 ring-2 ring-primary/30 bg-gradient-to-br from-primary/20 to-primary/5">
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? 'Copied!' : 'Copy'}
      </TooltipContent>
    </Tooltip>
  );
}

// Source card component
function SourceCard({ source, index }: { source: SourceCitation; index: number }) {
  return (
    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3 text-xs border border-border/50 hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium truncate text-foreground">{source.filename}</span>
        <Badge variant="outline" className="text-[10px] ml-2 bg-primary/5">
          {(source.similarity_score * 100).toFixed(0)}% match
        </Badge>
      </div>
      <p className="text-muted-foreground line-clamp-3 leading-relaxed">
        {source.chunk_text}
      </p>
      {source.page_number && (
        <p className="text-muted-foreground/70 text-[10px] mt-1.5">
          Page {source.page_number}
        </p>
      )}
    </div>
  );
}

// Message component
function MessageBubble({
  message,
  index,
  showSources,
  toggleSources,
}: {
  message: ChatMessage;
  index: number;
  showSources: boolean;
  toggleSources: (index: number) => void;
}) {
  const isUser = message.role === 'user';
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        'flex gap-3 group animate-fade-in-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted/60 dark:bg-muted/40 rounded-bl-md'
        )}
      >
        {/* Message header with copy button */}
        <div className="flex items-start gap-2">
          {!isUser && <Bot className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />}
          <div className="flex-1 min-w-0">
            <div className="markdown-content text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          {isUser ? (
            <UserAvatar />
          ) : (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>
          )}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <p
            className={cn(
              'text-[10px] mt-2 opacity-50',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
            )}
          >
            {formatTime(message.timestamp)}
          </p>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              onClick={() => toggleSources(index)}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                isUser ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {showSources ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <FileText className="h-3 w-3" />
              {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2 animate-fade-in-down">
                {message.sources.map((source, sourceIndex) => (
                  <SourceCard
                    key={sourceIndex}
                    source={source}
                    index={sourceIndex}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {isUser && <UserAvatar />}
    </div>
  );
}

// Empty state component
function EmptyState({ docCount }: { docCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Bot className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {docCount > 0 ? 'Ask me anything' : 'Ready to help'}
      </h3>
      <p className="text-muted-foreground text-center max-w-sm">
        {docCount > 0
          ? 'Ask questions about your documents and get AI-powered answers with source citations.'
          : 'Upload and process documents to start chatting with them.'}
      </p>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <BotAvatar />
      <div className="bg-muted/60 dark:bg-muted/40 rounded-2xl rounded-bl-md px-4 py-3">
        <TypingIndicator />
      </div>
    </div>
  );
}

export function Chat({ sessionId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [showSources, setShowSources] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkDocumentCount();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const checkDocumentCount = async () => {
    try {
      const result = await getDocumentCount();
      setDocCount(result.chunk_count);
    } catch (err) {
      console.error('Failed to get document count:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(currentInput, sessionId);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await checkDocumentCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleSources = (index: number) => {
    setShowSources((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleRegenerate = async () => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    // Remove last assistant message
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserIndex = messages.lastIndexOf(lastUserMessage);
    setMessages(prev => prev.slice(0, lastUserIndex));

    // Re-send the message
    setInput(lastUserMessage.content);
    setTimeout(() => {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }, 100);
  };

  return (
    <TooltipProvider>
      <Card className="flex flex-col h-[650px] overflow-hidden border-2 border-transparent shadow-soft">
        <CardHeader className="flex-shrink-0 border-b bg-gradient-to-r from-card to-background px-6 py-4">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg">AI Assistant</span>
              <p className="text-sm text-muted-foreground font-normal">
                Chat with your documents
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <FileText className="h-4 w-4" />
            <span className="bg-muted/50 px-2 py-0.5 rounded-full text-xs">
              {docCount > 0
                ? `${docCount} chunks indexed`
                : 'No documents indexed'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4" ref={scrollRef}>
              {messages.length === 0 && !loading && (
                <EmptyState docCount={docCount} />
              )}
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  index={index}
                  showSources={!!showSources[index]}
                  toggleSources={toggleSources}
                />
              ))}
              {loading && <LoadingState />}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg animate-fade-in">
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    className="ml-auto text-red-500"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-4 border-t bg-gradient-to-r from-card to-background"
          >
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant..."
                disabled={loading}
                className="pr-12 bg-background/80 backdrop-blur-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  type="submit"
                  size="icon-sm"
                  variant={input.trim() ? "default" : "ghost"}
                  disabled={loading || !input.trim()}
                  className="h-8 w-8 rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate response</TooltipContent>
              </Tooltip>
            )}
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}