// ── NIS Service Platform Local Storage Database ────────────────────────

const defaultQuotations = [
  { 
    id:'QT-2023-112', customer:'TechVision Co., Ltd.', contact:'คุณวิชัย สมบูรณ์', phone:'02-111-2222', email:'wichai@techvision.co.th', date:'2023-10-24', due:'2023-11-07', status:'Draft', type:'Implement', value:850000, tags:['Firewall','Network'],
    items: [
      { id:1, name:'FortiGate 100F Next-Gen Firewall', sku:'FG-100F', qty:1, price:580000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:2, name:'FortiSwitch 124F-POE Managed Switch (24-port)', sku:'FS-124F-POE', qty:1, price:90000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:3, name:'Annual Maintenance (MA-Fortigate)', sku:'SVC-MA-FG', qty:1, price:180000, warranty:'1 ปี (Service)', type:'MA Service' }
    ]
  },
  { 
    id:'QT-2023-111', customer:'PTT Digital Solutions', contact:'คุณมาลี ใจดี', phone:'02-333-4444', email:'malee@pttdigital.com', date:'2023-10-22', due:'2023-11-05', status:'Approved', type:'MA-Fortigate', value:420000, tags:['Firewall'],
    items: [
      { id:1, name:'FortiAP 231F WiFi 6 Access Point', sku:'FAP-231F', qty:10, price:18000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:2, name:'FortiGate 60F Next-Gen Firewall', sku:'FG-60F', qty:1, price:120000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:3, name:'Installation & Configuration Service', sku:'SVC-INSTALL', qty:1, price:120000, warranty:'1 ปี (Service)', type:'Service' }
    ]
  },
  { 
    id:'QT-2023-110', customer:'KBank IT Division', contact:'คุณสมชาย ดีมาก', phone:'02-555-6666', email:'somchai@kbank.com', date:'2023-10-18', due:'2023-11-01', status:'Approved', type:'Runrate', value:285000, tags:['Server','Network'],
    items: [
      { id:1, name:'HP ProLiant DL360 Gen10 Server', sku:'HP-DL360-G10', qty:1, price:200000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:2, name:'Windows Server 2022 Standard (16 Core)', sku:'MS-WS22-STD', qty:1, price:85000, warranty:'-', type:'Software' }
    ]
  },
  { 
    id:'QT-2023-109', customer:'SCG Cement Co.', contact:'คุณอรทัย พรหม', phone:'02-777-8888', email:'orathai@scg.co.th', date:'2023-10-15', due:'2023-10-29', status:'Approved', type:'Implement', value:1200000, tags:['WiFi','Cable'],
    items: [
      { id:1, name:'Fiber Cabling and Rack Setup Service', sku:'SVC-FIBER', qty:1, price:600000, warranty:'1 ปี (Service)', type:'Service' },
      { id:2, name:'Cisco Catalyst 9300 24-Port Switch', sku:'CS-C9300-24P', qty:1, price:600000, warranty:'3 ปี (Vendor)', type:'Hardware' }
    ]
  },
  { 
    id:'QT-2023-108', customer:'Global Finance Group', contact:'คุณประสิทธิ์ ดี', phone:'02-999-0000', email:'prasit@globalfinance.com', date:'2023-10-12', due:'2023-10-26', status:'Approved', type:'MA-Network', value:360000, tags:['Network'],
    items: [
      { id:1, name:'Annual Maintenance Contract (Network Support)', sku:'SVC-MA-NET', qty:1, price:360000, warranty:'1 ปี (Service)', type:'MA Service' }
    ]
  },
  { 
    id:'QT-2023-107', customer:'Acme Corp Thailand', contact:'คุณนภา แก้ว', phone:'02-123-4567', email:'napa@acme.co.th', date:'2023-10-10', due:'2023-10-20', status:'Approved', type:'Runrate', value:95000, tags:['PC&Notebook'],
    items: [
      { id:1, name:'Dell Latitude 5430 Laptop', sku:'DELL-L5430', qty:2, price:47500, warranty:'3 ปี (Vendor)', type:'Hardware' }
    ]
  },
];

