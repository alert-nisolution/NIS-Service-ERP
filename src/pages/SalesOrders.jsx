import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesOrders } from '../mockDb';

const statusColors = {
  'Delivered':'badge-approved', 'In Progress':'badge-sent',
  'Project Open':'badge-info', 'Closed':'badge-draft',
};

const statusTextTh = {
  'Delivered': 'ส่งมอบแล้ว',
  'In Progress': 'กำลังดำเนินการ',
  'Project Open': 'เปิดโครงการแล้ว',
  'Closed': 'ปิดโครงการแล้ว'
};

function fmt(n) { return '฿' + n.toLocaleString(); }

export default function SalesOrders() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทุกสถานะ');
  const [salesOrdersList, setSalesOrdersList] = useState(() => getSalesOrders());

  const filtered = salesOrdersList.filter(so =>
    (!search || so.id.toLowerCase().includes(search.toLowerCase()) || so.customer.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'ทุกสถานะ' || so.status === statusFilter)
  );

  const so = selected ? salesOrdersList.find(s => s.id === selected) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sales Orders — ใบสั่งขาย</div>
          <div className="page-subtitle">รายการใบสั่งขายที่แปลงมาจากใบเสนอราคาและมีข้อมูล PO อ้างอิง</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title: 'Export Excel', message: 'ระบบกำลังส่งออกรายการใบสั่งขายออกเป็นไฟล์ Excel...', type: 'success' }
          }))}>Export Excel</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:20}}>
        <div className="card">
          <div className="filter-bar">
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="ค้นหาเลขที่ SO, ลูกค้า..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={{width:160}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ทุกสถานะ">ทุกสถานะ</option>
              <option value="In Progress">กำลังดำเนินการ</option>
              <option value="Delivered">ส่งมอบแล้ว</option>
              <option value="Project Open">เปิดโครงการแล้ว</option>
              <option value="Closed">ปิดโครงการแล้ว</option>
            </select>
            <div style={{marginLeft:'auto',fontSize:13,color:'var(--text-muted)'}}>แสดง {filtered.length} จาก {salesOrdersList.length} รายการ</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>เลขที่ SO</th>
                  <th>อ้างอิง QT</th>
                  <th>ลูกค้า</th>
                  <th>พนักงานขาย</th>
                  <th>วันที่สั่งซื้อ</th>
                  <th>ประเภทงาน</th>
                  <th>Project</th>
                  <th>มูลค่า</th>
                  <th>สถานะ</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(so => (
                  <tr key={so.id} style={{cursor:'pointer', background: selected===so.id?'#eef2ff':''}}
                      onClick={() => setSelected(selected===so.id ? null : so.id)}>
                    <td className="td-id">{so.id}</td>
                    <td style={{fontSize:12,fontFamily:'monospace'}}>
                      <span 
                        style={{color:'var(--primary)', fontWeight:600, cursor:'pointer', textDecoration:'underline'}}
                        onClick={e => { e.stopPropagation(); navigate(`/quotations/${so.quoteRef}`); }}
                        title="ดูใบเสนอราคาอ้างอิง"
                      >
                        {so.quoteRef}
                      </span>
                    </td>
                    <td className="td-name">{so.customer}</td>
                    <td style={{fontWeight:600}}>{so.salesName || 'คุณวีระ ศรีสุข'}</td>
                    <td className="td-muted">{so.date}</td>
                    <td><span className={`badge ${so.type.startsWith('MA')?'badge-ma':so.type==='Implement'?'badge-implement':'badge-runrate'}`}>{so.type}</span></td>
                    <td style={{fontFamily:'monospace',fontSize:12,color:so.project !== '-'?'var(--primary)':'var(--text-muted)',fontWeight:600}}>
                      {so.project !== '-' ? (
                        <span 
                          style={{textDecoration:'underline', cursor:'pointer'}} 
                          onClick={e => { e.stopPropagation(); navigate(`/projects?id=${so.project}`); }}
                          title="ดูโปรเจกต์"
                        >
                          {so.project}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="td-amount">{fmt(so.value)}</td>
                    <td><span className={`badge ${statusColors[so.status]}`}>{statusTextTh[so.status] || so.status}</span></td>
                    <td>
                      <div className="td-actions">
                        {so.project && so.project !== '-' ? (
                          <button className="btn btn-secondary btn-sm" onClick={e => {e.stopPropagation(); navigate(`/projects?id=${so.project}`);}}>ดู Project</button>
                        ) : (
                          <button className="btn btn-sm" style={{background:'var(--primary)', color:'#fff'}} onClick={e => {e.stopPropagation(); navigate(`/projects/new?soRef=${so.id}`);}}>สร้าง Project</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Detail */}
        {so && (
          <div className="card" style={{padding:22,height:'fit-content',position:'sticky',top:80,maxHeight:'80vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:15}}>{so.id}</div>
              <button onClick={() => setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:20,lineHeight:1}}>×</button>
            </div>
            <span className={`badge ${statusColors[so.status]}`} style={{marginBottom:14,display:'inline-block'}}>{statusTextTh[so.status] || so.status}</span>
            
            {/* Customer PO Details Card */}
            {so.poNumber && (
              <div style={{background:'#fffbeb', borderRadius:8, padding:'12px 14px', marginBottom:16, border:'1px solid #fde68a'}}>
                <div style={{fontSize:11, color:'#b45309', fontWeight:700, textTransform:'uppercase', marginBottom:4, display:'flex', alignItems:'center', gap:4}}>
                  <span>📄 ข้อมูลใบสั่งซื้อ PO จากลูกค้า</span>
                </div>
                <div style={{fontSize:12.5, color:'#78350f', lineHeight:1.5}}>
                  <div><strong>เลขที่ PO:</strong> {so.poNumber}</div>
                  <div><strong>วันที่รับ PO:</strong> {so.poDate}</div>
                  {so.poNote && <div style={{fontSize:11.5, marginTop:4, borderTop:'1px dashed #fde68a', paddingTop:4}}><strong>บันทึก:</strong> {so.poNote}</div>}
                </div>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              {[
                ['ลูกค้า', so.customer],
                ['พนักงานขาย', so.salesName || 'คุณวีระ ศรีสุข'],
                ['ประเภทงาน', so.type],
                ['มูลค่า', fmt(so.value)],
                ['Project', so.project]
              ].map(([k,v],i) => (
                <div key={i} style={{
                  background:'var(--bg)',
                  borderRadius:8,
                  padding:'10px 12px',
                  gridColumn: k === 'Project' ? 'span 2' : 'span 1'
                }}>
                  <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Sales Order Items List */}
            {so.items && so.items.length > 0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12, fontWeight:700, marginBottom:8, color:'var(--text)'}}>ตารางรายการสินค้า (Items)</div>
                <div style={{border:'1px solid var(--border)', borderRadius:6, overflow:'hidden', background:'var(--bg)'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:11.5}}>
                    <thead>
                      <tr style={{background:'var(--border-light)', borderBottom:'1px solid var(--border)'}}>
                        <th style={{padding:'6px 8px', textAlign:'left'}}>รายการ</th>
                        <th style={{padding:'6px 8px', textAlign:'right', width:40}}>จำนวน</th>
                        <th style={{padding:'6px 8px', textAlign:'right', width:80}}>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {so.items.map(item => (
                        <tr key={item.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                          <td style={{padding:'6px 8px', color:'var(--text)'}}>
                            <div style={{fontWeight:600}}>{item.name}</div>
                            <div style={{fontSize:10, color:'var(--text-muted)'}}>{item.sku}</div>
                          </td>
                          <td style={{padding:'6px 8px', textAlign:'right', color:'var(--text)'}}>{item.qty}</td>
                          <td style={{padding:'6px 8px', textAlign:'right', color:'var(--text)', fontWeight:600}}>{fmt(item.qty * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <hr className="divider" />
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>ความคืบหน้าโครงการ (SO Lifecycle)</div>
            {(() => {
              const lifecycleSteps = [
                { label: 'เปิด SO / รับ PO', icon: '📝' },
                { label: 'รอเปิด Project', icon: '📂' },
                { label: 'Assign Service Manager', icon: '👨‍💼' },
                { label: 'Assign Staff / จ่ายงาน', icon: '👷' },
                { label: 'ดำเนินการหน้างาน', icon: '🔧' },
                { label: 'ส่งมอบ / ปิดงาน', icon: '✅' },
              ];

              // Determine current step index based on SO status
              let currentStep = 0;
              if (so.status === 'Closed' || so.status === 'Delivered') {
                currentStep = 6; // all done
              } else if (so.status === 'In Progress') {
                currentStep = so.project && so.project !== '-' ? 4 : 3;
              } else if (so.status === 'Project Open') {
                currentStep = so.project && so.project !== '-' ? 2 : 1;
              }

              return lifecycleSteps.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep && currentStep < 6;
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<5?'1px solid var(--border-light)':'none'}}>
                    <div style={{
                      width:24,height:24,borderRadius:'50%',
                      background: done ? 'var(--secondary)' : active ? 'var(--primary)' : 'var(--border)',
                      display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                      boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <span style={{fontSize:10,fontWeight:700,color: active ? '#fff' : 'var(--text-muted)'}}>{i+1}</span>
                      )}
                    </div>
                    <div style={{flex:1}}>
                      <span style={{fontSize:12.5,color:done?'var(--text)': active ? 'var(--primary)' : 'var(--text-muted)',fontWeight: done || active ? 700 : 400}}>
                        {step.icon} {step.label}
                      </span>
                      {active && (
                        <div style={{fontSize:10,color:'var(--primary)',marginTop:2,fontWeight:600}}>← ขั้นตอนปัจจุบัน</div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}


            {so.project && so.project !== '-' ? (
              <button className="btn btn-primary" style={{width:'100%',marginTop:14,justifyContent:'center'}} onClick={() => navigate(`/projects?id=${so.project}`)}>
                ดู Project Detail →
              </button>
            ) : (
              <button className="btn btn-primary" style={{width:'100%',marginTop:14,justifyContent:'center',background:'var(--secondary)'}} onClick={() => navigate(`/projects/new?soRef=${so.id}`)}>
                สร้าง Project จาก SO นี้ →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
