export interface analyseResult {
    severity: string;
    detectedTests: {
      patternTest?: string;
      logSignTest?: string;
      txAmountsTest?: string;
    };
  }

export interface victimResult {
    attackId: number;
    txHash: string;
    contractAddress: string;
    flashLoanDetected: { 
      severity: string; 
      detectedTests: Record<string, string>; 
    };
    attackerAddress: string | null;
    victimAddress: string | null;
    amountLostInToken: string;
    amountLostInDollar: string | number;
    chainId: string;
  };

export interface unknownResult{
    attackId: number;
    txHash: string;
    contractAddress: string;
    flashLoanDetected: string;
    msg: string;
    attackerAddress: string | null;
    victimAddress: string | null;
    amountLostInToken: string;
    amountLostInDollar: string;
    suggest: string;
    chainId: string;
  }