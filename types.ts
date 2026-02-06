
export type ViewType = 'startups' | 'investors' | 'portfolio';

export interface AnalysisResult {
  score: number;
  companyName: string;
  summary: string;
  pros: string[];
  cons: string[];
  metrics: {
    marketSize: string;
    scalability: string;
    innovation: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  DUE_DILIGENCE = 'DUE_DILIGENCE',
  COMMITTEE = 'COMMITTEE',
  NEGOTIATING = 'NEGOTIATING',
  BOARD_SIMULATION = 'BOARD_SIMULATION',
  REJECTED = 'REJECTED'
}

export interface StartupSubmission {
  videoFile: File | null;
  reportText: string;
  reportFile: File | null;
}

// --- Agentic AI Types ---

export interface DueDiligenceClaim {
  id: string;
  claim: string;
  category: 'Market' | 'Financial' | 'Team' | 'Product';
  status: 'Unverified' | 'Verified' | 'Flagged';
  aiQuestion: string;
  userResponse?: string;
}

export interface CommitteeAgent {
  id: 'tech' | 'risk' | 'vision';
  name: string;
  role: string;
  avatar: string; // Emoji character
  personality: string;
}

export interface CommitteeMessage {
  id: string;
  agentId: 'tech' | 'risk' | 'vision' | 'orchestrator';
  text: string;
}

export interface BoardScenario {
  id: string;
  title: string;
  description: string;
  timeJump: string; // e.g., "18 Months Later"
  choices: {
    id: string;
    label: string;
    consequence: string;
  }[];
}

export interface TermSheet {
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
