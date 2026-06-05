// --- ตั้งค่าระบบ ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyxwG1-WHwGFNWC3sWia7GYSCgGC43hxDY_fFkWhNZtSYEdFH1URBVGYPZTQOr_1JNzrg/exec';
const HOSPITAL_LAT = 12.9699764; // แก้ไขเป็นพิกัดโรงพยาบาลของคุณ
const HOSPITAL_LNG = 101.2189753; // แก้ไขเป็นพิกัดโรงพยาบาลของคุณ
const MAX_DISTANCE = 20; // ระยะที่อนุญาต (เมตร)

const video = document.getElementById('camera-preview');
const canvas = document.getElementById('canvas');
const statusText = document.getElementById('status-text');
const btnCheckIn = document.getElementById('btn-checkin');
const btnCheckOut = document.getElementById('btn-checkout');

let userLat, userLng, currentDistance;

// 1. เปิดกล้องมือถือ
navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { alert("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง"); });

// 2. ตรวจสอบพิกัด GPS
navigator.geolocation.getCurrentPosition(position => {
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;
    currentDistance = calculateDistance(HOSPITAL_LAT, HOSPITAL_LNG, userLat, userLng);
    
    if (currentDistance <= MAX_DISTANCE) {
        statusText.innerHTML = `<span class="text-success">พิกัดถูกต้อง (ห่าง ${currentDistance.toFixed(0)} เมตร)</span>`;
        btnCheckIn.disabled = false;
        btnCheckOut.disabled = false;
    } else {
        statusText.innerHTML = `<span class="text-danger">อยู่นอกพื้นที่โรงพยาบาล (ห่าง ${currentDistance.toFixed(0)} เมตร)</span>`;
    }
}, error => {
    statusText.innerHTML = `<span class="text-danger">ไม่สามารถดึงพิกัด GPS ได้</span>`;
});

// สูตรคำนวณระยะทาง Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // รัศมีโลก (เมตร)
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// 3. ฟังก์ชันถ่ายรูปและส่งข้อมูล
function recordTime(actionType) {
    const empId = document.getElementById('empId').value;
    const name = document.getElementById('empName').value;

    if(!empId || !name) {
        alert("กรุณาระบุรหัสและชื่อเจ้าหน้าที่");
        return;
    }

    // ถ่ายรูป
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.5); // บีบอัดภาพ 50%

    // ปิดปุ่มระหว่างส่งข้อมูล
    btnCheckIn.disabled = true;
    btnCheckOut.disabled = true;
    statusText.innerHTML = '<span class="text-primary">กำลังบันทึกข้อมูล...</span>';

    // ส่งข้อมูลผ่าน AJAX (Fetch)
    const payload = {
        empId: empId,
        name: name,
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
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        statusText.innerHTML = '<span class="text-success">บันทึกเรียบร้อย</span>';
        setTimeout(() => location.reload(), 2000); // รีเฟรชหน้า
    })
    .catch(error => {
        console.error('Error:', error);
        alert("เกิดข้อผิดพลาดในการบันทึก");
        btnCheckIn.disabled = false;
        btnCheckOut.disabled = false;
    });
}

// ผูก Event กับปุ่ม
btnCheckIn.addEventListener('click', () => recordTime('Check-In'));
btnCheckOut.addEventListener('click', () => recordTime('Check-Out'));
