import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, saveProjects, getNisStock, saveNisStock } from '../mockDb';

const STAFF_MEMBERS = [
  { name: 'Krit P.', role: 'Senior Network & Security Engineer', avatar: 'KP', email: 'krit.p@nis.co.th', phone: '081-222-3344', skills: ['Firewall', 'Network', 'Server'] },
  { name: 'Nok S.', role: 'Network & System Engineer', avatar: 'NS', email: 'nok.s@nis.co.th', phone: '085-555-6677', skills: ['Network', 'WiFi', 'CCTV'] },
  { name: 'Pom T.', role: 'System & Virtualization Engineer', avatar: 'PT', email: 'pom.t@nis.co.th', phone: '089-888-9900', skills: ['Server', 'Windows AD', 'VMware'] },
  { name: 'Ann K.', role: 'Software & Application Support Specialist', avatar: 'AK', email: 'ann.k@nis.co.th', phone: '084-444-5566', skills: ['Software', 'Monitoring'] },
  { name: 'Art W.', role: 'Desktop & Technical Support Engineer', avatar: 'AW', email: 'art.w@nis.co.th', phone: '087-777-8899', skills: ['PC&Notebook', 'Support'] }
];

const avatarColors = {
  'KP': '#6366f1',
  'NS': '#10b981',
  'PT': '#f59e0b',
  'AK': '#3b82f6',
  'AW': '#8b5cf6'
};

