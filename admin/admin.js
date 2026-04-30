/* ===============================
   INIT
=============================== */
const path = window.location.pathname;

/* ===============================
   ELEMENT CHECK
=============================== */
const logoutBtn = document.getElementById("logoutBtn");

/* ===============================
   AUTO ACTIVE SIDEBAR
=============================== */
document.querySelectorAll(".admin-sidebar ul li a").forEach(link => {
  if (path.includes(link.getAttribute("href"))) {
    link.parentElement.classList.add("active");
  }
});

/* ===============================
   AUTH PROTECTION
=============================== */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser || currentUser.role !== "admin") {
  window.location.href = "../login.html";
}

/* ===============================
   LOGOUT
=============================== */
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "../login.html";
  });
}

/* ===============================
   DASHBOARD
=============================== */
if (path.includes("dashboard")) {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  async function loadAdminDashboard() {
    try {
      const response = await fetch('http://localhost:3000/api/admin/stats');
      const result = await response.json();

      if (result.status === "success") {
        const stats = result.data;

        // Update angka di kotak atas
        setText("totalWisata", stats.totalWisata);
        setText("totalUser", stats.totalUsers);
        setText("totalBlog", stats.totalBlogs);
        setText("totalReview", stats.totalReviews);

        // Update daftar Wisata Terbaru
        const recentContainer = document.getElementById("recentWisata");
        if (recentContainer) {
          recentContainer.innerHTML = "";

          if (stats.recentWisata.length === 0) {
            recentContainer.innerHTML = "<p>Tidak ada data wisata</p>";
          } else {
            stats.recentWisata.forEach(item => {
              const div = document.createElement("div");
              div.className = "admin-item";

              const imgSource = item.gambar || item.image || '../img/default-image.jpg';

              div.innerHTML = `
                <img src="${imgSource}" />
                <div class="admin-info">
                  <strong>${item.nama}</strong>
                  <div class="meta">${item.lokasi} • ${item.kategori}</div>
                </div>
              `;

              recentContainer.appendChild(div);
            });
          }
        }
      }
    } catch (error) {
      console.error("Gagal memuat dashboard admin:", error);
    }
  }

  // Panggil fungsi saat halaman diload
  loadAdminDashboard();
}

