import React, { useState } from 'react';
import { SubmissionForm } from './components/SubmissionForm';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { NegotiationChat } from './components/NegotiationChat';
import { Portfolio } from './components/Portfolio';
import { Investors } from './components/Investors';
import { DueDiligenceView } from './components/DueDiligenceView';
import { CommitteeRoom } from './components/CommitteeRoom';
import { BoardSimulator } from './components/BoardSimulator';
import { AppState, StartupSubmission, AnalysisResult, DueDiligenceClaim, ViewType } from './types';
import { analyzeStartupPitch, performDueDiligence } from './services/geminiService';
import { AppLayout } from './components/layout/AppLayout';
import { PageHeader } from './components/ui/PageHeader';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [submissionData, setSubmissionData] = useState<StartupSubmission | null>(null);
  const [ddClaims, setDdClaims] = useState<DueDiligenceClaim[]>([]);
  const [isDDLoading, setIsDDLoading] = useState(false);

  // Navigation and History State
  const [currentView, setCurrentView] = useState<ViewType>('startups');
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const handleSubmission = async (data: StartupSubmission) => {
    setAppState(AppState.ANALYZING);
    setSubmissionData(data);
    try {
      const result = await analyzeStartupPitch(data.videoFile, data.reportText, data.reportFile);
      setAnalysisResult(result);
      setHistory(prev => [result, ...prev]);
      setAppState(AppState.RESULTS);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to analyze pitch: ${errorMessage}\n\nPlease check your API key and network connection.`);
      setAppState(AppState.IDLE);
    }
  };

  const startDueDiligence = async () => {
    if (!analysisResult || !submissionData) return;
    setIsDDLoading(true);
    try {
      const textContext = submissionData.reportText || "Full pitch report provided.";
      const claims = await performDueDiligence(textContext, analysisResult);
      setDdClaims(claims);
      setAppState(AppState.DUE_DILIGENCE);
    } catch (e) {
      console.error("DD failed", e);
      setAppState(AppState.COMMITTEE);
    } finally {
      setIsDDLoading(false);
    }
  };

  const handleDueDiligenceComplete = () => {
    setAppState(AppState.COMMITTEE);
  };

  const handleCommitteeProceed = () => {
    setAppState(AppState.NEGOTIATING);
  };

  const handleCommitteeReject = () => {
    setAppState(AppState.REJECTED);
    alert("The committee has decided not to proceed at this time.");
    resetToHome();
  };

  const closeNegotiation = () => {
    resetToHome();
  };

  const proceedToBoardSimulation = () => {
  
    setAppState(AppState.BOARD_SIMULATION);
  };

  const resetToHome = () => {
    setAnalysisResult(null);
    setSubmissionData(null);
    setAppState(AppState.IDLE);
    setCurrentView('startups');
  };

  // --- Render Helpers ---

  const renderContent = () => {
    if (currentView === 'portfolio') {
      return (
        <>
          <PageHeader title="Portfolio" description="Track and manage your successful investments." />
          <Portfolio items={history} />
        </>
      );
    }

    if (currentView === 'investors') {
      return (
        <>
          <PageHeader title="Investors" description="Connect with your syndicates and LP network." />
          <Investors />
        </>
      );
    }

    // Default: Startups Flow
    return (
      <>
        {appState === AppState.IDLE && (
          <div className="max-w-3xl mx-auto text-center py-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Founding the Future with <br />
              <span className="text-emerald-400">Intelligent Capital</span>
            </h1>
            <p className="text-xl text-slate-400 mb-10">
              Upload your startup pitch. Our Gemini-powered AI analyzes viability in seconds.
            </p>
            <SubmissionForm
              onSubmit={handleSubmission}
              isProcessing={appState === AppState.ANALYZING}
            />
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-display font-semibold text-white">Analyzing Pitch...</h2>
            <p className="text-slate-400 mt-2">Our AI agents are reviewing market viability and team strength.</p>
          </div>
        )}

        {appState === AppState.RESULTS && analysisResult && (
          <AnalysisDashboard
            result={analysisResult}
            onStartNegotiation={startDueDiligence}
            onReset={resetToHome}
            isLoading={isDDLoading}
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
            onProceedToBoardSim={proceedToBoardSimulation}
          />
        )}

        {appState === AppState.BOARD_SIMULATION && analysisResult && (
          <BoardSimulator
            analysis={analysisResult}
            onRestart={resetToHome}
          />
        )}
      </>
    );
  };

  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </AppLayout>
  );
};

export default App;
