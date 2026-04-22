import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Namaste! I am your Indian Election Assistant. How can I help you understand the election process today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const newMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setMessages([...updatedMessages, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...updatedMessages, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error. Please check if the server is running or try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Check Eligibility', prompt: 'Am I eligible to vote? My age is [Your Age].' },
    { label: 'View Timeline', prompt: 'What is the timeline for the upcoming elections?' },
    { label: 'Register Guide', prompt: 'How can I register to vote in India?' },
    { label: 'What is NOTA?', prompt: 'Can you explain what NOTA is?' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen max-w-4xl mx-auto bg-gray-50 text-gray-900 shadow-xl border-x">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 shadow-md flex items-center gap-3">
        <Bot className="w-8 h-8" />
        <div>
          <h1 className="text-xl font-bold">Election Assistant</h1>
          <p className="text-xs text-indigo-100 italic">Your guide to Indian Democracy</p>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 opacity-70" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-600" />
                )}
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <div className="prose prose-sm max-w-none prose-indigo">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm rounded-tl-none">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex flex-wrap gap-2 bg-gray-50 border-t">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => handleSend(action.prompt)}
            className="flex items-center gap-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-full transition-colors shadow-sm font-medium group"
          >
            {action.label}
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about elections..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          This assistant provides information based on official Election Commission of India resources.
        </p>
      </footer>
    </div>
  );
};

export default App;
