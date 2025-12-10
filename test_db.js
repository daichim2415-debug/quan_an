// test_db.js
const mysql = require('mysql2');

// Cấu hình y hệt server.js
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ban_quan_db' 
});

console.log('--- BẮT ĐẦU TEST KẾT NỐI ---');

connection.connect(err => {
  if (err) {
    console.error('❌ Lỗi kết nối: ' + err.stack);
    return;
  }
  console.log('✅ Kết nối thành công tới Database: ban_quan_db');
  
  // Thử lấy dữ liệu từ bảng san_pham
  connection.query('SELECT * FROM san_pham', (error, results) => {
    if (error) {
        console.error('❌ Lỗi lấy dữ liệu: ', error);
    } else {
        console.log('✅ Đã lấy được dữ liệu!');
        console.log('👉 Danh sách món ăn:', results);
    }
    connection.end();
  });
});