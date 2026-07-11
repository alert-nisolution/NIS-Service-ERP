import { useState, useMemo, useEffect } from 'react';
import {
  getProjects,
  getDynamicStaff,
  getSalesTeam,
  getPendingTickets,
  getServiceReports,
  getNisStock,
} from '../mockDb';

/* ─────────────────────────────────────────────
   Color & Design Tokens (DesignIPAD.md spec)
───────────────────────────────────────────── */
const C = {
  primary:   '#4F46E5', // Modern Indigo
  primarySoft:'#EEF2FF',
  success:   '#22C55E',
  successSoft:'#DCFCE7',
  warning:   '#F59E0B',
  warningSoft:'#FEF3C7',
  danger:    '#EF4444',
  dangerSoft: '#FEE2E2',
  purple:    '#8B5CF6',
  purpleSoft: '#EDE9FE',
  bg:        '#F1F5F9',
  surface:   '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  textSub:   '#64748B',
  textLight: '#94A3B8',
};

/* ─── Inline iPad Frame ─── */
const iPadFrame = {
  width: '1180px',
  minHeight: '820px',
  background: C.bg,
  borderRadius: '24px',
  boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 14px #1e293b, 0 0 0 16px #334155',
  overflow: 'hidden',
  position: 'relative',
  fontFamily: "'Inter', 'Prompt', sans-serif",
  display: 'flex',
  flexDirection: 'column',
};

/* ─── Utility: initials from name ─── */
const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

/* ─── Utility: today date string ─── */
const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─────────────────────────────────────────────
   SUB-COMPONENT: DonutChart (SVG Inline)
