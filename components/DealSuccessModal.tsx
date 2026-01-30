import React from 'react';
import { CheckCircle, TrendingUp, DollarSign, ArrowRight, FileText, X } from 'lucide-react';
import { Card } from './ui/Card';

interface TermSheet {
  dealCompleted: boolean;
  investmentAmount: string;
  valuation: string;
  equityPercentage: string;
  useOfFunds: {
    product: string;
    marketing: string;
    hiring: string;
    operations: string;
    other: string;
  };
  terms: {
    boardSeats: string;
    liquidationPreference: string;
    antiDilution: string;
    votingRights: string;
    proRataRights: string;
  };
  milestones: {
    revenue: string;
    profitability: string;
    customerGrowth: string;
  };
  nextSteps: string[];
  notes: string;
}

interface DealSuccessModalProps {
  termSheet: TermSheet;
  companyName: string;
  onViewFullTermSheet: () => void;
  onProceedToBoardSim: () => void;
  onClose: () => void;
}

export const DealSuccessModal: React.FC<DealSuccessModalProps> = ({
  termSheet,
  companyName,
  onViewFullTermSheet,
  onProceedToBoardSim,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative" padding="none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white z-10"
        >
          <X size={20} />
        </button>

        
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 p-8 border-b border-emerald-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)]"></div>
          
          <div className="relative flex flex-col items-center text-center animate-scale-up">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2 font-display">
              🎉 Deal Closed!
            </h2>
            <p className="text-emerald-300 text-lg">
              Congratulations! You've successfully negotiated with <span className="font-bold">{companyName}</span>
            </p>
          </div>
        </div>

        
        <div className="p-8 bg-slate-950/50">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Deal Highlights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20" padding="md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Investment</p>
                  <p className="text-2xl font-bold text-white">{termSheet.investmentAmount}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900 border-blue-500/20" padding="md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Valuation</p>
                  <p className="text-2xl font-bold text-white">{termSheet.valuation}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-500/20" padding="md">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <div className="text-purple-400 font-bold text-lg">%</div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Equity</p>
                  <p className="text-2xl font-bold text-white">{termSheet.equityPercentage}</p>
                </div>
              </div>
            </Card>
          </div>

          
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-4">💰 Use of Funds</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(termSheet.useOfFunds).map(([key, value]) => (
                value && value !== "To be determined" && (
                  <div key={key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 capitalize mb-1">{key}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-4">📋 Key Terms</h4>
            <div className="space-y-2">
              {termSheet.terms.boardSeats && termSheet.terms.boardSeats !== "To be determined" && (
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-sm">Board Seats: </span>
                  <span className="text-white text-sm font-medium">{termSheet.terms.boardSeats}</span>
                </div>
              )}
              {termSheet.terms.liquidationPreference && termSheet.terms.liquidationPreference !== "To be determined" && (
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400 text-sm">Liquidation Preference: </span>
                  <span className="text-white text-sm font-medium">{termSheet.terms.liquidationPreference}</span>
                </div>
              )}
            </div>
          </div>

         
          {termSheet.nextSteps && termSheet.nextSteps.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4">✅ Next Steps</h4>
              <ul className="space-y-2">
                {termSheet.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        
        <div className="p-6 bg-slate-900 border-t border-slate-700 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onViewFullTermSheet}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
          >
            <FileText size={20} />
            View Full Term Sheet
          </button>
          
          <button
            onClick={onProceedToBoardSim}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-emerald-500/20"
          >
            See What Happens Next
            <ArrowRight size={20} />
          </button>
        </div>
      </Card>
    </div>
  );
};
