การติดตั้งและ Deploy Google Apps Script สำหรับ pdhtime

1) สร้าง Google Spreadsheet ใหม่
   - ตั้งชื่อ เช่น `pdhtime-data`
   - คัดลอกส่วนของ URL และจด `SPREADSHEET_ID` (คือสตริงใน URL ระหว่าง `/d/` และ `/edit`)

2) เปิด Google Apps Script
   - เข้า `https://script.google.com/` และสร้างโปรเจคใหม่
   - ลบไฟล์ตัวอย่าง แล้วสร้างไฟล์ใหม่ ชื่อเช่น `Code.gs`
   - วางโค้ดจาก `google_apps_script.gs` (ไฟล์ใน repo) ลงไป
   - แทนที่ `'YOUR_SHEET_ID'` ในไฟล์ด้วย `SPREADSHEET_ID` ที่ได้จากข้อ (1)

3) ตรวจสอบสิทธิ์การเข้าถึง
   - ในเมนู `Deploy` → `New deployment`
   - เลือก `Web app`
   - `Description`: ใส่คำอธิบายสั้นๆ
   - `Execute as`: เลือก `Me` (เพื่อให้สคริปต์สามารถเขียนไฟล์ใน Drive ของเจ้าของได้)
   - `Who has access`: เลือก `Anyone` (หรือ `Anyone with Google account`) — หากต้องการให้เว็บแอปเรียกจากเบราว์เซอร์โดยไม่ต้อง auth
   - กด `Deploy` แล้วคัดลอก `Web app URL`

4) ตั้งค่าในโปรเจค `pdhtime` (ไฟล์หน้าเว็บ)
   - เปิดไฟล์ `register.html` และแทนที่ `const WEB_APP_URL = 'ใส่_URL_ของ_GOOGLE_APPS_SCRIPT_ที่นี่';` ด้วย URL ที่ได้จากการ Deploy
   - (ถ้าต้องการให้ `app.js` ใช้ URL เดียวกัน ให้ตรวจสอบ/แก้ไขค่าตัวแปร `WEB_APP_URL` ใน `app.js`)

5) ทดสอบด้วย curl (หรือ Postman)
   - ตัวอย่างการทดสอบลงทะเบียน:

```bash
curl -X POST "<WEB_APP_URL>" -H "Content-Type: application/json" -d '{"requestType":"register","idCard":"1234567890123","name":"สมชาย ใจดี","position":"พยาบาล","department":"OPD","username":"somchai","password":"pass"}'
```

   - ตัวอย่างการทดสอบเช็คอิน (photo เป็น dataURL จาก canvas ของเบราว์เซอร์):

```bash
curl -X POST "<WEB_APP_URL>" -H "Content-Type: application/json" -d '{"requestType":"checkin","empId":"1234567890123","name":"สมชาย ใจดี","action":"Check-In","lat":12.34,"lng":56.78,"distance":10,"photo":"data:image/jpeg;base64,..."}'
```

6) หมายเหตุการอนุญาต
   - การสร้างไฟล์รูปใน Drive ใช้ `DriveApp.createFolder()` และ `folder.createFile()` ซึ่งรันได้เมื่อ `Execute as: Me` (เจ้าของ) เท่านั้น
   - หากต้องการจำกัดการเข้าถึงให้ปลอดภัยขึ้น ให้ใช้งาน OAuth / Cloud Functions / Backend ที่มีการตรวจสอบสิทธิ์แทน

7) ถ้ามีปัญหา CORS หรือข้อผิดพลาดการเชื่อมต่อ
   - ตรวจสอบว่าได้ตั้ง `Who has access` เป็น `Anyone` และ deploy เป็นเวอร์ชันล่าสุด
   - ทดสอบเรียก `doGet` ผ่านเบราว์เซอร์เพื่อดูว่า Web App ตอบได้หรือไม่

8) ถ้าต้องการ ผมช่วย
   - แก้ไฟล์ `register.html` ให้ใส่ URL อัตโนมัติ (ต้องการ URL จากคุณ)
   - สร้าง Spreadsheet ตัวอย่างและ deploy สคริปต์ให้ (ต้องสิทธิ์ Google ของคุณ — ผมไม่สามารถ deploy ในนามคุณโดยตรง)