export default function StaffPortal() {
  const [selectedStaffName, setSelectedStaffName] = useState('Krit P.');
  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [stockList, setStockList] = useState(() => getNisStock());

  // Add stock form state
  const [addForm, setAddForm] = useState({
    name: '',
    brand: '',
    model: '',
    sn: '',
    qty: 1
  });

  const [returnHistory, setReturnHistory] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});

  // Reload data from DB
  const refreshData = () => {
    setProjectsList(getProjects());
    setStockList(getNisStock());
  };

  // Find active staff member details
  const activeStaff = STAFF_MEMBERS.find(s => s.name === selectedStaffName) || STAFF_MEMBERS[0];

  // Flat list of tickets assigned to the active staff
  const assignedTickets = projectsList.flatMap(p => 
    (p.tickets || []).map(t => ({
      ...t,
      projectId: p.id,
      projectName: p.name,
      customer: p.customer
    }))
  ).filter(t => t.assignee === selectedStaffName);

  // Items currently withdrawn by this staff across their active tickets
  const staffWithdrawnItems = [];
  assignedTickets.forEach(t => {
    (t.checkedOutItems || []).forEach(item => {
      staffWithdrawnItems.push({
        ...item,
        ticketId: t.id,
        ticketTitle: t.title
      });
    });
  });

  // Handle Add Stock
  const handleAddStock = (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.brand || !addForm.model) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ครบถ้วน', message: 'กรุณากรอกชื่อสินค้า แบรนด์ และรุ่นให้ครบถ้วน', type: 'error' }
      }));
      return;
    }

    const nextIdNum = stockList.length + 1;
    const nextId = `STK-${String(nextIdNum).padStart(3, '0')}`;
    
    const newStockItem = {
      id: nextId,
      name: addForm.name,
      brand: addForm.brand,
      model: addForm.model,
      sn: addForm.sn || '-',
      qty: parseInt(addForm.qty) || 1,
      status: 'Available'
    };

    const updatedStockList = [...stockList, newStockItem];
    saveNisStock(updatedStockList);
    setStockList(updatedStockList);

    // Reset Form
    setAddForm({
      name: '',
      brand: '',
      model: '',
      sn: '',
      qty: 1
    });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'นำเข้าสินค้าสำเร็จ', message: `เพิ่ม ${newStockItem.name} จำนวน ${newStockItem.qty} ชิ้น เข้าสต็อกแล้ว`, type: 'success' }
    }));
  };

  // Handle Return Stock (การนำของกลับเข้าคลัง)
  const handleReturnStock = (item, returnQty) => {
    const qtyToReturn = parseInt(returnQty) || 0;
    if (qtyToReturn <= 0) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ถูกต้อง', message: 'กรุณาระบุจำนวนที่จะนำคืนที่มากกว่า 0', type: 'error' }
      }));
      return;
    }

    if (qtyToReturn > item.qtyOut) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'จำนวนไม่ถูกต้อง', message: 'ไม่สามารถคืนของมากกว่าจำนวนที่เบิกออกไปได้', type: 'error' }
      }));
      return;
    }

    // 1. Increment Warehouse Stock
    const currentStock = getNisStock();
    const updatedStock = currentStock.map(s => {
      if (s.id === item.id) {
        const newQty = s.qty + qtyToReturn;
        return {
          ...s,
          qty: newQty,
          status: 'Available'
        };
      }
      return s;
    });
    saveNisStock(updatedStock);
    setStockList(updatedStock);

    // 2. Decrement from Ticket's checkedOutItems
    const currentProjects = getProjects();
    const updatedProjects = currentProjects.map(p => {
      const hasTk = (p.tickets || []).find(t => t.id === item.ticketId);
      if (hasTk) {
        return {
          ...p,
          tickets: p.tickets.map(t => {
            if (t.id === item.ticketId) {
              const updatedCheckedOut = (t.checkedOutItems || [])
                .map(ci => {
                  if (ci.id === item.id) {
                    return {
                      ...ci,
                      qtyOut: ci.qtyOut - qtyToReturn
                    };
                  }
                  return ci;
                })
                .filter(ci => ci.qtyOut > 0);

              return {
                ...t,
                checkedOutItems: updatedCheckedOut,
                stockDeducted: updatedCheckedOut.length > 0
              };
            }
            return t;
          })
        };
      }
      return p;
    });
    saveProjects(updatedProjects);
    setProjectsList(updatedProjects);

    // 3. Append to return log
    const returnEntry = {
      id: Date.now(),
      itemName: item.name,
      brand: item.brand,
      model: item.model,
      qty: qtyToReturn,
      ticketId: item.ticketId,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    setReturnHistory(prev => [returnEntry, ...prev]);

    // Reset return input
    setReturnQuantities(prev => ({
      ...prev,
      [`${item.id}-${item.ticketId}`]: ''
    }));

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'คืนของสำเร็จ', 
        message: `คืนของ ${item.name} จำนวน ${qtyToReturn} ชิ้น จากตั๋ว ${item.ticketId} เข้าคลังแล้ว`, 
        type: 'success' 
      }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Staff Portal Simulator — ระบบพนักงานหน้างาน</div>
          <div className="page-subtitle">จำลองสิทธิ์ทีมวิศวกรระบบ ในการเช็คงาน, นำเข้าคลังสินค้า และเบิกอุปกรณ์ออกหน้างานจริง</div>
        </div>
      </div>

      {/* Staff Keycard Selector */}
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, var(--sidebar-bg), #2e1065)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: avatarColors[activeStaff.avatar] || '#6366f1',
              color: '#fff', fontWeight: 800, fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(255,255,255,0.1)'
            }}>{activeStaff.avatar}</div>
            <div>
              <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Active Staff Identity</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{activeStaff.name}</div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>{activeStaff.role}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activeStaff.skills.map(sk => (
                <span key={sk} style={{
                  background: 'rgba(255,255,255,0.1)', color: '#e2e8f0',
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600
                }}>{sk}</span>
              ))}
            </div>
            
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 15 }}>
              <label style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>สลับพนักงาน (Simulate Switch)</label>
              <select 
                value={selectedStaffName} 
                onChange={e => setSelectedStaffName(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  color: '#fff', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  width: 160
                }}
              >
                {STAFF_MEMBERS.map(s => (
                  <option key={s.name} value={s.name} style={{ color: '#000' }}>
                    {s.name} ({s.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left Column: List and Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Assigned Tickets */}
          <div className="card">
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">📌 ตั๋วงานที่ได้รับมอบหมาย ({assignedTickets.length} ใบ)</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>พนักงาน: <strong>{selectedStaffName}</strong></span>
            </div>
            <div className="table-wrapper" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>หัวข้อ (Title)</th>
                    <th>ลูกค้า / โครงการ</th>
                    <th style={{ textAlign: 'center' }}>ความสำคัญ</th>
                    <th>สถานะ</th>
                    <th>เบิกของ/นำอุปกรณ์ไป</th>
                    <th style={{ textAlign: 'center' }}>ดูรายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                        ไม่มีตั๋วงานที่ถูกรับผิดชอบในชื่อ {selectedStaffName}
                      </td>
                    </tr>
                  ) : (
                    assignedTickets.map(t => {
                      let priorityColor = '#64748b';
                      if (t.priority === 'Critical') priorityColor = '#ef4444';
                      else if (t.priority === 'High') priorityColor = '#f97316';
                      else if (t.priority === 'Medium') priorityColor = '#3b82f6';
                      
                      let statusBg = '#f1f5f9';
                      let statusText = '#475569';
                      if (t.status === 'New') { statusBg = '#eff6ff'; statusText = '#2563eb'; }
                      else if (t.status === 'In Progress') { statusBg = '#fffbeb'; statusText = '#d97706'; }
                      else if (t.status === 'Resolved' || t.status === 'Done') { statusBg = '#f0fdf4'; statusText = '#16a34a'; }
                      else if (t.status === 'Closed') { statusBg = '#f8fafc'; statusText = '#64748b'; }

                      return (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.id}</td>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.customer}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.projectName}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              background: priorityColor + '15',
                              color: priorityColor,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10.5,
                              fontWeight: 700
                            }}>{t.priority || 'Normal'}</span>
                          </td>
                          <td>
                            <span style={{
                              background: statusBg,
                              color: statusText,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700
                            }}>{t.status}</span>
                          </td>
                          <td style={{ fontSize: 11.5 }}>
                            {t.checkedOutItems && t.checkedOutItems.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                {t.checkedOutItems.map(item => (
                                  <span key={item.id} style={{ background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }} title={`${item.name} S/N: ${item.sn}`}>
                                    {item.model} x{item.qtyOut}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>ยังไม่มีการเบิก</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link to={`/tickets/${t.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11.5 }}>
                              เปิดงาน ↗
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warehouse Inventory Stock */}
          <div className="card">
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">📦 คลังพัสดุและอะไหล่อุปกรณ์ระบบ (NIS Warehouse Stock)</div>
            </div>
            <div className="table-wrapper" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Stock ID</th>
                    <th>รายการสินค้า (Item Name)</th>
                    <th>แบรนด์</th>
                    <th>รุ่น (Model)</th>
                    <th>Serial Number</th>
                    <th style={{ textAlign: 'center' }}>คงเหลือ (Qty)</th>
                    <th>สถานะสต็อก</th>
                  </tr>
                </thead>
                <tbody>
                  {stockList.map(s => {
                    const isOutOfStock = s.qty <= 0;
                    return (
                      <tr key={s.id} style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                        <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{s.id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.brand}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                            {s.model}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{s.sn}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: isOutOfStock ? 'var(--danger)' : 'var(--text)' }}>
                          {s.qty} ชิ้น
                        </td>
                        <td>
                          <span style={{
                            background: isOutOfStock ? 'var(--danger-bg)' : 'var(--secondary-bg)',
                            color: isOutOfStock ? 'var(--danger)' : 'var(--secondary)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700
                          }}>{isOutOfStock ? 'Out of Stock' : s.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Actions (Intake & Withdrawal Forms) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action 1: Return Spares Form */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 15, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              ↩️ การนำของกลับเข้าคลัง (Return Spares to Warehouse)
            </div>

            {/* แสดงข้อมูลการนำออก */}
            <div style={{ marginBottom: 15 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>📦 อุปกรณ์ที่วิศวกรนำออกไปขณะนี้ (Items Withdrawn)</div>
              {staffWithdrawnItems.length === 0 ? (
                <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-muted)', padding: '10px 0', border: '1px dashed var(--border)', borderRadius: 6, textAlign: 'center' }}>
                  ไม่มีสินค้าค้างอยู่ในความดูแล
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {staffWithdrawnItems.map(item => {
                    const key = `${item.id}-${item.ticketId}`;
                    const inputQty = returnQuantities[key] || '';
                    return (
                      <div key={key} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 12.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 4 }}>
                          <span style={{ color: 'var(--primary)' }}>{item.ticketId}</span>
                          <span style={{ color: 'var(--text-muted)' }}>เบิกออก: {item.qtyOut} ชิ้น</span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{item.brand} {item.model}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>S/N: {item.sn}</div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                          <input 
                            type="number"
                            placeholder="ระบุจำนวนคืน..."
                            min="1"
                            max={item.qtyOut}
                            value={inputQty}
                            onChange={e => setReturnQuantities(prev => ({
                              ...prev,
                              [key]: Math.max(1, Math.min(item.qtyOut, parseInt(e.target.value) || ''))
                            }))}
                            style={{ flex: 1, padding: '4px 8px', fontSize: 11.5, border: '1px solid var(--border)', borderRadius: 4 }}
                          />
                          <button 
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 10px', fontSize: 11.5, background: 'var(--secondary)', color: '#fff', border: 'none', borderRadius: 4, height: 28 }}
                            onClick={() => handleReturnStock(item, inputQty)}
                            disabled={!inputQty}
                          >
                            ↩️ คืนคลัง
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* สรุปจำนวนการนำเอาของคืน */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>📋 สรุปการนำของคืนเซสชั่นนี้ (Returns Summary)</div>
              {returnHistory.length === 0 ? (
                <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center' }}>
                  ยังไม่มีการคืนสินค้าเข้าคลังในรอบนี้
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {returnHistory.map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 8px', color: '#15803d' }}>
                      <div>
                        <strong>{log.itemName}</strong> ({log.qty} ชิ้น)
                        <div style={{ fontSize: 10, color: '#16a34a' }}>จากตั๋ว: {log.ticketId}</div>
                      </div>
                      <span style={{ fontSize: 10, alignSelf: 'center' }}>{log.time} น.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action 2: Stock Intake Form */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 15, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              📥 นำของเข้าคลังสต็อก (Stock Intake)
            </div>

            <form onSubmit={handleAddStock}>
              <div style={{ marginBottom: 10 }}>
                <label>ชื่ออุปกรณ์ (Item Description)</label>
                <input 
                  type="text" 
                  placeholder="เช่น FortiGate 60F"
                  value={addForm.name} 
                  onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{ marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label>แบรนด์ (Brand)</label>
                  <input 
                    type="text" 
                    placeholder="เช่น Fortinet"
                    value={addForm.brand} 
                    onChange={e => setAddForm(prev => ({ ...prev, brand: e.target.value }))}
                    required
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div>
                  <label>รุ่น (Model)</label>
                  <input 
                    type="text" 
                    placeholder="เช่น FG-60F"
                    value={addForm.model} 
                    onChange={e => setAddForm(prev => ({ ...prev, model: e.target.value }))}
                    required
                    style={{ marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label>Serial Number (S/N)</label>
                  <input 
                    type="text" 
                    placeholder="ใส่ S/N (เว้นว่างได้)"
                    value={addForm.sn} 
                    onChange={e => setAddForm(prev => ({ ...prev, sn: e.target.value }))}
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div>
                  <label>จำนวน (Qty)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={addForm.qty} 
                    onChange={e => setAddForm(prev => ({ ...prev, qty: Math.max(1, parseInt(e.target.value) || 1) }))}
                    required
                    style={{ marginTop: 4 }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                📥 บันทึกรับของเข้าคลัง
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
