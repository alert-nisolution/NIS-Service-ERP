import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addProject, getSalesOrders, saveSalesOrders, getQuotations, getSystemConfig } from '../mockDb';

const steps = ['ข้อมูลโครงการ','ประเภทงาน & เงื่อนไข','Checklist & เอกสาร','ยืนยัน & Auto Ticket'];

export default function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const soRefParam = searchParams.get('soRef') || '';

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState([]);

  // Form state initialized dynamically based on soRef
  const [form, setForm] = useState(() => {
    const defaultForm = {
      name: '', customer: 'SCG Cement Co., Ltd.', contact: 'คุณอรทัย พรหมสุข',
      email: 'orathai@scg.co.th',
      salesPMName: 'คุณวีระ ศรีสุข',
      phone: '02-xxx-xxxx', location: 'อาคาร SCG Experience, ถ.พระราม 4, กรุงเทพฯ',
      soRef: soRefParam, priority: 'High',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      jobCategory: 'Implement',
      jobType: 'Implement',
    };

    if (soRefParam) {
      const orders = getSalesOrders();
      const matchedSO = orders.find(so => so.id === soRefParam);
      if (matchedSO) {
        const quotes = getQuotations();
        const matchedQuote = quotes.find(q => q.id === matchedSO.quoteRef);
        return {
          name: `Project: Install ${matchedSO.type} — ${matchedSO.customer}`,
          customer: matchedSO.customer,
          contact: matchedQuote ? matchedQuote.contact : 'คุณติดต่อหลัก',
          email: 'contact@customer.com',
          salesPMName: matchedSO.salesName || 'คุณวีระ ศรีสุข',
          phone: matchedQuote ? matchedQuote.phone : '02-xxx-xxxx',
          location: 'หน้างานสำนักงานลูกค้า',
          soRef: soRefParam,
          priority: 'High',
          startDate: matchedSO.date || new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
          jobCategory: matchedSO.type,
          jobType: matchedSO.type
        };
      }
    }
    return defaultForm;
  });

  // Conditions
  const [cond, setCond] = useState({
    serviceYears: '1', onsitePerYear: '4', pmPerYear: '4',
    sla: '8x5xNBD', serviceReplacement: 'company',
    remoteBackup: '4', monthlyReport: '4', monthlyReportDay: '5',
    deliveryType: 'onsite_install', deliveryBy: 'nis_team',
  });

  const config = getSystemConfig();
  const allTags = config.tags || [];
  const jobTypes = config.jobTypes || [];

  // Checklist
  const [checklist, setChecklist] = useState(() => config.implementChecklist || []);

  useEffect(() => {
    const sysConfig = getSystemConfig();
    if (form.jobCategory === 'Implement' || form.jobCategory === 'Runrate') {
      setChecklist(sysConfig.implementChecklist || []);
    } else if (form.jobCategory.startsWith('MA')) {
      setChecklist(sysConfig.maChecklist || []);
    } else if (form.jobCategory === 'PM') {
      setChecklist(sysConfig.pmChecklist || []);
    } else {
      setChecklist(sysConfig.implementChecklist || []);
    }
  }, [form.jobCategory]);

  const [selectedTags, setSelectedTags] = useState(() => {
    if (soRefParam) {
      const orders = getSalesOrders();
      const matchedSO = orders.find(so => so.id === soRefParam);
      if (matchedSO) {
        const quotes = getQuotations();
        const matchedQuote = quotes.find(q => q.id === matchedSO.quoteRef);
        if (matchedQuote && matchedQuote.tags) return matchedQuote.tags;
      }
    }
    return ['Firewall','Network','Cable'];
  });
  const [customCheck, setCustomCheck] = useState('');

  const toggleTag = t => setSelectedTags(s => s.includes(t) ? s.filter(x=>x!==t) : [...s,t]);

  const isMA = form.jobCategory.startsWith('MA');

  const getAutoTickets = () => {
    const tickets = [];
    const onsite = parseInt(cond.onsitePerYear) || 4;
    const pm = parseInt(cond.pmPerYear) || 4;
    const backup = parseInt(cond.remoteBackup) || 4;
    const report = parseInt(cond.monthlyReport) || 4;

    if (form.jobCategory === 'Implement') {
      tickets.push({ id:'TK-AUTO-001', title:'ติดตั้งและ Config อุปกรณ์ — ' + (form.name||'โครงการใหม่'), type:'Install', assignTo:'Service Manager', status:'Pending Assign', color:'#6366f1' });
      for(let i=1;i<=pm;i++) tickets.push({ id:`TK-AUTO-PM-00${i}`, title:`PM รอบที่ ${i} — ทุก ${12/pm} เดือน`, type:'PM', assignTo:'Service Manager', status:'Scheduled', color:'#10b981' });
    } else if (isMA) {
      for(let i=1;i<=onsite;i++) tickets.push({ id:`TK-AUTO-MA-${String(i).padStart(2,'0')}`, title:`Onsite MA รอบที่ ${i} — ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][i-1]||'เดือนที่ '+i}`, type:'MA Onsite', assignTo:'Service Manager', status:'Scheduled', color:'#6366f1' });
      for(let i=1;i<=pm;i++) tickets.push({ id:`TK-AUTO-PM-${String(i).padStart(2,'0')}`, title:`Preventive Maintenance รอบที่ ${i}`, type:'PM', assignTo:'Service Manager', status:'Scheduled', color:'#10b981' });
      for(let i=1;i<=backup;i++) tickets.push({ id:`TK-AUTO-BAK-${String(i).padStart(2,'0')}`, title:`Remote Backup Config รอบที่ ${i}`, type:'Backup', assignTo:'Service Manager', status:'Scheduled', color:'#f59e0b' });
      for(let i=1;i<=report;i++) tickets.push({ id:`TK-AUTO-RPT-${String(i).padStart(2,'0')}`, title:`Monthly Report รอบที่ ${i} — ส่งภายในวันที่ ${cond.monthlyReportDay}`, type:'Report', assignTo:'Service Manager', status:'Scheduled', color:'#3b82f6' });
    } else {
      tickets.push({ id:'TK-AUTO-DLV-001', title:'จัดส่งสินค้า / Delivery — ' + (form.name||'โครงการ'), type:'Delivery', assignTo:'Service Manager', status:'Pending Assign', color:'#8b5cf6' });
    }
    return tickets;
  };

  const typeColors = {'Install':'#6366f1','PM':'#10b981','MA Onsite':'#6366f1','Backup':'#f59e0b','Report':'#3b82f6','Delivery':'#8b5cf6'};

  const handleSelectSO = (soId) => {
    if (!soId) {
      setForm(prev => ({ ...prev, soRef: '', name: '', customer: '' }));
      return;
    }
    const orders = getSalesOrders();
    const matchedSO = orders.find(so => so.id === soId);
    if (matchedSO) {
      const quotes = getQuotations();
      const matchedQuote = quotes.find(q => q.id === matchedSO.quoteRef);
      setForm(prev => ({
        ...prev,
        name: `Project: Install ${matchedSO.type} — ${matchedSO.customer}`,
        customer: matchedSO.customer,
        contact: matchedQuote ? matchedQuote.contact : 'คุณติดต่อหลัก',
        email: 'contact@customer.com',
        salesPMName: matchedSO.salesName || 'คุณวีระ ศรีสุข',
        phone: matchedQuote ? matchedQuote.phone : '02-xxx-xxxx',
        soRef: soId,
        jobCategory: matchedSO.type,
        jobType: matchedSO.type
      }));
      if (matchedQuote && matchedQuote.tags) {
        setSelectedTags(matchedQuote.tags);
      }
    }
  };

  const handleGenerate = () => {
    setGenerating(true);
    const tickets = getAutoTickets();
    setGeneratedTickets(tickets);

    const newPrjId = `PRJ-2023-0${Math.floor(45 + Math.random() * 50)}`;
    const newPrj = {
      id: newPrjId,
      name: form.name || 'โครงการใหม่',
      customer: form.customer,
      type: form.jobCategory,
      priority: form.priority,
      progress: 0,
      status: 'In Progress',
      startDate: form.startDate,
      endDate: form.endDate,
      staff: 'Somchai M.',
      soRef: form.soRef || '-',
      tags: selectedTags,
      contact: {
        name: form.contact || 'คุณอรทัย พรหมสุข',
        phone: form.phone || '02-xxx-xxxx',
        email: form.email || 'orathai@scg.co.th'
      },
      salesPM: {
        name: form.salesPMName || 'คุณวีระ ศรีสุข',
        nickname: 'วี',
        phone: '089-999-1234',
        role: 'Sales Manager'
      },
      engineer: {
        name: 'นายกฤษฎ์ พิชิตกุล',
        nickname: 'กฤษฎ์',
        phone: '081-222-3344'
      },
      location: form.location || 'อาคาร SCG Experience, ถ.พระราม 4, กรุงเทพฯ',
      tickets: tickets.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status === 'Scheduled' ? 'Pending' : 'Open',
        assignee: '-',
        due: form.endDate,
        pct: 0,
        ticketType: t.type
      }))
    };

    addProject(newPrj);

    // Update Sales Order back-link and status to In Progress
    if (form.soRef && form.soRef !== '-') {
      const soList = getSalesOrders();
      const updatedSOList = soList.map(so => {
        if (so.id === form.soRef) {
          return {
            ...so,
            project: newPrjId,
            status: 'In Progress'
          };
        }
        return so;
      });
      saveSalesOrders(updatedSOList);
    }

    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'สร้าง Project ใหม่', message: `สร้างโครงการ ${newPrj.name} (${newPrjId}) สำเร็จ และบันทึกลง SO เรียบร้อย!`, type: 'success' }
      }));
    }, 1800);
  };

  return (
    <div style={{maxWidth:900,margin:'0 auto'}}>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={() => navigate('/projects')} style={{width:36,height:36,border:'1px solid var(--border)',background:'var(--surface)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text-muted)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <div className="page-title">เปิด Project ใหม่</div>
            <div className="page-subtitle">กำหนดเงื่อนไขงานและระบบจะ Auto Generate Tickets หลังจากเปิด SO</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card" style={{padding:'16px 24px',marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center'}}>
          {steps.map((s,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',flex:1}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,cursor:'pointer'}} onClick={()=>!generated&&setStep(i)}>
                <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,
                  background:i<step?'var(--secondary)':i===step?'var(--primary)':'var(--border)',
                  color:i<=step?'#fff':'var(--text-muted)',transition:'all .2s'}}>
                  {i<step?'✓':i+1}
                </div>
                <span style={{fontSize:11.5,fontWeight:i===step?700:400,color:i===step?'var(--primary)':i<step?'var(--secondary)':'var(--text-muted)',whiteSpace:'nowrap'}}>{s}</span>
              </div>
              {i<3 && <div style={{flex:1,height:2,background:i<step?'var(--secondary)':'var(--border)',margin:'0 6px',marginBottom:18,transition:'background .3s'}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: ข้อมูลโครงการ */}
      {step===0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">ข้อมูลโครงการ</div></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{gap:16}}>
              
              <div>
                <label>เลือกอ้างอิง Sales Order (ที่รอเปิดโครงการ)</label>
                <select value={form.soRef} onChange={e=>handleSelectSO(e.target.value)}>
                  <option value="">-- สร้างโปรเจกต์อิสระ (ไม่ผูก SO) --</option>
                  {getSalesOrders().map(so => (
                    <option key={so.id} value={so.id}>{so.id} - {so.customer} ({so.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label>อ้างอิง Sales Order ID (หากไม่เลือกจากข้อแรก)</label>
                <input value={form.soRef} onChange={e=>setForm({...form,soRef:e.target.value})} placeholder="เช่น SO-2023-098" />
              </div>

              <div className="form-col-2">
                <label>ชื่อโครงการ / ชื่องาน *</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="เช่น Implement FW & Network — SCG Cement HQ" />
              </div>
              <div>
                <label>ชื่อลูกค้า *</label>
                <input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} />
              </div>
              <div>
                <label>ผู้ติดต่อ</label>
                <input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} />
              </div>
              <div>
                <label>เบอร์โทร</label>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
              </div>
              <div>
                <label>อีเมลผู้ติดต่อ</label>
                <input value={form.email || ''} onChange={e=>setForm({...form,email:e.target.value})} placeholder="เช่น contact@customer.com" />
              </div>
              <div>
                <label>พนักงานขายผู้ดูแล (Sales PM/AM)</label>
                <input value={form.salesPMName || ''} onChange={e=>setForm({...form,salesPMName:e.target.value})} placeholder="เช่น คุณวีระ ศรีสุข" />
              </div>
              <div>
                <label>สถานที่ปฏิบัติงาน</label>
                <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
              </div>
              <div>
                <label>วันที่เริ่มต้นสัญญา</label>
                <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} />
              </div>
              <div>
                <label>วันที่สิ้นสุดสัญญา</label>
                <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} />
              </div>
              <div>
                <label>ระดับความสำคัญ</label>
                <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label>กลุ่มงาน (Job Category)</label>
                <select value={form.jobCategory} onChange={e=>setForm({...form,jobCategory:e.target.value,jobType:e.target.value})}>
                  {jobTypes.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:16}}>
              <label>Tags งาน (เลือกได้มากกว่า 1)</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                {allTags.map(t => (
                  <button key={t} onClick={()=>toggleTag(t)}
                    style={{padding:'5px 14px',borderRadius:20,fontSize:12.5,fontWeight:600,cursor:'pointer',border:'1.5px solid',transition:'all .15s',
                      background:selectedTags.includes(t)?'var(--primary)':'transparent',
                      color:selectedTags.includes(t)?'#fff':'var(--text-muted)',
                      borderColor:selectedTags.includes(t)?'var(--primary)':'var(--border)'}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{padding:'14px 22px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-primary" onClick={()=>setStep(1)}>ถัดไป: กำหนดเงื่อนไข →</button>
          </div>
        </div>
      )}

      {/* Step 1: เงื่อนไขงาน */}
      {step===1 && (
        <div>
          {form.jobCategory==='Runrate' && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><div className="card-title">เงื่อนไขงาน Runrate (ซื้อมาขายไป)</div></div>
              <div className="card-body">
                <div className="form-grid form-grid-2" style={{gap:16}}>
                  <div>
                    <label>วิธีการจัดส่ง</label>
                    <select value={cond.deliveryType} onChange={e=>setCond({...cond,deliveryType:e.target.value})}>
                      <option value="no_install">จัดส่ง โดยไม่ต้องติดตั้ง</option>
                      <option value="preconfig">PreConfig ก่อนจัดส่ง</option>
                      <option value="onsite_install">PreConfig จัดส่ง พร้อมติดตั้งหน้างาน</option>
                      <option value="remote_config">จัดส่งสินค้า และ Remote Config</option>
                      <option value="full_install">จัดส่งสินค้าและติดตั้ง</option>
                    </select>
                  </div>
                  <div>
                    <label>ผู้ดำเนินการจัดส่ง</label>
                    <select value={cond.deliveryBy} onChange={e=>setCond({...cond,deliveryBy:e.target.value})}>
                      <option value="nis_team">NIS Team (Auto Ticket → Service Manager)</option>
                      <option value="messenger">Messenger (Auto Ticket → จัดซื้อ)</option>
                      <option value="postal">ไปรษณีย์ (Auto Ticket → จัดซื้อ)</option>
                    </select>
                  </div>
                </div>
                <div style={{marginTop:16}}>
                  <label>เงื่อนไขบริการหลังการขาย</label>
                  {['ให้คำปรึกษาทางโทรศัพท์','ให้คำปรึกษาทางโทรศัพท์และ Remote Support','Onsite Service (จำนวนครั้งที่ระบุ กรณีอุปกรณ์เสียภายใน 1 ปี กทม.)'].map((opt,i) => (
                    <label key={i} style={{display:'flex',alignItems:'center',gap:8,margin:'8px 0',cursor:'pointer',fontWeight:400,textTransform:'none',fontSize:13.5,letterSpacing:0}}>
                      <input type="checkbox" defaultChecked={i<2} style={{width:'auto',accentColor:'var(--primary)'}} />{opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {form.jobCategory==='Implement' && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><div className="card-title">เงื่อนไขงาน Implement (ติดตั้ง + MA หลังการขาย)</div></div>
              <div className="card-body">
                <div className="form-grid form-grid-2" style={{gap:16}}>
                  <div>
                    <label>ระยะเวลาบริการหลังการขาย (ปี)</label>
                    <select value={cond.serviceYears} onChange={e=>setCond({...cond,serviceYears:e.target.value})}>
                      <option value="1">1 ปี (นับจากวันวางบิล)</option>
                      <option value="2">2 ปี (นับจากวันวางบิล)</option>
                      <option value="3">3 ปี (นับจากวันวางบิล)</option>
                    </select>
                  </div>
                  <div>
                    <label>SLA Level</label>
                    <select value={cond.sla} onChange={e=>setCond({...cond,sla:e.target.value})}>
                      <option>8x5xNBD</option><option>8x5</option><option>24x7x4</option><option>24x7xNBD</option>
                    </select>
                  </div>
                  <div>
                    <label>Onsite Service (ครั้ง/ปี)</label>
                    <select value={cond.onsitePerYear} onChange={e=>setCond({...cond,onsitePerYear:e.target.value})}>
                      <option value="2">2 ครั้ง/ปี</option><option value="4">4 ครั้ง/ปี</option>
                      <option value="6">6 ครั้ง/ปี</option><option value="12">12 ครั้ง/ปี</option>
                    </select>
                  </div>
                  <div>
                    <label>Preventive Maintenance (ครั้ง/ปี)</label>
                    <select value={cond.pmPerYear} onChange={e=>setCond({...cond,pmPerYear:e.target.value})}>
                      <option value="2">2 ครั้ง/ปี (ทุก 6 เดือน)</option>
                      <option value="4">4 ครั้ง/ปี (ทุก 3 เดือน)</option>
                      <option value="12">12 ครั้ง/ปี (ทุกเดือน)</option>
                    </select>
                  </div>
                  <div>
                    <label>Service Replacement</label>
                    <select value={cond.serviceReplacement} onChange={e=>setCond({...cond,serviceReplacement:e.target.value})}>
                      <option value="company">จากคลังบริษัทฯ</option>
                      <option value="vendor">จาก Vendor</option>
                      <option value="both">ทั้งสองแบบ (เลือกตามรายการสินค้า)</option>
                    </select>
                  </div>
                  <div>
                    <label>Remote Backup Config (ครั้ง/ปี)</label>
                    <select value={cond.remoteBackup} onChange={e=>setCond({...cond,remoteBackup:e.target.value})}>
                      <option value="4">4 ครั้ง/ปี</option><option value="12">12 ครั้ง/ปี</option>
                      <option value="2">2 ครั้ง/ปี</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMA && (
            <div className="card" style={{marginBottom:16}}>
              <div className="card-header"><div className="card-title">เงื่อนไขสัญญา Maintenance Service</div></div>
              <div className="card-body">
                <div className="form-grid form-grid-2" style={{gap:16}}>
                  <div>
                    <label>Onsite MA (ครั้ง/ปี)</label>
                    <select value={cond.onsitePerYear} onChange={e=>setCond({...cond,onsitePerYear:e.target.value})}>
                      <option value="12">12 ครั้ง/ปี (ทุกเดือน)</option>
                      <option value="4">4 ครั้ง/ปี (ทุก 3 เดือน)</option>
                      <option value="3">3 ครั้ง/ปี (ทุก 4 เดือน)</option>
                      <option value="2">2 ครั้ง/ปี (ทุก 6 เดือน)</option>
                    </select>
                  </div>
                  <div>
                    <label>Preventive Maintenance (ครั้ง/ปี)</label>
                    <select value={cond.pmPerYear} onChange={e=>setCond({...cond,pmPerYear:e.target.value})}>
                      <option value="4">4 ครั้ง/ปี (ทุก 3 เดือน)</option>
                      <option value="12">12 ครั้ง/ปี (ทุกเดือน)</option>
                      <option value="2">2 ครั้ง/ปี (ทุก 6 เดือน)</option>
                    </select>
                  </div>
                  <div>
                    <label>SLA Level</label>
                    <select value={cond.sla} onChange={e=>setCond({...cond,sla:e.target.value})}>
                      <option>8x5xNBD</option><option>8x5</option><option>24x7x4</option>
                    </select>
                  </div>
                  <div>
                    <label>Remote Backup Config (ครั้ง/ปี)</label>
                    <select value={cond.remoteBackup} onChange={e=>setCond({...cond,remoteBackup:e.target.value})}>
                      <option value="12">12 ครั้ง/ปี</option><option value="4">4 ครั้ง/ปี</option>
                    </select>
                  </div>
                  <div>
                    <label>Monthly Report (ครั้ง/ปี)</label>
                    <select value={cond.monthlyReport} onChange={e=>setCond({...cond,monthlyReport:e.target.value})}>
                      <option value="12">12 ครั้ง/ปี</option><option value="4">4 ครั้ง/ปี</option>
                    </select>
                  </div>
                  <div>
                    <label>ส่ง Report ภายในวันที่ (ของเดือนถัดไป)</label>
                    <input type="number" value={cond.monthlyReportDay} min="1" max="31"
                      onChange={e=>setCond({...cond,monthlyReportDay:e.target.value})} />
                  </div>
                  <div>
                    <label>Service Replacement</label>
                    <select>
                      <option>จากคลังบริษัทฯ</option><option>จาก Vendor</option><option>ทั้งสองแบบ</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Auto Tickets count */}
          <div className="alert-banner info">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
            <div className="alert-text">
              <h4>⚡ ระบบจะ Auto Generate {getAutoTickets().length} Tickets ไปที่ Service Manager</h4>
              <p>จากเงื่อนไขที่กำหนด: {getAutoTickets().map(t=>t.type).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}</p>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
            <button className="btn btn-secondary" onClick={()=>setStep(0)}>← ย้อนกลับ</button>
            <button className="btn btn-primary" onClick={()=>setStep(2)}>ถัดไป: Checklist →</button>
          </div>
        </div>
      )}

      {/* Step 2: Checklist */}
      {step===2 && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><div className="card-title">Checklist งาน (ดึงจาก Master)</div><span style={{fontSize:12,color:'var(--text-muted)'}}>แก้ไขได้</span></div>
            <div className="card-body">
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                {checklist.map((item, i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                    <input type="checkbox" defaultChecked style={{width:'auto',accentColor:'var(--primary)',flexShrink:0}} />
                    <span style={{flex:1,fontSize:13}}>{i+1}. {item}</span>
                    <button onClick={()=>setChecklist(checklist.filter((_,j)=>j!==i))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',padding:4}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                <input value={customCheck} onChange={e=>setCustomCheck(e.target.value)} placeholder="เพิ่ม Checklist เพิ่มเติม..." style={{flex:1}}
                  onKeyDown={e=>{if(e.key==='Enter'&&customCheck.trim()){setChecklist([...checklist,customCheck.trim()]);setCustomCheck('');}}} />
                <button className="btn btn-secondary" onClick={()=>{if(customCheck.trim()){setChecklist([...checklist,customCheck.trim()]);setCustomCheck('');}}}>+ เพิ่ม</button>
              </div>
            </div>
          </div>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header">
              <div className="card-title">เอกสารแนบ</div>
              <button className="btn btn-secondary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { title: 'อัปโหลดไฟล์', message: 'ระบบเลือกไฟล์ BOQ_TechVision.pdf และอัปโหลดเรียบร้อยแล้ว', type: 'success' }
              }))}>
                + แนบไฟล์
              </button>
            </div>
            <div className="card-body">
              <div onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { title: 'อัปโหลดไฟล์', message: 'อัปโหลดไฟล์แนบโครงการสำเร็จแล้ว', type: 'success' }
              }))} style={{border:'2px dashed var(--border)',borderRadius:10,padding:'32px',textAlign:'center',color:'var(--text-muted)',cursor:'pointer'}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{margin:'0 auto 8px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style={{fontSize:13}}>ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกไฟล์</div>
                <div style={{fontSize:11.5,marginTop:4}}>รองรับ PDF, Excel, Word, Visio, Image (สูงสุด 50MB)</div>
              </div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <button className="btn btn-secondary" onClick={()=>setStep(1)}>← ย้อนกลับ</button>
            <button className="btn btn-primary" onClick={()=>setStep(3)}>ถัดไป: ยืนยัน →</button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Generate */}
      {step===3 && !generated && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><div className="card-title">สรุปก่อน Auto Generate Tickets</div></div>
            <div className="card-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                {[['โครงการ', form.name||'(ยังไม่ระบุ)'],['ลูกค้า',form.customer],['ประเภทงาน',form.jobCategory],['SLA',cond.sla],['ระยะสัญญา',`${form.startDate} → ${form.endDate}`],['Tags',selectedTags.join(', ')||'-']].map(([k,v],i) => (
                  <div key={i} style={{background:'var(--bg)',borderRadius:8,padding:'10px 14px'}}>
                    <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{k}</div>
                    <div style={{fontSize:13.5,fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Tickets ที่จะถูกสร้าง ({getAutoTickets().length} รายการ)</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {getAutoTickets().map((tk,i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:typeColors[tk.type]||'#6366f1',flexShrink:0}}></div>
                    <span style={{fontFamily:'monospace',fontSize:12,color:'var(--text-muted)',minWidth:130}}>{tk.id}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:500}}>{tk.title}</span>
                    <span style={{background:(typeColors[tk.type]||'#6366f1')+'22',color:typeColors[tk.type]||'#6366f1',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>{tk.type}</span>
                    <span style={{fontSize:11.5,color:'var(--text-muted)'}}>→ {tk.assignTo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <button className="btn btn-secondary" onClick={()=>setStep(2)}>← ย้อนกลับ</button>
            <button className="btn btn-primary" style={{padding:'12px 28px',fontSize:15}} onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <span style={{display:'flex',alignItems:'center',gap:10}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}>
                    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                  </svg>
                  กำลัง Generate...
                </span>
              ) : '⚡ ยืนยัน & สร้าง Project + Auto Tickets'}
            </button>
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Generated! */}
      {generated && (
        <div>
          <div style={{textAlign:'center',padding:'32px 24px',background:'var(--surface)',borderRadius:16,border:'2px solid var(--secondary)',marginBottom:20}}>
            <div style={{fontSize:52,marginBottom:12}}>✅</div>
            <div style={{fontSize:22,fontWeight:800,color:'var(--text)',marginBottom:6}}>สร้าง Project สำเร็จ!</div>
            <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>{form.name||'โครงการใหม่'} — {form.customer}</div>
            <div style={{fontSize:13,color:'var(--secondary)',fontWeight:600}}>⚡ Auto Generate {generatedTickets.length} Tickets เข้า Service Manager กระดาน แล้ว</div>
          </div>
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><div className="card-title">Tickets ที่ถูกสร้างแล้ว (รอ Service Manager Assign)</div></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Ticket ID</th><th>หัวข้อ</th><th>ประเภท</th><th>สถานะ</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {generatedTickets.map((tk,i) => (
                    <tr key={i}>
                      <td className="td-id">{tk.id}</td>
                      <td className="td-name">{tk.title}</td>
                      <td><span style={{background:(typeColors[tk.type]||'#6366f1')+'22',color:typeColors[tk.type]||'#6366f1',padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:700}}>{tk.type}</span></td>
                      <td><span className="badge badge-warning">⏳ รอ Assign</span></td>
                      <td><button className="btn btn-primary btn-sm" onClick={()=>navigate('/service-board')}>Assign ใน Board →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button className="btn btn-secondary" onClick={()=>navigate('/projects')}>ดู Projects ทั้งหมด</button>
            <button className="btn btn-primary" onClick={()=>navigate('/service-board')}>ไปที่ Service Board →</button>
          </div>
        </div>
      )}
    </div>
  );
}
