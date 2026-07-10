import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, saveProjects, getNisStock, saveNisStock, getPendingTickets, savePendingTickets, getPersonalChecklists, savePersonalChecklists, getCustomers } from '../mockDb';

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
  const [selectedStat, setSelectedStat] = useState(null);

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'kanban' | 'checklist' | 'request' | 'inventory'

  // Personal Checklist states
  const [personalChecklists, setPersonalChecklists] = useState(() => getPersonalChecklists());
  const [newTodoText, setNewTodoText] = useState('');

  // Ticket request states
  const [reqTitle, setReqTitle] = useState('');
  const [reqProject, setReqProject] = useState('PRJ-GENERAL');
  const [reqSite, setReqSite] = useState('NIS Office (สำนักงานใหญ่)'); // we can set default to NIS Office
  const [reqType, setReqType] = useState('Support');
  const [reqDue, setReqDue] = useState(new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]);
  const [reqDetail, setReqDetail] = useState('');
  const [reqSupportMethod, setReqSupportMethod] = useState('Onsite');
  const [reqParentTicketId, setReqParentTicketId] = useState('');
  const [reqRequireCloseApproval, setReqRequireCloseApproval] = useState(false);
  const [customersList] = useState(() => getCustomers());
  const [pendingList, setPendingList] = useState(() => getPendingTickets());

  // Personal Calendar states
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Reload pending list on activeTab changes
  useEffect(() => {
    setPendingList(getPendingTickets());
  }, [activeTab, selectedStaffName]);

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const staffTodos = personalChecklists[selectedStaffName] || [];
    const newTodo = {
      id: Date.now(),
      text: newTodoText.trim(),
      done: false
    };
    const updated = {
      ...personalChecklists,
      [selectedStaffName]: [...staffTodos, newTodo]
    };
    setPersonalChecklists(updated);
    savePersonalChecklists(updated);
    setNewTodoText('');
  };

  const handleToggleTodo = (todoId) => {
    const staffTodos = personalChecklists[selectedStaffName] || [];
    const updatedTodos = staffTodos.map(todo => 
      todo.id === todoId ? { ...todo, done: !todo.done } : todo
    );
    const updated = {
      ...personalChecklists,
      [selectedStaffName]: updatedTodos
    };
    setPersonalChecklists(updated);
    savePersonalChecklists(updated);
  };

  const handleDeleteTodo = (todoId) => {
    const staffTodos = personalChecklists[selectedStaffName] || [];
    const updatedTodos = staffTodos.filter(todo => todo.id !== todoId);
    const updated = {
      ...personalChecklists,
      [selectedStaffName]: updatedTodos
    };
    setPersonalChecklists(updated);
    savePersonalChecklists(updated);
  };

  const handleRequestTicket = (e) => {
    e.preventDefault();
    if (!reqTitle.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ครบถ้วน', message: 'กรุณาระบุชื่อตั๋วงาน', type: 'error' }
      }));
      return;
    }

    const isNoOnsite = reqSupportMethod !== 'Onsite' || reqType === 'งานภายใน' || reqType === 'Lab/เรียนรู้';
    const newRequest = {
      id: `REQ-${Date.now()}`,
      title: reqTitle.trim(),
      projectId: reqProject,
      location: reqSite,
      ticketType: reqType,
      due: reqDue,
      detail: reqDetail.trim(),
      supportMethod: reqSupportMethod,
      parentTicketId: reqParentTicketId || '',
      noOnsite: isNoOnsite,
      skipSignature: false,
      requireCloseApproval: reqRequireCloseApproval,
      requestedBy: selectedStaffName,
      status: 'Pending Approval',
      requestTime: new Date().toLocaleString('th-TH')
    };

    const updated = [newRequest, ...getPendingTickets()];
    savePendingTickets(updated);
    setPendingList(updated);

    // Reset Form
    setReqTitle('');
    setReqProject('PRJ-GENERAL');
    setReqSite('NIS Office (สำนักงานใหญ่)');
    setReqType('Support');
    setReqDue(new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]);
    setReqDetail('');
    setReqSupportMethod('Onsite');
    setReqParentTicketId('');
    setReqRequireCloseApproval(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ส่งคำขอสำเร็จ', message: 'ส่งคำขอเปิด Ticket ไปยัง Service Manager แล้ว', type: 'success' }
    }));
  };

  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    const updatedProjects = projectsList.map(p => {
      const hasTk = p.tickets.find(t => t.id === ticketId);
      if (hasTk) {
        return {
          ...p,
          tickets: p.tickets.map(t => {
            if (t.id === ticketId) {
              const acceptedVal = newStatus === 'Open' ? false : (newStatus === 'In Progress' ? true : t.accepted);
              return {
                ...t,
                status: newStatus,
                accepted: acceptedVal
              };
            }
            return t;
          })
        };
      }
      return p;
    });

    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'เปลี่ยนสถานะสำเร็จ', message: `อัปเดตสถานะตั๋ว ${ticketId} เป็น ${newStatus} แล้ว`, type: 'success' }
    }));
  };



  // Find active staff member details
  const activeStaff = STAFF_MEMBERS.find(s => s.name === selectedStaffName) || STAFF_MEMBERS[0];

  const todayStr = new Date().toISOString().split('T')[0];

  // Flat list of tickets assigned to the active staff
  const assignedTickets = projectsList.flatMap(p => 
    (p.tickets || []).map(t => {
      const isOverdue = t.status !== 'Closed' && t.status !== 'Done' && t.status !== 'Resolved' && t.due && t.due < todayStr;
      return {
        ...t,
        projectId: p.id,
        projectName: p.name,
        customer: p.customer,
        salesPM: p.salesPM,
        isOverdue: !!isOverdue
      };
    })
  ).filter(t => t.assignee === selectedStaffName);

  const pendingAcceptTickets = assignedTickets.filter(t => t.accepted === false);
  const activeTickets = assignedTickets.filter(t => t.accepted !== false);
  const overdueTickets = assignedTickets.filter(t => t.isOverdue);

  // Calculate dynamic sites for the selected project
  const getDynamicSitesForSelectedProject = () => {
    const selectedProjObj = projectsList.find(p => p.id === reqProject);
    if (!selectedProjObj) return ['หน้างานสำนักงานลูกค้าหลัก'];
    const matchedCustomer = customersList.find(c => {
      const cName = (c.name || '').toLowerCase();
      const projCust = (selectedProjObj.customer || '').toLowerCase();
      return cName.includes(projCust) || projCust.includes(cName);
    });
    if (matchedCustomer && matchedCustomer.locations && matchedCustomer.locations.length > 0) {
      return matchedCustomer.locations.map(loc => `${loc.label} (${loc.address})`);
    }
    return [selectedProjObj.location || 'หน้างานสำนักงานลูกค้าหลัก'];
  };

  const dynamicSites = getDynamicSitesForSelectedProject();

  // Calculate dynamic MA tickets in the selected project
  const getMaTicketsForSelectedProject = () => {
    const selectedProjObj = projectsList.find(p => p.id === reqProject);
    if (!selectedProjObj || !selectedProjObj.tickets) return [];
    return selectedProjObj.tickets.filter(t => 
      t.ticketType === 'MA' || 
      t.ticketType === 'MA Onsite' || 
      (t.title && t.title.toLowerCase().includes('ma')) || 
      (t.title && t.title.includes('บำรุงรักษา'))
    );
  };

  const projectMaTickets = getMaTicketsForSelectedProject();

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

  const handleAcceptTicketFromStaff = (ticketId) => {
    const currentProjects = getProjects();
    const updatedProjects = currentProjects.map(p => {
      return {
        ...p,
        tickets: p.tickets.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              accepted: true,
              status: 'In Progress'
            };
          }
          return t;
        })
      };
    });
    saveProjects(updatedProjects);
    setProjectsList(updatedProjects);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'ตอบรับงานสำเร็จ', 
        message: `คุณได้ตอบรับงาน ${ticketId} เรียบร้อยแล้ว สถานะถูกอัปเดตเป็น In Progress`, 
        type: 'success' 
      }
    }));
  };

  const handleRejectTicketFromStaff = (ticketId) => {
    const currentProjects = getProjects();
    const updatedProjects = currentProjects.map(p => {
      return {
        ...p,
        tickets: p.tickets.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              assignee: '-',
              accepted: undefined,
              status: 'Open'
            };
          }
          return t;
        })
      };
    });
    saveProjects(updatedProjects);
    setProjectsList(updatedProjects);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'ปฏิเสธงานสำเร็จ', 
        message: `ปฏิเสธงาน ${ticketId} และส่งตั๋วงานคืนระบบเรียบร้อยแล้ว`, 
        type: 'warning' 
      }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Staff Portal Simulator — ระบบพนักงานหน้างาน</div>
          <div className="page-subtitle">จำลองสิทธิ์ทีมเจ้าหน้าที่เทคนิค ในการเช็คงาน, นำเข้าคลังสินค้า และเบิกอุปกรณ์ออกหน้างานจริง</div>
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

      {/* CSS Animation for pulsing notification */}
      <style>{`
        @keyframes pulse-ping {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-badge {
          animation: pulse-ping 2s infinite;
        }
      `}</style>

      {/* Personal Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { key: 'active', label: 'ตั๋วงานในมือ', value: activeTickets.length, desc: 'ตั๋วตอบรับแล้ว', icon: '📋', color: '#6366f1', tickets: activeTickets, title: 'ตั๋วงานในมือทั้งหมด (ตั๋วตอบรับแล้ว)' },
          { key: 'pending', label: 'งานรอการตอบรับ', value: pendingAcceptTickets.length, desc: 'งานใหม่รอ Accept', icon: '⌛', color: pendingAcceptTickets.length > 0 ? '#ef4444' : '#64748b', isPending: pendingAcceptTickets.length > 0, tickets: pendingAcceptTickets, title: 'งานใหม่รอการตอบรับ (Pending Accept)' },
          { key: 'inprogress', label: 'กำลังดำเนินการ', value: activeTickets.filter(t => t.status === 'In Progress').length, desc: 'Onsite / ดำเนินงาน', icon: '🔧', color: '#f59e0b', tickets: activeTickets.filter(t => t.status === 'In Progress'), title: 'ตั๋วงานที่กำลังดำเนินการ (In Progress)' },
          { key: 'overdue', label: 'งานที่เกินกำหนด', value: overdueTickets.length, desc: 'เลยกำหนดดิวส่งมอบ', icon: '⚠️', color: overdueTickets.length > 0 ? '#ef4444' : '#10b981', isPending: overdueTickets.length > 0, tickets: overdueTickets, title: 'ตั๋วงานที่เกินกำหนดส่งมอบ (Overdue Tasks) ⚠️' },
          { key: 'closed', label: 'งานที่ปิดแล้ว MTD', value: activeTickets.filter(t => t.status === 'Resolved' || t.status === 'Done' || t.status === 'Closed').length, desc: 'สำเร็จเสร็จสิ้น', icon: '✓', color: '#10b981', tickets: activeTickets.filter(t => t.status === 'Resolved' || t.status === 'Done' || t.status === 'Closed'), title: 'งานที่ปิดสำเร็จแล้ว MTD (Resolved / Closed)' },
          { key: 'withdrawn', label: 'พัสดุอุปกรณ์ที่เบิก', value: staffWithdrawnItems.reduce((acc, curr) => acc + curr.qtyOut, 0) + ' ชิ้น', desc: 'ยอดค้างติดตัว', icon: '📦', color: '#8b5cf6', items: staffWithdrawnItems, title: 'รายการพัสดุอุปกรณ์ระบบที่เบิกติดตัว' }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className="stat-card" 
            onClick={() => setSelectedStat(stat)}
            style={{ 
              padding: '16px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 12, 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = stat.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {stat.isPending && (
              <span className="pulse-badge" style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            )}
            <div style={{ 
              width: 38, height: 38, borderRadius: 8, 
              background: stat.color + '18', color: stat.color, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 18, fontWeight: 700, flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'Kanit, sans-serif', lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Accept Notifications */}
      {pendingAcceptTickets.length > 0 && (
        <div className="card" style={{ padding: 18, marginBottom: 20, border: '2px solid #ef4444', background: '#fef2f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#b91c1c' }}>
                มีข้อความแจ้งเตือนงานมอบหมายใหม่! (New Assignment Notification)
              </div>
              <div style={{ fontSize: 12, color: '#7f1d1d' }}>
                กรุณาตรวจสอบและกดตอบรับ (Accept) เพื่อยืนยันการรับงานเข้าปฏิบัติการ
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingAcceptTickets.map(tk => (
              <div 
                key={tk.id} 
                style={{ 
                  background: '#fff', 
                  border: '1px solid #fca5a5', 
                  borderRadius: 10, 
                  padding: 14, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 15
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: '#ef4444', fontSize: 13 }}>{tk.id}</span>
                    <span style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                      รอตอบรับ (Pending Accept)
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 2 }}>{tk.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    ลูกค้า: <strong>{tk.customer}</strong> | โครงการ: {tk.projectName}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleRejectTicketFromStaff(tk.id)}
                    style={{ padding: '6px 12px', fontSize: 12, borderColor: '#fca5a5', color: '#b91c1c', background: 'none' }}
                  >
                    ปฏิเสธ
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleAcceptTicketFromStaff(tk.id)}
                    style={{ padding: '6px 18px', fontSize: 12, fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
                  >
                    ✓ กด Accept (รับงาน)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

            {/* Tab Nav */}
      <div style={{display:'flex',gap:6,marginBottom:20,background:'var(--surface)',borderRadius:10,padding:6,border:'1px solid var(--border)',width:'fit-content'}}>
        <button className={`tab-btn${activeTab==='tickets'?' active':''}`} onClick={()=>setActiveTab('tickets')}>📌 งานที่ได้รับมอบหมาย</button>
        <button className={`tab-btn${activeTab==='kanban'?' active':''}`} onClick={()=>setActiveTab('kanban')}>📋 Kanban Board ส่วนตัว</button>
        <button className={`tab-btn${activeTab==='calendar'?' active':''}`} onClick={()=>setActiveTab('calendar')}>📅 ปฏิทินงานส่วนตัว</button>
        <button className={`tab-btn${activeTab==='checklist'?' active':''}`} onClick={()=>setActiveTab('checklist')}>✅ Checklist ส่วนตัว</button>
        <button className={`tab-btn${activeTab==='request'?' active':''}`} onClick={()=>setActiveTab('request')}>📧 ขออนุมัติเปิด Ticket</button>
        <button className={`tab-btn${activeTab==='inventory'?' active':''}`} onClick={()=>setActiveTab('inventory')}>📦 คลังพัสดุ & เบิกคืน</button>
      </div>

      {activeTab === 'tickets' && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">📌 ตั๋วงานที่ได้รับมอบหมาย ({assignedTickets.length} ใบ)</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>พนักงาน: <strong>{selectedStaffName}</strong></span>
          </div>
          <div className="table-wrapper" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>หัวข้อ (Title)</th>
                  <th>ผู้มอบหมาย</th>
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
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
                    if (t.accepted === false) {
                      statusBg = '#fee2e2';
                      statusText = '#ef4444';
                    } else if (t.status === 'New') { statusBg = '#eff6ff'; statusText = '#2563eb'; }
                    else if (t.status === 'In Progress') { statusBg = '#fffbeb'; statusText = '#d97706'; }
                    else if (t.status === 'Resolved' || t.status === 'Done') { statusBg = '#f0fdf4'; statusText = '#16a34a'; }
                    else if (t.status === 'Closed') { statusBg = '#f8fafc'; statusText = '#64748b'; }

                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.id}</td>
                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                        <td>
                          {t.salesPM ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.salesPM.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.salesPM.nickname ? `(${t.salesPM.nickname})` : ''} - {t.salesPM.role}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Service Manager</span>
                          )}
                        </td>
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
                          }}>
                            {t.accepted === false ? 'รอตอบรับ (Pending)' : t.status}
                          </span>
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
      )}

      {activeTab === 'kanban' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:20}}>
          {[
            { id: 'open', title: 'งานมอบหมายใหม่ (Open)', color: '#6366f1', statusFilter: t => t.accepted === false || t.status === 'Open' },
            { id: 'inprogress', title: 'กำลังดำเนินการ (In Progress)', color: '#f59e0b', statusFilter: t => t.status === 'In Progress' && t.accepted !== false },
            { id: 'review', title: 'รอตรวจสอบ (Pending)', color: '#3b82f6', statusFilter: t => t.status === 'Pending' },
            { id: 'closed', title: 'เสร็จสิ้น (Closed/Done)', color: '#10b981', statusFilter: t => t.status === 'Closed' || t.status === 'Done' || t.status === 'Resolved' }
          ].map(col => {
            const colTickets = assignedTickets.filter(col.statusFilter);
            return (
              <div key={col.id} style={{background:'var(--surface)', borderRadius:12, border:'1px solid var(--border)', padding:12, display:'flex', flexDirection:'column', minHeight:450}}>
                <div style={{fontWeight:800, fontSize:13.5, color:col.color, borderBottom:`2.5px solid ${col.color}`, paddingBottom:8, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>{col.title}</span>
                  <span style={{background:col.color+'15', color:col.color, borderRadius:10, padding:'2px 8px', fontSize:11.5}}>{colTickets.length}</span>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:10, overflowY:'auto', flex:1}}>
                  {colTickets.length === 0 ? (
                    <div style={{textAlign:'center', padding:'30px 10px', color:'var(--text-muted)', fontSize:12, fontStyle:'italic'}}>ไม่มีงานค้าง</div>
                  ) : (
                    colTickets.map(tk => (
                      <div key={tk.id} style={{background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:12, boxShadow:'var(--shadow-sm)', position:'relative'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                          <span style={{fontWeight:800, fontSize:11.5, color:'var(--primary)'}}>{tk.id}</span>
                          <span style={{fontSize:9.5, background:'var(--primary-bg)', color:'var(--primary)', padding:'1px 5px', borderRadius:4, fontWeight:600}}>{tk.ticketType}</span>
                        </div>
                        <div style={{fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:6}}>{tk.title}</div>
                        <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:4}}>👤 {tk.customer}</div>
                        <div style={{fontSize:10, color:'var(--text-light)', marginBottom:8}}>🗓️ ดิว: {tk.due}</div>
                        
                        <div style={{display:'flex', gap:6, marginTop:10, borderTop:'1px solid var(--border)', paddingTop:8, justifyContent:'space-between'}}>
                          <Link to={`/tickets/${tk.id}`} className="btn btn-secondary btn-sm" style={{padding:'2px 8px', fontSize:10.5}}>เปิดงาน ↗</Link>
                          {col.id === 'open' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateTicketStatus(tk.id, 'In Progress')} style={{padding:'2.5px 8px', fontSize:10.5, background:'#10b981', borderColor:'#10b981'}}>Accept & Start</button>
                          )}
                          {col.id === 'inprogress' && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateTicketStatus(tk.id, 'Pending')} style={{padding:'2.5px 8px', fontSize:10.5, background:'#3b82f6', borderColor:'#3b82f6'}}>ส่งตรวจสอบ</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              📅 ปฏิทินปฏิบัติงานส่วนตัว (My Work Schedule)
              <span style={{ fontSize: 12, background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                {selectedStaffName}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth} style={{ minWidth: 32, padding: '4px 8px' }}>◀</button>
              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 130, textAlign: 'center', color: 'var(--text)' }}>
                {[
                  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                ][currentMonth]} {currentYear}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleNextMonth} style={{ minWidth: 32, padding: '4px 8px' }}>▶</button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* Days of week header */}
            {['อา. (Sun)', 'จ. (Mon)', 'อ. (Tue)', 'พ. (Wed)', 'พฤ. (Thu)', 'ศ. (Fri)', 'ส. (Sat)'].map((day, idx) => (
              <div 
                key={day} 
                style={{ 
                  background: 'var(--border-light)', 
                  padding: '8px 4px', 
                  textAlign: 'center', 
                  fontSize: 11.5, 
                  fontWeight: 700,
                  color: idx === 0 ? '#ef4444' : (idx === 6 ? '#2563eb' : 'var(--text-muted)') 
                }}
              >
                {day}
              </div>
            ))}
            
            {/* Days cells */}
            {(() => {
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const firstDay = new Date(currentYear, currentMonth, 1).getDay();
              const cells = [];
              
              // Empty cells before first day
              for (let i = 0; i < firstDay; i++) {
                cells.push(<div key={`empty-${i}`} style={{ background: '#f8fafc', minHeight: 90 }} />);
              }
              
              // Days of month
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                // Filter personal tickets due on this date
                const dayTickets = assignedTickets.filter(t => t.due === dateStr);
                const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d;
                
                cells.push(
                  <div 
                    key={`day-${d}`} 
                    style={{ 
                      background: '#fff', 
                      padding: 6, 
                      minHeight: 95, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      border: isToday ? '2px solid var(--primary)' : 'none',
                      position: 'relative'
                    }}
                  >
                    <span 
                      style={{ 
                        alignSelf: 'flex-end', 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                        background: isToday ? 'var(--primary-bg)' : 'none',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4
                      }}
                    >
                      {d}
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflowY: 'auto', maxHeight: 68 }}>
                      {dayTickets.map(tk => (
                        <Link 
                          key={tk.id} 
                          to={`/tickets/${tk.id}`}
                          title={`${tk.id}: ${tk.title} (${tk.customer})`}
                          style={{ 
                            fontSize: 9, 
                            padding: '3px 5px', 
                            borderRadius: 4, 
                            background: tk.status === 'Closed' || tk.status === 'Done' ? 'var(--secondary-bg)' : (tk.priority === 'High' ? 'var(--danger-bg)' : 'var(--info-bg)'),
                            color: tk.status === 'Closed' || tk.status === 'Done' ? 'var(--secondary)' : (tk.priority === 'High' ? 'var(--danger)' : 'var(--info)'),
                            border: `1px solid ${tk.status === 'Closed' || tk.status === 'Done' ? '#86efac' : (tk.priority === 'High' ? '#fca5a5' : '#bfdbfe')}`,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            textDecoration: 'none',
                            transition: 'transform 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <span>
                            {tk.accepted === false ? '⌛' : (tk.status === 'Closed' || tk.status === 'Done' ? '✓' : '🔧')}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tk.id} {tk.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="card" style={{maxWidth:600, margin:'0 auto 20px auto', padding:20}}>
          <div style={{fontWeight:800, fontSize:16, color:'var(--text)', borderBottom:'1px solid var(--border)', paddingBottom:10, marginBottom:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>✅ Checklist บันทึกช่วยจำส่วนตัว (Personal Checklist)</span>
            <span style={{fontSize:12, color:'var(--text-muted)'}}>ผู้ใช้: {selectedStaffName}</span>
          </div>
          
          <div style={{display:'flex', gap:8, marginBottom:16}}>
            <input type="text" value={newTodoText} onChange={e=>setNewTodoText(e.target.value)} placeholder="พิมพ์บันทึกงานส่วนตัวช่วยจำ..." onKeyDown={e=>{if(e.key==='Enter') handleAddTodo();}} style={{flex:1}} />
            <button className="btn btn-primary" onClick={handleAddTodo}>+ เพิ่ม</button>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {(personalChecklists[selectedStaffName] || []).length === 0 ? (
              <div style={{textAlign:'center', padding:'30px 10px', color:'var(--text-muted)', fontSize:13, fontStyle:'italic', border:'1px dashed var(--border)', borderRadius:8}}>
                ไม่มีงานบันทึกช่วยจำ สามารถพิมพ์เพิ่มด้านบน
              </div>
            ) : (
              (personalChecklists[selectedStaffName] || []).map(todo => (
                <div key={todo.id} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)'}}>
                  <input type="checkbox" checked={todo.done} onChange={() => handleToggleTodo(todo.id)} style={{width:'auto', accentColor:'var(--secondary)', flexShrink:0}} />
                  <span style={{flex:1, fontSize:13.5, textDecoration:todo.done?'line-through':'', color:todo.done?'var(--text-muted)':'var(--text)'}}>{todo.text}</span>
                  <button onClick={() => handleDeleteTodo(todo.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4}}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'request' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20}}>
          {/* Left Column: Request Form */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:800, fontSize:15, marginBottom:15, color:'var(--text)', borderBottom:'1px solid var(--border)', paddingBottom:8}}>📧 ขออนุมัติเปิด Ticket ใหม่ (Ticket Request Form)</div>
            <form onSubmit={handleRequestTicket}>
              <div style={{marginBottom:12}}>
                <label>หัวข้อ / ชื่องานที่ต้องการปฏิบัติ</label>
                <input type="text" required value={reqTitle} onChange={e=>setReqTitle(e.target.value)} placeholder="เช่น Onsite PM เพิ่มเติมหลังระบบแจ้งเตือน..." style={{marginTop:6}} />
              </div>
              
              <div style={{marginBottom:12}}>
                <label>สังกัดโครงการ (Project Reference)</label>
                <select 
                  value={reqProject} 
                  onChange={e => {
                    const nextProj = e.target.value;
                    setReqProject(nextProj);
                    const selectedProjObj = projectsList.find(p => p.id === nextProj);
                    let sites = ['หน้างานสำนักงานลูกค้าหลัก'];
                    if (selectedProjObj) {
                      const matchedCustomer = customersList.find(c => 
                        c.name.toLowerCase().includes(selectedProjObj.customer.toLowerCase()) || 
                        selectedProjObj.customer.toLowerCase().includes(c.name.toLowerCase())
                      );
                      if (matchedCustomer && matchedCustomer.locations && matchedCustomer.locations.length > 0) {
                        sites = matchedCustomer.locations.map(loc => `${loc.label} (${loc.address})`);
                      } else {
                        sites = [selectedProjObj.location || 'หน้างานสำนักงานลูกค้าหลัก'];
                      }
                    }
                    setReqSite(sites[0]);
                    setReqParentTicketId('');
                  }} 
                  style={{marginTop:6}}
                >
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{marginBottom:12}}>
                <label>Site ลูกค้า (Customer Site)</label>
                <select value={reqSite} onChange={e=>setReqSite(e.target.value)} style={{marginTop:6}}>
                  {dynamicSites.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {(reqType === 'MA' || reqType === 'Support') && projectMaTickets.length > 0 && (
                <div style={{marginBottom:12}}>
                  <label style={{color:'var(--primary)',fontWeight:600}}>อ้างอิงตั๋วงาน MA ประจำเดือน (Optional Linkage)</label>
                  <select 
                    value={reqParentTicketId} 
                    onChange={e=>setReqParentTicketId(e.target.value)} 
                    style={{marginTop:6,borderColor:'var(--primary)'}}
                  >
                    <option value="">-- ไม่เชื่อมโยง (สร้างเป็นตั๋วใหม่แยกต่างหาก) --</option>
                    {projectMaTickets.map(tk => (
                      <option key={tk.id} value={tk.id}>{tk.id}: {tk.title} (Due: {tk.due})</option>
                    ))}
                  </select>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
                    * เลือกตัวเลือกนี้หากงานที่ปฏิบัติเพิ่มเติม เป็นงานย่อยหรือความคืบหน้าภายใต้เดือนนั้น
                  </div>
                </div>
              )}

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
                <div>
                  <label>ประเภทตั๋วงาน (Ticket Type)</label>
                  <select value={reqType} onChange={e=>setReqType(e.target.value)} style={{marginTop:6}}>
                    <option value="Install">Install (ติดตั้ง)</option>
                    <option value="MA">MA (บำรุงรักษา)</option>
                    <option value="PM">PM (ตรวจสอบระบบ)</option>
                    <option value="Support">Support (แก้ปัญหา)</option>
                    <option value="Backup">Backup (สำรองข้อมูล)</option>
                    <option value="Report">Report (รายงานประจำงวด)</option>
                    <option value="งานภายใน">งานภายใน (Internal)</option>
                    <option value="Lab/เรียนรู้">Lab/เรียนรู้ (Lab/Learning)</option>
                  </select>
                </div>
                <div>
                  <label>กำหนดเสร็จ (Due Date)</label>
                  <input type="date" required value={reqDue} onChange={e=>setReqDue(e.target.value)} style={{marginTop:6}} />
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <label>รายละเอียด / ข้อความชี้แจงผู้จัดการ (SM)</label>
                <textarea rows={3} value={reqDetail} onChange={e=>setReqDetail(e.target.value)} placeholder="ชี้แจงเหตุผลหรือกรอกขั้นตอนงานที่จำเป็น..." style={{marginTop:6, width:'100%', padding:8, borderRadius:6, border:'1px solid var(--border)', boxSizing:'border-box', fontFamily:'inherit'}} />
              </div>

              <div style={{marginBottom:16}}>
                <label>วิธีการ Support (Support Method)</label>
                <select 
                  value={reqSupportMethod} 
                  onChange={e=>setReqSupportMethod(e.target.value)} 
                  style={{marginTop:6}}
                >
                  <option value="Onsite">Onsite (เข้าปฏิบัติงานหน้างาน)</option>
                  <option value="Remote">Remote (รีโมท)</option>
                  <option value="Telephone">Telephone (โทรศัพท์)</option>
                </select>
                <div style={{fontSize:11.5, color:'var(--text-muted)', marginTop:4}}>
                  * หากเลือก Remote หรือ Telephone จะได้รับการยกเว้นการเช็คอินหน้างาน (noOnsite = true)
                </div>
              </div>

              <div style={{marginBottom:18, display:'flex', alignItems:'center', gap:8}}>
                <input 
                  type="checkbox" 
                  id="reqRequireCloseApproval"
                  checked={reqRequireCloseApproval} 
                  onChange={e=>setReqRequireCloseApproval(e.target.checked)} 
                  style={{width:'auto', cursor:'pointer'}} 
                />
                <label htmlFor="reqRequireCloseApproval" style={{cursor:'pointer', margin:0, fontSize:13, fontWeight:500, color:'var(--text)'}}>
                  🔒 ขอส่งตรวจสอบและขออนุมัติปิดตั๋วโดย Service Manager ก่อนปิดงาน
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}}>✓ ส่งขอเปิด Ticket</button>
            </form>
          </div>

          {/* Right Column: Status Table */}
          <div className="card">
            <div className="card-header" style={{padding:'16px 20px', borderBottom:'1px solid var(--border)'}}>
              <div className="card-title">📋 สถานะคำขอเปิด Ticket ของฉัน ({pendingList.filter(r=>r.requestedBy===selectedStaffName).length} คำขอ)</div>
            </div>
            <div className="table-wrapper" style={{maxHeight:450, overflowY:'auto'}}>
              <table>
                <thead>
                  <tr>
                    <th>หัวเรื่องคำขอ (Request Title)</th>
                    <th>ประเภท</th>
                    <th style={{textAlign:'center'}}>สถานะการอนุมัติ</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.filter(r => r.requestedBy === selectedStaffName).length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{textAlign:'center', padding:'30px 10px', color:'var(--text-muted)', fontStyle:'italic'}}>
                        ยังไม่มีการส่งคำขออนุมัติในขณะนี้
                      </td>
                    </tr>
                  ) : (
                    pendingList.filter(r => r.requestedBy === selectedStaffName).map(req => (
                      <tr key={req.id}>
                        <td>
                          <div style={{fontWeight:600}}>{req.title}</div>
                          <div style={{fontSize:10.5, color:'var(--text-muted)'}}>{req.requestTime}</div>
                        </td>
                        <td>
                          <span className="badge badge-ma">{req.ticketType}</span>
                        </td>
                        <td style={{textAlign:'center'}}>
                          <span style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700
                          }}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Left Column: List and Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Warehouse Inventory Stock */}
            <div className="card">
              <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="card-title">📦 คลังพัสดุและอะไหล่อุปกรณ์ระบบ (NIS Warehouse Stock)</div>
              </div>
              <div className="table-wrapper" style={{ maxHeight: 500, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Stock ID</th>
                      <th>รายการสินค้า (Item Name)</th>
                      <th>แบรนด์</th>
                      <th>รุ่น</th>
                      <th>Serial Number</th>
                      <th style={{ textAlign: 'center' }}>จำนวนคงคลัง</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockList.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.brand}</td>
                        <td><span style={{ fontFamily: 'monospace' }}>{s.model}</span></td>
                        <td><span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.sn}</span></td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{s.qty}</td>
                        <td>
                          <span style={{
                            background: s.status === 'Available' ? '#f0fdf4' : '#fee2e2',
                            color: s.status === 'Available' ? '#16a34a' : '#ef4444',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700
                          }}>{s.status === 'Available' ? 'พร้อมเบิก' : s.status}</span>
                        </td>
                      </tr>
                    ))}
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

              <div style={{ marginBottom: 15 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>📦 อุปกรณ์ที่เจ้าหน้าที่เทคนิคนำออกไปขณะนี้ (Items Withdrawn)</div>
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
      )}

      {/* Floating Simulated Push Notification on Staff Portal */}
      {pendingAcceptTickets.map(tk => (
        <div 
          key={`pop-${tk.id}`}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            background: 'var(--surface)',
            border: '2px solid #ef4444',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 99999,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: '#fee2e2', 
              color: '#ef4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 18 
            }}>
              🚨
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                มีคำขอปฏิบัติการใหม่! (New Task Notification)
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                ส่งตรงถึงคุณ: <strong>{selectedStaffName}</strong>
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: 'var(--bg)', 
            border: '1px solid var(--border)', 
            borderRadius: 10, 
            padding: 12, 
            marginBottom: 16 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 11.5, color: '#ef4444' }}>{tk.id}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>ความสำคัญ: {tk.priority}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
              {tk.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              ลูกค้า: {tk.customer}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleRejectTicketFromStaff(tk.id)}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              ปฏิเสธ
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => handleAcceptTicketFromStaff(tk.id)}
              style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
            >
              ✓ กด Accept (รับงาน)
            </button>
          </div>
                  </div>
        ))}

        {/* Detail Modal for Dashboard Stats */}
        {selectedStat && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setSelectedStat(null)}
          >
            <div 
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                padding: 24,
                width: '90%',
                maxWidth: 750,
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{selectedStat.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                      {selectedStat.title}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      รายการข้อมูลสำหรับพนักงาน: <strong>{selectedStaffName}</strong>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStat(null)}
                  style={{
                    background: 'var(--border)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: 'var(--text)',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 0.8}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                >
                  ✕
                </button>
              </div>

              {/* Content Container */}
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                {selectedStat.key === 'withdrawn' ? (
                  /* Inventory Withdrawn Table */
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--border)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text)' }}>ชื่ออุปกรณ์ (Item)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text)' }}>แบรนด์/รุ่น</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text)' }}>จำนวน</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text)' }}>เบิกสำหรับ Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStat.items.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                            ไม่มีรายการอุปกรณ์ที่ค้างอยู่ติดตัว
                          </td>
                        </tr>
                      ) : (
                        selectedStat.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                              📦 {item.name}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text)' }}>
                              {item.brand} / {item.model}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                              {item.qtyOut}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 12 }}>
                              <Link 
                                to={`/tickets/${item.ticketId}`} 
                                onClick={() => setSelectedStat(null)}
                                style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
                              >
                                {item.ticketId}: {item.ticketTitle}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* Tickets List Table */
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--border)' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text)' }}>Ticket ID</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text)' }}>รายละเอียดงาน (Title)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text)' }}>ลูกค้า / โครงการ</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text)' }}>กำหนดดิว (Due Date)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text)' }}>สถานะ</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text)' }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStat.tickets.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                            ไม่มีรายการตั๋วงานในหมวดหมู่นี้
                          </td>
                        </tr>
                      ) : (
                        selectedStat.tickets.map((tk) => {
                          return (
                            <tr key={tk.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                                {tk.id}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                                {tk.title}
                                {tk.isOverdue && (
                                  <span style={{ marginLeft: 6, fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                                    เกินกำหนด ⚠️
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text)' }}>
                                <div style={{ fontWeight: 700 }}>{tk.customer}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tk.projectName}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: tk.isOverdue ? '#dc2626' : 'var(--text)' }}>
                                {tk.due || '-'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{
                                  background: tk.accepted === false ? '#fee2e2' : (tk.status === 'In Progress' ? '#fffbeb' : '#f0fdf4'),
                                  color: tk.accepted === false ? '#ef4444' : (tk.status === 'In Progress' ? '#d97706' : '#16a34a'),
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700
                                }}>
                                  {tk.accepted === false ? 'รอตอบรับ' : tk.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <Link 
                                  to={`/tickets/${tk.id}`} 
                                  onClick={() => setSelectedStat(null)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 10px', fontSize: 11.5 }}
                                >
                                  เปิดงาน ↗
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedStat(null)}
                  style={{ padding: '6px 16px' }}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
