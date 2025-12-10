const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = 3000;
console.log("--- ĐANG CHẠY PHIÊN BẢN MỚI NHẤT ---");
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
// --- THÊM VÀO SERVER.JS (Phần xử lý Đơn hàng) ---

// API 1: Khách hàng GỬI đơn hàng (Lưu vào DB)
app.post('/api/dat-hang', (req, res) => {
    const { khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet } = req.body;
    
    // Chuyển mảng món ăn thành chuỗi JSON để lưu vào 1 ô cho gọn
    const chi_tiet_json = JSON.stringify(chi_tiet); 

    const sql = "INSERT INTO don_hang (khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet_json], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Lỗi đặt hàng');
        }
        res.send('Đặt hàng thành công');
    });
});

// API 2: Admin LẤY danh sách đơn hàng
app.get('/api/don-hang', (req, res) => {
    const sql = "SELECT * FROM don_hang ORDER BY id DESC"; // Đơn mới nhất lên đầu
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
// --- THÊM VÀO SERVER.JS (Phần xử lý Khách hàng / User) ---

// API 1: Đăng ký tài khoản mới (Từ trang register.html gửi lên)
app.post('/api/register', (req, res) => {
    const { fullname, username, password } = req.body;
    
    // Kiểm tra xem user đã tồn tại chưa
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Server" });
        if (results.length > 0) {
            return res.status(400).json({ error: "Tên đăng nhập đã tồn tại!" });
        }

        // Nếu chưa có thì thêm mới
        const sql = "INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)";
        db.query(sql, [fullname, username, password], (err, result) => {
            if (err) return res.status(500).json({ error: "Lỗi đăng ký" });
            res.json({ message: "Đăng ký thành công" });
        });
    });
});

// API 2: Lấy danh sách khách hàng (Cho trang Admin xem)
app.get('/api/users', (req, res) => {
    const sql = "SELECT * FROM users ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// API 3: Xóa khách hàng (Nếu Admin muốn xóa)
app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send("Đã xóa khách hàng");
    });
});
// --- API ĐĂNG NHẬP (Phân quyền Admin/Khách) ---
// --- SỬA LẠI API ĐĂNG NHẬP TRONG server.js ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Server" });

        if (results.length > 0) {
            const user = results[0];
            
            // Phân quyền
            let redirectUrl = user.role === 'admin' ? 'admin.html' : 'trang_chu.html';

            res.json({
                success: true,
                message: "Đăng nhập thành công!",
                redirect: redirectUrl,
                user: { 
                    id: user.id,
                    fullname: user.fullname,
                    role: user.role,
                    username: user.username // <--- QUAN TRỌNG: Phải thêm dòng này!
                }
            });
        } else {
            res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }
    });
});
// --- SỬA API ĐẶT HÀNG TRONG server.js ---
app.post('/api/dat-hang', (req, res) => {
    // 1. Nhận thêm biến hinh_thuc_thanh_toan từ Frontend gửi lên
    const { khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet, hinh_thuc_thanh_toan } = req.body;
    
    const chi_tiet_json = JSON.stringify(chi_tiet); 

    // 2. Cập nhật câu lệnh SQL
    const sql = "INSERT INTO don_hang (khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet, hinh_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, ?)";
    
    // 3. Thêm tham số vào mảng
    db.query(sql, [khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet_json, hinh_thuc_thanh_toan], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Lỗi đặt hàng');
        }
        res.send('Đặt hàng thành công');
    });
});
// --- THÊM VÀO CUỐI FILE server.js ---

// API Cập nhật trạng thái đơn hàng
app.post('/api/don-hang/update', (req, res) => {
    const { id, trang_thai } = req.body;
    
    const sql = "UPDATE don_hang SET trang_thai = ? WHERE id = ?";
    db.query(sql, [trang_thai, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Lỗi cập nhật');
        }
        res.send('Cập nhật thành công');
    });
});