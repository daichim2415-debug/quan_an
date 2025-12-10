const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // Thư viện upload ảnh
const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Để đọc dữ liệu JSON

// 1. CẤU HÌNH UPLOAD ẢNH (Multer)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Lưu vào thư mục public/uploads
        cb(null, 'public/uploads/') 
    },
    filename: function (req, file, cb) {
        // Đặt tên file = Thời gian hiện tại + Tên gốc (để tránh trùng)
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// 2. KẾT NỐI DATABASE
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ban_quan_db'
});

db.connect(err => {
    if (err) console.error('❌ Lỗi kết nối MySQL:', err);
    else console.log('✅ Đã kết nối MySQL thành công!');
});

// --- CÁC API ---

// API 1: Lấy danh sách món ăn
app.get('/api/mon-an', (req, res) => {
    db.query("SELECT * FROM san_pham ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API 2: THÊM MÓN ĂN MỚI (Có upload ảnh)
// upload.single('hinh_anh') nghĩa là lấy file từ input có name="hinh_anh"
app.post('/api/them-mon', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia, mo_ta } = req.body;
    
    // Nếu có file ảnh thì lấy đường dẫn, không thì để rỗng
    // Đường dẫn lưu vào DB sẽ là: /uploads/ten_file.jpg
    const hinh_anh = req.file ? `/uploads/${req.file.filename}` : '';

    const sql = "INSERT INTO san_pham (ten_mon, gia, mo_ta, hinh_anh) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [ten_mon, gia, mo_ta, hinh_anh], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Lỗi thêm dữ liệu');
        }
        res.status(200).send('Thêm thành công');
    });
});

// Khởi chạy server
app.listen(port, () => {
    console.log(`Server chạy tại http://localhost:${port}`);
});