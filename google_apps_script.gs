// Google Apps Script for pdhtime
// - ใส่โค้ดนี้ใน Google Apps Script Editor
// - แทนที่ 'YOUR_SHEET_ID' ด้วย ID ของ Google Spreadsheet ของคุณ

function doPost(e) {
  try {
    var content = e.postData.contents;
    var data = JSON.parse(content);

    var ss = SpreadsheetApp.openById('YOUR_SHEET_ID'); // << เปลี่ยนตรงนี้
    var users = ss.getSheetByName('users') || ss.insertSheet('users');
    var logs = ss.getSheetByName('logs') || ss.insertSheet('logs');

    if (data.requestType === 'register') {
      users.appendRow([
        new Date(),
        data.idCard || '',
        data.name || '',
        data.position || '',
        data.department || '',
        data.username || ''
      ]);
      return jsonResponse({ status: 'success', message: 'ลงทะเบียนเรียบร้อย' });
    }

    if (data.requestType === 'checkin') {
      var photoUrl = '';
      if (data.photo && data.photo.indexOf('data:') === 0) {
        try {
          var base64 = data.photo.split(',')[1];
          var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', (data.empId || 'photo') + '_' + new Date().getTime() + '.jpg');
          var folderName = 'pdhtime-photos';
          var folders = DriveApp.getFoldersByName(folderName);
          var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
          var file = folder.createFile(blob);
          photoUrl = file.getUrl();
        } catch (err) {
          // หากบันทึกรูปไม่สำเร็จ ให้บันทึกเป็นค่าว่างแทน
          photoUrl = '';
        }
      }

      logs.appendRow([
        new Date(),
        data.empId || '',
        data.name || '',
        data.action || '',
        data.lat || '',
        data.lng || '',
        data.distance || '',
        photoUrl
      ]);

      return jsonResponse({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อย' });
    }

    return jsonResponse({ status: 'error', message: 'requestType ไม่ถูกต้อง' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Optional: doGet สำหรับทดสอบด้วยเบราว์เซอร์
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'pdhtime Apps Script ready' })).setMimeType(ContentService.MimeType.JSON);
}
