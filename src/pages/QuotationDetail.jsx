import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuotations, saveQuotations, addQuotation, getSalesOrders, addSalesOrder, getSystemConfig } from '../mockDb';

const initItems = [
  { id: 1, name: 'FortiGate 100F Next-Gen Firewall', sku: 'FG-100F', qty: 1, price: 185000, warranty: '3 ปี (Vendor)', type: 'Hardware' },
  { id: 2, name: 'FortiSwitch 124F-POE Managed Switch (24-port)', sku: 'FS-124F-POE', qty: 2, price: 45000, warranty: '3 ปี (Vendor)', type: 'Hardware' },
  { id: 3, name: 'FortiAP 231F WiFi 6 Access Point', sku: 'FAP-231F', qty: 4, price: 18000, warranty: '3 ปี (Vendor)', type: 'Hardware' },
  { id: 4, name: 'Fiber Patch Cable SFP SM 10G (10M)', sku: 'FIBER-SFP-10G', qty: 10, price: 800, warranty: '-', type: 'Accessory' },
  { id: 5, name: 'Installation & Configuration Service', sku: 'SVC-INSTALL', qty: 1, price: 45000, warranty: '1 ปี (Service)', type: 'Service' },
  { id: 6, name: 'Annual Maintenance (MA-Fortigate)', sku: 'SVC-MA-FG', qty: 1, price: 85000, warranty: '1 ปี (Service)', type: 'MA Service' },
];

const pmOptions = ['4 ครั้ง/ปี (ทุก 3 เดือน)', '12 ครั้ง/ปี (ทุกเดือน)', '2 ครั้ง/ปี (ทุก 6 เดือน)', '6 ครั้ง/ปี (ทุก 2 เดือน)'];

