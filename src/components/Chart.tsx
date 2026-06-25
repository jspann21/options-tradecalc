import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${symbol || 'SPY'}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "#09090b",
        "gridColor": "#27272a",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_${Math.random().toString(36).substring(7)}",
        "support_host": "https://www.tradingview.com"
      }`;
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
    </div>
  );
}

export default memo(TradingViewWidget);
