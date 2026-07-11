# โครงสร้างระบบและการพัฒนา (NIS Service ERP System)

ไฟล์นี้สรุปสถาปัตยกรรม โครงสร้างโค้ด แบบจำลองข้อมูล (Schemas) และแนวทางการพัฒนาของระบบ **NIS Service ERP** สำหรับนำไปใช้เป็นบริบทอ้างอิงร่วมกับ **Claude Code** หรือเครื่องมือ AI Agent อื่นๆ ได้ทันที

> **อัปเดตล่าสุด:** 11 กรกฎาคม 2026

---

## 1. คำสั่งควบคุมระบบ (Build & Development Commands)

* **รันระบบสำหรับพัฒนา (Local Development Server):**
  ```bash
  npm run dev
  ```
* **คอมไพล์เพื่อผลิตโปรดักชัน (Production Build):**
  ```bash
  npm run build
  ```
* **ตรวจสอบและจัดรูปแบบโค้ด (Linting & Formatting):**
  ```bash
  npm run lint
  ```
* **รันระบบหลังคอมไพล์เสร็จเพื่อตรวจงาน (Preview Production Build):**
  ```bash
  npm run preview
  ```

---

## 2. โครงสร้างโฟลเดอร์และไฟล์สำคัญ (Folder Structure)

```text
/Users/apple/Desktop/Antigravity/Service2
├── package.json               # รายการ Dependencies และ Scripts ของโปรเจกต์
├── vite.config.js             # การตั้งค่า Vite (ใช้ React plugin เปล่า)
├── index.html                 # หน้าหลักเว็บแอปพลิเคชัน (โหลด Google Fonts: Prompt, Kanit)
├── CLAUDE.md                  # ไฟล์บริบทสถาปัตยกรรมระบบสำหรับ AI Agent
├── src
│   ├── main.jsx               # จุดเริ่มต้นของแอปพลิเคชัน (React Root render)
│   ├── App.jsx                # กำหนดเส้นทาง URL (React Router v7 Route Mapping)
│   ├── index.css              # สไตล์ส่วนกลาง โทนสี และ CSS Animations
│   ├── App.css                # CSS ตกแต่งย่อย
│   ├── mockDb.js              # ระบบจำลองฐานข้อมูลที่ทำงานผ่าน LocalStorage
│   ├── layouts
│   │   └── DashboardLayout.jsx # เลย์เอาต์หลักของแอปพลิเคชัน (Sidebar + Header + ค้นหาลูกค้าแบบ 360 องศา)
│   └── pages
│       ├── Dashboard.jsx      # แดชบอร์ดสรุปผลและรายงานกราฟ SVG (Bar, Line, Donut)
│       ├── Quotations.jsx     # รายการใบเสนอราคา (แสดงสถานะ / ค้นหา / กรองข้อมูล)
│       ├── QuotationDetail.jsx# ดูรายละเอียดและสร้างใบเสนอราคาใหม่
│       ├── SalesOrders.jsx    # รายการใบสั่งขาย (ที่สร้างจากใบเสนอราคาที่ได้รับการอนุมัติ)
│       ├── Projects.jsx       # รายการโครงการและตั๋วงานของวิศวกร
│       ├── NewProject.jsx     # หน้าสร้างโครงการใหม่ (พร้อมระบบกำหนดตั๋วงานย่อย)
│       ├── TicketDetail.jsx   # รายละเอียดและขั้นตอนการดำเนินการตั๋วงาน
│       ├── ServiceBoard.jsx   # บอร์ดบริการแบบ Kanban + ระบบ Assign งาน + ปฏิทิน Onsite
│       ├── ServiceTeam.jsx    # รายชื่อทีมวิศวกร ทักษะ และภาระงานปัจจุบัน
│       ├── SalesTeam.jsx      # รายชื่อทีมขาย เป้ายอดขาย และข้อมูลการทำยอดปัจจุบัน
│       ├── ClaimsPortal.jsx   # ระบบติดตามและจัดการการเคลมสินค้าประกันอุปกรณ์
│       ├── StaffPortal.jsx    # หน้าหลักสำหรับวิศวกรภาคสนาม
│       ├── IpadOnsiteTest.jsx # แอปจำลองหน้าจอ iPad Air สำหรับช่างหน้างาน (หน้าหลักระบบ)
│       └── SystemConfig.jsx   # ตัวเลือกสำหรับตั้งค่าระบบและปุ่มล้างข้อมูล (Reset DB)
```

---

