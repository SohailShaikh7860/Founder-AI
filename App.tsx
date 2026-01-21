import React, { useState } from 'react';
import { Header } from './components/Header';
import { SubmissionForm } from './components/SubmissionForm';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { NegotiationChat } from './components/NegotiationChat';
import { Portfolio } from './components/Portfolio';
import { Investors } from './components/Investors';
import { DueDiligenceView } from './components/DueDiligenceView';
import { CommitteeRoom } from './components/CommitteeRoom';
import { BoardSimulator } from './components/BoardSimulator';
import { AppState, StartupSubmission, AnalysisResult, DueDiligenceClaim } from './types';
import { analyzeStartupPitch, performDueDiligence } from './services/geminiService';

type ViewType = 'startups' | 'investors' | 'portfolio';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [submissionData, setSubmissionData] = useState<StartupSubmission | null>(null); // Keep track for context
  const [ddClaims, setDdClaims] = useState<DueDiligenceClaim[]>([]);

  // New state for Navigation and Portfolio History
  const [currentView, setCurrentView] = useState<ViewType>('startups');
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const handleSubmission = async (data: StartupSubmission) => {
    setAppState(AppState.ANALYZING);
    setSubmissionData(data); // Store for later agents
    try {
      const result = await analyzeStartupPitch(data.videoFile, data.reportText, data.reportFile);
      setAnalysisResult(result);

      // Add to history
      setHistory(prev => [result, ...prev]);

      setAppState(AppState.RESULTS);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to analyze pitch: ${errorMessage}\n\nPlease check your API key and network connection.`);
      setAppState(AppState.IDLE);
    }
  };

  // Step 1: Start Due Diligence (Triggered from Dashboard)
  const startDueDiligence = async () => {
    if (!analysisResult || !submissionData) return;

    // We can show a loading state if needed, or just switch
    // Ideally we fetch the claims first before showing the view, 
    // or the view handles loading. For simplicity, let's switch and let useEffect in component (or here) fetch.
    // But DueDiligenceView expects claims prop. Let's fetch here with a loading indicator if possible.
    // For now, I'll do a quick inline fetch or modify the flow. 
    // Let's modify: Set state to DUE_DILIGENCE, but show a spinner if claims are empty? 
    // Better: Fetch first.

    try {
      const textContext = submissionData.reportText || "Full pitch report provided.";
      const claims = await performDueDiligence(textContext, analysisResult);
      setDdClaims(claims);
      setAppState(AppState.DUE_DILIGENCE);
    } catch (e) {
      console.error("DD failed", e);
      // Fallback if AI fails: Skip to Committee
      setAppState(AppState.COMMITTEE);
    }
  };

  // Step 2: Complete Due Diligence -> Committee
  const handleDueDiligenceComplete = () => {
    setAppState(AppState.COMMITTEE);
  };

  // Step 3: Committee Approved -> Negotiation
  const handleCommitteeProceed = () => {
    setAppState(AppState.NEGOTIATING);
  };

  // Step 3b: Committee Rejected
  const handleCommitteeReject = () => {
    setAppState(AppState.REJECTED);
    // Maybe show a rejection screen? For now reset or just stay.
    alert("The committee has decided not to proceed at this time.");
    resetToHome();
  };

  // Step 4: Negotiation Success -> Board Sim
  const closeNegotiation = () => {
    // In a real app, we'd check if deal was signed.
    // Let's assume success leads to Simulation.
    setAppState(AppState.BOARD_SIMULATION);
  };

  const resetToHome = () => {
    setAnalysisResult(null);
    setSubmissionData(null);
    setAppState(AppState.IDLE);
    setCurrentView('startups');
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* VIEW: STARTUPS (Main Flow) */}
        {currentView === 'startups' && (
          <>
            {/* Hero Section - Only show when IDLE */}
            {appState === AppState.IDLE && (
              <div className="text-center mb-16 animate-fade-in">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                  Founding the Future with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Intelligent Capital</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                  Upload your startup pitch. Our Gemini-powered AI analyzes viability in seconds.
                  Top-tier startups get immediate access to automated term sheet negotiation.
                </p>
              </div>
            )}

            {/* Dynamic Content based on State */}
            <div className="transition-all duration-500 ease-in-out">
              {appState === AppState.IDLE || appState === AppState.ANALYZING ? (
                <SubmissionForm
                  onSubmit={handleSubmission}
                  isProcessing={appState === AppState.ANALYZING}
                />
              ) : null}

              {appState === AppState.RESULTS && analysisResult && (
                <AnalysisDashboard
                  result={analysisResult}
                  onStartNegotiation={startDueDiligence}
                  onReset={resetToHome}
                />
              )}

              {appState === AppState.DUE_DILIGENCE && (
                <DueDiligenceView
                  claims={ddClaims}
                  onComplete={handleDueDiligenceComplete}
                />
              )}

              {appState === AppState.COMMITTEE && analysisResult && (
                <CommitteeRoom
                  analysis={analysisResult}
                  onProceed={handleCommitteeProceed}
                  onReject={handleCommitteeReject}
                />
              )}

              {appState === AppState.NEGOTIATING && analysisResult && (
                <NegotiationChat
                  analysis={analysisResult}
                  onClose={closeNegotiation}
                />
              )}

              {appState === AppState.BOARD_SIMULATION && analysisResult && (
                <BoardSimulator
                  analysis={analysisResult}
                  onRestart={resetToHome}
                />
              )}
            </div>
          </>
        )}

        {/* VIEW: PORTFOLIO */}
        {currentView === 'portfolio' && (
          <Portfolio items={history} />
        )}

        {/* VIEW: INVESTORS */}
        {currentView === 'investors' && (
          <Investors />
        )}

      </main>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
};

export default App;
