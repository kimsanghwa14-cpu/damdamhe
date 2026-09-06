/**
 * Financial Market Indicators Mock Data and Chart Generator
 */

// Helper to generate a random-walk historical series
function generateHistoricalData(startPrice, pointsCount, volatility = 0.01, trend = 0.0002) {
  const data = [];
  let currentPrice = startPrice;
  const now = new Date();

  for (let i = pointsCount - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

    const changePercent = (Math.random() - 0.48) * volatility + trend;
    const open = currentPrice;
    const close = currentPrice * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.4));
    const low = Math.min(open, close) * (1 - Math.random() * (volatility * 0.4));
    const volume = Math.round(100000 + Math.random() * 900000);

    data.push({
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }
  return data;
}

// Generate intraday sparkline points (24 hours)
function generateSparkline(startPrice, pointsCount = 20, volatility = 0.005) {
  const points = [];
  let currentPrice = startPrice;
  for (let i = 0; i < pointsCount; i++) {
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = currentPrice * (1 + change);
    points.push(parseFloat(currentPrice.toFixed(2)));
  }
  return points;
}

export const getMarketIndicators = () => {
  return [
    {
      id: 'kospi',
      name: '코스피',
      englishName: 'KOSPI',
      category: '국내지수',
      symbol: 'KOSPI',
      currentPrice: 2542.15,
      prevClose: 2510.76,
      unit: 'pt',
      sparkline: generateSparkline(2542.15, 24, 0.003),
      historical: {
        '1D': generateHistoricalData(2520, 24, 0.002, 0.0005),
        '1W': generateHistoricalData(2490, 7, 0.008, 0.001),
        '1M': generateHistoricalData(2450, 30, 0.012, 0.0015),
        '1Y': generateHistoricalData(2200, 100, 0.02, 0.002),
      }
    },
    {
      id: 'kosdaq',
      name: '코스닥',
      englishName: 'KOSDAQ',
      category: '국내지수',
      symbol: 'KOSDAQ',
      currentPrice: 862.40,
      prevClose: 866.30,
      unit: 'pt',
      sparkline: generateSparkline(862.40, 24, 0.004),
      historical: {
        '1D': generateHistoricalData(868, 24, 0.003, -0.0004),
        '1W': generateHistoricalData(875, 7, 0.01, -0.001),
        '1M': generateHistoricalData(850, 30, 0.015, 0.0005),
        '1Y': generateHistoricalData(780, 100, 0.025, 0.001),
      }
    },
    {
      id: 'sp500',
      name: 'S&P 500',
      englishName: 'S&P 500',
      category: '글로벌지수',
      symbol: 'SPX',
      currentPrice: 5137.08,
      prevClose: 5096.30,
      unit: 'pt',
      sparkline: generateSparkline(5137.08, 24, 0.002),
      historical: {
        '1D': generateHistoricalData(5100, 24, 0.002, 0.0006),
        '1W': generateHistoricalData(5050, 7, 0.006, 0.002),
        '1M': generateHistoricalData(4980, 30, 0.01, 0.003),
        '1Y': generateHistoricalData(4400, 100, 0.018, 0.004),
      }
    },
    {
      id: 'nasdaq',
      name: '나스닥 100',
      englishName: 'NASDAQ',
      category: '글로벌지수',
      symbol: 'NDX',
      currentPrice: 16274.94,
      prevClose: 16091.13,
      unit: 'pt',
      sparkline: generateSparkline(16274.94, 24, 0.004),
      historical: {
        '1D': generateHistoricalData(16120, 24, 0.003, 0.0008),
        '1W': generateHistoricalData(15900, 7, 0.009, 0.003),
        '1M': generateHistoricalData(15500, 30, 0.014, 0.004),
        '1Y': generateHistoricalData(13500, 100, 0.024, 0.005),
      }
    },
    {
      id: 'usdkrw',
      name: '원/달러 환율',
      englishName: 'USD/KRW',
      category: '외환',
      symbol: 'USDKRW',
      currentPrice: 1324.50,
      prevClose: 1328.70,
      unit: '원',
      sparkline: generateSparkline(1324.50, 24, 0.002),
      historical: {
        '1D': generateHistoricalData(1329, 24, 0.0015, -0.0003),
        '1W': generateHistoricalData(1335, 7, 0.004, -0.001),
        '1M': generateHistoricalData(1320, 30, 0.008, 0.0002),
        '1Y': generateHistoricalData(1280, 100, 0.015, 0.0005),
      }
    },
    {
      id: 'eurkrw',
      name: '원/유로 환율',
      englishName: 'EUR/KRW',
      category: '외환',
      symbol: 'EURKRW',
      currentPrice: 1438.20,
      prevClose: 1435.10,
      unit: '원',
      sparkline: generateSparkline(1438.20, 24, 0.002),
      historical: {
        '1D': generateHistoricalData(1435, 24, 0.0015, 0.0002),
        '1W': generateHistoricalData(1432, 7, 0.004, 0.0005),
        '1M': generateHistoricalData(1420, 30, 0.007, 0.001),
        '1Y': generateHistoricalData(1380, 100, 0.013, 0.001),
      }
    },
    {
      id: 'gold',
      name: '국제 금시세',
      englishName: 'Gold',
      category: '원자재',
      symbol: 'GOLD',
      currentPrice: 2178.60,
      prevClose: 2168.90,
      unit: '달러/온스',
      sparkline: generateSparkline(2178.60, 24, 0.003),
      historical: {
        '1D': generateHistoricalData(2170, 24, 0.002, 0.0004),
        '1W': generateHistoricalData(2140, 7, 0.007, 0.002),
        '1M': generateHistoricalData(2030, 30, 0.011, 0.003),
        '1Y': generateHistoricalData(1850, 100, 0.022, 0.003),
      }
    },
    {
      id: 'wti',
      name: 'WTI 유가',
      englishName: 'WTI Crude',
      category: '원자재',
      symbol: 'CL=F',
      currentPrice: 78.26,
      prevClose: 79.15,
      unit: '달러/배럴',
      sparkline: generateSparkline(78.26, 24, 0.006),
      historical: {
        '1D': generateHistoricalData(79.3, 24, 0.004, -0.001),
        '1W': generateHistoricalData(78.5, 7, 0.012, -0.0005),
        '1M': generateHistoricalData(75.0, 30, 0.018, 0.001),
        '1Y': generateHistoricalData(68.0, 100, 0.03, 0.0015),
      }
    },
    {
      id: 'us10y',
      name: '미 국채 10년 금리',
      englishName: 'US 10Y Yield',
      category: '채권',
      symbol: 'US10Y',
      currentPrice: 4.185,
      prevClose: 4.152,
      unit: '%',
      sparkline: generateSparkline(4.185, 24, 0.004),
      historical: {
        '1D': generateHistoricalData(4.15, 24, 0.003, 0.0008),
        '1W': generateHistoricalData(4.22, 7, 0.009, -0.001),
        '1M': generateHistoricalData(4.10, 30, 0.014, 0.0015),
        '1Y': generateHistoricalData(3.50, 100, 0.025, 0.002),
      }
    }
  ];
};

