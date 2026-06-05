import { Calendar, Search, SlidersHorizontal, ArrowUpRight, CheckCircle2, XCircle, Loader2, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from './config';

// Beautiful SVG placeholder for missing images
function ImagePlaceholder({ isHarvest }) {
  const color = isHarvest ? '#2D6A4F' : '#D4A853';
  const bg = isHarvest ? 'rgba(45, 106, 79, 0.08)' : 'rgba(212, 168, 83, 0.08)';
  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '12px',
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2C8.5 2 5.5 4.5 5 8C3.3 8.5 2 10.1 2 12C2 14.2 3.8 16 6 16H18C20.2 16 22 14.2 22 12C22 10 20.5 8.3 18.5 8C17.5 4.6 14.9 2 12 2Z"
          fill={color} fillOpacity="0.25"
        />
        <circle cx="12" cy="11" r="2.5" fill={color} fillOpacity="0.6" />
        <path
          d="M8 20C8 20 9 17 12 17C15 17 16 20 16 20"
          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5"
        />
      </svg>
    </div>
  );
}

function LogSkeleton() {
  return (
    <div style={{
      background: 'white',
      padding: '14px',
      borderRadius: '18px',
      border: '1px solid rgba(27, 67, 50, 0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{ width: 58, height: 58, borderRadius: '14px', flexShrink: 0 }} className="animate-pulse bg-gray-200" />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, borderRadius: '7px', width: '40%', marginBottom: '8px' }} className="animate-pulse bg-gray-200" />
        <div style={{ height: 10, borderRadius: '5px', width: '65%', marginBottom: '6px' }} className="animate-pulse bg-gray-200" />
        <div style={{ height: 9, borderRadius: '5px', width: '35%' }} className="animate-pulse bg-gray-200" />
      </div>
    </div>
  );
}

function LogCard({ log, idx }) {
  const statusStr = log.status || '';
  const isHarvest = statusStr.toLowerCase().includes('harvest') && !statusStr.toLowerCase().includes('not');
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        background: 'white',
        padding: '12px',
        borderRadius: '18px',
        border: '1px solid rgba(27, 67, 50, 0.06)',
        boxShadow: '0 2px 12px rgba(27, 67, 50, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer',
        animationDelay: `${idx * 40}ms`,
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'scale(0.99)';
        e.currentTarget.style.boxShadow = '0 1px 6px rgba(27, 67, 50, 0.06)';
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(27, 67, 50, 0.04)';
      }}
      onTouchStart={e => {
        e.currentTarget.style.transform = 'scale(0.99)';
      }}
      onTouchEnd={e => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 58, height: 58,
        borderRadius: '14px',
        overflow: 'hidden',
        flexShrink: 0,
        border: `1.5px solid ${isHarvest ? 'rgba(45,106,79,0.12)' : 'rgba(212,168,83,0.18)'}`,
        background: isHarvest ? 'rgba(45,106,79,0.05)' : 'rgba(212,168,83,0.05)',
      }}>
        {log.imgUrl && !imgError ? (
          <img
            src={log.imgUrl}
            alt="Detection thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <ImagePlaceholder isHarvest={isHarvest} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Status badges */}
        <div className="flex items-center gap-1.5" style={{ marginBottom: '5px' }}>
          {isHarvest ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '9px', fontWeight: 800,
              color: '#1B4332',
              background: 'rgba(45, 106, 79, 0.10)',
              padding: '3px 8px', borderRadius: '20px',
              letterSpacing: '0.3px', textTransform: 'uppercase',
              border: '1px solid rgba(45, 106, 79, 0.12)',
            }}>
              <CheckCircle2 size={9} />
              Harvest
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '9px', fontWeight: 800,
              color: '#92400e',
              background: 'rgba(212, 168, 83, 0.12)',
              padding: '3px 8px', borderRadius: '20px',
              letterSpacing: '0.3px', textTransform: 'uppercase',
              border: '1px solid rgba(212, 168, 83, 0.18)',
            }}>
              <XCircle size={9} />
              Not Ready
            </span>
          )}
          <span style={{
            fontSize: '9px', fontWeight: 800,
            color: '#1d4ed8',
            background: 'rgba(29, 78, 216, 0.08)',
            padding: '3px 7px', borderRadius: '20px',
            letterSpacing: '0.2px',
            border: '1px solid rgba(29, 78, 216, 0.10)',
          }}>
            {log.confidence}%
          </span>
        </div>

        <p style={{
          fontSize: '12px', fontWeight: 700,
          color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '3px',
        }}>
          {log.log_id}
        </p>

        <p style={{ fontSize: '10px', color: '#6B7280', fontWeight: 400 }}>
          {log.date}
          <span style={{ color: 'rgba(27,67,50,0.20)', margin: '0 5px' }}>·</span>
          {log.time}
        </p>
      </div>

      {/* Action Button */}
      <button style={{
        width: 34, height: 34, borderRadius: '10px',
        background: 'rgba(27, 67, 50, 0.05)',
        border: '1px solid rgba(27, 67, 50, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}>
        <ArrowUpRight size={15} style={{ color: '#4B5563' }} strokeWidth={2} />
      </button>
    </div>
  );
}