const defaultSalesOrders = [
  { 
    id:'SO-2023-099', quoteRef:'QT-2023-110', customer:'KBank IT Division', date:'2023-10-19', type:'Runrate', value:285000, status:'Delivered', project:'PRJ-2023-045',
    poNumber: 'PO-KB-2023-7741', poDate: '2023-10-18', poNote: 'อนุมัติสั่งซื้อผ่านระบบจัดซื้อของธนาคารกสิกรไทย จัดส่งด่วน',
    salesName: 'คุณวีระ ศรีสุข',
    items: [
      { id:1, name:'HP ProLiant DL360 Gen10 Server', sku:'HP-DL360-G10', qty:1, price:200000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:2, name:'Windows Server 2022 Standard (16 Core)', sku:'MS-WS22-STD', qty:1, price:85000, warranty:'-', type:'Software' }
    ]
  },
  { 
    id:'SO-2023-098', quoteRef:'QT-2023-109', customer:'SCG Cement Co.', date:'2023-10-16', type:'Implement', value:1200000, status:'In Progress', project:'PRJ-2023-044',
    poNumber: 'PO-SCG-2023-9988', poDate: '2023-10-15', poNote: 'รับ PO สำหรับโครงการติดตั้งระบบสายไฟเบอร์และสวิตช์หลักที่สำนักงานใหญ่',
    salesName: 'คุณวีระ ศรีสุข',
    items: [
      { id:1, name:'Fiber Cabling and Rack Setup Service', sku:'SVC-FIBER', qty:1, price:600000, warranty:'1 ปี (Service)', type:'Service' },
      { id:2, name:'Cisco Catalyst 9300 24-Port Switch', sku:'CS-C9300-24P', qty:1, price:600000, warranty:'3 ปี (Vendor)', type:'Hardware' }
    ]
  },
  { 
    id:'SO-2023-097', quoteRef:'QT-2023-108', customer:'Global Finance Group', date:'2023-10-13', type:'MA-Network', value:360000, status:'Project Open', project:'PRJ-2023-043',
    poNumber: 'PO-GF-2023-0145', poDate: '2023-10-12', poNote: 'สัญญาบริการบำรุงรักษาระบบเครือข่ายรายปี เริ่มให้บริการเดือนตุลาคม 2566',
    salesName: 'คุณสมศักดิ์ จันทร์ดี',
    items: [
      { id:1, name:'Annual Maintenance Contract (Network Support)', sku:'SVC-MA-NET', qty:1, price:360000, warranty:'1 ปี (Service)', type:'MA Service' }
    ]
  },
  { 
    id:'SO-2023-096', quoteRef:'QT-2023-107', customer:'Acme Corp Thailand', date:'2023-10-11', type:'Runrate', value:95000, status:'Closed', project:'PRJ-2023-042',
    poNumber: 'PO-ACME-2023-054', poDate: '2023-10-11', poNote: 'จัดส่งโน้ตบุ๊ค Dell จำนวน 2 เครื่องให้กับสาขาย่อยพระราม 9',
    salesName: 'คุณมุกดา เด่นดี',
    items: [
      { id:1, name:'Dell Latitude 5430 Laptop', sku:'DELL-L5430', qty:2, price:47500, warranty:'3 ปี (Vendor)', type:'Hardware' }
    ]
  },
  { 
    id:'SO-2023-095', quoteRef:'QT-2023-111', customer:'PTT Digital Solutions', date:'2023-10-05', type:'MA-Fortigate', value:420000, status:'In Progress', project:'PRJ-2023-041',
    poNumber: 'PO-PTTDS-2023-1102', poDate: '2023-10-04', poNote: 'PO ต่ออายุบริการ FortiAP และ FortiGate 60F พร้อมค่าติดตั้งและดูแลระบบ',
    salesName: 'คุณวีระ ศรีสุข',
    items: [
      { id:1, name:'FortiAP 231F WiFi 6 Access Point', sku:'FAP-231F', qty:10, price:18000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:2, name:'FortiGate 60F Next-Gen Firewall', sku:'FG-60F', qty:1, price:120000, warranty:'3 ปี (Vendor)', type:'Hardware' },
      { id:3, name:'Installation & Configuration Service', sku:'SVC-INSTALL', qty:1, price:120000, warranty:'1 ปี (Service)', type:'Service' }
    ]
  },
];

