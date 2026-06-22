import { useState } from 'react';
import { getSalesTeam, getQuotations, getProjects } from '../mockDb';

const avatarColors = {
  'WS': '#6366f1',
  'SC': '#10b981',
  'MD': '#f59e0b',
  'TR': '#8b5cf6'
};

export default function SalesTeam() {
  const [salesList] = useState(() => getSalesTeam());
  const quotations = getQuotations();
  const projects = getProjects();

  // Helper: Count active quotations for a salesperson
  const getActiveQuotesCount = (name) => {
    return quotations.filter(q => q.contact?.includes(name) || q.status === 'Draft' || q.status === 'Approved').length; 
  };

  // Helper: Count active projects for a salesperson
  const getActiveProjectsCount = (name) => {
    return projects.filter(p => p.salesPM?.name === name && p.status !== 'Closed').length;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sales Team Matrix — โครงสร้างทีมฝ่ายขาย</div>
          <div className="page-subtitle">รายชื่อเจ้าหน้าที่ฝ่ายขาย ผู้ประสานงานโครงการ และรายงานเป้ายอดขายในNIS</div>
        </div>
      </div>

      {/* Organization Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Left: Sales Hierarchy Chart */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: 'var(--text)' }}>ผังสายงานทีมฝ่ายขาย NIS (Sales & Account Management Hierarchy)</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative' }}>
            {/* Sales Manager Node */}
            {salesList.slice(0, 1).map(s => (
              <div key={s.id} style={{
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                borderRadius: 12,
                padding: '14px 24px',
                textAlign: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-md)',
                width: 260,
                zIndex: 2
              }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8, letterSpacing: 0.5, marginBottom: 3 }}>Sales Department Lead</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{s.name} ({s.nickname})</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{s.role}</div>
                <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 6 }}>
                  📞 {s.phone}
                </div>
              </div>
            ))}

            {/* Vertical Line */}
            <div style={{
              width: 2,
              height: 24,
              background: 'var(--border)',
              zIndex: 1
            }}></div>

            {/* Subordinates bridge */}
            <div style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%'
            }}>
              {salesList.slice(1).map(s => {
                const prjCount = getActiveProjectsCount(s.name);
                return (
                  <div key={s.id} style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    width: 150,
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: avatarColors[s.avatar] || '#8b5cf6',
                      color: '#fff', fontWeight: 700, fontSize: 13,
                      display: 'flex', alignItems: 'center', justifycontent: 'center',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px'
                    }}>{s.avatar}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.role}</div>
                    <div style={{ 
                      fontSize: 10.5, 
                      background: prjCount > 0 ? '#eff6ff' : '#f8fafc',
                      color: prjCount > 0 ? '#1d4ed8' : '#64748b',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 700,
                      display: 'inline-block'
                    }}>
                      ดูแลโปรเจกต์: {prjCount} งาน
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Sales Summary Statistics Card */}
        <div className="card" style={{ padding: 22, height: 'fit-content' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: 'var(--text)' }}>📊 ภาพรวมยอดขายบริษัท</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>เป้ายอดขายรวม (Annual Target)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>฿14,000,000</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ยอดปิดขายจริง (Closed Won)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', fontFamily: 'Inter, sans-serif' }}>฿10,550,000</div>
              <div style={{ fontSize: 10.5, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>📈 บรรลุเป้าหมายแล้ว 75.3%</div>
            </div>
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 600 }}>จำนวนใบเสนอราคาที่รอลูกค้าอนุมัติ</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{quotations.filter(q => q.status === 'Approved' || q.status === 'Draft').length} รายการ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Members Detail List */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: 'var(--text)' }}>📇 รายละเอียดบุคลากรทีมขาย (Sales Directory)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {salesList.map(s => {
            const pct = Math.min(100, Math.round((s.closedValue / s.target) * 100));
            return (
              <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'start', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: avatarColors[s.avatar] || '#6366f1',
                    color: '#fff', fontWeight: 700, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{s.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.name} ({s.nickname})</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>{s.role}</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>อีเมล:</span>
                    <span style={{ fontWeight: 600 }}>{s.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>เบอร์โทร:</span>
                    <span style={{ fontWeight: 600 }}>{s.phone}</span>
                  </div>
                </div>

                {/* Quota Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-muted)' }}>เป้ายอดขายรายบุคคล:</span>
                    <span style={{ color: 'var(--text)' }}>฿{s.closedValue.toLocaleString()} / ฿{s.target.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b', borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
