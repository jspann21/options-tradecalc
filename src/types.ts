export type NumericFieldValue = number | '';

export interface BuyPosition {
  type: 'Call' | 'Put';
  ticker: string;
  contracts: NumericFieldValue;
  premium: NumericFieldValue; // per share
  miscFees: NumericFieldValue; // total
  commissions: NumericFieldValue; // total
  multiplier: number;
}

export interface SellPosition {
  id: string;
  contracts: NumericFieldValue;
  premium: NumericFieldValue; // per share
  miscFees: NumericFieldValue; // total
  commissions: NumericFieldValue; // total
}