const defaultProjects = [
  { id:'PRJ-2023-044', name:'Implement FW & Network - SCG Cement HQ', customer:'SCG Cement Co.', type:'Implement', priority:'High', progress:65, status:'In Progress', startDate:'2023-10-16', endDate:'2023-12-31', staff:'Krit P.', soRef:'SO-2023-098', tags:['Firewall','Network','Cable'],
    contact: { name:'คุณอรทัย พรหม', phone:'02-777-8888', email:'orathai@scg.co.th' },
    salesPM: { name:'คุณวีระ ศรีสุข', nickname:'วี', phone:'089-999-1234', role:'Sales Manager' },
    engineer: { name:'นายกฤษฎ์ พิชิตกุล', nickname:'กฤษฎ์', phone:'081-222-3344' },
    location: 'อาคาร SCG Experience, ถ.พระราม 4, กรุงเทพฯ 10330',
    tickets:[
      {id:'TK-0091',title:'ติดตั้ง FortiGate 100F + FortiSwitch', status:'In Progress', assignee:'Krit P.', due:'2023-10-30', pct:70, ticketType:'Install'},
      {id:'TK-0092',title:'Config WiFi Access Points (4 จุด)', status:'Open', assignee:'Nok S.', due:'2023-11-05', accepted:false, pct:0, ticketType:'Install'},
      {id:'TK-0093',title:'PM รอบที่ 1 (เดือน 3)', status:'Pending', assignee:'-', due:'2024-01-15', pct:0, ticketType:'PM'},
    ]
  },
  { id:'PRJ-2023-043', name:'MA-Network Contract — Global Finance', customer:'Global Finance Group', type:'MA-Network', priority:'Medium', progress:25, status:'Active', startDate:'2023-10-13', endDate:'2024-10-12', staff:'Nok S.', soRef:'SO-2023-097', tags:['Network'],
    contact: { name:'คุณประสิทธิ์ ดี', phone:'02-999-0000', email:'prasit@globalfinance.com' },
    salesPM: { name:'คุณสมศักดิ์ จันทร์ดี', nickname:'ศักดิ์', phone:'085-111-2233', role:'Project Manager' },
    engineer: { name:'นางสาวนกยูง สายทอง', nickname:'นก', phone:'085-555-6677' },
    location: 'อาคาร Global Finance Tower, ถ.สาทร, กรุงเทพฯ 10120',
    tickets:[
      {id:'TK-0088',title:'สำรวจระบบ Network ครั้งที่ 1', status:'Done', assignee:'Nok S.', due:'2023-10-20', pct:100, ticketType:'MA'},
      {id:'TK-0090',title:'Onsite MA รอบที่ 1 (ต.ค.)', status:'In Progress', assignee:'Nok S.', due:'2023-10-31', pct:40, ticketType:'MA'},
      {id:'TK-0094',title:'Onsite MA รอบที่ 2 (พ.ย.)', status:'Pending', assignee:'-', due:'2023-11-30', pct:0, ticketType:'MA'},
    ]
  },
  { id:'PRJ-2023-041', name:'MA-Fortigate — PTT Digital Solutions', customer:'PTT Digital Solutions', type:'MA-Fortigate', priority:'High', progress:55, status:'Active', startDate:'2023-10-05', endDate:'2024-10-04', staff:'Krit P.', soRef:'SO-2023-095', tags:['Firewall'],
    contact: { name:'คุณมาลี ใจดี', phone:'02-333-4444', email:'malee@pttdigital.com' },
    salesPM: { name:'คุณวีระ ศรีสุข', nickname:'วี', phone:'089-999-1234', role:'Sales Manager' },
    engineer: { name:'นายกฤษฎ์ พิชิตกุล', nickname:'กฤษฎ์', phone:'081-222-3344' },
    location: 'อาคาร PTT Digital, ถ.วิภาวดีรังสิต, กรุงเทพฯ 10900',
    tickets:[
      {id:'TK-0085',title:'Config Backup (ต.ค.)', status:'Done', assignee:'Krit P.', due:'2023-10-31', pct:100, ticketType:'MA'},
      {id:'TK-0086',title:'Monthly Report (ต.ค.)', status:'In Progress', assignee:'Krit P.', due:'2023-11-05', accepted:false, pct:60, ticketType:'MA'},
    ]
  },
];

// ── NIS Warehouse Stock List (for Device Replacement) ──
const defaultNisStock = [
  { id:'STK-001', name:'FortiGate 60F', brand:'Fortinet', model:'FG-60F', sn:'FG60FT0001', qty:3, status:'Available' },
  { id:'STK-002', name:'FortiGate 100F', brand:'Fortinet', model:'FG-100F', sn:'FG100F0001', qty:2, status:'Available' },
  { id:'STK-003', name:'FortiSwitch 124F-POE', brand:'Fortinet', model:'FS-124F-POE', sn:'FS124P0001', qty:5, status:'Available' },
  { id:'STK-004', name:'FortiAP 231F', brand:'Fortinet', model:'FAP-231F', sn:'FAP231F0001', qty:8, status:'Available' },
  { id:'STK-005', name:'Cisco Catalyst 9300-24P', brand:'Cisco', model:'C9300-24P', sn:'CS9300P0001', qty:1, status:'Available' },
  { id:'STK-006', name:'HP ProLiant DL360 Gen10', brand:'HPE', model:'DL360-G10', sn:'HPDL360G01', qty:1, status:'Reserved' },
  { id:'STK-007', name:'UTP Cat6 Cable (305m)', brand:'AMP', model:'CAT6-305M', sn:'-', qty:12, status:'Available' },
  { id:'STK-008', name:'Fiber Patch Cord LC-LC SM 3m', brand:'Panduit', model:'FPC-LCLC-3M', sn:'-', qty:20, status:'Available' },
];

// ── Service Reports ──
const defaultServiceReports = [
  { id:'SR-2023-0001', ticketId:'TK-0088', projectId:'PRJ-2023-043', customer:'Global Finance Group', engineer:'Nok S.', date:'2023-10-20', type:'MA', summary:'สำรวจระบบ Network เสร็จสิ้น', status:'Closed' },
];

// ── NIS Sales Team ──
const defaultSalesTeam = [
  { id: 'SL-001', name: 'คุณวีระ ศรีสุข', nickname: 'วี', phone: '089-999-1234', email: 'weera.s@nis.co.th', role: 'Sales Manager', avatar: 'WS', target: 5000000, closedValue: 3850000, activeQuotes: 3 },
  { id: 'SL-002', name: 'คุณสมศักดิ์ จันทร์ดี', nickname: 'ศักดิ์', phone: '085-111-2233', email: 'somsak.c@nis.co.th', role: 'Project Manager / Account Lead', avatar: 'SC', target: 3000000, closedValue: 2400000, activeQuotes: 2 },
  { id: 'SL-003', name: 'คุณมุกดา เด่นดี', nickname: 'มุก', phone: '082-345-6789', email: 'mukda.d@nis.co.th', role: 'Senior Sales Executive', avatar: 'MD', target: 4000000, closedValue: 3100000, activeQuotes: 4 },
  { id: 'SL-004', name: 'คุณธวัชชัย รุ่งเรือง', nickname: 'ตั้ม', phone: '086-789-0123', email: 'thawatchai.r@nis.co.th', role: 'Account Manager', avatar: 'TR', target: 2000000, closedValue: 1200000, activeQuotes: 1 }
];

