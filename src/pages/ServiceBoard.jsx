import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, saveProjects, getPendingTickets, savePendingTickets, getChecklistByType, PROJECT_SITES, getCustomers, saveCustomers, MOCK_TAX_REGISTRY, addServiceReport, getNextServiceReportNumber, getNextClaimNumber, addClaim, addClaimNotification, getDynamicStaff, saveDynamicStaff } from '../mockDb';

const columns = [
  { id:'open', label:'Open / Assigned', color:'#6366f1' },
  { id:'inprogress', label:'In Progress', color:'#f59e0b' },
  { id:'review', label:'Review / Waiting', color:'#3b82f6' },
  { id:'done', label:'Done / Closed', color:'#10b981' },
];

const avatarColors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6'];
const fallbackStaff = ['Krit P.','Nok S.','Pom T.','Ann K.','Art W.'];
const getStaffColor = (name) => {
  const idx = fallbackStaff.indexOf(name);
  if (idx !== -1) return avatarColors[idx % avatarColors.length];
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length] || '#6366f1';
};

const skillData = [
  {name:'Krit P.', skills:['Firewall','Network','Server'], tickets:8, done:5},
  {name:'Nok S.', skills:['Network','WiFi','CCTV'], tickets:6, done:3},
  {name:'Pom T.', skills:['Server','Windows AD','VMware'], tickets:5, done:4},
  {name:'Ann K.', skills:['Software','Monitoring'], tickets:4, done:2},
  {name:'Art W.', skills:['PC&Notebook','Support'], tickets:7, done:6},
];

const pColors = {High:'#ef4444',Medium:'#f59e0b',Low:'#10b981'};
const tagBg = { Firewall:'#fee2e2', Network:'#dbeafe', WiFi:'#fef9c3', Server:'#f0fdf4', Support:'#ede9fe', Report:'#f1f5f9', Implement:'#eff6ff', 'MA-Network':'#fdf4ff', 'MA-Fortigate':'#fef3c7' };
const tagColor = { Firewall:'#991b1b', Network:'#1d4ed8', WiFi:'#713f12', Server:'#065f46', Support:'#5b21b6', Report:'#475569', Implement:'#1e40af', 'MA-Network':'#6b21a8', 'MA-Fortigate':'#92400e' };

function Tag({ label }) {
  return <span style={{background: tagBg[label]||'#f1f5f9', color: tagColor[label]||'#475569', padding:'2px 7px', borderRadius:4, fontSize:10.5, fontWeight:600}}>{label}</span>;
}

function TicketCard({ tk }) {
  const navigate = useNavigate();
  return (
    <div 
      className="ticket-card" 
      onClick={() => navigate(`/tickets/${tk.id}`)} 
      style={{cursor:'grab'}}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', tk.id);
      }}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div className="ticket-id">{tk.id}</div>
        <div style={{width:8,height:8,borderRadius:'50%',background:pColors[tk.priority]||'#6366f1',flexShrink:0,marginTop:4}}></div>
      </div>
      <div className="ticket-title">{tk.title}</div>
      <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
        {(tk.tags || []).map(t => <Tag key={t} label={t} />)}
        <Tag label={tk.type || 'Support'} />
      </div>
      <div className="ticket-meta">
        <div className="ticket-assignee">
          <div className="mini-avatar" style={{background:getStaffColor(tk.assignee)}}>
            {tk.assignee === '-' ? '?' : tk.assignee.charAt(0)}
          </div>
          <span style={{fontSize:11.5,color:'var(--text-muted)'}}>{tk.assignee}</span>
        </div>
        <span className="ticket-due" style={{color: tk.due==='วันนี้'?'#ef4444':'var(--text-muted)'}}>{tk.due}</span>
      </div>
      {tk.pct > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{width:`${tk.pct}%`, background: tk.pct===100?'#10b981':'#6366f1'}} />
        </div>
      )}
      {tk.pct > 0 && <div style={{fontSize:10.5,color:'var(--text-muted)',marginTop:3,textAlign:'right'}}>{tk.pct}%</div>}
    </div>
  );
}