export default function QuotationDetail({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const config = getSystemConfig();
  const jobTypes = config.jobTypes || [];
  const slaOptions = config.slaOptions || [];

  const isView = mode === 'view';
  const qId = id || 'QT-2023-NEW';

  const allQ = getQuotations();
  const existingQ = isView ? allQ.find(q => q.id === qId) : null;

  // Header and main states
  const [customer, setCustomer] = useState(existingQ ? existingQ.customer : "");
  const [contact, setContact] = useState(existingQ ? existingQ.contact : "");
  const [phone, setPhone] = useState(existingQ ? existingQ.phone || "" : "");
  const [email, setEmail] = useState(existingQ ? existingQ.email || "" : "");
  const [status, setStatus] = useState(existingQ ? existingQ.status : 'Draft');
  const [jobType, setJobType] = useState(existingQ ? existingQ.type : 'Implement');

  // Items table states
  const [items, setItems] = useState(() => {
    if (existingQ && existingQ.items) return existingQ.items;
    return initItems;
  });

  const [saved, setSaved] = useState(false);
  const [selectedTags, setSelectedTags] = useState(existingQ ? existingQ.tags : ['Firewall', 'Network', 'Cable']);
  const [attachments, setAttachments] = useState(['1. BOQ_TechVision_v2.3.xlsx', '2. TechVision_PO_2023_112.pdf', '3. Network_Diagram_Proposal.vsdx']);

  // PO Modal state
  const [showPOModal, setShowPOModal] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poNote, setPoNote] = useState('');

  // Procurement Chat state
  const [chat, setChat] = useState([
    { from: 'Procurement', name: 'คุณนภา (จัดซื้อ)', msg: 'สวัสดีค่ะ ได้รับร่างใบเสนอราคาเรียบร้อยแล้ว รบกวนขอเปรียบเทียบสเปค FortiGate 100F เพิ่มเติมค่ะ', time: '10:15' },
    { from: 'Sales', name: 'Somchai (Sales)', msg: 'ได้ครับ ผมส่งข้อมูลเปรียบเทียบและการรับประกันอุปกรณ์ให้ทาง Email แล้วครับ หากต้องการส่วนลดพิเศษแจ้งได้เลยครับ', time: '10:30' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Calculations
  const subtotal = items.reduce((s, i) => s + (i.qty * i.price), 0);
  const vat = Math.round(subtotal * 0.07);
  const total = subtotal + vat;

  const autoTicketMsg = {
    Runrate: '1 Delivery Ticket → Service Manager',
    Implement: '1 Install Ticket + 4 PM Tickets + 1 Warranty Activation → Service Manager',
    'MA-Device': '12 Monthly MA Tickets + 4 PM Tickets + 12 Monthly Reports → Service Manager',
    'MA-Fortigate': '12 Monthly MA Tickets + 4 PM Tickets + 12 Monthly Reports → Service Manager',
    'MA-Software': '12 Support Tickets + 12 Monthly Reports → Service Manager',
    'MA-Network': '12 Monthly MA Tickets + 4 PM Tickets + Remote Backup Tickets → Service Manager',
  };

  function fmt(n) { return '฿' + n.toLocaleString(); }

  // Update item field
  const handleUpdateItem = (itemId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        let val = value;
        if (field === 'qty') val = parseInt(value) || 0;
        if (field === 'price') val = parseFloat(value) || 0;
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  // Add new item row
  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      name: 'Installation & Setup Service (Additional)',
      sku: 'SVC-INSTALL-ADD',
      qty: 1,
      price: 15000,
      warranty: '1 ปี (Service)',
      type: 'Service'
    };
    setItems([...items, newItem]);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'เพิ่มรายการ', message: 'เพิ่มรายการสินค้า/บริการใหม่สำเร็จ', type: 'success' }
    }));
  };

  // Remove item row
  const handleRemoveItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ลบรายการ', message: 'ลบรายการสินค้า/บริการสำเร็จ', type: 'info' }
    }));
  };

  // Save Quotation (Draft or Sent)
  const handleSave = (statusVal = 'Draft') => {
    const newId = isView ? qId : `QT-2023-${Math.floor(100 + Math.random() * 900)}`;
    const newQ = {
      id: newId,
      customer: customer || 'TechVision Co., Ltd.',
      contact: contact || 'คุณวิชัย สมบูรณ์',
      phone: phone || '02-xxx-xxxx',
      email: email || 'wichai@techvision.co.th',
      date: existingQ ? existingQ.date : new Date().toISOString().split('T')[0],
      due: existingQ ? existingQ.due : new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      status: statusVal,
      type: jobType,
      value: total,
      tags: selectedTags,
      items: items
    };

    if (isView) {
      const updatedList = allQ.map(q => q.id === qId ? newQ : q);
      saveQuotations(updatedList);
    } else {
      addQuotation(newQ);
    }
    setStatus(statusVal);

    setSaved(true);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: statusVal === 'Draft' ? 'บันทึกใบเสนอราคา' : 'ส่งใบเสนอราคา', 
        message: statusVal === 'Draft' ? `บันทึกใบเสนอราคา ${newId} (Draft) สำเร็จ!` : `ส่งใบเสนอราคา ${newId} ให้ลูกค้าสำเร็จ! (สถานะเปลี่ยนเป็น Sent)`, 
        type: 'success' 
      }
    }));

    setTimeout(() => {
      setSaved(false);
      navigate('/quotations');
    }, 1200);
  };

  // Status Progression
  const handleUpdateStatus = (newStatus) => {
    setStatus(newStatus);
    const updatedQ = {
      id: qId,
      customer: customer || 'TechVision Co., Ltd.',
      contact: contact || 'คุณวิชัย สมบูรณ์',
      phone: phone || '02-xxx-xxxx',
      email: email || 'wichai@techvision.co.th',
      date: existingQ ? existingQ.date : new Date().toISOString().split('T')[0],
      due: existingQ ? existingQ.due : new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      status: newStatus,
      type: jobType,
      value: total,
      tags: selectedTags,
      items: items
    };
    const updatedList = allQ.map(q => q.id === qId ? updatedQ : q);
    saveQuotations(updatedList);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'อัปเดตสถานะ', message: `เปลี่ยนสถานะใบเสนอราคา ${qId} เป็น ${newStatus} เรียบร้อยแล้ว`, type: 'success' }
    }));
  };

  // Convert to SO - Save PO details first
  const handleConvertSO = () => {
    setShowPOModal(true);
  };

  const handleConfirmConvertSO = () => {
    if (!poNumber.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'กรอกข้อมูล PO', message: 'กรุณากรอกเลขที่ PO จากลูกค้า', type: 'error' }
      }));
      return;
    }

    const currentSOList = getSalesOrders();
    const exists = currentSOList.find(so => so.quoteRef === qId);

    if (!exists) {
      const newSO = {
        id: `SO-2023-${Math.floor(100 + Math.random() * 900)}`,
        quoteRef: qId,
        customer: customer || 'TechVision Co., Ltd.',
        date: new Date().toISOString().split('T')[0],
        type: jobType,
        value: total,
        status: 'Project Open',
        project: '-', // No project created yet!
        poNumber: poNumber,
        poDate: poDate,
        poNote: poNote,
        salesName: existingQ?.salesName || 'คุณวีระ ศรีสุข',
        items: items // Carry over matching items!
      };
      
      addSalesOrder(newSO);

      // Force Quotation to Approved status if not already
      handleUpdateStatus('Approved');

      setShowPOModal(false);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'สร้างใบสั่งขาย (SO)', message: `สร้างใบสั่งขาย ${newSO.id} และแนบ PO เลขที่ ${poNumber} สำเร็จ!`, type: 'success' }
      }));
      navigate('/sales-orders');
    } else {
      setShowPOModal(false);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ใบสั่งขายเปิดแล้ว', message: `ใบสั่งขายสำหรับใบเสนอราคานี้มีอยู่แล้ว (${exists.id})`, type: 'info' }
      }));
      navigate('/sales-orders');
    }
  };

  // Send Chat message to Procurement
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChat([
      ...chat,
      { from: 'Sales', name: 'Somchai (Sales)', msg: chatInput.trim(), time: new Date().toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  return (
    <div style={{ width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>
      <style>{`
        .detail-layout-container {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .detail-layout-container {
            grid-template-columns: 1fr;
          }
        }
        .chat-msg {
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12.5px;
          line-height: 1.4;
          max-width: 85%;
        }
        .chat-msg.procurement {
          background: #f1f5f9;
          color: #1e293b;
          align-self: flex-start;
          border-bottom-left-radius: 2px;
        }
        .chat-msg.sales {
          background: #e0e7ff;
          color: #312e81;
          align-self: flex-end;
          border-bottom-right-radius: 2px;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/quotations')} style={{ width: 36, height: 36, border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="page-title">{isView ? `ใบเสนอราคา ${qId}` : 'สร้างใบเสนอราคาใหม่'}</div>
              <span className={`badge ${status === 'Draft' ? 'badge-draft' : status === 'Sent' ? 'badge-sent' : 'badge-approved'}`}>{status}</span>
            </div>
            <div className="page-subtitle">{isView ? `${customer || 'ข้อมูลใบเสนอราคาอ้างอิง'}` : 'กรอกข้อมูลลูกค้าและรายการสินค้า/บริการ'}</div>
          </div>
        </div>

        {/* Action Buttons & Status Progression */}
        <div className="page-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
          {isView ? (
            <>
              {status === 'Draft' && (
                <button className="btn btn-secondary" onClick={() => handleUpdateStatus('Sent')}>
                  ส่ง Email เสนอราคาลูกค้า →
                </button>
              )}
              {status === 'Sent' && (
                <>
                  <button className="btn" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleUpdateStatus('Rejected')}>
                    ลูกค้าไม่อนุมัติ (Reject)
                  </button>
                  <button className="btn btn-primary" onClick={() => handleUpdateStatus('Approved')}>
                    ลูกค้าอนุมัติ (Approve)
                  </button>
                </>
              )}
              {status === 'Approved' && (
                <button className="btn" style={{ background: 'var(--secondary)', color: '#fff' }} onClick={handleConvertSO}>
                  ⚡ แปลงเป็น SO (ใส่ข้อมูล PO)
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => handleSave(status)}>
                บันทึกการแก้ไข
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => handleSave('Draft')}>
                บันทึก Draft
              </button>
              <button className="btn btn-primary" onClick={() => handleSave('Sent')}>
                ส่งให้ลูกค้า
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card" style={{ padding: '14px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {['ใบเสนอราคา (Quo)', 'รับ PO / สร้าง SO', 'เปิด Project / Tickets', 'จ่ายงาน Staff', 'ดำเนินการหน้างาน', 'ส่งมอบ / ปิดงาน'].map((step, i) => {
            let active = false;
            let done = false;
            if (status === 'Draft' || status === 'Sent') {
              if (i === 0) active = true;
            } else if (status === 'Approved') {
              if (i === 0) done = true;
              if (i === 1) active = true;
            } else if (status === 'Rejected') {
              if (i === 0) active = true;
            }

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 120 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, margin: '0 auto' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 11,
                    background: done ? 'var(--secondary)' : active ? 'var(--primary)' : 'var(--border)',
                    color: active || done ? '#fff' : 'var(--text-muted)'
                  }}>{done ? '✓' : i + 1}</div>
                  <span style={{ fontSize: 11, color: active ? 'var(--primary)' : 'var(--text-muted)', fontWeight: active || done ? 700 : 400, whiteSpace: 'nowrap' }}>{step}</span>
                </div>
                {i < 5 && <div style={{ flex: 1, height: 2, background: done ? 'var(--secondary)' : 'var(--border)', margin: '0 4px', marginBottom: 18 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* PO Details Modal */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 480, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: 'var(--text)' }}>แปลงใบเสนอราคาเป็นใบสั่งขาย (SO)</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>ระบุข้อมูลเอกสารใบสั่งซื้อ (PO) ที่ได้รับจากลูกค้าเพื่อออก SO และส่งมอบโครงการ</div>

            {/* Summary Card — ข้อมูลอ้างอิงจากใบเสนอราคา */}
            <div style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderRadius: 10, padding: '14px 16px', marginBottom: 18, border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>📋</span> ข้อมูลอ้างอิงจากใบเสนอราคา
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>เลขที่ใบเสนอราคา</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{qId}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>ลูกค้า</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{customer || 'TechVision Co., Ltd.'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>พนักงานขาย</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{existingQ?.salesName || 'คุณวีระ ศรีสุข'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>มูลค่ารวม (VAT)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{fmt(total)}</div>
                </div>
              </div>
            </div>

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
              <textarea value={poNote} onChange={e => setPoNote(e.target.value)} placeholder="เช่น แนบใบเสนอราคา v2 และได้รับเมลอนุมัติจากผู้จัดซื้อ K.วิชัย แล้ว..." rows={3} style={{ marginTop: 6, width: '100%', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowPOModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleConfirmConvertSO}>✓ ยืนยันแปลงใบสั่งขาย (SO)</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="detail-layout-container">
        {/* Left Column (Main Form) */}
        <div>
          {/* Customer Info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">ข้อมูลลูกค้า</div></div>
            <div className="card-body">
              <div className="form-grid form-grid-2">
                <div>
                  <label>ชื่อบริษัท / ลูกค้า</label>
                  <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="กรอกชื่อบริษัทลูกค้า" />
                </div>
                <div>
                  <label>ผู้ติดต่อ</label>
                  <input value={contact} onChange={e => setContact(e.target.value)} placeholder="ชื่อผู้ประสานงาน" />
                </div>
                <div>
                  <label>เบอร์โทร</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="02-xxx-xxxx" />
                </div>
                <div>
                  <label>Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com" />
                </div>
                <div className="form-col-2">
                  <label>สถานที่ / Location (Google Maps)</label>
                  <div style={{ position: 'relative' }}>
                    <input defaultValue={isView ? "อาคาร TechVision Park, เลขที่ 123 ถ.พระราม 9, เขตห้วยขวาง, กรุงเทพฯ 10310" : ""} placeholder="ค้นหาผ่าน Google Maps..." />
                    <button style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">รายการสินค้าและบริการ (แก้ไขจำนวน / ราคาต่อหน่วยได้)</div>
              <button className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                เพิ่มรายการสินค้า
              </button>
            </div>

            <div className="table-wrapper" style={{ borderRadius: 0 }}>
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>#</th>
                    <th>รายละเอียด</th>
                    <th>ประเภท</th>
                    <th>การรับประกัน</th>
                    <th style={{ textAlign: 'right', width: 80 }}>จำนวน</th>
                    <th style={{ textAlign: 'right', width: 120 }}>ราคาต่อหน่วย</th>
                    <th style={{ textAlign: 'right', width: 120 }}>รวม</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <input style={{ fontWeight: 600, width: '100%' }} value={item.name} onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} />
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          <input 
                            style={{ fontSize: 11, color: 'var(--text-muted)', border: 'none', background: 'transparent', padding: 0, width: '100%' }} 
                            value={item.sku} 
                            onChange={e => handleUpdateItem(item.id, 'sku', e.target.value)} 
                            placeholder="SKU"
                          />
                        </div>
                      </td>
                      <td>
                        <select style={{ fontSize: 12, padding: '4px' }} value={item.type} onChange={e => handleUpdateItem(item.id, 'type', e.target.value)}>
                          <option>Hardware</option>
                          <option>Software</option>
                          <option>Accessory</option>
                          <option>Service</option>
                          <option>MA Service</option>
                        </select>
                      </td>
                      <td>
                        <select style={{ fontSize: 12, padding: '4px' }} value={item.warranty} onChange={e => handleUpdateItem(item.id, 'warranty', e.target.value)}>
                          <option>-</option>
                          <option>1 ปี (Service)</option>
                          <option>2 ปี (Vendor)</option>
                          <option>3 ปี (Vendor)</option>
                          <option>5 ปี (Vendor)</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input style={{ width: 60, textAlign: 'right' }} value={item.qty} type="number" onChange={e => handleUpdateItem(item.id, 'qty', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input style={{ width: 100, textAlign: 'right' }} value={item.price} type="number" onChange={e => handleUpdateItem(item.id, 'price', e.target.value)} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        {((item.qty || 0) * (item.price || 0)).toLocaleString()}
                      </td>
                      <td>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: 4 }} onClick={() => handleRemoveItem(item.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="items-total">
              <div className="total-box">
                <div className="total-row"><span>ราคาสินค้ารวม</span><span>{fmt(subtotal)}</span></div>
                <div className="total-row"><span>ภาษีมูลค่าเพิ่ม 7%</span><span>{fmt(vat)}</span></div>
                <div className="total-row grand"><span>ราคารวมทั้งสิ้น</span><span className="grand-amount">{fmt(total)}</span></div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">เอกสารแนบ</div>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                setAttachments([...attachments, `BOQ_Draft_v${attachments.length + 1}.xlsx`]);
                window.dispatchEvent(new CustomEvent('show-toast', {
                  detail: { title: 'แนบไฟล์', message: 'เลือกไฟล์ BOQ_Draft_v3.xlsx และอัปโหลดสำเร็จแล้ว', type: 'success' }
                }));
              }}>
                + แนบไฟล์
              </button>
            </div>
            <div className="card-body">
              {attachments.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < attachments.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{f}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { title: 'Preview เอกสาร', message: `กำลังสร้างมุมมองตัวอย่าง (Preview) ของไฟล์ ${f}...`, type: 'info' }
                  }))}>
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Job Classification Card */}
          <div className="sidebar-panel">
            <div className="section-title">Job Classification</div>
            <div style={{ marginBottom: 16 }}>
              <label>ประเภทงาน (Job Type Master)</label>
              <select value={jobType} onChange={e => setJobType(e.target.value)} style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ fontSize: 11, color: 'rgba(199,210,254,.6)', marginTop: 6 }}>ใช้สำหรับการวิเคราะห์และ Dashboard</div>
            </div>

            <hr className="divider" style={{ borderColor: 'rgba(255,255,255,.1)' }} />

            {/* Dynamic fields per job type */}
            {jobType === 'Runrate' && (
              <div style={{ marginBottom: 14 }}>
                <label>วิธีการจัดส่ง</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                  {['จัดส่ง โดยไม่ต้องติดตั้ง', 'PreConfig ก่อนจัดส่ง', 'จัดส่ง พร้อมติดตั้งหน้างาน', 'จัดส่ง และ Remote Config'].map((opt, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(199,210,254,.9)', textTransform: 'none', fontSize: 12.5, letterSpacing: 0, marginBottom: 0 }}>
                      <input type="radio" name="delivery" defaultChecked={i === 2} style={{ width: 'auto', accentColor: '#818cf8' }} />
                      {opt}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <label>ผู้จัดส่ง</label>
                  <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                    <option>NIS Team (Auto Ticket → Service Manager)</option>
                    <option>Messenger</option>
                    <option>ไปรษณีย์</option>
                  </select>
                </div>
              </div>
            )}

            {jobType === 'Implement' && (
              <div style={{ marginBottom: 14 }}>
                <label>ชื่อโครงการ</label>
                <input style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }} defaultValue={isView ? 'Implement FW & Network - TechVision 2023' : ''} placeholder="ชื่อโครงการ..." />
                <div style={{ marginTop: 10 }}>
                  <label>Onsite Service (หลังการขาย)</label>
                  <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                    <option>4 ครั้ง/ปี</option><option>2 ครั้ง/ปี</option>
                    <option>12 ครั้ง/ปี</option><option>ไม่รวม</option>
                  </select>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label>ระยะเวลารับประกัน (MA)</label>
                  <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                    <option>1 ปี (นับจากวันวางบิล)</option>
                    <option>2 ปี (นับจากวันวางบิล)</option>
                    <option>3 ปี (นับจากวันวางบิล)</option>
                  </select>
                </div>
              </div>
            )}

            {jobType.startsWith('MA') && (
              <div style={{ marginBottom: 14 }}>
                <label>SLA Level</label>
                <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                  {slaOptions.map(s => <option key={s}>{s}</option>)}
                </select>
                <div style={{ marginTop: 10 }}>
                  <label>Preventive Maintenance</label>
                  <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                    {pmOptions.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label>Remote Backup Config</label>
                  <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                    <option>12 ครั้ง/ปี (ทุกเดือน)</option>
                    <option>4 ครั้ง/ปี (ทุก 3 เดือน)</option>
                    <option>ไม่รวม</option>
                  </select>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label>Monthly Report</label>
                  <select style={{ background: 'rgba(255,255,255,.07)', borderColor: 'rgba(255,255,255,.12)', color: '#fff' }}>
                    <option>12 ครั้ง/ปี — ส่งภายในวันที่ 5 ของเดือนถัดไป</option>
                    <option>4 ครั้ง/ปี</option>
                  </select>
                </div>
              </div>
            )}

            <hr className="divider" style={{ borderColor: 'rgba(255,255,255,.1)' }} />
            <div>
              <label>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {['Firewall', 'Network', 'WiFi', 'Server', 'CCTV', 'Access Control', 'Software', 'Cable'].map(t => {
                  const active = selectedTags.includes(t);
                  return (
                    <span key={t} onClick={() => setSelectedTags(active ? selectedTags.filter(x => x !== t) : [...selectedTags, t])}
                      style={{
                        background: active ? 'var(--primary)' : 'rgba(129,140,248,.2)',
                        color: active ? '#fff' : '#c7d2fe',
                        padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                        border: active ? '1px solid var(--primary)' : '1px solid rgba(129,140,248,.3)'
                      }}>
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Procurement Chat Box */}
          <div className="card" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title" style={{ fontSize: 13.5 }}>💬 Chat กับจัดซื้อฝั่งลูกค้า (Procurement)</div>
            </div>
            <div style={{ padding: '12px 14px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chat.map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-light)', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: c.from === 'Sales' ? 'var(--primary)' : '#c2410c' }}>{c.name}</span>
                    <span>{c.time}</span>
                  </div>
                  <div className={`chat-msg ${c.from === 'Sales' ? 'sales' : 'procurement'}`}>
                    {c.msg}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="พิมพ์ข้อความเจรจาราคา/ขอไฟล์..." 
                style={{ flex: 1, fontSize: 12.5 }}
                onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }} 
              />
              <button className="btn btn-primary btn-sm" onClick={handleSendChat}>ส่ง</button>
            </div>
          </div>

          {/* Auto Ticket Info Box */}
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, background: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 4 }}>Auto Ticket Rules</div>
                <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                  เมื่อเปิดโครงการอ้างอิง SO นี้ ระบบจะสร้าง Auto Tickets:
                  <br /><strong>{autoTicketMsg[jobType] || 'สร้างตั๋วงานส่งมอบและเริ่มสัญญาบำรุงรักษา'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Status Timeline */}
          <div className="card">
            <div className="card-header"><div className="card-title">Timeline สถานะ</div></div>
            <div className="card-body" style={{ padding: '12px 18px' }}>
              <div className="timeline">
                {[
                  { title: 'สร้างใบเสนอราคา', sub: 'by Somchai M.', date: existingQ ? existingQ.date : 'วันนี้', color: 'var(--primary)', done: true },
                  { title: 'ส่งให้ลูกค้าทาง Email', sub: 'techvision@...', date: (status !== 'Draft') ? (existingQ ? existingQ.date : 'วันนี้') : '', color: (status !== 'Draft') ? 'var(--info)' : '#cbd5e1', done: status !== 'Draft' },
                  { title: 'ประเมินราคา / เจรจาจัดซื้อ', sub: chat.length > 2 ? 'มีการสนทนาอัปเดต' : 'รอพิจารณา', date: '', color: chat.length > 2 ? 'var(--warning)' : '#cbd5e1', done: chat.length > 2 },
                  { title: status === 'Approved' ? 'อนุมัติแล้ว (Approved)' : status === 'Rejected' ? 'ปฏิเสธ (Rejected)' : 'ลูกค้าอนุมัติจัดซื้อ', sub: status === 'Approved' ? 'เตรียมแปลงเป็น SO' : status === 'Rejected' ? 'ปิดดีล/ไม่รับงาน' : 'รอลงนามสัญญา', date: '', color: status === 'Approved' ? 'var(--secondary)' : status === 'Rejected' ? '#ef4444' : '#cbd5e1', done: status === 'Approved' || status === 'Rejected' }
                ].map((t, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-dot" style={{ background: t.color }}></div>
                    <div className="timeline-content">
                      <div className="timeline-title" style={{ color: t.done ? 'var(--text)' : 'var(--text-muted)' }}>{t.title}</div>
                      <div className="timeline-sub">{t.sub}</div>
                      {t.date && <div className="timeline-date">{t.date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