export default function History() {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'harvest' | 'not'

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`${API_URL}/history/`);
        const data = await response.json();
        setHistoryLogs(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const safeLogs = Array.isArray(historyLogs) ? historyLogs : [];

  const filtered = safeLogs.filter(log => {
    const statusStr = log.status || ''; 
    const logIdStr = log.log_id || '';
    
    const isHarvest = statusStr.toLowerCase().includes('harvest') && !statusStr.toLowerCase().includes('not');
    
    const matchesSearch = logIdStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          statusStr.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'harvest' && isHarvest) ||
      (filterMode === 'not' && !isHarvest);
      
    return matchesSearch && matchesFilter;
  });

  const harvestTotal = safeLogs.filter(l => {
    const statusStr = l.status || '';
    return statusStr.toLowerCase().includes('harvest') && !statusStr.toLowerCase().includes('not');
  }).length;

  const notTotal = safeLogs.length - harvestTotal;

  return (
    <div style={{ background: '#F8F9FA', minHeight: '100%' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)',
        padding: '52px 20px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -20,
          width: 130, height: 130, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />

        <div className="flex justify-between items-center">
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.4px',
              lineHeight: 1.1,
            }}>Detection Logs</h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '3px', fontWeight: 400 }}>
              {safeLogs.length} total records
            </p>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '9px',
          }}>
            <Calendar size={18} color="white" strokeWidth={1.8} />
          </button>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-2" style={{ marginTop: '16px' }}>
          {[
            { label: 'All Records', value: safeLogs.length, mode: 'all', color: 'rgba(255,255,255,0.80)' },
            { label: 'Harvest', value: harvestTotal, mode: 'harvest', color: '#4ADE80' },
            { label: 'Not Ready', value: notTotal, mode: 'not', color: '#FBBF24' },
          ].map(({ label, value, mode, color }) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '12px',
                border: filterMode === mode
                  ? '1.5px solid rgba(255,255,255,0.35)'
                  : '1px solid rgba(255,255,255,0.08)',
                background: filterMode === mode
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: '2px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                {label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              size={15}
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by ID or status…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '14px',
                paddingTop: '11px',
                paddingBottom: '11px',
                borderRadius: '14px',
                border: '1px solid rgba(27, 67, 50, 0.10)',
                background: 'white',
                fontSize: '12px',
                color: '#374151',
                fontWeight: 400,
                outline: 'none',
                boxShadow: '0 2px 12px rgba(27, 67, 50, 0.05)',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(27, 67, 50, 0.30)';
                e.target.style.boxShadow = '0 4px 16px rgba(27, 67, 50, 0.10)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(27, 67, 50, 0.10)';
                e.target.style.boxShadow = '0 2px 12px rgba(27, 67, 50, 0.05)';
              }}
            />
          </div>
          
          {/* The Export Button */}
          <a 
            href={`${API_URL}/export-history/`} 
            download
            className="px-3 bg-white rounded-xl shadow-sm border border-gray-100 text-primary font-bold text-[10px] flex items-center justify-center hover:bg-green-50 transition-colors"
          >
            EXPORT CSV
          </a>
          
          <button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 flex items-center justify-center">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Log List */}
      <div style={{ padding: '0px 16px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? (
          <>
            <LogSkeleton />
            <LogSkeleton />
            <LogSkeleton />
            <LogSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            paddingTop: '60px', paddingBottom: '40px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '20px',
              background: 'rgba(27, 67, 50, 0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Leaf size={28} style={{ color: '#6B7280' }} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              No records found
            </p>
            <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {searchQuery ? 'Try a different search term' : 'Start scanning to build your log history'}
            </p>
          </div>
        ) : (
          filtered.map((log, idx) => (
            <LogCard key={log.id} log={log} idx={idx} />
          ))
        )}
      </div>
    </div>
  );
}