// ── Warranty Claims ──
const defaultClaims = [
  { id: 'CLM-2023-0001', ticketId: 'TK-0088', customer: 'Global Finance Group', salesName: 'คุณสมศักดิ์ จันทร์ดี', reporterStaff: 'นางสาวนกยูง สายทอง', brand: 'Cisco', model: 'C9300-24P', sn: 'CS9300P0001', warrantyStatus: 'on', date: '2023-10-20', status: 'Completed', detail: 'อุปกรณ์ค้างหน้าบูตและบอร์ดชำรุด สลับอุปกรณ์เปลี่ยนเรียบร้อย' }
];

const defaultClaimNotifications = [
  { id: 1, salesName: 'คุณสมศักดิ์ จันทร์ดี', customer: 'Global Finance Group', text: 'ตั๋วเคลมสินค้า CLM-2023-0001 ได้ถูกสร้างขึ้นแล้วสำหรับ Cisco Catalyst 9300 (อยู่ในประกัน)', time: '2023-10-20 10:30', isRead: true }
];

// Helper to initialize localStorage
const initDb = () => {
  if (!localStorage.getItem('nis_quotations')) {
    localStorage.setItem('nis_quotations', JSON.stringify(defaultQuotations));
  }
  if (!localStorage.getItem('nis_sales_orders')) {
    localStorage.setItem('nis_sales_orders', JSON.stringify(defaultSalesOrders));
  }
  if (!localStorage.getItem('nis_projects')) {
    localStorage.setItem('nis_projects', JSON.stringify(defaultProjects));
  }
  if (!localStorage.getItem('nis_stock')) {
    localStorage.setItem('nis_stock', JSON.stringify(defaultNisStock));
  }
  if (!localStorage.getItem('nis_service_reports')) {
    localStorage.setItem('nis_service_reports', JSON.stringify(defaultServiceReports));
  }
  if (!localStorage.getItem('nis_sales_team')) {
    localStorage.setItem('nis_sales_team', JSON.stringify(defaultSalesTeam));
  }
  if (!localStorage.getItem('nis_claims')) {
    localStorage.setItem('nis_claims', JSON.stringify(defaultClaims));
  }
  if (!localStorage.getItem('nis_claims_notifications')) {
    localStorage.setItem('nis_claims_notifications', JSON.stringify(defaultClaimNotifications));
  }
  if (!localStorage.getItem('nis_sr_sequence')) {
    localStorage.setItem('nis_sr_sequence', '1');
  }
  if (!localStorage.getItem('nis_claim_sequence')) {
    localStorage.setItem('nis_claim_sequence', '2');
  }

  // Automatic database migration for pending accept tickets demo
  try {
    const projStr = localStorage.getItem('nis_projects');
    if (projStr) {
      const projs = JSON.parse(projStr);
      let updated = false;
      const newProjs = projs.map(p => {
        const newTkList = p.tickets.map(t => {
          if (t.id === 'TK-0092' && t.accepted === undefined) {
            updated = true;
            return { ...t, accepted: false };
          }
          if (t.id === 'TK-0086' && t.accepted === undefined) {
            updated = true;
            return { ...t, accepted: false };
          }
          return t;
        });
        return { ...p, tickets: newTkList };
      });
      if (updated) {
        localStorage.setItem('nis_projects', JSON.stringify(newProjs));
      }
    }
  } catch (e) {
    console.error("Migration error:", e);
  }
};

// Initialize on load
initDb();

