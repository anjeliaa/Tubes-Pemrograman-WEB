const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - PERBAIKAN: Ditambah limit agar bisa menerima foto profil Base64 yang besar
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// Koneksi Database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_tubespweb'
});

/* ===============================
   API REGISTER
=============================== */
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    // Pilih bunny secara acak untuk user baru
    const randomNum = Math.floor(Math.random() * 4) + 1; // Menghasilkan 1-4
    const defaultAvatar = `../img/team${randomNum}.jpg`;
    
    try {
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ status: "error", message: "Email sudah terdaftar!" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        res.json({ status: "success", message: "Register berhasil! Silakan login." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan server saat mendaftar." });
    }
});

/* ===============================
   API LOGIN
=============================== */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ status: "error", message: "Email tidak ditemukan!" });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password) || password === user.password;
        if (!isMatch) {
            return res.status(401).json({ status: "error", message: "Password salah!" });
        }
        // Pastikan nama kolom 'is_banned' atau 'banned' sesuai database
        if (user.banned || user.is_banned) {
            return res.status(403).json({ status: "error", message: "Akses ditolak! Akun Anda dinonaktifkan Admin." });
        }
        delete user.password;
        res.json({ status: "success", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan server saat login." });
    }
});

/* ===============================
   API USER PROFILE - PERBAIKAN: Menambahkan rute yang hilang agar tidak 404
=============================== */
app.put('/api/user/profile', async (req, res) => {
    const { id, name, bio, city, country, region, preference, avatar } = req.body;
    try {
        await pool.execute(
            `UPDATE users 
             SET name = ?, bio = ?, city = ?, country = ?, region = ?, preference = ?, avatar = ?, is_profile_complete = 1 
             WHERE id = ?`,
            [name, bio, city, country, region, preference, avatar, id]
        );

        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        const updatedUser = rows[0];
        delete updatedUser.password;

        res.json({ status: "success", message: "Profil berhasil diperbarui!", user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal memperbarui profil." });
    }
});

/* ===============================
   API WISATA (DESTINATIONS)
=============================== */
// Mengambil Semua Data Wisata + Menghitung Rata-rata Rating secara Otomatis
app.get('/api/wisata', async (req, res) => {
    try {
        // Query ini akan menggabungkan tabel wisata dengan rata-rata rating dari tabel reviews
        const query = `
            SELECT w.*, 
            COALESCE(AVG(r.rating), 0) as rating 
            FROM wisata w 
            LEFT JOIN reviews r ON w.id = r.wisata_id 
            GROUP BY w.id 
            ORDER BY w.id DESC
        `;
        const [rows] = await pool.execute(query);
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil data wisata" });
    }
});

app.post('/api/wisata', async (req, res) => {
    const { nama, lokasi, kategori, deskripsi, image } = req.body;
    try {
        await pool.execute(
            'INSERT INTO wisata (nama, lokasi, kategori, deskripsi, gambar) VALUES (?, ?, ?, ?, ?)',
            [nama, lokasi, kategori, deskripsi, image]
        );
        res.json({ status: "success", message: "Data wisata berhasil ditambahkan ke Database!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal menambah data wisata" });
    }
});

// API Edit Wisata (BARU DITAMBAHKAN)
app.put('/api/wisata/:id', async (req, res) => {
    const { nama, lokasi, kategori, deskripsi, image } = req.body;
    try {
        await pool.execute(
            'UPDATE wisata SET nama=?, lokasi=?, kategori=?, deskripsi=?, gambar=? WHERE id=?',
            [nama, lokasi, kategori, deskripsi, image, req.params.id]
        );
        res.json({ status: "success", message: "Data wisata berhasil diperbarui!" });
    } catch (error) {
        console.error("Error saat edit wisata:", error);
        res.status(500).json({ status: "error", message: "Gagal memperbarui data wisata" });
    }
});


// API Hapus Wisata (DIPERBARUI: Hapus Beruntun / Bersih Sampai ke Akar)
app.delete('/api/wisata/:id', async (req, res) => {
    const wisataId = req.params.id;
    try {
        // 1. Hapus semua riwayat perjalanan (trips) yang terkait dengan wisata ini
        await pool.execute('DELETE FROM trips_history WHERE wisata_id = ?', [wisataId]);

        // 2. Hapus semua data favorit (wishlist) yang terkait dengan wisata ini
        await pool.execute('DELETE FROM favorites WHERE wisata_id = ?', [wisataId]);

        // 3. Hapus semua ulasan (reviews) yang terkait dengan wisata ini
        await pool.execute('DELETE FROM reviews WHERE wisata_id = ?', [wisataId]);

        // 4. Setelah semua "anak" datanya bersih, barulah kita hapus data induk wisatanya
        await pool.execute('DELETE FROM wisata WHERE id = ?', [wisataId]);

        res.json({ status: "success", message: "Data wisata dan semua riwayat terkait berhasil dihapus bersih!" });
    } catch (error) {
        console.error("Error saat hapus wisata:", error);
        res.status(500).json({ status: "error", message: "Gagal menghapus data wisata karena kesalahan server" });
    }
});

/* ===============================
   API FAVORITES (WISHLIST)
=============================== */
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT wisata_id FROM favorites WHERE user_id = ?', [req.params.userId]);
        const favIds = rows.map(r => r.wisata_id);
        res.json({ status: "success", data: favIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil data favorit." });
    }
});

app.post('/api/favorites/toggle', async (req, res) => {
    const { user_id, wisata_id } = req.body;
    try {
        const [exist] = await pool.execute('SELECT * FROM favorites WHERE user_id = ? AND wisata_id = ?', [user_id, wisata_id]);
        if (exist.length > 0) {
            await pool.execute('DELETE FROM favorites WHERE user_id = ? AND wisata_id = ?', [user_id, wisata_id]);
            res.json({ status: "success", action: "removed", message: "Dihapus dari favorit." });
        } else {
            await pool.execute('INSERT INTO favorites (user_id, wisata_id) VALUES (?, ?)', [user_id, wisata_id]);
            res.json({ status: "success", action: "added", message: "Berhasil ditambahkan ke favorit!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal memproses favorit." });
    }
});

/* ===============================
   API REVIEWS (ULASAN)
=============================== */
app.get('/api/reviews/:wisataId', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.name as user_name 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.wisata_id = ? 
            ORDER BY r.id DESC
        `;
        const [rows] = await pool.execute(query, [req.params.wisataId]);
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil ulasan." });
    }
});

app.post('/api/reviews', async (req, res) => {
    const { wisata_id, user_id, rating, komentar } = req.body;
    try {
        const query = `
            INSERT INTO reviews (wisata_id, user_id, rating, komentar) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            rating = VALUES(rating), 
            komentar = VALUES(komentar)
        `;
        await pool.execute(query, [wisata_id, user_id, rating, komentar]);
        res.json({ status: "success", message: "Ulasan berhasil disimpan/diperbarui!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal memproses ulasan." });
    }
});

/* ===============================
   API BLOGS (ARTIKEL)
=============================== */
// 1. Ambil semua blog
app.get('/api/blogs', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM blogs ORDER BY id DESC');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil data blog" });
    }
});

// 1.5 Ambil detail 1 blog berdasarkan ID (BARU DITAMBAHKAN)
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM blogs WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Artikel tidak ditemukan." });
        }
        res.json({ status: "success", data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil detail blog" });
    }
});

// 2. Tambah blog baru
app.post('/api/blogs', async (req, res) => {
    const { title, category, content, image } = req.body;
    try {
        await pool.execute(
            'INSERT INTO blogs (title, category, content, image) VALUES (?, ?, ?, ?)',
            [title, category, content, image]
        );
        res.json({ status: "success", message: "Blog berhasil ditambahkan!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal menambah blog" });
    }
});

// 3. Edit blog
app.put('/api/blogs/:id', async (req, res) => {
    const { title, category, content, image } = req.body;
    try {
        await pool.execute(
            'UPDATE blogs SET title=?, category=?, content=?, image=? WHERE id=?',
            [title, category, content, image, req.params.id]
        );
        res.json({ status: "success", message: "Blog berhasil diupdate!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengupdate blog" });
    }
});

// 4. Hapus blog
app.delete('/api/blogs/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM blogs WHERE id = ?', [req.params.id]);
        res.json({ status: "success", message: "Blog berhasil dihapus!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal menghapus blog" });
    }
});

/* ===============================
   API USER STATS (DASHBOARD)
=============================== */
// Mengambil Statistik User (Dashboard)
app.get('/api/user/stats/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // 1. Hitung jumlah favorit
        const [favResult] = await pool.execute('SELECT COUNT(*) as total FROM favorites WHERE user_id = ?', [userId]);
        const totalFavorites = favResult[0].total;

        // 2. Hitung jumlah ulasan
        const [revResult] = await pool.execute('SELECT COUNT(*) as total FROM reviews WHERE user_id = ?', [userId]);
        const totalReviews = revResult[0].total;

        // 3. Hitung jumlah Trips 
        const [tripResult] = await pool.execute('SELECT COUNT(*) as total FROM trips_history WHERE user_id = ?', [userId]);
        const totalTrips = tripResult[0].total; 

        res.json({
            status: "success",
            totalFavorites,
            totalReviews,
            totalTrips
        });
    } catch (error) {
        console.error("Gagal ambil stats:", error);
        res.status(500).json({ status: "error", message: "Gagal mengambil statistik user" });
    }
});

// ==========================================
// API UNTUK DASHBOARD ADMIN
// ==========================================
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Hitung semua baris dari masing-masing tabel
        const [wisataResult] = await pool.execute('SELECT COUNT(*) as total FROM wisata');
        const [userResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
        const [blogResult] = await pool.execute('SELECT COUNT(*) as total FROM blogs');
        const [reviewResult] = await pool.execute('SELECT COUNT(*) as total FROM reviews');

        // Ambil 3 data wisata terbaru untuk list di bawahnya
        const [recentWisata] = await pool.execute('SELECT * FROM wisata ORDER BY id DESC LIMIT 3');

        res.json({
            status: "success",
            data: {
                totalWisata: wisataResult[0].total,
                totalUsers: userResult[0].total,
                totalBlogs: blogResult[0].total,
                totalReviews: reviewResult[0].total,
                recentWisata: recentWisata
            }
        });
    } catch (error) {
        console.error("Gagal mengambil statistik admin:", error);
        res.status(500).json({ status: "error", message: "Gagal mengambil data" });
    }
});

// Ambil daftar lokasi unik yang sudah terdaftar di database
app.get('/api/locations', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT DISTINCT lokasi FROM wisata ORDER BY lokasi ASC');
        // Kita ubah array objek [{lokasi: 'A'}, {lokasi: 'B'}] menjadi array string ['A', 'B']
        const locations = rows.map(r => r.lokasi);
        res.json({ status: "success", data: locations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil daftar lokasi." });
    }
});

// ==========================================
// API UNTUK HALAMAN USERS & REVIEWS (ADMIN)
// ==========================================

// Ambil semua data pengguna (DITAMBAHKAN kolom banned)
app.get('/api/admin/users', async (req, res) => {
    try {
        // Kita ambil data penting saja (tanpa password), termasuk status banned
        const [users] = await pool.execute('SELECT id, name, email, role, avatar, banned FROM users ORDER BY id DESC');
        res.json({ status: "success", data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil data users" });
    }
});

// API Hapus User (BARU)
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ status: "success", message: "User berhasil dihapus" });
    } catch (error) {
        console.error("Error delete user:", error);
        res.status(500).json({ status: "error", message: "Gagal menghapus user" });
    }
});

// API Ban / Unban User (BARU)
app.put('/api/admin/users/:id/ban', async (req, res) => {
    try {
        const userId = req.params.id;
        const { banned } = req.body; 
        await pool.execute('UPDATE users SET banned = ? WHERE id = ?', [banned, userId]);
        res.json({ status: "success", message: "Status akun diperbarui" });
    } catch (error) {
        console.error("Error ban user:", error);
        res.status(500).json({ status: "error", message: "Gagal mengubah status user" });
    }
});

// Ambil semua data ulasan beserta nama penggunanya
app.get('/api/admin/reviews', async (req, res) => {
    try {
        // JOIN tabel reviews dan users untuk mendapatkan nama reviewer
        const query = `
            SELECT r.id, r.rating, r.komentar as text, u.name as user, u.avatar 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.id DESC
        `;
        const [reviews] = await pool.execute(query);
        res.json({ status: "success", data: reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil data reviews" });
    }
});

// API Hapus Review (BARU)
app.delete('/api/admin/reviews/:id', async (req, res) => {
    try {
        const reviewId = req.params.id;
        await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);
        res.json({ status: "success", message: "Review berhasil dihapus" });
    } catch (error) {
        console.error("Error delete review:", error);
        res.status(500).json({ status: "error", message: "Gagal menghapus review" });
    }
});

// ============ API PENGINAPAN =============

// GET semua penginapan (admin)
app.get('/api/penginapan', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM penginapan ORDER BY id DESC');
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Gagal mengambil data penginapan." });
  }
});

// GET penginapan by lokasi (untuk rekomendasi di modal user)
app.get('/api/penginapan/rekomendasi', async (req, res) => {
  const { lokasi } = req.query;
  if (!lokasi) {
    return res.status(400).json({ status: "error", message: "Parameter lokasi diperlukan." });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM penginapan WHERE lokasi LIKE ? ORDER BY id DESC',
      [`%${lokasi}%`]
    );
    res.json({ status: "success", data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Gagal mengambil rekomendasi penginapan." });
  }
});

// POST (tambah penginapan) – untuk admin
app.post('/api/penginapan', async (req, res) => {
  // PERBAIKAN: Menambahkan 'image' agar bisa diterima dari script frontend admin.js
  const { nama, lokasi, alamat, harga, gambar, image } = req.body;
  const imgToSave = gambar || image; // Mengakomodasi "gambar" atau "image"

  try {
    await pool.execute(
      'INSERT INTO penginapan (nama, lokasi, alamat, harga, gambar) VALUES (?, ?, ?, ?, ?)',
      [nama, lokasi, alamat, harga, imgToSave]
    );
    res.json({ status: "success", message: "Penginapan berhasil ditambahkan!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Gagal menambah penginapan." });
  }
});

// PUT (edit penginapan)
app.put('/api/penginapan/:id', async (req, res) => {
  // PERBAIKAN: Menambahkan 'image' agar sinkron dengan update frontend
  const { nama, lokasi, alamat, harga, gambar, image } = req.body;
  const imgToSave = gambar || image;

  try {
    await pool.execute(
      'UPDATE penginapan SET nama=?, lokasi=?, alamat=?, harga=?, gambar=? WHERE id=?',
      [nama, lokasi, alamat, harga, imgToSave, req.params.id]
    );
    res.json({ status: "success", message: "Penginapan berhasil diperbarui!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Gagal mengedit penginapan." });
  }
});

// DELETE (hapus penginapan)
app.delete('/api/penginapan/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM penginapan WHERE id = ?', [req.params.id]);
    res.json({ status: "success", message: "Penginapan berhasil dihapus!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Gagal menghapus penginapan." });
  }
});

/* ===============================
   API TRIPS (RIWAYAT PERJALANAN)
=============================== */
// 1. Simpan riwayat (Check-in)
app.post('/api/trips', async (req, res) => {
    const { user_id, wisata_id } = req.body;
    try {
        // Cek apakah user sudah pernah menandai tempat ini
        const [exist] = await pool.execute('SELECT * FROM trips_history WHERE user_id = ? AND wisata_id = ?', [user_id, wisata_id]);
        if (exist.length > 0) {
            return res.json({ status: "info", message: "Kamu sudah pernah menandai tempat ini!" });
        }
        await pool.execute('INSERT INTO trips_history (user_id, wisata_id) VALUES (?, ?)', [user_id, wisata_id]);
        res.json({ status: "success", message: "Jejak perjalananmu berhasil dicatat!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal menyimpan riwayat perjalanan." });
    }
});

// 2. Ambil daftar riwayat user (PERBAIKAN: Menambahkan t.bukti_foto pada query)
app.get('/api/trips/:userId', async (req, res) => {
    try {
        const query = `
            SELECT t.id as trip_id, t.tanggal_kunjungan, t.bukti_foto, w.* FROM trips_history t 
            JOIN wisata w ON t.wisata_id = w.id 
            WHERE t.user_id = ? 
            ORDER BY t.tanggal_kunjungan DESC
        `;
        const [rows] = await pool.execute(query, [req.params.userId]);
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengambil riwayat perjalanan." });
    }
});

// 3. Tambah Foto Bukti ke Perjalanan yang Sudah Ada
app.post('/api/trips/:tripId/photo', async (req, res) => {
    const { tripId } = req.params;
    const { foto } = req.body;
    
    try {
        // Ambil data trip yang ada
        const [rows] = await pool.execute('SELECT bukti_foto FROM trips_history WHERE id = ?', [tripId]);
        if (rows.length === 0) return res.status(404).json({ message: "Data perjalanan tidak ditemukan." });

        let photos = [];
        // Jika sebelumnya sudah ada foto, kita ekstrak dulu datanya
        if (rows[0].bukti_foto) {
            try {
                photos = JSON.parse(rows[0].bukti_foto);
            } catch(e) {
                photos = [rows[0].bukti_foto]; // Fallback untuk data lama
            }
        }
        
        // Tambahkan foto baru ke dalam daftar
        photos.push(foto);

        // Simpan kembali ke database dalam format JSON
        await pool.execute('UPDATE trips_history SET bukti_foto = ? WHERE id = ?', [JSON.stringify(photos), tripId]);
        res.json({ status: "success", message: "Foto bukti berhasil ditambahkan ke galeri!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal mengunggah foto bukti." });
    }
});

// 4. Hapus Foto Kenangan dari Galeri
app.delete('/api/trips/:tripId/photo', async (req, res) => {
    const { tripId } = req.params;
    const { photoIndex } = req.body; // Kita hapus berdasarkan urutan foto (index)

    try {
        const [rows] = await pool.execute('SELECT bukti_foto FROM trips_history WHERE id = ?', [tripId]);
        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan." });

        if (rows[0].bukti_foto) {
            let photos = JSON.parse(rows[0].bukti_foto);
            
            // Hapus 1 foto dari array berdasarkan posisinya (index)
            photos.splice(photoIndex, 1);

            // Jika setelah dihapus array-nya kosong, jadikan null. Jika masih ada sisa, bungkus lagi jadi JSON
            const newBukti = photos.length > 0 ? JSON.stringify(photos) : null;

            await pool.execute('UPDATE trips_history SET bukti_foto = ? WHERE id = ?', [newBukti, tripId]);
            res.json({ status: "success", message: "Foto berhasil dihapus!" });
        } else {
            res.status(400).json({ message: "Tidak ada foto untuk dihapus." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Gagal menghapus foto." });
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});