## 3. สถาปัตยกรรมข้อมูลและฐานข้อมูลจำลอง (`mockDb.js`)

ระบบนี้ไม่มี Backend หรือฐานข้อมูล SQL/NoSQL ภายนอก ข้อมูลทั้งหมดจะถูกจัดการผ่าน `localStorage` ในเบราว์เซอร์

### 3.1. Schemas หลักในระบบ

#### ใบเสนอราคา (Quotations)
* ตัวแปรใน LocalStorage: `nis_quotations`
* โครงสร้าง:
  ```json
  {
    "id": "QT-2023-112",
    "customer": "TechVision Co., Ltd.",
    "contact": "คุณวิชัย สมบูรณ์",
    "phone": "02-111-2222",
    "email": "wichai@techvision.co.th",
    "date": "2023-10-24",
    "due": "2023-11-07",
    "status": "Draft | Approved | Closed",
    "type": "Implement | MA-Fortigate | MA-Network | Runrate",
    "value": 850000,
    "tags": ["Firewall", "Network"],
    "items": [
      { "id": 1, "name": "FortiGate 100F", "sku": "FG-100F", "qty": 1, "price": 580000, "warranty": "3 ปี (Vendor)", "type": "Hardware" }
    ]
  }
  ```

#### ใบสั่งขาย (Sales Orders)
* ตัวแปรใน LocalStorage: `nis_sales_orders`
* โครงสร้าง:
  ```json
  {
    "id": "SO-2023-099",
    "quoteRef": "QT-2023-110",
    "customer": "KBank IT Division",
    "date": "2023-10-19",
    "type": "Runrate",
    "value": 285000,
    "status": "Delivered | In Progress | Project Open | Closed",
    "project": "PRJ-2023-045",
    "poNumber": "PO-KB-2023-7741",
    "poDate": "2023-10-18",
    "poNote": "อนุมัติสั่งซื้อผ่านระบบจัดซื้อ...",
    "salesName": "คุณวีระ ศรีสุข",
    "items": []
  }
  ```

#### โครงการและตั๋วงาน (Projects & Tickets)
* ตัวแปรใน LocalStorage: `nis_projects`
* ในระดับ Project จะเก็บรายการตั๋วงานย่อย (`tickets`) แบบฝัง (Embedded Array)
* **[อัปเดต]** Field สำคัญที่เพิ่มใหม่ใน Ticket: `onsiteDate` (วันกำหนดเข้าปฏิบัติงานจริง)
  ```json
  {
    "id": "PRJ-2023-044",
    "name": "Implement FW & Network - SCG Cement HQ",
    "customer": "SCG Cement Co.",
    "type": "Implement",
    "priority": "High | Medium | Low",
    "progress": 65,
    "status": "In Progress | Active | Closed",
    "startDate": "2023-10-16",
    "endDate": "2023-12-31",
    "staff": "Krit P.",
    "soRef": "SO-2023-098",
    "tags": ["Firewall", "Network"],
    "contact": { "name": "คุณอรทัย พรหม", "phone": "02-777-8888", "email": "orathai@scg.co.th" },
    "salesPM": { "name": "คุณวีระ ศรีสุข", "nickname": "วี", "phone": "089-999-1234", "role": "Sales Manager" },
    "engineer": { "name": "นายกฤษฎ์ พิชิตกุล", "nickname": "กฤษฎ์", "phone": "081-222-3344" },
    "location": "อาคาร SCG Experience...",
    "tickets": [
      {
        "id": "TK-0091",
        "title": "ติดตั้ง FortiGate 100F + FortiSwitch",
        "status": "Open | In Progress | Pending | Waiting Close Approval | Done | Closed",
        "assignee": "Krit P.",
        "due": "2023-10-30",
        "onsiteDate": "2023-10-28",
        "pct": 70,
        "ticketType": "Install | MA | PM | Support | Backup | Report | งานภายใน | Lab/เรียนรู้",
        "accepted": true,
        "skipSignature": false,
        "noOnsite": false,
        "requireCloseApproval": false,
        "rejectionReason": "",
        "checklist": [{ "label": "ตรวจสอบ Rack", "done": false }],
        "note": "คำสั่งชี้แจงจาก Service Manager"
      }
    ]
  }
  ```

