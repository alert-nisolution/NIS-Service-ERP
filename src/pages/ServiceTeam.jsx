import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, saveProjects } from '../mockDb';

const STAFF_MEMBERS = [
  { name: 'Krit P.', role: 'Senior Network & Security Engineer', avatar: 'KP', email: 'krit.p@nis.co.th', phone: '081-222-3344', skills: ['Firewall', 'Network', 'Server'], status: 'Onsite — PTT Digital', statusColor: '#f59e0b', utilization: 85 },
  { name: 'Nok S.', role: 'Network & System Engineer', avatar: 'NS', email: 'nok.s@nis.co.th', phone: '085-555-6677', skills: ['Network', 'WiFi', 'CCTV'], status: 'Onsite — SCG Cement', statusColor: '#f59e0b', utilization: 60 },
  { name: 'Pom T.', role: 'System & Virtualization Engineer', avatar: 'PT', email: 'pom.t@nis.co.th', phone: '089-888-9900', skills: ['Server', 'Windows AD', 'VMware'], status: 'Available (ในสำนักงาน)', statusColor: '#10b981', utilization: 40 },
  { name: 'Ann K.', role: 'Software & Application Support Specialist', avatar: 'AK', email: 'ann.k@nis.co.th', phone: '084-444-5566', skills: ['Software', 'Monitoring'], status: 'Available (ในสำนักงาน)', statusColor: '#10b981', utilization: 20 },
  { name: 'Art W.', role: 'Desktop & Technical Support Engineer', avatar: 'AW', email: 'art.w@nis.co.th', phone: '087-777-8899', skills: ['PC&Notebook', 'Support'], status: 'Available (ในสำนักงาน)', statusColor: '#10b981', utilization: 50 }
];

const avatarColors = {
  'KP': '#6366f1',
  'NS': '#10b981',
  'PT': '#f59e0b',
  'AK': '#3b82f6',
  'AW': '#8b5cf6'
};

