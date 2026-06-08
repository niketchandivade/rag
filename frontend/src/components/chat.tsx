'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ChatMessage,
  SourceCitation,
  sendChatMessage,
  getDocumentCount,
} from '@/lib/api';

interface ChatProps {
  sessionId?: string;
}

export function Chat({ sessionId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [showSources, setShowSources] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkDocumentCount();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(userMessage.content, sessionId);

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
    }
  };

  const toggleSources = (index: number) => {
    setShowSources((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  console.log('loading docCount', loading, docCount);

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat with Documents
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            {docCount > 0
              ? `${docCount} chunks indexed`
              : 'No documents indexed'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-scroll-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {docCount > 0
                    ? 'Ask a question about your documents'
                    : 'Upload and process documents to start chatting'}
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="markdown-content text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <button
                        onClick={() => toggleSources(index)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showSources[index] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {message.sources.length} source
                        {message.sources.length > 1 ? 's' : ''}
                      </button>
                      {showSources[index] && (
                        <div className="mt-2 space-y-2">
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
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Spinner />
                </div>
              </div>
            )}
            {error && (
              <div className="text-center text-sm text-red-500 py-2">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4 border-t bg-background"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            // disabled={loading || docCount === 0}
          />
          <Button 
            type="submit" 
            // disabled={loading || docCount === 0}
          >
            {loading ? <Spinner /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SourceCard({ source, index }: { source: SourceCitation; index: number }) {
  return (
    <div className="bg-background rounded-md p-2 text-xs border">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium truncate">{source.filename}</span>
        <Badge variant="outline" className="text-[10px] ml-2">
          {(source.similarity_score * 100).toFixed(0)}%
        </Badge>
      </div>
      <p className="text-muted-foreground line-clamp-2">{source.chunk_text}</p>
      {source.page_number && (
        <p className="text-muted-foreground text-[10px] mt-1">
          Page {source.page_number}
        </p>
      )}
    </div>
  );
}