#### คำขอเปิดตั๋วจาก Staff (Pending Ticket Requests)
* ตัวแปรใน LocalStorage: `nis_pending_tickets`
* **[ใหม่]** ช่างสามารถขอเปิดตั๋วผ่าน iPad → Service Manager อนุมัติใน ServiceBoard
  ```json
  {
    "id": "REQ-1720000000000",
    "title": "ขอ Support ลูกค้า ABC",
    "projectId": "PRJ-GENERAL",
    "location": "NIS Office / Remote",
    "ticketType": "Support",
    "due": "2026-07-15",
    "onsiteDate": "2026-07-13",
    "detail": "รายละเอียดงาน...",
    "supportMethod": "Onsite | Remote | Telephone",
    "parentTicketId": "",
    "noOnsite": false,
    "skipSignature": false,
    "requireCloseApproval": false,
    "requestedBy": "Krit P.",
    "status": "Pending Approval",
    "requestTime": "11/7/2569 10:30:00"
  }
  ```

#### คลัง NIS Warehouse (Stock)
* ตัวแปรใน LocalStorage: `nis_stock`
* **[อัปเดต]** เพิ่ม `category` field สำหรับแบ่งหมวดหมู่สินค้า
  ```json
  {
    "id": "STK-001",
    "name": "FortiGate 60F",
    "brand": "Fortinet",
    "model": "FG-60F",
    "sn": "FG60FT0001",
    "qty": 3,
    "category": "Firewall | Switch | WiFi | CCTV | Lan&Cable | Server",
    "status": "Available | Low Stock | Out of Stock"
  }
  ```

#### อุปกรณ์ในคลังและงานเคลม (Warranty Claims)
* คลังสำรอง: `nis_stock`
* ข้อมูลการเคลมประกัน: `nis_claims` & แจ้งเตือนฝ่ายขาย: `nis_claims_notifications`

#### โน้ตส่วนตัว (Personal Notes)
* ตัวแปรใน LocalStorage: `nis_personal_notes`
* **[ใหม่]** รองรับการตั้ง Reminder พร้อม datetime-local
  ```json
  {
    "id": "note-1720000000000",
    "text": "เนื้อหาโน้ต...",
    "reminder": "2026-07-15T09:00",
    "createdAt": "2026-07-11T10:00"
  }
  ```

---

### 3.2. ฟังก์ชันอำนวยความสะดวกใน `mockDb.js`

* `getQuotations()` / `saveQuotations(data)` / `addQuotation(q)`
* `getSalesOrders()` / `saveSalesOrders(data)` / `addSalesOrder(so)`
* `getProjects()` / `saveProjects(data)` / `addProject(p)`
* `getNisStock()` / `saveNisStock(data)`
* `getServiceReports()` / `addServiceReport(report)` / `getNextServiceReportNumber()`
* `getClaims()` / `addClaim(claim)` / `getNextClaimNumber()`
* `getClaimNotifications()` / `addClaimNotification(notif)`
* `getPendingTickets()` / `savePendingTickets(data)` — คำขอเปิดตั๋วจาก Staff
* `getDynamicStaff()` / `saveDynamicStaff(data)` — รายชื่อช่างแบบ Dynamic
* `getPersonalNotes()` / `savePersonalNotes(data)` — โน้ตส่วนตัว
* `getPersonalChecklists()` / `savePersonalChecklists(data)` — Checklist/Todo ส่วนตัว
* `resetDb()` (รีเซ็ตกลับเป็นค่า Default ทั้งหมด)

---

## 4. โฟลว์การทำงานของระบบ (System Workflow)

### 4.1 โฟลว์หลักธุรกิจ End-to-End

1. **ฝ่ายขายสร้างใบเสนอราคา (Quotation Flow):**
   * สร้างเอกสารเสนอราคาในหน้า `QuotationDetail` → สถานะ `Draft` → ยืนยันเปลี่ยนเป็น `Approved`

2. **สร้างใบสั่งขาย (Sales Order Flow):**
   * ใบเสนอราคาที่อนุมัติแล้วแปลงเป็น `Sales Order` ทางหน้า `SalesOrders` เพื่ออ้างอิง PO ของลูกค้า

3. **เปิดโครงการและสร้างงานช่าง (Project & Ticket Flow):**
   * ที่หน้า `NewProject` หรือแปลงจาก Sales Order ระบบให้เพิ่มโครงการพร้อมฝังตั๋วงานย่อย (Tickets)