───────────────────────────────────────────── */
function DonutChart({ segments, size = 160, stroke = 28 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENT: MiniBarChart
───────────────────────────────────────────── */
function MiniBarChart({ data, color = C.primary }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 50 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%',
            height: `${(d.value / max) * 42}px`,
            background: color,
            borderRadius: '4px 4px 0 0',
            opacity: i === data.length - 1 ? 1 : 0.4,
            minHeight: 4,
          }} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENT: StatusBadge
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    'Open':                { bg: C.primarySoft,  color: C.primary,  label: 'เปิด' },
    'In Progress':         { bg: C.warningSoft,  color: '#D97706',  label: 'กำลังทำ' },
    'Working':             { bg: C.warningSoft,  color: '#D97706',  label: 'กำลังทำ' },
    'Confirmed':           { bg: C.warningSoft,  color: '#D97706',  label: 'รับงาน' },
    'Checkin':             { bg: C.warningSoft,  color: '#D97706',  label: 'Check-in' },
    'Completed':           { bg: C.successSoft,  color: '#16A34A',  label: 'เสร็จ' },
    'Done':                { bg: C.successSoft,  color: '#16A34A',  label: 'Done' },
    'Closed':              { bg: '#F8FAFC',      color: C.textSub,  label: 'ปิดแล้ว' },
    'Pending':             { bg: '#FEF3C7',      color: '#92400E',  label: 'รอ' },
    'Waiting Close Approval': { bg: C.purpleSoft, color: C.purple, label: 'รออนุมัติ' },
    'Pending Approval':    { bg: C.purpleSoft,   color: C.purple,  label: 'รออนุมัติ' },
    'Assigned':            { bg: C.primarySoft,  color: C.primary,  label: 'Assigned' },
  };
  const s = map[status] || { bg: '#F1F5F9', color: C.textSub, label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 600, padding: '2px 8px',
      borderRadius: 20, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

/* ─────────────────────────────────────────────
   LOGIN SCREEN
───────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const [role, setRole]     = useState(null); // 'manager' | 'staff'
  const [selected, setSelected] = useState('');

  const staffList    = getDynamicStaff();
  const managerList  = ['Service Manager', 'Atichat T.', 'Admin NIS'];

  const handleLogin = () => {
    if (!role || !selected) return;
    onLogin({ role, name: selected });
  };

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, #EEF2FF 0%, #F1F5F9 60%, #E0E7FF 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(79,70,229,0.07)' }} />
      <div style={{ position:'absolute', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'rgba(139,92,246,0.07)' }} />

      <div style={{
        background: C.surface, borderRadius: 28, padding: '48px 52px',
        boxShadow: '0 20px 60px rgba(79,70,229,0.12)',
        width: 460, position: 'relative', zIndex: 2,
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg, ${C.primary}, #7C3AED)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
          }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="14" rx="3" stroke="white" strokeWidth="2"/>
              <path d="M8 21h8M12 17v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>NIS Service ERP</div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>iPad Dashboard — เลือก Role เพื่อเข้าสู่ระบบ</div>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>บทบาท (Role)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { key: 'manager', label: '🧑‍💼 Service Manager', desc: 'ดู Dashboard ทั้งระบบ' },
              { key: 'staff',   label: '🔧 ช่างเทคนิค (Staff)', desc: 'ดูงานที่ได้รับมอบหมาย' },
            ].map(r => (
              <div key={r.key} onClick={() => { setRole(r.key); setSelected(''); }}
                style={{
                  border: `2px solid ${role === r.key ? C.primary : C.border}`,
                  borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                  background: role === r.key ? C.primarySoft : C.surface,
                  transition: 'all .2s',
                }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: role === r.key ? C.primary : C.text }}>{r.label}</div>
                <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Name Selector */}
        {role && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {role === 'manager' ? 'เลือกผู้จัดการ' : 'เลือกช่าง'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
              {(role === 'manager' ? managerList : staffList).map(name => (
                <div key={name} onClick={() => setSelected(name)}
                  style={{
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${selected === name ? C.primary : C.border}`,
                    background: selected === name ? C.primarySoft : '#FAFAFA',
                    color: selected === name ? C.primary : C.text,
                    fontWeight: selected === name ? 600 : 400, fontSize: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all .15s',
                  }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: selected === name ? C.primary : '#E2E8F0',
                    color: selected === name ? '#fff' : C.textSub,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{initials(name)}</div>
                  {name}
                  {selected === name && (
                    <span style={{ marginLeft: 'auto' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill={C.primary}/>
                        <path d="M7 12l4 4 6-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Login Button */}
        <button onClick={handleLogin}
          disabled={!role || !selected}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: (!role || !selected) ? '#CBD5E1' : `linear-gradient(135deg, ${C.primary}, #7C3AED)`,
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: (!role || !selected) ? 'not-allowed' : 'pointer',
            boxShadow: (!role || !selected) ? 'none' : '0 8px 20px rgba(79,70,229,0.35)',
            transition: 'all .2s',
          }}>
          เข้าสู่ระบบ →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOP HEADER
───────────────────────────────────────────── */
function Header({ user, onLogout, notifCount }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 28px', background: C.surface,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{greet}, {user.name.split(' ')[0]} 👋</div>
        <div style={{ fontSize: 12, color: C.textSub, marginTop: 1 }}>
          {user.role === 'manager' ? '🧑‍💼 Service Manager Dashboard' : '🔧 Staff Dashboard'} · {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.bg, borderRadius: 12, padding: '8px 14px',
          border: `1px solid ${C.border}`,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.textSub} strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ fontSize: 13, color: C.textSub }}>ค้นหา...</span>
        </div>
        {/* Notification */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: C.bg, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={C.textSub} strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: C.danger, color: '#fff', borderRadius: '50%',
              width: 18, height: 18, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{notifCount}</span>
          )}
        </div>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={onLogout} title="ออกจากระบบ">
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.primary}, #7C3AED)`,
            color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{initials(user.name)}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({ icon, label, value, trend, trendPct, bg, color, onClick }) {
  const up = trend === 'up';
  return (
    <div 
      onClick={onClick}
      style={{
        background: C.surface, borderRadius: 20, padding: '20px 22px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background: bg, opacity:0.4 }} />
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: C.textSub, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
        <span style={{ color: up ? C.success : C.danger, fontWeight:700 }}>
          {up ? '↑' : '↓'} {trendPct}
        </span>
        <span style={{ color: C.textSub }}>จากเดือนที่แล้ว</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ACTIVITY FEED ITEM
───────────────────────────────────────────── */
function ActivityItem({ avatar, name, title, desc, status, time }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 0',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg, ${C.primary}, #7C3AED)`,
        color: '#fff', fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{avatar}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <StatusBadge status={status} />
        </div>
        <div style={{ fontSize: 11, color: C.textSub, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
        <div style={{ fontSize: 10, color: C.textLight, marginTop: 3 }}>{name} · {time}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BOTTOM NAV (Floating Pill)
───────────────────────────────────────────── */
function BottomNav({ active, onChange }) {
  const tabs = [
    { key:'home',      label:'หน้าหลัก',  icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key:'analytics', label:'วิเคราะห์',  icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { key:'tasks',     label:'ตั๋วงาน',    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { key:'reports',   label:'รายงาน',   icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
    { key:'settings',  label:'ตั้งค่า',   icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: C.text, borderRadius: 50, padding: '10px 24px',
      display: 'flex', gap: 4,
      boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
      zIndex: 100,
    }}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 16px', borderRadius: 40, border: 'none', cursor: 'pointer',
              background: isActive ? C.primary : 'transparent',
              color: isActive ? '#fff' : '#94A3B8',
              transition: 'all .2s', minWidth: 60,
            }}>
            {t.icon}
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD VIEW
───────────────────────────────────────────── */
function DashboardView({ user, filter, setFilter }) {
  const [selectedStatKey, setSelectedStatKey] = useState(null);
  
  // ── Load data ──
  const projects      = getProjects();
  const pendingReqs   = getPendingTickets();
  const serviceReports= getServiceReports();
  const nisStock      = getNisStock();
  const staffList     = getDynamicStaff();

  // ── Flatten all tickets ──
  const allTickets = useMemo(() => {
    return projects.flatMap(p =>
      (p.tickets || []).map(t => ({ ...t, projectName: p.name, customer: p.customer, projectId: p.id }))
    );
  }, [projects]);

  // ── Filter tickets by role ──
  const myTickets = useMemo(() => {
    if (user.role === 'manager') return allTickets;
    return allTickets.filter(t => t.assignee === user.name);
  }, [allTickets, user]);

  // ── KPI counts ──
  const kpiData = useMemo(() => {
    const today = todayStr();
    const open      = myTickets.filter(t => ['Open','Assigned'].includes(t.status)).length;
    const inProg    = myTickets.filter(t => ['In Progress','Working','Confirmed','Checkin'].includes(t.status)).length;
    const done      = myTickets.filter(t => ['Completed','Done','Closed'].includes(t.status)).length;
    const overdue   = myTickets.filter(t => t.due && t.due < today && !['Completed','Done','Closed'].includes(t.status)).length;
    const pending   = user.role === 'manager' ? pendingReqs.length : myTickets.filter(t => t.status === 'Pending').length;
    const lowStock  = nisStock.filter(s => s.status === 'Low Stock' || s.qty === 0).length;
    return { open, inProg, done, overdue, pending, lowStock, total: myTickets.length };
  }, [myTickets, pendingReqs, nisStock, user.role]);

  // ── Donut segments ──
  const donutSegments = useMemo(() => [
    { label: 'กำลังทำ', value: kpiData.inProg, color: C.warning },
    { label: 'เปิด',    value: kpiData.open,   color: C.primary },
    { label: 'เสร็จ',   value: kpiData.done,   color: C.success },
    { label: 'เกินกำหนด', value: kpiData.overdue, color: C.danger },
    { label: 'รอ',      value: kpiData.pending, color: C.purple },
  ].filter(s => s.value > 0), [kpiData]);

  // ── Recent activities (latest 8 tickets) ──
  const recentActivities = useMemo(() => {
    return [...myTickets]
      .sort((a, b) => (b.checkinTime || b.due || '').localeCompare(a.checkinTime || a.due || ''))
      .slice(0, 8);
  }, [myTickets]);

  // ── Upcoming Onsite (next 7 days) ──
  const today7 = addDays(todayStr(), 7);
  const upcomingOnsite = useMemo(() =>
    myTickets
      .filter(t => {
        const d = t.onsiteDate || t.due;
        return d && d >= todayStr() && d <= today7 && !['Completed','Done','Closed'].includes(t.status);
      })
      .sort((a, b) => (a.onsiteDate || a.due || '').localeCompare(b.onsiteDate || b.due || ''))
      .slice(0, 5),
  [myTickets]);

  // ── Team Performance (manager only) ──
  const teamPerf = useMemo(() => {
    return staffList.map(name => {
      const tks = allTickets.filter(t => t.assignee === name);
      const done = tks.filter(t => ['Completed','Done','Closed'].includes(t.status)).length;
      return { name, total: tks.length, done, pct: tks.length ? Math.round((done / tks.length) * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct);
  }, [allTickets, staffList]);

  // ── Mini bar chart data (last 7 days activity) ──
  const barData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(todayStr(), i - 6);
      return { day: d.slice(5), value: allTickets.filter(t => t.due === d).length };
    });
    return days;
  }, [allTickets]);

  const getStatModalData = () => {
    switch (selectedStatKey) {
      case 'all':
        return {
          title: 'ตั๋วงานทั้งหมด',
          icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
          color: C.primary,
          items: myTickets
        };
      case 'inprogress':
        return {
          title: 'กำลังดำเนินการ',
          icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
          color: C.warning,
          items: myTickets.filter(t => ['In Progress','Working','Confirmed','Checkin'].includes(t.status))
        };
      case 'done':
        return {
          title: 'เสร็จแล้ว',
          icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          color: C.success,
          items: myTickets.filter(t => ['Completed','Done','Closed'].includes(t.status))
        };
      case 'overdue':
        return {
          title: 'เกินกำหนด',
          icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          color: C.danger,
          items: myTickets.filter(t => t.due && t.due < todayStr() && !['Completed','Done','Closed'].includes(t.status))
        };
      default:
        return null;
    }
  };
  const statModalData = getStatModalData();

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 100px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Filter Segment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: C.textSub, fontWeight: 500 }}>แสดงข้อมูล:</span>
        {['Today','Week','Month','Year'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filter === f ? C.primary : C.surface,
              color: filter === f ? '#fff' : C.textSub,
              boxShadow: filter === f ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
              border: filter === f ? 'none' : `1px solid ${C.border}`,
              transition: 'all .15s',
            }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: C.textSub }}>
          รวม {kpiData.total} ตั๋ว · {projects.length} โปรเจกต์
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KpiCard 
          icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} 
          label="ตั๋วทั้งหมด" value={kpiData.total} trend="up" trendPct="+12%" bg={C.primarySoft} color={C.primary} 
          onClick={() => setSelectedStatKey('all')}
        />
        <KpiCard 
          icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
          label="กำลังดำเนินการ" value={kpiData.inProg} trend="up" trendPct="+5%" bg={C.warningSoft} color={C.warning} 
          onClick={() => setSelectedStatKey('inprogress')}
        />
        <KpiCard 
          icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          label="เสร็จแล้ว" value={kpiData.done} trend="up" trendPct="+18%" bg={C.successSoft} color={C.success} 
          onClick={() => setSelectedStatKey('done')}
        />
        <KpiCard 
          icon={<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          label="เกินกำหนด" value={kpiData.overdue} trend="down" trendPct="-3%" bg={C.dangerSoft} color={C.danger} 
          onClick={() => setSelectedStatKey('overdue')}
        />
      </div>

      {/* Main Two-Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Left: Recent Activities */}
        <div style={{
          background: C.surface, borderRadius: 20, padding: '18px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>⚡ กิจกรรมล่าสุด</div>
            <span style={{ fontSize: 11, color: C.primary, fontWeight: 600, cursor: 'pointer' }}>ดูทั้งหมด →</span>
          </div>
          {recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.textSub, padding: '24px 0', fontSize: 13 }}>ยังไม่มีตั๋วงาน</div>
          ) : recentActivities.map(t => (
            <ActivityItem key={t.id}
              avatar={initials(t.assignee || 'NA')}
              name={t.assignee || '-'}
              title={`${t.id} · ${t.title}`}
              desc={t.projectName || ''}
              status={t.status}
              time={t.onsiteDate ? `Onsite: ${t.onsiteDate}` : (t.due ? `Due: ${t.due}` : '-')}
            />
          ))}
        </div>

        {/* Right: Analytics */}
        <div style={{
          background: C.surface, borderRadius: 20, padding: '18px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>📊 สถานะภาพรวม</div>
          {/* Donut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <DonutChart segments={donutSegments.length > 0 ? donutSegments : [{ value: 1, color: C.border }]} size={130} stroke={22} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{kpiData.total}</div>
                <div style={{ fontSize: 9, color: C.textSub }}>ตั๋วรวม</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donutSegments.map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:s.color, flexShrink:0 }} />
                    <span style={{ color: C.textSub }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight:700, color:C.text }}>{s.value}</span>
                </div>
              ))}
              {donutSegments.length === 0 && <span style={{ color: C.textSub, fontSize: 12 }}>ไม่มีข้อมูล</span>}
            </div>
          </div>
          {/* Mini bar trend */}
          <div>
            <div style={{ fontSize: 12, color: C.textSub, fontWeight: 600, marginBottom: 6 }}>Due 7 วันล่าสุด</div>
            <MiniBarChart data={barData} color={C.primary} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 9, color: C.textLight, marginTop: 2 }}>
              {barData.map(d => <span key={d.day}>{d.day}</span>)}
            </div>
          </div>
          {/* Pending requests (manager only) */}
          {user.role === 'manager' && (
            <div style={{ background: kpiData.pending > 0 ? C.warningSoft : C.bg, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: kpiData.pending > 0 ? '#92400E' : C.textSub }}>
                📥 คำขอเปิดตั๋วจาก Staff: <strong>{kpiData.pending}</strong> รายการ
              </div>
              {kpiData.pending > 0 && <div style={{ fontSize: 10, color: '#92400E', marginTop: 2 }}>รอการอนุมัติใน Service Board</div>}
            </div>
          )}
          {/* Low stock warning */}
          {kpiData.lowStock > 0 && (
            <div style={{ background: C.dangerSoft, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>
                📦 คลังสินค้าใกล้หมด: {kpiData.lowStock} รายการ
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {/* Upcoming Onsite */}
        <div style={{ background: C.surface, borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>📅 Onsite ใน 7 วันข้างหน้า</div>
          {upcomingOnsite.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textSub, textAlign: 'center', padding: '12px 0' }}>ไม่มีงาน Onsite</div>
          ) : upcomingOnsite.map(t => (
            <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.id}</div>
                <div style={{ fontSize: 10, color: C.textSub, maxWidth: 140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>{t.onsiteDate || t.due}</div>
                <div style={{ fontSize: 9, color: C.textSub }}>{t.assignee}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Team Performance (Manager) / My Tickets Summary (Staff) */}
        <div style={{ background: C.surface, borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
            {user.role === 'manager' ? '👥 ประสิทธิภาพทีม' : '📋 สรุปงานของฉัน'}
          </div>
          {user.role === 'manager' ? (
            teamPerf.slice(0, 5).map(s => (
              <div key={s.name} style={{ marginBottom: 8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{s.name}</span>
                  <span style={{ color: C.textSub }}>{s.done}/{s.total} งาน</span>
                </div>
                <div style={{ height: 6, background: C.bg, borderRadius: 4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${s.pct}%`, background: s.pct >= 80 ? C.success : s.pct >= 50 ? C.warning : C.danger, borderRadius: 4, transition:'width .4s' }} />
                </div>
              </div>
            ))
          ) : (
            <>
              {[
                { label:'รอตอบรับ', value: myTickets.filter(t=>t.status==='Open').length, color: C.primary },
                { label:'กำลังทำ',  value: kpiData.inProg,  color: C.warning },
                { label:'เสร็จแล้ว', value: kpiData.done,   color: C.success },
                { label:'เกินกำหนด', value: kpiData.overdue, color: C.danger },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color: C.textSub }}>{item.label}</span>
                  <span style={{ fontSize:16, fontWeight:800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: C.surface, borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>⚡ Quick Actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'📱 iPad Onsite Form', href:'/ipad-onsite-test', color: C.primary },
              { label:'📋 Service Board',    href:'/service-board',     color: C.purple },
              { label:'📦 NIS Warehouse',    href:'/ipad-onsite-test',  color: C.warning },
              { label:'📊 Dashboard',        href:'/dashboard',         color: C.success },
            ].map(a => (
              <a key={a.label} href={a.href}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 12px', borderRadius:10, textDecoration:'none',
                  background: C.bg, border:`1px solid ${C.border}`,
                  fontSize:12, fontWeight:600, color: a.color,
                  transition:'all .15s',
                }}>
                {a.label}
                <span style={{ marginLeft:'auto', color: C.textLight }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Stats Detail Modal ═══ */}
      {statModalData && (
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            zIndex: 999999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSelectedStatKey(null)}
        >
          <div 
            style={{ 
              width: 620, 
              maxWidth: '94%',
              background: C.surface, 
              borderRadius: 20, 
              padding: 24, 
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: statModalData.color + '20', color: statModalData.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {statModalData.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{statModalData.title}</h3>
                  <div style={{ fontSize: 13, color: C.textSub }}>ทั้งหมด {statModalData.items.length} รายการ</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStatKey(null)}
                style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: C.bg, color: C.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {statModalData.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.textSub, fontSize: 14 }}>ไม่พบข้อมูล</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {statModalData.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: `1px solid ${C.border}`, borderRadius: 14, background: '#FAFAFA' }}>
                      <div style={{ minWidth: 0, paddingRight: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: C.primary, fontSize: 14 }}>{item.id}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <div style={{ fontSize: 14, color: C.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: C.textSub, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.customer || item.projectName} · Onsite: <span style={{ color: (item.onsiteDate || item.due) < todayStr() && !['Completed','Done','Closed'].includes(item.status) ? C.danger : C.textSub, fontWeight: 600 }}>{item.onsiteDate || item.due || '-'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>ผู้รับผิดชอบ</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, #7C3AED)`, color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {initials(item.assignee || 'NA')}
                          </div>
                          {item.assignee || '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANALYTICS TAB
───────────────────────────────────────────── */
function AnalyticsView({ user }) {
  const projects   = getProjects();
  const allTickets = projects.flatMap(p => (p.tickets || []).map(t => ({ ...t, projectName: p.name })));
  const myTickets  = user.role === 'manager' ? allTickets : allTickets.filter(t => t.assignee === user.name);

  const byType = useMemo(() => {
    const map = {};
    myTickets.forEach(t => { map[t.ticketType || 'Other'] = (map[t.ticketType || 'Other'] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [myTickets]);

  const typeColors = ['#4F46E5','#22C55E','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316'];
  const total = byType.reduce((s, [,v]) => s + v, 0) || 1;

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 100px', display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text }}>📊 Analytics — สถิติตั๋วงาน</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Ticket by type */}
        <div style={{ background:C.surface, borderRadius:20, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>ประเภทตั๋วงาน</div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ position:'relative' }}>
              <DonutChart segments={byType.map(([k,v],i)=>({ label:k, value:v, color:typeColors[i % typeColors.length] }))} size={140} stroke={24} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:C.text }}>{total}</div>
                <div style={{ fontSize:9, color:C.textSub }}>รวม</div>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              {byType.map(([type, count], i) => (
                <div key={type}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:typeColors[i%typeColors.length] }} />
                      <span style={{ color:C.textSub }}>{type}</span>
                    </div>
                    <span style={{ fontWeight:700, color:C.text }}>{count} ({Math.round(count/total*100)}%)</span>
                  </div>
                  <div style={{ height:4, background:C.bg, borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${count/total*100}%`, background:typeColors[i%typeColors.length], borderRadius:4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Project summary */}
        <div style={{ background:C.surface, borderRadius:20, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14 }}>โปรเจกต์ทั้งหมด ({projects.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:260, overflowY:'auto' }}>
            {projects.map(p => {
              const tks = p.tickets || [];
              const done = tks.filter(t => ['Completed','Done','Closed'].includes(t.status)).length;
              const pct = tks.length ? Math.round(done/tks.length*100) : 0;
              return (
                <div key={p.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                    <span style={{ fontWeight:600, color:C.text, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                    <span style={{ color:C.textSub }}>{done}/{tks.length} · {pct}%</span>
                  </div>
                  <div style={{ height:6, background:C.bg, borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: pct>=80?C.success:pct>=50?C.warning:C.primary, borderRadius:4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASKS TAB
───────────────────────────────────────────── */
function TasksView({ user }) {
  const projects   = getProjects();
  const allTickets = projects.flatMap(p => (p.tickets || []).map(t => ({ ...t, projectName: p.name, customer: p.customer })));
  const myTickets  = user.role === 'manager' ? allTickets : allTickets.filter(t => t.assignee === user.name);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all' ? myTickets : myTickets.filter(t => {
    if (statusFilter === 'open')    return ['Open','Assigned'].includes(t.status);
    if (statusFilter === 'inprog')  return ['In Progress','Working','Confirmed','Checkin'].includes(t.status);
    if (statusFilter === 'done')    return ['Completed','Done','Closed'].includes(t.status);
    if (statusFilter === 'overdue') return t.due && t.due < todayStr() && !['Completed','Done','Closed'].includes(t.status);
    return true;
  });

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 100px', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>✅ รายการตั๋วงาน</div>
        <div style={{ display:'flex', gap:6 }}>
          {[['all','ทั้งหมด'],['open','เปิด'],['inprog','กำลังทำ'],['done','เสร็จ'],['overdue','เกินกำหนด']].map(([k,l])=>(
            <button key={k} onClick={()=>setStatusFilter(k)}
              style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                background:statusFilter===k?C.primary:C.surface, color:statusFilter===k?'#fff':C.textSub,
                border:`1px solid ${statusFilter===k?'transparent':C.border}` }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background:C.surface, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:`1px solid ${C.border}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:C.bg }}>
              {['Ticket ID','หัวข้อ','โปรเจกต์/ลูกค้า','ผู้รับผิดชอบ','Onsite Date','สถานะ'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.textSub, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'24px', textAlign:'center', color:C.textSub }}>ไม่มีตั๋วงาน</td></tr>
            ) : filtered.map((t,i) => (
              <tr key={t.id} style={{ borderTop:`1px solid ${C.border}`, background: i%2===0?C.surface:'#FAFBFC' }}>
                <td style={{ padding:'10px 14px', fontWeight:700, color:C.primary }}>{t.id}</td>
                <td style={{ padding:'10px 14px', color:C.text, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</td>
                <td style={{ padding:'10px 14px', color:C.textSub, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.customer || t.projectName}</td>
                <td style={{ padding:'10px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${C.primary},#7C3AED)`, color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {initials(t.assignee||'NA')}
                    </div>
                    <span style={{ color:C.text }}>{t.assignee||'-'}</span>
                  </div>
                </td>
                <td style={{ padding:'10px 14px', color: (t.onsiteDate||t.due)<todayStr()&&!['Completed','Done','Closed'].includes(t.status)?C.danger:C.text, fontWeight:600 }}>
                  {t.onsiteDate || t.due || '-'}
                </td>
                <td style={{ padding:'10px 14px' }}><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPORTS TAB
───────────────────────────────────────────── */
function ReportsView() {
  const reports = getServiceReports();
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 100px', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text }}>📄 Service Reports ({reports.length})</div>
      <div style={{ background:C.surface, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:`1px solid ${C.border}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:C.bg }}>
              {['SR No.','Ticket','ลูกค้า','ช่าง','วันที่','ประเภท','สถานะ'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:C.textSub }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'24px', textAlign:'center', color:C.textSub }}>ยังไม่มี Service Report</td></tr>
            ) : reports.map((r,i) => (
              <tr key={r.id} style={{ borderTop:`1px solid ${C.border}`, background:i%2===0?C.surface:'#FAFBFC' }}>
                <td style={{ padding:'10px 14px', fontWeight:700, color:C.primary }}>{r.id}</td>
                <td style={{ padding:'10px 14px', color:C.text }}>{r.ticketId}</td>
                <td style={{ padding:'10px 14px', color:C.textSub }}>{r.customer}</td>
                <td style={{ padding:'10px 14px', color:C.text }}>{r.engineer}</td>
                <td style={{ padding:'10px 14px', color:C.textSub }}>{r.date}</td>
                <td style={{ padding:'10px 14px', color:C.text }}>{r.type}</td>
                <td style={{ padding:'10px 14px' }}><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SETTINGS TAB
───────────────────────────────────────────── */
function SettingsView({ user, onLogout }) {
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 100px', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text }}>⚙️ ตั้งค่า</div>
      <div style={{ background:C.surface, borderRadius:20, padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:`1px solid ${C.border}`, maxWidth:480 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ width:60, height:60, borderRadius:18, background:`linear-gradient(135deg,${C.primary},#7C3AED)`, color:'#fff', fontSize:20, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {initials(user.name)}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{user.name}</div>
            <div style={{ fontSize:12, color:C.textSub }}>{user.role === 'manager' ? '🧑‍💼 Service Manager' : '🔧 ช่างเทคนิค'}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'🏢 บริษัท', value:'NIS Solution Co., Ltd.' },
            { label:'📱 ระบบ', value:'NIS Service ERP — iPad New Design' },
            { label:'🗄️ ข้อมูล', value:'LocalStorage (mockDb.js)' },
            { label:'🎨 Design', value:'DesignIPAD.md Spec v1.0' },
          ].map(item=>(
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:13, color:C.textSub }}>{item.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onLogout}
          style={{ marginTop:20, width:'100%', padding:'12px', borderRadius:12, border:'none', cursor:'pointer',
            background:C.dangerSoft, color:C.danger, fontSize:14, fontWeight:700 }}>
          🚪 ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function IpadNew() {
  const [user,   setUser]   = useState(null);  // { role, name }
  const [navTab, setNavTab] = useState('home');
  const [filter, setFilter] = useState('Week');

  const pendingReqs = getPendingTickets();
  const notifCount  = user?.role === 'manager' ? pendingReqs.length : 0;

  const handleLogin  = (u) => { setUser(u); setNavTab('home'); };
  const handleLogout = ()  => { setUser(null); setNavTab('home'); };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#CBD5E1', padding:'20px' }}>
      <div style={iPadFrame}>
        {!user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <>
            <Header user={user} onLogout={handleLogout} notifCount={notifCount} />
            {navTab === 'home'      && <DashboardView  user={user} filter={filter} setFilter={setFilter} />}
            {navTab === 'analytics' && <AnalyticsView  user={user} />}
            {navTab === 'tasks'     && <TasksView      user={user} />}
            {navTab === 'reports'   && <ReportsView />}
            {navTab === 'settings'  && <SettingsView   user={user} onLogout={handleLogout} />}
            <BottomNav active={navTab} onChange={setNavTab} />
          </>
        )}
      </div>
    </div>
  );
}
