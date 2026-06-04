import {
  Bell, ClipboardCheck, WheatOff, Activity,
  Camera, Cpu, Server, HardDrive, CheckCircle2, XCircle, Loader2,
  TrendingUp, Leaf
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(26, 46, 31, 0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: '10px',
        padding: '8px 12px',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '11px', fontWeight: 600 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    harvest: 0,
    notHarvest: 0,
    avgConfidence: 0,
    trendData: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('http://localhost:8000/dashboard-stats/');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const distributionData = [
    { name: 'Harvest', value: stats.harvest, color: '#2D6A4F' },
    { name: 'Not Harvest', value: stats.notHarvest, color: '#D4A853' }
  ];

  const harvestPct = stats.total > 0 ? Math.round((stats.harvest / stats.total) * 100) : 0;
  const notHarvestPct = stats.total > 0 ? Math.round((stats.notHarvest / stats.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3" style={{ paddingTop: '40%' }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1B4332, #2D6A4F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(27, 67, 50, 0.30)',
        }}>
          <Loader2 className="animate-spin text-white" size={24} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar" style={{ background: 'var(--bg)', minHeight: '100%' }}>
      
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B4332 0%, #2D6A4F 60%, #40916C 100%)',
        padding: '52px 20px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -30,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute', top: 20, right: 50,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '6px',
                backdropFilter: 'blur(8px)',
              }}>
                <Leaf size={18} color="white" strokeWidth={2} />
              </div>
              <div>
                <h1 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '20px',
                  fontWeight: 400,
                  color: 'white',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}>PalmDetect AI</h1>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 400, marginTop: '2px', letterSpacing: '0.3px' }}>
              Precision Palm Oil Analytics
            </p>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '9px',
            position: 'relative',
          }}>
            <Bell size={18} color="white" strokeWidth={1.8} />
            <span style={{
              position: 'absolute', top: 8, right: 8,
              width: 7, height: 7, borderRadius: '50%',
              background: '#E9C46A',
              border: '1.5px solid rgba(27,67,50,0.5)',
            }} />
          </button>
        </div>

        {/* Top KPI Bar */}
        <div style={{
          marginTop: '24px',
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '0',
        }}>
          {[
            { label: 'Total', value: stats.total, icon: '🌴' },
            { label: 'Harvest', value: stats.harvest, icon: '✅' },
            { label: 'Not Ready', value: stats.notHarvest, icon: '⏳' },
            { label: 'Confidence', value: `${stats.avgConfidence}%`, icon: '🎯' },
          ].map((item, i, arr) => (
            <div key={i} style={{
              flex: 1,
              textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
            }}>
              <div style={{ fontSize: '14px', marginBottom: '2px' }}>{item.icon}</div>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1.1 }}>{item.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: '9px', fontWeight: 500, marginTop: '2px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '20px 16px', paddingBottom: '32px' }}>

        {/* Section: Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '18px',
          marginBottom: '14px',
          boxShadow: '0 2px 16px rgba(27, 67, 50, 0.06), 0 1px 4px rgba(27, 67, 50, 0.04)',
          border: '1px solid rgba(27, 67, 50, 0.06)',
        }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              Detection Distribution
            </h3>
            <span style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--primary-muted)',
              background: 'rgba(64, 145, 108, 0.10)',
              padding: '3px 8px', borderRadius: '20px',
            }}>
              {stats.total} total
            </span>
          </div>
          <div className="flex items-center">
            {/* Donut */}
            <div style={{ width: '48%', height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    innerRadius={36}
                    outerRadius={52}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ flex: 1, paddingLeft: '4px' }}>
              <div style={{ marginBottom: '14px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '3px', background: '#2D6A4F', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Harvest Ready</span>
                </div>
                <div style={{ paddingLeft: '18px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#2D6A4F', lineHeight: 1 }}>{stats.harvest}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>{harvestPct}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '3px', background: '#D4A853', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Not Ready</span>
                </div>
                <div style={{ paddingLeft: '18px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#D4A853', lineHeight: 1 }}>{stats.notHarvest}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>{notHarvestPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Trend */}
        {stats.trendData.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '14px',
            boxShadow: '0 2px 16px rgba(27, 67, 50, 0.06), 0 1px 4px rgba(27, 67, 50, 0.04)',
            border: '1px solid rgba(27, 67, 50, 0.06)',
          }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                Detection Trend
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#2D6A4F' }} />
                  <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Harvest</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#D4A853' }} />
                  <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Not Ready</span>
                </div>
              </div>
            </div>
            <div style={{ height: 140, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData} margin={{ top: 5, right: 4, left: -24, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8FA89A', fontSize: 9, fontWeight: 500 }}
                    dy={10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="harvest"
                    name="Harvest"
                    stroke="#2D6A4F"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#2D6A4F', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#2D6A4F', strokeWidth: 2, stroke: 'white' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="notHarvest"
                    name="Not Ready"
                    stroke="#D4A853"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#D4A853', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#D4A853', strokeWidth: 2, stroke: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Section: System + Recent Activity */}
        <div className="grid grid-cols-2 gap-3">

          {/* System Status */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 2px 16px rgba(27, 67, 50, 0.06), 0 1px 4px rgba(27, 67, 50, 0.04)',
            border: '1px solid rgba(27, 67, 50, 0.06)',
          }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.1px' }}>
              System Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: Camera, label: 'Camera', status: 'Online', ok: true },
                { icon: Cpu, label: 'AI Model', status: 'Active', ok: true },
                { icon: Server, label: 'Server', status: 'Online', ok: true },
              ].map(({ icon: Icon, label, status, ok }, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: ok ? '#2D6A4F' : '#C0392B',
                    background: ok ? 'rgba(45, 106, 79, 0.08)' : 'rgba(192, 57, 43, 0.08)',
                    padding: '2px 7px',
                    borderRadius: '20px',
                    letterSpacing: '0.2px',
                  }}>
                    {status}
                  </span>
                </div>
              ))}
              {/* Storage bar */}
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '5px' }}>
                  <div className="flex items-center gap-1.5">
                    <HardDrive size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Storage</span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-primary)' }}>67%</span>
                </div>
                <div style={{
                  height: 4, background: 'rgba(27, 67, 50, 0.08)',
                  borderRadius: '2px', overflow: 'hidden',
                }}>
                  <div style={{
                    width: '67%', height: '100%',
                    background: 'linear-gradient(90deg, #2D6A4F, #40916C)',
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 2px 16px rgba(27, 67, 50, 0.06), 0 1px 4px rgba(27, 67, 50, 0.04)',
            border: '1px solid rgba(27, 67, 50, 0.06)',
          }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.1px' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentActivity.length === 0 ? (
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '12px' }}>
                  No activity yet
                </p>
              ) : (
                stats.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex items-start gap-1.5">
                      {activity.isHarvest ? (
                        <div style={{
                          width: 16, height: 16, borderRadius: '5px',
                          background: 'rgba(45, 106, 79, 0.10)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: 1,
                        }}>
                          <CheckCircle2 size={10} style={{ color: '#2D6A4F' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: 16, height: 16, borderRadius: '5px',
                          background: 'rgba(212, 168, 83, 0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: 1,
                        }}>
                          <XCircle size={10} style={{ color: '#D4A853' }} />
                        </div>
                      )}
                      <span style={{
                        fontSize: '10px', color: 'var(--text-primary)',
                        fontWeight: 600, maxWidth: '60px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={activity.status}>
                        {activity.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {activity.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}