4. **[อัปเดต] กระบวนการกำหนดวันเข้า Onsite (Service Manager Flow — `ServiceBoard.jsx`):**
   * Service Manager สร้างตั๋วงานหรือ Assign ช่าง พร้อม **กำหนดวันเข้า Onsite (`onsiteDate`)** แยกจาก Due Date
   * ปฏิทินบนบอร์ด (`ServiceBoard`) จะจัดกลุ่มตั๋วตาม **`onsiteDate`** (ไม่ใช่ Due Date)
   * บนการ์ดตั๋ว Kanban จะแสดงทั้ง `Due:` และ `Onsite:` แยกกันชัดเจน
   * Modal Assign งาน จะ **Pre-fill** วันเข้า Onsite จากตั๋วที่มีอยู่ก่อนหน้าอัตโนมัติ

5. **[ใหม่] กระบวนการขอเปิดตั๋วจากช่าง (Staff Ticket Request Flow):**
   * ช่างกรอกฟอร์ม **"ขอเปิดตั๋ว"** ผ่าน iPad → ระบุหัวข้อ, โปรเจกต์, วันเข้า Onsite, วัน Due, วิธี Support
   * คำขอบันทึกลง `nis_pending_tickets` → แสดงในแท็บ **"📥 คำขอจาก Staff"** บน ServiceBoard
   * Service Manager กด **"อนุมัติ"** → ระบบแปลงเป็นตั๋วงานจริงพร้อมผูก `onsiteDate` อัตโนมัติ
   * Service Manager กด **"ปฏิเสธ"** → ลบคำขอออกจากคิว

6. **พอร์ทัลของช่างหน้างาน (iPad Air Staff Portal — `IpadOnsiteTest.jsx`):**
   * ช่าง Login ด้วยชื่อ → เข้าสู่ **Staff Dashboard** พร้อมกล่องสถิติ 6 ช่อง (กดได้เพื่อดูรายละเอียดใน Modal)
   * กล่องสถิติ: ตั๋วทั้งหมด / รอตอบรับ / กำลังดำเนินการ / เกินกำหนด / ปิดแล้ว / อุปกรณ์ค้างตัว
   * เลือกตั๋วงาน → กด **Accept รับงาน** → **Check-in** → กรอก Onsite Report → เซ็นลายเซ็นลูกค้า → **Preview PDF** → ส่ง Email ปิดงาน
   * Modal ทั้งหมด (PDF Preview, Email Confirm, Stats Detail) **แสดงผลภายในขอบเขตหน้าจอ iPad** (absolute positioning)
   * **ปฏิทินงาน** จัดตั๋วตาม `onsiteDate` แสดง Ticket ID + ชื่องาน + แถบสีบ่งชี้ความเร่งด่วน + Tooltip รายละเอียด

7. **การเคลมเปลี่ยนอุปกรณ์และแจ้งเตือนฝ่ายขาย (Warranty Claim Flow):**
   * หากพบอุปกรณ์ชำรุด ช่างเบิกจากคลัง NIS (หักลด Stock) → บันทึกประวัติเคลม → แจ้งเตือน Sales Manager

---

## 5. รายละเอียด `IpadOnsiteTest.jsx` (iPad Air Onsite Simulator)

หน้าที่ซับซ้อนที่สุดในระบบ จำลองการทำงานของช่างหน้างานบน iPad Air ประกอบด้วย:

### แท็บหลักใน iPad
| แท็บ | รายละเอียด |
|---|---|
| **งานของฉัน** | รายการตั๋วงานที่ได้รับมอบหมาย + ปฏิทินงาน Onsite |
| **ขอเปิดตั๋ว** | ฟอร์มขอเปิดตั๋วงานใหม่ พร้อม Onsite Date + วิธี Support |
| **คลัง NIS** | รายการอุปกรณ์สำรอง แบ่งตาม Category (Firewall/Switch/WiFi/CCTV/Lan&Cable/Server) |
| **โน้ตส่วนตัว** | บันทึกช่วยจำส่วนตัว + ตั้ง Reminder (datetime-local) |
| **กิจกรรม** | Log การทำงานของช่างในระบบ |

### State สำคัญใน `IpadOnsiteTest.jsx`
* `loggedInStaff` — ข้อมูลช่างที่ Login อยู่
* `selectedTicketId` — ตั๋วงานที่กำลังทำงานอยู่
* `checkInTime` / `checkOutTime` — เวลา Check-in/out หน้างาน
* `reqOnsiteDate` / `reqDue` — วันเข้า Onsite และ Due Date ในฟอร์มขอตั๋ว
* `showPdfPreview` / `showEmailModal` / `selectedStatKey` — ควบคุม Modal ต่างๆ (ทั้งหมด absolute ภายใน iPad screen)
* `nisStock` / `selectedCategory` — คลังสินค้าและ Filter หมวดหมู่
* `personalNotes` / `personalChecklists` — โน้ตและ Todo ส่วนตัว

