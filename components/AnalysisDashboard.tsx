import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { AnalysisResult } from '../types';
import { CheckCircle, XCircle, TrendingUp, Zap, Users, ArrowRight, RotateCcw } from 'lucide-react';

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onStartNegotiation: () => void;
  onReset: () => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, onStartNegotiation, onReset }) => {
  const isHighPotential = result.score >= 90;

  const chartData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-white">{result.companyName}</h2>
          <p className="text-slate-400 text-lg">Investment Analysis Report</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
        >
          <RotateCcw size={16} />
          Analyze New Pitch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="md:col-span-1 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg">
          <h3 className="text-slate-300 font-medium mb-4">Gemini Confidence Score</h3>
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={isHighPotential ? '#10b981' : '#f59e0b'} />
                  <Cell fill="#1e293b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${isHighPotential ? 'text-emerald-400' : 'text-amber-400'}`}>
                {result.score}
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-wide">out of 100</span>
            </div>
          </div>
          <p className={`mt-4 text-center text-sm font-medium ${isHighPotential ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isHighPotential ? 'High Investment Potential' : 'Needs Improvement'}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="md:col-span-2 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-slate-300 font-medium mb-6">Key Metrics Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <TrendingUp size={20} />
                <span className="font-semibold text-sm">Market Size</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.metrics.marketSize}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Zap size={20} />
                <span className="font-semibold text-sm">Innovation</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.metrics.innovation}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-orange-400">
                <Users size={20} />
                <span className="font-semibold text-sm">Scalability</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.metrics.scalability}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-slate-400 text-sm font-medium mb-2">Executive Summary</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-emerald-400 font-semibold mb-4">
            <CheckCircle size={20} /> Strengths
          </h3>
          <ul className="space-y-2">
            {result.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                {pro}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-red-400 font-semibold mb-4">
            <XCircle size={20} /> Risks & Weaknesses
          </h3>
          <ul className="space-y-2">
            {result.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col items-center justify-center pt-4 pb-8 space-y-4">
        {/* Actions - Only show if viable (Score > 60 for Demo) */}
        {result.score >= 60 ? (
          <button
            onClick={onStartNegotiation}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 border border-emerald-500/50 hover:border-emerald-400"
          >
            <div className="absolute -inset-3 transition-all duration-1000 opacity-30 group-hover:opacity-100 bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 rounded-xl blur-lg group-hover:duration-200 animate-tilt"></div>
            <span className="relative flex items-center gap-3 text-lg font-bold text-white">
              Begin Autonomous Due Diligence
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        ) : (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200">
            <span className="font-bold">Score below 60%.</span> Automated negotiation unavailable.
            <button onClick={onReset} className="underline hover:text-white ml-2">Try improving pitch.</button>
          </div>
        )}
      </div>
    </div>
  );
};