/* ===============================
   INIT
=============================== */
const path = window.location.pathname;

/* ===============================
   ELEMENT CHECK
=============================== */
// const logoutBtn = document.getElementById("logoutBtn"); // Removed: Now using event delegation

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
   LOGOUT (DIPERBAIKI: Menggunakan Event Delegation)
=============================== */
document.addEventListener("click", function(e) {
  // Mencari apakah yang diklik adalah tombol dengan ID logoutBtn (atau icon di dalamnya)
  const btnLogout = e.target.closest("#logoutBtn");
  
  if (btnLogout) {
    e.preventDefault(); // Mencegah browser reload jika tombolnya menggunakan tag <a>
    Swal.fire({
      title: 'Yakin ingin keluar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#1a4331',
      confirmButtonText: 'Ya, Keluar!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("currentUser");
        window.location.href = "../login.html";
      }
    });
  }
});

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

        setText("totalWisata", stats.totalWisata);
        setText("totalUser", stats.totalUsers);
        setText("totalBlog", stats.totalBlogs);
        setText("totalReview", stats.totalReviews);

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
  let editId = null; 
  let imageBase64 = "";

  if (preview) {
    preview.style.display = "none";
  }

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

  fetchWisata();
  refreshLocationSuggestions();

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
          <button class="btn-delete" data-id="${item.id}">Hapus</button>
        </div>
      `;
      list.appendChild(el);
    });

    /* DELETE */
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", function () {
        const idWisata = this.dataset.id; 

        Swal.fire({
          title: 'Hapus Destinasi?',
          text: "Yakin ingin menghapus data wisata ini secara permanen?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#e74c3c',
          cancelButtonColor: '#1a4331',
          confirmButtonText: 'Ya, Hapus!',
          cancelButtonText: 'Batal'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const res = await fetch(`http://localhost:3000/api/wisata/${idWisata}`, { 
                method: 'DELETE' 
              });
              const data = await res.json();
              
              if (data.status === "success") {
                Swal.fire({icon: 'success', title: 'Terhapus!', text: data.message, showConfirmButton: false, timer: 1500});
                fetchWisata(); 
              } else {
                Swal.fire({icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1a4331'});
              }
            } catch (error) {
              console.error(error);
              Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan saat menghubungi server.', confirmButtonColor: '#1a4331'});
            }
          }
        });
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

        editId = data.id;
        
        // MENGHAPUS REQUIRED SEMENTARA SAAT EDIT
        if (inputImage) inputImage.removeAttribute("required");
        
        const submitBtn = form.querySelector("button") || form.querySelector("input[type='submit']");
        if(submitBtn) submitBtn.textContent = "Update Wisata";

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  /* SUBMIT FORM */
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama").value;
      const lokasi = document.getElementById("lokasi").value;
      const kategori = document.getElementById("kategori").value;
      const deskripsi = document.getElementById("deskripsi").value;

      if (!imageBase64 && editId === null) {
        Swal.fire({icon: 'info', title: 'Upload Gambar', text: 'Silakan upload gambar wisata dulu!', confirmButtonColor: '#1a4331'});
        return;
      }

      const data = { nama, lokasi, kategori, deskripsi, image: imageBase64 };

      try {
        let url = 'http://localhost:3000/api/wisata';
        let method = 'POST';

        if (editId !== null) {
          url = `http://localhost:3000/api/wisata/${editId}`;
          method = 'PUT';
        }

        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === "success") {
          Swal.fire({icon: 'success', title: 'Berhasil', text: result.message, showConfirmButton: false, timer: 1500});
          form.reset();
          if (preview) preview.style.display = "none";
          imageBase64 = "";
          editId = null;
          
          // MENGEMBALIKAN REQUIRED SAAT FORM DI-RESET
          if (inputImage) inputImage.setAttribute("required", "required");

          const submitBtn = form.querySelector("button") || form.querySelector("input[type='submit']");
          if(submitBtn) submitBtn.textContent = "Simpan";
          
          fetchWisata(); 
          refreshLocationSuggestions(); 
        } else {
          Swal.fire({icon: 'error', title: 'Gagal', text: result.message, confirmButtonColor: '#1a4331'});
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan koneksi ke server.', confirmButtonColor: '#1a4331'});
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
  const inputImage = document.getElementById("image");

  let blogs = [];
  let editId = null; 
  let imageBase64 = "";

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
      const shortContent = b.content ? b.content.slice(0, 80) : "";

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

    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        Swal.fire({
          title: 'Hapus Blog?',
          text: "Yakin ingin menghapus blog ini?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#e74c3c',
          cancelButtonColor: '#1a4331',
          confirmButtonText: 'Ya, Hapus!',
          cancelButtonText: 'Batal'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const res = await fetch(`http://localhost:3000/api/blogs/${id}`, { method: 'DELETE' });
              const data = await res.json();
              if (data.status === "success") {
                Swal.fire({icon: 'success', title: 'Terhapus!', showConfirmButton: false, timer: 1500});
                fetchBlogs(); 
              } else {
                Swal.fire({icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1a4331'});
              }
            } catch (error) {
              console.error(error);
              Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server.', confirmButtonColor: '#1a4331'});
            }
          }
        });
      });
    });

    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const data = blogs.find(b => b.id == id); 

        document.getElementById("title").value = data.title;
        document.getElementById("category").value = data.category;
        document.getElementById("content").value = data.content;
        
        preview.src = data.image;
        preview.style.display = "block";
        imageBase64 = data.image;
        editId = id; 
        
        // MENGHAPUS REQUIRED SEMENTARA SAAT EDIT
        if (inputImage) inputImage.removeAttribute("required");

        const submitBtn = form.querySelector("button") || form.querySelector("input[type='submit']");
        if(submitBtn) submitBtn.textContent = "Update Blog";

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  fetchBlogs();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const content = document.getElementById("content").value;
    
    if (!imageBase64 && !editId) {
      Swal.fire({icon: 'info', title: 'Upload Gambar', text: 'Upload gambar untuk blog ini terlebih dahulu.', confirmButtonColor: '#1a4331'});
      return;
    }

    const data = { title, category, content, image: imageBase64 };

    try {
      let url = 'http://localhost:3000/api/blogs';
      let method = 'POST'; 

      if (editId !== null) {
        url = `http://localhost:3000/api/blogs/${editId}`;
        method = 'PUT'; 
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      
      if (result.status === "success") {
        Swal.fire({icon: 'success', title: 'Berhasil', text: result.message, showConfirmButton: false, timer: 1500});
        form.reset();
        preview.style.display = "none";
        imageBase64 = "";
        editId = null; 
        
        // MENGEMBALIKAN REQUIRED SAAT FORM DI-RESET
        if (inputImage) inputImage.setAttribute("required", "required");

        const submitBtn = form.querySelector("button") || form.querySelector("input[type='submit']");
        if(submitBtn) submitBtn.textContent = "Simpan";

        fetchBlogs(); 
      } else {
        Swal.fire({icon: 'error', title: 'Gagal', text: result.message, confirmButtonColor: '#1a4331'});
      }
    } catch (error) {
      console.error(error);
      Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server.', confirmButtonColor: '#1a4331'});
    }
  });
}

