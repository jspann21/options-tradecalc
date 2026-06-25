import React, { useState } from 'react';
import { Plus, Trash2, Activity, PieChart, TrendingUp, HelpCircle, Calculator, Pencil } from 'lucide-react';
import { BuyPosition, NumericFieldValue, SellPosition } from './types';
import Chart from './components/Chart';
import { formatCurrency, generateId, getEstimatedOptionsFees } from './utils';

const parseNumericInput = (value: string): NumericFieldValue => {
  if (value === '') return '';

  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};
const toNumber = (value: NumericFieldValue): number => value === '' ? 0 : value;

export default function App() {
  const initialBuyFees = getEstimatedOptionsFees(50, 0.97, false);
  const [buyPosition, setBuyPosition] = useState<BuyPosition>({
    type: 'Call',
    ticker: 'SPY',
    contracts: 50,
    premium: 0.97,
    miscFees: initialBuyFees.miscFees,
    commissions: initialBuyFees.commissions,
    multiplier: 100,
  });

  const [sells, setSells] = useState<SellPosition[]>([]);
  const [expandedSellId, setExpandedSellId] = useState<string | null>(null);
  const [chartTicker, setChartTicker] = useState('SPY');
  const [tempTicker, setTempTicker] = useState('SPY');

  const addSell = () => {
    const defaultFees = getEstimatedOptionsFees(1, 2.00, true);
    const newSell = {
      id: generateId(),
      contracts: 1,
      premium: 2.00,
      miscFees: defaultFees.miscFees,
      commissions: defaultFees.commissions,
    };

    setSells(prev => [newSell, ...prev]);
    setExpandedSellId(newSell.id);
  };

  const removeSell = (id: string) => {
    setSells(prev => prev.filter(s => s.id !== id));
    setExpandedSellId(prev => prev === id ? null : prev);
  };

  const updateBuyPosition = (field: keyof BuyPosition, value: NumericFieldValue) => {
    setBuyPosition(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'contracts' || field === 'premium') {
        const fees = getEstimatedOptionsFees(toNumber(updated.contracts), toNumber(updated.premium), false);
        updated.miscFees = fees.miscFees;
        updated.commissions = fees.commissions;
      }
      return updated;
    });
  };

  const updateSell = (id: string, field: keyof SellPosition, value: NumericFieldValue) => {
    setSells(sells.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'contracts' || field === 'premium') {
          const fees = getEstimatedOptionsFees(toNumber(updated.contracts), toNumber(updated.premium), true);
          updated.miscFees = fees.miscFees;
          updated.commissions = fees.commissions;
        }
        return updated;
      }
      return s;
    }));
  };

  const applyEstimatedFees = () => {
    const buyFees = getEstimatedOptionsFees(toNumber(buyPosition.contracts), toNumber(buyPosition.premium), false);
    setBuyPosition({
      ...buyPosition,
      miscFees: buyFees.miscFees,
      commissions: buyFees.commissions,
    });
    
    setSells(sells.map(sell => {
      const sellFees = getEstimatedOptionsFees(toNumber(sell.contracts), toNumber(sell.premium), true);
      return {
        ...sell,
        miscFees: sellFees.miscFees,
        commissions: sellFees.commissions
      };
    }));
  };

  const buyContracts = toNumber(buyPosition.contracts);
  const buyPremium = toNumber(buyPosition.premium);
  const buyTradeValue = (buyContracts * buyPremium * buyPosition.multiplier);
  const safeBuyMiscFees = Math.abs(toNumber(buyPosition.miscFees));
  const safeBuyCommissions = Math.abs(toNumber(buyPosition.commissions));
  const totalBuyFees = safeBuyMiscFees + safeBuyCommissions;
  
  const displayPrincipal = buyTradeValue;
  const displayCostBasis = buyTradeValue + totalBuyFees;
  
  const costPerContract = buyContracts > 0 ? buyTradeValue / buyContracts : 0;
  const buyFeePerContract = buyContracts > 0 ? totalBuyFees / buyContracts : 0;

  let totalSoldContracts = 0;
  let totalRealizedProfit = 0;

  const sellsWithProfit = sells.map(sell => {
    const sellContracts = toNumber(sell.contracts);
    const sellPremium = toNumber(sell.premium);
    const sellTradeValue = (sellContracts * sellPremium * buyPosition.multiplier);
    const safeSellMiscFees = Math.abs(toNumber(sell.miscFees));
    const safeSellCommissions = Math.abs(toNumber(sell.commissions));
    const sellFees = safeSellMiscFees + safeSellCommissions;

    const allocatedBuyCost = sellContracts * costPerContract;
    const allocatedBuyFees = sellContracts * buyFeePerContract;
    
    const profit = sellTradeValue - allocatedBuyCost - sellFees - allocatedBuyFees;
    const allocatedCapital = allocatedBuyCost + allocatedBuyFees;
    const roi = allocatedCapital > 0 ? (profit / allocatedCapital) * 100 : 0;
    
    totalSoldContracts += sellContracts;
    totalRealizedProfit += profit;
    
    return { ...sell, profit, roi, proceeds: sellTradeValue };
  });

  const remainingContracts = Math.max(0, buyContracts - totalSoldContracts);
  const totalCapitalInvested = buyTradeValue + totalBuyFees;
  const totalReturnPercentage = totalCapitalInvested > 0 ? (totalRealizedProfit / totalCapitalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 pb-20">
      <header className="border-b border-zinc-800/60 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-zinc-950" />
            </div>
            <h1 className="text-sm font-medium tracking-tight text-zinc-100">TradeCalc</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-4">
        {/* Left Column: Calculator */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <PieChart className="w-3.5 h-3.5" /> Initial Position
              </h2>
              <button 
                onClick={applyEstimatedFees}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700/50"
                title="Auto-fill estimated fees"
              >
                <Calculator className="w-3 h-3" /> Est. Fees
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Ticker</label>
                <input 
                  type="text" 
                  value={buyPosition.ticker}
                  onChange={e => setBuyPosition({...buyPosition, ticker: e.target.value.toUpperCase()})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-700"
                  placeholder="SPY"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Type</label>
                <select 
                  value={buyPosition.type}
                  onChange={e => setBuyPosition({...buyPosition, type: e.target.value as 'Call'|'Put'})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all appearance-none"
                >
                  <option>Call</option>
                  <option>Put</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Contracts</label>
                <input 
                  type="number" 
                  min="1"
                  value={buyPosition.contracts}
                  onChange={e => updateBuyPosition('contracts', parseNumericInput(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Premium</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={buyPosition.premium}
                  onChange={e => updateBuyPosition('premium', parseNumericInput(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Misc Fees</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={buyPosition.miscFees}
                  onChange={e => updateBuyPosition('miscFees', parseNumericInput(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Commissions</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={buyPosition.commissions}
                  onChange={e => updateBuyPosition('commissions', parseNumericInput(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-5 mt-2 border-t border-zinc-800/60 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="text-xs text-zinc-500">Principal Value</div>
                <div className="text-sm font-mono tracking-tight text-zinc-300">{formatCurrency(displayPrincipal)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-zinc-500 flex items-center gap-1">
                  Total Cost Basis
                  <span title="Principal + Commissions + Misc Fees">
                    <HelpCircle className="w-3 h-3 text-zinc-600" />
                  </span>
                </div>
                <div className="text-xl font-mono tracking-tight text-zinc-100">{formatCurrency(displayCostBasis)}</div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Sell Executions
              </h2>
              <button 
                onClick={addSell}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Trade
              </button>
            </div>
            
            <div className="space-y-3">
              {sellsWithProfit.map((sell, index) => {
                const executionNumber = sellsWithProfit.length - index;
                const isExpanded = expandedSellId === sell.id;

                if (!isExpanded) {
                  return (
                    <div key={sell.id} className="bg-zinc-900/25 border border-zinc-800/50 rounded-xl px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium text-zinc-500">Execution #{executionNumber}</div>
                            <div className="h-1 w-1 rounded-full bg-zinc-700" />
                            <div className="text-xs text-zinc-500">
                              {toNumber(sell.contracts)} @ {formatCurrency(toNumber(sell.premium))}
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <div className="text-xs text-zinc-500">Proceeds {formatCurrency(sell.proceeds)}</div>
                            <div className={`text-sm font-mono ${sell.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {sell.profit >= 0 ? '+' : ''}{formatCurrency(sell.profit)}
                            </div>
                            <div className={`text-xs font-mono ${sell.roi >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                              {sell.roi >= 0 ? '+' : ''}{sell.roi.toFixed(2)}% ROI
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpandedSellId(sell.id)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
                            title="Edit trade"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeSell(sell.id)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-600 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors"
                            title="Remove trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={sell.id} className="bg-zinc-900/40 border border-zinc-700/80 rounded-2xl p-5 space-y-4 relative group shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                    <button 
                      onClick={() => removeSell(sell.id)}
                      className="absolute top-4 right-4 text-zinc-600 hover:text-rose-400 transition-colors"
                      title="Remove trade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="text-xs font-medium text-zinc-400">Execution #{executionNumber} - Current Entry</div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-500 uppercase tracking-wider truncate">Contracts</label>
                        <input 
                          type="number" 
                          value={sell.contracts}
                          onChange={e => updateSell(sell.id, 'contracts', parseNumericInput(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-500 uppercase tracking-wider truncate">Premium</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={sell.premium}
                          onChange={e => updateSell(sell.id, 'premium', parseNumericInput(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-500 uppercase tracking-wider truncate">Misc Fees</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={sell.miscFees}
                          onChange={e => updateSell(sell.id, 'miscFees', parseNumericInput(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-500 uppercase tracking-wider truncate">Comms</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={sell.commissions}
                          onChange={e => updateSell(sell.id, 'commissions', parseNumericInput(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800/40">
                      <div className="flex flex-col">
                        <div className="text-xs text-zinc-500">Realized P&L</div>
                        <div className={`text-xs font-mono mt-0.5 ${sell.roi >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                          {sell.roi >= 0 ? '+' : ''}{sell.roi.toFixed(2)}% ROI
                        </div>
                      </div>
                      <div className={`text-base font-mono tracking-tight ${sell.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sell.profit >= 0 ? '+' : ''}{formatCurrency(sell.profit)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {sells.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-zinc-800/80 rounded-2xl text-zinc-600 bg-zinc-900/10">
                  <Activity className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-sm text-zinc-500">No sell executions yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
        
        {/* Right Column: Summary & Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-auto lg:h-[800px]">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              <div className="text-xs text-zinc-500 mb-1.5 font-medium">Realized P&L</div>
              <div className={`text-2xl font-mono tracking-tight ${totalRealizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalRealizedProfit >= 0 ? '+' : ''}{formatCurrency(totalRealizedProfit)}
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              <div className="text-xs text-zinc-500 mb-1.5 font-medium">Remaining Qty</div>
              <div className="text-2xl font-mono tracking-tight text-zinc-100">{remainingContracts}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              <div className="text-xs text-zinc-500 mb-1.5 font-medium">Breakeven Avg</div>
              <div className="text-2xl font-mono tracking-tight text-zinc-100">{formatCurrency(costPerContract / buyPosition.multiplier)}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              <div className="text-xs text-zinc-500 mb-1.5 font-medium">Net ROI</div>
              <div className={`text-2xl font-mono tracking-tight ${totalReturnPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalReturnPercentage >= 0 ? '+' : ''}{totalReturnPercentage.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 md:p-5 relative min-h-[400px]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Market Data
              </h2>
              <form onSubmit={e => { e.preventDefault(); setChartTicker(tempTicker); }} className="flex gap-2">
                <input 
                  type="text" 
                  value={tempTicker}
                  onChange={e => setTempTicker(e.target.value.toUpperCase())}
                  placeholder="Ticker..."
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors w-28 uppercase placeholder:normal-case"
                />
                <button type="submit" className="bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-colors border border-zinc-700/50">
                  Load
                </button>
              </form>
            </div>
            <div className="flex-1 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/50">
              <Chart symbol={chartTicker} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
