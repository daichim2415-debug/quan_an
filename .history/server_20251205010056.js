const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = 3000;

// Cấu hình thư viện
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 1. KẾT NỐI DATABASE (Khớp với ảnh phpMyAdmin của bạn)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',        // XAMPP mặc định không có pass
    database: 'ban_quan_db'
});

db.connect(err => {
    if (err) {
        console.error('❌ Lỗi kết nối MySQL:', err);
    } else {
        console.log('✅ Đã kết nối MySQL thành công!');
    }
});

// 2. CẤU HÌNH UPLOAD ẢNH
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- CÁC API QUAN TRỌNG ---

// API lấy danh sách món (Frontend đang gọi cái này)
app.get('/api/mon-an', (req, res) => {
    const sql = "SELECT * FROM san_pham ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Lỗi SQL:", err); // Hiện lỗi ra Terminal để dễ sửa
            return res.status(500).json({ error: "Lỗi Server" });
        }
        res.json(results);
    });
});

// API Thêm món mới
app.post('/api/them-mon', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia, mo_ta } = req.body;
    const hinh_anh = req.file ? `/uploads/${req.file.filename}` : '';
    
    const sql = "INSERT INTO san_pham (ten_mon, gia, mo_ta, hinh_anh) VALUES (?, ?, ?, ?)";
    db.query(sql, [ten_mon, gia, mo_ta, hinh_anh], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Thêm thành công');
    });
});

// Chạy server
app.listen(port, () => {
    console.log(`Server đang chạy tại: http://localhost:${port}`);
});