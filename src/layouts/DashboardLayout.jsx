import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { getQuotations, getSalesOrders, getProjects, getServiceReports } from '../mockDb';


const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { label: 'Quotations', path: '/quotations', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ), badge: 2},
  { label: 'Sales Orders', path: '/sales-orders', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  )},
  { label: 'Projects & Tickets', path: '/projects', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  ), badge: 5},
  { label: 'Service Board', path: '/service-board', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { label: 'Service Team', path: '/service-team', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
  )},
  { label: 'Sales Team', path: '/sales-team', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { label: 'Warranty Claims', path: '/claims', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )},
  { label: 'iPad Onsite Form (Test)', path: '/ipad-onsite-test', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
  )},
  { label: 'Staff Portal (Sim)', path: '/staff-portal', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
  )},
];

const settingItems = [
  { label: 'System Config', path: '/system-config', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

/* ──── Status badge helper ──── */
const statusColor = (s) => {
  const map = {
    'Draft': { bg: '#fef3c7', color: '#92400e' },
    'Approved': { bg: '#d1fae5', color: '#065f46' },
    'Delivered': { bg: '#dbeafe', color: '#1e40af' },
    'In Progress': { bg: '#e0e7ff', color: '#3730a3' },
    'Project Open': { bg: '#fce7f3', color: '#9d174d' },
    'Closed': { bg: '#f3f4f6', color: '#374151' },
    'Active': { bg: '#d1fae5', color: '#065f46' },
    'Open': { bg: '#fef3c7', color: '#92400e' },
    'Done': { bg: '#d1fae5', color: '#065f46' },
    'Pending': { bg: '#fee2e2', color: '#991b1b' },
  };
  return map[s] || { bg: '#f3f4f6', color: '#374151' };
};

const StatusBadge = ({ status }) => {
  const c = statusColor(status);
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11,
      fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap',
      fontFamily: 'Prompt, sans-serif',
    }}>{status}</span>
  );
};

/* ──── Format currency ──── */
const fmtMoney = (v) => (v || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 });

/* ──── Type badge ──── */
const typeBadgeColor = (t) => {
  const m = {
    'Implement': { bg: '#ede9fe', color: '#5b21b6' },
    'MA-Fortigate': { bg: '#fce7f3', color: '#9d174d' },
    'MA-Network': { bg: '#ccfbf1', color: '#115e59' },
    'Runrate': { bg: '#dbeafe', color: '#1e40af' },
    'MA': { bg: '#ccfbf1', color: '#115e59' },
    'Install': { bg: '#ede9fe', color: '#5b21b6' },
    'PM': { bg: '#fef3c7', color: '#92400e' },
  };
  return m[t] || { bg: '#f3f4f6', color: '#374151' };
};


/* ══════════════════════════════════════════════════════════════════════
   Customer History Modal (360° View)
   ══════════════════════════════════════════════════════════════════════ */
