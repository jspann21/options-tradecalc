export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getEstimatedOptionsFees(contracts: number, premium: number, isSell: boolean = false) {
  // Common options commission estimate: $0.65 per contract.
  let commissions = contracts * 0.65;
  
  // Options Regulatory Fee (ORF) is generally charged on both buy and sell.
  let orf = contracts * 0.0115;
  
  let miscFees = orf;
  
  if (isSell) {
    // Trading Activity Fee (TAF): $0.00279 per contract (sells only)
    let taf = contracts * 0.00279;
    
    // SEC Fee: $27.80 per $1,000,000 of principal (sells only)
    let principal = contracts * premium * 100;
    let secFee = Math.round((principal * 27.80) / 1000000 * 100) / 100;
    
    miscFees += taf + secFee;
  }
  
  return {
    commissions: Math.round(commissions * 100) / 100,
    miscFees: Math.round(miscFees * 100) / 100
  };
}
