import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiceReports, getProjects } from '../mockDb';

export default function ServiceReports() {
  const navigate = useNavigate();
  const [reportsList] = useState(() => getServiceReports());
  const [projectsList] = useState(() => getProjects());

  // Filter states
  const [searchTicket, setSearchTicket] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [showSignedOnly, setShowSignedOnly] = useState(false);

  // Detail Modal state
  const [selectedReport, setSelectedReport] = useState(null);

  // Helper: Find ticket info and checklist from projects in localStorage
  const findTicketInfo = (projectId, ticketId) => {
    const proj = projectsList.find(p => p.id === projectId);
    if (!proj) return null;
    const tk = proj.tickets?.find(t => t.id === ticketId);
    if (!tk) return null;
    return {
      ...tk,
      projectName: proj.name,
      projectLocation: proj.location,
      projectContact: proj.contact
    };
  };

  // Helper: Get signature image (either direct in report or from ticket fallback)
  const getSignature = (report) => {
    if (report.signatureImg) return report.signatureImg;
    const tkInfo = findTicketInfo(report.projectId, report.ticketId);
    return tkInfo?.signatureImg || null;
  };

  // Populate Dropdown Options
  const customers = useMemo(() => {
    const set = new Set(reportsList.map(r => r.customer).filter(Boolean));
    return Array.from(set);
  }, [reportsList]);

  const engineers = useMemo(() => {
    const set = new Set(reportsList.map(r => r.engineer).filter(Boolean));
    return Array.from(set);
  }, [reportsList]);

  // Filtered List
  const filteredReports = useMemo(() => {
    return reportsList.filter(r => {
      const matchTicket = !searchTicket || r.ticketId?.toLowerCase().includes(searchTicket.toLowerCase().trim());
      const matchCustomer = !selectedCustomer || r.customer === selectedCustomer;
      const matchEngineer = !selectedEngineer || r.engineer === selectedEngineer;
      
      const signature = getSignature(r);
      const matchSigned = !showSignedOnly || !!signature;

      return matchTicket && matchCustomer && matchEngineer && matchSigned;
    });
  }, [reportsList, searchTicket, selectedCustomer, selectedEngineer, showSignedOnly, projectsList]);

  // PDF Print Trigger
  const handlePrintPDF = (report) => {
    const signature = getSignature(report);
    const tkInfo = findTicketInfo(report.projectId, report.ticketId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('โปรดเปิดใช้งาน Popup ในเบราว์เซอร์เพื่อแสดงผล PDF');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>NIS Service Report - ${report.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Prompt', sans-serif; padding: 40px; color: #0f172a; margin: 0; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; font-family: 'Prompt', sans-serif; }
            .logo-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
            .doc-title { text-align: right; font-size: 20px; font-weight: 700; color: #1e1b4b; }
            .doc-id { font-size: 13.5px; font-weight: 600; color: #64748b; margin-top: 4px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 13.5px; font-weight: 700; color: #4f46e5; border-left: 4px solid #4f46e5; padding-left: 8px; margin-bottom: 12px; text-transform: uppercase; }
            .info-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 10px; }
            .info-table td { padding: 6px 8px; vertical-align: top; }
            .info-label { color: #64748b; font-weight: 500; width: 180px; }
            .info-val { font-weight: 600; color: #0f172a; }
            .checklist-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
            .checklist-table th { background: #f8fafc; padding: 8px 10px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
            .checklist-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .checkbox { width: 14px; height: 14px; border: 1.5px solid #475569; border-radius: 3px; display: inline-block; text-align: center; line-height: 12px; font-size: 10px; font-weight: bold; color: #4f46e5; }
            .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 12.5px; color: #334155; white-space: pre-wrap; line-height: 1.6; }
            .signature-area { width: 100%; margin-top: 50px; }
            .signature-box { width: 45%; border: 1px dashed #cbd5e1; border-radius: 10px; height: 130px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding: 10px; text-align: center; box-sizing: border-box; }
            .sig-img { max-height: 85px; max-width: 90%; object-fit: contain; margin-bottom: 6px; }
            .sig-line { border-top: 1px solid #94a3b8; width: 100%; padding-top: 6px; font-size: 11px; color: #64748b; font-weight: 500; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="logo">NIS Service Platform</div>
                <div class="logo-sub">Network & Infrastructure Solutions</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div class="doc-title">Onsite Service Report</div>
                <div class="doc-id">เลขที่ใบงาน: ${report.id}</div>
              </td>
            </tr>
          </table>

          <div class="section">
            <div class="section-title">ข้อมูลทั่วไป (General Information)</div>
            <table class="info-table">
              <tr>
                <td class="info-label">ลูกค้า / บริษัท:</td>
                <td class="info-val">${report.customer}</td>
                <td class="info-label">วันที่ปฏิบัติงาน:</td>
                <td class="info-val">${report.date}</td>
              </tr>
              <tr>
                <td class="info-label">โครงการ / สถานที่:</td>
                <td class="info-val">${tkInfo?.projectName || 'งาน Onsite ทั่วไป'}</td>
                <td class="info-label">หมายเลขตั๋วงานย่อย:</td>
                <td class="info-val" style="font-family: monospace; font-weight: 700;">${report.ticketId}</td>
              </tr>
              <tr>
                <td class="info-label">ประเภทการเข้าบริการ:</td>
                <td class="info-val">${report.type}</td>
                <td class="info-label">วิศวกรผู้ดำเนินงาน:</td>
                <td class="info-val">${report.engineer}</td>
              </tr>
              ${tkInfo?.projectLocation ? `
              <tr>
                <td class="info-label">ที่อยู่สถานที่ปฏิบัติงาน:</td>
                <td class="info-val" colspan="3">${tkInfo.projectLocation}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div class="section">
            <div class="section-title">รายละเอียดผลงานซ่อมบำรุง (Service & Work Summary)</div>
            <div class="summary-box">${report.summary || 'ไม่มีบันทึกรายละเอียดงาน'}</div>
          </div>

          ${tkInfo?.checklist && tkInfo.checklist.length > 0 ? `
          <div class="section">
            <div class="section-title">ผลการดำเนินงานเช็คลิสต์ (Completed Checklists)</div>
            <table class="checklist-table">
              <thead>
                <tr>
                  <th style="width: 60px; text-align: center;">สถานะ</th>
                  <th>รายละเอียดงานตรวจสอบ</th>
                </tr>
              </thead>
              <tbody>
                ${tkInfo.checklist.map(c => `
                  <tr>
                    <td style="text-align: center;">
                      <span class="checkbox">${c.done ? '✓' : ''}</span>
                    </td>
                    <td>${c.label}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <table style="width: 100%; margin-top: 50px; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding-right: 20px;">
                <div class="signature-box" style="margin-right: auto;">
                  <div style="font-size: 12px; color: #94a3b8; margin-bottom: 25px;">(ลงชื่อ) ___________________________</div>
                  <div class="sig-line">วิศวกรผู้ปฏิบัติงาน (NIS Support)</div>
                </div>
              </td>
              <td style="width: 50%; padding-left: 20px; display: flex; justify-content: flex-end;">
                <div class="signature-box" style="margin-left: auto;">
                  ${signature ? `<img class="sig-img" src="${signature}" alt="Customer Signature" />` : '<div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 30px;">(ไม่มีลายมือชื่อของลูกค้า)</div>'}
                  <div class="sig-line">ลูกค้าผู้ตรวจรับงาน (Customer Authorized Sign)</div>
                </div>
              </td>
            </tr>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Onsite Service Reports — ทะเบียนใบงาน Onsite</div>
          <div className="page-subtitle">แสดงรายการใบรายงาน Onsite Service ทั้งหมดที่ปิดตั๋วสำเร็จ พร้อมลายเซ็นผู้รับงานและเมนูดาวน์โหลด PDF</div>
        </div>
      </div>

      {/* Advanced Filter Panel Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Ticket ID search input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>🔍 ค้นหาตาม Ticket ID</span>
            <input 
              type="text" 
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              placeholder="พิมพ์ค้นหา เช่น TK-0088..."
              style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', width: '100%' }}
            />
          </div>

          {/* Customer select filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>🏢 กรองตามชื่อลูกค้า</span>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: '#fff' }}
            >
              <option value="">🏢 แสดงลูกค้าทั้งหมด</option>
              {customers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Engineer select filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 700 }}>👤 กรองตามวิศวกร</span>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              style={{ fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', background: '#fff' }}
            >
              <option value="">👤 แสดงวิศวกรทั้งหมด</option>
              {engineers.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Signed Only Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 18, height: '100%' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', background: '#f8fafc', padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <input 
                type="checkbox" 
                checked={showSignedOnly} 
                onChange={(e) => setShowSignedOnly(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--secondary)' }}
              />
              ✍️ แสดงเฉพาะที่มีลายเซ็นลูกค้า
            </label>
          </div>

        </div>
      </div>

      {/* Main Reports Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)' }}>
            📁 รายชื่อใบรายงานบริการที่ได้รับการอนุมัติรับงาน ({filteredReports.length} ใบงาน)
          </div>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--border-light)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>เลขที่ใบงาน</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>วันที่ทำงาน</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>Ticket ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>ชื่อลูกค้า / บริษัท</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>วิศวกรผู้ดำเนินงาน</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>ประเภทงาน</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12 }}>ลายเซ็นลูกค้า</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12 }}>จัดการรายงาน</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: 13.5, fontStyle: 'italic' }}>
                    ไม่พบข้อมูลใบรายงาน Onsite Service ตามเงื่อนไขการค้นหาของคุณ
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const signature = getSignature(report);
                  return (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Document ID */}
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text)' }}>
                        📄 {report.id}
                      </td>
                      
                      {/* Date */}
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {report.date}
                      </td>

                      {/* Ticket Link */}
                      <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>
                        <span 
                          onClick={() => navigate(`/tickets/${report.ticketId}`)}
                          style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {report.ticketId}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                        {report.customer}
                      </td>

                      {/* Engineer Staff */}
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                        👤 {report.engineer}
                      </td>

                      {/* Service Type */}
                      <td style={{ padding: '12px 16px', fontSize: 12.5 }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700,
                          background: report.type?.toLowerCase().includes('ma') ? 'var(--warning-bg)' : 'var(--primary-bg)',
                          color: report.type?.toLowerCase().includes('ma') ? 'var(--warning)' : 'var(--primary)'
                        }}>
                          {report.type}
                        </span>
                      </td>

                      {/* Signature Status */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {signature ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--secondary-bg)', color: 'var(--secondary)', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            ✓ มีลายมือชื่อ
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#94a3b8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                            ✕ ไม่มีลายมือชื่อ
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedReport(report)}
                            style={{ padding: '4px 10px', fontSize: 11.5 }}
                          >
                            🔍 เปิดใบงาน
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePrintPDF(report)}
                            style={{ padding: '4px 10px', fontSize: 11.5, background: '#ea580c', borderColor: '#ea580c' }}
                          >
                            🖨️ PDF / Print
                          </button>
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

      {/* PDF Document Viewer Modal */}
      {selectedReport && (() => {
        const signature = getSignature(selectedReport);
        const tkInfo = findTicketInfo(selectedReport.projectId, selectedReport.ticketId);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#f8fafc', borderRadius: 16, width: '90%', maxWidth: 780, maxHeight: '90vh', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Modal Header bar */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                  📄 รายละเอียดใบงานระบบออฟฟิศ Onsite Service ({selectedReport.id})
                </span>
                <button 
                  onClick={() => setSelectedReport(null)}
                  style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Container - Simulated A4 Document sheet */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '24px 32px', display: 'flex', justifyContent: 'center', background: '#eceff1' }}>
                
                {/* Simulated A4 Paper */}
                <div style={{ background: '#fff', width: '100%', maxWidth: 700, padding: '36px 44px', border: '1px solid #cbd5e1', borderRadius: 2, boxShadow: '0 4px 10px rgba(0,0,0,0.06)', minHeight: 700, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                  
                  {/* Paper Header logo & Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #4f46e5', paddingBottom: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5', fontFamily: 'Kanit, sans-serif' }}>NIS Service Platform</div>
                      <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 0.5 }}>Network & Infrastructure Solutions Co., Ltd.</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', fontFamily: 'Kanit, sans-serif' }}>Onsite Service Report</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginTop: 2 }}>เลขที่: {selectedReport.id}</div>
                    </div>
                  </div>

                  {/* General details grid */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 10 }}>ข้อมูลทั่วไป (General Information)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>ลูกค้า:</span> <strong style={{ color: 'var(--text)' }}>{selectedReport.customer}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>วันที่เข้าบริการ:</span> <strong style={{ color: 'var(--text)' }}>{selectedReport.date}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>โครงการ:</span> <strong style={{ color: 'var(--text)' }}>{tkInfo?.projectName || 'งาน Onsite ทั่วไป'}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>ตั๋วงานย่อย:</span> <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{selectedReport.ticketId}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>วิศวกรผู้ดำเนินงาน:</span> <strong style={{ color: 'var(--text)' }}>{selectedReport.engineer}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>ประเภทการซัพพอร์ต:</span> <strong style={{ color: 'var(--text)' }}>{selectedReport.type}</strong></div>
                    </div>
                  </div>

                  {/* Work Summary notes */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 10 }}>รายละเอียดงานซ่อมบำรุง (Service Summary)</div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {selectedReport.summary || 'ไม่มีบันทึกรายละเอียดงานสำหรับใบงานนี้'}
                    </div>
                  </div>

                  {/* Checklists status */}
                  {tkInfo?.checklist && tkInfo.checklist.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 10 }}>เช็คลิสต์งานที่ตรวจรับ (Completed Checklists)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {tkInfo.checklist.map((c, cidx) => (
                          <div key={cidx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text)' }}>
                            <span style={{
                              width: 14, height: 14, border: '1.5px solid #64748b', borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--secondary)', flexShrink: 0
                            }}>
                              {c.done ? '✓' : ''}
                            </span>
                            <span style={{ textDecoration: c.done ? 'none' : 'line-through', opacity: c.done ? 1 : 0.5 }}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signature Blocks A4 layout */}
                  <div style={{ marginTop: 'auto', paddingTop: 30, display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '45%', border: '1px dashed #cbd5e1', borderRadius: 8, height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: 8, boxSizing: 'border-box' }}>
                      <div style={{ fontStyle: 'italic', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 20 }}>ส่งรายงานบริการอัตโนมัติ</div>
                      <div style={{ borderTop: '1px solid #94a3b8', width: '100%', textAlign: 'center', fontSize: 10.5, color: 'var(--text-muted)', paddingTop: 4 }}>วิศวกรผู้ส่งงาน (NIS Service)</div>
                    </div>
                    
                    <div style={{ width: '45%', border: '1px dashed #cbd5e1', borderRadius: 8, height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: 8, boxSizing: 'border-box' }}>
                      {signature ? (
                        <img src={signature} style={{ maxHeight: 70, maxWidth: '90%', objectFit: 'contain', marginBottom: 4 }} alt="Customer Signature" />
                      ) : (
                        <div style={{ fontSize: 11, color: '#94a3b8', margin: 'auto 0' }}>ไม่มีลายเซ็นช่าง/ลูกค้า</div>
                      )}
                      <div style={{ borderTop: '1px solid #94a3b8', width: '100%', textAlign: 'center', fontSize: 10.5, color: 'var(--text-muted)', paddingTop: 4 }}>ลูกค้าผู้ตรวจงาน (Authorized Signature)</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer actions bar */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
                <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>
                  ✕ ปิดหน้าต่าง
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handlePrintPDF(selectedReport)}
                  style={{ background: '#ea580c', borderColor: '#ea580c' }}
                >
                  🖨️ สั่งพิมพ์เอกสาร / บันทึกไฟล์ PDF
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
