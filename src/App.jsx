import { useState, useEffect, useRef } from 'react';
import { getMarketIndicators, CHART_THEMES } from './data/marketData';
import './App.css';

function App() {
  // State variables
  const [marketData, setMarketData] = useState([]);
  const [selectedId, setSelectedId] = useState('kospi');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [chartType, setChartType] = useState('line'); // 'line' | 'candle'
  const [showSMA5, setShowSMA5] = useState(true);
  const [showSMA20, setShowSMA20] = useState(false);
  const [activeCategory, setActiveCategory] = useState('전체');

  // Share card exporter state
  const [exporterTheme, setExporterTheme] = useState('modernDark');
  const [exporterIndicators, setExporterIndicators] = useState(['kospi', 'sp500', 'usdkrw']);
  const [exporterComment, setExporterComment] = useState(
    '금일 국내외 증시는 반도체 섹터의 전반적인 강세 흐름에 힘입어 동반 상승 마감했습니다. 원달러 환율은 미국 연준의 비둘기파적 발언 여파와 인플레이션 둔화 신호로 소폭 하락 안정세를 연출하며 외국인 수급에 긍정적인 영향을 미쳤습니다.'
  );

  // Hover state for interactive chart tooltip
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Clock state
  const [time, setTime] = useState(new Date());

  // Refs
  const canvasRef = useRef(null);
  const chartContainerRef = useRef(null);

  // Categories definition
  const categories = ['전체', '국내지수', '글로벌지수', '외환', '원자재', '채권'];

  // Initialize data
  useEffect(() => {
    setMarketData(getMarketIndicators());
  }, []);

  // Live price fluctuation simulation (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketData((prevData) => {
        if (prevData.length === 0) return prevData;
        return prevData.map((item) => {
          // Check if market category is "open" (simulated check)
          const isUp = Math.random() > 0.45;
          const fluctuation = (Math.random() * 0.001) * (isUp ? 1 : -1);
          const newPrice = item.currentPrice * (1 + fluctuation);
          
          // Update sparkline (slide and add new)
          const updatedSparkline = [...item.sparkline.slice(1), parseFloat(newPrice.toFixed(2))];

          // Also update the current day's close price in the historical '1D' data
          const updatedHistorical = { ...item.historical };
          if (updatedHistorical['1D'] && updatedHistorical['1D'].length > 0) {
            const oneD = [...updatedHistorical['1D']];
            const lastPoint = { ...oneD[oneD.length - 1] };
            lastPoint.close = parseFloat(newPrice.toFixed(2));
            lastPoint.high = Math.max(lastPoint.high, lastPoint.close);
            lastPoint.low = Math.min(lastPoint.low, lastPoint.close);
            oneD[oneD.length - 1] = lastPoint;
            updatedHistorical['1D'] = oneD;
          }

          return {
            ...item,
            currentPrice: parseFloat(newPrice.toFixed(2)),
            sparkline: updatedSparkline,
            historical: updatedHistorical,
            lastTickDirection: isUp ? 'up' : 'down',
            tickTime: new Date()
          };
        });
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Update Clock
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Redraw preview canvas when indicators, theme, commentary, or market data changes
  useEffect(() => {
    if (marketData.length > 0) {
      drawShareCard();
    }
  }, [marketData, exporterTheme, exporterIndicators, exporterComment]);

  // Selected indicator details
  const selectedIndicator = marketData.find((item) => item.id === selectedId);

  // Filter indicators for dashboard grid
  const filteredIndicators = marketData.filter(
    (item) => activeCategory === '전체' || item.category === activeCategory
  );

  // Calculate Simple Moving Average helper
  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null); // Not enough data points
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, point) => acc + point.close, 0);
        sma.push(parseFloat((sum / period).toFixed(2)));
      }
    }
    return sma;
  };

  // Helper for drawing rounded rectangle on canvas
  const drawRoundedRect = (ctx, x, y, width, height, radius, fillStyle) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
  };

  // Helper for drawing sparkline curves on canvas
  const drawSparklineOnCanvas = (ctx, data, x, y, width, height, color) => {
    if (!data || data.length === 0) return;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    ctx.beginPath();
    const step = width / (data.length - 1);
    data.forEach((val, index) => {
      const px = x + index * step;
      const py = y + height - ((val - min) / range) * height;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill area below sparkline
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, color + '22'); // ~13% opacity
    gradient.addColorStop(1, color + '00'); // Transparent
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Text wrap helper for commentary canvas rendering
  const getWrappedText = (ctx, text, maxWidth) => {
    const chars = text.split('');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      // Keep newline characters intact
      if (char === '\n') {
        lines.push(currentLine);
        currentLine = '';
        continue;
      }
      const testLine = currentLine + char;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  // Generate / Draw the high resolution Shareable Image on HTML5 Canvas
  const drawShareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const theme = CHART_THEMES[exporterTheme];

    const width = 600;
    const height = 750;
    const scale = 2; // High-DPI Scale

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = '100%';
    canvas.style.maxWidth = '420px';

    ctx.scale(scale, scale);

    // Reset default text quality settings
    ctx.textBaseline = 'top';
    ctx.imageSmoothingEnabled = true;

    // Background Gradient Fill
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle background visual noise/grid for high professional index aesthetics
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 0.5;
    for (let i = 40; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 40; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Blend grid into background with subtle dark opacity overlay
    ctx.fillStyle = theme.bg === '#ffffff' || theme.bg === '#f9fafb' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(17, 24, 39, 0.88)';
    ctx.fillRect(0, 0, width, height);

    // Top Header Banner
    ctx.fillStyle = theme.accent;
    ctx.font = `bold 12px ${theme.fontFamily}`;
    ctx.fillText("FINANCIAL MARKET INTELLIGENCE", 35, 40);

    ctx.fillStyle = theme.text;
    ctx.font = `bold 26px ${theme.fontFamily}`;
    ctx.fillText("데일리 금융 마켓 브리핑", 35, 60);

    // Current Date display
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    const dateFormatted = new Date().toLocaleDateString('ko-KR', dateOptions);
    ctx.fillStyle = theme.textMuted;
    ctx.font = `500 13px ${theme.fontFamily}`;
    ctx.fillText(dateFormatted, 35, 95);

    // Branding accent horizontal bar
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 118);
    ctx.lineTo(110, 118);
    ctx.stroke();

    // Render Indicators layout (selected items)
    const cardYStart = 140;
    const itemHeight = 96;
    const maxIndicators = 4;
    const selectedList = exporterIndicators
      .map((id) => marketData.find((item) => item.id === id))
      .filter(Boolean)
      .slice(0, maxIndicators);

    selectedList.forEach((item, index) => {
      const cardY = cardYStart + index * (itemHeight + 12);
      const cardX = 35;
      const cardW = width - 70;

      // Draw bounding box
      drawRoundedRect(ctx, cardX, cardY, cardW, itemHeight, 8, theme.cardBg);
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top bar category indicator
      ctx.fillStyle = theme.text;
      ctx.font = `bold 15px ${theme.fontFamily}`;
      ctx.fillText(item.name, cardX + 16, cardY + 16);

      ctx.fillStyle = theme.textMuted;
      ctx.font = `500 10px ${theme.fontFamily}`;
      ctx.fillText(`${item.symbol} • ${item.category}`, cardX + 16, cardY + 36);

      // Calculations for percentage & prices
      const priceDiff = item.currentPrice - item.prevClose;
      const priceDiffPercent = (priceDiff / item.prevClose) * 100;
      const isUp = priceDiff >= 0;
      const sign = isUp ? '+' : '';
      const formattedPrice = item.currentPrice.toLocaleString('ko-KR', {
        minimumFractionDigits: item.unit === '원' ? 0 : 2,
        maximumFractionDigits: 3
      }) + ` ${item.unit}`;

      ctx.fillStyle = theme.text;
      ctx.font = `bold 18px ${theme.fontFamily}`;
      ctx.fillText(formattedPrice, cardX + 16, cardY + 54);

      const changeText = `${isUp ? '▲' : '▼'} ${sign}${priceDiff.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${sign}${priceDiffPercent.toFixed(2)}%)`;
      ctx.fillStyle = isUp ? theme.upColor : theme.downColor;
      ctx.font = `bold 12px ${theme.fontFamily}`;
      ctx.fillText(changeText, cardX + 16, cardY + 74);

      // Sparkline drawing to the right of card
      const sparkX = cardX + cardW - 165;
      const sparkY = cardY + 16;
      const sparkW = 150;
      const sparkH = 64;
      drawSparklineOnCanvas(ctx, item.sparkline, sparkX, sparkY, sparkW, sparkH, isUp ? theme.upColor : theme.downColor);
    });

    // Commentary Section
    const cardsTotalHeight = selectedList.length * (itemHeight + 12);
    const commentY = cardYStart + cardsTotalHeight + 6;
    const commentH = height - commentY - 60;
    const commentW = width - 70;

    drawRoundedRect(ctx, 35, commentY, commentW, commentH, 8, theme.cardBg);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Comment header
    ctx.fillStyle = theme.accent;
    ctx.font = `bold 13px ${theme.fontFamily}`;
    ctx.fillText("오늘의 마켓 요약 & 코멘트", 50, commentY + 16);

    // Draw wrap commentary lines
    ctx.fillStyle = theme.text;
    ctx.font = `13px/155% ${theme.fontFamily}`;
    const wrappedLines = getWrappedText(ctx, exporterComment, commentW - 30);
    wrappedLines.slice(0, 8).forEach((line, i) => {
      ctx.fillText(line, 50, commentY + 40 + i * 20);
    });

    // Draw Footer / Watermark
    ctx.fillStyle = theme.textMuted;
    ctx.font = `10px ${theme.fontFamily}`;
    ctx.fillText("※ 본 지표 정보는 실시간이 아니며 모의 투자 및 연구용 지표 데이터입니다.", 35, height - 38);
    
    ctx.fillStyle = theme.accent;
    ctx.font = `bold 10px ${theme.fontFamily}`;
    ctx.fillText("FINANCE VISUAL REPORT GENERATOR", 35, height - 24);

    ctx.fillStyle = theme.textMuted;
    const brandText = "Designed by Finance Dashboard Dashboard Hub";
    const brandWidth = ctx.measureText(brandText).width;
    ctx.fillText(brandText, width - brandWidth - 35, height - 24);
  };

  // Trigger PNG download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    
    // Create elegant file name containing today's date
    const dateFormatted = new Date().toISOString().split('T')[0];
    link.download = `MarketBrief_${dateFormatted}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exporter select handler
  const toggleIndicatorInExporter = (id) => {
    setExporterIndicators((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 4) return prev; // Max 4 indicators allowed
        return [...prev, id];
      }
    });
  };

  // Rendering chart calculations
  const renderChart = () => {
    if (!selectedIndicator) return null;
    const hData = selectedIndicator.historical[selectedTimeframe] || [];
    if (hData.length === 0) return null;

    const closePrices = hData.map((d) => d.close);
    const highPrices = hData.map((d) => d.high);
    const lowPrices = hData.map((d) => d.low);

    // Compute range bound
    let maxVal = Math.max(...highPrices);
    let minVal = Math.min(...lowPrices);
    const diff = maxVal - minVal;
    maxVal += diff * 0.05; // 5% padding top
    minVal -= diff * 0.05; // 5% padding bottom
    const range = maxVal - minVal || 1;

    // View box metrics
    const width = 640;
    const height = 300;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;
    const pointsCount = hData.length;
    const stepX = chartW / (pointsCount - 1 || 1);

    // Transform coordinate helpers
    const getX = (index) => paddingLeft + index * stepX;
    const getY = (val) => paddingTop + chartH - ((val - minVal) / range) * chartH;

    // Calculate SMAs
    const sma5Values = calculateSMA(hData, 5);
    const sma20Values = calculateSMA(hData, 20);

    // Create Line Path
    let linePath = '';
    hData.forEach((point, i) => {
      const px = getX(i);
      const py = getY(point.close);
      if (i === 0) linePath += `M ${px} ${py}`;
      else linePath += ` L ${px} ${py}`;
    });

    // Create Filled area path (for Line chart)
    const areaPath = linePath ? `${linePath} L ${getX(pointsCount - 1)} ${paddingTop + chartH} L ${getX(0)} ${paddingTop + chartH} Z` : '';

    // Create SMA5 Path
    let sma5Path = '';
    if (showSMA5) {
      sma5Values.forEach((val, i) => {
        if (val !== null) {
          const px = getX(i);
          const py = getY(val);
          if (sma5Path === '') sma5Path += `M ${px} ${py}`;
          else sma5Path += ` L ${px} ${py}`;
        }
      });
    }

    // Create SMA20 Path
    let sma20Path = '';
    if (showSMA20) {
      sma20Values.forEach((val, i) => {
        if (val !== null) {
          const px = getX(i);
          const py = getY(val);
          if (sma20Path === '') sma20Path += `M ${px} ${py}`;
          else sma20Path += ` L ${px} ${py}`;
        }
      });
    }

    // Interactive Hover Handler over the Chart SVG
    const handleMouseMove = (e) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      // Calculate index corresponding to SVG coordinates
      const relativeX = mouseX - (paddingLeft / width) * rect.width;
      const relativeChartW = (chartW / width) * rect.width;
      const indexPercent = relativeX / relativeChartW;
      let idx = Math.round(indexPercent * (pointsCount - 1));
      
      if (idx < 0) idx = 0;
      if (idx >= pointsCount) idx = pointsCount - 1;

      if (hData[idx]) {
        const p = hData[idx];
        setHoveredIndex(idx);
        setHoveredPoint(p);
        
        // Compute tooltip coordinates relative to SVG
        const toolX = getX(idx);
        const toolY = getY(p.close);
        setTooltipPos({ x: toolX, y: toolY });
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      setHoveredIndex(null);
    };

    // Calculate Y Axis ticks
    const ticksCount = 5;
    const yTicks = Array.from({ length: ticksCount }, (_, i) => {
      const val = minVal + (range / (ticksCount - 1)) * i;
      return parseFloat(val.toFixed(2));
    });

    // Filter x ticks depending on timeframe
    const xTicksInterval = Math.max(1, Math.floor(pointsCount / 6));
    const xTicks = hData.filter((_, i) => i % xTicksInterval === 0 || i === pointsCount - 1);

    const isIndicatorUp = selectedIndicator.currentPrice >= selectedIndicator.prevClose;
    const colorTheme = isIndicatorUp ? 'stroke-emerald-500 fill-emerald-500' : 'stroke-red-500 fill-red-500';

    return (
      <div className="relative w-full" ref={chartContainerRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none bg-slate-900/40 rounded-xl border border-slate-800/80 p-1"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={`y-grid-${i}`}>
              <line
                x1={paddingLeft}
                y1={getY(tick)}
                x2={width - paddingRight}
                y2={getY(tick)}
                className="stroke-slate-800/60"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={getY(tick) + 4}
                className="text-[10px] font-mono fill-slate-500 text-right"
                textAnchor="end"
              >
                {tick.toLocaleString('ko-KR')}
              </text>
            </g>
          ))}

          {/* Timeframe X-axis Labels */}
          {hData.map((d, i) => {
            if (i % xTicksInterval === 0 || i === pointsCount - 1) {
              return (
                <text
                  key={`x-label-${i}`}
                  x={getX(i)}
                  y={height - paddingBottom + 18}
                  className="text-[10px] font-mono fill-slate-500 text-center"
                  textAnchor="middle"
                >
                  {d.date}
                </text>
              );
            }
            return null;
          })}

          {/* Line Chart Area Fill & Stroke */}
          {chartType === 'line' && (
            <>
              {/* Fill Gradient */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isIndicatorUp ? '#10b981' : '#ef4444'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={isIndicatorUp ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#chartGrad)" />
              <path
                d={linePath}
                fill="none"
                className={isIndicatorUp ? 'stroke-emerald-500' : 'stroke-red-500'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlestick Chart Candles */}
          {chartType === 'candle' &&
            hData.map((point, i) => {
              const cx = getX(i);
              const cyOpen = getY(point.open);
              const cyClose = getY(point.close);
              const cyHigh = getY(point.high);
              const cyLow = getY(point.low);

              const isCandleUp = point.close >= point.open;
              const candleColor = isCandleUp ? 'stroke-emerald-500 fill-emerald-500' : 'stroke-red-500 fill-red-500';
              const candleW = Math.max(2, Math.min(14, stepX * 0.7));

              return (
                <g key={`candle-${i}`}>
                  {/* High/Low Shadow Wick line */}
                  <line
                    x1={cx}
                    y1={cyHigh}
                    x2={cx}
                    y2={cyLow}
                    className={isCandleUp ? 'stroke-emerald-500/80' : 'stroke-red-500/80'}
                    strokeWidth={1.5}
                  />
                  {/* Open/Close Real Body bar */}
                  <rect
                    x={cx - candleW / 2}
                    y={Math.min(cyOpen, cyClose)}
                    width={candleW}
                    height={Math.max(1.5, Math.abs(cyOpen - cyClose))}
                    className={candleColor}
                    rx={1}
                  />
                </g>
              );
            })}

          {/* Moving Average lines overlay */}
          {showSMA5 && sma5Path && (
            <path
              d={sma5Path}
              fill="none"
              stroke="#eab308"
              strokeWidth={1.5}
              strokeDasharray="1"
              strokeLinecap="round"
              className="opacity-90"
            />
          )}

          {showSMA20 && sma20Path && (
            <path
              d={sma20Path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="2"
              strokeLinecap="round"
              className="opacity-90"
            />
          )}

          {/* Interactive Hover Crosshair Guides */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={height - paddingBottom}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <line
                x1={paddingLeft}
                y1={getY(hoveredPoint.close)}
                x2={width - paddingRight}
                y2={getY(hoveredPoint.close)}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(hoveredPoint.close)}
                r={5}
                className={isIndicatorUp ? 'fill-emerald-500 stroke-slate-900' : 'fill-red-500 stroke-slate-900'}
                strokeWidth={1.5}
              />
            </g>
          )}
        </svg>

        {/* Live SVG Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-3 bg-slate-950/95 text-slate-100 rounded-lg shadow-xl border border-slate-700/80 text-xs font-mono backdrop-blur-sm transition-all duration-75"
            style={{
              left: `${(tooltipPos.x / width) * 100}%`,
              top: `${(tooltipPos.y / height) * 100 - 30}%`,
              transform: 'translate(-50%, -100%)',
              minWidth: '150px'
            }}
          >
            <div className="font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
              <span>{hoveredPoint.date}</span>
              <span className={hoveredPoint.close >= hoveredPoint.open ? 'text-emerald-400' : 'text-red-400'}>
                {hoveredPoint.close >= hoveredPoint.open ? '▲ 상승' : '▼ 하락'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className="text-slate-500">종가 (Close):</span>
              <span className="text-right font-bold">{hoveredPoint.close.toLocaleString()}</span>
              {chartType === 'candle' && (
                <>
                  <span className="text-slate-500">시가 (Open):</span>
                  <span className="text-right">{hoveredPoint.open.toLocaleString()}</span>
                  <span className="text-slate-500">고가 (High):</span>
                  <span className="text-right text-emerald-500">{hoveredPoint.high.toLocaleString()}</span>
                  <span className="text-slate-500">저가 (Low):</span>
                  <span className="text-right text-red-500">{hoveredPoint.low.toLocaleString()}</span>
                </>
              )}
              <span className="text-slate-500">거래량 (Vol):</span>
              <span className="text-right text-slate-300">{(hoveredPoint.volume / 1000).toFixed(0)}K</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans leading-relaxed selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Main Header Layout */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black tracking-tighter shadow-md shadow-indigo-600/30">
              FX
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-indigo-200 m-0">
                FINANCIAL MARKET HUB
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
                Image Dashboard & Infographic Exporter
              </p>
            </div>
          </div>

          {/* Clock & Real-time Info Banner */}
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-900/60 rounded-full border border-slate-800/80 px-4 py-2 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-slate-400">MARKET LIVE</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <span>{time.toLocaleTimeString('ko-KR')}</span>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-indigo-400">{time.toLocaleDateString('ko-KR')}</span>
          </div>

        </div>
      </header>

      {/* Main Application Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Real-time Indicators & Detailed Interactive Charts (8 Columns) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Dashboard Header Section with Categories Tabs */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5M21 19.5H3.75M6.75 12h.008v.008H6.75V12zm0-6h.008v.008H6.75V6zm6 6h.008v.008h-.008V12zm0-6h.008v.008h-.008V6zm6 6h.008v.008h-.008V12zm0-6h.008v.008h-.008V6zM6.75 18h.008v.008H6.75V18zm6 0h.008v.008h-.008V18zm6 0h.008v.008h-.008V18z" />
                </svg>
                실시간 금융 지표 현황
              </h2>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                지표 클릭 시 상세 분석 차트 로드
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid of Indicator Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5">
              {filteredIndicators.map((item) => {
                const isSelected = item.id === selectedId;
                const change = item.currentPrice - item.prevClose;
                const changePercent = (change / item.prevClose) * 100;
                const isUp = change >= 0;
                const sign = isUp ? '+' : '';

                // Dynamic border class for current tick updates
                let pulseBorderClass = 'border-slate-800/80';
                if (item.lastTickDirection && (new Date() - item.tickTime < 1200)) {
                  pulseBorderClass = item.lastTickDirection === 'up' 
                    ? 'border-emerald-500 shadow-md shadow-emerald-950/20' 
                    : 'border-red-500 shadow-md shadow-red-950/20';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`relative cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[116px] ${
                      isSelected
                        ? 'bg-slate-800/70 border-indigo-500/80 shadow-lg shadow-indigo-950/20'
                        : `bg-slate-900/30 hover:bg-slate-800/40 hover:border-slate-700/80 ${pulseBorderClass}`
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block leading-none mb-1">
                          {item.symbol}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-200 truncate max-w-[110px] leading-tight">
                          {item.name}
                        </h3>
                      </div>
                      
                      {/* Active Status Ring Indicator */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-500'} ${item.lastTickDirection ? 'animate-pulse' : ''}`} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{item.category}</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mt-2.5">
                      <div className="text-base font-extrabold text-slate-100 font-mono tracking-tight">
                        {item.currentPrice.toLocaleString('ko-KR')}
                        <span className="text-[10px] font-bold text-slate-400 ml-1">{item.unit}</span>
                      </div>
                      <div className={`text-xs font-bold font-mono flex items-center gap-0.5 mt-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span>{isUp ? '▲' : '▼'}</span>
                        <span>{sign}{change.toFixed(2)}</span>
                        <span className="ml-1 text-[11px] opacity-90">({sign}{changePercent.toFixed(2)}%)</span>
                      </div>
                    </div>

                    {/* Mini sparkline floating background */}
                    <div className="absolute right-3 bottom-3 w-16 h-8 opacity-40 pointer-events-none">
                      <svg viewBox="0 0 60 30" className="w-full h-full">
                        <path
                          d={item.sparkline.reduce((acc, val, i) => {
                            const mx = (i / (item.sparkline.length - 1)) * 60;
                            const max = Math.max(...item.sparkline);
                            const min = Math.min(...item.sparkline);
                            const my = 30 - ((val - min) / (max - min || 1)) * 26 - 2;
                            return acc + (i === 0 ? `M ${mx} ${my}` : ` L ${mx} ${my}`);
                          }, '')}
                          fill="none"
                          className={isUp ? 'stroke-emerald-400' : 'stroke-red-400'}
                          strokeWidth={1.5}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Interactive Chart Section */}
          {selectedIndicator && (
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5 md:p-6 backdrop-blur-sm flex flex-col gap-5">
              
              {/* Target Indicator Header Stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                
                {/* Information */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {selectedIndicator.symbol}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{selectedIndicator.category} • {selectedIndicator.englishName}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-100 m-0 mt-1 flex items-baseline gap-2">
                    {selectedIndicator.name}
                    <span className="text-2xl font-mono tracking-tight text-indigo-300 font-extrabold">
                      {selectedIndicator.currentPrice.toLocaleString('ko-KR')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{selectedIndicator.unit}</span>
                  </h2>
                </div>

                {/* Statistics Box */}
                <div className="flex items-center gap-6 text-xs font-mono bg-slate-950/50 rounded-xl border border-slate-800 p-3">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium">이전 종가 (Prev Close)</span>
                    <span className="text-slate-300 font-bold mt-0.5">{selectedIndicator.prevClose.toLocaleString()}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-800" />
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium">변동률 (Change %)</span>
                    <span className={`font-bold mt-0.5 flex items-center gap-0.5 ${
                      selectedIndicator.currentPrice >= selectedIndicator.prevClose ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {selectedIndicator.currentPrice >= selectedIndicator.prevClose ? '▲' : '▼'}{' '}
                      {((selectedIndicator.currentPrice - selectedIndicator.prevClose) / selectedIndicator.prevClose * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

              </div>

              {/* Chart Toolbar Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/60">
                
                {/* Timeframe selector */}
                <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  {['1D', '1W', '1M', '1Y'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1 rounded text-[11px] font-bold font-mono uppercase transition-all ${
                        selectedTimeframe === tf
                          ? 'bg-slate-800 text-slate-100 shadow'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Chart type & Technical overlays */}
                <div className="flex items-center gap-3 flex-wrap">
                  
                  {/* Chart type toggle */}
                  <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        chartType === 'line' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      라인 (Line)
                    </button>
                    <button
                      onClick={() => setChartType('candle')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        chartType === 'candle' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      캔들 (Candle)
                    </button>
                  </div>

                  {/* Technical Indicators */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={showSMA5}
                        onChange={(e) => setShowSMA5(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                      />
                      <span className="text-yellow-500">SMA 5</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={showSMA20}
                        onChange={(e) => setShowSMA20(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                      />
                      <span className="text-blue-400">SMA 20</span>
                    </label>
                  </div>

                </div>

              </div>

              {/* Render dynamic Chart SVG */}
              {renderChart()}

              {/* Chart footer detail instructions */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                <span>* 마우스를 차트 위에 올리면 특정 시점의 시/고/저/종가 및 거래량을 볼 수 있습니다.</span>
                <span>단위: {selectedIndicator.unit}</span>
              </div>

            </div>
          )}

        </section>

        {/* Right Side: Visual Share Card Exporter & Live Preview WYSIWYG Panel (4-5 Columns) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5 backdrop-blur-sm flex flex-col gap-5">
            
            {/* Header */}
            <div>
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                인포그래픽 이미지 리포트 생성기
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                실시간 데이터와 맞춤 분석 코멘트를 반영해 소셜 및 보고서 전송용 카드 이미지를 제작합니다.
              </p>
            </div>

            {/* Customization controls tab */}
            <div className="flex flex-col gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              
              {/* Template design selector */}
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5">
                  1. 디자인 테마 템플릿
                </label>
                <select
                  value={exporterTheme}
                  onChange={(e) => setExporterTheme(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-semibold"
                >
                  {Object.entries(CHART_THEMES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected indicators checkboxes */}
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5 flex justify-between">
                  <span>2. 포함할 마켓 지표 선택</span>
                  <span className="text-indigo-400">({exporterIndicators.length}/4 개 선택)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 p-1">
                  {marketData.map((item) => {
                    const isChecked = exporterIndicators.includes(item.id);
                    return (
                      <button
                        key={`check-${item.id}`}
                        onClick={() => toggleIndicatorInExporter(item.id)}
                        className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          isChecked
                            ? 'bg-indigo-600/10 border-indigo-500/60 text-indigo-200'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate max-w-[85px]">{item.name}</span>
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[8px] font-black ${
                          isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-950 text-transparent'
                        }`}>
                          ✓
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Commentary Textbox */}
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1.5">
                  3. 일일 분석 코멘트 작성
                </label>
                <textarea
                  value={exporterComment}
                  onChange={(e) => setExporterComment(e.target.value)}
                  maxLength={180}
                  rows={4}
                  placeholder="오늘의 장 요약 설명과 주력 경제 이벤트 소식을 작성해 리포트에 박제해 보세요..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-3 outline-none focus:border-indigo-500 leading-relaxed font-semibold placeholder:text-slate-600 resize-none scrollbar-none"
                />
                <div className="text-[10px] text-right text-slate-500 font-bold mt-1">
                  {exporterComment.length} / 180 자
                </div>
              </div>

            </div>

            {/* WYSIWYG Live Preview Card Box */}
            <div className="flex flex-col items-center justify-center gap-3">
              <label className="text-[11px] font-extrabold uppercase text-slate-400 self-start">
                4. 실시간 완성본 인포그래픽 프리뷰
              </label>
              
              {/* HTML5 Canvas container */}
              <div className="relative w-full flex justify-center bg-slate-950 rounded-xl border border-slate-800 p-2.5 shadow-inner">
                <canvas ref={canvasRef} className="rounded-lg shadow-md border border-slate-800/50 max-w-[320px] sm:max-w-xs md:max-w-[340px]" />
              </div>

              {/* Download PNG Button */}
              <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                인포그래픽 리포트 PNG 이미지 다운로드
              </button>
            </div>

          </div>

        </section>

      </main>

      {/* Main Footer layout */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-8 mt-12 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="m-0">© 2026 Financial Market Intelligence Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300">개인정보처리방침</a>
            <a href="#" className="hover:text-slate-300">이용약관</a>
            <a href="#" className="hover:text-slate-300">데이터 공지</a>
            <a href="#" className="hover:text-slate-300">고객센터</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
