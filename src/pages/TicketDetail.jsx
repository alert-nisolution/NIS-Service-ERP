import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProjects, saveProjects, getNisStock, saveNisStock, getClaims, getNextServiceReportNumber, addServiceReport, addClaim, addClaimNotification, getNextClaimNumber, getChecklistByType } from '../mockDb';

// ── Signature Pad ──────────────────────────────────
function SignaturePad({ onSign }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [signed, setSigned] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDraw = (e) => { e.preventDefault(); setDrawing(true); lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setSigned(true);
  };
  const endDraw = () => { setDrawing(false); };
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setSigned(false); };
  const confirm = () => { if (signed) onSign(canvasRef.current.toDataURL()); };

  return (
    <div>
      <div style={{ border: '2px solid var(--border)', borderRadius: 10, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={520} height={180} style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, borderTop: '1px dashed #cbd5e1', margin: '0 20px', pointerEvents: 'none' }}>
          <span style={{ fontSize: 11, color: '#cbd5e1', background: '#fff', padding: '0 6px', position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)' }}>เซ็นชื่อที่นี่</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={clear}>ล้าง</button>
        <button className="btn btn-success btn-sm" onClick={confirm} disabled={!signed} style={{ opacity: signed ? 1 : .5 }}>
          ✓ ยืนยันลายเซ็น
        </button>
      </div>
    </div>
  );
}

const STAFF = [
  { name: 'Krit P.', skills: ['Firewall', 'Network'], color: '#6366f1' },
  { name: 'Nok S.', skills: ['Network', 'WiFi'], color: '#10b981' },
  { name: 'Pom T.', skills: ['Server', 'Windows AD'], color: '#f59e0b' },
  { name: 'Ann K.', skills: ['Software'], color: '#3b82f6' },
  { name: 'Art W.', skills: ['Support', 'PC&Notebook'], color: '#8b5cf6' },
];

const FLOW_STEPS = [
  { key: 'assigned', label: 'Assigned', icon: '📋' },
  { key: 'confirmed', label: 'Staff ยืนยัน', icon: '✅' },
  { key: 'checkin', label: 'Check-in หน้างาน', icon: '📍' },
  { key: 'working', label: 'ดำเนินการ', icon: '🔧' },
  { key: 'customer_sign', label: 'ลูกค้าเซ็นรับ', icon: '✍️' },
  { key: 'sent_email', label: 'ส่ง Email', icon: '📧' },
  { key: 'closed', label: 'ปิด Ticket', icon: '🔒' },
];

// Default checklists are loaded dynamically from mockDb using getChecklistByType

