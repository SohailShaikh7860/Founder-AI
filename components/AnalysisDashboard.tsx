import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AnalysisResult } from '../types';
import { CheckCircle, XCircle, TrendingUp, Zap, Users, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onStartNegotiation: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, onStartNegotiation, onReset, isLoading = false }) => {
  const isHighPotential = result.score >= 75; // Adjusted threshold for realism

  const chartData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score },
  ];

  const MetricCard = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
      <div className={`flex items-center gap-2 mb-2 ${colorClass}`}>
        <Icon size={18} />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{value}</p>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header with Case Study Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Analysis Complete
          </div>
          <h2 className="text-3xl font-display font-bold text-white">{result.companyName}</h2>
          <p className="text-slate-400">Gemini Investment Committee Report</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <RotateCcw size={16} />
          New Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Score & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Score Card */}
          <Card className="flex flex-col items-center justify-center text-center p-8">
            <h3 className="text-slate-400 font-medium mb-6 uppercase text-xs tracking-widest">Viability Score</h3>
            <div className="w-48 h-48 relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={5}
                    paddingAngle={2}
                  >
                    <Cell fill={isHighPotential ? '#10b981' : '#f59e0b'} />
                    <Cell fill="#1e293b" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-display font-bold ${isHighPotential ? 'text-white' : 'text-amber-400'}`}>
                  {result.score}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 100</span>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${isHighPotential
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
              {isHighPotential ? 'INVESTMENT GRADE' : 'REQUIRES REVIEW'}
            </div>
          </Card>

          {/* Executive Summary Mobile (visible only on small) */}
          <div className="lg:hidden">
            <Card>
              <h3 className="text-white font-semibold mb-3">Executive Summary</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
            </Card>
          </div>
        </div>

        {/* Right Column: Detailed Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={20} />
              Key Investment Metrics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <MetricCard
                icon={TrendingUp}
                label="Market Opportunity"
                value={result.metrics.marketSize}
                colorClass="text-blue-400"
              />
              <MetricCard
                icon={Zap}
                label="Product Innovation"
                value={result.metrics.innovation}
                colorClass="text-purple-400"
              />
              <MetricCard
                icon={Users}
                label="Scalability Potential"
                value={result.metrics.scalability}
                colorClass="text-orange-400"
              />
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Executive Summary</h4>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">{result.summary}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Pros & Cons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outline" className="bg-emerald-950/20 border-emerald-900/50">
          <h3 className="flex items-center gap-3 text-emerald-400 font-bold mb-4">
            <CheckCircle size={20} /> Strong Signals
          </h3>
          <ul className="space-y-3">
            {result.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {pro}
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="outline" className="bg-red-950/10 border-red-900/30">
          <h3 className="flex items-center gap-3 text-red-400 font-bold mb-4">
            <XCircle size={20} /> Risk Factors
          </h3>
          <ul className="space-y-3">
            {result.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {con}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex justify-center pt-8">
        {result.score >= 60 ? (
          <div className="text-center space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Due Diligence Agents Ready
            </div>
            <button
              onClick={onStartNegotiation}
              disabled={isLoading}
              className="group relative flex items-center gap-3 px-8 py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initiating Due Diligence...
                </>
              ) : (
                <>
                  Start Autonomous Negotiation
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-slate-500 text-sm">
              Proceeding will verify claims (`Due Diligence`) and initiate term sheet generation (`Committee`).
            </p>
          </div>
        ) : (
          <Card variant="flat" className="bg-red-950/20 border-red-900/20 text-center max-w-md">
            <h4 className="text-red-400 font-bold mb-2">Investment Criteria Not Met</h4>
            <p className="text-slate-400 text-sm mb-4">The viability score is below the threshold for automated negotiation.</p>
            <button onClick={onReset} className="text-white underline hover:text-emerald-400 text-sm">Submit Revised Pitch</button>
          </Card>
        )}
      </div>
    </div>
  );
};