function CustomerHistoryModal({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  // Gather data
  const quotations = useMemo(() => getQuotations().filter(q => q.customer === customer), [customer]);
  const salesOrders = useMemo(() => getSalesOrders().filter(so => so.customer === customer), [customer]);
  const projects = useMemo(() => getProjects().filter(p => p.customer === customer), [customer]);
  const serviceReports = useMemo(() => getServiceReports().filter(sr => sr.customer === customer), [customer]);

  const allTickets = useMemo(() => projects.flatMap(p => (p.tickets || [])), [projects]);

  // Contact info from first project that has it
  const contactInfo = useMemo(() => {
    for (const p of projects) {
      if (p.contact) return p.contact;
    }
    for (const q of quotations) {
      if (q.contact) return { name: q.contact, phone: q.phone, email: q.email };
    }
    return null;
  }, [projects, quotations]);

  // Timeline: merge all activities
  const timeline = useMemo(() => {
    const items = [];
    quotations.forEach(q => items.push({ date: q.date, type: 'quotation', label: `ใบเสนอราคา ${q.id}`, detail: `${q.type} — ฿${fmtMoney(q.value)}`, status: q.status }));
    salesOrders.forEach(so => items.push({ date: so.date, type: 'salesorder', label: `ใบสั่งขาย ${so.id}`, detail: `อ้างอิง ${so.quoteRef} — ฿${fmtMoney(so.value)}`, status: so.status }));
    projects.forEach(p => items.push({ date: p.startDate, type: 'project', label: `โครงการ ${p.id}`, detail: p.name, status: p.status }));
    serviceReports.forEach(sr => items.push({ date: sr.date, type: 'service', label: `รายงาน ${sr.id}`, detail: sr.summary, status: sr.status }));
    items.sort((a, b) => b.date.localeCompare(a.date));
    return items;
  }, [quotations, salesOrders, projects, serviceReports]);

  const toggleProject = (pid) => {
    setExpandedProjects(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  const tabs = [
    { label: 'ภาพรวม', icon: '📊' },
    { label: 'ใบเสนอราคา', icon: '📄' },
    { label: 'ใบสั่งขาย', icon: '🛒' },
    { label: 'โครงการ & Tickets', icon: '📁' },
    { label: 'รายงานบริการ', icon: '📋' },
  ];

  const timelineTypeColor = { quotation: '#6366f1', salesorder: '#0ea5e9', project: '#8b5cf6', service: '#10b981' };
  const timelineTypeIcon = { quotation: '📄', salesorder: '🛒', project: '📁', service: '📋' };

  return (
    <>
      <style>{`
        @keyframes cshModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cshModalSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cshModalFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes cshModalSlideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(40px) scale(0.97); }
        }
        .csh-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          animation: cshModalFadeIn 0.28s ease-out forwards;
        }
        .csh-overlay.closing {
          animation: cshModalFadeOut 0.25s ease-in forwards;
        }
        .csh-modal {
          width: 94vw; max-width: 1200px; height: 88vh;
          background: #fff; border-radius: 20px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 25px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
          animation: cshModalSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .csh-overlay.closing .csh-modal {
          animation: cshModalSlideDown 0.25s ease-in forwards;
        }
        .csh-header {
          padding: 24px 32px 0 32px; display: flex; align-items: flex-start;
          justify-content: space-between; flex-shrink: 0;
        }
        .csh-header-left h2 {
          font-family: 'Kanit', sans-serif; font-weight: 700; font-size: 24px;
          color: #0f172a; margin: 0 0 2px 0;
        }
        .csh-header-left .csh-contact {
          font-family: 'Prompt', sans-serif; font-size: 13px; color: #64748b;
          display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-top: 4px;
        }
        .csh-close-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: #f1f5f9; cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 20px; color: #64748b; transition: all 0.15s;
          flex-shrink: 0;
        }
        .csh-close-btn:hover { background: #e2e8f0; color: #0f172a; }
        .csh-tabs {
          display: flex; gap: 0; padding: 16px 32px 0 32px; border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0; overflow-x: auto;
        }
        .csh-tab {
          padding: 10px 20px; font-family: 'Kanit', sans-serif; font-size: 14px;
          font-weight: 500; color: #94a3b8; cursor: pointer; border: none; background: none;
          border-bottom: 2.5px solid transparent; transition: all 0.18s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .csh-tab:hover { color: #475569; }
        .csh-tab.active { color: #6366f1; border-bottom-color: #6366f1; }
        .csh-body {
          flex: 1; overflow-y: auto; padding: 24px 32px 32px 32px;
          font-family: 'Prompt', sans-serif;
        }
        .csh-body::-webkit-scrollbar { width: 6px; }
        .csh-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        /* Stats */
        .csh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .csh-stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;
          text-align: center;
        }
        .csh-stat-card .num { font-size: 28px; font-weight: 700; color: #0f172a; font-family: 'Kanit', sans-serif; }
        .csh-stat-card .lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
        /* Timeline */
        .csh-timeline { position: relative; padding-left: 28px; }
        .csh-timeline::before { content: ''; position: absolute; left: 10px; top: 4px; bottom: 4px; width: 2px; background: #e2e8f0; }
        .csh-tl-item { position: relative; margin-bottom: 18px; }
        .csh-tl-dot {
          position: absolute; left: -24px; top: 4px; width: 14px; height: 14px;
          border-radius: 50%; border: 2.5px solid #fff;
        }
        .csh-tl-date { font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
        .csh-tl-label { font-size: 13px; font-weight: 600; color: #0f172a; }
        .csh-tl-detail { font-size: 12px; color: #64748b; }
        /* Table */
        .csh-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .csh-table thead th {
          text-align: left; padding: 10px 12px; font-weight: 600; color: #475569;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px;
          position: sticky; top: 0; z-index: 1;
        }
        .csh-table thead th:first-child { border-radius: 10px 0 0 0; }
        .csh-table thead th:last-child { border-radius: 0 10px 0 0; }
        .csh-table tbody td {
          padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;
        }
        .csh-table tbody tr:hover td { background: #f8fafc; }
        /* Project cards */
        .csh-prj-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          margin-bottom: 14px; overflow: hidden; transition: box-shadow 0.15s;
        }
        .csh-prj-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .csh-prj-header {
          padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; gap: 12px;
        }
        .csh-prj-info { flex: 1; min-width: 0; }
        .csh-prj-name { font-weight: 600; font-size: 14px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .csh-prj-meta { font-size: 12px; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .csh-progress-bar { height: 6px; background: #e2e8f0; border-radius: 3px; width: 120px; overflow: hidden; flex-shrink: 0; }
        .csh-progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        .csh-prj-expand { font-size: 18px; color: #94a3b8; transition: transform 0.2s; user-select: none; }
        .csh-prj-expand.open { transform: rotate(180deg); }
        .csh-prj-tickets { padding: 0 20px 16px 20px; }
        .csh-ticket-row {
          display: flex; align-items: center; gap: 12px; padding: 8px 12px;
          border-radius: 8px; background: #f8fafc; margin-bottom: 6px; font-size: 12px;
        }
        .csh-ticket-id { font-weight: 600; color: #6366f1; min-width: 70px; }
        .csh-ticket-title { flex: 1; color: #334155; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .csh-ticket-assignee { color: #64748b; min-width: 70px; }
        .csh-ticket-due { color: #94a3b8; min-width: 80px; }
        .csh-empty { text-align: center; padding: 48px 20px; color: #94a3b8; font-size: 14px; }
      `}</style>

      <div
        className={`csh-overlay${visible ? '' : ' closing'}`}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="csh-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="csh-header">
            <div className="csh-header-left">
              <h2>🏢 {customer}</h2>
              {contactInfo && (
                <div className="csh-contact">
                  {contactInfo.name && <span>👤 {contactInfo.name}</span>}
                  {contactInfo.phone && <span>📞 {contactInfo.phone}</span>}
                  {contactInfo.email && <span>✉️ {contactInfo.email}</span>}
                </div>
              )}
            </div>
            <button className="csh-close-btn" onClick={handleClose}>✕</button>
          </div>

          {/* Tabs */}
          <div className="csh-tabs">
            {tabs.map((t, i) => (
              <button
                key={i}
                className={`csh-tab${activeTab === i ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="csh-body">
            {/* ── Tab 0: ภาพรวม ── */}
            {activeTab === 0 && (
              <>
                <div className="csh-stats">
                  <div className="csh-stat-card">
                    <div className="num" style={{ color: '#6366f1' }}>{quotations.length}</div>
                    <div className="lbl">ใบเสนอราคา</div>
                  </div>
                  <div className="csh-stat-card">
                    <div className="num" style={{ color: '#0ea5e9' }}>{salesOrders.length}</div>
                    <div className="lbl">ใบสั่งขาย</div>
                  </div>
                  <div className="csh-stat-card">
                    <div className="num" style={{ color: '#8b5cf6' }}>{projects.length}</div>
                    <div className="lbl">โครงการ</div>
                  </div>
                  <div className="csh-stat-card">
                    <div className="num" style={{ color: '#f59e0b' }}>{allTickets.length}</div>
                    <div className="lbl">Tickets</div>
                  </div>
                  <div className="csh-stat-card">
                    <div className="num" style={{ color: '#10b981' }}>{serviceReports.length}</div>
                    <div className="lbl">รายงานบริการ</div>
                  </div>
                </div>

                <h3 style={{ fontFamily: 'Kanit, sans-serif', fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
                  📅 ไทม์ไลน์กิจกรรมล่าสุด
                </h3>
                {timeline.length === 0 ? (
                  <div className="csh-empty">ไม่พบกิจกรรม</div>
                ) : (
                  <div className="csh-timeline">
                    {timeline.map((item, i) => (
                      <div className="csh-tl-item" key={i}>
                        <div className="csh-tl-dot" style={{ background: timelineTypeColor[item.type] || '#94a3b8' }} />
                        <div className="csh-tl-date">{item.date} {timelineTypeIcon[item.type]}</div>
                        <div className="csh-tl-label">{item.label} <StatusBadge status={item.status} /></div>
                        <div className="csh-tl-detail">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Tab 1: ใบเสนอราคา ── */}
            {activeTab === 1 && (
              quotations.length === 0 ? (
                <div className="csh-empty">ไม่พบใบเสนอราคาสำหรับลูกค้านี้</div>
              ) : (
                <table className="csh-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>วันที่</th>
                      <th>ประเภท</th>
                      <th style={{ textAlign: 'right' }}>มูลค่า</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map(q => (
                      <tr key={q.id}>
                        <td style={{ fontWeight: 600, color: '#6366f1' }}>{q.id}</td>
                        <td>{q.date}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11,
                            fontWeight: 600, background: typeBadgeColor(q.type).bg, color: typeBadgeColor(q.type).color,
                          }}>{q.type}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{fmtMoney(q.value)}</td>
                        <td><StatusBadge status={q.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* ── Tab 2: ใบสั่งขาย ── */}
            {activeTab === 2 && (
              salesOrders.length === 0 ? (
                <div className="csh-empty">ไม่พบใบสั่งขายสำหรับลูกค้านี้</div>
              ) : (
                <table className="csh-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>อ้างอิง QT</th>
                      <th>วันที่</th>
                      <th style={{ textAlign: 'right' }}>มูลค่า</th>
                      <th>เลข PO</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesOrders.map(so => (
                      <tr key={so.id}>
                        <td style={{ fontWeight: 600, color: '#0ea5e9' }}>{so.id}</td>
                        <td style={{ color: '#6366f1' }}>{so.quoteRef}</td>
                        <td>{so.date}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{fmtMoney(so.value)}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{so.poNumber || '-'}</td>
                        <td><StatusBadge status={so.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* ── Tab 3: โครงการ & Tickets ── */}
            {activeTab === 3 && (
              projects.length === 0 ? (
                <div className="csh-empty">ไม่พบโครงการสำหรับลูกค้านี้</div>
              ) : (
                projects.map(p => {
                  const isOpen = expandedProjects[p.id];
                  const tc = typeBadgeColor(p.type);
                  const progressColor = p.progress >= 80 ? '#10b981' : p.progress >= 40 ? '#f59e0b' : '#6366f1';
                  return (
                    <div className="csh-prj-card" key={p.id}>
                      <div className="csh-prj-header" onClick={() => toggleProject(p.id)}>
                        <div className="csh-prj-info">
                          <div className="csh-prj-name">{p.name}</div>
                          <div className="csh-prj-meta">
                            <span style={{
                              display: 'inline-block', padding: '1px 8px', borderRadius: 6, fontSize: 11,
                              fontWeight: 600, background: tc.bg, color: tc.color,
                            }}>{p.type}</span>
                            <StatusBadge status={p.status} />
                            <div className="csh-progress-bar">
                              <div className="csh-progress-fill" style={{ width: `${p.progress}%`, background: progressColor }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{p.progress}%</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>| {(p.tickets || []).length} tickets</span>
                          </div>
                        </div>
                        <span className={`csh-prj-expand${isOpen ? ' open' : ''}`}>▼</span>
                      </div>
                      {isOpen && (
                        <div className="csh-prj-tickets">
                          {(p.tickets || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 12px' }}>ไม่มี Ticket</div>
                          ) : (
                            (p.tickets || []).map(tk => (
                              <div className="csh-ticket-row" key={tk.id}>
                                <span className="csh-ticket-id">{tk.id}</span>
                                <span className="csh-ticket-title">{tk.title}</span>
                                <span className="csh-ticket-assignee">{tk.assignee}</span>
                                <StatusBadge status={tk.status} />
                                <span className="csh-ticket-due">{tk.due}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* ── Tab 4: รายงานบริการ ── */}
            {activeTab === 4 && (
              serviceReports.length === 0 ? (
                <div className="csh-empty">ไม่พบรายงานบริการสำหรับลูกค้านี้</div>
              ) : (
                <table className="csh-table">
                  <thead>
                    <tr>
                      <th>เลขที่รายงาน</th>
                      <th>Ticket</th>
                      <th>วันที่</th>
                      <th>ประเภท</th>
                      <th>วิศวกร</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceReports.map(sr => (
                      <tr key={sr.id}>
                        <td style={{ fontWeight: 600, color: '#10b981' }}>{sr.id}</td>
                        <td style={{ color: '#6366f1' }}>{sr.ticketId}</td>
                        <td>{sr.date}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11,
                            fontWeight: 600, background: typeBadgeColor(sr.type).bg, color: typeBadgeColor(sr.type).color,
                          }}>{sr.type}</span>
                        </td>
                        <td>{sr.engineer}</td>
                        <td><StatusBadge status={sr.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}


/* ══════════════════════════════════════════════════════════════════════
   Main Layout
   ══════════════════════════════════════════════════════════════════════ */
export default function DashboardLayout() {
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, title, type = 'success' } = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, title, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build customer list with counts
  const customerResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();

    const quotations = getQuotations();
    const salesOrders = getSalesOrders();
    const projects = getProjects();

    const custMap = {};

    quotations.forEach(qt => {
      const c = qt.customer;
      if (!custMap[c]) custMap[c] = { name: c, quotations: 0, salesOrders: 0, projects: 0, tickets: 0 };
      custMap[c].quotations++;
    });
    salesOrders.forEach(so => {
      const c = so.customer;
      if (!custMap[c]) custMap[c] = { name: c, quotations: 0, salesOrders: 0, projects: 0, tickets: 0 };
      custMap[c].salesOrders++;
    });
    projects.forEach(p => {
      const c = p.customer;
      if (!custMap[c]) custMap[c] = { name: c, quotations: 0, salesOrders: 0, projects: 0, tickets: 0 };
      custMap[c].projects++;
      custMap[c].tickets += (p.tickets || []).length;
    });

    return Object.values(custMap).filter(c => c.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSelectCustomer = (name) => {
    setSelectedCustomer(name);
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <div className="app-layout">

      {/* ── Search Dropdown Styles ── */}
      <style>{`
        @keyframes cshDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .csh-search-wrap { position: relative; }
        .csh-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          min-width: 360px;
          background: #fff; border-radius: 14px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04);
          z-index: 100; overflow: hidden;
          animation: cshDropIn 0.18s ease-out;
        }
        .csh-dropdown-header {
          padding: 10px 16px; font-family: 'Kanit', sans-serif; font-size: 11px;
          font-weight: 600; color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9;
        }
        .csh-dropdown-item {
          padding: 12px 16px; cursor: pointer; display: flex;
          align-items: center; gap: 12px; transition: background 0.12s;
          border-bottom: 1px solid #f8fafc;
        }
        .csh-dropdown-item:last-child { border-bottom: none; }
        .csh-dropdown-item:hover { background: #f8fafc; }
        .csh-dropdown-item .csh-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #fff; font-weight: 700; flex-shrink: 0;
          font-family: 'Kanit', sans-serif;
        }
        .csh-dropdown-item .csh-cust-name {
          font-size: 13px; font-weight: 600; color: #0f172a;
          font-family: 'Prompt', sans-serif;
        }
        .csh-dropdown-item .csh-cust-stats {
          font-size: 11px; color: #94a3b8; margin-top: 1px;
          font-family: 'Prompt', sans-serif;
        }
        .csh-dropdown-empty {
          padding: 20px 16px; text-align: center; color: #94a3b8; font-size: 13px;
          font-family: 'Prompt', sans-serif;
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">NIS</div>
          <div>
            <div className="logo-text">NIS Platform</div>
            <div className="logo-sub">Service Management</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {menuItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
          <div className="nav-section-label" style={{marginTop:8}}>Administration</div>
          {settingItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">SM</div>
            <div>
              <div className="user-name">Somchai M.</div>
              <div className="user-role">Service Manager</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="search-box csh-search-wrap" ref={searchRef}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="ค้นหา ลูกค้า, เลขที่เอกสาร, Ticket..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowDropdown(true);
              }}
            />
            {showDropdown && (
              <div className="csh-dropdown">
                <div className="csh-dropdown-header">ผลการค้นหาลูกค้า</div>
                {customerResults.length === 0 ? (
                  <div className="csh-dropdown-empty">ไม่พบลูกค้าที่ตรงกับ "{searchQuery}"</div>
                ) : (
                  customerResults.map(c => (
                    <div
                      className="csh-dropdown-item"
                      key={c.name}
                      onClick={() => handleSelectCustomer(c.name)}
                    >
                      <div className="csh-avatar">{c.name.charAt(0)}</div>
                      <div>
                        <div className="csh-cust-name">{c.name}</div>
                        <div className="csh-cust-stats">
                          {c.projects} โครงการ · {c.tickets} Tickets · {c.quotations} ใบเสนอราคา
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="topbar-right">
            <button className="icon-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="notif-dot"></span>
            </button>
            <div className="topbar-user">
              <div className="avatar" style={{width:28,height:28,fontSize:10}}>SM</div>
              <span style={{fontSize:13,fontWeight:600}}>Somchai M.</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-desc">{t.message}</div>
            </div>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Customer History Modal */}
      {selectedCustomer && (
        <CustomerHistoryModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
