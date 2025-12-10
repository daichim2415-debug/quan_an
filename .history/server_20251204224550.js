const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Cho phép truy cập folder public

// KẾT NỐI DATABASE
const db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'ban_quan_db'
});
db.connect(err => console.log(err ? 'Lỗi DB: ' + err : 'Đã kết nối MySQL!'));

// CẤU HÌNH UPLOAD ẢNH
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// ================= API USER (Đăng nhập/Đăng ký) =================
app.post('/api/register', (req, res) => {
    const { full_name, username, password, phone } = req.body;
    // Kiểm tra trùng user
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
        if(result.length > 0) return res.json({success: false, message: 'Tài khoản đã tồn tại'});
        
        const sql = "INSERT INTO users (full_name, username, password, phone, role) VALUES (?, ?, ?, ?, 'customer')";
        db.query(sql, [full_name, username, password, phone], (err) => {
            if(err) res.json({success: false, message: 'Lỗi server'});
            else res.json({success: true});
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, results) => {
        if(results.length > 0) {
            const u = results[0];
            res.json({success: true, user: {id:u.id, name:u.full_name, role:u.role, phone:u.phone}});
        } else {
            res.json({success: false, message: 'Sai tài khoản hoặc mật khẩu'});
        }
    });
});

// ================= API SẢN PHẨM =================
app.get('/api/products', (req, res) => {
    db.query("SELECT * FROM san_pham ORDER BY id DESC", (err, data) => res.json(data));
});

app.post('/api/products', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia } = req.body;
    const hinh = '/uploads/' + req.file.filename;
    db.query("INSERT INTO san_pham (ten_mon, gia, hinh_anh) VALUES (?, ?, ?)", [ten_mon, gia, hinh], 
        () => res.json({success: true}));
});

app.delete('/api/products/:id', (req, res) => {
    db.query("DELETE FROM san_pham WHERE id = ?", [req.params.id], () => res.json({success: true}));
});

// ================= API ĐƠN HÀNG =================
app.post('/api/orders', (req, res) => {
    const { user_id, customer_name, phone, address, total_money, items } = req.body;
    const items_json = JSON.stringify(items);
    
    const sql = "INSERT INTO don_hang (user_id, customer_name, phone, address, total_money, items_json, status) VALUES (?, ?, ?, ?, ?, ?, 'cho_duyet')";
    db.query(sql, [user_id, customer_name, phone, address, total_money, items_json], (err) => {
        if(err) console.log(err);
        res.json({success: !err});
    });
});

// Lấy lịch sử đơn hàng của 1 khách (Dùng cho profile.html)
app.get('/api/my-orders', (req, res) => {
    const userId = req.query.user_id;
    db.query("SELECT * FROM don_hang WHERE user_id = ? ORDER BY id DESC", [userId], (err, data) => res.json(data));
});

// Lấy tất cả đơn (Dùng cho Admin)
app.get('/api/all-orders', (req, res) => {
    db.query("SELECT * FROM don_hang ORDER BY id DESC", (err, data) => res.json(data));
});

// Cập nhật trạng thái đơn
app.post('/api/order-status', (req, res) => {
    const { id, status } = req.body;
    db.query("UPDATE don_hang SET status = ? WHERE id = ?", [status, id], () => res.json({success: true}));
});

app.listen(3000, () => console.log('Server Full Option đang chạy port 3000...'));