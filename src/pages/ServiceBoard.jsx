import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, saveProjects } from '../mockDb';

const columns = [
  { id:'open', label:'Open / Assigned', color:'#6366f1' },
  { id:'inprogress', label:'In Progress', color:'#f59e0b' },
  { id:'review', label:'Review / Waiting', color:'#3b82f6' },
  { id:'done', label:'Done / Closed', color:'#10b981' },
];

const avatarColors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6'];
const staff = ['Krit P.','Nok S.','Pom T.','Ann K.','Art W.'];

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
    <div className="ticket-card" onClick={() => navigate(`/tickets/${tk.id}`)} style={{cursor:'pointer'}}>
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
          <div className="mini-avatar" style={{background:avatarColors[staff.indexOf(tk.assignee)%avatarColors.length] || '#6366f1'}}>
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

export default function ServiceBoard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('board');
  const [filterStaff, setFilterStaff] = useState('');
  const [projectsList, setProjectsList] = useState(() => getProjects());

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');

  // Flat-map tickets from active projects in mockDb
  const ticketsList = projectsList.flatMap(p => 
    p.tickets.map(t => {
      let colId = 'open';
      if (t.status === 'In Progress') colId = 'inprogress';
      if (t.status === 'Pending') colId = 'review';
      if (t.status === 'Closed' || t.status === 'Done') colId = 'done';

      return {
        ...t,
        col: colId,
        project: p.id,
        projectName: p.name,
        type: p.type,
        priority: p.priority,
        tags: p.tags
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
              status: 'In Progress'
            };
          }
          return t;
        })
      };
    });

    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);
    setShowAssignModal(false);
    setSelectedTicket('');
    setSelectedStaff('');

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'มอบหมายงาน', message: `มอบหมาย Ticket ${selectedTicket} ให้ ${selectedStaff} เรียบร้อยแล้ว`, type: 'success' }
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
            <button className={`tab-btn${activeTab==='skill'?' active':''}`} onClick={() => setActiveTab('skill')}>
              Skill Dashboard
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Assign งาน
          </button>
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
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setShowAssignModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleAssignConfirm} disabled={!selectedTicket||!selectedStaff}>✓ มอบหมายงาน</button>
            </div>
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
                <div className="kanban-col" key={col.id}>
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
    </div>
  );
}
