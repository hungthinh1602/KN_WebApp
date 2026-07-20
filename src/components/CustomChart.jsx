import React, { useState, useRef, useEffect } from 'react';

// Mock datasets for different intervals
const chartDataSets = {
  '1H': [
    { date: '10:00', value: 100 },
    { date: '10:10', value: 120 },
    { date: '10:20', value: 110 },
    { date: '10:30', value: 135 },
    { date: '10:40', value: 130 },
    { date: '10:50', value: 155 },
    { date: '11:00', value: 180 }
  ],
  '1D': [
    { date: '04:00', value: 120 },
    { date: '08:00', value: 210 },
    { date: '12:00', value: 180 },
    { date: '16:00', value: 290 },
    { date: '20:00', value: 310 },
    { date: '24:00', value: 380 }
  ],
  '1W': [
    { date: '15 OCT', value: 120 },
    { date: '20 OCT', value: 115 },
    { date: '25 OCT', value: 160 },
    { date: '30 OCT', value: 280 },
    { date: '04 NOV', value: 275 },
    { date: 'TODAY', value: 420.20 }
  ],
  '1M': [
    { date: '01 Oct', value: 80 },
    { date: '05 Oct', value: 95 },
    { date: '10 Oct', value: 110 },
    { date: '15 Oct', value: 140 },
    { date: '20 Oct', value: 180 },
    { date: '25 Oct', value: 290 },
    { date: '30 Oct', value: 320 },
    { date: '05 Nov', value: 390 },
    { date: '10 Nov', value: 450 },
    { date: '15 Nov', value: 580 }
  ]
};

export const CustomChart = ({ activeInterval, onIntervalChange }) => {
  const data = chartDataSets[activeInterval] || chartDataSets['1W'];
  const svgRef = useRef(null);
  
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [svgWidth, setSvgWidth] = useState(600);
  const [svgHeight, setSvgHeight] = useState(220);

  // Resize listener to make SVG responsive
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        setSvgWidth(svgRef.current.clientWidth);
        setSvgHeight(svgRef.current.clientHeight);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const padding = { top: 30, right: 30, bottom: 40, left: 30 };
  
  // Calculate min and max values to scale
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values) * 1.1;
  const minValue = Math.min(...values) * 0.9;
  const valueRange = maxValue - minValue;

  // Map points to SVG viewbox
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * (svgWidth - padding.left - padding.right);
    const y = svgHeight - padding.bottom - ((d.value - minValue) / valueRange) * (svgHeight - padding.top - padding.bottom);
    return { x, y, value: d.value, date: d.date };
  });

  // Calculate smooth Bezier path
  const getBezierPath = (pts) => {
    if (pts.length === 0) return '';
    let dPath = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      // Control points
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      dPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return dPath;
  };

  const linePath = getBezierPath(points);
  
  const bottomY = svgHeight - padding.bottom;
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
    : '';

  // Mouse Move Event Handler to track hover
  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Find nearest point
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = idx;
      }
    });
    
    setHoverIndex(nearestIndex);
    setHoveredPoint(points[nearestIndex]);
  };

  const handleMouseLeave = () => {
    setHoverIndex(-1);
    setHoveredPoint(null);
  };

  // Default peak point to show highlighted if not hovering
  // The screenshot shows a tooltip at the peak "+$420.20" when today is shown.
  const peakIndex = points.findIndex(pt => pt.value === Math.max(...values));
  const defaultHighlightPoint = points[peakIndex];

  const displayPoint = hoveredPoint || defaultHighlightPoint;
  const isHoverActive = hoverIndex !== -1;
  const activeIndex = isHoverActive ? hoverIndex : peakIndex;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Time filters header inside chart */}
      <div className="flex justify-between align-center" style={{ marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Tăng trưởng lợi nhuận</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            Hiệu suất {activeInterval === '1H' ? 'những giờ' : activeInterval === '1D' ? 'ngày' : activeInterval === '1W' ? '30 ngày' : 'tháng'} qua của các Bot tự động
          </p>
        </div>
        <div className="filter-pills">
          {['1H', '1D', '1W', '1M'].map((interval) => (
            <button
              key={interval}
              className={`filter-pill ${activeInterval === interval ? 'active' : ''}`}
              onClick={() => onIntervalChange(interval)}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ overflow: 'visible', cursor: 'crosshair' }}
        >
          <defs>
            {/* Glow gradient under path */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-success)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0" />
            </linearGradient>
            
            {/* Filter for glow effect */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--color-success)" floodOpacity="0.6"/>
            </filter>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + ratio * (svgHeight - padding.top - padding.bottom);
            return (
              <line
                key={idx}
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="var(--border-color)"
                strokeOpacity="0.3"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area under curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chartGradient)"
            />
          )}

          {/* Path line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Hover indicator vertical line */}
          {isHoverActive && hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={bottomY}
              stroke="var(--text-secondary)"
              strokeOpacity="0.4"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* X Axis Labels */}
          {points.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={svgHeight - 12}
              fill="var(--text-secondary)"
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              opacity={isHoverActive && idx !== activeIndex ? '0.4' : '0.8'}
            >
              {pt.date}
            </text>
          ))}

          {/* Active Highlight Dot */}
          {displayPoint && (
            <g>
              {/* Outer Pulse */}
              <circle
                cx={displayPoint.x}
                cy={displayPoint.y}
                r="8"
                fill="var(--color-success)"
                fillOpacity="0.3"
              />
              {/* Core glowing dot */}
              <circle
                cx={displayPoint.x}
                cy={displayPoint.y}
                r="4.5"
                fill="var(--color-success)"
                filter="url(#glow)"
              />
            </g>
          )}
        </svg>

        {/* Custom Tooltip Rendered in HTML for perfect styling */}
        {displayPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${displayPoint.x}px`,
              top: `${displayPoint.y - 45}px`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(16, 185, 129, 0.95)',
              color: '#070c14',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              boxShadow: 'var(--shadow-success-glow)',
              pointerEvents: 'none',
              transition: 'all 0.15s ease-out',
              whiteSpace: 'nowrap',
              zIndex: 10
            }}
          >
            {displayPoint.value >= 0 ? '+' : ''}${displayPoint.value.toFixed(2)}
            {/* Tooltip Arrow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '8px',
                height: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.95)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
