export interface PowerBallResult {
  pBall: number;
  pOddEven: 1 | 2;
  pUnderOver: 1 | 2;
  pBallType: string;
  nBall1: number;
  nBall2: number;
  nBall3: number;
  nBall4: number;
  nBall5: number;
  nBallSum: number;
  nOddEven: 1 | 2;
  nUnderOver: 1 | 2;
  nSML: 1 | 2 | 3;
  nBallType: string;
}

export interface PowerLadderResult {
  leftRight: 1 | 2;
  ladderCount: 1 | 2;
  oddEven: 1 | 2;
  plType: 1 | 2 | 3 | 4;
}

export interface BepickRound {
  ID: number;
  Date: string;
  Round: number;
  AllRound: number;
  PowerBall: PowerBallResult;
  PowerLadder: PowerLadderResult;
}

export interface MinigameType {
  code: string;
  name: string;
  description: string;
  interval: number;
  maxRound: number;
}
