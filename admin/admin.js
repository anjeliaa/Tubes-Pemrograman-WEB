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
  const wisata = JSON.parse(localStorage.getItem("wisata")) || [];
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const blogs = JSON.parse(localStorage.getItem("blogs")) || [];
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("totalWisata", wisata.length);
  setText("totalUser", users.length);
  setText("totalBlog", blogs.length);
  setText("totalReview", reviews.length);

  const recentContainer = document.getElementById("recentWisata");

  if (recentContainer) {
    recentContainer.innerHTML = "";

    if (wisata.length === 0) {
      recentContainer.innerHTML = "<p>Tidak ada data wisata</p>";
    } else {
      wisata.slice(-3).reverse().forEach(item => {
        const div = document.createElement("div");
        div.className = "admin-item";

        div.innerHTML = `
          <img src="${item.image}" />
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

/* ===============================
   DESTINATIONS (CRUD FULL FIX)
=============================== */
if (path.includes("destinations")) {
  const form = document.getElementById("formWisata");
  const list = document.getElementById("destinationList");
  const preview = document.getElementById("previewImg");
  const inputImage = document.getElementById("image");

  let wisata = JSON.parse(localStorage.getItem("wisata")) || [];
  let editIndex = null;
  let imageBase64 = "";

  /* ===============================
     INIT PREVIEW STATE
  =============================== */
  if (preview) {
    preview.style.display = "none";
  }

  /* ===============================
     IMAGE PREVIEW FIX
  =============================== */
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

        console.log("IMAGE LOADED");
      };

      reader.readAsDataURL(file);
    });
  }

  /* ===============================
     RENDER LIST
  =============================== */
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

      el.innerHTML = `
        <img src="${item.image}" />

        <div class="admin-info">
          <strong>${item.nama}</strong>
          <div class="meta">${item.lokasi} • ${item.kategori}</div>
          <div class="desc">${item.deskripsi}</div>
        </div>

        <div class="admin-actions">
          <button class="btn-edit" data-index="${index}">Edit</button>
          <button class="btn-delete" data-index="${index}">Hapus</button>
        </div>
      `;

      list.appendChild(el);
    });

    /* ===============================
       DELETE
    =============================== */
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", function () {
        const i = this.dataset.index;

        if (confirm("Yakin hapus data ini?")) {
          wisata.splice(i, 1);
          localStorage.setItem("wisata", JSON.stringify(wisata));
          render();
        }
      });
    });

    /* ===============================
       EDIT
    =============================== */
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", function () {
        const i = this.dataset.index;
        const data = wisata[i];

        document.getElementById("nama").value = data.nama;
        document.getElementById("lokasi").value = data.lokasi;
        document.getElementById("kategori").value = data.kategori;
        document.getElementById("deskripsi").value = data.deskripsi;

        imageBase64 = data.image;

        if (preview) {
          preview.src = data.image;
          preview.style.display = "block";
        }

        editIndex = i;

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  render();

  /* ===============================
     SUBMIT FORM FIX
  =============================== */
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const nama = document.getElementById("nama").value;
      const lokasi = document.getElementById("lokasi").value;
      const kategori = document.getElementById("kategori").value;
      const deskripsi = document.getElementById("deskripsi").value;

      // FIX: hanya wajib upload gambar saat CREATE
      if (!imageBase64 && editIndex === null) {
        alert("Upload gambar dulu!");
        return;
      }

      const data = {
        nama,
        lokasi,
        kategori,
        deskripsi,
        image: imageBase64
      };

      if (editIndex !== null) {
        wisata[editIndex] = data;
        editIndex = null;
      } else {
        wisata.push(data);
      }

      localStorage.setItem("wisata", JSON.stringify(wisata));

      form.reset();

      if (preview) {
        preview.style.display = "none";
      }

      imageBase64 = "";

      render();
    });
  }
}

/* ===============================
   BLOGS (CRUD)
=============================== */
if (path.includes("blogs")) {

  const form = document.getElementById("formBlog");
  const list = document.getElementById("blogList");
  const preview = document.getElementById("previewImg");

  let blogs = JSON.parse(localStorage.getItem("blogs")) || [];
  let editIndex = null;
  let imageBase64 = "";

  /* IMAGE PREVIEW */
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

  /* RENDER */
  function render() {
    list.innerHTML = "";

    if (blogs.length === 0) {
      list.innerHTML = "<p>Tidak ada blog</p>";
      return;
    }

    blogs.forEach((b, i) => {
      const div = document.createElement("div");
      div.className = "admin-item";

      div.innerHTML = `
        <img src="${b.image}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;">

        <div class="admin-info">
          <strong>${b.title}</strong>
          <div class="meta">${b.category}</div>
          <div class="desc">${b.content.slice(0, 80)}...</div>
        </div>

        <div class="admin-actions">
          <button class="btn-edit" data-i="${i}">Edit</button>
          <button class="btn-delete" data-i="${i}">Hapus</button>
        </div>
      `;

      list.appendChild(div);
    });

    /* DELETE */
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", function () {
        const i = this.dataset.i;
        if (confirm("Hapus blog ini?")) {
          blogs.splice(i, 1);
          localStorage.setItem("blogs", JSON.stringify(blogs));
          render();
        }
      });
    });

    /* EDIT */
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", function () {
        const i = this.dataset.i;
        const data = blogs[i];

        document.getElementById("title").value = data.title;
        document.getElementById("category").value = data.category;
        document.getElementById("content").value = data.content;

        preview.src = data.image;
        preview.style.display = "block";
        imageBase64 = data.image;

        editIndex = i;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  render();

  /* SUBMIT */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const content = document.getElementById("content").value;

    if (!imageBase64) {
      alert("Upload gambar dulu!");
      return;
    }

    const data = { title, category, content, image: imageBase64 };

    if (editIndex !== null) {
      blogs[editIndex] = data;
      editIndex = null;
    } else {
      blogs.push(data);
    }

    localStorage.setItem("blogs", JSON.stringify(blogs));

    form.reset();
    preview.style.display = "none";
    imageBase64 = "";

    render();
  });
}

/* ==============================
   USERS & REVIEWS MODULE
============================== */

let users = JSON.parse(localStorage.getItem("users")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || [];

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("userList")) {
    renderUsers();
    renderReviews();
    updateUserStats();
  }
});

/* ================= USERS ================= */

function renderUsers() {
  const list = document.getElementById("userList");
  if (!list) return;

  list.innerHTML = "";

  users.forEach((u, i) => {
    const el = document.createElement("div");
    el.className = "admin-item";

    el.innerHTML = `
      <img src="${u.avatar || '../img/default-avatar.png'}">

      <div class="admin-info">
        <strong>${u.name}</strong>
        <div class="meta">${u.email}</div>
        <div class="desc">
          Role: ${u.role || "user"} 
          ${u.banned ? "<span style='color:red'>(BANNED)</span>" : ""}
        </div>
      </div>

      <div class="admin-actions">
        <button class="btn-edit" onclick="toggleBan(${i})">
          ${u.banned ? "Unban" : "Ban"}
        </button>
        <button class="btn-delete" onclick="deleteUser(${i})">
          Delete
        </button>
      </div>
    `;

    list.appendChild(el);
  });

  localStorage.setItem("users", JSON.stringify(users));
}

function toggleBan(i) {
  users[i].banned = !users[i].banned;
  renderUsers();
  updateUserStats();
}

function deleteUser(i) {
  if (!confirm("Hapus user ini?")) return;

  users.splice(i, 1);
  renderUsers();
  updateUserStats();
}

/* ================= REVIEWS ================= */

function renderReviews() {
  const list = document.getElementById("reviewList");
  if (!list) return;

  list.innerHTML = "";

  reviews.forEach((r, i) => {
    const el = document.createElement("div");
    el.className = "admin-item";

    el.innerHTML = `
      <img src="../img/default-avatar.png">

      <div class="admin-info">
        <strong>${r.user || "Anonim"}</strong>
        <div class="meta">${"⭐".repeat(r.rating || 0)}</div>
        <div class="desc">${r.text}</div>
      </div>

      <div class="admin-actions">
        <button class="btn-delete" onclick="deleteReview(${i})">
          Delete
        </button>
      </div>
    `;

    list.appendChild(el);
  });

  localStorage.setItem("reviews", JSON.stringify(reviews));
}

function deleteReview(i) {
  if (!confirm("Hapus review ini?")) return;

  reviews.splice(i, 1);
  renderReviews();
  updateUserStats();
}

/* ================= STATS ================= */

function updateUserStats() {
  const totalUsers = document.getElementById("totalUsers");
  const totalReviews = document.getElementById("totalReviews");
  const bannedUsers = document.getElementById("bannedUsers");
  const activeUsers = document.getElementById("activeUsers");

  if (!totalUsers) return;

  const banned = users.filter(u => u.banned).length;
  const active = users.length - banned;

  totalUsers.innerText = users.length;
  totalReviews.innerText = reviews.length;
  bannedUsers.innerText = banned;
  activeUsers.innerText = active;
}