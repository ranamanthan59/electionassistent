import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Info, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  HelpCircle,
  Menu,
  History,
  ShieldCheck,
  Flag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Namaste! I am your **Indian Election Assistant**. \n\nI can help you with:\n*   Checking your eligibility to vote\n*   Guide you through the voter registration process\n*   Provide information on upcoming election dates\n*   Explain voting terminology like NOTA, EVM, and VVPAT\n\nHow can I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Focus the input and place cursor at the end or select the placeholder
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // If it contains [Your Age], we could potentially select it, 
        // but for now, just focusing at the end is good.
        const length = prompt.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const newMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Use relative path for production (since we serve from same origin)
      const apiUrl = import.meta.env.VITE_API_URL || '';
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
    { label: 'Check Eligibility', prompt: 'Am I eligible to vote? My age is [Your Age].', icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'View Timeline', prompt: 'What is the timeline for the upcoming elections?', icon: <Clock className="w-4 h-4" /> },
    { label: 'Register Guide', prompt: 'How can I register to vote in India?', icon: <UserPlus className="w-4 h-4" /> },
    { label: 'What is NOTA?', prompt: 'Can you explain what NOTA is?', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden">
      
      {/* Sidebar - Desktop Only */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-indigo-50/50">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 tracking-tight">Voter Connect</h2>
            <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest">Official Assistant</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Quick Access</h3>
            <div className="space-y-1">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group text-left"
                >
                  <span className="text-slate-400 group-hover:text-indigo-500">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Official Resources</h3>
            <div className="space-y-1">
              <a href="https://voters.eci.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                Voters Service Portal
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>
              <a href="https://eci.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                Election Commission Website
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>
            </div>
          </section>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium px-2">
            <Flag className="w-3.5 h-3.5 text-orange-500" />
            Empowering Democracy
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 leading-tight">Election Expert AI</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Agent • Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <History className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`flex flex-col space-y-1.5 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-5 py-3.5 rounded-2xl shadow-sm border ${
                      msg.role === 'user'
                        ? 'bg-slate-900 border-slate-900 text-white rounded-tr-none'
                        : 'bg-white border-slate-100 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-indigo-600">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                    {msg.role === 'user' ? 'You' : 'Agent'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto relative group">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Election Expert AI..."
                className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm resize-none shadow-sm placeholder:text-slate-400 placeholder:font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2.5 top-2.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md active:scale-95 group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Verified Information • Secure Channel • 2026 Election Cycle</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
