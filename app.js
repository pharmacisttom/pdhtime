
// --- 1. ตรวจสอบการ Login ทันที ---
const storedUser = localStorage.getItem('pdhtime_user');
let userData = null;

if (!storedUser) {
    window.location.href = 'login.html'; // เด้งไปหน้าล็อกอินถ้าไม่มี Session
} else {
    userData = JSON.parse(storedUser);
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem('pdhtime_user');
    window.location.href = 'login.html';
}

// --- 2. การตั้งค่าระบบ (แก้ URL และพิกัดตรงนี้) ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyxwG1-WHwGFNWC3sWia7GYSCgGC43hxDY_fFkWhNZtSYEdFH1URBVGYPZTQOr_1JNzrg/exec'; // << แก้ไขตรงนี้
const HOSPITAL_LAT = 12.9699764; // พิกัด รพ.ปลวกแดง
const HOSPITAL_LNG = 101.2189753;
const MAX_DISTANCE = 50; // รัศมี 50 เมตร

// ตัวแปรส่วน Global
let userLat = null;
let userLng = null;
let currentDistance = null;
let streamRef = null;

// รอให้ HTML โหลดเสร็จก่อนเริ่มทำงาน
document.addEventListener('DOMContentLoaded', async () => {
    // นำข้อมูลผู้ใช้มาแสดง
    document.getElementById('displayEmpId').innerText = userData.idCard;
    document.getElementById('displayEmpName').innerText = userData.name;

    const video = document.getElementById('camera-preview');
    const statusText = document.getElementById('status-text');
    const statusContainer = document.getElementById('status-container');
    const btnCheckIn = document.getElementById('btn-checkin');
    const btnCheckOut = document.getElementById('btn-checkout');

    // --- 3. ฟังก์ชันเปิดกล้อง (ปรับปรุงใหม่เพื่อลด Error) ---
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" }, // บังคับใช้กล้องหน้า
                audio: false 
            });
            video.srcObject = stream;
            streamRef = stream;
        } catch (err) {
            console.error("Camera Error: ", err);
            statusContainer.className = "alert alert-danger py-2 mb-3";
            statusText.innerText = "ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์";
        }
    }

    // --- 4. ฟังก์ชันจัดการ GPS ---
    function checkGPS() {
        if (!navigator.geolocation) {
            statusText.innerText = "อุปกรณ์ของคุณไม่รองรับ GPS";
            return;
        }

        navigator.geolocation.watchPosition(position => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
            currentDistance = calculateDistance(HOSPITAL_LAT, HOSPITAL_LNG, userLat, userLng);
            
            if (currentDistance <= MAX_DISTANCE) {
                statusContainer.className = "alert alert-success py-2 mb-3";
                statusText.innerHTML = `พิกัดถูกต้อง (ห่าง ${currentDistance.toFixed(0)} เมตร)`;
                btnCheckIn.disabled = false;
                btnCheckOut.disabled = false;
            } else {
                statusContainer.className = "alert alert-danger py-2 mb-3";
                statusText.innerHTML = `อยู่นอกพื้นที่ (ห่าง ${currentDistance.toFixed(0)} เมตร)`;
                btnCheckIn.disabled = true;
                btnCheckOut.disabled = true;
            }
        }, error => {
            console.error("GPS Error: ", error);
            statusContainer.className = "alert alert-danger py-2 mb-3";
            statusText.innerText = "ไม่สามารถค้นหาตำแหน่ง GPS ได้";
        }, {
            enableHighAccuracy: true, // บังคับใช้ GPS ความแม่นยำสูง
            timeout: 10000,
            maximumAge: 0
        });
    }

    // เริ่มทำงาน กล้อง และ GPS
    await startCamera();
    checkGPS();

    // --- 5. สูตรคำนวณระยะทาง ---
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const p1 = lat1 * Math.PI/180;
        const p2 = lat2 * Math.PI/180;
        const dp = (lat2-lat1) * Math.PI/180;
        const dl = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // --- 6. ฟังก์ชันถ่ายภาพและส่งข้อมูลเข้า Google Sheets ---
    function recordTime(actionType) {
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        
        // ถ่ายรูป
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // พลิกภาพกลับมาให้ถูกต้องก่อนบันทึก (เพราะเราทำ Mirror ไว้ใน CSS)
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoBase64 = canvas.toDataURL('image/jpeg', 0.6); // บีบอัดภาพ 60%

        // ล็อคปุ่ม
        btnCheckIn.disabled = true;
        btnCheckOut.disabled = true;
        statusContainer.className = "alert alert-primary py-2 mb-3";
        statusText.innerText = 'กำลังส่งข้อมูล...';

        const payload = {
            requestType: 'checkin',
            empId: userData.idCard,
            name: userData.name,
            action: actionType,
            lat: userLat,
            lng: userLng,
            distance: currentDistance,
            photo: photoBase64
        };

        fetch(WEB_APP_URL, { 
            method: 'POST', 
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status + ' ' + response.statusText);
            return response.json();
        })
        .then(data => {
            alert(data.message);
            statusContainer.className = "alert alert-success py-2 mb-3";
            statusText.innerText = 'บันทึกเรียบร้อย';
            setTimeout(() => location.reload(), 2000);
        })
        .catch(error => {
            console.error('Error:', error);
            alert("เกิดข้อผิดพลาดในการบันทึก");
            btnCheckIn.disabled = false;
            btnCheckOut.disabled = false;
            statusContainer.className = "alert alert-warning py-2 mb-3";
            statusText.innerText = 'ระบบพร้อมใช้งาน';
        });
    }

    // ผูก Event ปุ่มกด
    btnCheckIn.addEventListener('click', () => recordTime('Check-In'));
    btnCheckOut.addEventListener('click', () => recordTime('Check-Out'));
});
