import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, DollarSign, X, GripHorizontal, AlertTriangle } from 'lucide-react';
import { ChatMessage, AnalysisResult } from '../types';
import { createNegotiationSession, checkNegotiationProgress, generateTermSheet } from '../services/geminiService';
import { Card } from './ui/Card';
import { DealSuccessModal } from './DealSuccessModal';
import { FullTermSheet } from './FullTermSheet';
import type { Chat, GenerateContentResponse } from '@google/genai';

interface NegotiationChatProps {
  analysis: AnalysisResult;
  onClose: () => void;
  onProceedToBoardSim?: () => void;
}

export const NegotiationChat: React.FC<NegotiationChatProps> = ({ analysis, onClose, onProceedToBoardSim }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [showCancellationWarning, setShowCancellationWarning] = useState(false);
  const [termSheet, setTermSheet] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFullTermSheet, setShowFullTermSheet] = useState(false);
  const [isGeneratingTermSheet, setIsGeneratingTermSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Chat
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        const session = createNegotiationSession(JSON.stringify(analysis));
        setChatSession(session);

        const response: GenerateContentResponse = await session.sendMessage({
          message: `The startup is "${analysis.companyName}". Score is ${analysis.score}. Summary: ${analysis.summary}. Start the negotiation.`
        });

        if (response.text) {
          setMessages([
            {
              id: 'init',
              role: 'model',
              text: response.text,
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to start chat", error);
        setMessages([
          {
            id: 'error',
            role: 'model',
            text: "System Error: Unable to initiate negotiation protocols. Check your API Key.",
            timestamp: new Date()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if user wants to cancel
  const detectUserCancellation = (text: string): boolean => {
    const cancellationPhrases = [
      'cancel negotiation',
      'cancel this',
      'end negotiation',
      'stop negotiation',
      'i want to cancel',
      'nevermind',
      'never mind',
      'not interested anymore',
      'pull out',
      'walk away'
    ];
    const lowerText = text.toLowerCase();
    return cancellationPhrases.some(phrase => lowerText.includes(phrase));
  };

  const handleCancellation = (reason: string, isUserInitiated: boolean = false) => {
    setIsCancelled(true);
    setCancellationReason(reason);
    
    const cancellationMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      text: reason,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, cancellationMsg]);
  };

  // Detect if deal was completed in the conversation
  const detectDealCompletion = (text: string): boolean => {
    const dealPhrases = [
      'deal',
      'agreed',
      'accept',
      'sounds good',
      'let\'s do it',
      'i agree',
      'you have a deal',
      'perfect',
      'we have an agreement',
      'congratulations'
    ];
    const lowerText = text.toLowerCase();
    // Need at least 2 deal indicators to confirm
    const matches = dealPhrases.filter(phrase => lowerText.includes(phrase)).length;
    return matches >= 2 || lowerText.includes('we have a deal');
  };

  // Generate term sheet after deal completion
  const handleDealCompletion = async (updatedMessages: ChatMessage[]) => {
    setIsGeneratingTermSheet(true);
    try {
      const sheet = await generateTermSheet(updatedMessages, analysis);
      if (sheet.dealCompleted) {
        setTermSheet(sheet);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Failed to generate term sheet", error);
    } finally {
      setIsGeneratingTermSheet(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isLoading || isCancelled) return;

    // Check if user wants to cancel
    if (detectUserCancellation(input)) {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      
      handleCancellation(
        "🚫 Negotiation cancelled at your request. We understand that timing and terms need to align perfectly. Feel free to reach out when you're ready to explore funding opportunities again. Best of luck with your startup!",
        true
      );
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg.text });
      const aiText = result.text;

      if (aiText) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: aiText,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMsg]);

        // Check if deal was completed
        const updatedMessages = [...messages, userMsg, aiMsg];
        const dealCompleted = detectDealCompletion(aiText) || detectDealCompletion(userMsg.text);
        
        if (dealCompleted) {
          // Generate term sheet after a brief delay
          setTimeout(() => {
            handleDealCompletion(updatedMessages);
          }, 1500);
        } else {
          // Check if AI should auto-cancel based on conversation progress
          const shouldCancel = await checkNegotiationProgress(updatedMessages, analysis);
          
          if (shouldCancel.shouldCancel) {
            setTimeout(() => {
              handleCancellation(shouldCancel.reason, false);
            }, 2000);
          } else if (shouldCancel.showWarning) {
            setShowCancellationWarning(true);
            setTimeout(() => setShowCancellationWarning(false), 5000);
          }
        }
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden shadow-2xl border-emerald-500/20" padding="none">

        {/* Chat Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 ${isCancelled ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} rounded-xl border`}>
              <Bot className={`w-6 h-6 ${isCancelled ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg font-display">Founder AI Negotiator</h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 uppercase tracking-wider font-semibold">
                {isCancelled ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Session Ended
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Session
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning Banner */}
        {showCancellationWarning && !isCancelled && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex items-center gap-3 animate-slide-down">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200">
              ⚠️ Warning: The negotiation seems to be stalling. We may need to reconsider if both parties can reach an agreement.
            </p>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border shadow-lg
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-600 border-cyan-400/30'
                    : 'bg-emerald-950 border-emerald-500/30'}`}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <DollarSign size={18} className="text-emerald-400" />}
                </div>

                <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-md
                  ${msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none border border-slate-700'
                    : 'bg-emerald-900/10 text-slate-200 rounded-tl-none border border-emerald-500/20'
                  }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="flex max-w-[80%] gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-emerald-400" />
                </div>
                <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-emerald-500/50 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          {isCancelled ? (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-3">Negotiation has been terminated.</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your reply to negotiate terms... (or type 'cancel negotiation' to end)"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder-slate-500 transition-all font-medium"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-medium hidden sm:block">
                  RETURN to send
                </div>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
              >
                <Send size={20} />
              </button>
            </form>
          )}
        </div>

        {/* Generating Term Sheet Indicator */}
        {isGeneratingTermSheet && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30 flex items-center gap-4">
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
              </div>
              <p className="text-white font-semibold">Generating Term Sheet...</p>
            </div>
          </div>
        )}
      </Card>

      {/* Deal Success Modal */}
      {showSuccessModal && termSheet && !showFullTermSheet && (
        <DealSuccessModal
          termSheet={termSheet}
          companyName={analysis.companyName}
          onViewFullTermSheet={() => {
            setShowSuccessModal(false);
            setShowFullTermSheet(true);
          }}
          onProceedToBoardSim={() => {
            setShowSuccessModal(false);
            if (onProceedToBoardSim) {
              onProceedToBoardSim();
            }
            onClose();
          }}
          onClose={() => {
            setShowSuccessModal(false);
            onClose();
          }}
        />
      )}

      {/* Full Term Sheet Viewer */}
      {showFullTermSheet && termSheet && (
        <FullTermSheet
          termSheet={termSheet}
          companyName={analysis.companyName}
          onClose={() => {
            setShowFullTermSheet(false);
            setShowSuccessModal(true); // Go back to success modal
          }}
        />
      )}
    </div>
  );
};