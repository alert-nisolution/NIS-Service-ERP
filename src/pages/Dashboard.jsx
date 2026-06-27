import { useNavigate } from 'react-router-dom';
import { getQuotations, getProjects } from '../mockDb';


// ── SVG Bar Chart ──────────────────────────────────
function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const chartH = 140, barW = 36, gap = 18;
  const svgW = data.length * (barW + gap) - gap + 40;
  const colors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#14b8a6','#f97316','#06b6d4','#a855f7','#22c55e','#ec4899'];

  return (
    <svg width={svgW} height={chartH + 40} viewBox={`0 0 ${svgW} ${chartH + 40}`}>
      {/* Grid lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1="0" y1={chartH - (chartH/4)*i} x2={svgW} y2={chartH - (chartH/4)*i}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const barH = maxVal > 0 ? (d.value / maxVal) * chartH * 0.9 : 0;
        const x = i * (barW + gap) + 20;
        return (
          <g key={i}>
            <rect x={x} y={chartH - barH} width={barW} height={barH}
              fill={colors[i % colors.length]} rx="5" opacity="0.9" />
            <text x={x + barW/2} y={chartH - barH - 6} textAnchor="middle"
              fontSize="11" fontWeight="700" fill="#475569">{d.value}</text>
            <text x={x + barW/2} y={chartH + 16} textAnchor="middle"
              fontSize="10.5" fill="#94a3b8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Line Chart ─────────────────────────────────
function LineChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value)) * 1.1;
  const w = 420, h = 150, pad = 30;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - (d.value / maxVal) * (h - pad * 2),
    label: d.label,
    value: d.value
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${pts[pts.length-1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,1,2,3].map(i => (
        <line key={i} x1={pad} y1={pad + i*(h-pad*2)/3} x2={w-pad} y2={pad + i*(h-pad*2)/3}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
          <text x={p.x} y={h - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── SVG Donut Chart ────────────────────────────────
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
  let cum = 0;
  const r = 54, cx = 70, cy = 70, inner = 36;
  const slices = [];
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const start = (cum / total) * 2 * Math.PI - Math.PI / 2;
    cum += d.value;
    const end = (cum / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const ix1 = cx + inner * Math.cos(start), iy1 = cy + inner * Math.sin(start);
    const ix2 = cx + inner * Math.cos(end), iy2 = cy + inner * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1}`;
    slices.push({ path, color: colors[i % colors.length], ...d });
  }

  return (
    <div className="donut-chart">
      <svg width="140" height="140" className="donut-svg">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />)}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10" fill="#94a3b8">Total</text>
      </svg>
      <div className="donut-legend">
        {slices.map((s, i) => (
          <div className="legend-item" key={i}>
            <span className="legend-dot" style={{background: s.color}}></span>
            <span className="legend-label">{s.label}</span>
            <span className="legend-value">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const monthlyRevenue = [
  {label:'ม.ค.', value: 120},{label:'ก.พ.', value: 185},{label:'มี.ค.', value: 142},
  {label:'เม.ย.', value: 220},{label:'พ.ค.', value: 198},{label:'มิ.ย.', value: 275},
  {label:'ก.ค.', value: 240},{label:'ส.ค.', value: 310},{label:'ก.ย.', value: 280},
  {label:'ต.ค.', value: 350},{label:'พ.ย.', value: 390},{label:'ธ.ค.', value: 420},
];
const ticketByType = [
  {label:'Runrate', value: 34},{label:'Implement', value: 21},
  {label:'MA-Dev', value: 18},{label:'MA-FG', value: 12},{label:'MA-SW', value: 9},{label:'MA-Net', value: 15}
];
const ticketDonut = [
  {label:'Open', value: 18},{label:'In Progress', value: 24},{label:'Pending', value: 8},{label:'Closed', value: 67}
];

const recentActivities = [
  {icon:'📋', text:'สร้างใบเสนอราคา QT-2023-112 ให้ TechVision Co., Ltd.', time:'10 นาทีที่แล้ว', color:'#6366f1'},
  {icon:'✅', text:'ปิด Ticket TK-0089 งาน Onsite Implement - KBank Head Office', time:'35 นาทีที่แล้ว', color:'#10b981'},
  {icon:'🔔', text:'แจ้งเตือน MA ใกล้หมดอายุ: Global Finance (เหลือ 12 วัน)', time:'1 ชั่วโมงที่แล้ว', color:'#f59e0b'},
  {icon:'🚀', text:'Auto Gen 12 Tickets สำหรับสัญญา MA ของ PTT Digital', time:'2 ชั่วโมงที่แล้ว', color:'#3b82f6'},
  {icon:'📦', text:'เบิกสินค้า FortiGate 100F จากคลังสำหรับ Ticket TK-0091', time:'3 ชั่วโมงที่แล้ว', color:'#8b5cf6'},
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">ภาพรวมงานและการดำเนินงานของทีม Service | วันที่ 18 มิ.ย. 2566</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title: 'ดาวน์โหลดรายงาน', message: 'ระบบกำลังสร้างและดาวน์โหลดรายงานสรุปข้อมูลทีม Service ในรูปแบบ PDF...', type: 'success' }
          }))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            Export Report
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/quotations/create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            สร้างใบเสนอราคา
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="alert-banner warning" style={{marginBottom:16}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flexShrink:0,marginTop:1}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div className="alert-text">
          <h4>⚡ แจ้งเตือนสัญญาใกล้หมดอายุ (2 รายการ)</h4>
          <p>Global Finance Co. (เหลือ 12 วัน) และ Acme Corp (เหลือ 18 วัน) — กรุณาดำเนินการทำใบเสนอราคาต่ออายุ</p>
        </div>
        <button className="btn btn-sm" style={{background:'#f59e0b',color:'#fff',marginLeft:'auto',flexShrink:0}} onClick={() => navigate('/quotations')}>ดูรายการ</button>
      </div>

      {/* Stats */}
      {(() => {
        const activeProjectsCount = getProjects().length;
        const openTicketsCount = getProjects().reduce((acc, p) => acc + p.tickets.filter(t => t.status !== 'Done' && t.status !== 'Closed').length, 0);
        const pendingQuotationsCount = getQuotations().filter(q => q.status !== 'Approved').length;
        return (
          <div className="stat-grid">
            {[
              { label:'Active Projects', value: activeProjectsCount.toString(), change:'+3 เดือนนี้', up:true, color:'indigo', path: '/projects',
                icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>},
              { label:'Open Tickets', value: openTicketsCount.toString(), change:'-5 จากเมื่อวาน', up:false, color:'rose', path: '/service-board',
                icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>},
              { label:'Pending Quotations', value: pendingQuotationsCount.toString(), change:'2 ใบเสนอราคาล่วงหน้า', up:true, color:'amber', path: '/quotations',
                icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
              { label:'Revenue (MTD)', value:'฿2.8M', change:'+12% vs เดือนก่อน', up:true, color:'emerald',
                onClick: () => window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: 'รายได้ MTD', message: 'เป้าหมายรายเดือน ฿3.0M ตอนนี้ทำได้ 93.3% แล้ว!', type: 'info' } })),
                icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
            ].map((s, i) => (
              <div className="stat-card" key={i} style={{cursor: 'pointer'}} onClick={() => s.path ? navigate(s.path) : s.onClick()}>
                <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                <div className="stat-info">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className={`stat-change ${s.up?'up':'down'}`}>{s.up?'▲':'▼'} {s.change}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Charts Row 1 */}
      <div className="grid-2" style={{marginBottom:20}}>
        {/* Monthly Revenue Bar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">รายได้รายเดือน (ล้านบาท)</div>
            <span className="badge badge-info">ปี 2566</span>
          </div>
          <div className="card-body" style={{overflowX:'auto'}}>
            <BarChart data={monthlyRevenue} />
          </div>
        </div>

        {/* Ticket by Status Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">สถานะ Ticket ทั้งหมด</div>
            <span className="badge badge-draft">Live</span>
          </div>
          <div className="card-body">
            <DonutChart data={ticketDonut} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{marginBottom:20}}>
        {/* Line Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ticket Trend (12 เดือน)</div>
          </div>
          <div className="card-body">
            <LineChart data={monthlyRevenue.map(d => ({...d, value: Math.round(d.value * 0.35)}))} />
          </div>
        </div>

        {/* Ticket by Job Type */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tickets แยกตามประเภทงาน</div>
          </div>
          <div className="card-body" style={{overflowX:'auto'}}>
            <BarChart data={ticketByType} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity + Top Customers */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header" style={{marginBottom:14}}>
            <div className="card-title">กิจกรรมล่าสุด</div>
          </div>
          <div className="card-body" style={{paddingTop:0}}>
            {recentActivities.map((a, i) => (
              <div key={i} style={{display:'flex', gap:12, alignItems:'flex-start', padding:'10px 0', borderBottom: i<recentActivities.length-1?'1px solid var(--border-light)':'none'}}>
                <div style={{width:32,height:32,background:a.color+'18',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:15}}>{a.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:'var(--text)',lineHeight:1.4}}>{a.text}</div>
                  <div style={{fontSize:11.5,color:'var(--text-light)',marginTop:3}}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{marginBottom:14}}>
            <div className="card-title">ลูกค้าสูงสุดตามมูลค่า</div>
          </div>
          <div className="card-body" style={{paddingTop:0}}>
            {[
              {name:'PTT Digital Solutions', value:'฿1.2M', projects:5, color:'#6366f1'},
              {name:'KBank - IT Division', value:'฿890K', projects:3, color:'#10b981'},
              {name:'SCG Cement Co.,Ltd.', value:'฿650K', projects:2, color:'#f59e0b'},
              {name:'Global Finance Group', value:'฿420K', projects:4, color:'#3b82f6'},
              {name:'Acme Corp Thailand', value:'฿380K', projects:2, color:'#8b5cf6'},
            ].map((c, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:i<4?'1px solid var(--border-light)':'none'}}>
                <div style={{width:36,height:36,background:c.color+'18',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:c.color,fontWeight:800,fontSize:13,flexShrink:0}}>
                  {c.name.charAt(0)}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{c.name}</div>
                  <div style={{fontSize:11.5,color:'var(--text-muted)'}}>{c.projects} โครงการ</div>
                </div>
                <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{c.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
