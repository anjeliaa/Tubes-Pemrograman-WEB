document.addEventListener("DOMContentLoaded", () => {

  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  let users = JSON.parse(localStorage.getItem("users")) || [];

  const path = window.location.pathname;

  const isAuthPage = ["/login", "/register"].some(p => path.includes(p));
  const isProfilePage = path.includes("/user/profile");
  const isDashboard = path.includes("/user/dashboard");

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

    // ADMIN
    if (currentUser.role === "admin") {
      if (!isAdminPage) {
        window.location.href = "/admin/dashboard.html";
        return;
      }
    }

    // USER
    if (currentUser.role === "user") {
      const needProfile = !currentUser.isProfileComplete;

      if (needProfile && !isProfilePage) {
        window.location.href = "/user/profile.html";
        return;
      }
    }
  }

  /* =========================
     NAV & UI
  ========================= */
  const navUser = document.getElementById("navUser");
  const navAvatar = document.getElementById("navAvatar");
  const dashAvatar = document.getElementById("dashAvatar");
  const welcomeText = document.getElementById("welcomeText");
  const logoutBtn = document.getElementById("logoutBtn");

  function syncUserData(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));

    users = users.map(u =>
      u.email === user.email ? user : u
    );

    localStorage.setItem("users", JSON.stringify(users));
  }

  function renderUserUI() {
    if (!currentUser) return;

    const avatar = currentUser.avatar || "/img/default-avatar.png";

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
     DUMMY DATA (REKOMENDASI)
  ========================= */
  const dataWisata = [
    {
      id: 1,
      nama: "Pantai Panjang",
      deskripsi: "Sunset terbaik di Bengkulu",
      gambar: "/img/pantai panjang.jpg"
    },
    {
      id: 2,
      nama: "Air Terjun Curug",
      deskripsi: "Alam yang masih asri",
      gambar: "/img/curug trisakti curup.jpg"
    },
    {
      id: 3,
      nama: "Bukit Kaba",
      deskripsi: "View pegunungan indah",
      gambar: "/img/bukit kaba.jpg"
    }
  ];

  const activityData = [
    { icon: "fa-star", text: "Kamu review Pantai Panjang" },
    { icon: "fa-heart", text: "Kamu menambahkan Bukit Kaba ke favorit" }
  ];

  function renderRekomendasi() {
    const container = document.getElementById("rekomGrid");
    if (!container) return;

    container.innerHTML = dataWisata.map(item => `
      <div class="rekom-card">
        <img src="${item.gambar}" alt="${item.nama}">
        <div class="rekom-body">
          <h3>${item.nama}</h3>
          <p>${item.deskripsi}</p>
        </div>
      </div>
    `).join("");
  }

  function renderActivity() {
    const container = document.getElementById("activityList");
    if (!container) return;

    container.innerHTML = activityData.map(item => `
      <div class="activity-item">
        <i class="fa-solid ${item.icon}"></i>
        <p>${item.text}</p>
      </div>
    `).join("");
  }

  renderUserUI();
  renderRekomendasi();
  renderActivity();

  /* =========================
     NAV DROPDOWN
  ========================= */
  if (navUser) {
    navUser.addEventListener("click", (e) => {
      e.stopPropagation();
      navUser.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      navUser.classList.remove("active");
    });
  }

  /* =========================
     LOGOUT FIX
  ========================= */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "/login.html";
    });
  }

  /* =========================
     ACTIVE NAV LINK
  ========================= */
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add("active");
    }
  });

  /* =========================
     PROFILE PAGE
  ========================= */
  if (isProfilePage && currentUser) {

    const profileImg = document.getElementById("profileAvatar");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    const inputName = document.getElementById("inputName");
    const inputBio = document.getElementById("inputBio");
    const inputCity = document.getElementById("inputCity");
    const inputCountry = document.getElementById("inputCountry");
    const inputRegion = document.getElementById("inputRegion");
    const inputPreference = document.getElementById("inputPreference");

    const uploadAvatar = document.getElementById("uploadAvatar");
    const changePhoto = document.getElementById("changePhoto");
    const profileForm = document.getElementById("profileForm");

    const profileCity = document.getElementById("profileCity");
    const profileCountry = document.getElementById("profileCountry");
    const profileRegion = document.getElementById("profileRegion");

    function loadProfile() {
      if (profileName) profileName.textContent = currentUser.name || "User";
      if (profileEmail) profileEmail.textContent = currentUser.email;

      if (inputName) inputName.value = currentUser.name || "";
      if (inputBio) inputBio.value = currentUser.bio || "";
      if (inputCity) inputCity.value = currentUser.city || "";
      if (inputCountry) inputCountry.value = currentUser.country || "";
      if (inputRegion) inputRegion.value = currentUser.region || "";
      if (inputPreference) inputPreference.value = currentUser.preference || "nature";

      if (profileImg) {
        profileImg.src = currentUser.avatar || "/img/default-avatar.png";
      }

      if (profileCity) profileCity.textContent = currentUser.city || "Kota belum diisi";
      if (profileCountry) profileCountry.textContent = currentUser.country || "Negara belum diisi";
      if (profileRegion) profileRegion.textContent = currentUser.region || "Domisili belum diisi";
    }

    loadProfile();

    if (profileForm) {
      profileForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const updatedUser = {
          ...currentUser,
          name: inputName?.value,
          bio: inputBio?.value,
          city: inputCity?.value,
          country: inputCountry?.value,
          region: inputRegion?.value,
          preference: inputPreference?.value,
          isProfileComplete: true
        };

        currentUser = updatedUser;
        syncUserData(updatedUser);
        renderUserUI();

        setTimeout(() => {
          window.location.href = "/user/dashboard.html";
        }, 300);
      });
    }

    if (changePhoto && uploadAvatar) {
      changePhoto.addEventListener("click", (e) => {
        e.preventDefault();
        uploadAvatar.click();
      });
    }

    if (uploadAvatar) {
      uploadAvatar.addEventListener("change", function () {
        const file = this.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
          currentUser.avatar = e.target.result;
          syncUserData(currentUser);

          if (profileImg) {
            profileImg.src = currentUser.avatar;
          }

          renderUserUI();
        };

        reader.readAsDataURL(file);
      });
    }
  }

});