/* ===============================
   DESTINATIONS (TERHUBUNG DATABASE)
=============================== */
if (path.includes("destinations")) {
  const form = document.getElementById("formWisata");
  const list = document.getElementById("destinationList");
  const preview = document.getElementById("previewImg");
  const inputImage = document.getElementById("image");

  let wisata = []; 
  let editIndex = null;
  let imageBase64 = "";

  /* INIT PREVIEW STATE */
  if (preview) {
    preview.style.display = "none";
  }

  /* IMAGE PREVIEW FIX */
  if (inputImage) {
    inputImage.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        imageBase64 = e.target.result;
        if (preview) {
          preview.src = imageBase64;
          preview.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Mengambil daftar lokasi unik untuk saran (datalist)
   */
  async function refreshLocationSuggestions() {
    try {
      const res = await fetch('http://localhost:3000/api/locations');
      const result = await res.json();
      const dataList = document.getElementById("existingLocations");
      
      if (dataList && result.status === "success") {
        dataList.innerHTML = result.data.map(loc => `<option value="${loc}">`).join("");
      }
    } catch (err) {
      console.error("Gagal memuat saran lokasi:", err);
    }
  }

  /* AMBIL DATA DARI NODE.JS (DATABASE) */
  async function fetchWisata() {
    try {
      const response = await fetch('http://localhost:3000/api/wisata');
      const result = await response.json();
      
      if (result.status === "success") {
        wisata = result.data;
        render();
      }
    } catch (error) {
      console.error("Gagal mengambil data wisata:", error);
      list.innerHTML = "<p>Gagal memuat data dari server.</p>";
    }
  }

  // Panggil fungsi awal
  fetchWisata();
  refreshLocationSuggestions();

  /* RENDER LIST */
  function render() {
    if (!list) return;
    list.innerHTML = "";

    if (wisata.length === 0) {
      list.innerHTML = "<p>Tidak ada data wisata</p>";
      return;
    }

    wisata.forEach((item, index) => {
      const el = document.createElement("div");
      el.className = "admin-item";
      const imgSource = item.gambar || item.image;

      el.innerHTML = `
        <img src="${imgSource}" />
        <div class="admin-info">
          <strong>${item.nama}</strong>
          <div class="meta">${item.lokasi} • ${item.kategori}</div>
          <div class="desc">${item.deskripsi}</div>
        </div>
        <div class="admin-actions">
          <button class="btn-edit" data-index="${index}">Edit</button>
          <!-- PERBAIKAN: Gunakan data-id dari database -->
          <button class="btn-delete" data-id="${item.id}">Hapus</button>
        </div>
      `;
      list.appendChild(el);
    });

    /* DELETE (PERBAIKAN: TERHUBUNG KE API DATABASE) */
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async function () {
        const idWisata = this.dataset.id; // Ambil ID asli dari database

        if (confirm("Yakin ingin menghapus data wisata ini secara permanen?")) {
          try {
            const res = await fetch(`http://localhost:3000/api/wisata/${idWisata}`, { 
              method: 'DELETE' 
            });
            const result = await res.json();
            
            if (result.status === "success") {
              alert(result.message);
              fetchWisata(); // Refresh daftar dari database
            } else {
              alert("Gagal menghapus: " + result.message);
            }
          } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat menghidupungi server.");
          }
        }
      });
    });

    /* EDIT */
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", function () {
        const i = this.dataset.index;
        const data = wisata[i];

        document.getElementById("nama").value = data.nama;
        document.getElementById("lokasi").value = data.lokasi;
        document.getElementById("kategori").value = data.kategori;
        document.getElementById("deskripsi").value = data.deskripsi;

        imageBase64 = data.gambar || data.image;
        if (preview) {
          preview.src = imageBase64;
          preview.style.display = "block";
        }

        editIndex = i;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  /* SUBMIT FORM (POST KE NODE.JS) */
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama").value;
      const lokasi = document.getElementById("lokasi").value;
      const kategori = document.getElementById("kategori").value;
      const deskripsi = document.getElementById("deskripsi").value;

      if (!imageBase64 && editIndex === null) {
        alert("Upload gambar dulu!");
        return;
      }

      const data = { nama, lokasi, kategori, deskripsi, image: imageBase64 };

      try {
        if (editIndex !== null) {
          alert("Catatan: Edit saat ini hanya mengubah tampilan (API Update belum dibuat di server).");
          wisata[editIndex] = { ...wisata[editIndex], ...data, gambar: imageBase64 };
          editIndex = null;
          render();
          form.reset();
          if (preview) preview.style.display = "none";
          imageBase64 = "";
          return;
        }

        const response = await fetch('http://localhost:3000/api/wisata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === "success") {
          alert(result.message);
          form.reset();
          if (preview) preview.style.display = "none";
          imageBase64 = "";
          
          fetchWisata(); 
          refreshLocationSuggestions(); // Refresh saran lokasi agar data baru muncul
        } else {
          alert("Gagal menyimpan: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan koneksi ke server.");
      }
    });
  }
}

