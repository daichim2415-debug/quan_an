const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Cho phép truy cập file trong thư mục public

// 1. Cấu hình kết nối MySQL (XAMPP mặc định)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ban_quan_db'
});

db.connect(err => {
    if (err) console.log('Lỗi kết nối DB: ' + err);
    else console.log('Đã kết nối MySQL thành công!');
});

// 2. Cấu hình upload ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- CÁC API (Đường dẫn để Frontend gọi) ---

// API 1: Lấy danh sách món ăn
app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM san_pham";
    db.query(sql, (err, results) => {
        if (err) return res.json({ error: err });
        res.json(results);
    });
});

// API 2: Thêm món ăn (Dành cho Admin)
app.post('/api/products', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia, mo_ta } = req.body;
    const hinh_anh = '/uploads/' + req.file.filename; // Đường dẫn ảnh để lưu DB

    const sql = "INSERT INTO san_pham (ten_mon, gia, hinh_anh, mo_ta) VALUES (?, ?, ?, ?)";
    db.query(sql, [ten_mon, gia, hinh_anh, mo_ta], (err, result) => {
        if (err) return res.json({ error: err });
        res.json({ message: "Thêm món thành công!" });
    });
});

// API 3: Đặt hàng
app.post('/api/orders', (req, res) => {
    const { ten_khach, tong_tien, noi_dung } = req.body;
    const sql = "INSERT INTO don_hang (ten_khach, tong_tien, noi_dung_don) VALUES (?, ?, ?)";
    db.query(sql, [ten_khach, tong_tien, noi_dung], (err, result) => {
        if (err) return res.json({ error: err });
        res.json({ message: "Đặt hàng thành công!" });
    });
});

// Chạy server tại cổng 3000
app.listen(3000, () => {
    console.log('Server đang chạy tại http://localhost:3000');
});