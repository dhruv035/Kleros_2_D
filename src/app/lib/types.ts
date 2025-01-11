import { Dispatch, SetStateAction } from "react";

// Game State Types
export type GameState = {   
  c1: string;
  c2: string;
  isEnded: boolean;
  timeout: boolean;
  isCreator: boolean;
};

// Form Types
export type FormState = {
  radio: number;
  stake: string;
  target: string | null;
  savedMove?: string;
};

// Transaction Types
export type TransactionContextType = {
  isTxDisabled: boolean;
  pendingTx: `0x${string}` | undefined;
  setPendingTx: Dispatch<SetStateAction<`0x${string}` | undefined>>;
  setIsTxDisabled: Dispatch<SetStateAction<boolean>>;
  savePendingTx: (hash: `0x${string}`, nonce: number, from: `0x${string}`) => void;
};

export type Deployment = {
  address: string;
  j1: string;
  j2?: string;
};

export type PendingTxDetails = {
  hash: string;
  nonce: number;
  from: string;
};

// Component Props Types
export type GameInfoProps = {
  address: string;
  j1?: string;
  j2?: string;
  stake?: bigint;
  walletAddress?: string;
  gameState: {
    isCreator: boolean;
    c1: string;
    c2: string;
    isEnded: boolean;
  };
  inspectionResult?: {
    moveRevealed?: boolean;
    c1?: string;
  };
};

export type GameActionsProps = {
  gameState: GameState;
  isTxDisabled: boolean;
  isFetching: boolean;
  contractData?: {
    stake?: bigint;
  };
  onPlay: (radio: number) => Promise<void>;
  onReveal: () => Promise<void>;
  onTimeout: (hasC2: boolean) => Promise<void>;
};

export type GameStatusProps = {
  gameState: GameState;
  timeLeft: number;
  isInspecting: boolean;
  inspectionResult: {
    winner?: string;
    isTimeout?: boolean;
  };
  walletAddress?: string;
};

export type TimerProps = {
  timeLeft: number;
  isEnded: boolean;
  timeout: boolean;
};

// Inspection Types
export type InspectionResult = {
  isEnded: boolean;
  winner: string;
  c1?: string;
  isTimeout?: boolean;
  moveRevealed?: boolean;
};

// Deployment Data Types
export type DeploymentData = {
  address: string;
  j1: string;
  j2: string;
  stake: bigint;
}; 