import { useState, useMemo } from 'react';
import { getClaims, saveClaims, getClaimNotifications, saveClaimNotifications, getProjects, saveProjects, getNisStock, getNextClaimNumber, addClaim, addClaimNotification, getNextServiceReportNumber, addServiceReport } from '../mockDb';

const STAFF_LIST = [
  { name: 'นายกฤษฎ์ พิชิตกุล', code: 'Krit P.' },
  { name: 'นางสาวนกยูง สายทอง', code: 'Nok S.' },
  { name: 'นายสมพงษ์ ทองดี', code: 'Pom T.' },
  { name: 'นางสาวอัญชลี แก้วใส', code: 'Ann K.' },
  { name: 'นายศิลป์ วรารักษ์', code: 'Art W.' }
];

export default function ClaimsPortal() {
  const [claims, setClaims] = useState(() => getClaims());
  const [notifications, setNotifications] = useState(() => getClaimNotifications());
  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [stockList] = useState(() => getNisStock());

  // SN Checker State
  const [snQuery, setSnQuery] = useState('');
  const [checkedDevice, setCheckedDevice] = useState(null);

  // Manual Claim Form State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    ticketId: '',
    brand: '',
    model: '',
    sn: '',
    warrantyStatus: 'on',
    detail: '',
    reporterStaff: 'นายกฤษฎ์ พิชิตกุล'
  });

  // Flat list of all active tickets
  const activeTickets = useMemo(() => {
    return projectsList.flatMap(p => 
      (p.tickets || []).map(t => ({ ...t, projectName: p.name, customer: p.customer, projectId: p.id, salesPM: p.salesPM || {} }))
    ).filter(t => t.status !== 'Closed' && t.status !== 'Done');
  }, [projectsList]);

  // Handle SN Search
  const handleSnSearch = () => {
    if (!snQuery.trim()) return;
    const q = snQuery.trim().toLowerCase();

    // Look for matching item in NIS Stock or in default warranty DB
    // We can search through the default projects' tags or default stock
    const matchedStock = stockList.find(s => s.sn.toLowerCase() === q);
    
    if (matchedStock) {
      setCheckedDevice({
        name: matchedStock.name,
        brand: matchedStock.brand,
        model: matchedStock.model,
        sn: matchedStock.sn,
        warrantyStatus: matchedStock.status === 'Reserved' ? 'on' : 'on',
        status: matchedStock.status,
        customer: 'PTT Digital Solutions', // default mock link
        expiryDate: '2027-10-04'
      });
      return;
    }

    // Try dummy matching for custom S/Ns
    if (q.startsWith('fg') || q.includes('forti')) {
      setCheckedDevice({
        name: 'FortiGate 100F Next-Gen Firewall',
        brand: 'Fortinet',
        model: 'FG-100F',
        sn: snQuery.toUpperCase(),
        warrantyStatus: 'on',
        status: 'Active',
        customer: 'SCG Cement Co.',
        expiryDate: '2026-12-31'
      });
    } else {
      setCheckedDevice({
        name: 'อุปกรณ์เครือข่ายเครือข่ายทั่วไป',
        brand: 'Cisco',
        model: 'C9200-24T',
        sn: snQuery.toUpperCase(),
        warrantyStatus: 'off',
        status: 'Expired',
        customer: 'Global Finance Group',
        expiryDate: '2023-10-12'
      });
    }
  };

  // Handle Claim Submission
  const handleSubmitClaim = (e) => {
    if (e) e.preventDefault();
    
    // Create new claim
    const cId = getNextClaimNumber();
    const tk = activeTickets.find(t => t.id === claimForm.ticketId);
    
    const newClaim = {
      id: cId,
      ticketId: claimForm.ticketId || '-',
      customer: tk ? tk.customer : 'ลูกค้าทั่วไป',
      salesName: tk?.salesPM?.name || 'คุณวีระ ศรีสุข',
      reporterStaff: claimForm.reporterStaff,
      brand: claimForm.brand,
      model: claimForm.model,
      sn: claimForm.sn,
      warrantyStatus: claimForm.warrantyStatus,
      date: new Date().toISOString().slice(0, 10),
      status: 'Claim Received',
      detail: claimForm.detail
    };

    // Add to DB
    const list = getClaims();
    list.unshift(newClaim);
    saveClaims(list);
    setClaims(list);

    // Create Notification to Sales
    const notif = {
      id: Date.now(),
      salesName: tk?.salesPM?.name || 'คุณวีระ ศรีสุข',
      customer: tk ? tk.customer : 'ลูกค้าทั่วไป',
      text: `ตั๋วเคลมสินค้า ${cId} ถูกสร้างขึ้นสำหรับ ${claimForm.brand} ${claimForm.model} (${claimForm.warrantyStatus === 'on' ? 'อยู่ในประกัน' : 'หมดประกัน'})`,
      time: new Date().toLocaleString('th-TH'),
      isRead: false
    };

    const notifList = getClaimNotifications();
    notifList.unshift(notif);
    saveClaimNotifications(notifList);
    setNotifications(notifList);

    // If On Warranty, auto-create a ticket in the project
    if (claimForm.warrantyStatus === 'on' && tk) {
      const updatedProjects = projectsList.map(p => {
        if (p.id === tk.projectId) {
          const tks = p.tickets || [];
          const newTkId = `TK-0${tks.length + 90}`; // unique id
          tks.push({
            id: newTkId,
            title: `[เเคลม/สลับเครื่อง] เปลี่ยนอุปกรณ์ ${claimForm.brand} ${claimForm.model}`,
            status: 'Open',
            assignee: '-',
            due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            pct: 0,
            ticketType: 'Install'
          });
          return { ...p, tickets: tks };
        }
        return p;
      });
      saveProjects(updatedProjects);
      setProjectsList(updatedProjects);
    }

    // Reset Form
    setClaimForm({
      ticketId: '',
      brand: '',
      model: '',
      sn: '',
      warrantyStatus: 'on',
      detail: '',
      reporterStaff: 'นายกฤษฎ์ พิชิตกุล'
    });
    setShowClaimModal(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'ส่งเคลมสำเร็จ', 
        message: `สร้างตั๋วเคลม ${cId} และส่งแจ้งเตือนหา Sales เรียบร้อยแล้ว`, 
        type: 'success' 
      }
    }));
  };

  const handleCreateClaimFromSearch = () => {
    if (!checkedDevice) return;
    setClaimForm({
      ticketId: '',
      brand: checkedDevice.brand,
      model: checkedDevice.model,
      sn: checkedDevice.sn,
      warrantyStatus: checkedDevice.warrantyStatus,
      detail: `แจ้งเคลมสินค้าจากการตรวจสอบ Serial Number: ${checkedDevice.name}`,
      reporterStaff: 'นายกฤษฎ์ พิชิตกุล'
    });
    setShowClaimModal(true);
  };

  const handleUpdateClaimStatus = (claimId, newStatus) => {
    const list = getClaims();
    const updated = list.map(c => c.id === claimId ? { ...c, status: newStatus } : c);
    saveClaims(updated);
    setClaims(updated);
    
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'อัปเดตสถานะงานเคลมสำเร็จ', 
        message: `ใบเคลม ${claimId} ได้เปลี่ยนสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`, 
        type: 'success' 
      }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Warranty & Claims Portal — ศูนย์รับประกันและงานเคลม</div>
          <div className="page-subtitle">จัดการสิทธิ์คุ้มครองประกันอุปกรณ์เครือข่าย ค้นหา Serial Number ตั๋วงานซ่อมแซม และระบบแจ้งเตือนฝ่ายขาย</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowClaimModal(true)}>
            ➕ แจ้งเคลมสินค้าชำรุดด่วน
          </button>
        </div>
      </div>

      {/* Top Section: SN Checker and Sales Notification Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Left: SN Checker */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: 'var(--text)' }}>🔍 ตรวจสอบรับประกันด้วย Serial Number (Warranty Lookup)</div>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input 
              placeholder="พิมพ์หมายเลข S/N เพื่อตรวจสิทธิ์ประกัน เช่น FG60FT0001 หรือ CS9300P0001..." 
              value={snQuery}
              onChange={e => setSnQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSnSearch(); }}
              style={{ flex: 1, fontSize: 13 }}
            />
            <button className="btn btn-secondary" onClick={handleSnSearch}>ค้นหา</button>
          </div>

          {checkedDevice ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>📋 ผลลัพธ์การตรวจสอบ</span>
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  background: checkedDevice.warrantyStatus === 'on' ? '#dcfce7' : '#fee2e2',
                  color: checkedDevice.warrantyStatus === 'on' ? '#15803d' : '#ef4444',
                  padding: '3px 12px',
                  borderRadius: 20,
                  border: `1.5px solid ${checkedDevice.warrantyStatus === 'on' ? '#86efac' : '#fca5a5'}`
                }}>
                  {checkedDevice.warrantyStatus === 'on' ? '✓ อยู่ในรับประกัน (On Warranty)' : '✗ หมดระยะประกัน (Off Warranty)'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>อุปกรณ์:</span> <strong>{checkedDevice.name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>ยี่ห้อ / รุ่น:</span> <strong>{checkedDevice.brand} / {checkedDevice.model}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Serial Number:</span> <strong style={{ color: 'var(--primary)' }}>{checkedDevice.sn}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>ลูกค้าผู้ถือครอง:</span> <strong>{checkedDevice.customer}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>วันสิ้นสุดประกัน:</span> <strong style={{ color: checkedDevice.warrantyStatus === 'on' ? '#15803d' : '#ef4444' }}>{checkedDevice.expiryDate}</strong></div>
              </div>

              <button className="btn btn-primary" onClick={handleCreateClaimFromSearch} style={{ width: '100%', justifyContent: 'center' }}>
                🔧 ดำเนินการส่งใบเคลมสำหรับอุปกรณ์นี้
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: 12.5 }}>
              💡 ค้นหา Serial Number อุปกรณ์เพื่อดึงรายละเอียดสัญญาบริการและตรวจสอบสิทธิ์ได้ทันที
            </div>
          )}
        </div>

        {/* Right: Sales Claim Notice queue */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', maxHeight: 265 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>📢 คิวรับเรื่องแจ้ง Sales (Sales Claims Notify)</div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(n => (
              <div key={n.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 8, fontSize: 10.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e', fontWeight: 700, marginBottom: 2 }}>
                  <span>👔 ถึง: {n.salesName}</span>
                  <span>{n.time.split(' ')[0]}</span>
                </div>
                <div style={{ color: '#78350f', fontWeight: 600 }}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Claims History Table */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: 'var(--text)' }}>📋 ประวัติใบแจ้งเคลมทั้งหมด (Warranty Claims Logs)</div>
        
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>รหัสใบเคลม</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>ลูกค้า</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>อุปกรณ์ที่เสีย</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Serial Number</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>สิทธิ์ประกัน</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>ผู้แจ้งเคลม</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Sales ผู้ดูแล</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>สถานะ (แก้ไข)</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>วันที่ส่ง</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
                  📭 ไม่มีข้อมูลใบแจ้งเคลมในระบบ
                </td>
              </tr>
            ) : (
              claims.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary)' }}>{c.id}</td>
                  <td style={{ padding: '10px 12px' }}>{c.customer}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.brand} {c.model}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.sn}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: c.warrantyStatus === 'on' ? '#15803d' : '#ef4444',
                      background: c.warrantyStatus === 'on' ? '#f0fdf4' : '#fee2e2',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {c.warrantyStatus === 'on' ? 'In Warranty' : 'Expired'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>{c.reporterStaff || 'นางสาวนกยูง สายทอง'}</td>
                  <td style={{ padding: '10px 12px' }}>{c.salesName}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <select 
                      value={c.status} 
                      onChange={e => handleUpdateClaimStatus(c.id, e.target.value)}
                      style={{ 
                        fontSize: 11.5, 
                        fontWeight: 700, 
                        background: c.status === 'Completed' ? '#dcfce7' : (c.status === 'Rejected' ? '#fee2e2' : '#eff6ff'),
                        color: c.status === 'Completed' ? '#15803d' : (c.status === 'Rejected' ? '#ef4444' : '#1d4ed8'),
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: '1px solid var(--border)',
                        width: 'auto',
                        display: 'inline-block',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Claim Received">Claim Received</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>{c.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Claim Modal */}
      {showClaimModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleSubmitClaim} style={{ background: '#fff', padding: 24, borderRadius: 14, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)', fontFamily: 'Prompt, sans-serif' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, fontFamily: 'Kanit, sans-serif', color: 'var(--text)' }}>✍️ ฟอร์มการแจ้งเคลมและประกันสินค้า</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 16 }}>ระบุรายละเอียดอุปกรณ์และสัญญาซัพพอร์ตเพื่อสร้างงานและแจ้งพนักงานขาย</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700 }}>เลือกตั๋วงานที่พบปัญหา (Link to Ticket)</label>
                <select 
                  value={claimForm.ticketId} 
                  onChange={e => setClaimForm({ ...claimForm, ticketId: e.target.value })}
                  style={{ marginTop: 4, width: '100%', fontSize: 12.5 }}
                >
                  <option value="">-- เลือกตั๋วงาน (ระบุลูกค้าและ Sales ผู้ดูแล) --</option>
                  {activeTickets.map(t => (
                    <option key={t.id} value={t.id}>{t.id} — {t.title} ({t.customer})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700 }}>ยี่ห้ออุปกรณ์ (Brand)</label>
                  <input 
                    placeholder="เช่น Fortinet, Cisco" 
                    value={claimForm.brand} 
                    onChange={e => setClaimForm({ ...claimForm, brand: e.target.value })} 
                    style={{ marginTop: 4, width: '100%', fontSize: 12.5 }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700 }}>รุ่นอุปกรณ์ (Model)</label>
                  <input 
                    placeholder="เช่น FG-60F, C9300-24P" 
                    value={claimForm.model} 
                    onChange={e => setClaimForm({ ...claimForm, model: e.target.value })} 
                    style={{ marginTop: 4, width: '100%', fontSize: 12.5 }} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700 }}>Serial Number (S/N)</label>
                <input 
                  placeholder="พิมพ์ S/N เพื่อบันทึกประวัติเคลม" 
                  value={claimForm.sn} 
                  onChange={e => setClaimForm({ ...claimForm, sn: e.target.value })} 
                  style={{ marginTop: 4, width: '100%', fontSize: 12.5 }} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, display: 'block', marginBottom: 4 }}>สิทธิ์การรับประกันของระบบ</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12.5 }}>
                    <input type="radio" name="modal_warranty" checked={claimForm.warrantyStatus === 'on'} onChange={() => setClaimForm({ ...claimForm, warrantyStatus: 'on' })} style={{ width: 'auto' }} />
                    อยู่ในระยะประกัน (On Warranty)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12.5 }}>
                    <input type="radio" name="modal_warranty" checked={claimForm.warrantyStatus === 'off'} onChange={() => setClaimForm({ ...claimForm, warrantyStatus: 'off' })} style={{ width: 'auto' }} />
                    หมดประกันแล้ว (Off Warranty)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700 }}>เจ้าหน้าที่แจ้งเคลม (Reporter Staff)</label>
                <select 
                  value={claimForm.reporterStaff} 
                  onChange={e => setClaimForm({ ...claimForm, reporterStaff: e.target.value })}
                  style={{ marginTop: 4, width: '100%', fontSize: 12.5 }}
                >
                  {STAFF_LIST.map(s => (
                    <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700 }}>รายละเอียดอาการเสีย</label>
                <textarea 
                  placeholder="เช่น อุปกรณ์เสียเปิดไม่ติด, พัดลมไม่หมุน, อาการบอร์ดชำรุด..." 
                  value={claimForm.detail} 
                  onChange={e => setClaimForm({ ...claimForm, detail: e.target.value })} 
                  rows={2} 
                  style={{ marginTop: 4, width: '100%', fontSize: 12.5, resize: 'vertical' }} 
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowClaimModal(false)}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">ส่งใบแจ้งเคลม</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
