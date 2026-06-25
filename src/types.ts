export interface BuyPosition {
  type: 'Call' | 'Put';
  ticker: string;
  contracts: number;
  premium: number; // per share
  miscFees: number; // total
  commissions: number; // total
  multiplier: number;
}

export interface SellPosition {
  id: string;
  contracts: number;
  premium: number; // per share
  miscFees: number; // total
  commissions: number; // total
}
