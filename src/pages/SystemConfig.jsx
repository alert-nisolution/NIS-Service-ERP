import { useState } from 'react';
import { getSystemConfig, saveSystemConfig } from '../mockDb';

const Section = ({ title, children }) => (
  <div className="card" style={{marginBottom:20}}>
    <div className="card-header" style={{paddingBottom:14,borderBottom:'1px solid var(--border)'}}>
      <div className="card-title">{title}</div>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

const TagEditor = ({ label, items, setItems }) => {
  const [input, setInput] = useState('');
  return (
    <div>
      <label>{label}</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:10,marginTop:6}}>
        {items.map((t,i) => (
          <span key={i} style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--primary-bg)',color:'var(--primary)',padding:'4px 12px',borderRadius:20,fontSize:12.5,fontWeight:600,border:'1px solid var(--primary)',opacity:.8}}>
            {t}
            <button onClick={() => setItems(items.filter((_,j) => j!==i))} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',padding:0,fontSize:14,lineHeight:1}}>×</button>
          </span>
        ))}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder={`เพิ่ม ${label}...`}
          onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){setItems([...items,input.trim()]);setInput('');}}}
          style={{flex:1}} />
        <button className="btn btn-primary btn-sm" onClick={()=>{if(input.trim()){setItems([...items,input.trim()]);setInput('');}}} >+ เพิ่ม</button>
      </div>
    </div>
  );
};

