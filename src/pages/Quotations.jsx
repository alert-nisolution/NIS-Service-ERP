import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotations, saveQuotations, getSalesOrders, addSalesOrder, getSystemConfig } from '../mockDb';

const preQuotations = [
  { id:'PRE-2023-089', customer:'Global Finance Group', type:'MA Renewal — MA-Network', poRef:'PO-2022-054 / MA-NET-22-005', dueDate:'30 ต.ค. 2566', dueIn:12, value:360000 },
  { id:'PRE-2023-090', customer:'Acme Corp Thailand', type:'Warranty End — FortiGate 60F', poRef:'PO-2022-001', dueDate:'6 พ.ย. 2566', dueIn:18, value:120000 },
];

const statusColors = { Draft:'badge-draft', Sent:'badge-sent', Approved:'badge-approved', Rejected:'badge-draft' };
const typeColors   = { Runrate:'badge-runrate', Implement:'badge-implement', 'MA-Fortigate':'badge-ma', 'MA-Network':'badge-ma', 'MA-Device':'badge-ma', 'MA-Software':'badge-ma' };

function fmt(n) { return '฿' + n.toLocaleString(); }

export default function Quotations() {
  const navigate = useNavigate();
  const config = getSystemConfig();
  const jobTypes = config.jobTypes || [];

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [quotationsList, setQuotationsList] = useState(() => getQuotations());
  const [preQuotesList, setPreQuotesList] = useState(preQuotations);
  const [sortBy, setSortBy] = useState('');

  // PO Modal states
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedQuoteForSO, setSelectedQuoteForSO] = useState(null);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poNote, setPoNote] = useState('');

  const filtered = quotationsList.filter(q =>
    (!search || q.id.toLowerCase().includes(search.toLowerCase()) || q.customer.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || q.type === filterType)
  );

  const handleOpenPOModal = (q) => {
    setSelectedQuoteForSO(q);
    setPoNumber('');
    setPoDate(new Date().toISOString().split('T')[0]);
    setPoNote('');
    setShowPOModal(true);
  };

  const handleConfirmConvertSO = () => {
    if (!selectedQuoteForSO) return;
    if (!poNumber.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'กรอกข้อมูล PO', message: 'กรุณากรอกเลขที่ PO จากลูกค้า', type: 'error' }
      }));
      return;
    }

    const currentSOList = getSalesOrders();
    const exists = currentSOList.find(so => so.quoteRef === selectedQuoteForSO.id);
    if (!exists) {
      const newSO = {
        id: `SO-2023-${Math.floor(100 + Math.random() * 900)}`,
        quoteRef: selectedQuoteForSO.id,
        customer: selectedQuoteForSO.customer,
        date: new Date().toISOString().split('T')[0],
        type: selectedQuoteForSO.type,
        value: selectedQuoteForSO.value,
        status: 'Project Open',
        project: '-', // No project created yet!
        poNumber: poNumber,
        poDate: poDate,
        poNote: poNote,
        salesName: selectedQuoteForSO.salesName || 'คุณวีระ ศรีสุข',
        items: selectedQuoteForSO.items || [] // Carry over matching items!
      };
      addSalesOrder(newSO);
      
      // Make sure quote status is approved
      const updatedQ = quotationsList.map(item => item.id === selectedQuoteForSO.id ? { ...item, status: 'Approved' } : item);
      saveQuotations(updatedQ);
      setQuotationsList(updatedQ);

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'สร้างใบสั่งขาย', message: `สร้างใบสั่งขาย ${newSO.id} สำหรับใบเสนอราคา ${selectedQuoteForSO.id} สำเร็จ!`, type: 'success' }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ใบสั่งขายเปิดแล้ว', message: `ใบสั่งขายสำหรับใบเสนอราคา ${selectedQuoteForSO.id} มีอยู่แล้ว (${exists.id})`, type: 'info' }
      }));
    }
    setShowPOModal(false);
    navigate('/sales-orders');
  };

  const handleSort = (type) => {
    setSortBy(type);
    let sorted = [...preQuotesList];
    if (type === 'po') {
      sorted.sort((a, b) => a.poRef.localeCompare(b.poRef));
    } else if (type === 'customer') {
      sorted.sort((a, b) => a.customer.localeCompare(b.customer));
    } else if (type === 'due') {
      sorted.sort((a, b) => a.dueIn - b.dueIn);
    }
    setPreQuotesList(sorted);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'จัดเรียงข้อมูล', message: `จัดเรียงรายการ Pre-Quotations ตาม ${type === 'po' ? 'เลขที่ PO' : type === 'customer' ? 'ชื่อลูกค้า' : 'ระยะเวลาคงเหลือ'} สำเร็จ`, type: 'info' }
    }));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Quotations — ใบเสนอราคา</div>
          <div className="page-subtitle">จัดการใบเสนอราคาและรายการต่ออายุสัญญาอัตโนมัติ</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title: 'Export Excel', message: 'ระบบกำลังดึงข้อมูลและดาวน์โหลดไฟล์ Quotations.xlsx...', type: 'success' }
          }))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/quotations/create')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            สร้างใบเสนอราคา
          </button>
        </div>
      </div>

      {/* Pre-Quote Alert */}
      <div className="alert-banner warning">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div className="alert-text">
          <h4>รายการใบเสนอราคาล่วงหน้าที่ใกล้ถึงกำหนด (Auto-Renewal)</h4>
          <p>มี 2 รายการที่ระบบตรวจพบ: Global Finance Group (12 วัน) และ Acme Corp Thailand (18 วัน) — ต้องดำเนินการทำใบเสนอราคา</p>
        </div>
        <button className="btn btn-sm" style={{background:'#d97706',color:'#fff',flexShrink:0,marginLeft:'auto'}} onClick={() => setTab('pre')}>ดูรายการ Pre-Quote</button>
      </div>

      {/* PO Details Modal */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 480, boxShadow: 'var(--shadow-lg)', textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: 'var(--text)' }}>แปลงใบเสนอราคาเป็นใบสั่งขาย (SO)</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>ระบุข้อมูลเอกสารใบสั่งซื้อ (PO) ที่ได้รับจากลูกค้าเพื่อเปิด SO</div>

            {/* Summary Card — ข้อมูลอ้างอิงจากใบเสนอราคา */}
            {selectedQuoteForSO && (
              <div style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderRadius: 10, padding: '14px 16px', marginBottom: 18, border: '1px solid #c7d2fe' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>📋</span> ข้อมูลอ้างอิงจากใบเสนอราคา
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>เลขที่ใบเสนอราคา</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{selectedQuoteForSO.id}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>ลูกค้า</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{selectedQuoteForSO.customer}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>พนักงานขาย</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{selectedQuoteForSO.salesName || 'คุณวีระ ศรีสุข'}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>มูลค่ารวม</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>฿{selectedQuoteForSO.value?.toLocaleString() || '-'}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>เลขที่ใบสั่งซื้อ (PO Number) *</label>
              <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="เช่น PO-SCG-2023-9988" style={{ marginTop: 6 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>วันที่รับ PO *</label>
              <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} style={{ marginTop: 6 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>รายละเอียดเพิ่มเติม / บันทึกการรับ PO</label>
              <textarea value={poNote} onChange={e => setPoNote(e.target.value)} placeholder="รายละเอียดบันทึกเพิ่มเติม..." rows={3} style={{ marginTop: 6, width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowPOModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleConfirmConvertSO}>✓ ยืนยันแปลงใบสั่งขาย (SO)</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {/* Tabs */}
        <div style={{padding:'14px 18px 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div className="tabs">
            <button className={`tab-btn${tab==='all'?' active':''}`} onClick={() => setTab('all')}>
              ใบเสนอราคาทั้งหมด
              <span style={{background:'var(--primary)',color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:700,marginLeft:6}}>{quotationsList.length}</span>
            </button>
            <button className={`tab-btn${tab==='pre'?' active':''}`} onClick={() => setTab('pre')}>
              Pre-Quotations (Auto Renewal)
              <span style={{background:'#f59e0b',color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:700,marginLeft:6}}>{preQuotesList.length}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="ค้นหาเลขที่, ลูกค้า..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === 'all' && (
            <select style={{width:180}} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">ทุกประเภทงาน</option>
              {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {tab === 'pre' && (
            <div style={{display:'flex',gap:8}}>
              <button className={`btn btn-sm ${sortBy==='po'?'btn-primary':'btn-secondary'}`} onClick={() => handleSort('po')}>เรียงตาม PO</button>
              <button className={`btn btn-sm ${sortBy==='customer'?'btn-primary':'btn-secondary'}`} onClick={() => handleSort('customer')}>เรียงตามลูกค้า</button>
              <button className={`btn btn-sm ${sortBy==='due'?'btn-primary':'btn-secondary'}`} style={{background:sortBy==='due'?'':'#fee2e2',color:sortBy==='due'?'':'#991b1b',border:sortBy==='due'?'':'1px solid #fca5a5'}} onClick={() => handleSort('due')}>ใกล้ถึงกำหนด ก่อน</button>
            </div>
          )}
          <div style={{marginLeft:'auto',fontSize:13,color:'var(--text-muted)'}}>
            {tab==='all' ? `แสดง ${filtered.length} รายการ` : `${preQuotesList.length} รายการ`}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {tab === 'all' ? (
            <table>
              <thead>
                <tr>
                  <th>เลขที่ใบเสนอราคา</th>
                  <th>ลูกค้า</th>
                  <th>วันที่สร้าง</th>
                  <th>วันหมดอายุ</th>
                  <th>ประเภทงาน</th>
                  <th>Tags</th>
                  <th>มูลค่า</th>
                  <th>สถานะ</th>
                  <th style={{textAlign:'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)} style={{cursor:'pointer'}}>
                    <td className="td-id">{q.id}</td>
                    <td>
                      <div className="td-name">{q.customer}</div>
                      <div className="td-muted" style={{fontSize:12}}>{q.contact}</div>
                    </td>
                    <td className="td-muted">{q.date}</td>
                    <td className="td-muted">{q.due}</td>
                    <td><span className={`badge ${typeColors[q.type]||'badge-draft'}`}>{q.type}</span></td>
                    <td>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                        {(q.tags || []).map(t => <span key={t} style={{background:'#f1f5f9',color:'#475569',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600}}>{t}</span>)}
                      </div>
                    </td>
                    <td className="td-amount">{fmt(q.value)}</td>
                    <td><span className={`badge ${statusColors[q.status]}`}>{q.status}</span></td>
                    <td>
                      <div className="td-actions" style={{justifyContent:'flex-end'}}>
                        <button className="btn btn-secondary btn-sm" onClick={e => {e.stopPropagation(); navigate(`/quotations/${q.id}`);}}>ดู</button>
                        {q.status === 'Approved' && (
                          <button className="btn btn-sm" style={{background:'var(--secondary)',color:'#fff'}} onClick={e => {e.stopPropagation(); handleOpenPOModal(q);}}>→ SO</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Pre-Quote ID</th>
                  <th>ลูกค้า</th>
                  <th>ประเภท</th>
                  <th>อ้างอิง PO / สัญญา</th>
                  <th>วันหมดอายุ</th>
                  <th>เหลือ (วัน)</th>
                  <th>มูลค่าประมาณ</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {preQuotesList.map(q => (
                  <tr key={q.id}>
                    <td className="td-id">{q.id}</td>
                    <td className="td-name">{q.customer}</td>
                    <td className="td-muted" style={{fontSize:12}}>{q.type}</td>
                    <td className="td-muted">{q.poRef}</td>
                    <td className="td-muted">{q.dueDate}</td>
                    <td>
                      <span className={`badge ${q.dueIn <= 14 ? 'badge-danger' : 'badge-warning'}`}>
                        {q.dueIn <= 14 && '⚠ '}{q.dueIn} วัน
                      </span>
                    </td>
                    <td className="td-amount">{fmt(q.value)}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/quotations/create')}>
                        สร้างใบเสนอราคา
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
