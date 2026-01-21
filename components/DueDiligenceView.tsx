import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { DueDiligenceClaim } from '../types';

interface DueDiligenceViewProps {
    claims: DueDiligenceClaim[];
    onComplete: () => void;
}

export const DueDiligenceView: React.FC<DueDiligenceViewProps> = ({ claims, onComplete }) => {
    const [activeClaims, setActiveClaims] = useState(claims);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleVerify = (id: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [id]: answer }));
        setActiveClaims(prev =>
            prev.map(c => c.id === id ? { ...c, status: 'Verified', userResponse: answer } : c)
        );
    };

    const isAllVerified = activeClaims.every(c => c.status === 'Verified');

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-10">
                <div className="inline-block p-3 bg-amber-500/10 rounded-full mb-4">
                    <ShieldCheck className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Autonomous Due Diligence</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Before we proceed to the investment committee, our AI analyst needs to verify
                    some key claims in your pitch.
                </p>
            </div>

            <div className="space-y-6">
                {activeClaims.map((claim, index) => (
                    <div
                        key={index}
                        className={`p-6 rounded-xl border transition-all duration-300 ${claim.status === 'Verified'
                                ? 'bg-emerald-900/10 border-emerald-500/30'
                                : 'bg-slate-900 border-slate-700'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-lg ${claim.status === 'Verified' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                                }`}>
                                {claim.status === 'Verified' ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        {claim.category}
                                    </span>
                                    {claim.status === 'Verified' && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                            Verified
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-medium text-white mb-3">"{claim.claim}"</h3>

                                {claim.status !== 'Verified' ? (
                                    <div className="bg-slate-800 p-4 rounded-lg mt-4">
                                        <p className="text-amber-200 text-sm mb-3">
                                            <span className="font-bold">Analyst Query:</span> {claim.aiQuestion}
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Provide evidence or clarification..."
                                                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleVerify(claim.id, (e.target as HTMLInputElement).value);
                                                }}
                                            />
                                            <button
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                onClick={(e) => {
                                                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                                                    if (input) handleVerify(claim.id, input);
                                                }}
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 text-sm text-slate-400">
                                        <span className="text-emerald-400 font-medium">Verified:</span> {claim.userResponse}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 flex justify-center">
                <button
                    onClick={onComplete}
                    disabled={!isAllVerified}
                    className={`
            group flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold transition-all
            ${isAllVerified
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:scale-105'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
          `}
                >
                    {isAllVerified ? 'Proceed to Committee' : 'Resolve All Flags to Proceed'}
                    <ArrowRight className={`w-5 h-5 ${isAllVerified ? 'group-hover:translate-x-1 transition-transform' : ''}`} />
                </button>
            </div>
        </div>
    );
};
