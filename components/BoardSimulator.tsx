import React, { useState, useEffect } from 'react';
import { History, AlertTriangle, ArrowRight, Play } from 'lucide-react';
import { AnalysisResult, BoardScenario } from '../types';
import { startBoardSimulation } from '../services/geminiService';

interface BoardSimulatorProps {
    analysis: AnalysisResult;
    onRestart: () => void;
}

export const BoardSimulator: React.FC<BoardSimulatorProps> = ({ analysis, onRestart }) => {
    const [scenario, setScenario] = useState<BoardScenario | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [showConsequence, setShowConsequence] = useState(false);

    useEffect(() => {
        const loadScenario = async () => {
            try {
                // Add artificial delay for "Time Travel" feeling
                await new Promise(r => setTimeout(r, 2000));
                const sim = await startBoardSimulation(analysis);
                setScenario(sim);
            } catch (e) {
                console.error("Sim failed", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadScenario();
    }, [analysis]);

    const handleChoice = (choiceId: string) => {
        setSelectedChoice(choiceId);
        setShowConsequence(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Warping 18 Months into the Future...
                </h2>
            </div>
        );
    }

    if (!scenario) return <div>Failed to load simulation.</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                    <History className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">Board Meeting Simulator</h2>
                    <p className="text-purple-400 font-mono mt-1">{scenario.timeJump}</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background Effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="mb-6 flex items-start gap-4">
                    <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{scenario.title}</h3>
                        <p className="text-slate-300 text-lg leading-relaxed">{scenario.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    {scenario.choices.map((choice) => {
                        const isSelected = selectedChoice === choice.id;
                        const isOtherSelected = selectedChoice !== null && !isSelected;

                        return (
                            <button
                                key={choice.id}
                                disabled={selectedChoice !== null}
                                onClick={() => handleChoice(choice.id)}
                                className={`text-left p-6 rounded-xl border transition-all duration-300 relative overflow-hidden group
                            ${isSelected
                                        ? 'bg-emerald-900/30 border-emerald-500/50 ring-2 ring-emerald-500'
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750'
                                    }
                            ${isOtherSelected ? 'opacity-50' : 'opacity-100'}
                        `}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs font-bold uppercase">Option {choice.id}</span>
                                    {isSelected && <ArrowRight className="text-emerald-400 w-5 h-5 animate-slide-right" />}
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{choice.label}</h4>

                                {isSelected && showConsequence && (
                                    <div className="mt-4 pt-4 border-t border-emerald-500/30 animate-fade-in text-emerald-200">
                                        {choice.consequence}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {showConsequence && (
                    <div className="mt-10 flex justify-center animate-slide-up">
                        <button
                            onClick={onRestart}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Restart Simulation
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