const safeGet = (key, defaultValue) => {
  initDb();
  const val = localStorage.getItem(key);
  if (!val || val === 'undefined' || val === 'null') {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
};

export const getQuotations = () => safeGet('nis_quotations', defaultQuotations);

export const saveQuotations = (data) => {
  localStorage.setItem('nis_quotations', JSON.stringify(data));
};

export const getSalesOrders = () => safeGet('nis_sales_orders', defaultSalesOrders);

export const saveSalesOrders = (data) => {
  localStorage.setItem('nis_sales_orders', JSON.stringify(data));
};

export const getProjects = () => {
  initDb();
  let projects = safeGet('nis_projects', defaultProjects);
  
  // Initialize PRJ-GENERAL if missing
  if (!projects.find(p => p.id === 'PRJ-GENERAL')) {
    projects.push({
      id: 'PRJ-GENERAL',
      name: 'ตั๋วบริการทั่วไป (General & Manual Tickets)',
      customer: 'งานทั่วไป / ไม่มีโครงการ',
      type: 'General',
      priority: 'Medium',
      progress: 100,
      status: 'Active',
      startDate: '2023-01-01',
      endDate: '2030-12-31',
      staff: '-',
      soRef: '-',
      tags: ['General'],
      contact: { name: 'ศูนย์บริการ NIS', phone: '02-123-4567', email: 'service@nis.co.th' },
      salesPM: { name: 'System', nickname: 'SYS', phone: '-', role: 'System' },
      engineer: { name: 'Unassigned', nickname: '-', phone: '-' },
      location: 'NIS Office / Remote',
      tickets: []
    });
    localStorage.setItem('nis_projects', JSON.stringify(projects));
  }

  // SANITIZE AND FORCE DEFAULTS FOR NEW FIELDS IF MISSING
  let updated = false;
  projects = projects.map(p => {
    let changed = false;
    
    // 1. check contact
    if (!p.contact || typeof p.contact === 'string') {
      p.contact = { name: (typeof p.contact === 'string' && p.contact ? p.contact.split(' — ')[0] : 'คุณอรทัย พรหม'), phone: '02-777-8888', email: 'orathai@scg.co.th' };
      changed = true;
    }
    
    // 2. check salesPM
    if (!p.salesPM) {
      if (p.id === 'PRJ-2023-043') {
        p.salesPM = { name: 'คุณสมศักดิ์ จันทร์ดี', nickname: 'ศักดิ์', phone: '085-111-2233', role: 'Project Manager' };
      } else {
        p.salesPM = { name: 'คุณวีระ ศรีสุข', nickname: 'วี', phone: '089-999-1234', role: 'Sales Manager' };
      }
      changed = true;
    }
    
    // 3. check engineer
    if (!p.engineer) {
      if (p.staff === 'Nok S.') {
        p.engineer = { name: 'นางสาวนกยูง สายทอง', nickname: 'นก', phone: '085-555-6677' };
      } else {
        p.engineer = { name: 'นายกฤษฎ์ พิชิตกุล', nickname: 'กฤษฎ์', phone: '081-222-3344' };
      }
      changed = true;
    }
    
    // 4. check location
    if (!p.location) {
      p.location = 'อาคาร SCG Experience, ถ.พระราม 4, กรุงเทพฯ 10330';
      changed = true;
    }

    // 5. sanitize tickets
    p.tickets = (p.tickets || []).map(t => {
      let tkChanged = false;
      if (t.requireCloseApproval === undefined) {
        t.requireCloseApproval = false;
        tkChanged = true;
      }
      if (t.rejectionReason === undefined) {
        t.rejectionReason = '';
        tkChanged = true;
      }
      if (tkChanged) changed = true;
      return t;
    });
    
    if (changed) updated = true;
    return p;
  });
  
  if (updated) {
    localStorage.setItem('nis_projects', JSON.stringify(projects));
  }
  return projects;
};

export const saveProjects = (data) => {
  localStorage.setItem('nis_projects', JSON.stringify(data));
};

export const addQuotation = (q) => {
  const list = getQuotations();
  list.unshift(q);
  saveQuotations(list);
};

export const addSalesOrder = (so) => {
  const list = getSalesOrders();
  list.unshift(so);
  saveSalesOrders(list);
};

export const addProject = (p) => {
  const list = getProjects();
  list.unshift(p);
  saveProjects(list);
};

// ── NIS Stock helpers ──
export const getNisStock = () => safeGet('nis_stock', defaultNisStock);

export const saveNisStock = (data) => {
  localStorage.setItem('nis_stock', JSON.stringify(data));
};

// ── Service Reports helpers ──
export const getServiceReports = () => safeGet('nis_service_reports', defaultServiceReports);

export const saveServiceReports = (data) => {
  localStorage.setItem('nis_service_reports', JSON.stringify(data));
};

export const getNextServiceReportNumber = () => {
  initDb();
  const seq = parseInt(localStorage.getItem('nis_sr_sequence') || '1');
  const year = new Date().getFullYear();
  const num = `SR-${year}-${String(seq).padStart(4, '0')}`;
  localStorage.setItem('nis_sr_sequence', String(seq + 1));
  return num;
};

export const addServiceReport = (report) => {
  const list = getServiceReports();
  list.unshift(report);
  saveServiceReports(list);
};

// ── Sales Team Helpers ──
export const getSalesTeam = () => safeGet('nis_sales_team', defaultSalesTeam);

export const saveSalesTeam = (data) => {
  localStorage.setItem('nis_sales_team', JSON.stringify(data));
};

// ── Claims Helpers ──
export const getClaims = () => {
  const claims = safeGet('nis_claims', defaultClaims);
  if (!claims || claims.length === 0) {
    saveClaims(defaultClaims);
    return defaultClaims;
  }
  return claims;
};

export const saveClaims = (data) => {
  localStorage.setItem('nis_claims', JSON.stringify(data));
};

export const getNextClaimNumber = () => {
  initDb();
  const seq = parseInt(localStorage.getItem('nis_claim_sequence') || '1');
  const year = new Date().getFullYear();
  const num = `CLM-${year}-${String(seq).padStart(4, '0')}`;
  localStorage.setItem('nis_claim_sequence', String(seq + 1));
  return num;
};

export const addClaim = (claim) => {
  const list = getClaims();
  list.unshift(claim);
  saveClaims(list);
};

export const getClaimNotifications = () => {
  const notifs = safeGet('nis_claims_notifications', defaultClaimNotifications);
  if (!notifs || notifs.length === 0) {
    saveClaimNotifications(defaultClaimNotifications);
    return defaultClaimNotifications;
  }
  return notifs;
};

export const saveClaimNotifications = (data) => {
  localStorage.setItem('nis_claims_notifications', JSON.stringify(data));
};

export const addClaimNotification = (notif) => {
  const list = getClaimNotifications();
  list.unshift(notif);
  saveClaimNotifications(list);
};

// ── System Config Helpers ──
const defaultSystemConfig = {
  jobTypes: ['Runrate','Implement','MA-Device','MA-Fortigate','MA-Software','MA-Network'],
  tags: ['Firewall','Network','WiFi','Server','CCTV','Access Control','PC&Notebook','Peripheral','Software','Cable','Windows Server','VMware','HyperV'],
  implementChecklist: [
    'ตรวจสอบรายการสินค้า / อุปกรณ์ครบถ้วน',
    'ดำเนินการ PreConfig อุปกรณ์ก่อนออกงาน',
    'ติดตั้ง Rack / ขึ้นแร็ค',
    'เดินสาย Fiber / UTP',
    'Config Network Address / VLAN',
    'Config ระบบ Firewall Policy',
    'ทดสอบการเชื่อมต่อ Internet / WAN',
    'ทดสอบ Internal Network',
    'จัดทำ Network Diagram ตาม AS-BUILT',
    'บันทึก IP / User / Password เข้าระบบ',
    'ส่งมอบงานและให้ลูกค้าเซ็นรับ',
  ],
  maChecklist: [
    'ตรวจสอบ Log / Event ย้อนหลัง',
    'ตรวจสอบ CPU / Memory / Disk Usage',
    'Update Firmware / Signature ล่าสุด',
    'ตรวจสอบ HA Cluster / Failover',
    'Remote Backup Config',
    'ทดสอบ Failover System',
    'บันทึกผลการตรวจสอบลง Monthly Report',
  ],
  pmChecklist: [
    'ทำความสะอาดอุปกรณ์ใน Rack',
    'ตรวจสอบสถานะ LED / Fan',
    'ตรวจสอบ Cable / Fiber Connection',
    'ตรวจสอบ Power Supply / UPS',
    'ตรวจสอบอุณหภูมิห้อง Server Room',
    'ทดสอบ Backup / Restore',
    'จัดทำ PM Report',
  ],
  slaOptions: ['8x5xNBD','8x5','24x7x4','24x7xNBD'],
  warningDays: { service: 60, product: 30 }
};

export const getSystemConfig = () => {
  initDb();
  const config = localStorage.getItem('nis_system_config');
  if (!config) {
    saveSystemConfig(defaultSystemConfig);
    return defaultSystemConfig;
  }
  try {
    return JSON.parse(config);
  } catch (err) {
    return defaultSystemConfig;
  }
};

export const saveSystemConfig = (data) => {
  localStorage.setItem('nis_system_config', JSON.stringify(data));
};

export const resetDb = () => {
  localStorage.setItem('nis_quotations', JSON.stringify(defaultQuotations));
  localStorage.setItem('nis_sales_orders', JSON.stringify(defaultSalesOrders));
  localStorage.setItem('nis_projects', JSON.stringify(defaultProjects));
  localStorage.setItem('nis_stock', JSON.stringify(defaultNisStock));
  localStorage.setItem('nis_service_reports', JSON.stringify(defaultServiceReports));
  localStorage.setItem('nis_sales_team', JSON.stringify(defaultSalesTeam));
  localStorage.setItem('nis_claims', JSON.stringify(defaultClaims));
  localStorage.setItem('nis_claims_notifications', JSON.stringify(defaultClaimNotifications));
  localStorage.setItem('nis_system_config', JSON.stringify(defaultSystemConfig));
  localStorage.setItem('nis_pending_tickets', JSON.stringify([]));
  localStorage.setItem('nis_staff_personal_checklists', JSON.stringify({}));
  localStorage.setItem('nis_sr_sequence', '1');
  localStorage.setItem('nis_claim_sequence', '2');
};

// ── Pending Tickets (Staff Requests) Helpers ──
export const getPendingTickets = () => {
  initDb();
  return safeGet('nis_pending_tickets', []);
};

export const savePendingTickets = (data) => {
  localStorage.setItem('nis_pending_tickets', JSON.stringify(data));
};

export const addPendingTicket = (ticket) => {
  const list = getPendingTickets();
  list.unshift(ticket);
  savePendingTickets(list);
};

// ── Staff Personal Checklists Helpers ──
export const getPersonalChecklists = () => {
  initDb();
  return safeGet('nis_staff_personal_checklists', {});
};

export const savePersonalChecklists = (data) => {
  localStorage.setItem('nis_staff_personal_checklists', JSON.stringify(data));
};

export const getChecklistByType = (type) => {
  const config = getSystemConfig();
  if (type === 'Install' || type === 'Implement') {
    return config.implementChecklist;
  }
  if (type === 'PM') {
    return config.pmChecklist;
  }
  if (type === 'MA Onsite' || type === 'MA' || type === 'Support') {
    return config.maChecklist;
  }
  // Fallbacks:
  if (type === 'Backup') {
    return [
      'ตรวจสอบสถานะงาน Backup ประจำวัน/สัปดาห์',
      'ทดสอบการดึงข้อมูลกลับคืนเพื่อยืนยันความสมบูรณ์ (Restore Test)',
      'ตรวจสอบความจุของสื่อบันทึกข้อมูลสำรอง',
      'ทำรายงานรายงานแจ้งผลการ Backup สำเร็จ'
    ];
  }
  if (type === 'Report') {
    return [
      'รวบรวมสถิติการใช้งานและปัญหาที่เกิดขึ้นในรอบช่วงเวลา',
      'จัดทำเอกสารวิเคราะห์แนวโน้มและสรุปข้อเสนอแนะ',
      'ส่งรายงานสรุปให้ทางผู้จัดการโครงการตรวจสอบและนำส่งลูกค้า'
    ];
  }
  return ['ตรวจสอบความเรียบร้อยหน้างาน', 'ส่งมอบรายงานผลงาน'];
};

export const PROJECT_SITES = {
  'PRJ-2023-044': [
    'อาคาร SCG Experience พระราม 4',
    'สำนักงานใหญ่ SCG บางซื่อ',
    'โรงงานปูนซีเมนต์ แก่งคอย',
    'คลังสินค้า SCG วังน้อย'
  ],
  'PRJ-2023-043': [
    'Global Finance Tower สาทร',
    'สาขารัชดาภิเษก',
    'สาขาเชียงใหม่',
    'สาขาชลบุรี'
  ],
  'PRJ-2023-041': [
    'อาคาร PTT Digital วิภาวดี',
    'ศูนย์พลังงานแห่งชาติ (PTT HQ)',
    'สำนักงานระยอง (โรงแยกก๊าซ)',
    'สำนักงานชลบุรี'
  ],
  'PRJ-GENERAL': [
    'NIS Office (สำนักงานใหญ่)',
    'Remote Support (ปฏิบัติงานทางไกล)',
    'Site ลูกค้าภายนอก (ระบุในรายละเอียด)'
  ]
};

const defaultCustomers = [
  {
    id: 'CUST-001',
    name: 'SCG Cement Co., Ltd.',
    taxId: '0105556123456',
    contacts: [
      { name: 'คุณอรทัย พรหม', phone: '02-777-8888', email: 'orathai@scg.co.th', role: 'IT Manager' },
      { name: 'คุณณัฐพล ใจดี', phone: '081-333-4455', email: 'nattapol@scg.co.th', role: 'Network Engineer' }
    ],
    locations: [
      { label: 'อาคาร SCG Experience พระราม 4', address: 'อาคาร SCG Experience, ถ.พระราม 4, กรุงเทพฯ 10330', coordinates: '13.7224, 100.5794', assignedStaff: ['Krit P.', 'Nok S.'] },
      { label: 'สำนักงานใหญ่ SCG บางซื่อ', address: '1 ถ.ปูนซิเมนต์ไทย, บางซื่อ, กรุงเทพฯ 10800', coordinates: '13.8038, 100.5381', assignedStaff: ['Krit P.'] },
      { label: 'โรงงานปูนซีเมนต์ แก่งคอย', address: '99 ม.5 ต.บ้านป่า, แก่งคอย, สระบุรี 18110', coordinates: '14.5872, 100.9983', assignedStaff: ['Pom T.'] },
      { label: 'คลังสินค้า SCG วังน้อย', address: '123 ม.3, วังน้อย, พระนครศรีอยุธยา 13170', coordinates: '14.2325, 100.7161', assignedStaff: ['Ann K.'] }
    ]
  },
  {
    id: 'CUST-002',
    name: 'Global Finance Group Co., Ltd.',
    taxId: '0105553987654',
    contacts: [
      { name: 'คุณประสิทธิ์ ดี', phone: '02-999-0000', email: 'prasit@globalfinance.com', role: 'Facility Lead' },
      { name: 'คุณสุนิสา สมบูรณ์', phone: '089-111-2222', email: 'sunisa@globalfinance.com', role: 'IT Support' }
    ],
    locations: [
      { label: 'Global Finance Tower สาทร', address: 'อาคาร Global Finance Tower, ถ.สาทร, กรุงเทพฯ 10120', coordinates: '13.7214, 100.5283', assignedStaff: ['Nok S.', 'Art W.'] },
      { label: 'สาขารัชดาภิเษก', address: '456 ถ.รัชดาภิเษก, ห้วยขวาง, กรุงเทพฯ 10310', coordinates: '13.7745, 100.5741', assignedStaff: ['Nok S.'] },
      { label: 'สาขาเชียงใหม่', address: '88 ถ.ห้วยแก้ว, ต.สุเทพ, อ.เมือง, เชียงใหม่ 50200', coordinates: '18.8028, 98.9664', assignedStaff: ['Pom T.'] },
      { label: 'สาขาชลบุรี', address: '12/3 ถ.สุขุมวิบัติ, ต.แสนสุข, อ.เมือง, ชลบุรี 20130', coordinates: '13.2915, 100.9135', assignedStaff: ['Art W.'] }
    ]
  },
  {
    id: 'CUST-003',
    name: 'PTT Public Company Limited',
    taxId: '0105551002003',
    contacts: [
      { name: 'คุณมาลี ใจดี', phone: '02-333-4444', email: 'malee@ptt.co.th', role: 'Support Coordinator' },
      { name: 'คุณธนากร แสนดี', phone: '082-999-8888', email: 'thanakorn.s@ptt.co.th', role: 'System Admin' }
    ],
    locations: [
      { label: 'อาคาร PTT Digital วิภาวดี', address: 'อาคาร PTT Digital, ถ.วิภาวดีรังสิต, กรุงเทพฯ 10900', coordinates: '13.8214, 100.5583', assignedStaff: ['Krit P.', 'Ann K.'] },
      { label: 'ศูนย์พลังงานแห่งชาติ (PTT HQ)', address: '555 ถ.วิภาวดีรังสิต, จตุจักร, กรุงเทพฯ 10900', coordinates: '13.8194, 100.5562', assignedStaff: ['Krit P.'] },
      { label: 'สำนักงานระยอง (โรงแยกก๊าซ)', address: '108 ถ.ปกรณ์ราชพฤกษ์, ต.ห้วยโป่ง, อ.เมือง, ระยอง 21150', coordinates: '12.7214, 101.1528', assignedStaff: ['Ann K.'] },
      { label: 'สำนักงานชลบุรี', address: '88/8 ม.4, ศรีราชา, ชลบุรี 20110', coordinates: '13.1624, 100.9312', assignedStaff: ['Art W.'] }
    ]
  },
  {
    id: 'CUST-GENERAL',
    name: 'งานทั่วไป / ไม่มีโครงการ',
    taxId: '0105550000000',
    contacts: [
      { name: 'ศูนย์บริการ NIS', phone: '02-123-4567', email: 'service@nis.co.th', role: 'Helpdesk' }
    ],
    locations: [
      { label: 'NIS Office (สำนักงานใหญ่)', address: '123 อาคาร NIS, ถ.ลาดพร้าว, จตุจักร, กรุงเทพฯ 10900', coordinates: '13.8052, 100.5694', assignedStaff: [] },
      { label: 'Remote Support (ปฏิบัติงานทางไกล)', address: 'ปฏิบัติงานผ่านอินเทอร์เน็ต', coordinates: '0, 0', assignedStaff: [] },
      { label: 'Site ลูกค้าภายนอก (ระบุในรายละเอียด)', address: 'อ้างอิงข้อมูลในรายละเอียดงาน', coordinates: '13.7563, 100.5018', assignedStaff: [] }
    ]
  }
];

export const MOCK_TAX_REGISTRY = {
  '0105556123456': {
    name: 'บริษัท เอสซีจี เคมิคอลส์ จำกัด (มหาชน)',
    address: '1 ถ.ปูนซิเมนต์ไทย, บางซื่อ, กรุงเทพฯ 10800',
    contacts: [
      { name: 'คุณอมรินทร์ สมหวัง', role: 'IT Procurement', phone: '02-586-1111', email: 'amarin@scg.co.th' }
    ],
    locations: [
      { label: 'สำนักงานใหญ่ SCG บางซื่อ', address: '1 ถ.ปูนซิเมนต์ไทย, บางซื่อ, กรุงเทพฯ 10800', coordinates: '13.8038, 100.5381', assignedStaff: ['Krit P.'] },
      { label: 'โรงงานมาบตาพุด', address: '2 ไอ-หนึ่ง ถนนไอ-หนึ่ง ต.มาบตาพุด อ.เมืองระยอง ระยอง 21150', coordinates: '12.6784, 101.1614', assignedStaff: ['Nok S.'] }
    ]
  },
  '0105553987654': {
    name: 'บริษัท โกลบอล ไฟแนนซ์ กรุ๊ป จำกัด',
    address: 'อาคาร Global Finance Tower, ถ.สาทร, กรุงเทพฯ 10120',
    contacts: [
      { name: 'คุณวิลาวรรณ แก้วดี', role: 'Office Coordinator', phone: '02-679-2233', email: 'wilawan@globalfinance.com' }
    ],
    locations: [
      { label: 'Global Finance Tower สาทร', address: 'อาคาร Global Finance Tower, ถ.สาทร, กรุงเทพฯ 10120', coordinates: '13.7214, 100.5283', assignedStaff: ['Nok S.', 'Art W.'] }
    ]
  },
  '0105551002003': {
    name: 'บริษัท ปตท. จำกัด (มหาชน)',
    address: '555 ถ.วิภาวดีรังสิต, จตุจักร, กรุงเทพฯ 10900',
    contacts: [
      { name: 'คุณศรายุทธ ปิติ', role: 'Procurement Specialist', phone: '02-537-1234', email: 'sarayuth.p@ptt.co.th' }
    ],
    locations: [
      { label: 'ศูนย์พลังงานแห่งชาติ (PTT HQ)', address: '555 ถ.วิภาวดีรังสิต, จตุจักร, กรุงเทพฯ 10900', coordinates: '13.8194, 100.5562', assignedStaff: ['Krit P.'] }
    ]
  }
};

export const getCustomers = () => safeGet('nis_customers', defaultCustomers);

export const saveCustomers = (data) => {
  localStorage.setItem('nis_customers', JSON.stringify(data));
};

export const getDynamicStaff = () => safeGet('nis_dynamic_staff', ['Krit P.', 'Nok S.', 'Pom T.', 'Ann K.', 'Art W.']);

export const saveDynamicStaff = (data) => {
  localStorage.setItem('nis_dynamic_staff', JSON.stringify(data));
};
