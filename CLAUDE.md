# โครงสร้างระบบและการพัฒนา (NIS Service ERP System)

ไฟล์นี้สรุปสถาปัตยกรรม โครงสร้างโค้ด แบบจำลองข้อมูล (Schemas) และแนวทางการพัฒนาของระบบ **NIS Service ERP** สำหรับนำไปใช้เป็นบริบทอ้างอิงร่วมกับ **Claude Code** หรือเครื่องมือ AI Agent อื่นๆ ได้ทันที

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
├── index.html                 # หน้าหลักเว็บแอปพลิเคชัน (โหลด Google Fonts: Prompt)
├── src
│   ├── main.jsx               # จุดเริ่มต้นของแอปพลิเคชัน (React Root render)
│   ├── App.jsx                # กำหนดเส้นทาง URL (React Router v7 Route Mapping)
│   ├── index.css              # สไตล์ส่วนกลาง โทนสี และ CSS Animations (เช่น .animate-pulse-ping)
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
│       ├── TicketDetail.jsx   # รายละเอียดและขั้นตอนการดำเนินการตั๋วงาน (มีระบบตรวจพิกัดและเซ็นชื่อรับงาน)
│       ├── ServiceBoard.jsx   # บอร์ดบริการแบบคอลัมน์ Kanban (Drag & Drop สำหรับสถานะตั๋วงาน)
│       ├── ServiceTeam.jsx    # รายชื่อทีมวิศวกร ทักษะ และภาระงานปัจจุบัน
│       ├── SalesTeam.jsx      # รายชื่อทีมขาย เป้ายอดขาย และข้อมูลการทำยอดปัจจุบัน
│       ├── ClaimsPortal.jsx   # ระบบติดตามและจัดการการเคลมสินค้าประกันอุปกรณ์
│       ├── StaffPortal.jsx    # หน้าหลักสำหรับวิศวกรภาคสนามเพื่ออัปเดตงานและขอเบิกอุปกรณ์เคลม
│       ├── IpadOnsiteTest.jsx # แอปจำลองหน้าจอ iPad สำหรับกรอกฟอร์มบริการหน้างานแบบออฟไลน์
│       └── SystemConfig.jsx   # ตัวเลือกสำหรับตั้งค่าระบบและปุ่มล้างข้อมูล/เริ่มระบบใหม่ (Reset DB)
```

---

## 3. สถาปัตยกรรมข้อมูลและฐานข้อมูลจำลอง (`mockDb.js`)

ระบบนี้ไม่มี Backend หรือฐานข้อมูล SQL/NoSQL ภายนอก ข้อมูลทั้งหมดจะถูกจัดการผ่าน `localStorage` ในเบราว์เซอร์ โดยมีข้อมูลตั้งต้นและ Helpers สำหรับอ่าน-เขียนข้อมูลดังนี้:

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
      { "id": 1, "name": "FortiGate 100F Next-Gen Firewall", "sku": "FG-100F", "qty": 1, "price": 580000, "warranty": "3 ปี (Vendor)", "type": "Hardware" }
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
* โครงสร้าง:
  * ในระดับ Project จะเก็บรายการตั๋วงานย่อย (`tickets`) แบบฝังในตัวเอง (Embedded Array) เพื่อให้การติดตามทำได้ง่าย
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
        "status": "Open | Assigned | Confirmed | Checkin | Working | Completed | Pending",
        "assignee": "Krit P.",
        "due": "2023-10-30",
        "pct": 70,
        "ticketType": "Install | MA | PM",
        "accepted": true,
        "checkinTime": "2026-06-25 09:30",
        "checkoutTime": "",
        "logs": [
          { "time": "2023-10-25 10:00", "note": "ระบบเริ่มรัน", "author": "System" }
        ]
      }
    ]
  }
  ```

#### อุปกรณ์ในคลังและงานเคลม (Stock & Warranty Claims)
* คลังสำรองสำหรับเปลี่ยนอุปกรณ์: `nis_stock` (ตัวแปรเก็บอุปกรณ์สำรองของสำนักงานสำหรับเปลี่ยนทดแทนให้ลูกค้าเมื่อเกิดปัญหา)
* ข้อมูลการเคลมประกัน: `nis_claims` & แจ้งเตือนฝ่ายขาย: `nis_claims_notifications`

---

### 3.2. ฟังก์ชันอำนวยความสะดวกใน `mockDb.js`

ตัวอย่าง API จำลองที่สามารถนำไปอิมพอร์ตเพื่อจัดการข้อมูลในหน้าต่างๆ:
* `getQuotations()` / `saveQuotations(data)` / `addQuotation(q)`
* `getSalesOrders()` / `saveSalesOrders(data)` / `addSalesOrder(so)`
* `getProjects()` / `saveProjects(data)` / `addProject(p)`
* `getNisStock()` / `saveNisStock(data)`
* `getServiceReports()` / `addServiceReport(report)` / `getNextServiceReportNumber()`
* `getClaims()` / `addClaim(claim)` / `getNextClaimNumber()`
* `getClaimNotifications()` / `addClaimNotification(notif)`
* `resetDb()` (รีเซ็ตกลับเป็นค่า Default ทั้งหมด)

