document.addEventListener("DOMContentLoaded", async () => {

  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const path = window.location.pathname;

  const isAuthPage = ["/login", "/register"].some(p => path.includes(p));
  const isDashboard = path.includes("dashboard");
  const isProfilePage = path.includes("profile");
  const isTripsPage = path.includes("trips");
  const isAdminPage = path.startsWith("/admin");
  const isUserPage = path.startsWith("/user");

  /* =========================
      AUTH CHECK
  ========================= */
  if (!currentUser && !isAuthPage) {
    window.location.href = "/login.html";
    return;
  }

  /* =========================
      ROLE REDIRECT
  ========================= */
  if (currentUser) {
    if (currentUser.role === "admin") {
      if (!isAdminPage) {
        window.location.href = "/admin/dashboard.html";
        return;
      }
    }

    if (currentUser.role === "user") {
      const needProfile = !(currentUser.is_profile_complete || currentUser.isProfileComplete);
      if (needProfile && !isProfilePage) {
        window.location.href = "/user/profile.html";
        return;
      }
    }
  }

  /* =========================
      NAV & UI RENDER
  ========================= */
  const navUser = document.getElementById("navUser");
  const navAvatar = document.getElementById("navAvatar");
  const dashAvatar = document.getElementById("dashAvatar");
  const welcomeText = document.getElementById("welcomeText");
  const logoutBtn = document.getElementById("logoutBtn");

  function renderUserUI() {
    if (!currentUser) return;

    // DAFTAR FOTO KELINCI (SNOWBALL)
    const defaultBunnies = [
      "../img/team1.jpg",
      "../img/team2.jpg",
      "../img/team3.jpg",
      "../img/team4.jpg"
    ];

    // Logika: Jika avatar kosong, pilih bunny berdasarkan Modulo ID
    const avatar = currentUser.avatar || defaultBunnies[currentUser.id % 4];

    if (navAvatar) navAvatar.src = avatar;
    if (dashAvatar) dashAvatar.src = avatar;

    if (welcomeText) {
      welcomeText.innerHTML = `
        <i class="fa-solid fa-sun"></i>
        Welcome back, ${currentUser.name || "User"}
      `;
    }
  }

  /* =========================
      DASHBOARD REAL DATA (FETCH DB)
  ========================= */
  async function renderDashboardData() {
    if (!isDashboard || !currentUser) return;

    try {
      const resStats = await fetch(`http://localhost:3000/api/user/stats/${currentUser.id}`);
      const stats = await resStats.json();

      if (stats.status === "success") {
        const totalFavEl = document.getElementById("totalFav");
        const totalRevEl = document.getElementById("totalRev");
        const totalTripsEl = document.getElementById("totalTrips"); // Tambahkan ini
        const activityList = document.getElementById("activityList");

        if (totalFavEl) totalFavEl.textContent = stats.totalFavorites;
        if (totalRevEl) totalRevEl.textContent = stats.totalReviews;
        if (totalTripsEl) totalTripsEl.textContent = stats.totalTrips; // Tambahkan ini

        if (activityList) {
          activityList.innerHTML = `
            <div class="activity-item">
              <i class="fa-solid fa-heart"></i>
              <p>Kamu memfavoritkan <strong>${stats.totalFavorites}</strong> destinasi.</p>
            </div>
            <div class="activity-item">
              <i class="fa-solid fa-star"></i>
              <p>Kamu telah menulis <strong>${stats.totalReviews}</strong> ulasan.</p>
            </div>
          `;
        }
      }

      const resWisata = await fetch('http://localhost:3000/api/wisata');
      const wisataResult = await resWisata.json();

      const rekomGrid = document.getElementById("rekomGrid");
      if (rekomGrid && wisataResult.status === "success") {
        const top3 = wisataResult.data.slice(0, 3);
        rekomGrid.innerHTML = top3.map(item => `
          <div class="rekom-card">
            <img src="${item.gambar || item.image}" alt="${item.nama}">
            <div class="rekom-body">
              <h3>${item.nama}</h3>
              <p>${item.lokasi}</p>
            </div>
          </div>
        `).join("");
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    }
  }

  // Jalankan render
  renderUserUI();
  if (isDashboard) renderDashboardData();

  /* =========================
      NAV & LOGOUT LOGIC
  ========================= */
  if (navUser) {
    navUser.onclick = (e) => { e.stopPropagation(); navUser.classList.toggle("active"); };
    document.onclick = () => navUser.classList.remove("active");
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("currentUser");
      window.location.href = "/login.html";
    };
  }

  /* =========================
      PROFILE PAGE LOGIC
  ========================= */
  if (isProfilePage && currentUser) {
    const profileImg = document.getElementById("profileAvatar");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileForm = document.getElementById("profileForm");
    const uploadAvatar = document.getElementById("uploadAvatar");
    const changePhoto = document.getElementById("changePhoto");

    let currentAvatarBase64 = currentUser.avatar || "";

    function loadProfile() {
      if (profileName) profileName.textContent = currentUser.name || "User";
      if (profileEmail) profileEmail.textContent = currentUser.email;
      
      // Load avatar (pakai kelinci kalau kosong)
      const defaultBunnies = ["../img/team1.jpg", "../img/team2.jpg", "../img/team3.jpg", "../img/team4.jpg"];
      if (profileImg) {
        profileImg.src = currentUser.avatar || defaultBunnies[currentUser.id % 4];
      }

      document.getElementById("inputName").value = currentUser.name || "";
      document.getElementById("inputBio").value = currentUser.bio || "";
      document.getElementById("inputCity").value = currentUser.city || "";
      document.getElementById("inputCountry").value = currentUser.country || "";
      document.getElementById("inputRegion").value = currentUser.region || "";
      document.getElementById("inputPreference").value = currentUser.preference || "alam";

      if (document.getElementById("profileCity")) document.getElementById("profileCity").textContent = currentUser.city || "-";
      if (document.getElementById("profileCountry")) document.getElementById("profileCountry").textContent = currentUser.country || "-";
      if (document.getElementById("profileRegion")) document.getElementById("profileRegion").textContent = currentUser.region || "-";
    }

    loadProfile();

    if (changePhoto) changePhoto.onclick = (e) => { e.preventDefault(); uploadAvatar.click(); };

    if (uploadAvatar) {
      uploadAvatar.onchange = function () {
        const file = this.files[0];
        if (file && file.size <= 2 * 1024 * 1024) {
          const reader = new FileReader();
          reader.onload = (e) => {
            currentAvatarBase64 = e.target.result;
            if (profileImg) profileImg.src = currentAvatarBase64;
          };
          reader.readAsDataURL(file);
        } else {
          alert("File terlalu besar (Maks 2MB)");
        }
      };
    }

    if (profileForm) {
      profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const updatedData = {
          id: currentUser.id,
          name: document.getElementById("inputName").value,
          bio: document.getElementById("inputBio").value,
          city: document.getElementById("inputCity").value,
          country: document.getElementById("inputCountry").value,
          region: document.getElementById("inputRegion").value,
          preference: document.getElementById("inputPreference").value,
          avatar: currentAvatarBase64
        };

        try {
          const res = await fetch('http://localhost:3000/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
          });
          const result = await res.json();
          if (result.status === "success") {
            localStorage.setItem("currentUser", JSON.stringify(result.user));
            alert("Profil diperbarui!");
            window.location.href = "/user/dashboard.html";
          }
        } catch (err) {
          alert("Gagal menyimpan ke server.");
        }
      };
    }
  }
});