const ChecklistEditor = ({ items, setItems }) => {
  const [input, setInput] = useState('');
  return (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
        {items.map((item,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span style={{flex:1,fontSize:13}}>{item}</span>
            <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',padding:4}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="เพิ่มรายการ Checklist..." onKeyDown={e=>{if(e.key==='Enter'&&input.trim()){setItems([...items,input.trim()]);setInput('');}}} style={{flex:1}} />
        <button className="btn btn-primary btn-sm" onClick={()=>{if(input.trim()){setItems([...items,input.trim()]);setInput('');}}}>+ เพิ่ม</button>
      </div>
    </div>
  );
};

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState('jobtypes');
  const [saved, setSaved] = useState(false);

  const config = getSystemConfig();

  const [jobTypes, setJobTypes] = useState(() => config.jobTypes);
  const [tags, setTags] = useState(() => config.tags);
  const [slaOptions, setSlaOptions] = useState(() => config.slaOptions);

  const [implementChecklist, setImplementChecklist] = useState(() => config.implementChecklist);
  const [maChecklist, setMaChecklist] = useState(() => config.maChecklist);
  const [pmChecklist, setPmChecklist] = useState(() => config.pmChecklist);
  const [warningDays, setWarningDays] = useState(() => config.warningDays);

  const [emailTemplates] = useState([
    {id:'e1', name:'ส่งใบเสนอราคา', subject:'ใบเสนอราคา [QT_NUMBER] - [COMPANY]'},
    {id:'e2', name:'Service Report (หลังปิดงาน)', subject:'Service Report - Ticket [TK_NUMBER] - [PROJECT]'},
    {id:'e3', name:'แจ้งเตือนต่ออายุ MA', subject:'แจ้งเตือน: สัญญา MA ใกล้หมดอายุ - [COMPANY]'},
    {id:'e4', name:'ลูกค้าเซ็นรับงาน', subject:'ยืนยันการรับงาน - Project [PROJECT] - [COMPANY]'},
  ]);

  const handleSave = () => {
    saveSystemConfig({
      jobTypes,
      tags,
      implementChecklist,
      maChecklist,
      pmChecklist,
      slaOptions,
      warningDays
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    window.dispatchEvent(new CustomEvent('system-config-updated'));
  };

  const tabs = [
    {id:'jobtypes', label:'ประเภทงาน'},
    {id:'tags', label:'Tags / Skills'},
    {id:'checklist', label:'Checklist Master'},
    {id:'renewal', label:'กำหนดแจ้งเตือน'},
    {id:'email', label:'Email Templates'},
    {id:'sla', label:'SLA Settings'},
  ];

  return (
    <div style={{maxWidth:960,margin:'0 auto'}}>
      <div className="page-header">
        <div>
          <div className="page-title">System Config</div>
          <div className="page-subtitle">ตั้งค่า Master Data ของระบบ — Job Types, Tags, Checklist, SLA, Email Templates</div>
        </div>
        <div className="page-actions">
          {saved && <span style={{color:'var(--secondary)',fontWeight:600,fontSize:13}}>✓ บันทึกสำเร็จแล้ว</span>}
          <button className="btn btn-primary" onClick={handleSave}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--surface)',borderRadius:10,padding:6,border:'1px solid var(--border)',width:'fit-content'}}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn${activeTab===t.id?' active':''}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Job Types */}
      {activeTab==='jobtypes' && (
        <Section title="ประเภทงาน (Job Type Master)">
          <div className="alert-banner info" style={{marginBottom:16}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div className="alert-text"><h4>หมายเหตุ</h4><p>Job Type ถูกใช้เพื่อกำหนดกลุ่มงาน สำหรับการวิเคราะห์ Dashboard และการสร้าง Auto Ticket</p></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {jobTypes.map((t,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:['#6366f1','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'][i%6]}}></div>
                  <span style={{fontWeight:600,fontSize:13.5}}>{t}</span>
                </div>
                <button onClick={() => {
                  setJobTypes(jobTypes.filter((_, j) => j !== i));
                  window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { title: 'ลบประเภทงาน', message: `ลบประเภทงาน ${t} สำเร็จ`, type: 'info' }
                  }));
                }} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',fontSize:18}}>×</button>
              </div>
            ))}
          </div>
          <TagEditor label="เพิ่มประเภทงาน" items={[]} setItems={(items)=>setJobTypes([...jobTypes,...items])} />
        </Section>
      )}

      {/* Tags */}
      {activeTab==='tags' && (
        <div>
          <Section title="Tags สำหรับงาน">
            <TagEditor label="Tags" items={tags} setItems={setTags} />
          </Section>
          <Section title="SLA Options">
            <TagEditor label="SLA Level" items={slaOptions} setItems={setSlaOptions} />
          </Section>
        </div>
      )}

      {/* Checklist */}
      {activeTab==='checklist' && (
        <div>
          <Section title="Checklist งาน Implement (ติดตั้งหน้างาน)">
            <ChecklistEditor items={implementChecklist} setItems={setImplementChecklist} />
          </Section>
          <Section title="Checklist MA Service (ตรวจสอบระบบประจำเดือน)">
            <ChecklistEditor items={maChecklist} setItems={setMaChecklist} />
          </Section>
          <Section title="Checklist Preventive Maintenance (PM)">
            <ChecklistEditor items={pmChecklist} setItems={setPmChecklist} />
          </Section>
        </div>
      )}

      {/* Renewal Warning */}
      {activeTab==='renewal' && (
        <Section title="กำหนดการแจ้งเตือนใบเสนอราคาล่วงหน้า (Auto Renewal Alert)">
          <div className="alert-banner info" style={{marginBottom:20}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div className="alert-text">
              <h4>Flow การแจ้งเตือน</h4>
              <p>ระบบจะตรวจสอบทุกวัน → เมื่อถึงระยะเวลาที่กำหนด → Auto Ticket แจ้งจัดซื้อขอราคา → Auto Ticket แจ้ง Sale → สร้างใบเสนอราคา → ส่งลูกค้า → Auto Close</p>
            </div>
          </div>
          <div className="form-grid form-grid-2">
            <div>
              <label>แจ้งเตือนงานบริการ MA ล่วงหน้า (วัน)</label>
              <input type="number" value={warningDays.service} onChange={e=>setWarningDays({...warningDays,service:e.target.value})} />
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>ตัวอย่าง: 60 = แจ้งเตือนก่อน 2 เดือน</div>
            </div>
            <div>
              <label>แจ้งเตือนสินค้าหมดประกัน ล่วงหน้า (วัน)</label>
              <input type="number" value={warningDays.product} onChange={e=>setWarningDays({...warningDays,product:e.target.value})} />
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>ตัวอย่าง: 30 = แจ้งเตือนก่อน 1 เดือน</div>
            </div>
          </div>
          <hr className="divider" />
          <div style={{marginTop:16}}>
            <label style={{marginBottom:12}}>ช่องทางการแจ้งเตือน</label>
            {[{id:'notif',label:'แจ้งเตือนภายในระบบ (In-App Notification)'},
              {id:'email',label:'Email แจ้งเตือนอัตโนมัติ'},
              {id:'line',label:'Line Notification (ผ่าน Line Messaging API)'}].map(ch => (
              <label key={ch.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,cursor:'pointer',fontWeight:400,textTransform:'none',fontSize:13.5,letterSpacing:0}}>
                <input type="checkbox" defaultChecked style={{width:'auto',accentColor:'var(--primary)'}} />
                {ch.label}
              </label>
            ))}
          </div>
          <hr className="divider" />
          <div style={{marginTop:16}}>
            <label style={{marginBottom:8}}>Notification Recipients</label>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[{role:'Sale (ผู้รับผิดชอบลูกค้า)',checked:true},{role:'Service Manager',checked:true},{role:'ผู้จัดซื้อ (Purchasing)',checked:true},{role:'ผู้บริหาร (CC)',checked:false}].map((r,i) => (
                <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--bg)',borderRadius:8,cursor:'pointer',fontWeight:400,textTransform:'none',fontSize:13.5,letterSpacing:0}}>
                  <input type="checkbox" defaultChecked={r.checked} style={{width:'auto',accentColor:'var(--primary)'}} />
                  {r.role}
                </label>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Email Templates */}
      {activeTab==='email' && (
        <Section title="Email Templates">
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {emailTemplates.map(tpl => (
              <div key={tpl.id} style={{padding:'14px 18px',background:'var(--bg)',borderRadius:10,border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13.5,marginBottom:3}}>{tpl.name}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)',fontFamily:'monospace'}}>{tpl.subject}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { title: 'แก้ไข Email Template', message: `กำลังเปิดหน้าจอแก้ไขสำหรับ Template "${tpl.name}"...`, type: 'info' }
                  }))}>แก้ไข Template</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { title: 'Preview Email', message: `แสดงตัวอย่างเนื้อหาของ Email "${tpl.subject}"...`, type: 'info' }
                  }))}>Preview</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,padding:'14px 18px',background:'var(--primary-bg)',borderRadius:10,border:'1px solid var(--primary)',opacity:.8}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--primary)',marginBottom:4}}>Variable ที่ใช้ได้ใน Template</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {['[QT_NUMBER]','[TK_NUMBER]','[PROJECT]','[COMPANY]','[CONTACT]','[ENGINEER]','[DATE]','[SERVICE_DETAIL]','[SIGNATURE_URL]'].map(v => (
                <code key={v} style={{background:'#fff',padding:'2px 8px',borderRadius:4,fontSize:12,color:'var(--primary)',border:'1px solid var(--primary)',opacity:.7}}>{v}</code>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* SLA Settings */}
      {activeTab==='sla' && (
        <Section title="SLA Level Configuration">
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {[
              {name:'24x7x4', desc:'ให้บริการ 24 ชั่วโมง 7 วัน — Response ภายใน 4 ชั่วโมง', color:'#ef4444'},
              {name:'8x5', desc:'วันทำการ 8:00–17:00 — Response ภายใน 1 วันทำการ', color:'#f59e0b'},
              {name:'8x5xNBD', desc:'วันทำการ — Response ภายใน Next Business Day', color:'#3b82f6'},
              {name:'24x7xNBD', desc:'24 ชั่วโมง 7 วัน — Response ภายใน Next Business Day', color:'#8b5cf6'},
            ].map((s,i) => (
              <div key={i} style={{padding:'16px',background:'var(--bg)',borderRadius:10,border:`1px solid ${s.color}44`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{background:s.color+'22',color:s.color,padding:'3px 12px',borderRadius:20,fontSize:12,fontWeight:700}}>{s.name}</span>
                </div>
                <div style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5}}>{s.desc}</div>
                <div style={{display:'flex',gap:8,marginTop:12}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11}}>Response Time (hrs)</label>
                    <input type="number" defaultValue={s.name.includes('4')?4:s.name.includes('NBD')?24:8} style={{marginTop:2}} />
                  </div>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11}}>Resolution Time (hrs)</label>
                    <input type="number" defaultValue={s.name.includes('4')?8:s.name.includes('NBD')?48:24} style={{marginTop:2}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="alert-banner success" style={{marginTop:20}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
            <div className="alert-text"><h4>ค่าเริ่มต้น</h4><p>ค่า SLA จะถูกนำไปใช้เมื่อมีการเปิด Ticket Service Request โดยอัตโนมัติ</p></div>
          </div>
        </Section>
      )}
    </div>
  );
}