function AssignCard({ tk, onAssign, onUnassign, staffList }) {
  const navigate = useNavigate();
  return (
    <div 
      className="assign-card"
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', tk.id);
      }}
      style={{ 
        cursor: 'grab',
        background: tk.isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'var(--surface)', 
        border: `1.5px ${tk.isOverdue ? 'dashed' : 'solid'} ${tk.isOverdue ? '#ef4444' : 'var(--border)'}`, 
        borderRadius: 10, 
        padding: 12, 
        boxShadow: tk.isOverdue ? '0 0 8px rgba(239, 68, 68, 0.1)' : 'var(--shadow-sm)',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span 
          onClick={() => navigate(`/tickets/${tk.id}`)}
          style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'monospace' }}
        >
          {tk.id}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {tk.isOverdue && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 700 }}>
              ⚠️ เลยกำหนด
            </span>
          )}
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: pColors[tk.priority] || '#6366f1' }}></span>
        </div>
      </div>
      
      <div 
        onClick={() => navigate(`/tickets/${tk.id}`)}
        style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', cursor: 'pointer', lineHeight: 1.4 }}
      >
        {tk.title}
      </div>
      
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Tag label={tk.type || 'Support'} />
        {(tk.tags || []).map(tag => <Tag key={tag} label={tag} />)}
      </div>

      {tk.customer && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span>🏢</span>
          <span style={{ fontWeight: 600 }}>{tk.customer}</span>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
        <span style={{ color: tk.isOverdue ? '#ef4444' : 'var(--text-muted)', fontWeight: tk.isOverdue ? 600 : 400 }}>📅 {tk.due}</span>
        
        {tk.assignee === '-' ? (
          <select 
            value="-" 
            onChange={(e) => {
              if (e.target.value !== '-') {
                onAssign(tk.id, e.target.value);
              }
            }}
            style={{ fontSize: 10.5, padding: '2px 4px', width: 'auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)' }}
          >
            <option value="-">👉 มอบหมาย...</option>
            {staffList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div 
                className="mini-avatar" 
                style={{ 
                  background: getStaffColor(tk.assignee),
                  width: 18,
                  height: 18,
                  fontSize: 9
                }}
              >
                {tk.assignee.charAt(0)}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{tk.assignee}</span>
              {tk.accepted === false ? (
                <span style={{ color: '#dc2626', background: '#fee2e2', padding: '1px 4px', borderRadius: 4, fontWeight: 700, fontSize: 8.5 }}>
                  รอรับงาน
                </span>
              ) : (
                <span style={{ color: '#16a34a', background: '#dcfce7', padding: '1px 4px', borderRadius: 4, fontWeight: 700, fontSize: 8.5 }}>
                  รับงาน
                </span>
              )}
            </div>
            
            <button 
              onClick={() => onUnassign(tk.id, '-')}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: 11, fontWeight: 700 }}
              title="ถอดคืนงาน"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceBoard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('board');
  const [filterStaff, setFilterStaff] = useState('');
  const [projectsList, setProjectsList] = useState(() => getProjects());

  // Pending ticket requests
  const [pendingRequests, setPendingRequests] = useState(() => getPendingTickets());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);

  // Customer Directory states
  const [customersList, setCustomersList] = useState(() => getCustomers());
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSubTab, setCustomerSubTab] = useState('list'); // 'list' or 'matrix'
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [staffList, setStaffList] = useState(() => getDynamicStaff());
  const staff = staffList;
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffName, setEditingStaffName] = useState(null);
  const [staffNameInput, setStaffNameInput] = useState('');
  const [activeMapPickerIdx, setActiveMapPickerIdx] = useState(null);
  const [viewingMapCoords, setViewingMapCoords] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    id: '',
    name: '',
    taxId: '',
    contacts: [{ name: '', phone: '', email: '', role: '' }],
    locations: [{ label: '', address: '', assignedStaff: [] }]
  });

  const getPinPos = (coordsStr) => {
    if (!coordsStr) return { x: '50%', y: '50%' };
    const parts = coordsStr.split(',');
    if (parts.length !== 2) return { x: '50%', y: '50%' };
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    
    let xPct = ((lng - 100.40) / 0.20) * 100;
    let yPct = ((13.82 - lat) / 0.14) * 100;
    
    xPct = Math.max(5, Math.min(95, xPct));
    yPct = Math.max(5, Math.min(95, yPct));
    
    return { x: `${xPct}%`, y: `${yPct}%` };
  };

  const handleMapClick = (e, locIdx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const w = rect.width || 500;
    const h = rect.height || 220;
    
    const lng = (100.40 + (x / w) * 0.20).toFixed(4);
    const lat = (13.82 - (y / h) * 0.14).toFixed(4);
    
    handleLocationFieldChange(locIdx, 'coordinates', `${lat}, ${lng}`);
  };

  // Create ticket modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    projectId: 'PRJ-GENERAL',
    assignee: '-',
    ticketType: 'Install',
    skipSignature: false,
    noOnsite: false,
    requireCloseApproval: false,
    due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    setPendingRequests(getPendingTickets());
  }, [activeTab]);

  const handleCreateTicketManual = (e) => {
    e.preventDefault();
    if (!newTicketForm.title.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ครบ', message: 'กรุณาระบุหัวข้อของ Ticket', type: 'error' }
      }));
      return;
    }

    const checklistItems = getChecklistByType(newTicketForm.ticketType);
    const newTk = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTicketForm.title.trim(),
      status: 'Open',
      assignee: newTicketForm.assignee,
      accepted: newTicketForm.assignee !== '-' ? false : undefined,
      due: newTicketForm.due,
      pct: 0,
      ticketType: newTicketForm.ticketType,
      skipSignature: !!newTicketForm.skipSignature,
      noOnsite: !!newTicketForm.noOnsite,
      requireCloseApproval: !!newTicketForm.requireCloseApproval,
      rejectionReason: '',
      checklist: checklistItems.map(item => ({ label: item, done: false })),
      note: newTicketForm.note.trim()
    };

    const targetProjId = newTicketForm.projectId || 'PRJ-GENERAL';
    const updatedProjects = projectsList.map(p => {
      if (p.id === targetProjId) {
        return {
          ...p,
          tickets: [newTk, ...p.tickets]
        };
      }
      return p;
    });

    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);
    setShowCreateModal(false);

    // Reset Form
    setNewTicketForm({
      title: '',
      projectId: 'PRJ-GENERAL',
      assignee: '-',
      ticketType: 'Install',
      skipSignature: false,
      noOnsite: false,
      requireCloseApproval: false,
      due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
      note: ''
    });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'สร้าง Ticket สำเร็จ', message: `สร้างตั๋วงาน ${newTk.id} เรียบร้อยแล้ว`, type: 'success' }
    }));
  };

  const handleApproveRequest = (req) => {
    const checklistItems = getChecklistByType(req.ticketType);
    const newTk = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: req.title,
      status: 'Open',
      assignee: req.requestedBy,
      accepted: false,
      due: req.due,
      pct: 0,
      ticketType: req.ticketType,
      supportMethod: req.supportMethod || 'Onsite',
      location: req.location || '',
      parentTicketId: req.parentTicketId || '',
      skipSignature: !!req.skipSignature,
      noOnsite: !!req.noOnsite,
      requireCloseApproval: !!req.requireCloseApproval,
      rejectionReason: '',
      checklist: checklistItems.map(item => ({ label: item, done: false })),
      note: req.detail || ''
    };

    const updatedProjects = projectsList.map(p => {
      if (p.id === req.projectId) {
        return {
          ...p,
          tickets: [newTk, ...p.tickets]
        };
      }
      return p;
    });

    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);

    // Remove from pending
    const updatedReqs = pendingRequests.filter(r => r.id !== req.id);
    setPendingRequests(updatedReqs);
    savePendingTickets(updatedReqs);

    setSelectedRequest(null);
    setShowRequestDetailModal(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'อนุมัติสำเร็จ', message: `อนุมัติสร้างตั๋วงาน ${newTk.id} และมอบหมายให้ ${req.requestedBy} เรียบร้อยแล้ว`, type: 'success' }
    }));
  };

  const handleRejectRequest = (reqId) => {
    const updatedReqs = pendingRequests.filter(r => r.id !== reqId);
    setPendingRequests(updatedReqs);
    savePendingTickets(updatedReqs);

    setSelectedRequest(null);
    setShowRequestDetailModal(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ปฏิเสธคำขอ', message: 'ปฏิเสธคำขอเปิด Ticket แล้ว', type: 'warning' }
    }));
  };

  const handleApproveCloseTicket = (tk) => {
    const finalSr = tk.srNumber || getNextServiceReportNumber();
    
    // 1. Add Service Report to Database
    addServiceReport({
      id: finalSr,
      ticketId: tk.id,
      projectId: tk.project,
      customer: tk.customer,
      engineer: tk.assignee || '-',
      date: new Date().toISOString().slice(0, 10),
      type: tk.ticketType || 'Support',
      summary: tk.workDetail || 'ตรวจรับงาน Onsite',
      status: 'Closed',
      emailSentTo: tk.emailSentTo || 'customer@client.com'
    });

    // 2. Create claims if damaged device was checked
    const isDamaged = tk.damagedProduct?.checked || false;
    if (isDamaged) {
      const claimId = getNextClaimNumber();
      addClaim({
        id: claimId,
        ticketId: tk.id,
        customer: tk.customer,
        salesName: 'คุณวีระ ศรีสุข',
        reporterStaff: tk.assignee || '-',
        brand: tk.damagedProduct?.info?.brand || '',
        model: tk.damagedProduct?.info?.model || '',
        sn: tk.damagedProduct?.info?.sn || '',
        warrantyStatus: tk.damagedProduct?.warranty || 'on',
        date: new Date().toISOString().slice(0, 10),
        status: 'Claim Received',
        detail: `แจ้งความชำรุดจากการปิดตั๋วงาน ${tk.id}`
      });

      addClaimNotification({
        id: Date.now(),
        salesName: 'คุณวีระ ศรีสุข',
        customer: tk.customer,
        text: `ตั๋วเคลมสินค้า ${claimId} ถูกสร้างอัตโนมัติจากตั๋วงาน ${tk.id}`,
        time: new Date().toLocaleString('th-TH'),
        isRead: false
      });
    }

    // 3. Update status in Projects List and add chat message
    const updatedProjects = projectsList.map(p => {
      if (p.id === tk.project) {
        const systemTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const currentChat = p.projectChat || [];
        const newMsg = {
          from: 'SM (Somchai)',
          msg: `[อนุมัติปิดตั๋ว] ตั๋วงาน ${tk.id} ได้รับการอนุมัติปิดตั๋วโดยผู้จัดการ และรายงานบริการเลขที่ ${finalSr} ถูกออกเรียบร้อยแล้ว`,
          time: systemTime
        };
        
        return {
          ...p,
          projectChat: [...currentChat, newMsg],
          tickets: p.tickets.map(t => {
            if (t.id === tk.id) {
              return {
                ...t,
                status: 'Closed',
                pct: 100,
                emailSent: true,
                srNumber: finalSr
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
      detail: { title: 'อนุมัติปิดตั๋วสำเร็จ', message: `อนุมัติปิดตั๋ว ${tk.id} เรียบร้อยแล้ว (SR: ${finalSr})`, type: 'success' }
    }));
  };

  const handleRejectCloseTicketPrompt = (tk) => {
    setRejectionTicketId(tk.id);
    setRejectionText('');
    setShowCloseRejectModal(true);
  };

  const handleConfirmRejectCloseTicket = () => {
    if (!rejectionText.trim() || !rejectionTicketId) return;

    const targetTicket = ticketsList.find(t => t.id === rejectionTicketId);
    if (!targetTicket) return;

    const updatedProjects = projectsList.map(p => {
      if (p.id === targetTicket.project) {
        const systemTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const currentChat = p.projectChat || [];
        const newMsg = {
          from: 'SM (Somchai)',
          msg: `[ตีกลับคำขอปิดตั๋ว] ตั๋วงาน ${targetTicket.id} ถูกส่งกลับให้แก้ไขเนื่องจาก: ${rejectionText.trim()}`,
          time: systemTime
        };

        return {
          ...p,
          projectChat: [...currentChat, newMsg],
          tickets: p.tickets.map(t => {
            if (t.id === rejectionTicketId) {
              return {
                ...t,
                status: 'In Progress',
                rejectionReason: rejectionText.trim()
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
      detail: { title: 'ตีกลับคำขอปิดตั๋ว', message: `ตีกลับตั๋ว ${rejectionTicketId} ให้ช่างแก้ไขเรียบร้อยแล้ว`, type: 'warning' }
    }));

    setShowCloseRejectModal(false);
    setRejectionTicketId('');
    setRejectionText('');
  };

  const handleTaxIdLookup = () => {
    const cleanTaxId = customerForm.taxId.trim();
    if (!cleanTaxId) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกเลขประจำตัวผู้เสียภาษี', type: 'error' }
      }));
      return;
    }
    
    // Query mock registry
    const found = MOCK_TAX_REGISTRY[cleanTaxId];
    if (found) {
      setCustomerForm({
        ...customerForm,
        name: found.name,
        contacts: found.contacts.length > 0 ? found.contacts : customerForm.contacts,
        locations: found.locations.length > 0 ? found.locations : customerForm.locations
      });
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ค้นหาสำเร็จ', message: 'ดึงข้อมูลของบริษัทผู้เสียภาษีเรียบร้อยแล้ว', type: 'success' }
      }));
    } else {
      // Generate mock company name for random taxId
      const randomCompany = `บริษัท ทดสอบทั่วไป จำกัด (Tax ID: ${cleanTaxId})`;
      setCustomerForm({
        ...customerForm,
        name: randomCompany,
        locations: [
          { label: 'สำนักงานใหญ่', address: '99/99 ถนนสุขุมวิท, แขวงคลองเตย, เขตคลองเตย, กรุงเทพฯ 10110' }
        ]
      });
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ไม่พบบริษัททางการ', message: 'สร้างข้อมูลบริษัทจำลองให้เรียบร้อยแล้ว', type: 'warning' }
      }));
    }
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.taxId.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกชื่อลูกค้าและเลขผู้เสียภาษี', type: 'error' }
      }));
      return;
    }

    let updatedList;
    if (customerForm.id) {
      // Edit Mode
      updatedList = customersList.map(c => c.id === customerForm.id ? { ...customerForm } : c);
    } else {
      // Create Mode
      const newCustomer = {
        ...customerForm,
        id: `CUST-${Date.now()}`
      };
      updatedList = [...customersList, newCustomer];
    }

    setCustomersList(updatedList);
    saveCustomers(updatedList);
    setShowCustomerModal(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'บันทึกสำเร็จ', message: 'บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว', type: 'success' }
    }));
  };

  const handleAddContactField = () => {
    setCustomerForm({
      ...customerForm,
      contacts: [...customerForm.contacts, { name: '', phone: '', email: '', role: '' }]
    });
  };

  const handleRemoveContactField = (index) => {
    const updated = customerForm.contacts.filter((_, idx) => idx !== index);
    setCustomerForm({
      ...customerForm,
      contacts: updated.length > 0 ? updated : [{ name: '', phone: '', email: '', role: '' }]
    });
  };

  const handleContactFieldChange = (index, field, value) => {
    const updated = customerForm.contacts.map((c, idx) => {
      if (idx === index) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setCustomerForm({ ...customerForm, contacts: updated });
  };

  const handleAddLocationField = () => {
    setCustomerForm({
      ...customerForm,
      locations: [...customerForm.locations, { label: '', address: '', assignedStaff: [] }]
    });
  };

  const handleRemoveLocationField = (index) => {
    const updated = customerForm.locations.filter((_, idx) => idx !== index);
    setCustomerForm({
      ...customerForm,
      locations: updated.length > 0 ? updated : [{ label: '', address: '', assignedStaff: [] }]
    });
  };

  const handleLocationFieldChange = (index, field, value) => {
    const updated = customerForm.locations.map((loc, idx) => {
      if (idx === index) {
        return { ...loc, [field]: value };
      }
      return loc;
    });
    setCustomerForm({ ...customerForm, locations: updated });
  };

  const handleSaveStaff = (nameInput) => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    if (editingStaffName) {
      if (staffList.includes(name) && name !== editingStaffName) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { title: 'ชื่อซ้ำ', message: 'มีชื่อเจ้าหน้าที่นี้ในระบบอยู่แล้ว', type: 'error' }
        }));
        return;
      }
      
      const updatedStaff = staffList.map(s => s === editingStaffName ? name : s);
      setStaffList(updatedStaff);
      saveDynamicStaff(updatedStaff);

      const updatedCustomers = customersList.map(c => {
        const updatedLocs = c.locations.map(loc => {
          if (loc.assignedStaff && loc.assignedStaff.includes(editingStaffName)) {
            return {
              ...loc,
              assignedStaff: loc.assignedStaff.map(s => s === editingStaffName ? name : s)
            };
          }
          return loc;
        });
        return { ...c, locations: updatedLocs };
      });
      setCustomersList(updatedCustomers);
      saveCustomers(updatedCustomers);

      const updatedProjects = projectsList.map(p => {
        const updatedStaffName = p.staff === editingStaffName ? name : p.staff;
        const updatedTks = (p.tickets || []).map(tk => {
          if (tk.assignee === editingStaffName) {
            return { ...tk, assignee: name };
          }
          return tk;
        });
        return { ...p, staff: updatedStaffName, tickets: updatedTks };
      });
      setProjectsList(updatedProjects);
      saveProjects(updatedProjects);

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'แก้ไขสำเร็จ', message: `เปลี่ยนชื่อเจ้าหน้าที่เป็น ${name} เรียบร้อยแล้ว`, type: 'success' }
      }));
    } else {
      if (staffList.includes(name)) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { title: 'ชื่อซ้ำ', message: 'มีชื่อเจ้าหน้าที่นี้ในระบบอยู่แล้ว', type: 'error' }
        }));
        return;
      }
      const updatedStaff = [...staffList, name];
      setStaffList(updatedStaff);
      saveDynamicStaff(updatedStaff);

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'เพิ่มสำเร็จ', message: `เพิ่มเจ้าหน้าที่ ${name} เรียบร้อยแล้ว`, type: 'success' }
      }));
    }
    setShowStaffModal(false);
    setEditingStaffName(null);
    setStaffNameInput('');
  };

  const handleDeleteStaff = (name) => {
    if (!confirm(`คุณต้องการลบรายชื่อเจ้าหน้าที่ "${name}" หรือไม่?\n(รายชื่อจะถูกนำออกจากทุกสถานที่ตั้งและ Ticket งาน)`)) return;

    const updatedStaff = staffList.filter(s => s !== name);
    setStaffList(updatedStaff);
    saveDynamicStaff(updatedStaff);

    const updatedCustomers = customersList.map(c => {
      const updatedLocs = c.locations.map(loc => {
        if (loc.assignedStaff && loc.assignedStaff.includes(name)) {
          return {
            ...loc,
            assignedStaff: loc.assignedStaff.filter(s => s !== name)
          };
        }
        return loc;
      });
      return { ...c, locations: updatedLocs };
    });
    setCustomersList(updatedCustomers);
    saveCustomers(updatedCustomers);

    const updatedProjects = projectsList.map(p => {
      const updatedStaffName = p.staff === name ? '-' : p.staff;
      const updatedTks = (p.tickets || []).map(tk => {
        if (tk.assignee === name) {
          return { ...tk, assignee: '-' };
        }
        return tk;
      });
      return { ...p, staff: updatedStaffName, tickets: updatedTks };
    });
    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ลบสำเร็จ', message: `ลบรายชื่อเจ้าหน้าที่ ${name} เรียบร้อยแล้ว`, type: 'success' }
    }));
  };

  const [assignViewMode, setAssignViewMode] = useState('all'); // 'all', 'company', or 'staff'
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assignRequireCloseApproval, setAssignRequireCloseApproval] = useState(false);
  const [showOnlyAssignedCalendar, setShowOnlyAssignedCalendar] = useState(false);
  const [showCloseRejectModal, setShowCloseRejectModal] = useState(false);
  const [rejectionTicketId, setRejectionTicketId] = useState('');
  const [rejectionText, setRejectionText] = useState('');

  // Calendar states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11

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

  const adjustDueDate = (originalDue) => {
    if (!originalDue) return '';
    if (originalDue === 'วันนี้') {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    const match = originalDue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const today = new Date();
      const year = today.getFullYear();
      const monthIndex = today.getMonth(); // 0-11
      const month = String(monthIndex + 1).padStart(2, '0');
      
      const maxDays = new Date(year, monthIndex + 1, 0).getDate();
      let dayVal = parseInt(match[3], 10);
      if (dayVal > maxDays) {
        dayVal = maxDays;
      }
      const day = String(dayVal).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return originalDue;
  };

  const todayVal = new Date();
  const todayStr = `${todayVal.getFullYear()}-${String(todayVal.getMonth() + 1).padStart(2, '0')}-${String(todayVal.getDate()).padStart(2, '0')}`;

  // Flat-map tickets from active projects in mockDb
  const ticketsList = projectsList.flatMap(p => 
    p.tickets.map(t => {
      let colId = 'open';
      if (t.status === 'In Progress') colId = 'inprogress';
      if (t.status === 'Pending' || t.status === 'Waiting Close Approval') colId = 'review';
      if (t.status === 'Closed' || t.status === 'Done') colId = 'done';

      const formattedDue = adjustDueDate(t.due);
      const isOverdue = formattedDue && formattedDue < todayStr && t.status !== 'Closed' && t.status !== 'Done';

      return {
        ...t,
        due: formattedDue,
        col: colId,
        project: p.id,
        projectName: p.name,
        type: p.type,
        priority: p.priority,
        tags: p.tags,
        customer: p.customer || 'ทั่วไป',
        isOverdue: !!isOverdue
      };
    })
  );

  const filtered = ticketsList.filter(t => !filterStaff || t.assignee === filterStaff);

  const handleAddTicket = (colId) => {
    if (projectsList.length === 0) return;

    let statusVal = 'Open';
    if (colId === 'inprogress') statusVal = 'In Progress';
    if (colId === 'review') statusVal = 'Pending';
    if (colId === 'done') statusVal = 'Closed';

    const newTk = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'New Service Request (Service Board)',
      status: statusVal,
      assignee: '-',
      due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
      pct: 0
    };

    const targetProject = projectsList[0];
    const updatedProjects = projectsList.map(p => {
      if (p.id === targetProject.id) {
        return {
          ...p,
          tickets: [newTk, ...p.tickets]
        };
      }
      return p;
    });

    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'สร้าง Ticket', message: `สร้าง Ticket ${newTk.id} ในโครงการ ${targetProject.name} สำเร็จ`, type: 'success' }
    }));
  };

  const handleAssignConfirm = () => {
    if (!selectedTicket || !selectedStaff) return;

    const updatedProjects = projectsList.map(p => {
      return {
        ...p,
        tickets: p.tickets.map(t => {
          if (t.id === selectedTicket) {
            return {
              ...t,
              assignee: selectedStaff,
              accepted: false,
              requireCloseApproval: assignRequireCloseApproval,
              rejectionReason: ''
            };
          }
          return t;
        })
      };
    });

    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'มอบหมายงานสำเร็จ', 
        message: `มอบหมาย Ticket ${selectedTicket} ให้ ${selectedStaff} เรียบร้อยแล้ว (รอพนักงานตอบรับ)${assignRequireCloseApproval ? ' [ต้องอนุมัติก่อนปิด]' : ''}`, 
        type: 'success' 
      }
    }));
    
    setShowAssignModal(false);
    setSelectedTicket('');
    setSelectedStaff('');
    setAssignRequireCloseApproval(false);
  };

  const handleAssignStaffDirect = (ticketId, staffName) => {
    if (!ticketId) return;

    if (staffName === '-') {
      const updatedProjects = projectsList.map(p => {
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
      setProjectsList(updatedProjects);
      saveProjects(updatedProjects);

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ยกเลิกการมอบหมาย', message: `ยกเลิกการมอบหมายตั๋ว ${ticketId} สำเร็จ`, type: 'success' }
      }));
    } else {
      setSelectedTicket(ticketId);
      setSelectedStaff(staffName);
      setAssignRequireCloseApproval(false);
      setShowAssignModal(true);
    }
  };

  const handleUpdateTicketStatus = (ticketId, newColId) => {
    if (!ticketId) return;
    let statusVal = 'Open';
    if (newColId === 'inprogress') statusVal = 'In Progress';
    if (newColId === 'review') statusVal = 'Pending';
    if (newColId === 'done') statusVal = 'Closed';

    const updatedProjects = projectsList.map(p => {
      return {
        ...p,
        tickets: p.tickets.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              status: statusVal
            };
          }
          return t;
        })
      };
    });
    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'อัปเดตสถานะสำเร็จ', message: `เปลี่ยนสถานะตั๋ว ${ticketId} เป็น ${statusVal}`, type: 'success' }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Service Board</div>
          <div className="page-subtitle">กระดานจ่ายงานและติดตาม Ticket ของทีม Service Manager</div>
        </div>
        <div className="page-actions">
          <div className="tabs" style={{padding:4}}>
            <button className={`tab-btn${activeTab==='board'?' active':''}`} onClick={() => setActiveTab('board')}>
              Kanban Board
            </button>
            <button className={`tab-btn${activeTab==='assign'?' active':''}`} onClick={() => setActiveTab('assign')}>
              Manager Assign
            </button>
            <button className={`tab-btn${activeTab==='calendar'?' active':''}`} onClick={() => setActiveTab('calendar')}>
              Calendar View
            </button>
            <button className={`tab-btn${activeTab==='skill'?' active':''}`} onClick={() => setActiveTab('skill')}>
              Skill Dashboard
            </button>
            <button className={`tab-btn${activeTab==='approve'?' active':''}`} onClick={() => setActiveTab('approve')}>
              📥 คำขอจาก Staff {((pendingRequests?.length || 0) + (ticketsList.filter(t => t.status === 'Waiting Close Approval').length || 0)) > 0 && <span style={{background:'#ef4444',color:'#fff',fontSize:10,padding:'1px 5px',borderRadius:10,marginLeft:4}}>{(pendingRequests?.length || 0) + (ticketsList.filter(t => t.status === 'Waiting Close Approval').length || 0)}</span>}
            </button>
            <button className={`tab-btn${activeTab==='customers'?' active':''}`} onClick={() => setActiveTab('customers')}>
              👥 ลูกค้า
            </button>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              สร้าง Ticket
            </button>
            <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="12 5 19 12 12 19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Assign งาน
            </button>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:440,boxShadow:'var(--shadow-lg)'}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:14,color:'var(--text)'}}>Assign งานให้ Staff (ด่วน)</div>
            <div style={{marginBottom:14}}>
              <label>เลือก Ticket</label>
              <select value={selectedTicket} onChange={e=>setSelectedTicket(e.target.value)} style={{marginTop:6}}>
                <option value="">-- เลือก Ticket --</option>
                {ticketsList.filter(t=>t.col!=='done').map(t => (
                  <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label>เลือก Staff ผู้รับผิดชอบ</label>
              <select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)} style={{marginTop:6}}>
                <option value="">-- เลือก Staff --</option>
                {staff.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:18, display:'flex', alignItems:'center', gap:8}}>
              <input 
                type="checkbox" 
                id="assignRequireCloseApproval"
                checked={assignRequireCloseApproval} 
                onChange={e => setAssignRequireCloseApproval(e.target.checked)} 
                style={{width:'auto'}}
              />
              <label htmlFor="assignRequireCloseApproval" style={{cursor:'pointer', margin:0, fontSize:13, fontWeight:500, color:'var(--text)'}}>
                🔒 ต้องส่งตรวจสอบอนุมัติโดย Service Manager ก่อนปิด Ticket
              </label>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setShowAssignModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAssignConfirm} disabled={!selectedTicket||!selectedStaff}>✓ มอบหมายงาน</button>
            </div>
          </div>
        </div>
      )}

      {showRequestDetailModal && selectedRequest && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:520,boxShadow:'var(--shadow-lg)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:18,color:'var(--text)',borderBottom:'1px solid var(--border)',paddingBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>🔍 รายละเอียดการขออนุมัติ Ticket</span>
              <span style={{fontSize:12,fontWeight:'normal',color:'var(--text-muted)'}}>{selectedRequest.id}</span>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
              <div>
                <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>ผู้ขออนุมัติ / วันเวลาที่ส่ง</span>
                <strong style={{fontSize:14,color:'var(--text)'}}>👤 {selectedRequest.requestedBy}</strong>
                <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:8}}>({selectedRequest.requestTime})</span>
              </div>
              
              <div>
                <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>ชื่องาน (Title)</span>
                <strong style={{fontSize:15,color:'var(--text)'}}>{selectedRequest.title}</strong>
              </div>
              
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>ประเภทงาน (Type)</span>
                  <span className="badge badge-ma">{selectedRequest.ticketType}</span>
                </div>
                <div>
                  <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>กำหนดส่ง (Due Date)</span>
                  <strong style={{fontSize:13.5}}>{selectedRequest.due}</strong>
                </div>
              </div>
              
              <div>
                <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>โครงการ (Project)</span>
                <span style={{fontSize:13.5,fontWeight:600}}>
                  {projectsList.find(p => p.id === selectedRequest.projectId)?.name || selectedRequest.projectId}
                </span>
              </div>
              
              <div>
                <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>Site ลูกค้าที่ระบุ (Customer Site)</span>
                <strong style={{fontSize:14,color:'var(--text)'}}>📍 {selectedRequest.location || 'ไม่ได้ระบุ'}</strong>
              </div>
              
              {selectedRequest.parentTicketId && (
                <div>
                  <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>อ้างอิงตั๋วงาน MA ประจำเดือน</span>
                  <span style={{
                    display:'inline-block',
                    background:'#eff6ff',
                    color:'#1e40af',
                    padding:'4px 8px',
                    borderRadius:4,
                    fontSize:12.5,
                    fontWeight:600,
                    marginTop:4,
                    border:'1px solid #bfdbfe'
                  }}>
                    🔗 {selectedRequest.parentTicketId}
                  </span>
                </div>
              )}
              
              <div>
                <span style={{fontSize:12,color:'var(--text-muted)',display:'block'}}>รายละเอียด / คำชี้แจงจาก Staff</span>
                <div style={{
                  background:'var(--bg)',
                  padding:12,
                  borderRadius:8,
                  fontSize:13,
                  color:'var(--text-light)',
                  border:'1px solid var(--border)',
                  whiteSpace:'pre-wrap',
                  marginTop:4
                }}>
                  {selectedRequest.detail || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}
                </div>
              </div>
            </div>

            <div style={{borderTop:'1px solid var(--border)',paddingTop:16,marginBottom:20}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--primary)',marginBottom:12}}>🛠️ การกำหนดค่าการทำงาน (Service Manager Config)</div>
              
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12.5,fontWeight:600}}>วิธีการ Support (Support Method)</label>
                <select 
                  value={selectedRequest.supportMethod || 'Onsite'} 
                  onChange={e => {
                    const nextVal = e.target.value;
                    const nextNoOnsite = nextVal !== 'Onsite' || selectedRequest.ticketType === 'งานภายใน' || selectedRequest.ticketType === 'Lab/เรียนรู้';
                    setSelectedRequest({
                      ...selectedRequest,
                      supportMethod: nextVal,
                      noOnsite: nextNoOnsite
                    });
                  }}
                  style={{marginTop:6}}
                >
                  <option value="Onsite">Onsite (เข้าปฏิบัติงานหน้างาน)</option>
                  <option value="Remote">Remote (รีโมท)</option>
                  <option value="Telephone">Telephone (โทรศัพท์)</option>
                </select>
              </div>

              <div style={{marginBottom:12}}>
                <label style={{fontSize:12.5,fontWeight:600}}>ปรับปรุง Site ลูกค้า (Customer Site Location)</label>
                <select 
                  value={selectedRequest.location || ''} 
                  onChange={e => setSelectedRequest({ ...selectedRequest, location: e.target.value })}
                  style={{marginTop:6}}
                >
                  {(PROJECT_SITES[selectedRequest.projectId] || ['หน้างานสำนักงานลูกค้าหลัก']).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:8,background:'var(--bg)',padding:12,borderRadius:8,border:'1px solid var(--border)'}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:500,fontSize:13}}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedRequest.noOnsite} 
                    onChange={e => setSelectedRequest({ ...selectedRequest, noOnsite: e.target.checked })} 
                    style={{width:'auto'}} 
                  />
                  ไม่ต้อง Onsite หน้างาน (ยกเว้นการตรวจสอบ GPS)
                </label>
                
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:500,fontSize:13}}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedRequest.skipSignature} 
                    onChange={e => setSelectedRequest({ ...selectedRequest, skipSignature: e.target.checked })} 
                    style={{width:'auto'}} 
                  />
                  ไม่ต้องใช้ลายเซ็นลูกค้าตอนส่งงาน (Skip Signature)
                </label>
              </div>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',borderTop:'1px solid var(--border)',paddingTop:16}}>
              <button className="btn btn-secondary" onClick={() => { setSelectedRequest(null); setShowRequestDetailModal(false); }}>ปิด</button>
              <button className="btn btn-secondary" onClick={() => handleRejectRequest(selectedRequest.id)} style={{background:'#ef4444',color:'#fff',borderColor:'#ef4444'}}>✕ ปฏิเสธคำขอ</button>
              <button className="btn btn-primary" onClick={() => handleApproveRequest(selectedRequest)} style={{background:'#10b981',borderColor:'#10b981'}}>✓ อนุมัติคำขอ</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:480,boxShadow:'var(--shadow-lg)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:18,color:'var(--text)',borderBottom:'1px solid var(--border)',paddingBottom:8}}>สร้าง Ticket (Manual Standalone)</div>
            <form onSubmit={handleCreateTicketManual}>
              <div style={{marginBottom:12}}>
                <label>ชื่อตั๋วงาน / หัวข้อ</label>
                <input type="text" required value={newTicketForm.title} onChange={e=>setNewTicketForm({...newTicketForm,title:e.target.value})} placeholder="ระบุชื่องานที่ปฏิบัติ..." style={{marginTop:6}} />
              </div>
              <div style={{marginBottom:12}}>
                <label>สังกัดโครงการ (Project)</label>
                <select value={newTicketForm.projectId} onChange={e=>setNewTicketForm({...newTicketForm,projectId:e.target.value})} style={{marginTop:6}}>
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div>
                  <label>ประเภทงาน (Ticket Type)</label>
                  <select value={newTicketForm.ticketType} onChange={e=>{
                    const val = e.target.value;
                    const isIntOrLab = val === 'งานภายใน' || val === 'Lab/เรียนรู้';
                    setNewTicketForm({
                      ...newTicketForm,
                      ticketType: val,
                      skipSignature: isIntOrLab ? true : newTicketForm.skipSignature,
                      noOnsite: isIntOrLab ? true : newTicketForm.noOnsite
                    });
                  }} style={{marginTop:6}}>
                    <option value="Install">Install (ติดตั้ง)</option>
                    <option value="MA">MA (บำรุงรักษา)</option>
                    <option value="PM">PM (ตรวจสอบระบบ)</option>
                    <option value="Support">Support (แก้ปัญหา)</option>
                    <option value="Backup">Backup (สำรองข้อมูล)</option>
                    <option value="Report">Report (รายงานประจำเดือน)</option>
                    <option value="งานภายใน">งานภายใน (Internal)</option>
                    <option value="Lab/เรียนรู้">Lab/เรียนรู้ (Lab/Learning)</option>
                  </select>
                </div>
                <div>
                  <label>มอบหมายงาน (Assignee)</label>
                  <select value={newTicketForm.assignee} onChange={e=>setNewTicketForm({...newTicketForm,assignee:e.target.value})} style={{marginTop:6}}>
                    <option value="-">-- เลือกช่างเทคนิค --</option>
                    {staff.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label>กำหนดดิว (Due Date)</label>
                <input type="date" required value={newTicketForm.due} onChange={e=>setNewTicketForm({...newTicketForm,due:e.target.value})} style={{marginTop:6}} />
              </div>
              <div style={{marginBottom:16}}>
                <label>คำสั่งชี้แจง / รายละเอียดงานเพิ่มเติม</label>
                <textarea rows={3} value={newTicketForm.note} onChange={e=>setNewTicketForm({...newTicketForm,note:e.target.value})} placeholder="คำอธิบายงานชี้แจงให้ Staff ปฏิบัติตาม..." style={{marginTop:6,width:'100%',padding:8,borderRadius:6,border:'1px solid var(--border)',boxSizing:'border-box',fontFamily:'inherit'}} />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,background:'var(--bg)',padding:12,borderRadius:8,marginBottom:20,border:'1px solid var(--border)'}}>
                <div style={{fontWeight:700,fontSize:12,color:'var(--text-muted)'}}>เงื่อนไขการทำงานภายนอก / พิกัด:</div>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:500,fontSize:13}}>
                  <input type="checkbox" checked={newTicketForm.noOnsite} onChange={e=>setNewTicketForm({...newTicketForm,noOnsite:e.target.checked})} style={{width:'auto'}} />
                  ไม่ต้อง Onsite หน้างาน (เช่น งานรีโมท/งานภายใน/Lab)
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:500,fontSize:13}}>
                  <input type="checkbox" checked={newTicketForm.skipSignature} onChange={e=>setNewTicketForm({...newTicketForm,skipSignature:e.target.checked})} style={{width:'auto'}} />
                  ไม่ต้องใช้ลายเซ็นลูกค้าตอนส่งงาน (Skip Signature)
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:500,fontSize:13,color:'var(--primary)'}}>
                  <input type="checkbox" checked={newTicketForm.requireCloseApproval || false} onChange={e=>setNewTicketForm({...newTicketForm,requireCloseApproval:e.target.checked})} style={{width:'auto'}} />
                  🔒 ต้องส่งตรวจสอบอนุมัติโดย Service Manager ก่อนปิด Ticket
                </label>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setShowCreateModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">✓ สร้าง Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'board' && (
        <>
          {/* Filters */}
          <div style={{display:'flex',gap:10,marginBottom:20,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{fontSize:13,color:'var(--text-muted)',fontWeight:600}}>กรองตาม Staff:</div>
            <button className={`btn btn-sm${!filterStaff?' btn-primary':' btn-secondary'}`} onClick={() => setFilterStaff('')}>ทั้งหมด</button>
            {staff.map((s,i) => (
              <button key={s} className={`btn btn-sm${filterStaff===s?' btn-primary':' btn-secondary'}`} onClick={() => setFilterStaff(s)}>
                <div style={{width:18,height:18,borderRadius:'50%',background:avatarColors[i%avatarColors.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',fontWeight:700,flexShrink:0}}>{s.charAt(0)}</div>
                {s}
              </button>
            ))}
          </div>

          {/* Kanban */}
          <div className="kanban-board">
            {columns.map(col => {
              const colTickets = filtered.filter(t => t.col === col.id);
              return (
                <div 
                  className="kanban-col" 
                  key={col.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.currentTarget.style.background = 'var(--bg)';
                    const ticketId = e.dataTransfer.getData('text/plain');
                    handleUpdateTicketStatus(ticketId, col.id);
                  }}
                  onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                  onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                  style={{ transition: 'background-color 0.2s ease' }}
                >
                  <div className="kanban-col-header" style={{color:col.color}}>
                    <span style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:col.color}}></div>
                      {col.label}
                    </span>
                    <span className="kanban-count">{colTickets.length}</span>
                  </div>
                  {colTickets.map(tk => <TicketCard key={tk.id} tk={tk} />)}
                  {col.id !== 'done' && (
                    <button onClick={() => handleAddTicket(col.id)} style={{width:'100%',padding:'8px',border:'1px dashed var(--border)',borderRadius:8,background:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:12.5,fontWeight:500,marginTop:4}}>
                      + เพิ่ม Ticket
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'assign' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* View Toggles & Overdue Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', background: 'var(--bg)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              <button 
                className={`tab-btn${assignViewMode==='all'?' active':''}`} 
                onClick={() => setAssignViewMode('all')}
                style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6, fontWeight: 600 }}
              >
                📋 มุมมองทั้งหมด (All View)
              </button>
              <button 
                className={`tab-btn${assignViewMode==='company'?' active':''}`} 
                onClick={() => setAssignViewMode('company')}
                style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6, fontWeight: 600 }}
              >
                🏢 มุมมองบริษัท (Company View)
              </button>
              <button 
                className={`tab-btn${assignViewMode==='staff'?' active':''}`} 
                onClick={() => setAssignViewMode('staff')}
                style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6, fontWeight: 600 }}
              >
                👥 มุมมองตาม Staff (Staff View)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: 8, color: '#ef4444' }}>
                <input 
                  type="checkbox" 
                  checked={showOnlyOverdue} 
                  onChange={(e) => setShowOnlyOverdue(e.target.checked)} 
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ef4444' }}
                />
                ⚠️ แสดงเฉพาะเลยกำหนด (Overdue Only)
              </label>
            </div>
          </div>

          {/* Render Views based on assignViewMode */}
          {(() => {
            const assignTickets = ticketsList.filter(t => !showOnlyOverdue || t.isOverdue);

            if (assignViewMode === 'staff') {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
                  {/* Left Column: Unassigned Tickets */}
                  <div 
                    className="card" 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.currentTarget.style.background = 'var(--bg)';
                      const ticketId = e.dataTransfer.getData('text/plain');
                      handleAssignStaffDirect(ticketId, '-');
                    }}
                    onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                    onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                    style={{ padding: 18, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '60vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📋 ตั๋วงานยังไม่มอบหมาย ({assignTickets.filter(t => t.assignee === '-').length})</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '70vh', flex: 1 }}>
                      {assignTickets.filter(t => t.assignee === '-').length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                          🎉 ไม่มีตั๋วค้างสะสม (มอบหมายครบแล้ว)
                        </div>
                      ) : (
                        assignTickets.filter(t => t.assignee === '-').map(tk => (
                          <AssignCard 
                            key={tk.id} 
                            tk={tk} 
                            onAssign={handleAssignStaffDirect} 
                            onUnassign={handleAssignStaffDirect} 
                            staffList={staff} 
                          />
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Right Panel: Staff Workload Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12, fontSize: 12.5, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>💡</span>
                      <span><strong>คำแนะนำ:</strong> เลือกพนักงานที่ต้องการในดรอปดาวน์ของการ์ดงาน เพื่อทำการมอบหมายงานทันที หรือลากการ์ดมาหย่อนลงในช่องของพนักงานแต่ละคน</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {staff.map((s, idx) => {
                        const staffTickets = assignTickets.filter(t => t.assignee === s);
                        
                        return (
                          <div 
                            key={s} 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.background = 'var(--surface)';
                              const ticketId = e.dataTransfer.getData('text/plain');
                              handleAssignStaffDirect(ticketId, s);
                            }}
                            onDragEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; }}
                            onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                            style={{ 
                              background: 'var(--surface)', 
                              border: '1.5px solid var(--border)', 
                              borderRadius: 12, 
                              padding: 16, 
                              minHeight: 280,
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11 }}>
                                {s.charAt(0)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{s}</div>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>งานในมือ: <strong>{staffTickets.length}</strong> ตั๋ว</div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                              {staffTickets.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 8, padding: 20, color: 'var(--text-muted)', fontSize: 11.5, background: 'var(--bg)' }}>
                                  ไม่มีงานที่ได้รับมอบหมาย
                                </div>
                              ) : (
                                staffTickets.map(tk => (
                                  <AssignCard 
                                    key={tk.id} 
                                    tk={tk} 
                                    onAssign={handleAssignStaffDirect} 
                                    onUnassign={handleAssignStaffDirect} 
                                    staffList={staff} 
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (assignViewMode === 'company') {
              const uniqueCompanies = Array.from(new Set(assignTickets.map(t => t.customer).filter(Boolean)));
              const activeCompany = selectedCompany || uniqueCompanies[0] || '';
              const finalCompany = uniqueCompanies.includes(activeCompany) ? activeCompany : (uniqueCompanies[0] || '');

              const companyTickets = assignTickets.filter(t => t.customer === finalCompany);
              const unassigned = companyTickets.filter(t => t.assignee === '-');
              const pending = companyTickets.filter(t => t.assignee !== '-' && t.accepted === false);
              const accepted = companyTickets.filter(t => t.assignee !== '-' && t.accepted !== false);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
                  {/* Left Sidebar: Company List */}
                  <div className="card" style={{ padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 4 }}>
                      🏢 รายชื่อลูกค้า ({uniqueCompanies.length})
                    </div>
                    {uniqueCompanies.length === 0 ? (
                      <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                        ไม่พบข้อมูลลูกค้า
                      </div>
                    ) : (
                      uniqueCompanies.map(companyName => {
                        const totalCount = assignTickets.filter(t => t.customer === companyName).length;
                        const unassignedCount = assignTickets.filter(t => t.customer === companyName && t.assignee === '-').length;
                        const pendingCount = assignTickets.filter(t => t.customer === companyName && t.assignee !== '-' && t.accepted === false).length;
                        const acceptedCount = assignTickets.filter(t => t.customer === companyName && t.assignee !== '-' && t.accepted !== false).length;
                        const isActive = finalCompany === companyName;

                        return (
                          <div 
                            key={companyName}
                            onClick={() => setSelectedCompany(companyName)}
                            style={{ 
                              padding: '10px 12px', 
                              borderRadius: 8, 
                              background: isActive ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg)', 
                              border: isActive ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 12.5, color: isActive ? 'var(--primary)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {companyName}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 10, background: 'var(--border)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: 4 }}>
                                📋 {unassignedCount}
                              </span>
                              <span style={{ fontSize: 10, background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', padding: '1px 5px', borderRadius: 4 }}>
                                ⌛ {pendingCount}
                              </span>
                              <span style={{ fontSize: 10, background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', padding: '1px 5px', borderRadius: 4 }}>
                                ✓ {acceptedCount}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Panel: Selected Company's 3-column Board */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {finalCompany ? (
                      <>
                        {/* Company Details Title */}
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>🏢</span>
                            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{finalCompany}</span>
                          </div>
                          <span style={{ fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, color: 'var(--text-muted)', fontWeight: 600 }}>
                            ตั๋วงานทั้งหมด: {companyTickets.length}
                          </span>
                        </div>

                        {/* Kanban columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                          {/* Column 1: Unassigned */}
                          <div 
                            className="card"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.currentTarget.style.background = 'var(--bg)';
                              const ticketId = e.dataTransfer.getData('text/plain');
                              handleAssignStaffDirect(ticketId, '-');
                            }}
                            onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                            onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                            style={{ padding: 16, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '55vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>📋 ตั๋วงานยังไม่มอบหมาย ({unassigned.length})</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '60vh', flex: 1 }}>
                              {unassigned.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                  ไม่มีงานค้างจ่าย
                                </div>
                              ) : (
                                unassigned.map(tk => (
                                  <AssignCard 
                                    key={tk.id} 
                                    tk={tk} 
                                    onAssign={handleAssignStaffDirect} 
                                    onUnassign={handleAssignStaffDirect} 
                                    staffList={staff} 
                                  />
                                ))
                              )}
                            </div>
                          </div>

                          {/* Column 2: Pending Accept */}
                          <div 
                            className="card"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.currentTarget.style.background = 'var(--bg)';
                              const ticketId = e.dataTransfer.getData('text/plain');
                              setSelectedTicket(ticketId);
                              setShowAssignModal(true);
                            }}
                            onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                            onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                            style={{ padding: 16, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '55vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>⌛ รอรับงาน ({pending.length})</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '60vh', flex: 1 }}>
                              {pending.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                  ไม่มีงานรอตอบรับ
                                </div>
                              ) : (
                                pending.map(tk => (
                                  <AssignCard 
                                    key={tk.id} 
                                    tk={tk} 
                                    onAssign={handleAssignStaffDirect} 
                                    onUnassign={handleAssignStaffDirect} 
                                    staffList={staff} 
                                  />
                                ))
                              )}
                            </div>
                          </div>

                          {/* Column 3: Accepted */}
                          <div 
                            className="card"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.currentTarget.style.background = 'var(--bg)';
                              const ticketId = e.dataTransfer.getData('text/plain');
                              setSelectedTicket(ticketId);
                              setShowAssignModal(true);
                            }}
                            onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                            onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                            style={{ padding: 16, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '55vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                          >
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>✓ รับงาน ({accepted.length})</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '60vh', flex: 1 }}>
                              {accepted.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                  ไม่มีงานที่รับแล้ว
                                </div>
                              ) : (
                                accepted.map(tk => (
                                  <AssignCard 
                                    key={tk.id} 
                                    tk={tk} 
                                    onAssign={handleAssignStaffDirect} 
                                    onUnassign={handleAssignStaffDirect} 
                                    staffList={staff} 
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
                        👈 กรุณาเลือกบริษัทหรือลูกค้าด้านซ้ายเพื่อจัดการตั๋วงาน
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Default: 'all' View Mode
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {/* Column 1: ตั๋วงานยังไม่มอบหมาย */}
                <div 
                  className="card" 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.currentTarget.style.background = 'var(--bg)';
                    const ticketId = e.dataTransfer.getData('text/plain');
                    handleAssignStaffDirect(ticketId, '-');
                  }}
                  onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                  onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                  style={{ padding: 18, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '60vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📋 ตั๋วงานยังไม่มอบหมาย ({assignTickets.filter(t => t.assignee === '-').length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '70vh', flex: 1 }}>
                    {assignTickets.filter(t => t.assignee === '-').length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        🎉 มอบหมายครบทุกใบแล้ว
                      </div>
                    ) : (
                      assignTickets.filter(t => t.assignee === '-').map(tk => (
                        <AssignCard 
                          key={tk.id} 
                          tk={tk} 
                          onAssign={handleAssignStaffDirect} 
                          onUnassign={handleAssignStaffDirect} 
                          staffList={staff} 
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: รอรับงาน */}
                <div 
                  className="card" 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.currentTarget.style.background = 'var(--bg)';
                    const ticketId = e.dataTransfer.getData('text/plain');
                    setSelectedTicket(ticketId);
                    setShowAssignModal(true);
                  }}
                  onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                  onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                  style={{ padding: 18, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '60vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#dc2626' }}>⌛ รอรับงาน ({assignTickets.filter(t => t.assignee !== '-' && t.accepted === false).length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '70vh', flex: 1 }}>
                    {assignTickets.filter(t => t.assignee !== '-' && t.accepted === false).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        ไม่มีตั๋วค้างในขั้นตอนนี้
                      </div>
                    ) : (
                      assignTickets.filter(t => t.assignee !== '-' && t.accepted === false).map(tk => (
                        <AssignCard 
                          key={tk.id} 
                          tk={tk} 
                          onAssign={handleAssignStaffDirect} 
                          onUnassign={handleAssignStaffDirect} 
                          staffList={staff} 
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: รับงาน */}
                <div 
                  className="card" 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.currentTarget.style.background = 'var(--bg)';
                    const ticketId = e.dataTransfer.getData('text/plain');
                    setSelectedTicket(ticketId);
                    setShowAssignModal(true);
                  }}
                  onDragEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                  onDragLeave={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                  style={{ padding: 18, background: 'var(--bg)', border: '1.5px dashed var(--border)', minHeight: '60vh', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#16a34a' }}>✓ รับงาน ({assignTickets.filter(t => t.assignee !== '-' && t.accepted !== false).length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '70vh', flex: 1 }}>
                    {assignTickets.filter(t => t.assignee !== '-' && t.accepted !== false).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        ไม่มีตั๋วในขั้นตอนนี้
                      </div>
                    ) : (
                      assignTickets.filter(t => t.assignee !== '-' && t.accepted !== false).map(tk => (
                        <AssignCard 
                          key={tk.id} 
                          tk={tk} 
                          onAssign={handleAssignStaffDirect} 
                          onUnassign={handleAssignStaffDirect} 
                          staffList={staff} 
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          {/* Filters for Calendar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>กรองปฏิทินตาม Staff:</div>
            <button className={`btn btn-sm${!filterStaff ? ' btn-primary' : ' btn-secondary'}`} onClick={() => setFilterStaff('')}>ทั้งหมด</button>
            {staff.map((s, i) => (
              <button key={s} className={`btn btn-sm${filterStaff === s ? ' btn-primary' : ' btn-secondary'}`} onClick={() => setFilterStaff(s)}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{s.charAt(0)}</div>
                {s}
              </button>
            ))}
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                id="showOnlyAssignedCal" 
                checked={showOnlyAssignedCalendar} 
                onChange={(e) => setShowOnlyAssignedCalendar(e.target.checked)} 
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="showOnlyAssignedCal" style={{ cursor: 'pointer', userSelect: 'none' }}>
                แสดงเฉพาะงานที่มอบหมายแล้ว (Assigned Only)
              </label>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            {/* Calendar Header Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', fontFamily: 'Kanit, sans-serif' }}>
                📅 ปฏิทินกำหนดส่งงาน (Due Date Calendar)
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth} style={{ minWidth: 32, padding: '4px 8px' }}>◀</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 140, textAlign: 'center' }}>
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
                    background: 'var(--bg)', 
                    padding: '8px 4px', 
                    textAlign: 'center', 
                    fontSize: 12, 
                    fontWeight: 700,
                    color: idx === 0 ? '#ef4444' : (idx === 6 ? '#2563eb' : '#475569') 
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
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} style={{ background: '#f8fafc', minHeight: 90 }} />);
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayTickets = ticketsList.filter(t => 
                    t.due === dateStr &&
                    (!filterStaff || t.assignee === filterStaff) &&
                    (!showOnlyAssignedCalendar || t.assignee !== '-')
                  );
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
                        border: isToday ? '2px solid #6366f1' : 'none',
                        position: 'relative'
                      }}
                    >
                      <span 
                        style={{ 
                          alignSelf: 'flex-end', 
                          fontSize: 11.5, 
                          fontWeight: 700, 
                          color: isToday ? '#6366f1' : '#64748b',
                          background: isToday ? '#e0e7ff' : 'none',
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
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', maxHeight: 68 }}>
                        {dayTickets.map(tk => (
                          <div 
                            key={tk.id} 
                            onClick={() => navigate(`/tickets/${tk.id}`)}
                            title={`${tk.id}: ${tk.title} (${tk.assignee})`}
                            style={{ 
                              fontSize: 9.5, 
                              padding: '3px 6px', 
                              borderRadius: 4, 
                              background: tk.pct === 100 ? '#dcfce7' : (tk.priority === 'High' ? '#fee2e2' : '#eff6ff'),
                              color: tk.pct === 100 ? '#15803d' : (tk.priority === 'High' ? '#b91c1c' : '#1e40af'),
                              border: `1px solid ${tk.pct === 100 ? '#86efac' : (tk.priority === 'High' ? '#fca5a5' : '#bfdbfe')}`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: 14, 
                              height: 14, 
                              borderRadius: '50%', 
                              background: avatarColors[staff.indexOf(tk.assignee)%avatarColors.length] || '#cbd5e1', 
                              color: '#fff', 
                              fontSize: 8,
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {tk.assignee === '-' ? '?' : tk.assignee.charAt(0)}
                            </span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {tk.id} {tk.assignee !== '-' ? `[${tk.assignee}${tk.accepted === false ? ' ⌛' : ''}]` : ''} {tk.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skill' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
            {[{label:'Team Utilization',value:'78%',sub:'เฉลี่ย 5 คน',color:'#6366f1'},
              {label:'Tickets คงค้าง',value:'7',sub:'รอ Assign',color:'#f59e0b'},
              {label:'Completed (MTD)',value:'23',sub:'Ticket ปิดแล้ว',color:'#10b981'},
            ].map((s,i) => (
              <div className="stat-card" key={i} style={{padding:18}}>
                <div className="stat-icon" style={{background:s.color+'18',color:s.color}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div style={{fontSize:11.5,color:'var(--text-muted)',marginTop:3}}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Skill & Workload Matrix</div></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Skills (Tags)</th>
                    <th style={{textAlign:'center'}}>Tickets Active</th>
                    <th style={{textAlign:'center'}}>Tickets Done</th>
                    <th>Utilization</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {skillData.map((s,i) => {
                    const pct = Math.round((s.done / (s.tickets||1)) * 100);
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div className="mini-avatar" style={{background:avatarColors[i%avatarColors.length],width:32,height:32,fontSize:12}}>
                              {s.name.charAt(0)}
                            </div>
                            <span style={{fontWeight:600,fontSize:13.5}}>{s.name}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                            {s.skills.map(sk => <Tag key={sk} label={sk} />)}
                          </div>
                        </td>
                        <td style={{textAlign:'center',fontWeight:700,color:'var(--primary)'}}>{s.tickets}</td>
                        <td style={{textAlign:'center',fontWeight:700,color:'var(--secondary)'}}>{s.done}</td>
                        <td style={{minWidth:140}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{flex:1,background:'var(--border)',borderRadius:4,height:8,overflow:'hidden'}}>
                              <div style={{width:`${pct}%`,height:'100%',background:pct>80?'#10b981':pct>50?'#f59e0b':'#6366f1',borderRadius:4}}/>
                            </div>
                            <span style={{fontSize:11.5,fontWeight:700,color:'var(--text-muted)'}}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
                            detail: { title: 'Assign Skill', message: `อัปเดตระดับความเชี่ยวชาญ (Skill Level) ของ ${s.name} เรียบร้อยแล้ว`, type: 'success' }
                          }))}>Assign Skill</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approve' && (
        <div className="card">
          <div className="card-header" style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
            <div className="card-title">📥 รายการขอเปิด Ticket จาก Staff ({pendingRequests.length} รายการ)</div>
          </div>
          <div className="table-wrapper" style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--surface)'}}>
                  <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>ผู้ส่งคำขอ (Requested By)</th>
                  <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>หัวเรื่อง (Title)</th>
                  <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>ประเภทงาน / โครงการ</th>
                  <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>Site ลูกค้า (Site)</th>
                  <th style={{padding:'12px 14px',textAlign:'center',fontSize:12.5}}>กำหนดส่ง (Due Date)</th>
                  <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>รายละเอียด/คำชี้แจง</th>
                  <th style={{padding:'12px 14px',textAlign:'center',fontSize:12.5}}>ค่าเงื่อนไขพิเศษ</th>
                  <th style={{padding:'12px 14px',textAlign:'center',fontSize:12.5}}>การอนุมัติ</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{textAlign:'center',padding:'40px 10px',color:'var(--text-muted)',fontSize:13.5,fontStyle:'italic'}}>
                      ไม่มีรายการคำขอเปิด Ticket ค้างอยู่ขณะนี้
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map(req => {
                    const matchedProj = projectsList.find(p => p.id === req.projectId);
                    return (
                      <tr key={req.id} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'12px 14px',fontWeight:700,fontSize:13.5,color:'var(--text)'}}>
                          👤 {req.requestedBy}
                        </td>
                        <td style={{padding:'12px 14px',fontSize:13.5}}>
                          <div style={{fontWeight:600}}>{req.title}</div>
                          <div style={{fontSize:11,color:'var(--text-muted)'}}>ส่งเมื่อ: {req.requestTime}</div>
                        </td>
                        <td style={{padding:'12px 14px',fontSize:12.5}}>
                          <span className="badge badge-ma" style={{marginRight:6}}>{req.ticketType}</span>
                          <span style={{color:'var(--text-light)'}}>{matchedProj ? matchedProj.name : req.projectId}</span>
                        </td>
                        <td style={{padding:'12px 14px',fontSize:12.5,fontWeight:600}}>
                          📍 {req.location || '-'}
                        </td>
                        <td style={{padding:'12px 14px',textAlign:'center',fontSize:13,fontWeight:600}}>{req.due}</td>
                        <td style={{padding:'12px 14px',fontSize:12.5,color:'var(--text-muted)',maxWidth:240,whiteSpace:'normal',wordBreak:'break-all'}}>{req.detail || '-'}</td>
                        <td style={{padding:'12px 14px',textAlign:'center',fontSize:11.5}}>
                          {req.noOnsite && <div style={{color:'#059669',fontWeight:700}}>• ไม่ต้อง Onsite</div>}
                          {req.skipSignature && <div style={{color:'#6d28d9',fontWeight:700}}>• ไม่ใช้ลายเซ็น</div>}
                          {!req.noOnsite && !req.skipSignature && <span style={{color:'var(--text-light)'}}>-</span>}
                        </td>
                        <td style={{padding:'12px 14px',textAlign:'center'}}>
                          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedRequest(req); setShowRequestDetailModal(true); }} style={{background:'var(--surface)',color:'var(--text)',borderColor:'var(--border)'}}>🔍 รายละเอียด</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleApproveRequest(req)} style={{background:'#10b981',borderColor:'#10b981'}}>✓ อนุมัติ</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleRejectRequest(req.id)} style={{background:'#ef4444',color:'#fff',borderColor:'#ef4444'}}>✕ ปฏิเสธ</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Section 2: Close Ticket Approvals */}
          <div style={{marginTop:30, borderTop:'2px solid var(--border)', paddingTop:24}}>
            <div className="card-header" style={{padding:'16px 20px',borderBottom:'1px solid var(--border)', background:'var(--surface-light)', borderRadius:'8px 8px 0 0'}}>
              <div className="card-title" style={{color:'var(--primary)'}}>🔒 รายการขออนุมัติปิด Ticket จาก Staff ({ticketsList.filter(t => t.status === 'Waiting Close Approval').length} รายการ)</div>
            </div>
            <div className="table-wrapper" style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--surface)'}}>
                    <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>ผู้ปฏิบัติงาน (Assignee)</th>
                    <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>ตั๋วงาน (Ticket ID / Title)</th>
                    <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>ประเภทงาน / โครงการ</th>
                    <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>Site ลูกค้า (Site)</th>
                    <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>บันทึกการทำงาน (Work Summary)</th>
                    <th style={{padding:'12px 14px',textAlign:'center',fontSize:12.5}}>การตรวจรับ (Verification)</th>
                    <th style={{padding:'12px 14px',textAlign:'center',fontSize:12.5}}>การอนุมัติปิดตั๋ว</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsList.filter(t => t.status === 'Waiting Close Approval').length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{textAlign:'center',padding:'40px 10px',color:'var(--text-muted)',fontSize:13.5,fontStyle:'italic'}}>
                        ไม่มีคำขออนุมัติปิด Ticket ในขณะนี้
                      </td>
                    </tr>
                  ) : (
                    ticketsList.filter(t => t.status === 'Waiting Close Approval').map(tk => {
                      return (
                        <tr key={tk.id} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'12px 14px',fontWeight:700,fontSize:13.5,color:'var(--text)'}}>
                            👤 {tk.assignee}
                          </td>
                          <td style={{padding:'12px 14px',fontSize:13.5}}>
                            <span onClick={() => navigate(`/tickets/${tk.id}`)} style={{fontWeight:700,color:'var(--primary)',textDecoration:'none', cursor:'pointer'}}>{tk.id}</span>
                            <div style={{fontWeight:600,marginTop:2}}>{tk.title}</div>
                          </td>
                          <td style={{padding:'12px 14px',fontSize:12.5}}>
                            <span className="badge badge-ma" style={{marginRight:6}}>{tk.ticketType || tk.type}</span>
                            <span style={{color:'var(--text-light)'}}>{tk.projectName} ({tk.customer})</span>
                          </td>
                          <td style={{padding:'12px 14px',fontSize:12.5,fontWeight:600}}>
                            📍 {tk.location || '-'}
                          </td>
                          <td style={{padding:'12px 14px',fontSize:12.5,color:'var(--text-muted)',maxWidth:240,whiteSpace:'normal',wordBreak:'break-all'}}>
                            {tk.workDetail || 'ไม่มีบันทึกรายละเอียดงาน'}
                          </td>
                          <td style={{padding:'12px 14px',textAlign:'center',fontSize:11.5}}>
                            {tk.signatureImg ? (
                              <div style={{color:'#059669',fontWeight:700}}>✓ มีลายเซ็นลูกค้า</div>
                            ) : tk.skipSignature ? (
                              <div style={{color:'#6d28d9',fontWeight:700}}>• ยกเว้นลายเซ็น</div>
                            ) : (
                              <div style={{color:'#ef4444',fontWeight:700}}>⚠️ ไม่มีลายเซ็น</div>
                            )}
                            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>Checklist: {tk.checklist?.filter(c=>c.done).length}/{tk.checklist?.length}</div>
                          </td>
                          <td style={{padding:'12px 14px',textAlign:'center'}}>
                            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/tickets/${tk.id}`)} style={{background:'var(--surface)',color:'var(--text)',borderColor:'var(--border)'}}>🔍 ดูหน้าตั๋ว</button>
                              <button className="btn btn-primary btn-sm" onClick={() => handleApproveCloseTicket(tk)} style={{background:'#10b981',borderColor:'#10b981'}}>✓ อนุมัติปิด</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleRejectCloseTicketPrompt(tk)} style={{background:'#ef4444',color:'#fff',borderColor:'#ef4444'}}>✕ ส่งกลับแก้ไข</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Close Rejection Modal Dialog */}
          {showCloseRejectModal && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:440,boxShadow:'var(--shadow-lg)'}}>
                <div style={{fontWeight:800,fontSize:18,marginBottom:14,color:'var(--text)'}}>✕ ตีกลับคำขอปิด Ticket</div>
                <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:14,textAlign:'left'}}>
                  ระบุเหตุผลที่ต้องการตีกลับใบงาน <strong>{rejectionTicketId}</strong> เพื่อแจ้งกลับไปยัง Staff:
                </div>
                <div style={{marginBottom:20}}>
                  <textarea 
                    rows={3} 
                    value={rejectionText} 
                    onChange={e=>setRejectionText(e.target.value)} 
                    placeholder="ระบุข้อบกพร่องที่ต้องแก้ไข หรือขั้นตอนที่ขาดหาย..." 
                    style={{width:'100%',padding:8,borderRadius:6,border:'1px solid var(--border)',boxSizing:'border-box',fontFamily:'inherit',fontSize:13}}
                  />
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button className="btn btn-secondary" onClick={()=>{setShowCloseRejectModal(false); setRejectionTicketId(''); setRejectionText('');}}>ยกเลิก</button>
                  <button className="btn btn-primary" onClick={handleConfirmRejectCloseTicket} disabled={!rejectionText.trim()} style={{background:'#ef4444',borderColor:'#ef4444',color:'#fff'}}>✓ ยืนยันตีกลับงาน</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'customers' && (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* Sub-tab navigation */}
          <div className="tabs" style={{width:'fit-content', padding:4}}>
            <button 
              className={`tab-btn${customerSubTab==='list'?' active':''}`} 
              onClick={() => setCustomerSubTab('list')}
            >
              🏢 รายชื่อลูกค้า & Site
            </button>
            <button 
              className={`tab-btn${customerSubTab==='matrix'?' active':''}`} 
              onClick={() => setCustomerSubTab('matrix')}
            >
              👥 จัดการเจ้าหน้าที่ดูแล Site (Caretakers)
            </button>
          </div>

          {customerSubTab === 'list' ? (
            <div className="card">
              <div className="card-header" style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                <div className="card-title">👥 รายชื่อลูกค้า NIS Service Directory ({customersList.length} บริษัท)</div>
                <div style={{display:'flex',gap:12,alignItems:'center'}}>
                  <input 
                    type="text" 
                    value={customerSearchQuery} 
                    onChange={e=>setCustomerSearchQuery(e.target.value)} 
                    placeholder="🔍 ค้นหาชื่อลูกค้า หรือ Tax ID..." 
                    style={{padding:'6px 12px',borderRadius:6,border:'1px solid var(--border)',minWidth:240,fontSize:13.5}}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setCustomerForm({
                      id: '',
                      name: '',
                      taxId: '',
                      contacts: [{ name: '', phone: '', email: '', role: '' }],
                      locations: [{ label: '', address: '', assignedStaff: [] }]
                    });
                    setShowCustomerModal(true);
                  }}>+ เพิ่มลูกค้าใหม่</button>
                </div>
              </div>
              <div className="table-wrapper" style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'var(--surface)'}}>
                      <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>ชื่อลูกค้า / บริษัท</th>
                      <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>เลขผู้เสียภาษี (Tax ID)</th>
                      <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>รายชื่อผู้ติดต่อ (Contacts)</th>
                      <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>สถานที่ / Site (Locations)</th>
                      <th style={{padding:'12px 14px',textAlign:'center',fontSize:12.5}}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = customersList.filter(c => 
                        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                        c.taxId.includes(customerSearchQuery)
                      );
                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" style={{textAlign:'center',padding:'40px 10px',color:'var(--text-muted)',fontSize:13.5,fontStyle:'italic'}}>
                              ไม่พบข้อมูลรายชื่อลูกค้าที่ค้นหา
                            </td>
                          </tr>
                        );
                      }
                      return filtered.map(cust => (
                        <tr key={cust.id} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'12px 14px',fontWeight:700,fontSize:14,color:'var(--text)'}}>
                            {cust.name}
                          </td>
                          <td style={{padding:'12px 14px',fontSize:13,fontFamily:'monospace'}}>
                            {cust.taxId}
                          </td>
                          <td style={{padding:'12px 14px',fontSize:12.5}}>
                            <div style={{display:'flex',flexDirection:'column',gap:4}}>
                              {cust.contacts.map((con, idx) => (
                                <div key={idx} style={{background:'var(--bg)',padding:'4px 8px',borderRadius:4,border:'1px solid var(--border)'}}>
                                  <strong>{con.name}</strong> {con.role ? `(${con.role})` : ''}
                                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{con.phone} | {con.email}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{padding:'12px 14px',fontSize:12.5}}>
                            <div style={{display:'flex',flexDirection:'column',gap:6}}>
                              {cust.locations.map((loc, idx) => (
                                <div key={idx} style={{fontSize:12,background:'var(--bg)',padding:6,borderRadius:6,border:'1px solid var(--border)'}}>
                                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                                    <div>
                                      📍 <strong>{loc.label}</strong>: <span style={{color:'var(--text-light)'}}>{loc.address}</span>
                                    </div>
                                    {loc.coordinates && (
                                      <button 
                                        type="button"
                                        onClick={() => setViewingMapCoords({
                                          customerName: cust.name,
                                          label: loc.label,
                                          coordinates: loc.coordinates
                                        })}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'var(--primary)',
                                          cursor: 'pointer',
                                          fontSize: 12,
                                          padding: '2px 4px',
                                          borderRadius: 4,
                                          transition: 'all 0.1s',
                                          flexShrink: 0
                                        }}
                                        title="แสดงตำแหน่งแผนที่"
                                      >
                                        🗺️
                                      </button>
                                    )}
                                  </div>
                                  {loc.assignedStaff && loc.assignedStaff.length > 0 && (
                                    <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6,alignItems:'center'}}>
                                      <span style={{fontSize:10.5,color:'var(--text-muted)',marginRight:2}}>👥 ผู้ดูแล:</span>
                                      {loc.assignedStaff.map(s => (
                                        <span
                                          key={s}
                                          style={{
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            color: 'var(--primary)',
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 10,
                                            fontWeight: 600,
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 2
                                          }}
                                        >
                                          👤 {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{padding:'12px 14px',textAlign:'center'}}>
                            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                              <button className="btn btn-secondary btn-sm" onClick={() => {
                                setCustomerForm(cust);
                                setShowCustomerModal(true);
                              }}>แก้ไข</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => {
                                if (confirm(`ต้องการลบรายชื่อลูกค้า "${cust.name}" หรือไม่?`)) {
                                  const updated = customersList.filter(c => c.id !== cust.id);
                                  setCustomersList(updated);
                                  saveCustomers(updated);
                                }
                              }} style={{background:'#fee2e2',color:'#ef4444',borderColor:'#fecaca'}}>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {/* ทำเนียบเจ้าหน้าที่เทคนิค (Staff Directory) */}
              <div className="card">
                <div className="card-header" style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                  <div className="card-title">👥 ทำเนียบเจ้าหน้าที่เทคนิค ({staffList.length} คน)</div>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => {
                      setEditingStaffName(null);
                      setStaffNameInput('');
                      setShowStaffModal(true);
                    }}
                  >
                    + เพิ่มเจ้าหน้าที่ใหม่
                  </button>
                </div>
                <div style={{padding:'16px 20px', display:'flex', gap:10, flexWrap:'wrap'}}>
                  {staffList.length === 0 ? (
                    <div style={{color:'var(--text-muted)', fontStyle:'italic', fontSize:13.5}}>ไม่มีเจ้าหน้าที่เทคนิคในระบบ</div>
                  ) : (
                    staffList.map(s => (
                      <div 
                        key={s} 
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <div style={{background:getStaffColor(s), width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700}}>
                            {s.charAt(0)}
                          </div>
                          <span style={{fontWeight:600, fontSize:13.5, color:'var(--text)'}}>{s}</span>
                        </div>
                        <div style={{display:'flex', gap:4, borderLeft:'1px solid var(--border)', paddingLeft:8}}>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingStaffName(s);
                              setStaffNameInput(s);
                              setShowStaffModal(true);
                            }}
                            style={{background:'transparent', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:11.5, fontWeight:600, padding:'2px 4px'}}
                          >
                            ✏️ แก้ไข
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteStaff(s)}
                            style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:11.5, fontWeight:600, padding:'2px 4px'}}
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ตารางแสดงหน้างานและการมอบหมาย (Caretakers Matrix Grid) */}
              <div className="card">
                <div className="card-header" style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                  <div className="card-title">👥 เมนูจัดการเจ้าหน้าที่ดูแล Site (Caretakers Matrix)</div>
                  <div>
                    <input 
                      type="text" 
                      value={matrixSearchQuery} 
                      onChange={e=>setMatrixSearchQuery(e.target.value)} 
                      placeholder="🔍 ค้นหาชื่อลูกค้า, หน้างาน, หรือผู้ดูแล..." 
                      style={{padding:'6px 12px',borderRadius:6,border:'1px solid var(--border)',minWidth:280,fontSize:13.5}}
                    />
                  </div>
                </div>
                <div className="table-wrapper" style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'var(--surface)'}}>
                        <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5,width:'220px'}}>ชื่อลูกค้า / บริษัท</th>
                        <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>สถานที่ / Site (Locations)</th>
                        <th style={{padding:'12px 14px',textAlign:'left',fontSize:12.5}}>เจ้าหน้าที่ผู้ดูแลประจำ Site (คลิกมอบหมายแบบด่วน)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const allSites = [];
                        customersList.forEach(cust => {
                          cust.locations.forEach((loc, locIdx) => {
                            allSites.push({
                              customerId: cust.id,
                              customerName: cust.name,
                              locationIdx: locIdx,
                              label: loc.label,
                              address: loc.address,
                              assignedStaff: loc.assignedStaff || []
                            });
                          });
                        });

                        const filteredSites = allSites.filter(site => {
                          const query = matrixSearchQuery.toLowerCase();
                          return (
                            site.customerName.toLowerCase().includes(query) ||
                            site.label.toLowerCase().includes(query) ||
                            site.address.toLowerCase().includes(query) ||
                            site.assignedStaff.some(s => s.toLowerCase().includes(query))
                          );
                        });

                        if (filteredSites.length === 0) {
                          return (
                            <tr>
                              <td colSpan="3" style={{textAlign:'center',padding:'40px 10px',color:'var(--text-muted)',fontSize:13.5,fontStyle:'italic'}}>
                                ไม่พบข้อมูลสถานที่ที่ค้นหา
                              </td>
                            </tr>
                          );
                        }

                        return filteredSites.map((site) => (
                          <tr key={`${site.customerId}-${site.locationIdx}`} style={{borderBottom:'1px solid var(--border)'}}>
                            <td style={{padding:'12px 14px',fontWeight:700,fontSize:13.5,color:'var(--text)',verticalAlign:'top'}}>
                              {site.customerName}
                            </td>
                            <td style={{padding:'12px 14px',fontSize:12.5,verticalAlign:'top'}}>
                              📍 <strong>{site.label}</strong>
                              <div style={{fontSize:11.5,color:'var(--text-light)',marginTop:2}}>{site.address}</div>
                            </td>
                            <td style={{padding:'12px 14px',verticalAlign:'top'}}>
                              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                                {staff.map(s => {
                                  const isAssigned = site.assignedStaff.includes(s);
                                  return (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => {
                                        const updated = customersList.map(c => {
                                          if (c.id === site.customerId) {
                                            const updatedLocations = c.locations.map((loc, lIdx) => {
                                              if (lIdx === site.locationIdx) {
                                                const currentStaff = loc.assignedStaff || [];
                                                const updatedStaff = currentStaff.includes(s)
                                                  ? currentStaff.filter(item => item !== s)
                                                  : [...currentStaff, s];
                                                return { ...loc, assignedStaff: updatedStaff };
                                              }
                                              return loc;
                                            });
                                            return { ...c, locations: updatedLocations };
                                          }
                                          return c;
                                        });
                                        setCustomersList(updated);
                                        saveCustomers(updated);
                                      }}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        fontSize: 11.5,
                                        cursor: 'pointer',
                                        border: isAssigned ? '1px solid var(--primary)' : '1px solid var(--border)',
                                        background: isAssigned ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface)',
                                        color: isAssigned ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: isAssigned ? 700 : 500,
                                        transition: 'all 0.15s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                    >
                                      {isAssigned ? '✓' : '+'} {s}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showStaffModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:24,width:400,boxShadow:'var(--shadow-lg)'}}>
            <div style={{fontWeight:800,fontSize:17,marginBottom:14,color:'var(--text)',borderBottom:'1px solid var(--border)',paddingBottom:8}}>
              {editingStaffName ? '✏️ แก้ไขชื่อเจ้าหน้าที่เทคนิค' : '👥 เพิ่มเจ้าหน้าที่เทคนิคใหม่'}
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveStaff(staffNameInput);
            }}>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12.5,fontWeight:600,color:'var(--text)'}}>ชื่อเจ้าหน้าที่เทคนิค (Staff Name)</label>
                <input 
                  type="text" 
                  required 
                  value={staffNameInput} 
                  onChange={e => setStaffNameInput(e.target.value)} 
                  placeholder="เช่น Tawan S., Somchai D...." 
                  style={{marginTop:6, width:'100%', padding:'8px 12px', borderRadius:6, border:'1px solid var(--border)', fontSize:13.5, background:'var(--surface)', color:'var(--text)', boxSizing:'border-box'}} 
                  autoFocus
                />
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end',borderTop:'1px solid var(--border)',paddingTop:14}}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowStaffModal(false);
                  setEditingStaffName(null);
                  setStaffNameInput('');
                }}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">✓ บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingMapCoords && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:24,width:500,boxShadow:'var(--shadow-lg)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', paddingBottom:10, marginBottom:14}}>
              <div>
                <span style={{fontWeight:800,fontSize:16,color:'var(--text)'}}>🗺️ ตำแหน่งหน้างานบนแผนที่</span>
                <div style={{fontSize:12, color:'var(--text-muted)', marginTop:2}}>{viewingMapCoords.customerName} - {viewingMapCoords.label}</div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingMapCoords(null)}
                style={{background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18}}
              >
                ✕
              </button>
            </div>
            
            <div 
              style={{
                width: '100%', 
                height: 250, 
                borderRadius: 8, 
                background: '#020617', 
                position: 'relative', 
                overflow: 'hidden',
                border: '1px solid #1e293b'
              }}
            >
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute', inset:0}}>
                <defs>
                  <pattern id="viewMapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#viewMapGrid)" />
                
                <path 
                  d="M -20,20 C 150,50 80,120 220,130 C 350,140 380,60 550,90" 
                  fill="none" 
                  stroke="#0284c7" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  opacity="0.3" 
                />
                
                <line x1="0" y1="30" x2="600" y2="30" stroke="#334155" strokeWidth="1" opacity="0.3" />
                <line x1="0" y1="130" x2="600" y2="130" stroke="#334155" strokeWidth="1" opacity="0.3" />
                <line x1="100" y1="0" x2="100" y2="250" stroke="#334155" strokeWidth="1" opacity="0.3" />
                <line x1="380" y1="0" x2="380" y2="250" stroke="#334155" strokeWidth="1" opacity="0.3" />
                
                <path 
                  d="M 50,0 Q 150,80 480,200" 
                  fill="none" 
                  stroke="#0ea5e9" 
                  strokeWidth="1.5" 
                  opacity="0.4" 
                />

                <circle cx="120" cy="60" r="3" fill="#10b981" />
                <text x="130" y="63" fill="#64748b" fontSize="8" fontFamily="sans-serif">Bang Sue HQ</text>

                <circle cx="280" cy="110" r="3" fill="#10b981" />
                <text x="290" y="113" fill="#64748b" fontSize="8" fontFamily="sans-serif">Sathorn Tower</text>
              </svg>

              {viewingMapCoords.coordinates && (() => {
                const pos = getPinPos(viewingMapCoords.coordinates);
                return (
                  <div 
                    style={{
                      position: 'absolute',
                      left: pos.x,
                      top: pos.y,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30
                    }}
                  >
                    <div 
                      style={{
                        position: 'absolute',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid #ef4444',
                        animation: 'mapPinPulse 1.5s infinite ease-out',
                        background: 'rgba(239, 68, 68, 0.15)'
                      }}
                    />
                    <div 
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 8px #ef4444',
                        border: '1.5px solid #fff'
                      }}
                    />
                  </div>
                );
              })()}
            </div>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14}}>
              <span style={{fontSize:12, color:'var(--text-muted)'}}>
                พิกัด: <strong style={{color:'var(--text)', fontFamily:'monospace'}}>{viewingMapCoords.coordinates}</strong>
              </span>
              <button
                type="button"
                onClick={() => setViewingMapCoords(null)}
                className="btn btn-secondary btn-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:650,boxShadow:'var(--shadow-lg)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:18,color:'var(--text)',borderBottom:'1px solid var(--border)',paddingBottom:8}}>
              {customerForm.id ? '✏️ แก้ไขข้อมูลลูกค้า' : '👥 เพิ่มรายชื่อลูกค้าใหม่'}
            </div>
            
            <form onSubmit={handleSaveCustomer}>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,marginBottom:12,alignItems:'end'}}>
                <div>
                  <label style={{fontSize:12.5,fontWeight:600}}>เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={13}
                    value={customerForm.taxId} 
                    onChange={e => setCustomerForm({ ...customerForm, taxId: e.target.value.replace(/\D/g, '') })} 
                    placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก..." 
                    style={{marginTop:6}} 
                  />
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleTaxIdLookup} style={{height:38}}>
                  🔍 ดึงข้อมูลสรรพากร
                </button>
              </div>

              <div style={{marginBottom:12}}>
                <label style={{fontSize:12.5,fontWeight:600}}>ชื่อบริษัท / ลูกค้า (Company Name)</label>
                <input 
                  type="text" 
                  required 
                  value={customerForm.name} 
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} 
                  placeholder="เช่น บริษัท เอสซีจี เคมิคอลส์ จำกัด (มหาชน)..." 
                  style={{marginTop:6}} 
                />
              </div>

              {/* Dynamic Contacts Section */}
              <div style={{borderTop:'1px solid var(--border)',paddingTop:12,marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:13.5,color:'var(--primary)'}}>📞 รายชื่อผู้ติดต่อ (Contact Persons)</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddContactField}>+ เพิ่มผู้ติดต่อ</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {customerForm.contacts.map((con, idx) => (
                    <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:8,alignItems:'center',background:'var(--bg)',padding:8,borderRadius:6,border:'1px solid var(--border)'}}>
                      <input 
                        type="text" 
                        required
                        value={con.name} 
                        onChange={e => handleContactFieldChange(idx, 'name', e.target.value)} 
                        placeholder="ชื่อผู้ติดต่อ..." 
                        style={{fontSize:12.5,padding:6}}
                      />
                      <input 
                        type="text" 
                        value={con.role} 
                        onChange={e => handleContactFieldChange(idx, 'role', e.target.value)} 
                        placeholder="ตำแหน่ง..." 
                        style={{fontSize:12.5,padding:6}}
                      />
                      <input 
                        type="text" 
                        required
                        value={con.phone} 
                        onChange={e => handleContactFieldChange(idx, 'phone', e.target.value)} 
                        placeholder="เบอร์โทร..." 
                        style={{fontSize:12.5,padding:6}}
                      />
                      <input 
                        type="email" 
                        required
                        value={con.email} 
                        onChange={e => handleContactFieldChange(idx, 'email', e.target.value)} 
                        placeholder="อีเมล..." 
                        style={{fontSize:12.5,padding:6}}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveContactField(idx)} 
                        style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}
                        title="ลบ"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Locations Section */}
              <div style={{borderTop:'1px solid var(--border)',paddingTop:12,marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:13.5,color:'var(--primary)'}}>📍 สถานที่ / Site (Customer Locations)</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLocationField}>+ เพิ่มสถานที่</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {customerForm.locations.map((loc, idx) => (
                    <div key={idx} style={{background:'var(--bg)',padding:12,borderRadius:8,border:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:8}}>
                      <div style={{display:'grid',gridTemplateColumns:'120px 1fr auto',gap:8,alignItems:'center'}}>
                        <input 
                          type="text" 
                          required
                          value={loc.label} 
                          onChange={e => handleLocationFieldChange(idx, 'label', e.target.value)} 
                          placeholder="เช่น สำนักงานใหญ่, คลังสินค้า..." 
                          style={{fontSize:12.5,padding:6}}
                        />
                        <input 
                          type="text" 
                          required
                          value={loc.address} 
                          onChange={e => handleLocationFieldChange(idx, 'address', e.target.value)} 
                          placeholder="ที่อยู่ละเอียด..." 
                          style={{fontSize:12.5,padding:6}}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveLocationField(idx)} 
                          style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}
                          title="ลบ"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div style={{display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', paddingTop:6, borderTop:'1px dashed var(--border)', flexWrap:'wrap'}}>
                        <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                          <span style={{fontSize:11.5, color:'var(--text-muted)', fontWeight:600}}>👥 ผู้ดูแล:</span>
                          {staff.map(s => {
                            const isAssigned = (loc.assignedStaff || []).includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  const current = loc.assignedStaff || [];
                                  const updated = current.includes(s)
                                    ? current.filter(item => item !== s)
                                    : [...current, s];
                                  handleLocationFieldChange(idx, 'assignedStaff', updated);
                                }}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 12,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  border: isAssigned ? '1px solid var(--primary)' : '1px solid var(--border)',
                                  background: isAssigned ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface)',
                                  color: isAssigned ? 'var(--primary)' : 'var(--text-muted)',
                                  fontWeight: isAssigned ? 700 : 500,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isAssigned ? '✓ ' : ''}{s}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{display:'flex', gap:6, alignItems:'center'}}>
                          <span style={{fontSize:11.5, color:'var(--text-muted)', fontWeight:600}}>📍 พิกัด:</span>
                          <span style={{fontSize:11.5, fontFamily:'monospace', background:'var(--surface)', padding:'2px 6px', borderRadius:4, border:'1px solid var(--border)', color:'var(--text)'}}>
                            {loc.coordinates || 'ไม่ได้ระบุ'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMapPickerIdx(activeMapPickerIdx === idx ? null : idx);
                            }}
                            style={{
                              background: activeMapPickerIdx === idx ? 'var(--primary)' : 'rgba(99, 102, 241, 0.1)',
                              color: activeMapPickerIdx === idx ? '#fff' : 'var(--primary)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            🗺️ {activeMapPickerIdx === idx ? 'ปิดแผนที่' : 'แผนที่'}
                          </button>
                        </div>
                      </div>

                      {activeMapPickerIdx === idx && (
                        <div style={{marginTop:8, borderRadius:8, border:'1px solid var(--border)', background:'#0f172a', padding:10, display:'flex', flexDirection:'column', gap:8}}>
                          <style>{`
                            @keyframes mapPinPulse {
                              0% { transform: scale(0.6); opacity: 1; }
                              50% { transform: scale(1.4); opacity: 0.2; }
                              100% { transform: scale(1.8); opacity: 0; }
                            }
                          `}</style>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <span style={{fontSize:11.5, color:'#38bdf8', fontWeight:700}}>🗺️ Location Map Picker (คลิกบนแผนที่เพื่อปักหมุด)</span>
                            <span style={{fontSize:10.5, color:'var(--text-muted)'}}>กรุงเทพฯ จำลอง</span>
                          </div>
                          
                          <div 
                            onClick={(e) => handleMapClick(e, idx)}
                            style={{
                              width: '100%', 
                              height: 180, 
                              borderRadius: 6, 
                              background: '#020617', 
                              position: 'relative', 
                              cursor: 'crosshair',
                              overflow: 'hidden',
                              border: '1px solid #1e293b'
                            }}
                          >
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute', inset:0}}>
                              <defs>
                                <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#mapGrid)" />
                              
                              <path 
                                d="M -20,20 C 150,50 80,120 220,130 C 350,140 380,60 550,90" 
                                fill="none" 
                                stroke="#0284c7" 
                                strokeWidth="8" 
                                strokeLinecap="round" 
                                opacity="0.3" 
                              />
                              
                              <line x1="0" y1="30" x2="600" y2="30" stroke="#334155" strokeWidth="1" opacity="0.3" />
                              <line x1="0" y1="130" x2="600" y2="130" stroke="#334155" strokeWidth="1" opacity="0.3" />
                              <line x1="100" y1="0" x2="100" y2="250" stroke="#334155" strokeWidth="1" opacity="0.3" />
                              <line x1="380" y1="0" x2="380" y2="250" stroke="#334155" strokeWidth="1" opacity="0.3" />
                              
                              <path 
                                d="M 50,0 Q 150,80 480,200" 
                                fill="none" 
                                stroke="#0ea5e9" 
                                strokeWidth="1.5" 
                                opacity="0.4" 
                              />

                              <circle cx="120" cy="60" r="3" fill="#10b981" />
                              <text x="130" y="63" fill="#64748b" fontSize="8" fontFamily="sans-serif">Bang Sue HQ</text>

                              <circle cx="280" cy="110" r="3" fill="#10b981" />
                              <text x="290" y="113" fill="#64748b" fontSize="8" fontFamily="sans-serif">Sathorn Tower</text>
                            </svg>

                            {loc.coordinates && (() => {
                              const pos = getPinPos(loc.coordinates);
                              return (
                                <div 
                                  style={{
                                    position: 'absolute',
                                    left: pos.x,
                                    top: pos.y,
                                    transform: 'translate(-50%, -50%)',
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 30,
                                    height: 30
                                  }}
                                >
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      border: '2px solid #ef4444',
                                      animation: 'mapPinPulse 1.5s infinite ease-out',
                                      background: 'rgba(239, 68, 68, 0.15)'
                                    }}
                                  />
                                  <div 
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: '#ef4444',
                                      boxShadow: '0 0 8px #ef4444',
                                      border: '1.5px solid #fff'
                                    }}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                          
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <span style={{fontSize:11, color:'var(--text-muted)'}}>
                              พิกัด: <strong style={{color:'#f8fafc', fontFamily:'monospace'}}>{loc.coordinates || 'ไม่ได้ระบุ'}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveMapPickerIdx(null)}
                              className="btn btn-primary btn-sm"
                              style={{padding:'2px 8px', fontSize:11}}
                            >
                              ✓ ยืนยันตำแหน่ง
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end',borderTop:'1px solid var(--border)',paddingTop:16}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">✓ บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
