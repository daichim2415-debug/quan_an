// ================== IMPORT ==================
const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

// ================== APP ==================
const app = express();
const PORT = process.env.PORT || 3000;

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================== ROUTE TEST (QUAN TRỌNG) ==================
app.get("/", (req, res) => {
  res.send("✅ Quan an app is running on Render!");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// ================== TẠO THƯ MỤC UPLOAD (RENDER KHÔNG TỰ CÓ) ==================
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================== MULTER UPLOAD ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ================== MYSQL (KHÔNG LÀM CHẾT APP) ==================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "ban_quan_db"
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL chưa kết nối (Render không có localhost):", err.message);
  } else {
    console.log("✅ MySQL connected");
  }
});

// ================== API ==================

// ----- MÓN ĂN -----
app.get("/api/mon-an", (req, res) => {
  db.query("SELECT * FROM san_pham ORDER BY id DESC", (err, rs) => {
    if (err) return res.status(500).json(err);
    res.json(rs);
  });
});

app.post("/api/mon-an", upload.single("hinh_anh"), (req, res) => {
  const { ten_mon, gia, mo_ta } = req.body;
  const hinh_anh = req.file ? "/uploads/" + req.file.filename : "";

  const sql =
    "INSERT INTO san_pham (ten_mon, gia, mo_ta, hinh_anh) VALUES (?, ?, ?, ?)";
  db.query(sql, [ten_mon, gia, mo_ta, hinh_anh], err => {
    if (err) return res.status(500).send("Lỗi thêm món");
    res.send("Thêm thành công");
  });
});

app.put("/api/mon-an/:id", upload.single("hinh_anh"), (req, res) => {
  const { ten_mon, gia, mo_ta, hinh_anh_cu } = req.body;
  const hinh_anh = req.file ? "/uploads/" + req.file.filename : hinh_anh_cu;

  const sql =
    "UPDATE san_pham SET ten_mon=?, gia=?, mo_ta=?, hinh_anh=? WHERE id=?";
  db.query(sql, [ten_mon, gia, mo_ta, hinh_anh, req.params.id], err => {
    if (err) return res.status(500).send("Lỗi sửa món");
    res.send("Sửa thành công");
  });
});

app.delete("/api/mon-an/:id", (req, res) => {
  db.query("DELETE FROM san_pham WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).send("Lỗi xóa");
    res.send("Đã xóa");
  });
});

// ----- USER -----
app.post("/api/register", (req, res) => {
  const { fullname, username, password } = req.body;

  db.query(
    "SELECT id FROM users WHERE username=?",
    [username],
    (err, rs) => {
      if (rs && rs.length > 0)
        return res.status(400).json({ error: "Username tồn tại" });

      db.query(
        "INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)",
        [fullname, username, password],
        err2 => {
          if (err2) return res.status(500).json({ error: "Lỗi đăng ký" });
          res.json({ message: "Đăng ký thành công" });
        }
      );
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, rs) => {
      if (err) return res.status(500).json({ error: "Server lỗi" });
      if (rs.length === 0)
        return res.status(401).json({ message: "Sai tài khoản" });

      const user = rs[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          fullname: user.fullname,
          role: user.role,
          username: user.username
        }
      });
    }
  );
});

// ----- ĐƠN HÀNG -----
app.post("/api/dat-hang", (req, res) => {
  const {
    khach_hang,
    so_dien_thoai,
    dia_chi,
    tong_tien,
    chi_tiet,
    hinh_thuc_thanh_toan
  } = req.body;

  const sql =
    "INSERT INTO don_hang (khach_hang, so_dien_thoai, dia_chi, tong_tien, chi_tiet, hinh_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      khach_hang,
      so_dien_thoai,
      dia_chi,
      tong_tien,
      JSON.stringify(chi_tiet),
      hinh_thuc_thanh_toan
    ],
    err => {
      if (err) return res.status(500).send("Lỗi đặt hàng");
      res.send("Đặt hàng thành công");
    }
  );
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
