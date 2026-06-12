// Google Apps Script for pdhtime
// - ใส่โค้ดนี้ใน Google Apps Script Editor
// - แทนที่ 'YOUR_SHEET_ID' ด้วย ID ของ Google Spreadsheet ของคุณ

function doPost(e) {
  try {
    var content = (e.postData && e.postData.contents) || '';
    var contentType = (e.postData && e.postData.type) || '';
    var data = {};

    // Log incoming data for debugging
    Logger.log('Content-Type: ' + contentType);
    Logger.log('Raw content: ' + content);

    if (contentType.indexOf('application/json') !== -1) {
      data = JSON.parse(content);
    } else if (contentType.indexOf('application/x-www-form-urlencoded') !== -1 || content.indexOf('payload=') === 0) {
      var params = {};
      content.split('&').forEach(function(pair) {
        var kv = pair.split('=');
        var k = decodeURIComponent(kv[0] || '');
        var v = decodeURIComponent(kv[1] || '');
        params[k] = v;
      });
      Logger.log('Parsed params: ' + JSON.stringify(params));
      if (params.payload) {
        data = JSON.parse(params.payload);
      } else {
        data = params;
      }
    } else {
      try { data = JSON.parse(content); } catch (err) { data = {}; }
    }

    Logger.log('Parsed data: ' + JSON.stringify(data));

    var ss = SpreadsheetApp.openById('YOUR_SHEET_ID'); // << เปลี่ยนตรงนี้
    var users = ss.getSheetByName('users') || ss.getSheetByName('Users') || ss.insertSheet('users');
    var logs = ss.getSheetByName('logs') || ss.getSheetByName('Logs') || ss.insertSheet('logs');

    if (data.requestType === 'register') {
      Logger.log('Processing register request');
      users.appendRow([
        new Date(),
        data.idCard || '',
        data.name || '',
        data.position || '',
        data.department || '',
        data.username || '',
        data.password || ''
      ]);
      Logger.log('Registered user: ' + data.idCard);
      return jsonResponse({ status: 'success', message: 'ลงทะเบียนเรียบร้อย' });
    }

    if (data.requestType === 'login') {
      Logger.log('Processing login request');
      var userValues = users.getDataRange().getValues();
      // แถวที่ 1 คือ Header ให้เริ่มค้นหาตั้งแต่แถวที่ 2
      for (var i = 1; i < userValues.length; i++) {
        var row = userValues[i];
        var sheetUser = String(row[5] || '').trim(); // Username อยู่คอลัมน์ F (index 5)
        var sheetPass = String(row[6] || '').trim(); // Password อยู่คอลัมน์ G (index 6)
        
        if (sheetUser === String(data.username || '').trim() && sheetPass === String(data.password || '').trim()) {
          return jsonResponse({
            status: 'success',
            message: 'เข้าสู่ระบบสำเร็จ',
            userData: {
              idCard: row[1],
              name: row[2],
              position: row[3],
              department: row[4],
              username: row[5]
            }
          });
        }
      }
      return jsonResponse({ status: 'error', message: 'Username หรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (data.requestType === 'checkin') {
      Logger.log('Processing checkin request');
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
  var response = ContentService.createTextOutput(JSON.stringify(obj));
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}

// Handle OPTIONS preflight requests
function doOptions(e) {
  var output = ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT_PLAIN);
  return output;
}

// Optional: doGet สำหรับทดสอบด้วยเบราว์เซอร์
function doGet(e) {
  var response = ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'pdhtime Apps Script ready' }));
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}