---

## 4. โฟลว์การทำงานของระบบ (System Workflow)

ระบบถูกออกแบบมาให้จำลองลูปธุรกิจแบบ End-to-End ของการขายและการบริการหลังการขายด้านไอที:

1. **ฝ่ายขายสร้างใบเสนอราคา (Quotation Flow):**
   * สร้างเอกสารเสนอราคาในหน้า `QuotationDetail` -> สถานะเป็น `Draft` -> เมื่อยืนยันเปลี่ยนเป็น `Approved`
2. **สร้างใบสั่งขาย (Sales Order Flow):**
   * ใบเสนอราคาที่อนุมัติแล้วจะสามารถแปลงเป็น `Sales Order` ได้ทางหน้า `SalesOrders` เพื่ออ้างอิง PO ของลูกค้า
3. **เปิดโครงการและสร้างงานช่าง (Project & Ticket Flow):**
   * ที่หน้า `NewProject` หรือแปลงจาก Sales Order ระบบจะให้เพิ่มโครงการพร้อมกับฝังรายการตั๋วงานย่อย (Tickets) ให้ระบุวิศวกรผู้รับผิดชอบ (`assignee`)
4. **พอร์ทัลของช่างหน้างาน (Field Technical Flow - `StaffPortal` & `TicketDetail`):**
   * วิศวกรเข้าทางหน้า `StaffPortal` เพื่อดูตั๋วงานที่ได้รับมอบหมาย
   * กด **"ยอมรับงาน (Confirm)"** -> เดินทางถึงกด **"Check-in หน้างาน"** (บันทึกพิกัดจำลอง) -> ลงมือดำเนินการอัปเดตความคืบหน้า (%)
   * เมื่อเสร็จงาน กดบันทึกเพื่อนำสู่หน้าจอ **"ลูกค้าลงนาม (Customer Sign)"** ผ่านลายเซ็นอิเล็กทรอนิกส์ (Signature Canvas)
   * ระบบสร้าง **Service Report (SR)** เพื่อส่งผลลัพธ์กลับไปยังคลังข้อมูลกลางโดยอัตโนมัติ
5. **การเคลมเปลี่ยนเครื่องสำรองและส่งแจ้งเตือนฝ่ายขาย (Warranty Claim Flow):**
   * หากวิศวกรตรวจสอบพบอุปกรณ์ชำรุด สามารถกดเบิกอุปกรณ์เคลมจากคลังกลาง (หักลดจำนวน Stock และจับคู่หมายเลขเครื่องตัวสำรอง)
   * ระบบบันทึกประวัติการเคลมและแจ้งเตือนกลับไปยังใบประเมินของฝ่ายขาย (`Sales Manager` / `Project Manager`) ผ่านกล่องข้อความแจ้งเตือนที่แถบเลย์เอาต์หลัก เพื่อวางแผนเคลมซัพพลายเออร์ต่อไป

---

## 5. แนวทางปฏิบัติในการพัฒนา (Coding & UI Guidelines สำหรับ Claude Code)

1. **เฟรมเวิร์กหลัก:**
   * ใช้ **React 19** แบบ Functional Components
   * ใช้ระบบนำทางของ **React Router Dom v7** (ใน `src/App.jsx` โครงสร้างเป็นแบบ nested route ที่ผ่าน `DashboardLayout` ทั้งหมด)
2. **การจัดการสไตล์และการออกแบบ:**
   * ใช้ **Tailwind CSS v4** เป็นหลักในการจัดหน้ากระดาษ
   * ใช้ Inline Styles ผสมผสานในการกำหนดสีเฉพาะหรือกล่องแผงโมดัลแบบโต้ตอบ (Interactive Modals) เพื่อความยืดหยุ่นในการจัดทำ UI ระดับพรีเมียม
   * หลีกเลี่ยงหน้าว่าง/ตัวหนังสือเปล่า: เมื่อออกแบบสถานะรอดำเนินการให้ใช้ Skeleton Loader หรือข้อความที่เป็นมิตรพร้อมรูปภาพหรือไอคอนประกอบ
3. **การจัดการ State:**
   * การเพิ่ม ลบ หรือแก้ไขข้อมูลต่างๆ **ต้องเขียนทับลง LocalStorage** ผ่าน helper functions ที่จัดไว้ใน `src/mockDb.js`
   * หลีกเลี่ยงการจำลอง State เก็บไว้เฉพาะใน Component หากต้องการใช้ข้ามหน้า ให้ดึงหรือบันทึกผ่าน `mockDb.js` ทุกครั้ง เพื่อไม่ให้ข้อมูลสูญหายเมื่อเบราว์เซอร์รีเฟรชหน้าเว็บ
4. **ฟอนต์และไอคอน:**
   * ฟอนต์หลักของโปรเจกต์คือ **Prompt** (รองรับภาษาไทย) กำหนดไว้ใน `index.css`
   * ไอคอนในแถบนำทางและแดชบอร์ดเกือบทั้งหมดใช้ SVG แบบฝังโค้ด (Inline SVG) หรือใช้ `lucide-react` ในจุดที่มีองค์ประกอบซับซ้อน
