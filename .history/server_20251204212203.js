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

// Kết nối DB
const db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'ban_quan_db'
});
db.connect(err => console.log(err ? 'Lỗi DB: ' + err : 'Đã kết nối MySQL PRO!'));

// Cấu hình Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// === API AUTH (Xác thực) ===
app.post('/api/register', (req, res) => {
    const { full_name, username, password, phone, address } = req.body;
    // Kiểm tra trùng username
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
        if(result.length > 0) return res.json({success: false, message: 'Tài khoản đã tồn tại!'});
        
        const sql = "INSERT INTO users (full_name, username, password, phone, address) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [full_name, username, password, phone, address], (err) => {
            if(err) return res.json({success: false, message: 'Lỗi đăng ký'});
            res.json({success: true, message: 'Đăng ký thành công! Hãy đăng nhập.'});
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
        if (results.length > 0) {
            const user = results[0];
            res.json({ success: true, user: { id: user.id, name: user.full_name, role: user.role, phone: user.phone, address: user.address } });
        } else {
            res.json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
        }
    });
});

// === API SẢN PHẨM & DANH MỤC ===
app.get('/api/categories', (req, res) => {
    db.query("SELECT * FROM categories", (err, data) => res.json(data));
});

app.get('/api/products', (req, res) => {
    const catId = req.query.cat_id;
    let sql = "SELECT * FROM products WHERE is_active = 1";
    if(catId) sql += " AND category_id = " + db.escape(catId);
    db.query(sql, (err, data) => res.json(data));
});

app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, price, description, category_id } = req.body;
    const image = '/uploads/' + req.file.filename;
    const sql = "INSERT INTO products (name, price, image, description, category_id) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, price, image, description, category_id], (err) => res.json({success: !err}));
});

app.delete('/api/products/:id', (req, res) => {
    db.query("UPDATE products SET is_active = 0 WHERE id = ?", [req.params.id], () => res.json({success: true}));
});

// === API ĐƠN HÀNG ===
app.post('/api/orders', (req, res) => {
    const { user_id, customer_name, phone, address, total_money, items } = req.body;
    const items_json = JSON.stringify(items);
    const sql = "INSERT INTO orders (user_id, customer_name, phone, address, total_money, items_json) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [user_id, customer_name, phone, address, total_money, items_json], (err) => {
        res.json({success: !err});
    });
});

// Lấy lịch sử đơn hàng của 1 user
app.get('/api/my-orders', (req, res) => {
    const userId = req.query.user_id;
    db.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, data) => res.json(data));
});

// Lấy toàn bộ đơn hàng (Cho Admin)
app.get('/api/all-orders', (req, res) => {
    db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, data) => res.json(data));
});

app.post('/api/order-status', (req, res) => {
    const { id, status } = req.body;
    db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id], () => res.json({success: true}));
});

app.listen(3000, () => console.log('Server Market-Ready running on port 3000'));