function TicketDetailContent({ id }) {
  const navigate = useNavigate();

  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [stockList, setStockList] = useState(() => getNisStock());
  const [claimsList, setClaimsList] = useState(() => getClaims());
  const [selectedStockId, setSelectedStockId] = useState('');
  const [withdrawQty, setWithdrawQty] = useState(1);
  const [withdrawPurpose, setWithdrawPurpose] = useState('ติดตั้งใหม่'); // 'ติดตั้งใหม่' | 'แก้ไข' | 'เตรียมไปเผื่อ' | 'ทดแทนอุปกรณ์ชำรุด'
  const [defectiveBrand, setDefectiveBrand] = useState('');
  const [defectiveModel, setDefectiveModel] = useState('');
  const [defectiveSn, setDefectiveSn] = useState('');
  const [defectivePhotos, setDefectivePhotos] = useState([]);
  const [gpsLocationSim, setGpsLocationSim] = useState(() => {
    const list = getProjects();
    for (const p of list) {
      const t = p.tickets.find(tk => tk.id === id);
      if (t) return t.gpsLocationSim || 'within_100m';
    }
    return 'within_100m';
  });

  // Find ticket and project in state list
  let dbPrj = null;
  let dbTk = null;
  for (const p of projectsList) {
    const t = p.tickets.find(tk => tk.id === id);
    if (t) {
      dbPrj = p;
      dbTk = t;
      break;
    }
  }

  const childTickets = dbPrj ? dbPrj.tickets.filter(t => t.parentTicketId === id) : [];
  const parentTicketObj = (dbPrj && dbTk && dbTk.parentTicketId) 
    ? dbPrj.tickets.find(t => t.id === dbTk.parentTicketId) 
    : null;

  const ticketInfo = {
    id: id || 'TK-0091',
    title: dbTk ? dbTk.title : 'ติดตั้ง FortiGate 100F + FortiSwitch — SCG Cement HQ',
    project: dbPrj ? dbPrj.id : 'PRJ-2023-044',
    projectName: dbPrj ? dbPrj.name : 'Implement FW & Network - SCG Cement HQ',
    customer: dbPrj ? dbPrj.customer : 'SCG Cement Co., Ltd.',
    contact: dbPrj ? dbPrj.contact : { name: 'คุณอรทัย พรหม', phone: '02-777-8888', email: 'orathai@scg.co.th' },
    location: dbTk && dbTk.location ? dbTk.location : (dbPrj ? dbPrj.location : 'อาคาร SCG Experience, ถ.พระราม 4, กรุงเทพฯ'),
    type: dbPrj ? dbPrj.type : 'Implement',
    priority: dbPrj ? dbPrj.priority : 'High',
    due: dbTk ? dbTk.due : '30 ต.ค. 2566',
    sla: dbPrj ? dbPrj.sla || '8x5xNBD' : '8x5xNBD',
    tags: dbPrj ? dbPrj.tags : ['Firewall', 'Network', 'Cable'],
    salesPM: dbPrj ? dbPrj.salesPM : { name: 'คุณวีระ ศรีสุข', nickname: 'วี', phone: '089-999-1234', role: 'Sales Manager' },
    engineer: dbPrj ? dbPrj.engineer : { name: 'นายกฤษฎ์ พิชิตกุล', nickname: 'กฤษฎ์', phone: '081-222-3344' }
  };

  const resolveTicketType = () => {
    if (!dbTk) return 'Install';
    
    // 1. Direct field checks
    let t = dbTk.ticketType || dbTk.type;
    if (t === 'MA Onsite') t = 'MA';
    if (t) return t;

    // 2. Name-based fallbacks (Title / ID matching)
    const title = dbTk.title || '';
    const id = dbTk.id || '';
    if (title.toUpperCase().includes('PM') || title.includes('Preventive') || id.toUpperCase().includes('PM')) {
      return 'PM';
    }
    if (title.toUpperCase().includes('MA') || title.includes('บำรุงรักษา') || id.toUpperCase().includes('MA')) {
      return 'MA';
    }

    // 3. Project type fallback
    if (dbPrj?.type?.includes('MA')) return 'MA';
    
    return 'Install';
  };

  const ticketType = resolveTicketType();

  const initialStaff = dbTk && dbTk.assignee !== '-' ? STAFF.find(s => s.name === dbTk.assignee) : null;

  const calculateFlowStep = (tk) => {
    if (!tk) return 0;
    if (tk.status === 'Closed' || tk.status === 'Done') return 6;
    if (tk.status === 'Waiting Close Approval') return 5;
    if (tk.signatureImg || tk.skipSignature) return 4;
    if (tk.checkOutTime || tk.workDetail || tk.checklist?.some(c => c.done)) return 3;
    if (tk.checkInTime) return 2;
    if (tk.accepted !== false && tk.assignee !== '-') return 1;
    return 0;
  };
  const initialFlowStep = calculateFlowStep(dbTk);

  // Unified States sync'd with Database
  const isReqClose = !!dbTk?.requireCloseApproval;
  const flowSteps = isReqClose ? [
    { key: 'assigned', label: 'Assigned', icon: '📋' },
    { key: 'confirmed', label: 'Staff ยืนยัน', icon: '✅' },
    { key: 'checkin', label: 'Check-in หน้างาน', icon: '📍' },
    { key: 'working', label: 'ดำเนินการ', icon: '🔧' },
    { key: 'customer_sign', label: 'ลูกค้าเซ็นรับ', icon: '✍️' },
    { key: 'waiting_approval', label: 'รออนุมัติปิดตั๋ว', icon: '🔒' },
    { key: 'closed', label: 'ปิด Ticket', icon: '✅' },
  ] : [
    { key: 'assigned', label: 'Assigned', icon: '📋' },
    { key: 'confirmed', label: 'Staff ยืนยัน', icon: '✅' },
    { key: 'checkin', label: 'Check-in หน้างาน', icon: '📍' },
    { key: 'working', label: 'ดำเนินการ', icon: '🔧' },
    { key: 'customer_sign', label: 'ลูกค้าเซ็นรับ', icon: '✍️' },
    { key: 'sent_email', label: 'ส่ง Email', icon: '📧' },
    { key: 'closed', label: 'ปิด Ticket', icon: '🔒' },
  ];

  const [flowStep, setFlowStep] = useState(initialFlowStep);
  const [assignedStaff, setAssignedStaff] = useState(initialStaff);
  const [showAssign, setShowAssign] = useState(false);

  const [checkInTime, setCheckInTime] = useState(dbTk?.checkInTime || '');
  const [checkOutTime, setCheckOutTime] = useState(dbTk?.checkOutTime || '');
  const [workDetail, setWorkDetail] = useState(dbTk?.workDetail || '');
  const [issueDetail, setIssueDetail] = useState(dbTk?.issueDetail || '');
  const [progress, setProgress] = useState(dbTk ? dbTk.pct : 0);
  const [signatureImg, setSignatureImg] = useState(dbTk?.signatureImg || null);
  const [emailSent, setEmailSent] = useState(dbTk?.status === 'Closed');
  const [closed, setClosed] = useState(dbTk ? (dbTk.status === 'Done' || dbTk.status === 'Closed') : false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [skipSignature, setSkipSignature] = useState(dbTk?.skipSignature || false);
  const [srNumber, setSrNumber] = useState(dbTk?.srNumber || '');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionText, setRejectionText] = useState('');

  const [checklist, setChecklist] = useState(() => {
    if (dbTk?.checklist && dbTk.checklist.length > 0) return dbTk.checklist;
    const items = getChecklistByType(ticketType);
    return items.map(label => ({ label, done: false }));
  });

  const [checkedOutItems, setCheckedOutItems] = useState(dbTk?.checkedOutItems || []);
  const [replacedDevice, setReplacedDevice] = useState(dbTk?.replacedDevice || { brand: '', model: '', sn: '' });
  const [stockDeducted, setStockDeducted] = useState(dbTk?.stockDeducted || false);
  const [showStockPicker, setShowStockPicker] = useState(false);

  const [damagedChecked, setDamagedChecked] = useState(dbTk?.damagedProduct?.checked || false);
  const [damagedWarranty, setDamagedWarranty] = useState(dbTk?.damagedProduct?.warranty || 'on');
  const [damagedInfo, setDamagedInfo] = useState(dbTk?.damagedProduct?.info || { brand: '', model: '', sn: '' });
  const [damagedPhoto, setDamagedPhoto] = useState(dbTk?.damagedProduct?.photo || false);

  const [othersChecked, setOthersChecked] = useState(dbTk?.others?.checked || false);
  const [othersList, setOthersList] = useState(dbTk?.others?.list || []);
  const [photos, setPhotos] = useState(dbTk?.photos || []);

  // Email dialogue state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(ticketInfo.contact?.email || 'orathai@scg.co.th');
  const [emailSubject, setEmailSubject] = useState(`[NIS Service Report] รายงานบริการ Onsite - ${ticketInfo.id}`);

  const [chat, setChat] = useState(() => dbPrj?.projectChat || dbTk?.chatHistory || [
    { from: 'SM (Somchai)', msg: 'Krit โปรดรับงานนี้ ลูกค้ารอนัดวันเข้า Onsite ครับ', time: '09:15' },
    { from: 'Sale (วี)', msg: 'ลูกค้าต้องการให้เสร็จก่อนวันศุกร์นี้ครับ', time: '09:30' }
  ]);
  const [chatRole, setChatRole] = useState('SM'); // 'SM' | 'Staff' | 'Sale'
  const [chatInput, setChatInput] = useState('');

  const donePct = checklist.length > 0 ? Math.round(checklist.filter(c => c.done).length / checklist.length * 100) : 0;

  const associatedClaims = useMemo(() => {
    return claimsList.filter(c => c.ticketId === id);
  }, [claimsList, id]);

  // DB Sync Helper
  const updateTicketInDb = (updatedFields) => {
    const list = getProjects();
    const newList = list.map(p => {
      const hasTk = p.tickets.find(t => t.id === ticketInfo.id);
      if (hasTk) {
        return {
          ...p,
          tickets: p.tickets.map(t => t.id === ticketInfo.id ? { ...t, ...updatedFields } : t)
        };
      }
      return p;
    });
    saveProjects(newList);
    setProjectsList(newList);
  };

  const updateProjectInDb = (updatedFields) => {
    const list = getProjects();
    const newList = list.map(p => {
      if (p.id === dbPrj?.id) {
        return {
          ...p,
          ...updatedFields
        };
      }
      return p;
    });
    saveProjects(newList);
    setProjectsList(newList);
  };

  const handleAssignStaff = (s) => {
    setAssignedStaff(s);
    setShowAssign(false);
    setFlowStep(1);
    updateTicketInDb({ assignee: s.name, status: 'In Progress' });
  };

  // Trigger Email dialog modal instead of sending immediately
  const handleOpenEmailDialog = () => {
    if (!srNumber) {
      const generatedSr = getNextServiceReportNumber();
      setSrNumber(generatedSr);
      updateTicketInDb({ srNumber: generatedSr });
    }
    setShowEmailModal(true);
  };

  const handleConfirmSendEmail = () => {
    setShowEmailModal(false);
    const finalSr = srNumber || getNextServiceReportNumber();
    if (!srNumber) setSrNumber(finalSr);

    // Add Service report in DB
    addServiceReport({
      id: finalSr,
      ticketId: ticketInfo.id,
      projectId: ticketInfo.project,
      customer: ticketInfo.customer,
      engineer: assignedStaff?.name || '-',
      date: new Date().toISOString().slice(0, 10),
      type: ticketType,
      summary: workDetail,
      status: 'Closed',
      emailSentTo: recipientEmail
    });

    // Create automatic claim tickets if damaged is selected
    if (damagedChecked) {
      const claimId = getNextClaimNumber();
      addClaim({
        id: claimId,
        ticketId: ticketInfo.id,
        customer: ticketInfo.customer,
        salesName: dbPrj?.salesPM?.name || 'คุณวีระ ศรีสุข',
        reporterStaff: ticketInfo.engineer?.name || 'นายกฤษฎ์ พิชิตกุล',
        brand: damagedInfo.brand,
        model: damagedInfo.model,
        sn: damagedInfo.sn,
        warrantyStatus: damagedWarranty,
        date: new Date().toISOString().slice(0, 10),
        status: 'Claim Received',
        detail: `แจ้งความชำรุดจากการปิดตั๋วงาน ${ticketInfo.id}`
      });

      addClaimNotification({
        id: Date.now(),
        salesName: dbPrj?.salesPM?.name || 'คุณวีระ ศรีสุข',
        customer: ticketInfo.customer,
        text: `ตั๋วเคลมสินค้า ${claimId} ถูกสร้างอัตโนมัติจากตั๋วงาน ${ticketInfo.id} (${damagedWarranty === 'on' ? 'อยู่ในประกัน' : 'หมดประกัน'})`,
        time: new Date().toLocaleString('th-TH'),
        isRead: false
      });
      setClaimsList(getClaims());
    }

    setEmailSent(true);
    setFlowStep(5);
    updateTicketInDb({
      status: 'Closed',
      pct: 100,
      emailSent: true,
      srNumber: finalSr,
      checkInTime,
      checkOutTime,
      workDetail,
      issueDetail,
      checklist,
      checkedOutItems,
      replacedDevice,
      stockDeducted,
      damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photo: damagedPhoto },
      others: { checked: othersChecked, list: othersList },
      signatureImg
    });

    setTimeout(() => {
      setClosed(true);
      setFlowStep(6);
    }, 2000);
  };

  const handleSign = (sig) => {
    setSignatureImg(sig);
    setShowSignPad(false);
    setFlowStep(4);
    updateTicketInDb({ signatureImg: sig });
  };

  const handleSubmitCloseRequest = () => {
    updateTicketInDb({
      status: 'Waiting Close Approval',
      rejectionReason: '',
      pct: 100
    });
    setFlowStep(5);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ส่งตรวจสอบสำเร็จ', message: 'ส่งคำขออนุมัติปิดตั๋วงานไปยัง Service Manager แล้ว', type: 'success' }
    }));
  };

  const handleSMRejectClose = () => {
    if (!rejectionText.trim()) return;
    const reason = rejectionText.trim();
    
    // Update ticket in DB
    updateTicketInDb({
      status: 'In Progress',
      rejectionReason: reason
    });

    // Add message to chat history
    const systemTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const updatedChat = [...chat, {
      from: 'SM (Somchai)',
      msg: `[ตีกลับคำขอปิดตั๋ว] เหตุผล: ${reason}`,
      time: systemTime
    }];
    setChat(updatedChat);
    updateProjectInDb({ projectChat: updatedChat });

    setShowRejectInput(false);
    setRejectionText('');
    setFlowStep(3); // Go back to working status

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ตีกลับตั๋วเรียบร้อย', message: 'ปฏิเสธคำขอปิดตั๋วและตีกลับให้ Staff ดำเนินการต่อ', type: 'warning' }
    }));
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    let senderName = 'SM (Somchai)';
    if (chatRole === 'Staff') {
      senderName = `Staff (${ticketInfo.engineer?.name || 'Krit P.'})`;
    } else if (chatRole === 'Sale') {
      senderName = `Sale (${ticketInfo.salesPM?.name || 'คุณวีระ ศรีสุข'})`;
    }

    const newMsg = {
      from: senderName,
      msg: chatInput.trim(),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChat = [...chat, newMsg];
    setChat(updatedChat);
    setChatInput('');
    updateProjectInDb({ projectChat: updatedChat });
  };

  // Checklist updates
  const handleChecklistToggle = (index) => {
    const updated = checklist.map((c, i) => i === index ? { ...c, done: !c.done } : c);
    setChecklist(updated);
    updateTicketInDb({ checklist: updated });
  };

  // Stock Selector for preparation (Withdraw form) — per-item workflow
  const handleAddSingleItem = (e) => {
    e.preventDefault();

    // 1. Validate selectedStockId
    if (!selectedStockId) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ถูกต้อง', message: 'กรุณาเลือกอุปกรณ์ที่ต้องการเบิก', type: 'error' }
      }));
      return;
    }

    // 2. Validate qty
    const qtyToWithdraw = Math.max(1, withdrawQty);

    // 3. Find the stock item
    const currentStock = getNisStock();
    const updatedStock = [...currentStock];
    const stockItemIndex = updatedStock.findIndex(s => s.id === selectedStockId);
    const stockItem = stockItemIndex > -1 ? updatedStock[stockItemIndex] : null;

    // 4. Check stock availability
    if (!stockItem || stockItem.qty < qtyToWithdraw) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'สต็อกไม่เพียงพอ', message: `สินค้า ${stockItem ? stockItem.name : selectedStockId} มีพร้อมส่งไม่เพียงพอ`, type: 'error' }
      }));
      return;
    }

    // 5. Deduct stock qty
    const newQty = stockItem.qty - qtyToWithdraw;
    updatedStock[stockItemIndex] = {
      ...stockItem,
      qty: newQty,
      status: newQty === 0 ? 'Out of Stock' : stockItem.status
    };

    // 6. Create item entry with purpose attached
    let newCheckedOut = [...(checkedOutItems || [])];
    const isReplacement = withdrawPurpose === 'ทดแทนอุปกรณ์ชำรุด';
    const itemDetails = {
      id: stockItem.id,
      name: stockItem.name,
      brand: stockItem.brand,
      model: stockItem.model,
      sn: stockItem.sn || '-',
      qtyOut: qtyToWithdraw,
      withdrawReason: withdrawPurpose,
      defectiveBrand: isReplacement ? defectiveBrand : '',
      defectiveModel: isReplacement ? defectiveModel : '',
      defectiveSn: isReplacement ? defectiveSn : '',
      defectivePhotos: isReplacement ? [...defectivePhotos] : []
    };

    // 7. Add to checkedOutItems (append; same item can appear multiple times with different purposes)
    newCheckedOut.push(itemDetails);

    saveNisStock(updatedStock);
    setStockList(updatedStock);
    setCheckedOutItems(newCheckedOut);
    setStockDeducted(true);
    updateTicketInDb({ checkedOutItems: newCheckedOut, stockDeducted: true });

    // 8. Reset form
    setSelectedStockId('');
    setWithdrawQty(1);
    setWithdrawPurpose('ติดตั้งใหม่');
    setDefectiveBrand('');
    setDefectiveModel('');
    setDefectiveSn('');
    setDefectivePhotos([]);

    // 9. Show success toast
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        title: 'เบิกอุปกรณ์สำเร็จ',
        message: `เบิก ${stockItem.name} จำนวน ${qtyToWithdraw} ชิ้น (${withdrawPurpose}) เรียบร้อยแล้ว`,
        type: 'success'
      }
    }));
  };

  const handleRemoveStock = (id) => {
    const itemToRemove = checkedOutItems.find(i => i.id === id);
    if (!itemToRemove) return;

    const currentStock = getNisStock();
    const updatedStock = currentStock.map(s => {
      if (s.id === id) {
        const newQty = s.qty + itemToRemove.qtyOut;
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

    const updated = checkedOutItems.filter(i => i.id !== id);
    setCheckedOutItems(updated);
    updateTicketInDb({ checkedOutItems: updated });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'ยกเลิกการเบิกของ', 
        message: `คืน ${itemToRemove.name} จำนวน ${itemToRemove.qtyOut} ชิ้น กลับคลังสินค้าสำเร็จ`, 
        type: 'info' 
      }
    }));
  };

  const handleDeductStock = () => {
    setStockDeducted(true);
    updateTicketInDb({ stockDeducted: true });
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ตัดคลังสำเร็จ', message: 'ตัดบัญชีอุปกรณ์ทดแทนออกจากคลัง NIS เรียบร้อย', type: 'success' }
    }));
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <style>{`
        .prep-card { background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
        .prep-title { font-family: 'Kanit', sans-serif; font-size: 15px; fontWeight: 800; color: #c2410c; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .stock-pick-btn { background: #ea580c; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .stock-pick-btn:hover { background: #d97706; }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="page-title">{ticketInfo.id}</div>
              {closed && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid #86efac' }}>✓ ปิดแล้ว</span>}
            </div>
            <div className="page-subtitle">{ticketInfo.title}</div>
          </div>
        </div>
        <div className="page-actions">
          {!assignedStaff && !closed && (
            <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
              Assign to Staff
            </button>
          )}
          {assignedStaff && !closed && (
            <span style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 600 }}>✓ Assigned → {assignedStaff.name}</span>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Assign Ticket to Staff</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{ticketInfo.id} — {ticketInfo.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {STAFF.map((s, i) => (
                <div key={i} onClick={() => handleAssignStaff(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.skills.join(' • ')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowAssign(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Flow Progress */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {flowSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  background: i < flowStep ? 'var(--secondary)' : i === flowStep ? 'var(--primary)' : 'var(--border)',
                  color: i <= flowStep ? '#fff' : 'var(--text-muted)', transition: 'all .3s'
                }}>
                  {i < flowStep ? '✓' : s.icon}
                </div>
                <span style={{
                  fontSize: 10.5, textAlign: 'center', whiteSpace: 'nowrap', fontWeight: i === flowStep ? 700 : 400,
                  color: i === flowStep ? 'var(--primary)' : i < flowStep ? 'var(--secondary)' : 'var(--text-muted)'
                }}>{s.label}</span>
              </div>
              {i < flowSteps.length-1 && (
                <div style={{ flex: 1, height: 2, margin: '0 4px', marginBottom: 18, background: i < flowStep ? 'var(--secondary)' : 'var(--border)', transition: 'background .3s' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project & Customer Details Card */}
      <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(to right, #f8fafc, #eff6ff)', border: '1.5px solid #d0e1fd' }}>
        <div style={{ fontFamily: 'Kanit, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          🏢 ข้อมูลโครงการและลูกค้า (Project & Customer Info)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 20, fontSize: 13 }}>
          {/* Column 1: Customer & Location */}
          <div>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>🏢 ข้อมูลลูกค้า</div>
            <div style={{ fontWeight: 850, color: 'var(--text)', marginBottom: 2 }}>{ticketInfo.customer}</div>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              <strong>โครงการ:</strong> {ticketInfo.projectName || dbPrj?.name || ticketInfo.title}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
              <strong>ที่ตั้ง (Location):</strong> {ticketInfo.location}
            </div>
          </div>
          {/* Column 2: Customer Contact */}
          <div>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>📞 ผู้ติดต่อหลัก</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{ticketInfo.contact?.name || 'ไม่ระบุผู้ติดต่อ'}</div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
              📱 {ticketInfo.contact?.phone || '-'}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              ✉️ {ticketInfo.contact?.email || '-'}
            </div>
          </div>
          {/* Column 3: Sales PM */}
          <div>
            <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>👔 Sales ผู้ดูแล (AM)</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>
              {ticketInfo.salesPM?.name || 'คุณวีระ ศรีสุข'} ({ticketInfo.salesPM?.nickname || 'วี'})
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
              📱 {ticketInfo.salesPM?.phone || '-'}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              💼 {ticketInfo.salesPM?.role || 'Sales Manager'}
            </div>
          </div>
        </div>
      </div>

      {/* MA Connection Panel */}
      {(parentTicketObj || childTickets.length > 0) && (
        <div className="card" style={{ padding: 20, marginBottom: 20, border: '1.5px solid #bfdbfe', background: '#eff6ff' }}>
          <div style={{ fontFamily: 'Kanit, sans-serif', fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            🔗 ความเชื่อมโยงตั๋วงาน MA ประจำเดือน (Monthly MA Linkage)
          </div>
          
          {parentTicketObj && (
            <div style={{ fontSize: 13, color: '#1e3a8a' }}>
              • ตั๋วงานนี้เป็น <strong>งานเพิ่มเติม/งานย่อย</strong> ภายใต้ตั๋วงาน MA หลักประจำเดือน: {' '}
              <Link 
                to={`/ticket/${parentTicketObj.id}`} 
                style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline' }}
                onClick={() => {
                  setTimeout(() => window.location.reload(), 50);
                }}
              >
                [{parentTicketObj.id}] {parentTicketObj.title}
              </Link>
            </div>
          )}

          {childTickets.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#1e3a8a', fontWeight: 600, marginBottom: 6 }}>
                • ตั๋วหลักใบนี้มี <strong>งานเพิ่มเติมย่อยที่เกี่ยวข้อง</strong> ดังนี้:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                {childTickets.map(child => (
                  <div key={child.id} style={{ fontSize: 12.5 }}>
                    - <strong style={{color:'var(--secondary)'}}>[{child.id}]</strong> {child.title} (สถานะ: <strong style={{color:'#d97706'}}>{child.status}</strong>) - {' '}
                    <Link 
                      to={`/ticket/${child.id}`} 
                      style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}
                      onClick={() => {
                        setTimeout(() => window.location.reload(), 50);
                      }}
                    >
                      เปิดดูใบงานย่อย
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket Info */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="card-header" style={{ padding: '0 0 12px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}><div className="card-title" style={{ fontFamily: 'Kanit, sans-serif', fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>ข้อมูล Ticket</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['ลูกค้า', ticketInfo.customer],
              ['ผู้ติดต่อ', `${ticketInfo.contact?.name || '-'} | โทร: ${ticketInfo.contact?.phone || '-'} | เมล: ${ticketInfo.contact?.email || '-'}`],
              ['สถานที่ติดตั้ง', ticketInfo.location],
              ['Sales ผู้ดูแล', `${ticketInfo.salesPM?.name || '-'} (${ticketInfo.salesPM?.nickname || '-'}) | โทร: ${ticketInfo.salesPM?.phone || '-'}`],
              ['Project', ticketInfo.project],
              ['ประเภทงาน', ticketInfo.type],
              ['SLA', ticketInfo.sla],
              ['กำหนดส่ง', ticketInfo.due],
              ['Priority', ticketInfo.priority]
            ].map(([k, v], i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: '9px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Tags</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ticketInfo.tags.map(t => <span key={t} style={{ background: 'var(--primary-bg)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{t}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Left */}
        <div>
          {/* Back-office Preparation Card */}
          {assignedStaff && !closed && (
            <div className="prep-card">
              <div className="prep-title">📦 ข้อมูลหลังบ้าน: เตรียมอุปกรณ์ก่อนออกเดินทาง (Back-office Spares Preparation)</div>
              
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', display: 'block', marginBottom: 6 }}>
                  1. เบิกพัสดุจากคลังสินค้า NIS (Withdraw NIS Stock)
                </label>
                <form onSubmit={handleAddSingleItem} style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #fed7aa', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#7c2d12', fontWeight: 600, display: 'block', marginBottom: 6 }}>เลือกพัสดุจากคลัง NIS ทีละรายการ แล้วกด "เพิ่ม"</div>

                  {/* Step 1: Item Dropdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: '#78350f', display: 'block', marginBottom: 2 }}>เลือกอุปกรณ์</label>
                      <select
                        value={selectedStockId}
                        onChange={e => { setSelectedStockId(e.target.value); setWithdrawQty(1); }}
                        style={{ width: '100%', fontSize: 11, padding: 6, border: '1px solid #fed7aa', borderRadius: 4, background: '#fff', fontFamily: 'Prompt, sans-serif' }}
                      >
                        <option value="">-- เลือกอุปกรณ์ --</option>
                        {stockList.filter(s => s.qty > 0).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.brand} {s.model}) - S/N: {s.sn || '-'} (คงเหลือ: {s.qty})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#78350f', display: 'block', marginBottom: 2 }}>จำนวน</label>
                      <input
                        type="number"
                        min="1"
                        max={(() => { const s = stockList.find(s => s.id === selectedStockId); return s ? s.qty : 1; })()}
                        value={withdrawQty}
                        onChange={e => {
                          const max = (() => { const s = stockList.find(st => st.id === selectedStockId); return s ? s.qty : 1; })();
                          setWithdrawQty(Math.min(max, Math.max(1, parseInt(e.target.value) || 1)));
                        }}
                        style={{ width: '100%', fontSize: 11, padding: 6, border: '1px solid #fed7aa', borderRadius: 4, fontFamily: 'Prompt, sans-serif', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Step 2: Purpose Selector (4 options) */}
                  <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, border: '1px solid #fde68a', marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#b45309', display: 'block', marginBottom: 6 }}>
                      🎯 วัตถุประสงค์ / สาเหตุการเบิกพัสดุ
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                      {['ติดตั้งใหม่', 'แก้ไข', 'เตรียมไปเผื่อ', 'ทดแทนอุปกรณ์ชำรุด'].map(purpose => (
                        <label key={purpose} style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#78350f' }}>
                          <input
                            type="radio"
                            name="withdrawPurpose"
                            value={purpose}
                            checked={withdrawPurpose === purpose}
                            onChange={() => setWithdrawPurpose(purpose)}
                            style={{ width: 'auto' }}
                          />
                          {purpose}
                        </label>
                      ))}
                    </div>

                    {/* Defective fields — only when purpose is ทดแทนอุปกรณ์ชำรุด */}
                    {withdrawPurpose === 'ทดแทนอุปกรณ์ชำรุด' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, borderTop: '1px dashed #fcd34d', paddingTop: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                          <div>
                            <label style={{ fontSize: 10, color: '#78350f', display: 'block', marginBottom: 2 }}>ยี่ห้อชำรุด</label>
                            <input
                              placeholder="เช่น Cisco"
                              value={defectiveBrand}
                              onChange={e => setDefectiveBrand(e.target.value)}
                              style={{ fontSize: 11, padding: 6, width: '100%', boxSizing: 'border-box', border: '1px solid #fcd34d', borderRadius: 4 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: '#78350f', display: 'block', marginBottom: 2 }}>รุ่นชำรุด</label>
                            <input
                              placeholder="เช่น C9300-24P"
                              value={defectiveModel}
                              onChange={e => setDefectiveModel(e.target.value)}
                              style={{ fontSize: 11, padding: 6, width: '100%', boxSizing: 'border-box', border: '1px solid #fcd34d', borderRadius: 4 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, color: '#78350f', display: 'block', marginBottom: 2 }}>S/N ชำรุด</label>
                            <input
                              placeholder="เช่น CS9300P01"
                              value={defectiveSn}
                              onChange={e => setDefectiveSn(e.target.value)}
                              style={{ fontSize: 11, padding: 6, width: '100%', boxSizing: 'border-box', border: '1px solid #fcd34d', borderRadius: 4 }}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#78350f', display: 'block', marginBottom: 4 }}>
                            📷 แนบรูปถ่ายสินค้าชำรุด (เลือกได้มากกว่า 1 รูป)
                          </label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            {defectivePhotos.map((img, idx) => (
                              <div key={idx} style={{ position: 'relative', width: 50, height: 50, border: '1px solid #d97706', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="defective product" />
                                <button
                                  type="button"
                                  onClick={() => setDefectivePhotos(prev => prev.filter((_, i) => i !== idx))}
                                  style={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 14,
                                    height: 14,
                                    fontSize: 8,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => document.getElementById('defective-photos-file-input').click()}
                              style={{
                                width: 50,
                                height: 50,
                                border: '2px dashed #d97706',
                                borderRadius: 6,
                                background: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#d97706',
                                gap: 2
                              }}
                            >
                              <span style={{ fontSize: 14 }}>+</span>
                              <span style={{ fontSize: 8 }}>เลือกรูป</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const mockImages = [
                                  'https://images.unsplash.com/photo-1597872200969-2b6c9f50a414?w=150',
                                  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=150',
                                  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=150'
                                ];
                                const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
                                setDefectivePhotos(prev => [...prev, randomImg]);
                              }}
                              style={{
                                padding: '3px 6px',
                                fontSize: 9.5,
                                borderRadius: 4,
                                border: '1px solid #d97706',
                                background: '#fff',
                                color: '#d97706',
                                cursor: 'pointer',
                                height: 22,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              📷 จำลองรูป
                            </button>

                            <input
                              id="defective-photos-file-input"
                              type="file"
                              multiple
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const files = Array.from(e.target.files);
                                files.forEach(file => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setDefectivePhotos(prev => [...prev, reader.result]);
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: 11.5, padding: '7px 0', background: '#ea580c', border: 'none', height: 30, justifyContent: 'center' }}
                  >
                    ➕ เพิ่ม
                  </button>
                </form>

                {checkedOutItems.length > 0 ? (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                    <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: 6, textAlign: 'left' }}>พัสดุที่เบิก</th>
                          <th style={{ padding: 6, textAlign: 'left' }}>S/N</th>
                          <th style={{ padding: 6, textAlign: 'center' }}>จำนวน</th>
                          <th style={{ padding: 6, textAlign: 'left' }}>วัตถุประสงค์</th>
                          <th style={{ padding: 6, textAlign: 'center' }}>ลบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkedOutItems.map((item, idx) => (
                          <tr key={`${item.id}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 6px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
                              {item.withdrawReason === 'ทดแทนอุปกรณ์ชำรุด' && (
                                <div style={{ fontSize: 10.5, color: '#475569', background: '#fffbeb', border: '1px solid #fcd34d', padding: 6, borderRadius: 6, marginTop: 4 }}>
                                  <div><strong>อุปกรณ์ที่ทดแทน:</strong> {item.defectiveBrand} {item.defectiveModel}</div>
                                  <div>S/N ที่ชำรุด: {item.defectiveSn || '-'}</div>
                                  {item.defectivePhotos && item.defectivePhotos.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                      {item.defectivePhotos.map((pUrl, pidx) => (
                                        <img
                                          key={pidx}
                                          src={pUrl}
                                          style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                                          alt="Damaged device"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 6px', color: '#64748b', fontFamily: 'monospace' }}>{item.sn}</td>
                            <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700 }}>{item.qtyOut}</td>
                            <td style={{ padding: '8px 6px' }}>
                              <span style={{ fontSize: 10.5, color: '#f97316', fontWeight: 600 }}>{item.withdrawReason}</span>
                            </td>
                            <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                              <button onClick={() => handleRemoveStock(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: stockDeducted ? '#16a34a' : '#ea580c' }}>
                        {stockDeducted ? '✅ ตัดคลังสินค้า NIS แล้ว' : '⏳ รอการตัดบัญชีคลังสินค้า'}
                      </span>
                      {!stockDeducted && (
                        <button onClick={handleDeductStock} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>ตัดบัญชีสต็อก</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', fontSize: 11.5, color: '#9a3412', marginTop: 4 }}>*ยังไม่มีของที่เบิกสำหรับตั๋วงานนี้</div>
                )}
              </div>

              {/* Defective claim device */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12, borderTop: '1px solid #fed7aa', paddingTop: 12 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#c2410c', cursor: 'pointer' }}>
                    <input type="checkbox" checked={damagedChecked} onChange={e => { setDamagedChecked(e.target.checked); updateTicketInDb({ damagedProduct: { checked: e.target.checked, warranty: damagedWarranty, info: damagedInfo, photo: damagedPhoto } }); }} style={{ width: 'auto' }} />
                    สินค้าชำรุด (Damaged Product)
                  </label>
                  {damagedChecked && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 10 }}>
                      <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="radio" name="claim_w" checked={damagedWarranty === 'on'} onChange={() => { setDamagedWarranty('on'); updateTicketInDb({ damagedProduct: { checked: damagedChecked, warranty: 'on', info: damagedInfo, photo: damagedPhoto } }); }} style={{ width: 'auto' }} /> ในประกัน
                      </label>
                      <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="radio" name="claim_w" checked={damagedWarranty === 'off'} onChange={() => { setDamagedWarranty('off'); updateTicketInDb({ damagedProduct: { checked: damagedChecked, warranty: 'off', info: damagedInfo, photo: damagedPhoto } }); }} style={{ width: 'auto' }} /> นอกประกัน
                      </label>
                    </div>
                  )}
                </div>

                {damagedChecked && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                      <input placeholder="ยี่ห้อ" value={damagedInfo.brand} onChange={e => { const inf = { ...damagedInfo, brand: e.target.value }; setDamagedInfo(inf); updateTicketInDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: inf, photo: damagedPhoto } }); }} style={{ fontSize: 11, padding: 4 }} />
                      <input placeholder="รุ่น" value={damagedInfo.model} onChange={e => { const inf = { ...damagedInfo, model: e.target.value }; setDamagedInfo(inf); updateTicketInDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: inf, photo: damagedPhoto } }); }} style={{ fontSize: 11, padding: 4 }} />
                      <input placeholder="SN" value={damagedInfo.sn} onChange={e => { const inf = { ...damagedInfo, sn: e.target.value }; setDamagedInfo(inf); updateTicketInDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: inf, photo: damagedPhoto } }); }} style={{ fontSize: 11, padding: 4 }} />
                    </div>
                      <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#7c2d12' }}>
                        <input type="checkbox" checked={damagedPhoto} onChange={e => { setDamagedPhoto(e.target.checked); updateTicketInDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photo: e.target.checked } }); }} style={{ width: 'auto' }} />
                        📷 แนบภาพถ่ายสินค้าชำรุดเรียบร้อย
                      </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warranty Claims Associated with this Ticket */}
          {associatedClaims.length > 0 && (
            <div className="card" style={{ padding: 18, marginBottom: 20, borderTop: '3px solid #7c3aed' }}>
              <div style={{ fontFamily: 'Kanit, sans-serif', fontSize: 15, fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                🛡️ ใบแจ้งเคลมและประกันสินค้า (Warranty Claims)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {associatedClaims.map(claim => (
                  <div key={claim.id} style={{ background: '#f9f5ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, color: '#7c3aed' }}>Claim ID: {claim.id}</span>
                      <span style={{ 
                        fontSize: 10.5, 
                        fontWeight: 700, 
                        color: claim.status === 'Completed' ? '#15803d' : (claim.status === 'Rejected' ? '#ef4444' : '#1d4ed8'),
                        background: claim.status === 'Completed' ? '#dcfce7' : (claim.status === 'Rejected' ? '#fee2e2' : '#eff6ff'),
                        padding: '2px 8px',
                        borderRadius: 20
                      }}>
                        {claim.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div><strong>อุปกรณ์:</strong> {claim.brand} {claim.model}</div>
                      <div><strong>S/N:</strong> {claim.sn}</div>
                      <div><strong>ผู้แจ้งเคลม:</strong> {claim.reporterStaff || '-'}</div>
                      <div><strong>Sales ผู้ดูแล:</strong> {claim.salesName || '-'}</div>
                      <div><strong>สิทธิ์รับประกัน:</strong> {claim.warrantyStatus === 'on' ? 'อยู่ในประกัน (In Warranty)' : 'หมดประกัน (Expired)'}</div>
                      <div><strong>วันที่แจ้ง:</strong> {claim.date}</div>
                    </div>
                    {claim.detail && (
                      <div style={{ fontSize: 12, marginTop: 8, background: '#fff', padding: 8, borderRadius: 6, border: '1px dashed #ddd6fe', color: '#5b21b6' }}>
                        <strong>รายละเอียดเคลม:</strong> {claim.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PM: Rack Photos & Devices for Back-office Review */}
          {ticketType === 'PM' && (
            <div className="card" style={{ padding: 18, marginBottom: 20, borderTop: '3px solid #0891b2' }}>
              <div style={{ fontFamily: 'Kanit, sans-serif', fontSize: 15, fontWeight: 800, color: '#0891b2', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                📸 รายละเอียดตู้ Rack / อุปกรณ์ และรูปถ่ายดำเนินงาน (Preventive Maintenance)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ticketInfo.rackPhotos && ticketInfo.rackPhotos.length > 0 ? (
                  ticketInfo.rackPhotos.map((rp, i) => (
                    <div key={rp.id || i} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
                        🖥️ อุปกรณ์ / ตู้ Rack: {rp.name}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                        <div style={{ fontSize: 11.5, color: '#475569', background: '#fff', padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          <strong>📍 สถานที่:</strong> {rp.location || '-'}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#475569', background: '#fff', padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          <strong>📝 หมายเหตุ:</strong> {rp.remark || 'ไม่มี'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {/* Before Photo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 6, padding: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>📸 ก่อนดำเนินงาน (Before)</span>
                          {rp.beforePhoto ? (
                            <img src={rp.beforePhoto} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} alt="Before" />
                          ) : (
                            <div style={{ width: 120, height: 80, background: '#f1f5f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>
                              (ไม่มีรูปถ่าย)
                            </div>
                          )}
                        </div>

                        {/* After Photo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: 6, padding: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>📸 หลังดำเนินงาน (After)</span>
                          {rp.afterPhoto ? (
                            <img src={rp.afterPhoto} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} alt="After" />
                          ) : (
                            <div style={{ width: 120, height: 80, background: '#f1f5f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>
                              (ไม่มีรูปถ่าย)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '20px 0', border: '1px dashed #cbd5e1', borderRadius: 8, background: '#f8fafc' }}>
                    ยังไม่มีข้อมูลรูปถ่ายตู้ Rack หรืออุปกรณ์ ในตั๋วงานนี้
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Onsite Service Form */}
          {assignedStaff && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">📍 Onsite Service Report (ส่วนช่างหน้างาน)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="mini-avatar" style={{ background: assignedStaff.color, width: 28, height: 28, fontSize: 11 }}>{assignedStaff.name.charAt(0)}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{assignedStaff.name}</span>
                </div>
              </div>
              <div className="card-body">
                {/* GPS Geofence Location Display */}
                <div style={{ background: '#f0fdf4', border: '1px solid #b7ebc6', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📍 พิกัดสถานที่ Checking (GPS Location)</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600 }}>
                    🌐 13.8055, 100.5376 (ระยะห่างจากโครงการ: 15 เมตร)
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
                    สถานที่: <strong>{ticketInfo.location || '-'}</strong> (อยู่ในระยะปฏิบัติงานปกติ)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label>เวลา Check-in</label>
                    <input type="datetime-local" value={checkInTime} onChange={e => {
                      if (gpsLocationSim === 'far_away') {
                        window.dispatchEvent(new CustomEvent('show-toast', {
                          detail: {
                            title: 'พิกัด GPS นอกขอบเขต',
                            message: '❌ ไม่สามารถ Check-in ได้ เนื่องจากอยู่ห่างจาก Location โครงการ เกิน 100 เมตร (จำลอง: 2.5 กม.)',
                            type: 'error'
                          }
                        }));
                        return;
                      }
                      setCheckInTime(e.target.value); 
                      updateTicketInDb({ checkInTime: e.target.value, status: 'In Progress' }); 
                      if (flowStep < 2) setFlowStep(2);
                    }} />
                  </div>
                  <div>
                    <label>เวลา Check-out</label>
                    <input type="datetime-local" value={checkOutTime} onChange={e => {
                      if (gpsLocationSim === 'far_away') {
                        window.dispatchEvent(new CustomEvent('show-toast', {
                          detail: {
                            title: 'พิกัด GPS นอกขอบเขต',
                            message: '❌ ไม่สามารถ Check-out ได้ เนื่องจากอยู่ห่างจาก Location โครงการ เกิน 100 เมตร (จำลอง: 2.5 กม.)',
                            type: 'error'
                          }
                        }));
                        return;
                      }
                      setCheckOutTime(e.target.value); 
                      updateTicketInDb({ checkOutTime: e.target.value }); 
                      if (flowStep < 3) setFlowStep(3);
                    }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>รายละเอียดการดำเนินงาน / วิธีแก้ปัญหา</label>
                    <textarea value={workDetail} onChange={e => { setWorkDetail(e.target.value); updateTicketInDb({ workDetail: e.target.value }); }} rows="4"
                      placeholder="อธิบายสิ่งที่ดำเนินการ วิธีแก้ปัญหา และผลลัพธ์..." style={{ resize: 'vertical' }} />
                  </div>
                </div>

                {/* Checklist */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ marginBottom: 0 }}>Checklist การดำเนินงาน</label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: donePct === 100 ? 'var(--secondary)' : 'var(--primary)' }}>{donePct}% เสร็จสิ้น</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${donePct}%`, height: '100%', background: donePct === 100 ? 'var(--secondary)' : 'var(--primary)', borderRadius: 4, transition: 'width .3s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {checklist.map((c, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: c.done ? '#f0fdf4' : 'var(--bg)', borderRadius: 8, cursor: 'pointer', fontWeight: 400, textTransform: 'none', fontSize: 13, letterSpacing: 0, border: `1px solid ${c.done ? '#86efac' : 'var(--border)'}` }}>
                        <input type="checkbox" checked={c.done} onChange={() => handleChecklistToggle(i)} style={{ width: 'auto', accentColor: 'var(--secondary)', flexShrink: 0 }} />
                        <span style={{ color: c.done ? '#15803d' : 'var(--text)', textDecoration: c.done ? 'line-through' : '' }}>{i + 1}. {c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* รายการเพิ่มเติม อื่นๆ */}
                <div style={{ marginBottom: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <input type="checkbox" checked={othersChecked} onChange={e => { setOthersChecked(e.target.checked); updateTicketInDb({ others: { checked: e.target.checked, list: othersList } }); }} style={{ width: 'auto' }} />
                    เพิ่ม Case Support
                  </label>
                  
                  {othersChecked && (
                    <div style={{ marginTop: 8, background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                      {othersList.length === 0 ? (
                        <div style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--text-muted)' }}>ไม่มีรายการ Case Support (เจ้าหน้าที่เทคนิคไม่ได้ระบุบน iPad หรือกดเพิ่มด้านล่าง)</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                          {othersList.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12.5 }}>
                              <div>
                                <strong>{idx + 1}. [{item.category}]</strong> ผู้แจ้ง: {item.reporter}
                                <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>• ปัญหา: {item.problem}</div>
                                <div style={{ color: 'var(--secondary)', marginTop: 1 }}>• แก้ไข: {item.solution}</div>
                                {item.startTime && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>⏳ {item.startTime} - {item.endTime}</div>}
                              </div>
                              <button type="button" onClick={() => {
                                const up = othersList.filter(x => x.id !== item.id);
                                  setOthersList(up);
                                  updateTicketInDb({ others: { checked: othersChecked, list: up } });
                              }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Form to add item in back-office if needed */}
                      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginTop: 10 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>➕ เพิ่ม Case Support (แมนนวล):</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input id="bo_rep" placeholder="ผู้แจ้ง..." style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }} />
                          <select id="bo_cat" style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                            <option value="Hardware">Hardware</option>
                            <option value="Software">Software</option>
                            <option value="Network">Network</option>
                            <option value="Cabling">Cabling</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <textarea id="bo_prob" placeholder="ระบุปัญหา..." rows={1} style={{ fontSize: 12, padding: '4px 8px', width: '100%', boxSizing: 'border-box', borderRadius: 4, border: '1px solid var(--border)' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <textarea id="bo_sol" placeholder="วิธีแก้ปัญหา..." rows={1} style={{ fontSize: 12, padding: '4px 8px', width: '100%', boxSizing: 'border-box', borderRadius: 4, border: '1px solid var(--border)' }} />
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => {
                          const rep = document.getElementById('bo_rep').value;
                          const cat = document.getElementById('bo_cat').value;
                          const prob = document.getElementById('bo_prob').value;
                          const sol = document.getElementById('bo_sol').value;
                          if (!rep || !prob || !sol) {
                            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
                            return;
                          }
                          const newItem = { id: Date.now(), reporter: rep, category: cat, problem: prob, solution: sol, startTime: '', endTime: '' };
                          const up = [...othersList, newItem];
                          setOthersList(up);
                          updateTicketInDb({ others: { checked: othersChecked, list: up } });
                          document.getElementById('bo_rep').value = '';
                          document.getElementById('bo_prob').value = '';
                          document.getElementById('bo_sol').value = '';
                        }}>
                          เพิ่มรายการ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              {dbTk?.rejectionReason && dbTk?.status !== 'Waiting Close Approval' && !closed && (
                <div style={{ margin: '14px 22px', padding: '12px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fca5a5', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5, textAlign: 'left' }}>
                    <strong>คำขอปิดตั๋วถูกส่งกลับ/ปฏิเสธโดยผู้จัดการ:</strong>
                    <div style={{ marginTop: 4, fontStyle: 'italic', padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #fca5a5', fontWeight: 600 }}>
                      "{dbTk.rejectionReason}"
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12 }}>กรุณาทำการแก้ไขข้อมูลหรือปฏิบัติงานเพิ่มเติมตามคอมเมนต์ จากนั้นกดส่งตรวจสอบอีกครั้ง</div>
                  </div>
                </div>
              )}

              {/* Closure Actions */}
              {(signatureImg || skipSignature) && !closed && (
                <>
                  {isReqClose ? (
                    dbTk?.status === 'Waiting Close Approval' ? (
                      <div style={{ padding: '20px 22px', borderTop: '2.5px solid var(--primary)', background: '#eff6ff', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>ส่งคำขอปิด Ticket เรียบร้อยแล้ว</div>
                        <div style={{ fontSize: 13, color: '#1e40af', marginTop: 4 }}>
                          ตั๋วงานนี้กำลังรอการตรวจสอบและอนุมัติปิดตั๋วโดย Service Manager
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: '#f5f3ff' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {skipSignature ? 'ข้ามขั้นตอนลงนามลูกค้าเรียบร้อย' : 'ลูกค้าเซ็นรับงานแล้ว'} — ต้องส่งตรวจสอบเพื่อปิด Ticket
                        </div>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderColor: '#4f46e5' }} 
                          onClick={handleSubmitCloseRequest}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
                          ส่งตรวจสอบและขออนุมัติปิด Ticket
                        </button>
                      </div>
                    )
                  ) : (
                    !emailSent && (
                      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: '#f0fdf4' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {skipSignature ? 'ข้ามขั้นตอนลงนามลูกค้าเรียบร้อย' : 'ลูกค้าเซ็นรับงานแล้ว'} — กดส่ง Email สรุปงานเพื่อปิด Ticket
                        </div>
                        <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleOpenEmailDialog}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                          ส่ง Service Report Email ให้ลูกค้า → Auto Close Ticket
                        </button>
                      </div>
                    )
                  )}
                </>
              )}

              {/* SM Approvals panel inside Ticket Detail */}
              {chatRole === 'SM' && dbTk?.status === 'Waiting Close Approval' && !closed && (
                <div style={{ padding: '16px 22px', borderTop: '2px solid var(--primary)', background: '#eff6ff', borderRadius: '0 0 12px 12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', marginBottom: 6, textAlign: 'left' }}>🔒 เมนูอนุมัติสำหรับ Service Manager</div>
                  <div style={{ fontSize: 12.5, color: '#1e40af', marginBottom: 12, textAlign: 'left' }}>
                    คำขอปิดตั๋วรอการอนุมัติของคุณ ตรวจสอบรายละเอียดงานและลายเซ็นลูกค้า จากนั้นกดอนุมัติหรือตีกลับด้านล่าง:
                  </div>
                  {showRejectInput ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, textAlign: 'left' }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>ระบุเหตุผลการตีกลับ / ให้แก้ไข:</label>
                      <textarea 
                        rows={2} 
                        value={rejectionText} 
                        onChange={e => setRejectionText(e.target.value)} 
                        placeholder="เช่น ขาดรูปถ่ายพอร์ตเชื่อมต่อ, ตรวจสอบ IP config อีกครั้ง..." 
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', boxSizing:'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setShowRejectInput(false); setRejectionText(''); }}>ยกเลิก</button>
                        <button className="btn btn-danger btn-sm" onClick={handleSMRejectClose} disabled={!rejectionText.trim()} style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>✓ ยืนยันตีกลับงาน</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button 
                        className="btn btn-success" 
                        style={{ flex: 1, justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }}
                        onClick={handleOpenEmailDialog}
                      >
                        ✓ อนุมัติการปิด Ticket
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ flex: 1, justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                        onClick={() => setShowRejectInput(true)}
                      >
                        ✕ ปฏิเสธและตีกลับตั๋ว
                      </button>
                    </div>
                  )}
                </div>
              )}

              {emailSent && !closed && (
                <div style={{ padding: '16px 22px', borderTop: '1px solid var(--secondary)', background: '#f0fdf4', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--secondary)' }}>📧 กำลังส่ง Email... Auto Close Ticket ภายใน 2 วินาที</div>
                </div>
              )}

              {closed && (
                <div style={{ padding: '20px 22px', borderTop: '2px solid var(--secondary)', background: '#f0fdf4', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#15803d' }}>Ticket ปิดแล้ว!</div>
                  <div style={{ fontSize: 13, color: '#15803d', marginTop: 4 }}>
                    ✅ ส่ง Email สรุปงานไปยัง <strong>{recipientEmail}</strong> สำเร็จ<br />
                    ✅ ออกเอกสารรายงานเลขที่ <strong>{srNumber}</strong><br />
                    ✅ Auto Close Ticket — {new Date().toLocaleString('th')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Timeline */}
          <div className="card">
            <div className="card-header"><div className="card-title">Timeline สถานะ</div></div>
            <div className="card-body">
              <div className="timeline">
                {(isReqClose ? [
                  { title: 'สร้าง Ticket (Auto)', sub: `จาก Project ${ticketInfo.project}`, date: '', color: '#6366f1', done: true },
                  { title: 'Assigned → ' + (assignedStaff?.name || 'รอ Assign'), sub: 'by Service Manager', date: assignedStaff ? '' : '', color: assignedStaff ? '#10b981' : '#e2e8f0', done: !!assignedStaff },
                  { title: 'Check-in หน้างาน', sub: checkInTime ? `Check-in แล้ว` : 'ยังไม่ได้ Check-in', date: checkInTime || '', color: checkInTime ? '#f59e0b' : '#e2e8f0', done: !!checkInTime },
                  { title: 'ดำเนินการ Onsite', sub: `${progress}% เสร็จสิ้น`, date: '', color: progress > 0 ? '#3b82f6' : '#e2e8f0', done: progress === 100 },
                  { title: 'ลูกค้าเซ็นรับงาน', sub: skipSignature ? 'ยกเว้นการเซ็น' : (signatureImg ? 'เซ็นแล้ว' : 'รอลายเซ็น'), date: '', color: (signatureImg || skipSignature) ? '#10b981' : '#e2e8f0', done: !!signatureImg || skipSignature },
                  { title: 'รออนุมัติปิดตั๋ว', sub: dbTk?.status === 'Waiting Close Approval' ? 'ส่งคำขอแล้ว รอตรวจรับ' : (dbTk?.status === 'Closed' ? 'อนุมัติแล้ว' : 'รอดำเนินการ'), date: '', color: (dbTk?.status === 'Waiting Close Approval' || dbTk?.status === 'Closed' || dbTk?.status === 'Done') ? '#6366f1' : '#e2e8f0', done: dbTk?.status === 'Waiting Close Approval' || dbTk?.status === 'Closed' || dbTk?.status === 'Done' },
                  { title: 'ปิด Ticket', sub: closed ? `รหัส SR: ${srNumber}` : 'รอดำเนินการ', date: '', color: closed ? '#10b981' : '#e2e8f0', done: closed },
                ] : [
                  { title: 'สร้าง Ticket (Auto)', sub: `จาก Project ${ticketInfo.project}`, date: '', color: '#6366f1', done: true },
                  { title: 'Assigned → ' + (assignedStaff?.name || 'รอ Assign'), sub: 'by Service Manager', date: assignedStaff ? '' : '', color: assignedStaff ? '#10b981' : '#e2e8f0', done: !!assignedStaff },
                  { title: 'Check-in หน้างาน', sub: checkInTime ? `Check-in แล้ว` : 'ยังไม่ได้ Check-in', date: checkInTime || '', color: checkInTime ? '#f59e0b' : '#e2e8f0', done: !!checkInTime },
                  { title: 'ดำเนินการ Onsite', sub: `${progress}% เสร็จสิ้น`, date: '', color: progress > 0 ? '#3b82f6' : '#e2e8f0', done: progress === 100 },
                  { title: 'ลูกค้าเซ็นรับงาน', sub: skipSignature ? 'ยกเว้นการเซ็น' : (signatureImg ? 'เซ็นแล้ว' : 'รอลายเซ็น'), date: '', color: (signatureImg || skipSignature) ? '#10b981' : '#e2e8f0', done: !!signatureImg || skipSignature },
                  { title: 'ส่ง Email / Auto Close', sub: closed ? `รหัส SR: ${srNumber}` : 'รอดำเนินการ', date: '', color: closed ? '#10b981' : '#e2e8f0', done: closed },
                ]).map((t, i) => (
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

          {/* Chat */}
          <div className="card">
            <div className="card-header"><div className="card-title">💬 Chat ในทีม</div></div>
            <div style={{ padding: '0 12px 12px', maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chat.map((c, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)' }}>{c.from}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-light)' }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{c.msg}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ส่งในนาม:</span>
                <select value={chatRole} onChange={e => setChatRole(e.target.value)} style={{ padding: '2px 4px', fontSize: 11, width: 'auto', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <option value="SM">Service Manager (Somchai)</option>
                  <option value="Staff">Engineer ({dbTk?.assignee !== '-' ? dbTk?.assignee : 'Krit P.'})</option>
                  <option value="Sale">Sales PM ({ticketInfo.salesPM?.name || 'คุณวีระ ศรีสุข'})</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="พิมพ์ข้อความคุยในกลุ่มโครงการ..." style={{ flex: 1, fontSize: 13 }}
                  onKeyDown={e => { if (e.key === 'Enter') sendChat(); }} />
                <button className="btn btn-primary btn-sm" onClick={sendChat}>ส่ง</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Send Confirmation Modal */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 460, boxShadow: '0 25px 65px rgba(0,0,0,.25)', fontFamily: 'Prompt, sans-serif' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 4, fontFamily: 'Kanit, sans-serif' }}>📧 ยืนยันการส่งรายงาน Onsite Report</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>ระบุและตรวจสอบอีเมลปลายทางสำหรับการจัดส่ง Service Report เอกสารเลขที่: {srNumber}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>อีเมลผู้รับ (To):</label>
                <input 
                  type="email" 
                  value={recipientEmail} 
                  onChange={e => setRecipientEmail(e.target.value)} 
                  style={{ width: '100%', marginTop: 4, fontSize: 13 }} 
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>หัวข้อเมล (Subject):</label>
                <input 
                  type="text" 
                  value={emailSubject} 
                  onChange={e => setEmailSubject(e.target.value)} 
                  style={{ width: '100%', marginTop: 4, fontSize: 13 }} 
                  required
                />
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 11.5, border: '1px solid #e2e8f0', color: 'var(--text-muted)' }}>
                💡 <strong>รายละเอียดที่จะแนบในอีเมล:</strong> ไฟล์ PDF สรุปการเข้าบริการ Onsite Service Report พร้อมประวัติเช็คลิสต์ ลายเซ็นลูกค้า และรายการพัสดุอะไหล่ NIS ที่เปลี่ยนทดแทน
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifycontent: 'flex-end', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>ยกเลิก</button>
              <button className="btn btn-success" onClick={handleConfirmSendEmail}>✓ ยืนยันส่ง Email & ปิดงาน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  return <TicketDetailContent key={id} id={id} />;
}
