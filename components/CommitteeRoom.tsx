import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, ArrowRight, XCircle } from 'lucide-react';
import { AnalysisResult, CommitteeMessage, CommitteeAgent } from '../types';
import { startCommitteeDebate } from '../services/geminiService';
import { Card } from './ui/Card';

interface CommitteeRoomProps {
    analysis: AnalysisResult;
    onProceed: () => void;
    onReject: () => void;
}

const AGENTS: Record<string, CommitteeAgent> = {
    tech: {
        id: 'tech',
        name: 'Tanya (CTO)',
        role: 'Technical Analyst',
        avatar: '👩‍💻',
        personality: 'Skeptical, focused on scalability and moat.'
    },
    risk: {
        id: 'risk',
        name: 'Roger (CFO)',
        role: 'Risk Manager',
        avatar: '📉',
        personality: 'Conservative, focused on burn rate and competition.'
    },
    vision: {
        id: 'vision',
        name: 'Victoria (Partner)',
        role: 'Visionary',
        avatar: 'VP',
        personality: 'Optimistic, focused on market size and narrative.'
    }
};

export const CommitteeRoom: React.FC<CommitteeRoomProps> = ({ analysis, onProceed, onReject }) => {
    const [messages, setMessages] = useState<CommitteeMessage[]>([]);
    const [isDebating, setIsDebating] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        // Start debate automatically
        const startDebate = async () => {
            setIsDebating(true);
            try {
                const debateMessages = await startCommitteeDebate(analysis);
                // Simulate typing / streaming by adding them one by one
                let i = 0;
                const interval = setInterval(() => {
                    if (i >= debateMessages.length) {
                        clearInterval(interval);
                        setIsDebating(false);
                        setHasVoted(true);
                        return;
                    }
                    setMessages(prev => [...prev, debateMessages[i]]);
                    i++;
                }, 2500); // New message every 2.5 seconds
            } catch (e) {
                console.error("Debate failed", e);
                setIsDebating(false);
            }
        };

        startDebate();
    }, [analysis]);

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Users className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">Investment Committee</h2>
                    <p className="text-slate-400">Partners are debating the deal terms and risks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Agent Profiles */}
                <div className="md:col-span-1 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">The Board</p>
                    {Object.values(AGENTS).map(agent => (
                        <Card key={agent.id} padding="sm" className="flex items-center gap-3 bg-slate-900/50 border-slate-800">
                            <div className="text-2xl bg-slate-800 p-2 rounded-lg">{agent.avatar}</div>
                            <div>
                                <h3 className="text-white font-bold text-sm">{agent.name}</h3>
                                <p className="text-slate-500 text-xs">{agent.role}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Chat Room */}
                <Card className="md:col-span-3 min-h-[500px] flex flex-col relative overflow-hidden bg-slate-950/50" padding="none">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-amber-500 opacity-30"></div>

                    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px] custom-scrollbar">
                        {messages.filter(msg => msg && msg.agentId).map((msg, idx) => {
                            const agent = AGENTS[msg.agentId as keyof typeof AGENTS];
                            if (!agent) return null;
                            const isVision = msg.agentId === 'vision';

                            return (
                                <div key={idx} className={`flex gap-4 animate-slide-up ${isVision ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl border border-slate-700 shrink-0 shadow-lg">
                                        {agent.avatar}
                                    </div>
                                    <div className={`p-4 rounded-2xl max-w-[80%] shadow-md ${msg.agentId === 'tech' ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-100 rounded-tl-none' :
                                            msg.agentId === 'risk' ? 'bg-amber-950/40 border border-amber-500/20 text-amber-100 rounded-tl-none' :
                                                'bg-purple-950/40 border border-purple-500/20 text-purple-100 rounded-tr-none'
                                        }`}>
                                        <p className="text-xs font-bold mb-1 opacity-60 uppercase tracking-wider">{agent.role}</p>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {isDebating && (
                            <div className="flex items-center gap-2 text-slate-500 italic text-sm animate-pulse pl-2">
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                                <span className="ml-2">Deliberating...</span>
                            </div>
                        )}

                        {hasVoted && (
                            <div className="flex flex-col items-center justify-center p-8 mt-8 border-t border-slate-800 animate-scale-up">
                                <h3 className="text-xl font-bold text-white mb-2">Consensus Reached</h3>
                                <p className="text-slate-400 text-center mb-6 max-w-md">The committee has aligned on a decision regarding your term sheet negotiation eligibility.</p>

                                <div className="flex gap-4">
                                    <button
                                        onClick={onProceed}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-105"
                                    >
                                        <CheckCircle size={20} />
                                        Proceed to Term Sheet
                                        <ArrowRight size={18} />
                                    </button>
                                    <button
                                        onClick={onReject}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
                                    >
                                        <XCircle size={20} />
                                        Decline Offer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
