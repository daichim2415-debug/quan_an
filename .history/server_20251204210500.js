const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'ban_quan_db'
});

db.connect(err => {
    if (err) console.log('Lỗi DB: ' + err);
    else console.log('Đã kết nối MySQL!');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- API ADMIN ---

// 1. Đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
        if (results.length > 0) res.json({ success: true, message: "Login OK" });
        else res.json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
    });
});

// 2. Lấy danh sách đơn hàng (Mới nhất lên đầu)
app.get('/api/orders', (req, res) => {
    db.query("SELECT * FROM don_hang ORDER BY ngay_dat DESC", (err, results) => {
        res.json(results);
    });
});

// 3. Cập nhật trạng thái đơn (Duyệt đơn/Hủy đơn)
app.post('/api/orders/update', (req, res) => {
    const { id, status } = req.body;
    db.query("UPDATE don_hang SET status = ? WHERE id = ?", [status, id], (err, result) => {
        res.json({ message: "Đã cập nhật trạng thái!" });
    });
});

// 4. Xóa món ăn
app.delete('/api/products/:id', (req, res) => {
    db.query("DELETE FROM san_pham WHERE id = ?", [req.params.id], (err, result) => {
        res.json({ message: "Đã xóa món ăn!" });
    });
});

// --- API CHUNG ---

app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM san_pham";
    db.query(sql, (err, results) => res.json(results));
});

app.post('/api/products', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia, mo_ta } = req.body;
    const hinh_anh = '/uploads/' + req.file.filename;
    const sql = "INSERT INTO san_pham (ten_mon, gia, hinh_anh, mo_ta) VALUES (?, ?, ?, ?)";
    db.query(sql, [ten_mon, gia, hinh_anh, mo_ta], (err, result) => res.json({ message: "Thêm thành công!" }));
});

app.post('/api/orders', (req, res) => {
    const { ten_khach, tong_tien, noi_dung } = req.body;
    const sql = "INSERT INTO don_hang (ten_khach, tong_tien, noi_dung_don) VALUES (?, ?, ?)";
    db.query(sql, [ten_khach, tong_tien, noi_dung], (err, result) => res.json({ message: "OK" }));
});

app.listen(3000, () => console.log('Server Pro running at port 3000'));