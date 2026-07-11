import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { getProjects, saveProjects, getNisStock, saveNisStock, getNextServiceReportNumber, addServiceReport, addClaim, addClaimNotification, getNextClaimNumber, getPendingTickets, savePendingTickets, getPersonalChecklists, savePersonalChecklists, getCustomers } from '../mockDb';

/* ─────────────────── Signature Pad Component ─────────────────── */
function SignaturePad({ onSign, width = 440, height = 130 }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [signed, setSigned] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1e293b';
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
  const endDraw = () => setDrawing(false);
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setSigned(false); };
  const confirm = () => { if (signed) onSign(canvasRef.current.toDataURL()); };

  return (
    <div>
      <div style={{ border: '2px solid #cbd5e1', borderRadius: 10, background: '#fff', position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={width} height={height}
          style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <div style={{ position: 'absolute', bottom: 10, left: 24, right: 24, borderTop: '1px dashed #94a3b8', pointerEvents: 'none' }}>
          <span style={{ fontSize: 10, color: '#94a3b8', background: '#fff', padding: '0 6px', position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontFamily: 'Prompt, sans-serif' }}>เซ็นชื่อรับงานที่นี่</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <button onClick={clear} style={{ ...btnStyle, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>ล้าง</button>
        <button onClick={confirm} disabled={!signed} style={{ ...btnStyle, background: signed ? '#16a34a' : '#a1a1aa', color: '#fff', border: 'none', opacity: signed ? 1 : 0.5 }}>✓ ยืนยันลายเซ็น</button>
      </div>
    </div>
  );
}

const btnStyle = { padding: '6px 14px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' };

const STAFF_MEMBERS = [
  { name: 'Krit P.', role: 'Senior Network & Security Engineer', avatar: 'KP', email: 'krit.p@nis.co.th', phone: '081-222-3344', username: 'krit', password: '123', skills: ['Firewall', 'Network', 'Server'] },
  { name: 'Nok S.', role: 'Network & System Engineer', avatar: 'NS', email: 'nok.s@nis.co.th', phone: '085-555-6677', username: 'nok', password: '123', skills: ['Network', 'WiFi', 'CCTV'] },
  { name: 'Pom T.', role: 'System & Virtualization Engineer', avatar: 'PT', email: 'pom.t@nis.co.th', phone: '089-888-9900', username: 'pom', password: '123', skills: ['Server', 'Windows AD', 'VMware'] },
  { name: 'Ann K.', role: 'Software & Application Support Specialist', avatar: 'AK', email: 'ann.k@nis.co.th', phone: '084-444-5566', username: 'ann', password: '123', skills: ['Software', 'Monitoring'] },
  { name: 'Art W.', role: 'Desktop & Technical Support Engineer', avatar: 'AW', email: 'art.w@nis.co.th', phone: '087-777-8899', username: 'art', password: '123', skills: ['PC&Notebook', 'Support'] }
];

const avatarColors = {
  'KP': '#6366f1',
  'NS': '#10b981',
  'PT': '#f59e0b',
  'AK': '#3b82f6',
  'AW': '#8b5cf6'
};

/* ─────────────────── Install Checklist Items ─────────────────── */
const INSTALL_CHECKS = [
  'ตรวจสอบรายการสินค้า',
  'PreConfig อุปกรณ์',
  'ติดตั้ง Rack',
  'เดินสาย',
  'Config Network',
  'Config Firewall',
  'ทดสอบ Internet',
  'ทดสอบ Internal',
  'จัดทำ Network Diagram',
  'บันทึก IP/Password',
  'ส่งมอบงาน'
];

const MA_CHECKS = [
  'ตรวจสอบ Log/Event',
  'ตรวจสอบ CPU/Memory/Disk',
  'Update Firmware',
  'ตรวจสอบ HA Cluster',
  'Remote Backup Config',
  'ทดสอบ Failover',
  'บันทึกผล Monthly Report'
];

const PM_CHECKS = [
  'ตรวจสอบสถานะ Power Supply',
  'ตรวจสอบอุณหภูมิ Rack/ห้อง Server',
  'ตรวจสอบสายเคเบิลและการเชื่อมต่อ',
  'ตรวจสอบสถานะ LED/Alarm',
  'ทำความสะอาด Filter/พัดลม',
  'ตรวจสอบ UPS และ Battery',
  'บันทึกภาพถ่ายอุปกรณ์ทั้งหมด',
  'สรุปรายงาน PM'
];

/* ─────────────────── PDF Preview Modal ─────────────────── */
function PdfHeader({ pageNum }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', color: '#fff', padding: '16px 20px', textAlign: 'center', position: 'relative' }}>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Kanit, sans-serif', letterSpacing: 0.5 }}>NIS — Network Integration Service</div>
      <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>บริษัท เน็ตเวิร์ค อินทิเกรชั่น เซอร์วิส จำกัด</div>
      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>123/45 อาคาร NIS Tower ถ.พหลโยธิน กรุงเทพฯ 10400 | โทร. 02-123-4567</div>
      <div style={{ position: 'absolute', right: 15, bottom: 8, fontSize: 9.5, opacity: 0.7, fontWeight: 600 }}>หน้า {pageNum}</div>
    </div>
  );
}

/* ─────────────────── PDF Preview Modal ─────────────────── */
function PdfPreviewModal({ onClose, data, onOpenEmail }) {
  const isPm = data.ticketType === 'PM';
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 680, maxHeight: '95vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', borderRadius: 14, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', fontFamily: 'Prompt, sans-serif' }}>
        
        {/* Top Control Bar */}
        <div style={{ background: '#0f172a', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>📄 ตัวอย่างเอกสารก่อนส่ง (PDF Preview Simulator)</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11.5 }}>ปิด x</button>
        </div>

        {/* Paper Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          
          {/* PAGE 1 */}
          <div style={{ width: '100%', minHeight: 650, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '24px 28px', boxSizing: 'border-box' }}>
            <PdfHeader pageNum={1} />
            
            {/* SR Number */}
            <div style={{ textAlign: 'center', margin: '14px 0 16px' }}>
              <span style={{ background: '#1e40af', color: '#fff', padding: '6px 20px', borderRadius: 6, fontSize: 13.5, fontWeight: 800, fontFamily: 'Kanit, sans-serif' }}>
                Service Report: {data.srNumber}
              </span>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11.5, marginBottom: 16 }}>
              <div style={{ ...pdfInfoBox }}>
                <div style={pdfLabel}>ลูกค้า</div>
                <div style={pdfVal}>{data.customer}</div>
                <div style={pdfLabel}>ที่อยู่</div>
                <div style={{ ...pdfVal, fontSize: 11 }}>{data.location}</div>
                <div style={pdfLabel}>ผู้ติดต่อ</div>
                <div style={pdfVal}>{data.contactName} | {data.contactPhone}</div>
              </div>
              <div style={{ ...pdfInfoBox }}>
                <div style={pdfLabel}>เจ้าหน้าที่เทคนิค</div>
                <div style={pdfVal}>{data.engineerName} ({data.engineerNick})</div>
                <div style={pdfLabel}>Check-in</div>
                <div style={pdfVal}>{data.checkIn}</div>
                <div style={pdfLabel}>Check-out</div>
                <div style={pdfVal}>{data.checkOut || '-'}</div>
              </div>
            </div>

            {/* Ticket Info */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 11.5 }}>
              <div style={pdfLabel}>Ticket</div>
              <div style={pdfVal}>{data.ticketId} — {data.ticketTitle}</div>
              <div style={{ ...pdfLabel, marginTop: 4 }}>ประเภท</div>
              <div style={pdfVal}>{data.ticketType}</div>
            </div>

            {/* Checklist Results */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, fontFamily: 'Kanit, sans-serif' }}>ผลการตรวจสอบ (Checklist Summary)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10.5 }}>
                {data.checklist.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', background: c.done ? '#f0fdf4' : '#fef2f2', borderRadius: 4 }}>
                    <span>{c.done ? '✅' : '⬜'}</span>
                    <span style={{ textDecoration: c.done ? 'line-through' : '', color: c.done ? '#166534' : '#334155' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Details */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, fontFamily: 'Kanit, sans-serif' }}>สรุปรายละเอียดการดำเนินการ</div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, fontSize: 11, minHeight: 36, whiteSpace: 'pre-wrap' }}>
                {isPm ? (data.workDetail || `ดำเนินการตรวจบำรุงรักษาเชิงป้องกัน (Preventive Maintenance) เรียบร้อยแล้ว รวมจำนวน ${data.rackPhotos?.length || 0} รายการ (รายละเอียดภาพถ่ายและบันทึกผลงานในหน้าถัดไป)`) : (data.workDetail || '(ไม่ได้ระบุ)')}
              </div>
            </div>

            {data.issueDetail && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, fontFamily: 'Kanit, sans-serif' }}>ปัญหาที่พบ</div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 8, fontSize: 11, minHeight: 24, whiteSpace: 'pre-wrap' }}>
                  {data.issueDetail}
                </div>
              </div>
            )}

            {/* Replaced Device (Only if not PM and has data) */}
            {!isPm && data.replacedDevice && data.replacedDevice.brand && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 11 }}>
                <div style={{ fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>🔄 รายละเอียดการเปลี่ยนอุปกรณ์ทดแทน</div>
                <div>นำสินค้าออกคลัง: <strong>{data.checkedOutItems?.map(i => i.name).join(', ') || '-'}</strong></div>
                <div>ถอดอุปกรณ์เดิมของลูกค้า: <strong>{data.replacedDevice.brand} {data.replacedDevice.model} (S/N: {data.replacedDevice.sn})</strong></div>
              </div>
            )}

            {/* Photos (If available) */}
            {data.photos && data.photos.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, fontFamily: 'Kanit, sans-serif' }}>ภาพถ่ายประกอบการปฏิบัติงาน</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.photos.map((_, i) => (
                    <div key={i} style={{ width: 54, height: 54, background: '#e2e8f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#64748b', border: '1px solid #cbd5e1' }}>
                      📷 รูปที่ {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature on Page 1 */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, fontFamily: 'Kanit, sans-serif' }}>ลงชื่อรับมอบงาน (Customer Signature)</div>
              {data.signature ? (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 6, background: '#fff', textAlign: 'center', maxWidth: 220 }}>
                  <img src={data.signature} alt="ลายเซ็น" style={{ height: 48, objectFit: 'contain' }} />
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 4, paddingTop: 2, fontSize: 9.5, color: '#94a3b8' }}>
                    ผู้รับมอบงาน: {data.contactName}
                  </div>
                </div>
              ) : (
                data.skipSignature ? (
                  <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '10px 14px', background: '#f8fafc', maxWidth: 220, fontSize: 11.5, color: '#64748b', fontWeight: 600, fontFamily: 'Prompt, sans-serif' }}>
                    💡 ได้รับการยกเว้นลายเซ็น<br />
                    <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>(งานรีโมท / ตรวจสอบระบบ)</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 10.5, color: '#94a3b8' }}>(ยังไม่ได้ลงลายเซ็น)</div>
                )
              )}
            </div>

          </div>

          {/* PAGE 2 (Only if PM) */}
          {isPm && (
            <div style={{ width: '100%', minHeight: 650, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '24px 28px', boxSizing: 'border-box' }}>
              <PdfHeader pageNum={2} />
              
              <div style={{ textAlign: 'center', margin: '14px 0 16px' }}>
                <span style={{ background: '#0f172a', color: '#fff', padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 800, fontFamily: 'Kanit, sans-serif' }}>
                  รายงานการตรวจบำรุงรักษา (PM Site Audit Detail)
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, fontStyle: 'italic' }}>
                รายละเอียดตารางภาพถ่ายตู้ Rack และ อุปกรณ์ ก่อนทำ-หลังทำ สำหรับการซ่อมบำรุงเชิงป้องกัน:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.rackPhotos && data.rackPhotos.length > 0 ? (
                  data.rackPhotos.map((rp, i) => (
                    <div key={rp.id || i} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, background: '#f8fafc' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>
                        🖥️ อุปกรณ์ / ตู้ Rack: {rp.name}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: '#475569', background: '#fff', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                          <strong>📍 สถานที่:</strong> {rp.location}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', background: '#fff', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                          <strong>📝 หมายเหตุ:</strong> {rp.remark || 'ไม่มี'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {/* Before block */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: 6, padding: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>📸 ภาพถ่ายก่อนทำ (Before)</span>
                          {rp.beforePhoto ? (
                            <img src={rp.beforePhoto} style={{ width: 110, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} alt="Before" />
                          ) : (
                            <div style={{ width: 110, height: 72, background: '#f1f5f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, color: '#94a3b8' }}>
                              (ไม่ได้ถ่าย)
                            </div>
                          )}
                        </div>

                        {/* After block */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', background: '#fff', border: '1.5px dashed #cbd5e1', borderRadius: 6, padding: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>📸 ภาพถ่ายหลังทำ (After)</span>
                          {rp.afterPhoto ? (
                            <img src={rp.afterPhoto} style={{ width: 110, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} alt="After" />
                          ) : (
                            <div style={{ width: 110, height: 72, background: '#f1f5f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, color: '#94a3b8' }}>
                              (ไม่ได้ถ่าย)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11.5, padding: '20px 0' }}>
                    ไม่มีรายละเอียดตู้ Rack หรือ อุปกรณ์ เพิ่มเติม
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Control Bar */}
        <div style={{ borderTop: '1px solid #cbd5e1', padding: '12px 20px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>NIS Service Platform • PDF Preview Simulator</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {data.signature && onOpenEmail && (
              <button onClick={() => { onClose(); onOpenEmail(); }} style={{ ...btnStyle, background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', padding: '8px 20px', fontSize: 12.5 }}>
                📧 ส่ง Email ปิดงาน
              </button>
            )}
            <button onClick={onClose} style={{ ...btnStyle, background: '#1e40af', color: '#fff', border: 'none', padding: '8px 20px', fontSize: 12.5 }}>ปิด Preview</button>
          </div>
        </div>

      </div>
    </div>
  );
}

const pdfInfoBox = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 };
const pdfLabel = { fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 1 };
const pdfVal = { fontSize: 12, color: '#0f172a', fontWeight: 700, marginBottom: 6 };

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function IpadOnsiteTest() {
  /* ── State: Data ── */
  const [projectsList, setProjectsList] = useState(() => getProjects());
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [nisStock] = useState(() => getNisStock());

  /* ── State: Authentication ── */
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  /* ── State: Staff Portal Tabs & Sub-features ── */
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'kanban' | 'calendar' | 'checklist' | 'request' | 'inventory'
  const [personalChecklists, setPersonalChecklists] = useState(() => getPersonalChecklists());
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoRemindDateTime, setNewTodoRemindDateTime] = useState('');
  const [stockList, setStockList] = useState(() => getNisStock());
  
  // Return spares state
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnHistory, setReturnHistory] = useState([]);
  
  // Stock intake form state
  const [addForm, setAddForm] = useState({ name: '', brand: '', model: '', sn: '', qty: 1 });

  // Ticket request states
  const [reqTitle, setReqTitle] = useState('');
  const [reqProject, setReqProject] = useState('PRJ-GENERAL');
  const [reqSite, setReqSite] = useState('NIS Office / Remote');
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

  // Derive sites list from selected project (for ticket request form)
  const dynamicSites = useMemo(() => {
    const proj = projectsList.find(p => p.id === reqProject);
    if (!proj) return ['NIS Office / Remote'];
    const cust = customersList.find(c => {
      const cn = (c.name || '').toLowerCase();
      const pc = (proj.customer || '').toLowerCase();
      return cn.includes(pc) || pc.includes(cn);
    });
    if (cust && cust.locations && cust.locations.length > 0) {
      return cust.locations.map(loc => `${loc.label} (${loc.address})`);
    }
    return [proj.location || 'NIS Office / Remote'];
  }, [reqProject, projectsList, customersList]);

  /* ── Authentication Handlers ── */
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const user = usernameInput.trim().toLowerCase();
    const pass = passwordInput;
    
    const staff = STAFF_MEMBERS.find(s => s.username === user && s.password === pass);
    if (staff) {
      setLoggedInStaff(staff);
      setLoginError('');
      setUsernameInput('');
      setPasswordInput('');
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'เข้าสู่ระบบสำเร็จ', message: `สวัสดีคุณ ${staff.name} ยินดีต้อนรับสู่ระบบปฏิบัติการ`, type: 'success' }
      }));
    } else {
      setLoginError('❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };
  
  const handleQuickLogin = (staff) => {
    setLoggedInStaff(staff);
    setLoginError('');
    setUsernameInput('');
    setPasswordInput('');
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'เข้าสู่ระบบสำเร็จ (Quick Login)', message: `สวัสดีคุณ ${staff.name} ยินดีต้อนรับสู่ระบบปฏิบัติการ`, type: 'success' }
    }));
  };
  
  const handleLogout = () => {
    setLoggedInStaff(null);
    setSelectedTicketId('');
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ออกจากระบบแล้ว', message: 'คุณได้ออกจากระบบปฏิบัติการเรียบร้อยแล้ว', type: 'info' }
    }));
  };

  /* ── Staff Portal Handlers ── */
  const handleAddTodo = () => {
    if (!newTodoText.trim() || !loggedInStaff) return;
    const staffName = loggedInStaff.name;
    const staffTodos = personalChecklists[staffName] || [];
    const newTodo = {
      id: Date.now(),
      text: newTodoText.trim(),
      remindDateTime: newTodoRemindDateTime || null,
      done: false
    };
    const updated = {
      ...personalChecklists,
      [staffName]: [...staffTodos, newTodo]
    };
    setPersonalChecklists(updated);
    savePersonalChecklists(updated);
    setNewTodoText('');
    setNewTodoRemindDateTime('');
  };

  const handleToggleTodo = (todoId) => {
    if (!loggedInStaff) return;
    const staffName = loggedInStaff.name;
    const staffTodos = personalChecklists[staffName] || [];
    const updatedTodos = staffTodos.map(todo => 
      todo.id === todoId ? { ...todo, done: !todo.done } : todo
    );
    const updated = {
      ...personalChecklists,
      [staffName]: updatedTodos
    };
    setPersonalChecklists(updated);
    savePersonalChecklists(updated);
  };

  const handleDeleteTodo = (todoId) => {
    if (!loggedInStaff) return;
    const staffName = loggedInStaff.name;
    const staffTodos = personalChecklists[staffName] || [];
    const updatedTodos = staffTodos.filter(todo => todo.id !== todoId);
    const updated = {
      ...personalChecklists,
      [staffName]: updatedTodos
    };
    setPersonalChecklists(updated);
    savePersonalChecklists(updated);
  };

  const handleRequestTicket = (e) => {
    e.preventDefault();
    if (!reqTitle.trim() || !loggedInStaff) {
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
      requestedBy: loggedInStaff.name,
      status: 'Pending Approval',
      requestTime: new Date().toLocaleString('th-TH')
    };

    const updated = [newRequest, ...getPendingTickets()];
    savePendingTickets(updated);
    setPendingList(updated);

    // Reset Form
    setReqTitle('');
    setReqProject('PRJ-GENERAL');
    setReqSite('NIS Office / Remote');
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
    setAddForm({ name: '', brand: '', model: '', sn: '', qty: 1 });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'นำเข้าสินค้าสำเร็จ', message: `เพิ่ม ${newStockItem.name} จำนวน ${newStockItem.qty} ชิ้น เข้าสต็อกแล้ว`, type: 'success' }
    }));
  };

  // Handle Return Stock
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

  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    const currentProjects = getProjects();
    const updatedProjects = currentProjects.map(p => {
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

  /* ── Helper Render: Login Screen ── */
  const renderLoginScreen = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '650px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #111827 100%)',
        fontFamily: 'Prompt, sans-serif',
        color: '#fff',
        padding: '20px',
        borderRadius: '20px',
        boxSizing: 'border-box'
      }}>
        {/* iPad Lockscreen Date & Clock */}
        <div style={{ textAlign: 'center', marginBottom: 20, textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'Kanit, sans-serif', letterSpacing: 0.5 }}>
            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </div>
          <div style={{ fontSize: 11.5, color: '#a5b4fc', marginTop: 2, fontWeight: 500 }}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          width: '100%',
          maxWidth: '360px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc', fontFamily: 'Kanit, sans-serif' }}>NIS ONSITE SYSTEM</div>
            <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>เข้าสู่ระบบปฏิบัติงานสำหรับเจ้าหน้าที่ (Staff Login)</div>
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '11px',
              color: '#fca5a5',
              marginBottom: 12,
              textAlign: 'center'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 600, color: '#a5b4fc', display: 'block', marginBottom: 4 }}>ชื่อผู้ใช้งาน (Username)</label>
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="เช่น krit, nok, pom..."
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'Prompt, sans-serif',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 600, color: '#a5b4fc', display: 'block', marginBottom: 4 }}>รหัสผ่าน (Password)</label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="ป้อนรหัสผ่าน..."
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'Prompt, sans-serif',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 0',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Prompt, sans-serif',
                marginTop: 4,
                boxShadow: '0 8px 12px -3px rgba(124, 58, 237, 0.3)'
              }}
            >
              🔐 เข้าสู่ระบบ (Sign In)
            </button>
          </form>
        </div>

        {/* Quick Login Test Accounts Helper */}
        <div style={{
          width: '100%',
          maxWidth: '360px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginTop: 14,
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#c084fc', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 }}>
            🔑 บัญชีทดสอบด่วน (Quick Test Accounts)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {STAFF_MEMBERS.map(staff => (
              <button
                key={staff.username}
                onClick={() => handleQuickLogin(staff)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#e2e8f0',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: avatarColors[staff.avatar] || '#6366f1',
                    color: '#fff', fontSize: '8px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{staff.avatar}</span>
                  <div>
                    <strong>{staff.name}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#a5b4fc', fontFamily: 'monospace' }}>
                  {staff.username} / {staff.password}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ── Helper Render: Staff Dashboard ── */
  const renderStaffDashboard = () => {
    return (
      <div style={{ fontFamily: 'Prompt, sans-serif' }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: avatarColors[loggedInStaff.avatar] || '#6366f1',
              color: '#fff', fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{loggedInStaff.avatar}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{loggedInStaff.name}</div>
              <div style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>{loggedInStaff.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9.5, background: 'linear-gradient(135deg,#1e40af,#7c3aed)', color: '#fff', padding: '3px 8px', borderRadius: 20, fontWeight: 700, fontFamily: 'Kanit, sans-serif' }}>STAFF PORTAL</span>
            <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'Prompt, sans-serif' }}>
              Logout ✕
            </button>
          </div>
        </div>

        {/* Pending Accept Notification Banner */}
        {pendingAcceptTickets.length > 0 && (
          <div style={{ border: '1.5px solid #fca5a5', background: '#fef2f2', borderRadius: '10px', padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: '11px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              🔔 มีตั๋วงานมอบหมายใหม่! (New Assignment)
            </div>
            <div style={{ fontSize: '10px', color: '#7f1d1d' }}>
              โปรดตรวจสอบและกดตอบรับ (Accept) ในแท็บรายการงานเพื่อยืนยันปฏิบัติงาน
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'ตั๋วงานทั้งหมด', value: assignedTickets.length, desc: 'งานในความดูแล', icon: '📋', color: '#6366f1' },
            { label: 'งานรอตอบรับ', value: pendingAcceptTickets.length, desc: 'งานใหม่รอ Accept', icon: '⌛', color: pendingAcceptTickets.length > 0 ? '#ef4444' : '#64748b', pulse: pendingAcceptTickets.length > 0 },
            { label: 'กำลังดำเนินการ', value: inProgressTicketsCount, desc: 'Onsite / ทำงาน', icon: '🔧', color: '#f59e0b' },
            { label: 'งานเกินกำหนด', value: overdueTickets.length, desc: 'เลยดิวส่งมอบ', icon: '⚠️', color: overdueTickets.length > 0 ? '#ef4444' : '#10b981', pulse: overdueTickets.length > 0 },
            { label: 'งานที่ปิดแล้ว', value: closedTicketsCount, desc: 'MTD Completed', icon: '✓', color: '#10b981' },
            { label: 'อุปกรณ์ที่เบิก', value: staffWithdrawnItems.reduce((acc, curr) => acc + curr.qtyOut, 0) + ' ชิ้น', desc: 'ยอดค้างติดตัว', icon: '📦', color: '#8b5cf6' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              position: 'relative',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              {stat.pulse && (
                <span className="pulse-badge" style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: stat.color + '12', color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0
              }}>
                {stat.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontFamily: 'Kanit, sans-serif', lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: 2,
          marginBottom: 12,
          background: '#e2e8f0',
          borderRadius: 8,
          padding: 2,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {[
            { id: 'tickets', label: '📌 รายการงาน' },
            { id: 'kanban', label: '📋 บอร์ดคันบัง' },
            { id: 'calendar', label: '📅 ปฏิทินงาน' },
            { id: 'checklist', label: '✅ โน้ตช่วยจำ' },
            { id: 'request', label: '📧 ขอเปิดตั๋ว' },
            { id: 'inventory', label: '📦 คลังสินค้า' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: 6,
                border: 'none',
                fontSize: '10.5px',
                fontWeight: 700,
                fontFamily: 'Prompt, sans-serif',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#1e40af' : '#475569',
                boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.1s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ minHeight: 350 }}>
          {activeTab === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assignedTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', background: '#fff', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                  ไม่มีตั๋วงานที่ได้รับมอบหมายในขณะนี้
                </div>
              ) : (
                assignedTickets.map(tk => {
                  let priorityColor = '#64748b';
                  if (tk.priority === 'Critical') priorityColor = '#ef4444';
                  else if (tk.priority === 'High') priorityColor = '#f97316';
                  else if (tk.priority === 'Medium') priorityColor = '#3b82f6';
                  
                  let statusBg = '#f1f5f9';
                  let statusText = '#475569';
                  if (tk.accepted === false) { statusBg = '#fee2e2'; statusText = '#ef4444'; }
                  else if (tk.status === 'New') { statusBg = '#eff6ff'; statusText = '#2563eb'; }
                  else if (tk.status === 'In Progress') { statusBg = '#fffbeb'; statusText = '#d97706'; }
                  else if (tk.status === 'Resolved' || tk.status === 'Done') { statusBg = '#f0fdf4'; statusText = '#16a34a'; }
                  else if (tk.status === 'Closed') { statusBg = '#f8fafc'; statusText = '#64748b'; }

                  return (
                    <div key={tk.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: '11.5px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: '#1e40af' }}>{tk.id}</span>
                          <span style={{ background: priorityColor + '12', color: priorityColor, padding: '1px 4px', borderRadius: 3, fontSize: '8.5px', fontWeight: 700 }}>{tk.priority}</span>
                        </div>
                        <span style={{ background: statusBg, color: statusText, padding: '1.5px 5px', borderRadius: 3, fontSize: '9px', fontWeight: 700 }}>
                          {tk.accepted === false ? 'รอตอบรับ' : tk.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#0f172a', marginBottom: 2 }}>{tk.title}</div>
                      <div style={{ fontSize: '10px', color: '#475569', marginBottom: 1 }}><strong>ลูกค้า:</strong> {tk.customer}</div>
                      <div style={{ fontSize: '9.5px', color: '#64748b', marginBottom: 6 }}><strong>ดิวส่งมอบ:</strong> {tk.due}</div>
                      
                      {tk.checkedOutItems && tk.checkedOutItems.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
                          {tk.checkedOutItems.map(item => (
                            <span key={item.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 3, padding: '1px 3px', fontSize: '8.5px', color: '#475569' }}>
                              📦 {item.model} x{item.qtyOut}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        {tk.accepted === false ? (
                          <>
                            <button onClick={() => handleRejectTicketFromStaff(tk.id)} style={{ border: '1px solid #fca5a5', background: 'none', color: '#dc2626', borderRadius: 4, padding: '3px 8px', fontSize: '9.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                              ปฏิเสธ
                            </button>
                            <button onClick={() => handleAcceptTicketFromStaff(tk.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: '9.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                              ✓ Accept รับงาน
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setSelectedTicketId(tk.id)} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                            เริ่มบันทึก Onsite Report 🛠️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {[
                { id: 'open', title: 'งานใหม่', color: '#6366f1', filter: t => t.accepted === false || t.status === 'Open' },
                { id: 'inprogress', title: 'กำลังทำ', color: '#f59e0b', filter: t => t.status === 'In Progress' && t.accepted !== false },
                { id: 'review', title: 'รอตรวจ', color: '#3b82f6', filter: t => t.status === 'Pending' || t.status === 'Waiting Close Approval' },
                { id: 'closed', title: 'เสร็จสิ้น', color: '#10b981', filter: t => t.status === 'Closed' || t.status === 'Done' || t.status === 'Resolved' }
              ].map(col => {
                const colTickets = assignedTickets.filter(col.filter);
                return (
                  <div key={col.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 4, display: 'flex', flexDirection: 'column', minHeight: 350 }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: col.color, borderBottom: `1.5px solid ${col.color}`, paddingBottom: 2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{col.title}</span>
                      <span style={{ background: col.color + '12', padding: '0 3px', borderRadius: 3 }}>{colTickets.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1 }}>
                      {colTickets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '15px 0', color: '#94a3b8', fontSize: '8.5px', fontStyle: 'italic' }}>ไม่มีงาน</div>
                      ) : (
                        colTickets.map(tk => (
                          <div key={tk.id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                            <div style={{ fontWeight: 800, fontSize: '8.5px', color: '#1e40af', marginBottom: 1 }}>{tk.id}</div>
                            <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tk.title}</div>
                            <div style={{ fontSize: '8px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tk.customer}</div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, borderTop: '1px solid #f1f5f9', paddingTop: 3 }}>
                              <button onClick={() => setSelectedTicketId(tk.id)} style={{ border: 'none', background: '#eff6ff', color: '#1e40af', padding: '2px 0', borderRadius: 3, fontSize: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                                บันทึก Onsite 🛠️
                              </button>
                              {col.id === 'open' && (
                                <button onClick={() => handleUpdateTicketStatus(tk.id, 'In Progress')} style={{ border: 'none', background: '#ecfdf5', color: '#047857', padding: '1.5px 0', borderRadius: 3, fontSize: '7.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                                  Accept & Start
                                </button>
                              )}
                              {col.id === 'inprogress' && (
                                <button onClick={() => handleUpdateTicketStatus(tk.id, 'Pending')} style={{ border: 'none', background: '#eff6ff', color: '#1d4ed8', padding: '1.5px 0', borderRadius: 3, fontSize: '7.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                                  ส่งตรวจสอบ
                                </button>
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
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a' }}>📅 ปฏิทินงานรายเดือน</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={handlePrevMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', fontSize: '8px' }}>◀</button>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', minWidth: 70, textAlign: 'center' }}>
                    {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][currentMonth]} {currentYear}
                  </span>
                  <button onClick={handleNextMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: 4, padding: '1px 5px', cursor: 'pointer', fontSize: '8px' }}>▶</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#cbd5e1', border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, idx) => (
                  <div key={day} style={{ background: '#f1f5f9', padding: '3px 0', textAlign: 'center', fontSize: '9px', fontWeight: 700, color: idx === 0 ? '#ef4444' : (idx === 6 ? '#2563eb' : '#475569') }}>
                    {day}
                  </div>
                ))}
                
                {(() => {
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                  const cells = [];
                  
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} style={{ background: '#f8fafc', minHeight: 40 }} />);
                  }
                  
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dayTickets = assignedTickets.filter(t => t.due === dateStr);
                    const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === d;
                    
                    cells.push(
                      <div key={`day-${d}`} style={{ background: '#fff', padding: 2, minHeight: 42, display: 'flex', flexDirection: 'column', border: isToday ? '1.5px solid #2563eb' : 'none' }}>
                        <span style={{ alignSelf: 'flex-end', fontSize: '8.5px', fontWeight: 700, color: isToday ? '#2563eb' : '#64748b' }}>{d}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, overflowY: 'auto', maxHeight: 26 }}>
                          {dayTickets.map(tk => (
                            <div key={tk.id} onClick={() => setSelectedTicketId(tk.id)} style={{ fontSize: '7px', background: tk.priority === 'High' ? '#fee2e2' : '#eff6ff', color: tk.priority === 'High' ? '#ef4444' : '#2563eb', padding: '0.5px 1px', borderRadius: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700, cursor: 'pointer' }}>
                              {tk.id}
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
          )}

          {activeTab === 'checklist' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 4, marginBottom: 8 }}>
                ✅ โน้ตบันทึกช่วยจำส่วนตัว (Personal Notes)
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="text" value={newTodoText} onChange={e => setNewTodoText(e.target.value)} placeholder="พิมพ์บันทึกช่วยจำ..." onKeyDown={e => { if (e.key === 'Enter') handleAddTodo(); }}
                    style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                  <button onClick={handleAddTodo} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif', whiteSpace: 'nowrap' }}>
                    + เพิ่ม
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '9.5px', color: '#64748b', whiteSpace: 'nowrap' }}>🔔 แจ้งเตือน:</span>
                  <input type="datetime-local" value={newTodoRemindDateTime} onChange={e => setNewTodoRemindDateTime(e.target.value)}
                    style={{ flex: 1, fontSize: '10px', padding: '4px 7px', borderRadius: 6, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif', colorScheme: 'light' }} />
                  {newTodoRemindDateTime && (
                    <button onClick={() => setNewTodoRemindDateTime('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', padding: 0 }}>✕</button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                {(personalChecklists[loggedInStaff.name] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94a3b8', fontSize: '10.5px', fontStyle: 'italic', border: '1px dashed #e2e8f0', borderRadius: 6 }}>
                    ไม่มีรายการบันทึกช่วยจำ
                  </div>
                ) : (
                  (personalChecklists[loggedInStaff.name] || []).map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <input type="checkbox" checked={todo.done} onChange={() => handleToggleTodo(todo.id)} style={{ width: 'auto', accentColor: '#1e40af', cursor: 'pointer' }} />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', textDecoration: todo.done ? 'line-through' : '', color: todo.done ? '#94a3b8' : '#334155' }}>
                          {todo.text}
                        </span>
                        {todo.remindDateTime && (
                          <span style={{
                            fontSize: '8.5px',
                            marginLeft: 6,
                            padding: '2px 5px',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontFamily: 'Prompt, sans-serif',
                            ...(() => {
                              const now = new Date();
                              const remindDt = new Date(todo.remindDateTime);
                              const diffMs = remindDt - now;
                              if (diffMs < 0) {
                                return { color: '#94a3b8', background: '#f1f5f9', border: '1px solid #e2e8f0' }; // overdue
                              } else if (diffMs < 60 * 60 * 1000) {
                                return { color: '#ef4444', background: '#fee2e2', border: '1px solid #fca5a5' }; // within 1 hour = urgent
                              } else if (diffMs < 24 * 60 * 60 * 1000) {
                                return { color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a' }; // today
                              } else {
                                return { color: '#ea580c', background: '#fff7ed', border: '1px solid #ffedd5' }; // future
                              }
                            })()
                          }}>
                            {(() => {
                              const now = new Date();
                              const remindDt = new Date(todo.remindDateTime);
                              const diffMs = remindDt - now;
                              const thDate = remindDt.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
                              const thTime = remindDt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                              if (diffMs < 0) return `🔔 เลยกำหนด ${thDate} ${thTime}`;
                              if (diffMs < 60 * 60 * 1000) return `🚨 ด่วน! ${thTime} น.`;
                              return `🔔 ${thDate} ${thTime} น.`;
                            })()}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeleteTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '10px', padding: 2 }}>✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'request' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
              {/* Form */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>📧 ขอเปิด Ticket ใหม่</div>
                <form onSubmit={handleRequestTicket} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <label style={{ fontSize: '9px', color: '#64748b' }}>ชื่องาน / หัวข้อ</label>
                    <input type="text" required value={reqTitle} onChange={e => setReqTitle(e.target.value)} placeholder="เช่น Onsite PM เพิ่มเติม..." style={{ width: '100%', fontSize: '10px', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif' }} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div>
                      <label style={{ fontSize: '9px', color: '#64748b' }}>โครงการ</label>
                      <select value={reqProject} onChange={e => {
                        const nextProj = e.target.value;
                        setReqProject(nextProj);
                        const selectedProjObj = projectsList.find(p => p.id === nextProj);
                        let sites = ['หน้างานสำนักงานลูกค้าหลัก'];
                        if (selectedProjObj) {
                          const matchedCustomer = customersList.find(c => {
                            const cName = (c.name || '').toLowerCase();
                            const pCust = (selectedProjObj.customer || '').toLowerCase();
                            return cName.includes(pCust) || pCust.includes(cName);
                          });
                          if (matchedCustomer && matchedCustomer.locations && matchedCustomer.locations.length > 0) {
                            sites = matchedCustomer.locations.map(loc => `${loc.label} (${loc.address})`);
                          } else {
                            sites = [selectedProjObj.location || 'หน้างานสำนักงานลูกค้าหลัก'];
                          }
                        }
                        setReqSite(sites[0]);
                        setReqParentTicketId('');
                      }} style={{ width: '100%', fontSize: '10px', padding: '4px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }}>
                        {projectsList.map(p => (
                          <option key={p.id} value={p.id}>{p.name.slice(0, 15)}...</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '9px', color: '#64748b' }}>สถานที่ (Site)</label>
                      <select value={reqSite} onChange={e => setReqSite(e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '4px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }}>
                        {dynamicSites.map(s => (
                          <option key={s} value={s}>{s.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div>
                      <label style={{ fontSize: '9px', color: '#64748b' }}>ประเภทตั๋ว</label>
                      <select value={reqType} onChange={e => setReqType(e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '4px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }}>
                        <option value="Install">Install (ติดตั้ง)</option>
                        <option value="MA">MA (บำรุงรักษา)</option>
                        <option value="PM">PM (ตรวจสอบ)</option>
                        <option value="Support">Support</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', color: '#64748b' }}>กำหนดเสร็จ</label>
                      <input type="date" required value={reqDue} onChange={e => setReqDue(e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '3px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '9px', color: '#64748b' }}>วิธีการ Support</label>
                    <select value={reqSupportMethod} onChange={e => setReqSupportMethod(e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '4px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }}>
                      <option value="Onsite">Onsite</option>
                      <option value="Remote">Remote</option>
                      <option value="Telephone">Telephone</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <input type="checkbox" id="reqRequireCloseApproval" checked={reqRequireCloseApproval} onChange={e => setReqRequireCloseApproval(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
                    <label htmlFor="reqRequireCloseApproval" style={{ fontSize: '9px', cursor: 'pointer', margin: 0 }}>ขออนุมัติปิดตั๋วโดย SM ก่อนปิดงาน</label>
                  </div>

                  <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 0', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif', marginTop: 2 }}>
                    ✓ ส่งคำขอเปิด Ticket
                  </button>
                </form>
              </div>

              {/* Status List */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', marginBottom: 6, borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>📋 สถานะคำขอ</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220 }}>
                  {pendingList.filter(r => r.requestedBy === loggedInStaff.name).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94a3b8', fontSize: '9.5px', fontStyle: 'italic' }}>
                      ไม่มีคำขอเปิดตั๋ว
                    </div>
                  ) : (
                    pendingList.filter(r => r.requestedBy === loggedInStaff.name).map(req => (
                      <div key={req.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 4, padding: 4, fontSize: '9px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>{req.title.slice(0, 12)}...</span>
                          <span style={{ color: '#2563eb' }}>{req.status.split(' ')[0]}</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '8px', marginTop: 1 }}>
                          ประเภท: {req.ticketType} | วิธี: {req.supportMethod}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6 }}>
              {/* Warehouse stock */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 800, fontSize: '10.5px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 4, marginBottom: 6 }}>
                  📦 อุปกรณ์ในคลัง NIS Warehouse
                </div>
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: 230 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '4px 2px' }}>สินค้า</th>
                        <th style={{ padding: '4px 2px' }}>รุ่น</th>
                        <th style={{ padding: '4px 2px', textAlign: 'center' }}>คงคลัง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockList.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '4px 2px', fontWeight: 700 }}>{s.name}</td>
                          <td style={{ padding: '4px 2px', fontFamily: 'monospace' }}>{s.model}</td>
                          <td style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 700 }}>{s.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spares Returns and Intake */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Returns */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: '10.5px', color: '#0f172a', marginBottom: 6, borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>
                    ↩️ ค้างคืนคลัง
                  </div>
                  
                  <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {staffWithdrawnItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '9.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                        ไม่มีของค้างส่งคืน
                      </div>
                    ) : (
                      staffWithdrawnItems.map(item => {
                        const key = `${item.id}-${item.ticketId}`;
                        const inputQty = returnQuantities[key] || '';
                        return (
                          <div key={key} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 4, padding: 4, fontSize: '9px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                              <span style={{ color: '#2563eb' }}>{item.ticketId}</span>
                              <span>เบิก: {item.qtyOut}</span>
                            </div>
                            <div style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.model}</div>
                            
                            <div style={{ display: 'flex', gap: 2, marginTop: 2, alignItems: 'center' }}>
                              <input
                                type="number"
                                placeholder="คืน..."
                                min="1"
                                max={item.qtyOut}
                                value={inputQty}
                                onChange={e => setReturnQuantities(prev => ({
                                  ...prev,
                                  [key]: Math.max(1, Math.min(item.qtyOut, parseInt(e.target.value) || ''))
                                }))}
                                style={{ width: 40, padding: '2px', fontSize: '8.5px', border: '1px solid #cbd5e1', borderRadius: 3 }}
                              />
                              <button
                                onClick={() => handleReturnStock(item, inputQty)}
                                disabled={!inputQty}
                                style={{ flex: 1, padding: '3px', fontSize: '8.5px', background: '#475569', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}
                              >
                                คืนคลัง
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Intake */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                  <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input placeholder="ชื่ออุปกรณ์" value={addForm.name} onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))} required
                      style={{ fontSize: '9px', padding: '3px 5px', borderRadius: 3, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <input placeholder="แบรนด์" value={addForm.brand} onChange={e => setAddForm(prev => ({ ...prev, brand: e.target.value }))} required
                        style={{ fontSize: '9px', padding: '3px 5px', borderRadius: 3, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                      <input placeholder="รุ่น" value={addForm.model} onChange={e => setAddForm(prev => ({ ...prev, model: e.target.value }))} required
                        style={{ fontSize: '9px', padding: '3px 5px', borderRadius: 3, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 2 }}>
                      <input placeholder="S/N" value={addForm.sn} onChange={e => setAddForm(prev => ({ ...prev, sn: e.target.value }))}
                        style={{ fontSize: '9px', padding: '3px 5px', borderRadius: 3, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                      <input type="number" min="1" placeholder="จำนวน" value={addForm.qty} onChange={e => setAddForm(prev => ({ ...prev, qty: Math.max(1, parseInt(e.target.value) || 1) }))} required
                        style={{ fontSize: '9px', padding: '3px 5px', borderRadius: 3, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }} />
                    </div>
                    <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 0', fontSize: '8.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                      📥 นำเข้าสต็อก
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Derived: All active tickets ── */
  const allTickets = projectsList.flatMap(p =>
    (p.tickets || []).map(t => ({ ...t, projectId: p.id, projectName: p.name, customer: p.customer, location: t.location || p.location || '', contact: p.contact || {}, salesPM: p.salesPM || {}, engineer: p.engineer || {}, projectType: p.type, tags: p.tags || [] }))
  );
  
  const assignedTickets = useMemo(() => {
    if (!loggedInStaff) return [];
    return allTickets.filter(t => t.assignee === loggedInStaff.name);
  }, [allTickets, loggedInStaff]);

  const activeTickets = useMemo(() => {
    return assignedTickets.filter(t => t.status !== 'Closed' && t.status !== 'Done' && t.status !== 'Resolved');
  }, [assignedTickets]);

  const pendingAcceptTickets = useMemo(() => {
    return assignedTickets.filter(t => t.accepted === false);
  }, [assignedTickets]);

  const activeTicketsCount = useMemo(() => {
    return assignedTickets.filter(t => t.accepted !== false && t.status !== 'Closed' && t.status !== 'Done').length;
  }, [assignedTickets]);

  const inProgressTicketsCount = useMemo(() => {
    return assignedTickets.filter(t => t.status === 'In Progress' && t.accepted !== false).length;
  }, [assignedTickets]);

  const overdueTickets = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return assignedTickets.filter(t => t.status !== 'Closed' && t.status !== 'Done' && t.status !== 'Resolved' && t.due && t.due < todayStr);
  }, [assignedTickets]);

  const closedTicketsCount = useMemo(() => {
    return assignedTickets.filter(t => t.status === 'Resolved' || t.status === 'Done' || t.status === 'Closed').length;
  }, [assignedTickets]);

  const staffWithdrawnItems = useMemo(() => {
    const items = [];
    assignedTickets.forEach(t => {
      (t.checkedOutItems || []).forEach(item => {
        items.push({
          ...item,
          ticketId: t.id,
          ticketTitle: t.title
        });
      });
    });
    return items;
  }, [assignedTickets]);

  const matchedTicket = allTickets.find(t => t.id === selectedTicketId) || null;

  const resolveTicketType = useCallback(() => {
    if (!matchedTicket) return 'Install';
    
    // 1. Direct field checks
    let t = matchedTicket.ticketType || matchedTicket.type;
    if (t === 'MA Onsite') t = 'MA';
    if (t) return t;

    // 2. Name-based fallbacks (Title / ID matching)
    const title = matchedTicket.title || '';
    const id = matchedTicket.id || '';
    if (title.toUpperCase().includes('PM') || title.includes('Preventive') || id.toUpperCase().includes('PM')) {
      return 'PM';
    }
    if (title.toUpperCase().includes('MA') || title.includes('บำรุงรักษา') || id.toUpperCase().includes('MA')) {
      return 'MA';
    }

    // 3. Project type fallback
    if (matchedTicket.projectType?.includes('MA')) return 'MA';
    
    return 'Install';
  }, [matchedTicket]);

  const ticketType = resolveTicketType();

  /* ── State: Form fields ── */
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [workDetail, setWorkDetail] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [photos, setPhotos] = useState([]);
  const [rackPhotos, setRackPhotos] = useState([]);
  const [showPmForm, setShowPmForm] = useState(false);
  const [newRackName, setNewRackName] = useState('');
  const [newRackLocation, setNewRackLocation] = useState('');
  const [newRackRemark, setNewRackRemark] = useState('');
  const [newRackBeforePhoto, setNewRackBeforePhoto] = useState(null);
  const [newRackAfterPhoto, setNewRackAfterPhoto] = useState(null);
  const [signatureImg, setSignatureImg] = useState(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [skipSignature, setSkipSignature] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [srNumber, setSrNumber] = useState('');

  /* ── State: Device Replacement ── */
  const [showStockPicker, setShowStockPicker] = useState(false);
  const [checkedOutItems, setCheckedOutItems] = useState([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [withdrawQty, setWithdrawQty] = useState(1);
  const [withdrawPurpose, setWithdrawPurpose] = useState('ติดตั้งใหม่');
  const [defectiveBrand, setDefectiveBrand] = useState('');
  const [defectiveModel, setDefectiveModel] = useState('');
  const [defectiveSn, setDefectiveSn] = useState('');
  const [replacedDevice, setReplacedDevice] = useState({ brand: '', model: '', sn: '' });
  const [stockDeducted, setStockDeducted] = useState(false);

  /* ── State: Extra checkboxes ── */
  const [damagedChecked, setDamagedChecked] = useState(false);
  const [damagedWarranty, setDamagedWarranty] = useState('on');
  const [damagedInfo, setDamagedInfo] = useState({ brand: '', model: '', sn: '' });
  const [damagedPhotos, setDamagedPhotos] = useState([]);
  const [gpsLocationSim, setGpsLocationSim] = useState('within_100m');
  const [othersChecked, setOthersChecked] = useState(false);
  const [othersList, setOthersList] = useState([]);
  const [othersInput, setOthersInput] = useState({ reporter: '', problem: '', solution: '', category: 'Hardware', startTime: '', endTime: '' });

  /* ── State: Email Overlay dialog ── */
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  /* ── State: Activity log ── */
  const [activityLog, setActivityLog] = useState([]);

  // Database synchronizer
  const saveToDb = (updatedFields) => {
    if (!selectedTicketId) return;
    const list = getProjects();
    const newList = list.map(p => {
      const hasTk = (p.tickets || []).find(t => t.id === selectedTicketId);
      if (hasTk) {
        return {
          ...p,
          tickets: p.tickets.map(t => t.id === selectedTicketId ? { ...t, ...updatedFields } : t)
        };
      }
      return p;
    });
    saveProjects(newList);
    setProjectsList(newList);
  };

  /* ── Load/Reset on ticket change ── */
  useEffect(() => {
    if (!selectedTicketId) {
      setGpsLocationSim('within_100m');
      setCheckInTime(''); setCheckOutTime(''); setWorkDetail(''); setIssueDetail('');
      setPhotos([]); setSignatureImg(null); setShowSignPad(false); setSkipSignature(false);
      setEmailSent(false); setClosed(false); setShowPdfPreview(false); setSrNumber('');
      setCheckedOutItems([]); setReplacedDevice({ brand: '', model: '', sn: '' }); setStockDeducted(false);
      setShowStockPicker(false); setSelectedStockId(''); setWithdrawQty(1); setWithdrawPurpose('ติดตั้งใหม่');
      setDefectiveBrand(''); setDefectiveModel(''); setDefectiveSn('');
      setDamagedChecked(false); setDamagedWarranty('on'); setDamagedInfo({ brand: '', model: '', sn: '' }); setDamagedPhotos([]);
      setOthersChecked(false); setOthersList([]); setOthersInput({ reporter: '', problem: '', solution: '', category: 'Hardware', startTime: '', endTime: '' });
      setRackPhotos([]);
      setShowPmForm(false);
      setNewRackName('');
      setNewRackLocation('');
      setNewRackRemark('');
      setNewRackBeforePhoto(null);
      setNewRackAfterPhoto(null);
      setActivityLog([]);
      setChecklist([]);
      return;
    }
    
    const tk = allTickets.find(t => t.id === selectedTicketId);
    if (!tk) return;

    setGpsLocationSim(tk.gpsLocationSim || 'within_100m');
    setCheckInTime(tk.checkInTime || '');
    setCheckOutTime(tk.checkOutTime || '');
    setWorkDetail(tk.workDetail || '');
    setIssueDetail(tk.issueDetail || '');
    setPhotos(tk.photos || []);
    setSignatureImg(tk.signatureImg || null);
    setSkipSignature(tk.skipSignature || false);
    setSrNumber(tk.srNumber || '');
    setEmailSent(tk.emailSent || false);
    setClosed(tk.status === 'Closed' || tk.status === 'Done');
    setCheckedOutItems(tk.checkedOutItems || []);
    setReplacedDevice(tk.replacedDevice || { brand: '', model: '', sn: '' });
    setStockDeducted(tk.stockDeducted || false);
    setDamagedChecked(tk.damagedProduct?.checked || false);
    setDamagedWarranty(tk.damagedProduct?.warranty || 'on');
    setDamagedInfo(tk.damagedProduct?.info || { brand: '', model: '', sn: '' });
    setDamagedPhotos(tk.damagedProduct?.photos || (tk.damagedProduct?.photo ? ['📷'] : []));
    setOthersChecked(tk.others?.checked || false);
    setOthersList(tk.others?.list || []);
    setOthersInput({ reporter: '', problem: '', solution: '', category: 'Hardware', startTime: '', endTime: '' });
    setRackPhotos(tk.rackPhotos || []);
    setShowPmForm(false);
    setNewRackName('');
    setNewRackLocation('');
    setNewRackRemark('');
    setNewRackBeforePhoto(null);
    setNewRackAfterPhoto(null);
    
    // Set Recipient Email default values
    setRecipientEmail(tk.contact?.email || 'orathai@scg.co.th');
    setEmailSubject(`[NIS Onsite Report] สรุปผลบริการ ${tk.id} - ${tk.customer}`);

    const logs = [];
    if (tk.stockDeducted) logs.push({ time: 'เตรียมงาน', text: 'สินค้าเบิกจ่ายคลัง NIS ได้ถูกตัดบัญชีล่วงหน้าเรียบร้อย' });
    if (tk.srNumber) logs.push({ time: 'เอกสาร', text: `รายงานบริการเลขที่ ${tk.srNumber} ได้เปิดใช้งานแล้ว` });
    setActivityLog(logs);

    if (tk.checklist && tk.checklist.length > 0) {
      setChecklist(tk.checklist);
    } else {
      const tt = tk.ticketType || (tk.projectType?.includes('MA') ? 'MA' : 'Install');
      let items = INSTALL_CHECKS;
      if (tt === 'MA') items = MA_CHECKS;
      else if (tt === 'PM') items = PM_CHECKS;
      setChecklist(items.map(label => ({ label, done: false })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId]);

  /* ── Helpers ── */
  const isFormLocked = !matchedTicket?.noOnsite && !checkInTime;
  const doneCount = checklist.filter(c => c.done).length;
  const donePct = checklist.length > 0 ? Math.round(doneCount / checklist.length * 100) : 0;
  const now = () => new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' });

  const getMockImage = (type, name) => {
    const text = encodeURIComponent(`${type}: ${name}`);
    const bgColor = type === 'Before' ? '%23fee2e2' : '%23dcfce7';
    const textColor = type === 'Before' ? '%23991b1b' : '%23166534';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="${bgColor}" rx="6"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="${textColor}">${type}</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="${textColor}">${text}</text></svg>`;
  };

  const handleCheckIn = () => {
    if (!matchedTicket?.noOnsite && gpsLocationSim === 'far_away') {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'ไม่สามารถ Check-in ได้',
          message: '❌ ระยะพิกัด GPS ห่างจากหน้างานมากเกินไป (ห่าง 2.5 กม.) ต้องไม่เกิน 100 เมตรจากตำแหน่งโครงการ',
          type: 'error'
        }
      }));
      return;
    }
    const t = now();
    setCheckInTime(t);
    saveToDb({ checkInTime: t, status: 'In Progress' });
  };
  const handleCheckOut = () => {
    if (!matchedTicket?.noOnsite && gpsLocationSim === 'far_away') {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'ไม่สามารถ Check-out ได้',
          message: '❌ ระยะพิกัด GPS ห่างจากหน้างานมากเกินไป (ห่าง 2.5 กม.) ต้องไม่เกิน 100 เมตรจากตำแหน่งโครงการ',
          type: 'error'
        }
      }));
      return;
    }
    // If ticketType is Install (Implement) or PM, require at least one photo
    const isImplementOrPm = ticketType === 'Install' || ticketType === 'PM';
    if (isImplementOrPm && photos.length === 0) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { 
          title: 'ไม่สามารถ Check-out ได้', 
          message: 'งานประเภท Implement และ PM จำเป็นต้องมีรูปถ่ายการปฏิบัติงานอย่างน้อย 1 รูป', 
          type: 'error' 
        }
      }));
      return;
    }
    const t = now(); 
    setCheckOutTime(t); 
    saveToDb({ checkOutTime: t }); 
  };
  const toggleCheck = (i) => {
    const updated = checklist.map((c, j) => j === i ? { ...c, done: !c.done } : c);
    setChecklist(updated);
    saveToDb({ checklist: updated });
  };

  const handleSign = (sig) => { setSignatureImg(sig); saveToDb({ signatureImg: sig }); setShowSignPad(false); };

  const handleAddOthersItem = () => {
    if (!othersInput.reporter.trim() || !othersInput.problem.trim() || !othersInput.solution.trim()) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: 'กรุณากรอกข้อมูล', message: 'กรุณากรอก ผู้แจ้ง, ปัญหา และวิธีแก้ไข ให้ครบถ้วน', type: 'error' }
      }));
      return;
    }
    const newItem = {
      id: Date.now(),
      reporter: othersInput.reporter,
      category: othersInput.category,
      problem: othersInput.problem,
      solution: othersInput.solution,
      startTime: othersInput.startTime,
      endTime: othersInput.endTime
    };
    const updatedList = [...othersList, newItem];
    setOthersList(updatedList);
    saveToDb({ others: { checked: othersChecked, list: updatedList } });
    
    // Reset input fields
    setOthersInput({ reporter: '', problem: '', solution: '', category: 'Hardware', startTime: '', endTime: '' });
    
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'เพิ่ม Case Support สำเร็จ', message: 'เพิ่มหัวข้อปัญหา ' + newItem.problem + ' เรียบร้อยแล้ว', type: 'success' }
    }));
  };

  const handleRemoveOthersItem = (itemId) => {
    const updatedList = othersList.filter(item => item.id !== itemId);
    setOthersList(updatedList);
    saveToDb({ others: { checked: othersChecked, list: updatedList } });
  };

  const handleAddSingleItem = () => {
    if (!selectedStockId) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: 'กรุณาเลือกสินค้า', message: 'เลือกสินค้าจากรายการก่อนกดเพิ่ม', type: 'warning' } }));
      return;
    }
    const stockItem = nisStock.find(s => s.id === selectedStockId);
    if (!stockItem) return;
    const qty = Math.min(stockItem.qty, Math.max(1, withdrawQty));
    const newItem = {
      ...stockItem,
      qtyOut: qty,
      purpose: withdrawPurpose,
      defective: withdrawPurpose === 'ทดแทนอุปกรณ์ชำรุด' ? { brand: defectiveBrand, model: defectiveModel, sn: defectiveSn } : null
    };
    // If purpose is ทดแทนอุปกรณ์ชำรุด, also sync to global replacedDevice for backward compat
    if (withdrawPurpose === 'ทดแทนอุปกรณ์ชำรุด' && (defectiveBrand || defectiveModel || defectiveSn)) {
      const rd = { brand: defectiveBrand, model: defectiveModel, sn: defectiveSn };
      setReplacedDevice(rd);
      saveToDb({ replacedDevice: rd });
    }
    const updated = [...checkedOutItems, newItem];
    setCheckedOutItems(updated);
    saveToDb({ checkedOutItems: updated });
    // Reset form but keep picker open
    setSelectedStockId('');
    setWithdrawQty(1);
    setWithdrawPurpose('ติดตั้งใหม่');
    setDefectiveBrand(''); setDefectiveModel(''); setDefectiveSn('');
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title: 'เพิ่มรายการสำเร็จ', message: `เพิ่ม ${stockItem.name} x${qty} (${withdrawPurpose}) เรียบร้อย`, type: 'success' } }));
  };

  const handleDeductStock = () => {
    setStockDeducted(true);
    saveToDb({ stockDeducted: true });
    const log = [...activityLog, { time: now(), text: `ตัดบัญชีคลัง NIS: ${checkedOutItems.map(i => i.name).join(', ')}` }];
    setActivityLog(log);
  };

  const handlePreviewPdf = () => {
    if (!srNumber) {
      const generatedSr = getNextServiceReportNumber();
      setSrNumber(generatedSr);
      saveToDb({ srNumber: generatedSr });
    }
    setShowPdfPreview(true);
  };

  // Open Email dialogue modal
  const handleOpenEmailDialog = () => {
    if (!srNumber) {
      const generatedSr = getNextServiceReportNumber();
      setSrNumber(generatedSr);
      saveToDb({ srNumber: generatedSr });
    }
    setShowEmailModal(true);
  };

  const handleConfirmSendReport = () => {
    setShowEmailModal(false);
    if (!signatureImg) return;
    const reportSR = srNumber || getNextServiceReportNumber();
    if (!srNumber) setSrNumber(reportSR);

    // Save Service Report in Mock DB
    addServiceReport({
      id: reportSR,
      ticketId: selectedTicketId,
      projectId: matchedTicket.projectId,
      customer: matchedTicket.customer,
      engineer: matchedTicket.engineer?.name || '-',
      date: new Date().toISOString().slice(0, 10),
      type: ticketType,
      summary: workDetail,
      status: 'Closed',
      emailSentTo: recipientEmail,
      signatureImg: signatureImg
    });

    // Create automatic claims
    if (damagedChecked) {
      const claimId = getNextClaimNumber();
      addClaim({
        id: claimId,
        ticketId: selectedTicketId,
        customer: matchedTicket.customer,
        salesName: matchedTicket.salesPM?.name || 'คุณวีระ ศรีสุข',
        reporterStaff: matchedTicket.engineer?.name || 'นายกฤษฎ์ พิชิตกุล',
        brand: damagedInfo.brand,
        model: damagedInfo.model,
        sn: damagedInfo.sn,
        warrantyStatus: damagedWarranty,
        date: new Date().toISOString().slice(0, 10),
        status: 'Claim Received',
        detail: `แจ้งอุปกรณ์เสียจากการปฏิบัติงาน onsite เลขที่ตั๋ว ${selectedTicketId}`
      });

      addClaimNotification({
        id: Date.now(),
        salesName: matchedTicket.salesPM?.name || 'คุณวีระ ศรีสุข',
        customer: matchedTicket.customer,
        text: `ตั๋วเคลมสินค้า ${claimId} สร้างอัตโนมัติจากการปิดตั๋ว ${selectedTicketId} (${damagedWarranty === 'on' ? 'อยู่ในประกัน' : 'หมดประกัน'})`,
        time: new Date().toLocaleString('th-TH'),
        isRead: false
      });
    }

    // Save ticket state to closed
    saveToDb({
      status: 'Closed',
      pct: 100,
      emailSent: true,
      srNumber: reportSR,
      checkInTime,
      checkOutTime,
      workDetail,
      issueDetail,
      checklist,
      checkedOutItems,
      replacedDevice,
      stockDeducted,
      damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false },
      others: { checked: othersChecked, list: othersList },
      signatureImg
    });

    setEmailSent(true);

    const log = [...activityLog, { time: now(), text: `Service Report ${reportSR} ถูกบันทึกและจัดส่งไปหา ${recipientEmail} แล้ว` }];

    if (damagedChecked) {
      if (damagedWarranty === 'on') {
        log.push({ time: now(), text: `สร้าง Ticket ใหม่อัตโนมัติ — เปลี่ยนสินค้า Warranty (${damagedInfo.brand} ${damagedInfo.model})` });
      } else {
        log.push({ time: now(), text: `สร้าง Sales Ticket อัตโนมัติ — สินค้า Off Warranty (${damagedInfo.brand} ${damagedInfo.model})` });
      }
    }
    if (othersChecked) {
      log.push({ time: now(), text: `สร้าง Helpdesk Case อัตโนมัติ — ปัญหาเพิ่มเติม: ${othersList.map(item => item.problem).join(', ') || '(ไม่มี)'}` });
    }

    setActivityLog(log);
    setTimeout(() => { setClosed(true); }, 1500);
  };

  const handleSubmitCloseApproval = () => {
    const reportSR = srNumber || getNextServiceReportNumber();
    if (!srNumber) setSrNumber(reportSR);
    const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    const log = [
      ...activityLog,
      { time: nowStr, text: `ส่งคำขออนุมัติปิดตั๋วไปยัง Service Manager (รายงานบริการ: ${reportSR})` }
    ];
    setActivityLog(log);

    saveToDb({
      status: 'Waiting Close Approval',
      rejectionReason: '',
      pct: 100,
      srNumber: reportSR,
      checkInTime,
      checkOutTime,
      workDetail,
      issueDetail,
      checklist,
      checkedOutItems,
      replacedDevice,
      stockDeducted,
      damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false },
      others: { checked: othersChecked, list: othersList },
      signatureImg
    });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { title: 'ส่งคำขออนุมัติสำเร็จ', message: `ส่งคำขออนุมัติปิดตั๋ว ${selectedTicketId} เรียบร้อยแล้ว`, type: 'success' }
    }));
  };

  /* ── Ticket type badge color ── */
  const typeBadge = (type) => {
    const colors = { Install: '#2563eb', MA: '#7c3aed', PM: '#0891b2' };
    return { background: colors[type] || '#475569', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: 'Kanit, sans-serif' };
  };

  /* ── MA round info ── */
  const getMaRoundInfo = () => {
    if (!matchedTicket || ticketType !== 'MA') return '';
    const project = projectsList.find(p => p.id === matchedTicket.projectId);
    if (!project) return '';
    const maTickets = (project.tickets || []).filter(t => (t.ticketType || '').includes('MA') || (project.type || '').includes('MA'));
    const idx = maTickets.findIndex(t => t.id === matchedTicket.id);
    return `Onsite MA รอบที่ ${idx + 1}/${maTickets.length > 0 ? maTickets.length : 12}`;
  };

  // Card, SectionTitle, and FieldRow moved outside component to avoid unmounting on keypress

  /* ═══════════════════════════════════════════════════════ */
  /*                       RENDER                           */
  /* ═══════════════════════════════════════════════════════ */
  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&family=Prompt:wght@300;400;500;600;700&display=swap');
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 330px;
          gap: 20px;
          align-items: start;
        }
        .sidebar-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: sticky;
          top: 16px;
        }
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
          .sidebar-container {
            position: static !important;
            width: 100% !important;
          }
        }
        .ipad-outer{width:700px;min-height:960px;background:linear-gradient(145deg,#1a1a2e 0%,#0f0f1a 40%,#16213e 100%);border-radius:44px;padding:18px;box-sizing:border-box;position:relative;box-shadow:0 40px 80px -20px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.1),inset 0 -1px 0 rgba(0,0,0,0.3)}
        .ipad-outer::before{content:'';position:absolute;inset:2px;border-radius:43px;background:linear-gradient(180deg,rgba(255,255,255,0.04) 0%,transparent 30%);pointer-events:none;z-index:1}
        .ipad-screen{width:100%;height:100%;background:#f8fafc;border-radius:26px;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:inset 0 0 30px rgba(0,0,0,0.03)}
        .ipad-screen::after{content:'';position:absolute;top:0;left:15%;width:70%;height:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%);pointer-events:none;border-radius:0 0 50% 50%;z-index:2}
        .ipad-cam{width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#2a2a3e 40%,#1a1a2e 100%);position:absolute;top:7px;left:50%;transform:translateX(-50%);z-index:3;box-shadow:0 0 0 1.5px rgba(255,255,255,0.08),inset 0 0 2px rgba(0,0,0,0.5)}
        .ipad-statusbar{background:linear-gradient(180deg,#f1f5f9 0%,#f8fafc 100%);padding:5px 16px;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;user-select:none;font-family:'Prompt',sans-serif;position:relative;z-index:3}
        .ipad-content{flex:1;padding:16px;overflow-y:auto;text-align:left;font-family:'Prompt',sans-serif;position:relative;z-index:3}
        .ipad-content::-webkit-scrollbar{width:4px}
        .ipad-content::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
        .ipad-home-indicator{width:120px;height:4px;background:#94a3b8;border-radius:2px;margin:6px auto 8px;opacity:0.5;position:relative;z-index:3}
        .green-section{border-left:4px solid #16a34a;padding-left:12px;margin-bottom:12px}
        .orange-section{border-left:4px solid #ea580c;padding-left:12px;margin-bottom:12px}
        .sidebar-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}

        /* zIndex Overlay click blocking fix */
        .ipad-content input, 
        .ipad-content textarea, 
        .ipad-content select, 
        .ipad-content button {
          position: relative;
          z-index: 10;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">iPad Air Onsite Simulator — ส่วนทดสอบช่างหน้างาน</div>
          <div className="page-subtitle">จำลองมุมมองปฏิบัติงานของเจ้าหน้าที่เทคนิค (Staff) หน้างานบน iPad Air พร้อมฟอร์ม Onsite Report, E-Signature, Device Replacement และ Auto Close</div>
        </div>
      </div>

      <div className="main-grid">

        {/* ═══ LEFT: iPad Frame ═══ */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div className="ipad-outer">
            <div className="ipad-cam" />
            <div className="ipad-screen">

              {/* Status Bar */}
              <div className="ipad-statusbar">
                <div>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 8h1.5v2H1zM4 6h1.5v4H4zM7 4h1.5v6H7zM10 1h1.5v9H10z" fill="#475569"/></svg>
                  </span>
                  <span>WiFi</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>97%</span>
                    <svg width="20" height="10" viewBox="0 0 20 10"><rect x="0" y="1" width="17" height="8" rx="1.5" stroke="#475569" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="13.5" height="5" rx="0.5" fill="#34d399"/><rect x="18" y="3" width="2" height="4" rx="0.5" fill="#475569"/></svg>
                  </span>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="ipad-content">
                {!loggedInStaff ? renderLoginScreen() : (!selectedTicketId ? renderStaffDashboard() : (
                  <>
                    {/* Back Header */}
                    <div style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, margin: '-16px -16px 14px -16px', position: 'sticky', top: -16, zIndex: 100 }}>
                      <button onClick={() => setSelectedTicketId('')} style={{ background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: '10.5px', fontWeight: 700, fontFamily: 'Prompt, sans-serif' }}>
                        ◀ กลับหน้าหลัก Staff Portal
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          งาน: {matchedTicket.id} — {matchedTicket.title}
                        </div>
                      </div>
                    </div>

                    {/* ── Ticket Selection Dropdown inside form for quick switching ── */}
                    <Card>
                      <SectionTitle icon="🎫">สลับ Ticket งานอื่น</SectionTitle>
                      <select value={selectedTicketId} onChange={e => setSelectedTicketId(e.target.value)}
                        style={{ width: '100%', fontSize: 11.5, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontFamily: 'Prompt, sans-serif', background: '#fff', color: '#0f172a' }}>
                        <option value="">-- แตะเพื่อเลือก Ticket --</option>
                        {activeTickets.map(t => (
                          <option key={t.id} value={t.id}>{t.id} — {t.title} ({t.customer})</option>
                        ))}
                      </select>
                      {matchedTicket && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={typeBadge(ticketType)}>{ticketType}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{matchedTicket.id}</span>
                        </div>
                      )}
                    </Card>
                    {/* Banners for Close Approval status and rejection */}
                    {matchedTicket.status === 'Waiting Close Approval' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        border: '1.5px solid #3b82f6',
                        borderRadius: 10,
                        padding: '12px 16px',
                        marginBottom: 14,
                        color: '#1e40af',
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        fontFamily: 'Prompt, sans-serif'
                      }}>
                        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          🔒 อยู่ระหว่างรออนุมัติปิดตั๋ว
                        </div>
                        ตั๋วใบนี้ถูกส่งคำขออนุมัติปิดตั๋วแล้วและกำลังอยู่ระหว่างการตรวจสอบโดย Service Manager
                      </div>
                    )}

                    {matchedTicket.rejectionReason && matchedTicket.status !== 'Waiting Close Approval' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                        border: '1.5px solid #ef4444',
                        borderRadius: 10,
                        padding: '12px 16px',
                        marginBottom: 14,
                        color: '#991b1b',
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        fontFamily: 'Prompt, sans-serif'
                      }}>
                        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
                          ❌ คำขอปิดตั๋วถูกส่งกลับแก้ไข
                        </div>
                        <strong>เหตุผล:</strong> {matchedTicket.rejectionReason}
                        <div style={{ marginTop: 6, fontSize: 10.5, color: '#b91c1c' }}>
                          💡 โปรดปรับปรุงแก้ไขรายละเอียดการทำงานหรือข้อมูลตามความเห็นด้านบน แล้วส่งตรวจสอบใหม่อีกครั้ง
                        </div>
                      </div>
                    )}

                    {/* ═══════════════════════════════════════ */}
                    {/* ส่วนที่ 1: ข้อมูล Ticket และผู้เกี่ยวข้อง */}
                    {/* ═══════════════════════════════════════ */}
                    <Card style={{ borderTop: '3px solid #1e40af' }}>
                      <SectionTitle icon="📋">ส่วนที่ 1: ข้อมูล Ticket และผู้เกี่ยวข้อง</SectionTitle>

                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 4, marginTop: 4 }}>📌 ข้อมูลลูกค้า</div>
                      <FieldRow label="บริษัท" value={matchedTicket.customer} />
                      <FieldRow label="ที่อยู่" value={matchedTicket.location} />
                      <FieldRow label="ผู้ติดต่อ" value={matchedTicket.contact?.name} />
                      <FieldRow label="โทร" value={matchedTicket.contact?.phone} />
                      <FieldRow label="Email" value={matchedTicket.contact?.email} />

                      <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>👔 Sales/PM</div>
                      <FieldRow label="ชื่อ" value={`${matchedTicket.salesPM?.name || '-'} (${matchedTicket.salesPM?.nickname || '-'})`} />
                      <FieldRow label="โทร" value={matchedTicket.salesPM?.phone} />
                      <FieldRow label="ตำแหน่ง" value={matchedTicket.salesPM?.role} />

                      <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0891b2', marginBottom: 4 }}>🔧 เจ้าหน้าที่เทคนิค</div>
                      <FieldRow label="ชื่อ" value={`${matchedTicket.engineer?.name || '-'} (${matchedTicket.engineer?.nickname || '-'})`} />
                      <FieldRow label="โทร" value={matchedTicket.engineer?.phone} />

                      <div style={{ borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />

                      {/* Check-in / Check-out */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          {!checkInTime ? (
                            <button onClick={handleCheckIn} style={{ ...btnStyle, width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '10px 0', fontSize: 12 }}>
                              📍 Check-in
                            </button>
                          ) : (
                            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 8, fontSize: 10.5, color: '#166534', textAlign: 'center' }}>
                              ✅ Check-in แล้ว<br /><strong>{checkInTime}</strong>
                            </div>
                          )}
                        </div>
                        <div>
                          {!checkOutTime ? (
                            <button onClick={handleCheckOut} disabled={!checkInTime}
                              style={{ ...btnStyle, width: '100%', background: checkInTime ? '#dc2626' : '#d4d4d8', color: '#fff', border: 'none', padding: '10px 0', fontSize: 12, opacity: checkInTime ? 1 : 0.4 }}>
                              🏁 Check-out
                            </button>
                          ) : (
                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 8, fontSize: 10.5, color: '#991b1b', textAlign: 'center' }}>
                              🏁 Check-out แล้ว<br /><strong>{checkOutTime}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {checkInTime && (
                        <div style={{ marginTop: 8, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: 9.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>📍 <strong>สถานที่บันทึก:</strong> {matchedTicket.location}</div>
                          <div>🌐 <strong>พิกัดเช็คอิน:</strong> 13.8055, 100.5376 (ในระยะหน้างาน 15 ม.)</div>
                        </div>
                      )}

                      {isFormLocked && (
                        <div style={{ marginTop: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 8, fontSize: 10.5, color: '#92400e', textAlign: 'center' }}>
                          🔒 กรุณากด Check-in ก่อนเพื่อปลดล็อคฟอร์ม
                        </div>
                      )}

                      {matchedTicket?.noOnsite && (
                        <div style={{ marginTop: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 8, fontSize: 10.5, color: '#065f46', textAlign: 'center', fontWeight: 700 }}>
                          💡 งานภายใน/Lab - ไม่ต้อง Onsite เช็คอิน
                        </div>
                      )}
                    </Card>

                    {/* ═══════════════════════════════════════ */}
                    {/* ส่วนที่ 2: รายละเอียดการให้บริการ       */}
                    {/* ═══════════════════════════════════════ */}
                    {!isFormLocked && (
                      <Card style={{ borderTop: '3px solid #7c3aed' }}>
                        <SectionTitle icon="🔧" right={<span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>{donePct}%</span>}>
                          ส่วนที่ 2: รายละเอียดการให้บริการ
                        </SectionTitle>

                        {/* MA round info */}
                        {ticketType === 'MA' && (
                          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#6d28d9', marginBottom: 10 }}>
                            🔄 {getMaRoundInfo()}
                          </div>
                        )}

                        {/* Checklist progress bar */}
                        <div style={{ background: '#e2e8f0', borderRadius: 4, height: 5, marginBottom: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${donePct}%`, height: '100%', background: donePct === 100 ? '#16a34a' : '#1e40af', borderRadius: 4, transition: 'width .3s' }} />
                        </div>

                        {/* Checklist items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                          {checklist.map((c, i) => (
                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: c.done ? '#f0fdf4' : '#fafafa', border: `1px solid ${c.done ? '#86efac' : '#e2e8f0'}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, transition: 'all .15s' }}>
                              <input type="checkbox" checked={c.done} onChange={() => toggleCheck(i)} style={{ width: 'auto', accentColor: '#16a34a' }} />
                              <span style={{ textDecoration: c.done ? 'line-through' : '', color: c.done ? '#15803d' : '#334155', fontWeight: c.done ? 400 : 500 }}>{c.label}</span>
                            </label>
                          ))}
                        </div>

                        {/* ── Customer-facing section ── */}
                        <div className="green-section">
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>📄 ข้อมูลสำหรับลูกค้า</div>

                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>สรุปรายละเอียดการดำเนินการ</label>
                            <textarea value={workDetail} onChange={e => { setWorkDetail(e.target.value); saveToDb({ workDetail: e.target.value }); }} rows={2} placeholder="กรอกสรุปขั้นตอนการดำเนินงาน..."
                              style={{ width: '100%', fontSize: 11, marginTop: 3, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif', resize: 'vertical' }} />
                          </div>

                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>ปัญหาที่พบ</label>
                            <textarea value={issueDetail} onChange={e => { setIssueDetail(e.target.value); saveToDb({ issueDetail: e.target.value }); }} rows={2} placeholder="ระบุปัญหาที่พบระหว่างปฏิบัติงาน (ถ้ามี)..."
                              style={{ width: '100%', fontSize: 11, marginTop: 3, padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif', resize: 'vertical' }} />
                          </div>

                          {/* Photos */}
                          <div style={{ marginBottom: 6 }}>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>
                              📷 รูปถ่ายประกอบ {ticketType === 'Install' && <span style={{ color: '#dc2626' }}>*จำเป็น</span>}
                            </label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                              {photos.map((_, i) => (
                                <div key={i} onClick={() => { const up = photos.filter((__, j) => j !== i); setPhotos(up); saveToDb({ photos: up }); }}
                                  style={{ width: 50, height: 50, borderRadius: 6, border: '1.5px solid #1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer', background: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>
                                  📷 {i + 1}
                                </div>
                              ))}
                              <button onClick={() => { const up = [...photos, true]; setPhotos(up); saveToDb({ photos: up }); }}
                                style={{ width: 50, height: 50, border: '1.5px dashed #94a3b8', background: 'none', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
                                +<span style={{ fontSize: 8 }}>เพิ่ม</span>
                              </button>
                            </div>
                          </div>

                          {ticketType === 'PM' && (
                            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10, marginTop: 10 }}>
                            <div>
                              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#16a34a', marginBottom: 8, borderBottom: '1px dashed #cbd5e1', paddingBottom: 4 }}>🛠️ บันทึกการบำรุงรักษาเชิงป้องกัน (Preventive Maintenance)</div>

                              {/* List of Added PM Items */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                {rackPhotos.length === 0 ? (
                                  <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', padding: '15px 0', fontStyle: 'italic', background: '#fff', borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                                    ยังไม่มีการเพิ่มรายการ PM (กรุณากดปุ่มเพิ่มเพื่อเริ่มบันทึก)
                                  </div>
                                ) : (
                                  rackPhotos.map((rp, i) => (
                                    <div key={rp.id || i} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e3a5f' }}>🖥️ {rp.name}</div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                                            <div style={{ fontSize: 9.5, color: '#475569' }}>📍 <strong>สถานที่:</strong> {rp.location}</div>
                                            <div style={{ fontSize: 9.5, color: '#475569' }}>📝 <strong>หมายเหตุ:</strong> {rp.remark || 'ไม่มี'}</div>
                                          </div>
                                        </div>
                                        <button 
                                          type="button" 
                                          onClick={() => {
                                            const updated = rackPhotos.filter((_, idx) => idx !== i);
                                            setRackPhotos(updated);
                                            saveToDb({ rackPhotos: updated });
                                          }} 
                                          style={{ border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fee2e2' }}
                                        >
                                          ✕ ลบ
                                        </button>
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                        {/* Display Before Photo */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: 4, borderRadius: 4 }}>
                                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>ภาพถ่ายก่อนทำ</div>
                                          {rp.beforePhoto ? (
                                            <img src={rp.beforePhoto} style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 3 }} alt="Before" />
                                          ) : (
                                            <div style={{ fontSize: 8.5, color: '#94a3b8', fontStyle: 'italic', height: 50, display: 'flex', alignItems: 'center' }}>(ไม่มีรูปถ่าย)</div>
                                          )}
                                        </div>

                                        {/* Display After Photo */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: 4, borderRadius: 4 }}>
                                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>ภาพถ่ายหลังทำ</div>
                                          {rp.afterPhoto ? (
                                            <img src={rp.afterPhoto} style={{ width: '100%', height: 50, objectFit: 'cover', borderRadius: 3 }} alt="After" />
                                          ) : (
                                            <div style={{ fontSize: 8.5, color: '#94a3b8', fontStyle: 'italic', height: 50, display: 'flex', alignItems: 'center' }}>(ไม่มีรูปถ่าย)</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Form to enter complete PM info before adding */}
                              {!showPmForm ? (
                                <button
                                  type="button"
                                  onClick={() => setShowPmForm(true)}
                                  style={{
                                    ...btnStyle,
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 12px',
                                    fontSize: 11.5,
                                    width: '100%',
                                    fontWeight: 700,
                                    borderRadius: 6,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  ➕ เพิ่มอุปกรณ์ / ตู้ Rack
                                </button>
                              ) : (
                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 10, marginBottom: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 8 }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e3a5f' }}>➕ กรอกรายละเอียดอุปกรณ์ / ตู้ Rack</span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setShowPmForm(false);
                                        // Reset temp input fields
                                        setNewRackName('');
                                        setNewRackLocation('');
                                        setNewRackRemark('');
                                        setNewRackBeforePhoto(null);
                                        setNewRackAfterPhoto(null);
                                      }} 
                                      style={{ border: 'none', background: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: 800 }}
                                    >
                                      ปิด ✕
                                    </button>
                                  </div>

                                  <div style={{ marginBottom: 6 }}>
                                    <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>ชื่ออุปกรณ์ / ตู้ Rack *</label>
                                    <input 
                                      type="text" 
                                      placeholder="เช่น ตู้ Rack A (หลัก), Switch Core B..." 
                                      value={newRackName} 
                                      onChange={e => setNewRackName(e.target.value)}
                                      style={{ width: '100%', fontSize: 11, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div style={{ marginBottom: 6 }}>
                                    <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>สถานที่ *</label>
                                    <input 
                                      type="text" 
                                      placeholder="เช่น ห้อง Server ชั้น 2, โซน A..." 
                                      value={newRackLocation} 
                                      onChange={e => setNewRackLocation(e.target.value)}
                                      style={{ width: '100%', fontSize: 11, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div style={{ marginBottom: 8 }}>
                                    <label style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>หมายเหตุ กรณีพบความผิดปกติหรืออื่นๆ</label>
                                    <textarea 
                                      placeholder="ระบุความผิดปกติที่ตรวจพบ ฝุ่น ความร้อน หรือบันทึกข้อสังเกต..." 
                                      value={newRackRemark} 
                                      onChange={e => setNewRackRemark(e.target.value)}
                                      rows={2}
                                      style={{ width: '100%', fontSize: 11, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
                                    />
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10, background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                                    {/* Before Photo Input */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569' }}>📸 รูปก่อนทำ *</div>
                                      {newRackBeforePhoto ? (
                                        <div style={{ position: 'relative', width: '100%' }}>
                                          <img src={newRackBeforePhoto} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} alt="Before Preview" />
                                          <span 
                                            onClick={() => setNewRackBeforePhoto(null)}
                                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(220,38,38,0.9)', color: '#fff', fontSize: 8, padding: '2px 4px', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}
                                          >
                                            ลบรูป
                                          </span>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            id="pm-before-upload" 
                                            style={{ display: 'none' }} 
                                            onChange={e => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setNewRackBeforePhoto(reader.result);
                                                reader.readAsDataURL(file);
                                              }
                                            }} 
                                          />
                                          <label 
                                            htmlFor="pm-before-upload" 
                                            style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 6px', borderRadius: 4, fontSize: 9.5, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: '#475569' }}
                                          >
                                            📁 เลือกไฟล์
                                          </label>
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const mockImg = getMockImage('Before', newRackName || 'อุปกรณ์ PM');
                                              setNewRackBeforePhoto(mockImg);
                                            }} 
                                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 6px', borderRadius: 4, fontSize: 9.5, cursor: 'pointer', textAlign: 'center', width: '100%', color: '#1d4ed8', fontWeight: 700 }}
                                          >
                                            📷 จำลองรูป
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* After Photo Input */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569' }}>📸 รูปหลังทำ *</div>
                                      {newRackAfterPhoto ? (
                                        <div style={{ position: 'relative', width: '100%' }}>
                                          <img src={newRackAfterPhoto} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }} alt="After Preview" />
                                          <span 
                                            onClick={() => setNewRackAfterPhoto(null)}
                                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(220,38,38,0.9)', color: '#fff', fontSize: 8, padding: '2px 4px', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}
                                          >
                                            ลบรูป
                                          </span>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            id="pm-after-upload" 
                                            style={{ display: 'none' }} 
                                            onChange={e => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setNewRackAfterPhoto(reader.result);
                                                reader.readAsDataURL(file);
                                              }
                                            }} 
                                          />
                                          <label 
                                            htmlFor="pm-after-upload" 
                                            style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 6px', borderRadius: 4, fontSize: 9.5, cursor: 'pointer', textAlign: 'center', fontWeight: 600, color: '#475569' }}
                                          >
                                            📁 เลือกไฟล์
                                          </label>
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const mockImg = getMockImage('After', newRackName || 'อุปกรณ์ PM');
                                              setNewRackAfterPhoto(mockImg);
                                            }} 
                                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 6px', borderRadius: 4, fontSize: 9.5, cursor: 'pointer', textAlign: 'center', width: '100%', color: '#1d4ed8', fontWeight: 700 }}
                                          >
                                            📷 จำลองรูป
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (!newRackName.trim()) {
                                          window.dispatchEvent(new CustomEvent('show-toast', {
                                            detail: { title: 'กรอกข้อมูลไม่ครบ', message: '⚠️ กรุณากรอกชื่ออุปกรณ์ / ตู้ Rack', type: 'warning' }
                                          }));
                                          return;
                                        }
                                        if (!newRackLocation.trim()) {
                                          window.dispatchEvent(new CustomEvent('show-toast', {
                                            detail: { title: 'กรอกข้อมูลไม่ครบ', message: '⚠️ กรุณากรอกสถานที่ติดตั้งอุปกรณ์', type: 'warning' }
                                          }));
                                          return;
                                        }
                                        if (!newRackBeforePhoto) {
                                          window.dispatchEvent(new CustomEvent('show-toast', {
                                            detail: { title: 'กรอกข้อมูลไม่ครบ', message: '⚠️ กรุณากรอกข้อมูลรูปภาพก่อนทำ 1 รูป', type: 'warning' }
                                          }));
                                          return;
                                        }
                                        if (!newRackAfterPhoto) {
                                          window.dispatchEvent(new CustomEvent('show-toast', {
                                            detail: { title: 'กรอกข้อมูลไม่ครบ', message: '⚠️ กรุณากรอกข้อมูลรูปภาพหลังทำ 1 รูป', type: 'warning' }
                                          }));
                                          return;
                                        }
                                        
                                        const newItem = { 
                                          id: Date.now(), 
                                          name: newRackName.trim(), 
                                          location: newRackLocation.trim(),
                                          remark: newRackRemark.trim(),
                                          beforePhoto: newRackBeforePhoto, 
                                          afterPhoto: newRackAfterPhoto 
                                        };
                                        const updated = [...rackPhotos, newItem];
                                        setRackPhotos(updated);
                                        saveToDb({ rackPhotos: updated });
                                        
                                        // Clear form states and hide form
                                        setNewRackName('');
                                        setNewRackLocation('');
                                        setNewRackRemark('');
                                        setNewRackBeforePhoto(null);
                                        setNewRackAfterPhoto(null);
                                        setShowPmForm(false);
                                      }}
                                      style={{ ...btnStyle, background: '#16a34a', color: '#fff', border: 'none', padding: '7px 12px', fontSize: 11.5, flex: 1 }}
                                    >
                                      ➕ บันทึกอุปกรณ์
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setShowPmForm(false);
                                        // Reset fields
                                        setNewRackName('');
                                        setNewRackLocation('');
                                        setNewRackRemark('');
                                        setNewRackBeforePhoto(null);
                                        setNewRackAfterPhoto(null);
                                      }}
                                      style={{ ...btnStyle, background: '#cbd5e1', color: '#1e293b', border: 'none', padding: '7px 12px', fontSize: 11.5 }}
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                        {/* Damaged Product */}
                        <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginBottom: 6 }}>
                            <input type="checkbox" checked={damagedChecked} onChange={e => { setDamagedChecked(e.target.checked); saveToDb({ damagedProduct: { checked: e.target.checked, warranty: damagedWarranty, info: damagedInfo, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false } }); }} style={{ width: 'auto' }} />
                            สินค้าชำรุด (Damaged Product)
                          </label>
                          {damagedChecked && (
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, marginBottom: 8, marginLeft: 18 }}>
                              <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                                <label style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                  <input type="radio" name="warranty" checked={damagedWarranty === 'on'} onChange={() => { setDamagedWarranty('on'); saveToDb({ damagedProduct: { checked: damagedChecked, warranty: 'on', info: damagedInfo, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false } }); }} style={{ width: 'auto' }} /> On Warranty
                                </label>
                                <label style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                  <input type="radio" name="warranty" checked={damagedWarranty === 'off'} onChange={() => { setDamagedWarranty('off'); saveToDb({ damagedProduct: { checked: damagedChecked, warranty: 'off', info: damagedInfo, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false } }); }} style={{ width: 'auto' }} /> Off Warranty
                                </label>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
                                <input placeholder="Brand" value={damagedInfo.brand} onChange={e => { const inf = { ...damagedInfo, brand: e.target.value }; setDamagedInfo(inf); saveToDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: inf, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false } }); }}
                                  style={{ fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #e2e8f0', fontFamily: 'Prompt, sans-serif' }} />
                                <input placeholder="Model" value={damagedInfo.model} onChange={e => { const inf = { ...damagedInfo, model: e.target.value }; setDamagedInfo(inf); saveToDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: inf, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false } }); }}
                                  style={{ fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #e2e8f0', fontFamily: 'Prompt, sans-serif' }} />
                                <input placeholder="S/N" value={damagedInfo.sn} onChange={e => { const inf = { ...damagedInfo, sn: e.target.value }; setDamagedInfo(inf); saveToDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: inf, photos: damagedPhotos, photo: damagedPhotos.length > 0 ? '📷' : false } }); }}
                                  style={{ fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #e2e8f0', fontFamily: 'Prompt, sans-serif' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>📷 รูปถ่ายสินค้าชำรุด (เลือกได้มากกว่า 1 รูป)</div>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {damagedPhotos.map((img, idx) => (
                                      <div key={idx} style={{ position: 'relative', width: 42, height: 42, border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="damaged product" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const up = damagedPhotos.filter((_, i) => i !== idx);
                                            setDamagedPhotos(up);
                                            saveToDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photos: up, photo: up.length > 0 ? '📷' : false } });
                                          }}
                                          style={{
                                            position: 'absolute',
                                            top: 1,
                                            right: 1,
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: 12,
                                            height: 12,
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
                                      onClick={() => document.getElementById('ipad-damaged-photos-file-input').click()}
                                      style={{
                                        width: 42,
                                        height: 42,
                                        border: '1.5px dashed #64748b',
                                        borderRadius: 4,
                                        background: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#64748b'
                                      }}
                                    >
                                      <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
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
                                        const up = [...damagedPhotos, randomImg];
                                        setDamagedPhotos(up);
                                        saveToDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photos: up, photo: '📷' } });
                                      }}
                                      style={{
                                        padding: '2px 4px',
                                        fontSize: 9,
                                        borderRadius: 3,
                                        border: '1px solid #cbd5e1',
                                        background: '#fff',
                                        color: '#64748b',
                                        cursor: 'pointer',
                                        height: 22,
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      📷 จำลองรูป
                                    </button>

                                    <input
                                      id="ipad-damaged-photos-file-input"
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={e => {
                                        const files = Array.from(e.target.files);
                                        files.forEach(file => {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setDamagedPhotos(prev => {
                                              const up = [...prev, reader.result];
                                              saveToDb({ damagedProduct: { checked: damagedChecked, warranty: damagedWarranty, info: damagedInfo, photos: up, photo: '📷' } });
                                              return up;
                                            });
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div style={{ marginTop: 6, fontSize: 9.5, color: '#64748b', background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                                {damagedWarranty === 'on'
                                  ? '💡 ระบบจะสร้าง Replacement Ticket อัตโนมัติเพื่อเปลี่ยนสินค้าภายใต้ Warranty'
                                  : '💡 ระบบจะสร้าง Sales Ticket อัตโนมัติเพื่อเสนอขายสินค้าทดแทน (Off Warranty)'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* เพิ่ม Case Support */}
                        <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}>
                            <input type="checkbox" checked={othersChecked} onChange={e => { setOthersChecked(e.target.checked); saveToDb({ others: { checked: e.target.checked, list: othersList } }); }} style={{ width: 'auto' }} />
                            เพิ่ม Case Support
                          </label>
                          {othersChecked && (
                            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, marginLeft: 18, marginBottom: 8 }}>
                              {othersList.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4 }}>📋 รายการ Case Support ที่เพิ่มไว้:</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {othersList.map((item, idx) => (
                                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 10px', fontSize: 10.5 }}>
                                        <div>
                                          <strong>{idx + 1}. [{item.category}]</strong> ผู้แจ้ง: {item.reporter}
                                          <div style={{ color: '#475569', marginTop: 2 }}>• ปัญหา: {item.problem}</div>
                                          <div style={{ color: '#16a34a', marginTop: 1 }}>• แก้ไข: {item.solution}</div>
                                          {item.startTime && <div style={{ color: '#64748b', fontSize: 9.5, marginTop: 1 }}>⏳ {item.startTime} - {item.endTime}</div>}
                                        </div>
                                        <button type="button" onClick={() => handleRemoveOthersItem(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, marginLeft: 8 }}>✕</button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 6 }}>➕ เพิ่ม Case Support:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                                  <div>
                                    <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>ผู้แจ้ง</label>
                                    <input value={othersInput.reporter} onChange={e => setOthersInput({ ...othersInput, reporter: e.target.value })}
                                      style={{ width: '100%', fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif' }} placeholder="ผู้แจ้ง..." />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>กลุ่มปัญหา</label>
                                    <select value={othersInput.category} onChange={e => setOthersInput({ ...othersInput, category: e.target.value })}
                                      style={{ width: '100%', fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontFamily: 'Prompt, sans-serif' }}>
                                      <option value="Hardware">Hardware</option>
                                      <option value="Software">Software</option>
                                      <option value="Network">Network</option>
                                      <option value="Cabling">Cabling</option>
                                    </select>
                                  </div>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                  <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>ปัญหา</label>
                                  <textarea value={othersInput.problem} onChange={e => setOthersInput({ ...othersInput, problem: e.target.value })} rows={1}
                                    style={{ width: '100%', fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif', resize: 'vertical' }} placeholder="ระบุปัญหา..." />
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                  <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>วิธีแก้ปัญหา</label>
                                  <textarea value={othersInput.solution} onChange={e => setOthersInput({ ...othersInput, solution: e.target.value })} rows={1}
                                    style={{ width: '100%', fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif', resize: 'vertical' }} placeholder="วิธีแก้ปัญหา..." />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                                  <div>
                                    <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>เวลาเริ่มต้น</label>
                                    <input type="time" value={othersInput.startTime} onChange={e => setOthersInput({ ...othersInput, startTime: e.target.value })}
                                      style={{ width: '100%', fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif' }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>เวลาสิ้นสุด</label>
                                    <input type="time" value={othersInput.endTime} onChange={e => setOthersInput({ ...othersInput, endTime: e.target.value })}
                                      style={{ width: '100%', fontSize: 10, padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'Prompt, sans-serif' }} />
                                  </div>
                                </div>
                                <button type="button" onClick={handleAddOthersItem} style={{ ...btnStyle, width: '100%', background: '#6366f1', color: '#fff', border: 'none', fontSize: 10.5, padding: '6px 0' }}>
                                  ➕ เพิ่ม Case Support
                                </button>
                              </div>
                              <div style={{ marginTop: 6, fontSize: 9.5, color: '#64748b', background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                                💡 ระบบจะสร้าง Helpdesk Case อัตโนมัติจากข้อมูลแต่ละข้อ
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* ═══════════════════════════════════════ */}
                    {/* ส่วนที่ 3: ลงนามและยืนยันการปิดงาน        */}
                    {/* ═══════════════════════════════════════ */}
                    {checkOutTime && (
                      <Card style={{ borderTop: '3px solid #16a34a' }}>
                        <SectionTitle icon="✍️">ส่วนที่ 3: ลงนามและยืนยันส่งงาน</SectionTitle>
                        
                        {/* Signature Section */}
                        {!skipSignature && (
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>ลายมือชื่อลูกค้า (Customer Signature)</label>
                            
                            {!signatureImg && !showSignPad && (
                              <button onClick={() => setShowSignPad(true)} style={{ ...btnStyle, width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 0', fontSize: 11.5 }}>
                                ✍️ แตะเพื่อลงลายมือชื่อลูกค้า
                              </button>
                            )}
                            
                            {showSignPad && (
                              <div style={{ border: '1.5px solid #cbd5e1', borderRadius: 8, padding: 8, background: '#fff' }}>
                                <SignaturePad onSign={handleSign} width={400} height={120} />
                                <button onClick={() => setShowSignPad(false)} style={{ ...btnStyle, width: '100%', background: '#64748b', color: '#fff', border: 'none', fontSize: 10, marginTop: 6 }}>
                                  ยกเลิก
                                </button>
                              </div>
                            )}
                            
                            {signatureImg && (
                              <div style={{ border: '1.5px solid #86efac', borderRadius: 8, padding: 8, background: '#f0fdf4', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>✓ ลงลายมือชื่อเรียบร้อยแล้ว</div>
                                <img src={signatureImg} alt="Customer Signature" style={{ border: '1px solid #cbd5e1', borderRadius: 6, maxHeight: 80, maxWidth: '100%', background: '#fff', objectFit: 'contain' }} />
                                <button onClick={() => { setSignatureImg(null); saveToDb({ signatureImg: null }); }} style={{ ...btnStyle, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontSize: 10, width: '100%', marginTop: 6 }}>
                                  ล้างลายเซ็น
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {skipSignature && (
                          <div style={{ marginBottom: 12, border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: 10, background: '#f8fafc', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>💡 ได้รับการยกเว้นลายเซ็น (กำหนดโดย Service Manager)</div>
                            <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>(งานประเภทรีโมท / ดูแลระบบหลังบ้าน - ส่งอีเมลปิดงานได้ทันที)</div>
                          </div>
                        )}

                        {/* Document & Email Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                          <button onClick={handlePreviewPdf} style={{ ...btnStyle, background: '#f1f5f9', color: '#1e40af', border: '1.5px solid #1e40af', padding: '10px 0', fontSize: 11.5 }}>
                            📄 Preview PDF
                          </button>
                          
                          {matchedTicket?.requireCloseApproval ? (
                            <button onClick={handleSubmitCloseApproval} disabled={!(signatureImg || skipSignature) || matchedTicket?.status === 'Waiting Close Approval'}
                              style={{ 
                                ...btnStyle, 
                                background: (signatureImg || skipSignature) && matchedTicket?.status !== 'Waiting Close Approval' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : '#a1a1aa', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '10px 0', 
                                fontSize: 11.5,
                                opacity: (signatureImg || skipSignature) && matchedTicket?.status !== 'Waiting Close Approval' ? 1 : 0.5,
                                cursor: (signatureImg || skipSignature) && matchedTicket?.status !== 'Waiting Close Approval' ? 'pointer' : 'not-allowed'
                              }}>
                              {matchedTicket?.status === 'Waiting Close Approval' ? '🔒 รออนุมัติปิดตั๋ว...' : '📤 ส่งตรวจสอบและขอปิด'}
                            </button>
                          ) : (
                            <button onClick={handleOpenEmailDialog} disabled={!(signatureImg || skipSignature)}
                              style={{ 
                                ...btnStyle, 
                                background: (signatureImg || skipSignature) ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '#a1a1aa', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '10px 0', 
                                fontSize: 11.5,
                                opacity: (signatureImg || skipSignature) ? 1 : 0.5,
                                cursor: (signatureImg || skipSignature) ? 'pointer' : 'not-allowed'
                              }}>
                              📧 ส่ง Email ปิดงาน
                            </button>
                          )}
                        </div>
                        
                        {!(signatureImg || skipSignature) && (
                          <div style={{ fontSize: 9.5, color: '#dc2626', marginTop: 6, textAlign: 'center' }}>
                            * ต้องเซ็นชื่อลูกค้าเพื่อเปิดให้กด{matchedTicket?.requireCloseApproval ? 'ส่งคำขออนุมัติปิดตั๋ว' : 'ส่งรายงานบริการทางอีเมล'}
                          </div>
                        )}
                      </Card>
                    )}
                  </>
                ))}
              </div>

              {/* Home Indicator */}
              <div className="ipad-home-indicator" />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <div className="sidebar-container">

          {/* Testing Guide */}
          <div className="sidebar-card">
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, fontFamily: 'Kanit, sans-serif', color: '#1e40af' }}>💡 คู่มือการทดสอบ</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
              หน้าจอนี้จำลองการทำงานของเจ้าหน้าที่เทคนิคบน <strong>iPad Air</strong>
              <br /><br />
              <strong>1.</strong> เลือก Ticket งานที่ต้องการ<br />
              <strong>2.</strong> กด Check-in เพื่อปลดล็อคฟอร์ม<br />
              <strong>3.</strong> เช็ค Checklist ตามประเภทงาน<br />
              <strong>4.</strong> กรอกรายละเอียดและแนบรูป<br />
              <strong>5.</strong> หากมีเปลี่ยนอุปกรณ์ → เลือกจากคลัง NIS<br />
              <strong>6.</strong> ลงลายเซ็นลูกค้า<br />
              <strong>7.</strong> Preview PDF แล้วส่ง Email ปิดงาน
            </div>
          </div>

          {/* iPad Specs */}
          <div className="sidebar-card" style={{ background: 'linear-gradient(135deg,#ede9fe,#f5f3ff)', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#5b21b6', marginBottom: 6, fontFamily: 'Kanit, sans-serif' }}>📱 iPad Air Specifications</div>
            <div style={{ fontSize: 10.5, color: '#6d28d9', lineHeight: 1.7 }}>
              • Liquid Retina 11" Display Mockup<br />
              • iPadOS Status Bar Simulation<br />
              • Front Camera Dot (TrueDepth)<br />
              • Glass Reflection Effect<br />
              • Touch & Signature-pad Optimized<br />
              • Home Indicator Bar<br />
              • Premium Matte Aluminum Frame
            </div>
          </div>

          {/* Back-office Activity Log */}
          <div className="sidebar-card" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#c2410c', marginBottom: 8, fontFamily: 'Kanit, sans-serif' }}>📋 Activity Log (Back-office)</div>
            {activityLog.length === 0 ? (
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontStyle: 'italic' }}>ยังไม่มีกิจกรรม — จะปรากฏเมื่อมีการตัดบัญชีหรือปิดงาน</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activityLog.map((log, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 6, padding: '6px 10px', fontSize: 10 }}>
                    <div style={{ color: '#64748b', fontSize: 9 }}>{log.time}</div>
                    <div style={{ color: '#c2410c', fontWeight: 600, marginTop: 1 }}>{log.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ PDF Preview Modal ═══ */}
      {showPdfPreview && matchedTicket && (
        <PdfPreviewModal
          onClose={() => setShowPdfPreview(false)}
          onOpenEmail={matchedTicket?.requireCloseApproval ? null : handleOpenEmailDialog}
          data={{
            srNumber: srNumber || '(กำลังสร้าง...)',
            customer: matchedTicket.customer,
            location: matchedTicket.location,
            contactName: matchedTicket.contact?.name || '-',
            contactPhone: matchedTicket.contact?.phone || '-',
            engineerName: matchedTicket.engineer?.name || '-',
            engineerNick: matchedTicket.engineer?.nickname || '-',
            checkIn: checkInTime,
            checkOut: checkOutTime,
            ticketId: matchedTicket.id,
            ticketTitle: matchedTicket.title,
            ticketType: ticketType,
            checklist,
            workDetail,
            issueDetail,
            photos,
            signature: signatureImg,
            skipSignature: skipSignature,
            checkedOutItems,
            replacedDevice,
            rackPhotos
          }}
        />
      )}

      {/* ═══ Email Confirmation Overlay Modal ═══ */}
      {showEmailModal && matchedTicket && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: 440, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', fontFamily: 'Prompt, sans-serif' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4, fontFamily: 'Kanit, sans-serif' }}>📧 ยืนยันการส่ง Service Report ทาง Email</div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 14 }}>ระบุที่อยู่อีเมลลูกค้าที่ต้องการให้รับเอกสารฉบับนี้:</div>

            {/* PDF Preview verification */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>⚠️ กรุณาตรวจสอบความถูกต้องของเอกสารก่อนส่ง:</div>
              <button 
                type="button" 
                onClick={handlePreviewPdf} 
                style={{ 
                  width: '100%', 
                  background: '#eff6ff', 
                  color: '#1d4ed8', 
                  border: '1.5px solid #bfdbfe', 
                  borderRadius: 6, 
                  padding: '6px 0', 
                  fontSize: 11.5, 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                👁️ Preview PDF Full (พร้อมลายเซ็นลูกค้า)
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>อีเมลผู้รับ (To):</label>
                <input 
                  type="email" 
                  value={recipientEmail} 
                  onChange={e => setRecipientEmail(e.target.value)} 
                  style={{ width: '100%', padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4, boxSizing: 'border-box' }}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>หัวข้ออีเมล (Subject):</label>
                <input 
                  type="text" 
                  value={emailSubject} 
                  onChange={e => setEmailSubject(e.target.value)} 
                  style={{ width: '100%', padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #cbd5e1', marginTop: 4, boxSizing: 'border-box' }}
                  required 
                />
              </div>
              <div style={{ fontSize: 10.5, color: '#16a34a', background: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #b7ebc6' }}>
                ✓ เมื่อกดส่ง ระบบจะทำการปิดตั๋วงาน <strong>{matchedTicket.id}</strong> และบันทึกรายงาน <strong>{srNumber}</strong> เข้าระบบคลังประวัติตามเวลาและสเปคที่ช่างกรอก
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmailModal(false)} style={{ ...btnStyle, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>ยกเลิก</button>
              <button onClick={handleConfirmSendReport} style={{ ...btnStyle, background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none' }}>ส่ง Email & ปิดงาน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 12, ...style }}>{children}</div>
);

const SectionTitle = ({ icon, children, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
    <div style={{ fontSize: 12.5, fontWeight: 800, fontFamily: 'Kanit, sans-serif', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {children}
    </div>
    {right && <div>{right}</div>}
  </div>
);

const FieldRow = ({ label, value }) => (
  <div style={{ display: 'flex', fontSize: 11.5, marginBottom: 3, lineHeight: 1.5 }}>
    <span style={{ color: '#64748b', minWidth: 70, fontWeight: 600 }}>{label}</span>
    <span style={{ color: '#0f172a', fontWeight: 700 }}>{value || '-'}</span>
  </div>
);