/* ===============================
   BLOGS (TERHUBUNG DATABASE)
=============================== */
if (path.includes("blogs")) {
  const form = document.getElementById("formBlog");
  const list = document.getElementById("blogList");
  const preview = document.getElementById("previewImg");

  let blogs = [];
  let editId = null; // Menggunakan ID dari database
  let imageBase64 = "";

  const inputImage = document.getElementById("image");
  if (inputImage) {
    inputImage.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        imageBase64 = e.target.result;
        preview.src = imageBase64;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  // Tarik data dari MySQL
  async function fetchBlogs() {
    try {
      const res = await fetch('http://localhost:3000/api/blogs');
      const result = await res.json();
      if (result.status === "success") {
        blogs = result.data;
        render();
      }
    } catch (error) {
      console.error("Gagal mengambil data blog:", error);
    }
  }

  function render() {
    list.innerHTML = "";
    if (blogs.length === 0) {
      list.innerHTML = "<p>Tidak ada blog</p>";
      return;
    }
    
    blogs.forEach((b) => {
      const div = document.createElement("div");
      div.className = "admin-item";
      
      // Mencegah error jika content kosong
      const shortContent = b.content ? b.content.slice(0, 80) : "";

      // Struktur HTML tetap dipertahankan agar CSS tidak rusak
      div.innerHTML = `
        <img src="${b.image}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;">
        <div class="admin-info">
          <strong>${b.title}</strong>
          <div class="meta">${b.category}</div>
          <div class="desc">${shortContent}...</div>
        </div>
        <div class="admin-actions">
          <button class="btn-edit" data-id="${b.id}">Edit</button>
          <button class="btn-delete" data-id="${b.id}">Hapus</button>
        </div>
      `;
      list.appendChild(div);
    });

    // Event Hapus
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        if (confirm("Yakin ingin menghapus blog ini?")) {
          try {
            const res = await fetch(`http://localhost:3000/api/blogs/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.status === "success") {
              fetchBlogs(); // Otomatis refresh list
            }
          } catch (error) {
            console.error(error);
          }
        }
      });
    });

    // Event Edit
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const data = blogs.find(b => b.id == id); // Cari data berdasarkan ID

        document.getElementById("title").value = data.title;
        document.getElementById("category").value = data.category;
        document.getElementById("content").value = data.content;
        
        preview.src = data.image;
        preview.style.display = "block";
        imageBase64 = data.image;
        editId = id; // Set mode Edit aktif
        
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  // Panggil fungsi awal
  fetchBlogs();

  // Event Submit (Tambah Baru & Simpan Edit)
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const content = document.getElementById("content").value;
    
    if (!imageBase64 && !editId) {
      alert("Upload gambar dulu!");
      return;
    }

    const data = { title, category, content, image: imageBase64 };

    try {
      let url = 'http://localhost:3000/api/blogs';
      let method = 'POST'; // Default adalah Tambah Baru

      if (editId !== null) {
        url = `http://localhost:3000/api/blogs/${editId}`;
        method = 'PUT'; // Jika sedang edit, ubah method jadi PUT
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      
      if (result.status === "success") {
        alert(result.message);
        form.reset();
        preview.style.display = "none";
        imageBase64 = "";
        editId = null; // Kembalikan ke mode Tambah Baru
        fetchBlogs(); // Refresh otomatis
      } else {
        alert("Gagal menyimpan: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan server.");
    }
  });
}

/* ==============================
   USERS & REVIEWS MODULE
============================== */
if (path.includes("users")) {
  let adminUsers = [];
  let adminReviews = [];

  // Fungsi untuk menarik data dari Node.js (MySQL)
  async function fetchUsersAndReviews() {
    try {
      // 1. Ambil Data Users
      const resUsers = await fetch('http://localhost:3000/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.status === "success") {
        // LOGIKA BARU: Filter data, HANYA simpan yang role-nya BUKAN "admin"
        adminUsers = dataUsers.data.filter(user => user.role !== "admin");
      }

      // 2. Ambil Data Reviews
      const resReviews = await fetch('http://localhost:3000/api/admin/reviews');
      const dataReviews = await resReviews.json();
      if (dataReviews.status === "success") {
        adminReviews = dataReviews.data;
      }

      // 3. Render semuanya ke layar
      renderAdminUsers();
      renderAdminReviews();
      updateUserStats();

    } catch (error) {
      console.error("Gagal mengambil data Users & Reviews:", error);
    }
  }

  // Fungsi menghapus user ke Database (BARU)
  window.deleteUserDB = async function(id) {
    if (confirm("Apakah kamu yakin ingin menghapus user ini secara permanen?")) {
      try {
        const res = await fetch(`http://localhost:3000/api/admin/users/${id}`, {
          method: 'DELETE'
        });
        const result = await res.json();
        
        if (result.status === "success") {
          alert("User berhasil dihapus!");
          fetchUsersAndReviews(); // Refresh layar otomatis
        } else {
          alert("Gagal menghapus: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan server.");
      }
    }
  };

  // Fungsi Ban / Unban user ke Database (BARU)
  window.toggleBanUser = async function(id, currentStatus) {
    const newStatus = !currentStatus; // Kebalikan dari status saat ini
    const actionText = newStatus ? "membekukan (ban)" : "membuka (unban)";

    if (confirm(`Apakah kamu yakin ingin ${actionText} user ini?`)) {
      try {
        const res = await fetch(`http://localhost:3000/api/admin/users/${id}/ban`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ banned: newStatus })
        });
        const result = await res.json();

        if (result.status === "success") {
          fetchUsersAndReviews(); // Refresh layar otomatis
        } else {
          alert("Gagal mengubah status: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan server.");
      }
    }
  };

  // Fungsi menghapus review ke Database (BARU)
  window.deleteReviewDB = async function(id) {
    if (confirm("Apakah kamu yakin ingin menghapus ulasan ini?")) {
      try {
        const res = await fetch(`http://localhost:3000/api/admin/reviews/${id}`, {
          method: 'DELETE'
        });
        const result = await res.json();
        
        if (result.status === "success") {
          fetchUsersAndReviews(); // Refresh layar otomatis
        } else {
          alert("Gagal menghapus review: " + result.message);
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan server saat menghapus review.");
      }
    }
  };

  function renderAdminUsers() {
    const list = document.getElementById("userList");
    if (!list) return;
    list.innerHTML = "";

    if (adminUsers.length === 0) {
      list.innerHTML = "<p style='padding: 20px;'>Belum ada user yang terdaftar.</p>";
      return;
    }

    adminUsers.forEach((u, i) => {
      const el = document.createElement("div");
      el.className = "admin-item";
      
      // Pakai avatar default kelinci jika kosong
      const avatarSrc = u.avatar || `../img/team${(u.id % 4) + 1}.jpg`;

      // Logika tombol Ban dan Delete
      const isBanned = u.banned ? true : false;
      
      // Karena kita sudah memfilter admin di awal, ini sebagai pelindung ekstra saja
      const actionButtons = u.role === "admin" 
        ? `<span style="color: gray; font-style: italic; font-size: 0.9rem;">Admin Account</span>`
        : `<button class="btn-edit" onclick="window.toggleBanUser(${u.id}, ${isBanned})">${isBanned ? 'Unban' : 'Ban'}</button>
           <button class="btn-delete" onclick="window.deleteUserDB(${u.id})">Delete</button>`;

      el.innerHTML = `
        <img src="${avatarSrc}">
        <div class="admin-info">
          <strong>${u.name}</strong>
          <div class="meta">${u.email}</div>
          <div class="desc">
            Role: <strong>${u.role || "user"}</strong> 
            ${isBanned ? "<span style='color:red; font-weight:bold;'>(BANNED)</span>" : ""}
          </div>
        </div>
        <div class="admin-actions">
          ${actionButtons}
        </div>
      `;
      list.appendChild(el);
    });
  }

  function renderAdminReviews() {
    const list = document.getElementById("reviewList"); 
    if (!list) return;
    list.innerHTML = "";

    if (adminReviews.length === 0) {
      list.innerHTML = "<p style='padding: 20px;'>Belum ada ulasan.</p>";
      return;
    }

    adminReviews.forEach((r, i) => {
      const el = document.createElement("div");
      el.className = "admin-item";
      
      const avatarSrc = r.avatar || '../img/default-avatar.png';

      el.innerHTML = `
        <img src="${avatarSrc}">
        <div class="admin-info">
          <strong>${r.user || "Anonim"}</strong>
          <div class="meta" style="color: gold;">${"★".repeat(r.rating || 0)}${"☆".repeat(5 - (r.rating || 0))}</div>
          <div class="desc">${r.text}</div>
        </div>
        <div class="admin-actions">
          <button class="btn-delete" onclick="window.deleteReviewDB(${r.id})">Delete</button>
        </div>
      `;
      list.appendChild(el);
    });
  }

  function updateUserStats() {
    const totalUsers = document.getElementById("totalUsers");
    const totalReviews = document.getElementById("totalReviews");
    const bannedUsers = document.getElementById("bannedUsers");
    const activeUsers = document.getElementById("activeUsers");
    
    if (!totalUsers) return;

    // Hitung status berdasarkan data yang sudah ada kolom banned-nya
    const banned = adminUsers.filter(u => u.banned).length; 
    const active = adminUsers.length - banned;

    totalUsers.innerText = adminUsers.length;
    totalReviews.innerText = adminReviews.length;
    if (bannedUsers) bannedUsers.innerText = banned;
    if (activeUsers) activeUsers.innerText = active;
  }

  // Panggil fungsi utama saat halaman diload
  fetchUsersAndReviews();

}

/* ===============================
   ACCOMMODATIONS (PENGINAPAN)
=============================== */
if (path.includes("accommodations")) {
  const form = document.getElementById("formPenginapan");
  const list = document.getElementById("penginapanList");
  const preview = document.getElementById("previewImg");
  const inputImage = document.getElementById("image");

  let penginapan = [];
  let imageBase64 = "";

  // Sembunyikan preview gambar saat awal
  if (preview) {
    preview.style.display = "none";
  }

  // Handle preview gambar
  if (inputImage) {
    inputImage.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        imageBase64 = e.target.result;
        preview.src = imageBase64;
        preview.style.display = "block";
        preview.style.width = "200px"; 
        preview.style.marginTop = "10px";
        preview.style.borderRadius = "8px";
      };
      reader.readAsDataURL(file);
    });
  }

  // Ambil data dari database
  async function fetchPenginapan() {
    try {
      const res = await fetch('http://localhost:3000/api/penginapan');
      const result = await res.json();
      if (result.status === "success") {
        penginapan = result.data;
        render();
      }
    } catch (err) {
      console.error("Gagal memuat data penginapan:", err);
    }
  }

  // Render list penginapan ke layar
  function render() {
    if (!list) return;
    list.innerHTML = "";

    if (penginapan.length === 0) {
      list.innerHTML = "<p style='padding:20px;'>Belum ada data penginapan.</p>";
      return;
    }

    penginapan.forEach((p) => {
      const div = document.createElement("div");
      div.className = "admin-item";
      
      const imgSrc = p.gambar || '../img/default-image.jpg';
      const hargaFormat = Number(p.harga).toLocaleString('id-ID'); // Format ke Rupiah

      div.innerHTML = `
        <img src="${imgSrc}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;">
        <div class="admin-info">
          <strong>${p.nama}</strong>
          <div class="meta">${p.lokasi} • Rp ${hargaFormat} / malam</div>
          <div class="desc">${p.alamat}</div>
        </div>
        <div class="admin-actions">
          <button class="btn-delete" data-id="${p.id}">Hapus</button>
        </div>
      `;
      list.appendChild(div);
    });

    // Event tombol Hapus
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        if (confirm("Yakin ingin menghapus penginapan ini?")) {
          try {
            const res = await fetch(`http://localhost:3000/api/penginapan/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.status === "success") {
              fetchPenginapan(); // Refresh otomatis
            } else {
              alert("Gagal menghapus: " + result.message);
            }
          } catch (error) {
            console.error(error);
          }
        }
      });
    });
  }

  // Panggil fungsi render saat halaman diload
  fetchPenginapan();

  // Handle Form Submit
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama").value;
      const lokasi = document.getElementById("lokasi").value;
      const alamat = document.getElementById("alamat").value;
      const harga = document.getElementById("harga").value;

      if (!imageBase64) {
        alert("Harap upload gambar penginapan terlebih dahulu!");
        return;
      }

      const data = { nama, lokasi, alamat, harga, image: imageBase64 };

      try {
        const res = await fetch('http://localhost:3000/api/penginapan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.status === "success") {
          alert(result.message);
          form.reset();
          if (preview) preview.style.display = "none";
          imageBase64 = "";
          fetchPenginapan(); // Refresh layar setelah simpan
        } else {
          alert("Gagal menyimpan: " + result.message);
        }
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan server saat menyimpan data.");
      }
    });
  }
}