// Colors associated with styling types
export const CHART_THEMES = {
  modernDark: {
    name: '모던 다크 (Midnight)',
    bg: '#111827',
    cardBg: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    border: '#374151',
    upColor: '#10b981', // emerald
    downColor: '#ef4444', // red
    accent: '#6366f1', // indigo
    fontFamily: 'system-ui, sans-serif'
  },
  classicLight: {
    name: '클래식 라이트 (Snow)',
    bg: '#f9fafb',
    cardBg: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    upColor: '#ea580c', // orange/red
    downColor: '#2563eb', // blue
    accent: '#4f46e5', // indigo
    fontFamily: 'system-ui, sans-serif'
  },
  navyGold: {
    name: '로열 네이비 (Navy Gold)',
    bg: '#0a192f',
    cardBg: '#112240',
    text: '#f8fafc',
    textMuted: '#8892b0',
    border: '#233554',
    upColor: '#64ffda', // aqua
    downColor: '#ff6b6b', // soft red
    accent: '#f59e0b', // gold/amber
    fontFamily: 'system-ui, sans-serif'
  },
  emeraldForest: {
    name: '에메랄드 포레스트 (Nature)',
    bg: '#064e3b',
    cardBg: '#065f46',
    text: '#ecfdf5',
    textMuted: '#a7f3d0',
    border: '#047857',
    upColor: '#34d399', // bright green
    downColor: '#f87171', // soft red
    accent: '#fcd34d', // warm yellow
    fontFamily: 'system-ui, sans-serif'
  }
};