### โครงสร้าง Modal (สำคัญมาก)
Modal ทั้งหมดใน `IpadOnsiteTest.jsx` ต้องวางไว้ **ภายใน** `<div className="ipad-screen">` และใช้ `position: 'absolute'` เสมอ (ไม่ใช่ `fixed`) เพื่อให้แสดงผลอยู่ภายในกรอบ iPad จำลอง

---

## 6. รายละเอียด `ServiceBoard.jsx` (Service Manager Board)

### แท็บหลักใน ServiceBoard
| แท็บ | รายละเอียด |
|---|---|
| **📋 Board** | Kanban columns: Open / In Progress / Review / Done |
| **📅 Assign** | มอบหมายงาน + กำหนดวันเข้า Onsite ให้ช่าง |
| **📆 Calendar** | ปฏิทินรายเดือน จัดตั๋วตาม `onsiteDate` |
| **📥 คำขอจาก Staff** | อนุมัติ/ปฏิเสธคำขอเปิดตั๋วจากช่าง + อนุมัติปิดตั๋ว |
| **👥 ทีม** | จัดการรายชื่อช่างเทคนิค |
| **⚙️ ตั้งค่า** | ตั้งค่าโปรเจกต์ สถานที่ ลูกค้า |

### State สำคัญใน `ServiceBoard.jsx`
* `projectsList` — รายการโครงการทั้งหมดพร้อมตั๋วงานฝัง (ดึงจาก `getProjects()`)
* `ticketsList` — ตั๋วงานทั้งหมด Flatten จาก projectsList (computed)
* `assignOnsiteDate` — วันเข้า Onsite ที่จะ Assign ให้ช่าง (Pre-filled จากตั๋วเดิม)
* `pendingRequests` — คำขอเปิดตั๋วจาก Staff (ดึงจาก `getPendingTickets()`)
* `newTicketForm` — ฟอร์มสร้างตั๋วใหม่ (มี `due` และ `onsiteDate` แยกกัน)

---

## 7. แนวทางปฏิบัติในการพัฒนา (Coding & UI Guidelines)

1. **เฟรมเวิร์กหลัก:**
   * ใช้ **React 19** แบบ Functional Components + Hooks
   * ใช้ระบบนำทางของ **React Router Dom v7** (nested route ผ่าน `DashboardLayout`)

2. **การจัดการสไตล์และการออกแบบ:**
   * ใช้ **Tailwind CSS v4** เป็นหลักในการจัดหน้ากระดาษ
   * ใช้ **Inline Styles** สำหรับ Modal, iPad Simulator และ UI ระดับ Component พิเศษ
   * ฟอนต์หลัก: **Prompt** (ภาษาไทย) และ **Kanit** (หัวข้อ/ตัวเลข) — โหลดจาก Google Fonts

3. **การจัดการ State:**
   * การเพิ่ม ลบ หรือแก้ไขข้อมูลต่างๆ **ต้องเขียนทับลง LocalStorage** ผ่าน helper functions ใน `src/mockDb.js`
   * หลีกเลี่ยงการเก็บ State เฉพาะใน Component หากต้องการใช้ข้ามหน้า

4. **กฎ Modal ใน iPad Simulator (`IpadOnsiteTest.jsx`):**
   * Modal ทุกตัวต้องวางในโครงสร้าง DOM ภายใน `.ipad-screen`
   * ใช้ `position: 'absolute'` เสมอ (ห้ามใช้ `fixed`)
   * z-index ลำดับ: Stats Modal (999999) → Email Modal (999999) → PDF Modal (1000000)

5. **Field `onsiteDate` ในตั๋วงาน:**
   * ต้อง Set ทุกครั้งที่ Create หรือ Assign ตั๋ว
   * ถ้าไม่มี ให้ Fallback เป็น `due` date: `t.onsiteDate || t.due`
   * ปฏิทินทั้งใน ServiceBoard และ iPad ใช้ `onsiteDate` เป็น Primary key สำหรับจัดกลุ่ม

6. **Git Workflow:**
   * Branch: `main` → Remote: `origin` (https://github.com/alert-nisolution/NIS-Service-ERP.git)
   * ทุกครั้งที่แก้ไขเสร็จ: `git add` → `git commit -m "feat/fix/style: ..."` → `git push origin main`
   * Git user: `atichat-tech` / `atichat@nisolution.co.th`
