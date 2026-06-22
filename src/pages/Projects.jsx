import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProjects, saveProjects } from '../mockDb';

const pColors = {High:'#ef4444',Medium:'#f59e0b',Low:'#10b981'};
const sColors = {'In Progress':'badge-sent','Active':'badge-approved','Done':'badge-approved','Open':'badge-draft','Pending':'badge-warning','Closed':'badge-approved'};
const STAFF_LIST = ['Krit P.', 'Nok S.', 'Pom T.', 'Ann K.', 'Art W.'];

function ProgressBar({ pct, color='var(--primary)' }) {
  return (
    <div style={{background:'var(--border)',borderRadius:4,height:6,overflow:'hidden',flex:1}}>
      <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:4,transition:'width .3s'}} />
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prjIdParam = searchParams.get('id') || '';

  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [activeProject, setActiveProject] = useState(() => {
    const list = getProjects();
    if (prjIdParam && list.some(p => p.id === prjIdParam)) return prjIdParam;
    return list.length > 0 ? list[0].id : '';
  });
  const [view, setView] = useState('list');

  // Add Ticket Modal states
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [tkTitle, setTkTitle] = useState('');
  const [tkType, setTkType] = useState('Install');
  const [tkAssignee, setTkAssignee] = useState('-');
  const [tkPriority, setTkPriority] = useState('Medium');
  const [tkDue, setTkDue] = useState(() => new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]);

  // Assign Ticket Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [assignStaff, setAssignStaff] = useState('Krit P.');

  const prj = projectsList.find(p => p.id === activeProject);

  useEffect(() => {
    if (prjIdParam && projectsList.some(p => p.id === prjIdParam)) {
      setActiveProject(prjIdParam);
    }
  }, [prjIdParam, projectsList]);

  const handleOpenAddTicket = () => {
    setTkTitle('');
    setTkType('Install');
    setTkAssignee('-');
    setTkPriority('Medium');
    setTkDue(new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]);
    setShowAddTicketModal(true);
  };

  const handleConfirmAddTicket = () => {
    if (!tkTitle.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'ข้อมูลไม่ครบ', message: 'กรุณากรอกหัวข้อ Ticket', type: 'error' }
      }));
      return;
    }

    const newTk = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      title: tkTitle.trim(),
      status: tkAssignee === '-' ? 'Open' : 'In Progress',
      assignee: tkAssignee,
      due: tkDue,
      pct: 0,
      type: tkType,
      priority: tkPriority,
      tags: [tkType]
    };

    const updatedList = projectsList.map(p => {
      if (p.id === activeProject) {
        return { ...p, tickets: [newTk, ...p.tickets] };
      }
      return p;
    });

    setProjectsList(updatedList);
    saveProjects(updatedList);
    setShowAddTicketModal(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'สร้าง Ticket ใหม่', message: `สร้าง Ticket ${newTk.id} ในโครงการสำเร็จ!`, type: 'success' }
    }));
  };

  const handleOpenAssign = (tkId) => {
    setSelectedTicketId(tkId);
    setAssignStaff('Krit P.');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    const updatedList = projectsList.map(p => {
      if (p.id === activeProject) {
        return {
          ...p,
          tickets: p.tickets.map(t => {
            if (t.id === selectedTicketId) {
              return { ...t, assignee: assignStaff, status: 'In Progress' };
            }
            return t;
          })
        };
      }
      return p;
    });

    setProjectsList(updatedList);
    saveProjects(updatedList);
    setShowAssignModal(false);

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'จ่ายงานสำเร็จ', message: `มอบหมาย Ticket ${selectedTicketId} ให้ ${assignStaff} เรียบร้อยแล้ว`, type: 'success' }
    }));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Projects & Tickets</div>
          <div className="page-subtitle">บริหารจัดการโครงการและ Ticket งานของทีม Service</div>
        </div>
        <div className="page-actions">
          <div className="tabs" style={{padding:4}}>
            <button className={`tab-btn${view==='list'?' active':''}`} onClick={() => setView('list')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              List
            </button>
            <button className={`tab-btn${view==='kanban'?' active':''}`} onClick={() => setView('kanban')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="11"/></svg>
              Kanban
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            เปิด Project ใหม่
          </button>
        </div>
      </div>

      {/* Add Ticket Modal */}
      {showAddTicketModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:480,boxShadow:'var(--shadow-lg)'}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:14,color:'var(--text)'}}>สร้าง Ticket ใหม่ในโครงการ</div>
            
            <div style={{marginBottom:12}}>
              <label>หัวข้อ Ticket / รายละเอียดงาน *</label>
              <input value={tkTitle} onChange={e=>setTkTitle(e.target.value)} placeholder="เช่น Config Access Point หรือ Onsite MA รอบ พ.ย." style={{marginTop:6}} />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label>ประเภทงาน</label>
                <select value={tkType} onChange={e=>setTkType(e.target.value)} style={{marginTop:6}}>
                  <option value="Install">Install (ติดตั้ง)</option>
                  <option value="PM">PM (บำรุงรักษา)</option>
                  <option value="MA Onsite">MA Onsite</option>
                  <option value="Support">Support / แก้ปัญหา</option>
                  <option value="Backup">Backup</option>
                  <option value="Report">Report</option>
                </select>
              </div>
              <div>
                <label>ระดับความสำคัญ</label>
                <select value={tkPriority} onChange={e=>setTkPriority(e.target.value)} style={{marginTop:6}}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
              <div>
                <label>ผู้รับมอบหมาย (Staff)</label>
                <select value={tkAssignee} onChange={e=>setTkAssignee(e.target.value)} style={{marginTop:6}}>
                  <option value="-">-- ยังไม่มอบหมาย --</option>
                  {STAFF_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>กำหนดส่ง (Due Date)</label>
                <input type="date" value={tkDue} onChange={e=>setTkDue(e.target.value)} style={{marginTop:6}} />
              </div>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setShowAddTicketModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleConfirmAddTicket}>✓ สร้าง Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--surface)',borderRadius:16,padding:28,width:400,boxShadow:'var(--shadow-lg)'}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:4,color:'var(--text)'}}>มอบหมายงาน (Assign Ticket)</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:20}}>เลือกช่างเทคนิค/วิศวกรผู้รับผิดชอบสำหรับตั๋ว {selectedTicketId}</div>
            
            <div style={{marginBottom:20}}>
              <label>เลือกช่าง (Staff)</label>
              <select value={assignStaff} onChange={e=>setAssignStaff(e.target.value)} style={{marginTop:6}}>
                {STAFF_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={()=>setShowAssignModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleConfirmAssign}>✓ มอบหมายงาน</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20}}>
        {/* Project List Sidebar */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {projectsList.map(p => (
            <div key={p.id} className="card" style={{padding:16,cursor:'pointer',border:`1px solid ${activeProject===p.id?'var(--primary)':'var(--border)'}`,background:activeProject===p.id?'var(--primary-bg)':'var(--surface)'}}
                 onClick={() => setActiveProject(p.id)}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8,gap:8}}>
                <div style={{fontSize:13,fontWeight:700,color:activeProject===p.id?'var(--primary)':'var(--text)',lineHeight:1.3}}>{p.name}</div>
                <div style={{width:8,height:8,borderRadius:'50%',background:pColors[p.priority],flexShrink:0,marginTop:4}}></div>
              </div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>{p.customer}</div>
              <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
                {(p.tags || []).map(t => <span key={t} style={{background:'var(--bg)',padding:'2px 6px',borderRadius:4,fontSize:10.5,fontWeight:600,color:'var(--text-muted)'}}>{t}</span>)}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <ProgressBar pct={p.progress} color={activeProject===p.id?'var(--primary)':'#94a3b8'} />
                <span style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{p.progress}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Project Detail */}
        {prj && (
          <div>
            {/* Project Header Card */}
            <div className="card" style={{marginBottom:16}}>
              <div className="card-body">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <span style={{fontFamily:'monospace',fontSize:12,color:'var(--text-muted)'}}>{prj.id}</span>
                      <span style={{background:pColors[prj.priority]+'22',color:pColors[prj.priority],padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,border:`1px solid ${pColors[prj.priority]}44`}}>● {prj.priority}</span>
                      <span className={`badge ${prj.type.startsWith('MA')?'badge-ma':prj.type==='Implement'?'badge-implement':'badge-runrate'}`}>{prj.type}</span>
                    </div>
                    <div style={{fontSize:18,fontWeight:800,color:'var(--text)',marginBottom:4}}>{prj.name}</div>
                    <div style={{fontSize:13,color:'var(--text-muted)'}}>{prj.customer} — SO: {prj.soRef}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <button className="btn btn-primary btn-sm" onClick={handleOpenAddTicket}>+ เพิ่ม Ticket</button>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                  {[['ผู้ดูแลหลัก',prj.staff],['Sales ผู้ดูแล', prj.salesPM ? `${prj.salesPM.name} (${prj.salesPM.nickname || 'วี'})` : 'คุณวีระ ศรีสุข (วี)'],['เริ่มต้น',prj.startDate],['สิ้นสุด',prj.endDate],['ความคืบหน้า',`${prj.progress}%`]].map(([k,v],i) => (
                    <div key={i} style={{background:'var(--bg)',borderRadius:8,padding:'10px 12px'}}>
                      <div style={{fontSize:10.5,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{k}</div>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-muted)',marginBottom:6}}>
                    <span>Overall Progress</span><span>{prj.progress}%</span>
                  </div>
                  <div style={{background:'var(--border)',borderRadius:4,height:8,overflow:'hidden'}}>
                    <div style={{width:`${prj.progress}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#10b981)',borderRadius:4,transition:'width .3s'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="card">
              <div className="card-header"><div className="card-title">Tickets ในโครงการ</div>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{(prj.tickets || []).length} tickets</span>
              </div>
              
              {view === 'list' ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>หัวข้องาน</th>
                        <th>ผู้รับผิดชอบ</th>
                        <th>กำหนดส่ง</th>
                        <th>ความคืบหน้า</th>
                        <th>สถานะ</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(prj.tickets || []).map(tk => (
                        <tr key={tk.id}>
                          <td className="td-id">{tk.id}</td>
                          <td className="td-name">{tk.title}</td>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div className="mini-avatar" style={{background: tk.assignee==='-'?'#e2e8f0':'#6366f1',color: tk.assignee==='-'?'#94a3b8':'#fff'}}>
                                {tk.assignee==='-'?'?':tk.assignee.charAt(0)}
                              </div>
                              <span style={{fontSize:13}}>{tk.assignee}</span>
                            </div>
                          </td>
                          <td className="td-muted">{tk.due}</td>
                          <td style={{minWidth:120}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <ProgressBar pct={tk.pct} color={tk.pct===100?'var(--secondary)':'var(--primary)'} />
                              <span style={{fontSize:11,fontWeight:700,whiteSpace:'nowrap',color:'var(--text-muted)'}}>{tk.pct}%</span>
                            </div>
                          </td>
                          <td><span className={`badge ${sColors[tk.status]||'badge-draft'}`}>{tk.status}</span></td>
                          <td>
                            <div className="td-actions">
                              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/tickets/${tk.id}`)}>เปิด</button>
                              <button className="btn btn-sm" style={{background:'var(--primary)',color:'#fff'}} onClick={() => handleOpenAssign(tk.id)}>Assign</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="kanban-board" style={{padding: '0 18px 18px', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)'}}>
                  {['Open', 'In Progress', 'Pending', 'Done'].map(status => {
                    const statusTk = (prj.tickets || []).filter(t => t.status === status || (status==='Done' && t.status==='Closed'));
                    const colColor = status === 'Open' ? '#6366f1' : status === 'In Progress' ? '#f59e0b' : status === 'Pending' ? '#3b82f6' : '#10b981';
                    return (
                      <div className="kanban-col" key={status} style={{background: 'var(--bg)', borderRadius: 12, padding: 12, minWidth: 160}}>
                        <div className="kanban-col-header" style={{color: colColor, marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700}}>
                          <span style={{fontSize: 12, display: 'flex', alignItems: 'center', gap: 6}}>
                            <div style={{width: 6, height: 6, borderRadius: '50%', background: colColor}}></div>
                            {status === 'Open' ? 'Open' : status === 'In Progress' ? 'In Progress' : status === 'Pending' ? 'Scheduled' : 'Closed'}
                          </span>
                          <span className="kanban-count" style={{background: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 10}}>{statusTk.length}</span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                          {statusTk.length === 0 ? (
                            <div style={{textAlign: 'center', padding: '20px 10px', fontSize: 12, color: 'var(--text-light)', border: '1px dashed var(--border)', borderRadius: 8}}>ไม่มีงาน</div>
                          ) : (
                            statusTk.map(t => (
                              <div key={t.id} className="ticket-card" onClick={() => navigate(`/tickets/${t.id}`)} style={{cursor:'pointer', background: '#fff', padding: 10, borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-light)', marginBottom: 4}}>
                                  <span style={{fontFamily: 'monospace', fontWeight: 700}}>{t.id}</span>
                                </div>
                                <div style={{fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3}}>{t.title}</div>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)'}}>
                                  <span style={{display: 'flex', alignItems: 'center', gap: 4}}>👤 {t.assignee}</span>
                                  <span>📅 {t.due}</span>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
