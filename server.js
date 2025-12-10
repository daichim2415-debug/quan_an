const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // Khai báo 1 lần duy nhất ở đây

const app = express();
app.get("/", (req, res) => {
  res.send("✅ Quan an app is running!");
});
const port = 3000;

// --- CẤU HÌNH CHUNG ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. CẤU HÌNH UPLOAD ẢNH (MULTER) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') // Ảnh sẽ lưu vào thư mục này
    },
    filename: function (req, file, cb) {
        // Đặt tên file chống trùng: thời gian + đuôi file
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// --- 2. KẾT NỐI DATABASE ---
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

// =============================================
// PHẦN API (CÁC CHỨC NĂNG)
// =============================================

// --- A. QUẢN LÝ MÓN ĂN ---

// Lấy danh sách món
app.get('/api/mon-an', (req, res) => {
    db.query("SELECT * FROM san_pham ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Thêm món mới (Có upload ảnh)
app.post('/api/mon-an', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia, mo_ta } = req.body;
    const hinh_anh = req.file ? '/uploads/' + req.file.filename : ''; // Lấy đường dẫn ảnh

    const sql = "INSERT INTO san_pham (ten_mon, gia, mo_ta, hinh_anh) VALUES (?, ?, ?, ?)";
    db.query(sql, [ten_mon, gia, mo_ta, hinh_anh], (err, result) => {
        if (err) return res.status(500).send('Lỗi thêm món');
        res.send('Thêm thành công');
    });
});

// Sửa món ăn (Có upload ảnh)
app.put('/api/mon-an/:id', upload.single('hinh_anh'), (req, res) => {
    const { ten_mon, gia, mo_ta, hinh_anh_cu } = req.body;
    const { id } = req.params;
    
    // Nếu có ảnh mới thì dùng ảnh mới, không thì dùng ảnh cũ
    const hinh_anh = req.file ? '/uploads/' + req.file.filename : hinh_anh_cu;

    const sql = "UPDATE san_pham SET ten_mon=?, gia=?, mo_ta=?, hinh_anh=? WHERE id=?";
    db.query(sql, [ten_mon, gia, mo_ta, hinh_anh, id], (err, result) => {
        if (err) return res.status(500).send('Lỗi sửa món');
        res.send('Sửa thành công');
    });
});

// Xóa món ăn
app.delete('/api/mon-an/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM san_pham WHERE id=?", [id], (err, result) => {
        if (err) return res.status(500).send('Lỗi xóa món');
        res.send('Xóa thành công');
    });
});

// --- B. TÀI KHOẢN (USER) ---

// Đăng ký
app.post('/api/register', (req, res) => {
    const { fullname, username, password } = req.body;
    
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (results.length > 0) return res.status(400).json({ error: "Tên đăng nhập đã tồn tại!" });

        const sql = "INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)";
        db.query(sql, [fullname, username, password], (err, result) => {
            if (err) return res.status(500).json({ error: "Lỗi đăng ký" });
            res.json({ message: "Đăng ký thành công" });
        });
    });
});

// Đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi Server" });

        if (results.length > 0) {
            const user = results[0];
            const redirectUrl = user.role === 'admin' ? 'admin.html' : 'trang_chu.html';
            
            res.json({
                success: true,
                message: "Đăng nhập thành công!",
                redirect: redirectUrl,
                user: { 
                    id: user.id, 
                    fullname: user.fullname, 
                    role: user.role, 
                    username: user.username // Quan trọng để chia giỏ hàng
                }
            });
        } else {
            res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }
    });
});

// Lấy danh sách khách hàng
app.get('/api/users', (req, res) => {
    db.query("SELECT * FROM users ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Xóa khách hàng
app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send("Đã xóa khách hàng");
    });
});

// --- C. ĐƠN HÀNG (ORDER) ---

// Khách đặt hàng
app.post('/api/dat-hang', (req, res) => {
    const { khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet, hinh_thuc_thanh_toan } = req.body;
    const chi_tiet_json = JSON.stringify(chi_tiet);

    const sql = "INSERT INTO don_hang (khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet, hinh_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet_json, hinh_thuc_thanh_toan], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Lỗi đặt hàng');
        }
        res.send('Đặt hàng thành công');
    });
});

// Admin lấy danh sách đơn
app.get('/api/don-hang', (req, res) => {
    db.query("SELECT * FROM don_hang ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Admin cập nhật trạng thái đơn
app.post('/api/don-hang/update', (req, res) => {
    const { id, trang_thai } = req.body;
    const sql = "UPDATE don_hang SET trang_thai = ? WHERE id = ?";
    db.query(sql, [trang_thai, id], (err, result) => {
        if (err) return res.status(500).send('Lỗi cập nhật');
        res.send('Cập nhật thành công');
    });
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});