export default function ServiceTeam() {
  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('Krit P.');
  const [viewingStaffName, setViewingStaffName] = useState(null);

  // Flat map all tickets from mockDb projects
  const allTickets = projectsList.flatMap(p => 
    p.tickets.map(t => ({
      ...t,
      projectId: p.id,
      projectName: p.name
    }))
  );

  // Filter open or pending tickets for assignment selection
  const assignableTickets = allTickets.filter(t => t.status !== 'Closed' && t.status !== 'Done');

  const handleQuickAssign = () => {
    if (!selectedTicket) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'กรุณาเลือก Ticket', message: 'กรุณาเลือกตั๋วงานที่ต้องการส่งมอบ', type: 'error' }
      }));
      return;
    }

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
    setSelectedTicket('');

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { 
        title: 'มอบหมายงานด่วนสำเร็จ', 
        message: `ย้ายงาน Ticket ${selectedTicket} ให้กับ ${selectedStaff} เรียบร้อยแล้ว`, 
        type: 'success' 
      }
    }));
  };

  // Helper to count active tickets for a staff member
  const getActiveTicketCount = (staffName) => {
    return allTickets.filter(t => t.assignee === staffName && t.status !== 'Closed' && t.status !== 'Done').length;
  };

  return (
    <div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Service Team Matrix — โครงสร้างทีมบริการ</div>
          <div className="page-subtitle">จัดการวิศวกรระบบ ตรวจสอบภาระงาน และการกระจายงานสำหรับ Staff (คลิกที่พนักงานเพื่อดูรายละเอียดงาน)</div>
        </div>
      </div>

      {/* Team Hierarchy Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Left: Organization chart wrapper */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, color: 'var(--text)' }}>ผังสายงานทีมบริการ (Service Department Hierarchy)</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative' }}>
            {/* Manager Box */}
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              borderRadius: 12,
              padding: '14px 24px',
              textAlign: 'center',
              color: '#fff',
              boxShadow: 'var(--shadow-md)',
              width: 260,
              zIndex: 2
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8, letterSpacing: 0.5, marginBottom: 3 }}>Department Lead</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Somchai M.</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Service Manager (ผู้จัดการแผนกบริการ)</div>
              <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 6 }}>
                🔑 สิทธิ์จัดสรรและควบคุมงาน
              </div>
            </div>

            {/* Vertical Line */}
            <div style={{
              width: 2,
              height: 24,
              background: 'var(--border)',
              zIndex: 1
            }}></div>

            {/* Horizontal bridge line container */}
            <div style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%'
            }}>
              {/* Staff Nodes */}
              {STAFF_MEMBERS.map(s => {
                const ticketsCount = getActiveTicketCount(s.name);
                return (
                  <div 
                    key={s.name} 
                    onClick={() => setViewingStaffName(s.name)}
                    style={{
                      background: 'var(--surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      width: 140,
                      textAlign: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: avatarColors[s.avatar] || '#6366f1',
                      color: '#fff', fontWeight: 700, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 6px'
                    }}>{s.avatar}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 6 }}>Staff / Engineer</div>
                    <div style={{ 
                      fontSize: 10.5, 
                      background: ticketsCount > 0 ? '#fee2e2' : '#f0fdf4',
                      color: ticketsCount > 0 ? '#ef4444' : '#10b981',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 700,
                      display: 'inline-block'
                    }}>
                      งานคงค้าง: {ticketsCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Quick Assign Tool */}
        <div className="card" style={{ padding: 22, height: 'fit-content' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: 'var(--text)' }}>⚡ ทดสอบการมอบหมายงานด่วน (Quick Assign)</div>
          
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>1. เลือกตั๋วงานที่ต้องการจ่าย (Active Tickets)</label>
            <select value={selectedTicket} onChange={e => setSelectedTicket(e.target.value)} style={{ marginTop: 6 }}>
              <option value="">-- เลือก Ticket --</option>
              {assignableTickets.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.title.length > 30 ? t.title.substring(0, 30) + '...' : t.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>2. เลือก Staff ที่รับมอบหมาย</label>
            <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} style={{ marginTop: 6 }}>
              {STAFF_MEMBERS.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleQuickAssign}>
            ✓ มอบหมายงานทันที
          </button>
        </div>
      </div>

      {/* Staff Grid Matrix Detail */}
      <div className="card">
        <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title">ข้อมูลวิศวกรและประสิทธิภาพปฏิบัติงาน (Staff Workload Matrix)</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วิศวกร (Staff)</th>
                <th>ทักษะความชำนาญ (Skills)</th>
                <th>สถานะการทำงาน (Onsite Status)</th>
                <th style={{ textAlign: 'center' }}>จำนวนตั๋วถือครอง</th>
                <th>ประสิทธิภาพ (Workload Utilization)</th>
                <th>รายละเอียดติดต่อ</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_MEMBERS.map(s => {
                const activeCount = getActiveTicketCount(s.name);
                const utilizationRate = Math.min(100, activeCount * 25 + 10); // Dynamic workload computation
                const uColor = utilizationRate > 80 ? '#ef4444' : utilizationRate > 50 ? '#f59e0b' : '#10b981';

                return (
                  <tr key={s.name}>
                    <td 
                      onClick={() => setViewingStaffName(s.name)} 
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => {
                        const nameEl = e.currentTarget.querySelector('.staff-name-text');
                        if (nameEl) nameEl.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={e => {
                        const nameEl = e.currentTarget.querySelector('.staff-name-text');
                        if (nameEl) nameEl.style.color = 'var(--text)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: avatarColors[s.avatar] || '#6366f1',
                          color: '#fff', fontWeight: 800, fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{s.avatar}</div>
                        <div>
                          <div className="staff-name-text" style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', transition: 'color 0.2s' }}>{s.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {s.skills.map(sk => (
                          <span key={sk} style={{
                            background: '#f1f5f9', color: '#475569',
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                          }}>{sk}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.statusColor }}></div>
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{activeCount > 0 ? (activeCount >= 2 ? `Onsite (งานล้นมือ ${activeCount} ใบ)` : 'Onsite หน้างานลูกค้า') : 'Available (ว่าง/สแตนบาย)'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, color: activeCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {activeCount} ใบ
                    </td>
                    <td style={{ minWidth: 150 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${utilizationRate}%`, height: '100%', background: uColor, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{utilizationRate}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📞 {s.phone} <br />
                        ✉️ {s.email}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Tickets Modal */}
      {viewingStaffName && (() => {
        const staff = STAFF_MEMBERS.find(s => s.name === viewingStaffName);
        const staffTickets = allTickets.filter(t => t.assignee === viewingStaffName);
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
            animation: 'modalFadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 800,
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideUp 0.3s ease-out'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, var(--surface), var(--border-light))'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: avatarColors[staff.avatar] || '#6366f1',
                    color: '#fff', fontWeight: 800, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{staff.avatar}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                      งานในมือของ {staff.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {staff.role} • มีงานทั้งหมด {staffTickets.length} ใบ (งานยังไม่เสร็จ {staffTickets.filter(t => t.status !== 'Closed' && t.status !== 'Done').length} ใบ)
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingStaffName(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 24,
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {staffTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>ไม่มีงานที่ได้รับมอบหมายในขณะนี้</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>คุณสามารถใช้เครื่องมือ Quick Assign ด้านบนเพื่อมอบหมายงานด่วนได้</div>
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>หัวข้อ (Title)</th>
                          <th>โครงการ (Project)</th>
                          <th>ความสำคัญ (Priority)</th>
                          <th>สถานะ (Status)</th>
                          <th style={{ textAlign: 'center' }}>การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffTickets.map(t => {
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
                              <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                                {t.id}
                              </td>
                              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.title}>
                                <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                                  {t.title}
                                </span>
                              </td>
                              <td style={{ fontSize: 12.5 }}>
                                {t.projectName}
                              </td>
                              <td>
                                <span style={{
                                  background: priorityColor + '15',
                                  color: priorityColor,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700
                                }}>{t.priority || 'Normal'}</span>
                              </td>
                              <td>
                                <span style={{
                                  background: statusBg,
                                  color: statusText,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 11.5,
                                  fontWeight: 700
                                }}>{t.status}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <Link 
                                  to={`/tickets/${t.id}`}
                                  className="btn btn-secondary"
                                  style={{ 
                                    padding: '4px 10px', 
                                    fontSize: 11.5,
                                    borderRadius: 6,
                                    display: 'inline-flex',
                                    gap: 4
                                  }}
                                  onClick={() => setViewingStaffName(null)}
                                >
                                  ดูรายละเอียด ↗
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'var(--surface-light)'
              }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setViewingStaffName(null)}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