/* ==============================
   USERS & REVIEWS MODULE
============================== */
if (path.includes("users")) {
  let adminUsers = [];
  let adminReviews = [];

  async function fetchUsersAndReviews() {
    try {
      const resUsers = await fetch('http://localhost:3000/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.status === "success") {
        adminUsers = dataUsers.data.filter(user => user.role !== "admin");
      }

      const resReviews = await fetch('http://localhost:3000/api/admin/reviews');
      const dataReviews = await resReviews.json();
      if (dataReviews.status === "success") {
        adminReviews = dataReviews.data;
      }

      renderAdminUsers();
      renderAdminReviews();
      updateUserStats();
    } catch (error) {
      console.error("Gagal mengambil data Users & Reviews:", error);
    }
  }

  window.deleteUserDB = function(id) {
    Swal.fire({
      title: 'Hapus User?',
      text: "User ini akan dihapus secara permanen beserta datanya.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#1a4331',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:3000/api/admin/users/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          
          if (data.status === "success") {
            Swal.fire({icon: 'success', title: 'Terhapus!', text: data.message, showConfirmButton: false, timer: 1500});
            fetchUsersAndReviews(); 
          } else {
            Swal.fire({icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1a4331'});
          }
        } catch (err) {
          console.error(err);
          Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server.', confirmButtonColor: '#1a4331'});
        }
      }
    });
  };

  window.toggleBanUser = function(id, currentStatus) {
    const newStatus = !currentStatus; 
    const actionText = newStatus ? "membekukan (ban)" : "membuka (unban)";

    Swal.fire({
      title: 'Ubah Status Akun?',
      text: `Apakah kamu yakin ingin ${actionText} user ini?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#e74c3c' : '#f39c12',
      cancelButtonColor: '#1a4331',
      confirmButtonText: 'Ya, Lanjutkan!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:3000/api/admin/users/${id}/ban`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banned: newStatus })
          });
          const data = await res.json();

          if (data.status === "success") {
            Swal.fire({icon: 'success', title: 'Berhasil!', showConfirmButton: false, timer: 1500});
            fetchUsersAndReviews(); 
          } else {
            Swal.fire({icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1a4331'});
          }
        } catch (err) {
          console.error(err);
          Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server.', confirmButtonColor: '#1a4331'});
        }
      }
    });
  };

  window.deleteReviewDB = function(id) {
    Swal.fire({
      title: 'Hapus Ulasan?',
      text: "Ulasan ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#1a4331',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:3000/api/admin/reviews/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          
          if (data.status === "success") {
            Swal.fire({icon: 'success', title: 'Terhapus!', showConfirmButton: false, timer: 1500});
            fetchUsersAndReviews(); 
          } else {
            Swal.fire({icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1a4331'});
          }
        } catch (err) {
          console.error(err);
          Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server saat menghapus review.', confirmButtonColor: '#1a4331'});
        }
      }
    });
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
      
      const avatarSrc = u.avatar || `../img/team${(u.id % 4) + 1}.jpg`;
      const isBanned = u.banned ? true : false;
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

    const banned = adminUsers.filter(u => u.banned).length; 
    const active = adminUsers.length - banned;

    totalUsers.innerText = adminUsers.length;
    totalReviews.innerText = adminReviews.length;
    if (bannedUsers) bannedUsers.innerText = banned;
    if (activeUsers) activeUsers.innerText = active;
  }

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
  let editId = null; 
  let imageBase64 = "";

  if (preview) {
    preview.style.display = "none";
  }

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
      const hargaFormat = Number(p.harga).toLocaleString('id-ID'); 

      div.innerHTML = `
        <img src="${imgSrc}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;">
        <div class="admin-info">
          <strong>${p.nama}</strong>
          <div class="meta">${p.lokasi} • Rp ${hargaFormat} / malam</div>
          <div class="desc">${p.alamat}</div>
        </div>
        <div class="admin-actions">
          <button class="btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn-delete" data-id="${p.id}">Hapus</button>
        </div>
      `;
      list.appendChild(div);
    });

    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        Swal.fire({
          title: 'Hapus Penginapan?',
          text: "Yakin ingin menghapus penginapan ini?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#e74c3c',
          cancelButtonColor: '#1a4331',
          confirmButtonText: 'Ya, Hapus!',
          cancelButtonText: 'Batal'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const res = await fetch(`http://localhost:3000/api/penginapan/${id}`, { method: 'DELETE' });
              const data = await res.json();
              if (data.status === "success") {
                Swal.fire({icon: 'success', title: 'Terhapus!', showConfirmButton: false, timer: 1500});
                fetchPenginapan(); 
              } else {
                Swal.fire({icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1a4331'});
              }
            } catch (error) {
              console.error(error);
              Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server.', confirmButtonColor: '#1a4331'});
            }
          }
        });
      });
    });

    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const data = penginapan.find(p => p.id == id); 

        document.getElementById("nama").value = data.nama;
        document.getElementById("lokasi").value = data.lokasi;
        document.getElementById("alamat").value = data.alamat;
        document.getElementById("harga").value = data.harga;

        imageBase64 = data.gambar || data.image;
        if (preview) {
          preview.src = imageBase64;
          preview.style.display = "block";
          preview.style.width = "200px"; 
          preview.style.marginTop = "10px";
          preview.style.borderRadius = "8px";
        }

        editId = id; 
        
        // MENGHAPUS REQUIRED SEMENTARA SAAT EDIT
        if (inputImage) inputImage.removeAttribute("required");

        const submitBtn = form.querySelector("button") || form.querySelector("input[type='submit']");
        if(submitBtn) submitBtn.textContent = "Update Penginapan";

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  fetchPenginapan();

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama").value;
      const lokasi = document.getElementById("lokasi").value;
      const alamat = document.getElementById("alamat").value;
      const harga = document.getElementById("harga").value;

      if (!imageBase64 && editId === null) {
        Swal.fire({icon: 'info', title: 'Upload Gambar', text: 'Harap upload gambar penginapan terlebih dahulu!', confirmButtonColor: '#1a4331'});
        return;
      }

      const data = { nama, lokasi, alamat, harga, image: imageBase64 };

      try {
        let url = 'http://localhost:3000/api/penginapan';
        let method = 'POST'; 

        if (editId !== null) {
          url = `http://localhost:3000/api/penginapan/${editId}`;
          method = 'PUT';
        }

        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.status === "success") {
          Swal.fire({icon: 'success', title: 'Berhasil', text: result.message, showConfirmButton: false, timer: 1500});
          
          form.reset();
          if (preview) preview.style.display = "none";
          imageBase64 = "";
          editId = null;

          // MENGEMBALIKAN REQUIRED SAAT FORM DI-RESET
          if (inputImage) inputImage.setAttribute("required", "required");

          const submitBtn = form.querySelector("button") || form.querySelector("input[type='submit']");
          if(submitBtn) submitBtn.textContent = "Simpan";

          fetchPenginapan(); 
        } else {
          Swal.fire({icon: 'error', title: 'Gagal', text: result.message, confirmButtonColor: '#1a4331'});
        }
      } catch (error) {
        console.error(error);
        Swal.fire({icon: 'error', title: 'Error', text: 'Terjadi kesalahan server saat menyimpan data.', confirmButtonColor: '#1a4331'});
      }
    });
  }
}