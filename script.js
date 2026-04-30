let dataWisata = []; 
let favorites = []; 

const heroData = {
  semua: {
    title: "Explore Destinations",
    desc: "Find the best places to visit in Bengkulu, from beaches to mountains and historical sites.",
    image: "../img/bg2.jpg"
  },
  "Kota Bengkulu": {
    title: "Bengkulu City Wonders",
    desc: "Discover iconic places like Pantai Panjang, Pulau Tikus, and historical landmarks in the heart of Bengkulu City.",
    image: "../img/pulau tikus.jpg"
  },
  "Curup, Rejang Lebong": {
    title: "Rejang Lebong Nature Escape",
    desc: "Explore mountains, waterfalls, and cool highland scenery in Rejang Lebong.",
    image: "../img/curug trisakti curup.jpg"
  },
  "Kabupaten Lebong": {
    title: "Hidden Nature of Lebong",
    desc: "A quiet paradise filled with natural landscapes and green valleys.",
    image: "../img/pusat pelatihan gajah.jpg"
  },
  "Pulau Enggano, Bengkulu Utara": {
    title: "Enggano Island Paradise",
    desc: "Remote tropical island with pristine beaches and untouched coral reefs.",
    image: "../img/pantai batu lubang.jpg"
  }
};

/* =========================================
   AUTH STATE HELPERS
========================================= */
function getIsLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

/* STATE GLOBAL */
let selectedRating = 0;
let reviewLimit = 2;
let currentReviewRating = 0;
let currentSearch = "";
let currentCategory = "semua";
let currentLocation = "semua";
let initialized = false;
let currentOpenId = null;

/* =========================================
   UI HELPERS
========================================= */
function updateHero() {
  const hero = heroData[currentLocation] || heroData.semua;

  const heroSection = document.getElementById("destHero");
  const title = document.getElementById("heroTitle");
  const desc = document.getElementById("heroDesc");

  if (heroSection) {
    heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${hero.image}')`;
    heroSection.style.backgroundSize = "cover";
    heroSection.style.backgroundPosition = "center";
  }

  if (title) title.textContent = hero.title;
  if (desc) desc.textContent = hero.desc;
}

function generateStars(rating) {
  const full = Math.floor(Number(rating));
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += i <= full ? "★" : "☆";
  }
  return out;
}

function getBadgeClass(kategori) {
  return {
    pantai: "badge-pantai",
    sejarah: "badge-sejarah",
    alam: "badge-alam"
  }[kategori] || "";
}

function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updatePillsUI(active) {
  document.querySelectorAll(".pill").forEach(p => {
    p.classList.toggle("active", p.dataset.filter === active);
  });
}

/**
 * TAMBAHAN: Mengambil daftar lokasi unik dari Database
 */
async function loadDynamicLocations() {
  const filterSelect = document.getElementById("locationFilter");
  if (!filterSelect) return;

  try {
    const res = await fetch('http://localhost:3000/api/locations');
    const result = await res.json();

    if (result.status === "success") {
      // Sisakan opsi "All Locations"
      filterSelect.innerHTML = '<option value="semua">All Locations</option>';
      
      result.data.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc;
        option.textContent = loc;
        filterSelect.appendChild(option);
      });
      
      // Kembalikan nilai yang sedang dipilih jika masih ada
      filterSelect.value = currentLocation;
    }
  } catch (error) {
    console.error("Gagal memuat lokasi dinamis:", error);
  }
}

/* =========================================
   FAVORITE SYSTEM (DATABASE)
========================================= */
async function toggleFavorite(wisataId) {
  if (!getIsLoggedIn()) {
    alert("Silakan login terlebih dahulu untuk menambahkan ke favorit!");
    return;
  }

  const user = getCurrentUser();

  try {
    const response = await fetch('http://localhost:3000/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, wisata_id: wisataId })
    });

    const result = await response.json();

    if (result.status === "success") {
      if (result.action === "added") {
        favorites.push(wisataId);
        alert(result.message);
      } else if (result.action === "removed") {
        favorites = favorites.filter(id => id !== wisataId);
        alert(result.message);
      }
      
      renderFavoritesPage();
      
      const icon = document.querySelector("#favBtn i");
      if (icon) {
        icon.classList.toggle("fa-solid"); 
        icon.classList.toggle("fa-regular");
      }
    }
  } catch (error) {
    console.error("Gagal toggle favorit:", error);
  }
}

function renderFavoritesPage() {
  const favoritesGrid = document.getElementById("favoritesGrid");
  const emptyFavorites = document.getElementById("emptyFavorites");

  if (!favoritesGrid) return; 

  favoritesGrid.innerHTML = "";
  const favoriteItems = dataWisata.filter(w => favorites.includes(w.id));

  if (favoriteItems.length === 0) {
    if (emptyFavorites) emptyFavorites.style.display = "block";
    favoritesGrid.style.display = "none";
    return;
  }

  if (emptyFavorites) emptyFavorites.style.display = "none";
  favoritesGrid.style.display = "grid";

  favoriteItems.forEach(wisata => {
    const card = document.createElement("div");
    card.className = "wisata-card show";
    
    const imgSource = wisata.gambar || wisata.image;

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${imgSource}" class="card-img" alt="${wisata.nama}">
        <span class="card-badge ${getBadgeClass(wisata.kategori)}">${capitalize(wisata.kategori)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${wisata.nama}</h3>
        <p class="card-location">${wisata.lokasi}</p>
        <div class="card-rating">
          <span class="stars">${generateStars(wisata.rating || 0)}</span>
          <span>${Number(wisata.rating || 0).toFixed(1)}</span>
        </div>
        <button class="btn-submit" style="background:#e74c3c; margin-top:10px;" onclick="confirmDeleteFavorite(${wisata.id})">
          <i class="fa-solid fa-trash"></i> Hapus
        </button>
      </div>
    `;
    favoritesGrid.appendChild(card);
  });
}

/* =========================================
   FILTER & RENDER CARD
========================================= */
function filterData() {
  return dataWisata.filter(w => {
    const matchLocation = currentLocation === "semua" || w.lokasi === currentLocation;
    const matchSearch =
      w.nama.toLowerCase().includes(currentSearch.toLowerCase()) ||
      w.lokasi.toLowerCase().includes(currentSearch.toLowerCase());
    const matchCategory = currentCategory === "semua" || w.kategori === currentCategory;

    return matchSearch && matchCategory && matchLocation;
  });
}

function renderCards(data) {
  const grid = document.getElementById("wisataGrid");
  const empty = document.getElementById("emptyState");
  const resultInfo = document.getElementById("resultInfo");

  if (!grid) return;
  grid.innerHTML = "";

  if (data.length === 0) {
    grid.style.display = "none";
    if (empty) empty.style.display = "block";
    if (resultInfo) resultInfo.textContent = "";
    return;
  }

  grid.style.display = "grid";
  if (empty) empty.style.display = "none";

  if (resultInfo) {
    resultInfo.textContent = `Menampilkan ${data.length} destinasi wisata`;
  }

  data.forEach((wisata, index) => {
    const card = document.createElement("div");
    card.className = "wisata-card";
    card.style.animationDelay = `${index * 0.07}s`;

    const imgSource = wisata.gambar || wisata.image;

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${imgSource}" class="card-img" alt="${wisata.nama}" loading="lazy">
        <span class="card-badge ${getBadgeClass(wisata.kategori)}">
          ${capitalize(wisata.kategori)}
        </span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${wisata.nama}</h3>
        <p class="card-location">${wisata.lokasi}</p>
        <div class="card-rating">
          <span class="stars">${generateStars(wisata.rating || 0)}</span>
          <span>${Number(wisata.rating || 0).toFixed(1)}</span>
        </div>
        <p class="card-desc">${wisata.deskripsi}</p>
        <a href="detail.html?id=${wisata.id}" class="card-btn">Lihat Detail</a>
      </div>
    `;

    grid.appendChild(card);
  });
}

/* =========================================
   Detail wisata
========================================= */
async function loadDetailPage() {
  if (!window.location.pathname.includes("detail.html")) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  if (!id) return;

  try {
    const res = await fetch('http://localhost:3000/api/wisata');
    const result = await res.json();
    if (result.status !== "success") return;

    const wisata = result.data.find(w => w.id === id);
    if (!wisata) return;

    const user = getCurrentUser();
    const isFav = favorites.includes(id);

    const container = document.getElementById("detailContainer");

    // ===== FETCH REVIEWS =====
    let reviewsData = [];
    try {
      const resRev = await fetch(`http://localhost:3000/api/reviews/${id}`);
      const revJson = await resRev.json();
      if (revJson.status === "success") {
        reviewsData = revJson.data;
      }
    } catch {}

    const avg = reviewsData.length
      ? (reviewsData.reduce((a, b) => a + b.rating, 0) / reviewsData.length).toFixed(1)
      : 0;

    const existingReview = user ? reviewsData.find(r => r.user_id === user.id) : null;
    currentReviewRating = existingReview ? existingReview.rating : 0;

    const imgSource = wisata.gambar || wisata.image;

// ===== RENDER =====
container.innerHTML = `
  <div class="detail-page">

    <img src="${imgSource}" class="detail-img">

    <div class="detail-content">

      <div class="detail-main">

        <!-- ================= LEFT ================= -->
        <div class="detail-left">

          <div class="detail-header">
            <h1>${wisata.nama}</h1>

            <div class="detail-actions">
            <button onclick="markAsVisited(${id})" class="btn-visited">
             <i class="fa-solid fa-location-check"></i> Pernah ke sini
             </button>

              <button id="favBtn" class="btn-fav">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
            </div>
          </div>

          <p class="detail-location">
            <i class="fa-solid fa-location-dot"></i> ${wisata.lokasi}
          </p>

          <p class="detail-desc">
            ${wisata.deskripsi}
          </p>

          <div class="rating-box">
            ⭐ ${avg} (${reviewsData.length} reviews)
          </div>

          <div class="penginapan-section">
          <h2>Rekomendasi Penginapan</h2>
          <div id="penginapanList" class="hotel-list"></div>
          </div>

        </div>


        <!-- ================= RIGHT ================= -->
        <div class="detail-right">

          <div class="review-section">
            <h3>Ulasan Pengunjung</h3>

            <div id="reviewList"></div>

            <button id="viewMoreReviews" class="btn-view">
              View more
            </button>
          </div>

          <div class="review-form">
            <h3>${existingReview ? 'Edit Review' : 'Write Review'}</h3>

            <div id="starInput" class="star-input">
              ${[1,2,3,4,5].map(i => `
                <span 
                  data-star="${i}" 
                  class="star ${i <= currentReviewRating ? 'active' : ''}"
                >★</span>
              `).join("")}
            </div>

            <textarea id="reviewText" placeholder="Tulis pengalaman kamu...">${existingReview ? existingReview.komentar : ''}</textarea>

            <button id="submitReview" class="btn-submit">
              Submit Review
            </button>
          </div>

        </div>

      </div>

    </div>
  </div>
`;

// ===== EVENT =====
document.getElementById("favBtn").onclick = () => toggleFavorite(id);

renderReviewsUI(reviewsData, reviewLimit);
setupReviewLogic(id);

// ===== PENGINAPAN =====
const penginapanContainer = document.getElementById("penginapanList");

try {
  const resP = await fetch(`http://localhost:3000/api/penginapan/rekomendasi?lokasi=${encodeURIComponent(wisata.lokasi)}`);
  const dataP = await resP.json();

  if (dataP.status === "success") {
    penginapanContainer.innerHTML = dataP.data.map(p => `
      <div class="hotel-item">

        <img src="${p.gambar}" class="hotel-img">

        <div class="hotel-info">
          <strong>${p.nama}</strong>
          <p class="hotel-price">
            Rp ${Number(p.harga).toLocaleString('id-ID')}
          </p>
        </div>

      </div>
    `).join("");
  }
} catch {}

  } catch (err) {
    console.error(err);
  }
}

function renderReviewsUI(reviews, limit = 2) {
  const list = document.getElementById("reviewList");
  if (!list) return;

  if (reviews.length === 0) {
    list.innerHTML = "<p style='color:gray; font-size:0.9rem;'>Belum ada ulasan untuk tempat ini.</p>";
    return;
  }

  list.innerHTML = reviews.slice(0, limit).map(r => `
    <div class="review-item">
      <div style="display: flex; justify-content: space-between;">
        <div class="review-user"><strong>${r.user_name}</strong></div>
      </div>
      <div class="stars">${generateStars(r.rating)}</div>
      <div class="review-text">${r.komentar}</div>
    </div>
  `).join("");
}

function setupReviewLogic(wisataId) {
  const stars = document.querySelectorAll("#starInput span");
  const text = document.getElementById("reviewText");
  const btn = document.getElementById("submitReview");
  const viewMore = document.getElementById("viewMoreReviews");

  stars.forEach(s => {
    s.onclick = () => {
      currentReviewRating = parseInt(s.dataset.star);
      stars.forEach(x => x.style.color = "gray");
      for (let i = 0; i < currentReviewRating; i++) {
        stars[i].style.color = "gold";
      }
    };
  });

  btn.onclick = async () => {
    if (!getIsLoggedIn()) {
      alert("Kamu harus login dulu!");
      return;
    }

    if (!currentReviewRating || !text.value) {
      alert("Harap isi rating bintang dan teks ulasannya!");
      return;
    }

    const payload = {
      wisata_id: wisataId,
      user_id: getCurrentUser().id,
      rating: currentReviewRating,
      komentar: text.value
    };

    try {
      const res = await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.status === "success") {
        alert(result.message);
        openModal(wisataId); 
      } else {
        alert("Gagal mengirim ulasan.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan server saat menyimpan ulasan.");
    }
  };

  if (viewMore) {
    viewMore.onclick = () => {
      reviewLimit += 5;
      openModal(wisataId); 
    };
  }
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if(overlay) {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
}

// Fungsi baru untuk konfirmasi sebelum hapus
function confirmDeleteFavorite(wisataId) {
    // Menampilkan dialog konfirmasi bawaan browser
    const yakin = confirm("Apakah Anda yakin ingin menghapus destinasi ini dari daftar favorit?");
    
    if (yakin) {
        // Jika klik 'OK', jalankan fungsi toggleFavorite yang sudah ada
        toggleFavorite(wisataId);
    }
}
/* =========================================
   INITIALIZATION (FETCH DATA SAAT LOAD)
========================================= */
document.addEventListener("DOMContentLoaded", async () => {
  if (initialized) return;
  initialized = true;

  try {
    // 1. Ambil data wisata dari API Node.js
    const resWisata = await fetch('http://localhost:3000/api/wisata');
    const resultWisata = await resWisata.json();
    if (resultWisata.status === "success") {
      dataWisata = resultWisata.data;
    }

    // 2. Ambil lokasi dinamis (TAMBAHAN BARU)
    await loadDynamicLocations();

    // 3. Jika user login, ambil data daftar ID favorit miliknya
    const user = getCurrentUser();
    if (user) {
      const resFav = await fetch(`http://localhost:3000/api/favorites/${user.id}`);
      const resultFav = await resFav.json();
      if (resultFav.status === "success") {
        favorites = resultFav.data;
      }
    }
  } catch (error) {
    console.error("Gagal memuat data awal dari server:", error);
  }

  renderCards(dataWisata);
  renderFavoritesPage();

  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const locationFilter = document.getElementById("locationFilter");
  const btnReset = document.getElementById("btnReset");

  searchInput?.addEventListener("input", function () {
    currentSearch = this.value.trim();
    if (searchClear) searchClear.style.display = currentSearch ? "block" : "none";
    renderCards(filterData());
  });

  searchClear?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    currentSearch = "";
    if (searchClear) searchClear.style.display = "none";
    renderCards(filterData());
  });

  locationFilter?.addEventListener("change", function () {
    currentLocation = this.value;
    renderCards(filterData());
    updateHero();
  });

  btnReset?.addEventListener("click", () => {
    currentSearch = "";
    currentCategory = "semua";
    currentLocation = "semua";

    if (searchInput) searchInput.value = "";
    if (locationFilter) locationFilter.value = "semua";
    if (searchClear) searchClear.style.display = "none";

    updatePillsUI("semua");
    renderCards(filterData());
    updateHero("semua");
  });

  document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      currentCategory = pill.dataset.filter;
      updatePillsUI(currentCategory);
      renderCards(filterData());
    });
  });

  const modalClose = document.getElementById("modalClose");
  if(modalClose) modalClose.onclick = closeModal;

  const modalOverlay = document.getElementById("modalOverlay");
  if(modalOverlay) {
    modalOverlay.onclick = (e) => {
      if (e.target.id === "modalOverlay") closeModal();
    };
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  loadDetailPage();
});

/* =========================================
   LAIN-LAIN (BLOG SEARCH & ANIMATIONS)
========================================= */
const blogSearch = document.getElementById("blogSearch");
blogSearch?.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  document.querySelectorAll(".blog-card").forEach(card => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    const desc = card.querySelector("p").textContent.toLowerCase();

    if (title.includes(keyword) || desc.includes(keyword)) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll(".blog-card").forEach(card => {
  // Hanya tambah class jika belum punya class fade-in
  // (mencegah error pada halaman yang tidak pakai animasi ini)
  if(!card.classList.contains("fade-in")) {
     card.classList.add("fade-in");
  }
  observer.observe(card);
});

window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 60);
});

/* ==========================================
   PUBLIC BLOGS DATA FETCHING
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    const featuredContainer = document.getElementById("featuredContainer");
    const listContainer = document.getElementById("listContainer");

    // Hanya jalankan script ini jika berada di halaman Blogs
    if (featuredContainer && listContainer) {
        loadPublicBlogs();
    }

    async function loadPublicBlogs() {
        try {
            const res = await fetch('http://localhost:3000/api/blogs');
            const result = await res.json();

            if (result.status === "success") {
                const blogs = result.data;

                if (blogs.length === 0) {
                    featuredContainer.innerHTML = "<p style='text-align: center;'>Belum ada artikel yang dipublikasikan.</p>";
                    return;
                }

                // 1. Render Featured Blog (Ambil data indeks ke-0 / Paling baru)
                const featured = blogs[0];
                const featuredContent = featured.content ? featured.content.substring(0, 150) + "..." : "";
                
                featuredContainer.innerHTML = `
                    <div class="featured-card">
                        <img src="${featured.image || 'img/default-image.jpg'}" alt="featured">
                        <div class="featured-content">
                            <span class="blog-tag">${featured.category || 'Featured'}</span>
                            <h2>${featured.title}</h2>
                            <p>${featuredContent}</p>
                            <a href="blog-detail.html?id=${featured.id}"><button class="btn-read">Read More</button></a>
                        </div>
                    </div>
                `;

                // 2. Render Blog List (Ambil data sisanya: indeks ke-1 sampai habis)
                listContainer.innerHTML = "";
                const restBlogs = blogs.slice(1);
                
                restBlogs.forEach(b => {
                    const shortContent = b.content ? b.content.substring(0, 80) + "..." : "";
                    
                    // Format tanggal sederhana, pakai kategori jika tanggal tidak terbaca
                    const dateStr = b.created_at 
                        ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                        : b.category;

                    // PERBAIKAN: Hapus class "fade-in" di baris bawah ini
                    listContainer.innerHTML += `
                        <div class="blog-card"> 
                            <img src="${b.image || 'img/default-image.jpg'}">
                            <div class="blog-content">
                                <span class="blog-date" style="text-transform: capitalize;">${dateStr}</span>
                                <h3>${b.title}</h3>
                                <p>${shortContent}</p>
                                <a href="blog-detail.html?id=${b.id}" class="read-more">Read More →</a>
                            </div>
                        </div>
                    `;
                });
            }
        } catch (error) {
            console.error("Gagal memuat artikel blog:", error);
            featuredContainer.innerHTML = "<p style='text-align: center;'>Gagal terhubung ke server.</p>";
        }
    }
});
/* =========================================
   TRIPS / RIWAYAT PERJALANAN (CHECK-IN)
========================================= */
async function markAsVisited(wisataId) {
  if (!getIsLoggedIn()) {
    alert("Silakan login terlebih dahulu!");
    window.location.href = "../login.html"; // Sesuaikan jika path login berbeda
    return;
  }

  const user = getCurrentUser();

  try {
    const response = await fetch('http://localhost:3000/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, wisata_id: wisataId })
    });
    const result = await response.json();
    alert(result.message); // Munculkan notifikasi sukses/sudah pernah
  } catch (error) {
    console.error("Gagal menyimpan trip:", error);
    alert("Terjadi kesalahan server saat menyimpan jejak perjalanan.");
  }
}
/* =========================================
   TAMPILKAN DATA DI HALAMAN TRIPS
========================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("trips.html")) {
    loadUserTrips();
  }
});

async function loadUserTrips() {
  const container = document.getElementById("tripsContainer");
  if (!container) return; 

  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = "<p style='text-align:center;'>Silakan login terlebih dahulu.</p>";
    return;
  }

  container.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Memuat riwayat perjalanan...</p>";

  try {
    const response = await fetch(`http://localhost:3000/api/trips/${user.id}`);
    const result = await response.json();

    if (result.status === "success") {
      if (result.data.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
            <div style="font-size: 4rem; color: var(--sand); margin-bottom: 20px;">
              <i class="fa-solid fa-map-location-dot"></i>
            </div>
            <h3 style="color: var(--forest);">Belum Ada Riwayat Perjalanan</h3>
            <p style="color: var(--text-mid); margin-bottom: 25px;">Ayo mulai jelajahi keindahan Bengkulu dan tandai jejakmu!</p>
            <a href="explore.html" class="btn-submit" style="text-decoration: none; display: inline-block; width: auto; padding: 12px 30px;">
              Cari Destinasi Wisata
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = "";
      result.data.forEach(trip => {
        const card = document.createElement("div");
        card.className = "wisata-card show";
        
        // 1. Gambar utama tetap menggunakan gambar dari database wisata
        const imgSource = trip.gambar || trip.image || '../img/default-image.jpg';
        const date = new Date(trip.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        // 2. Olah data galeri foto bukti
        let galeriHtml = "";
        if (trip.bukti_foto) {
            let photos = [];
            try { photos = JSON.parse(trip.bukti_foto); } catch(e) { photos = [trip.bukti_foto]; }
            
            // Buat HTML untuk deretan foto + TOMBOL HAPUS DI ATAS FOTO
            photos.forEach((p, index) => {
                galeriHtml += `
                <div style="position: relative; display: inline-block; margin-right: 10px; margin-bottom: 10px;">
                    <img src="${p}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 8px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;" 
                         onclick="openImagePreview('${p}')">
                    
                    <button onclick="window.deleteFotoBukti(${trip.trip_id}, ${index})" 
                            style="position: absolute; top: -8px; right: -8px; background: #ff4757; color: white; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 10;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>`;
            });
        }
        // 3. Render Kartu
        card.innerHTML = `
          <div class="card-img-wrap">
            <img src="${imgSource}" class="card-img" alt="${trip.nama}" style="height: 200px; object-fit: cover;">
            <span class="card-badge" style="background: #2e7d32;">Selesai Dikunjungi</span>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; min-height: 250px;">
            <h3 class="card-title">${trip.nama}</h3>
            <p class="card-location" style="color: gray; font-size: 0.9rem; margin-bottom: 10px;">
              <i class="fa-solid fa-map-pin"></i> ${trip.lokasi}
            </p>
            <div style="background: #e8f5e9; color: #2e7d32; padding: 8px; border-radius: 6px; font-size: 0.85rem; font-weight: bold; margin-bottom: 15px;">
              <i class="fa-solid fa-calendar-check"></i> Pada: ${date}
            </div>

            <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-top: auto;">
                <p style="font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: var(--forest);">Galeri Kenangan:</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; min-height: 50px; align-items: center;">
                    ${galeriHtml || '<span style="font-size: 0.8rem; color: gray; font-style: italic;">Belum ada foto bukti diunggah.</span>'}
                </div>
                
                <input type="file" id="upload-${trip.trip_id}" accept="image/*" style="display:none;" onchange="window.uploadFotoBukti(${trip.trip_id})">
                
                <button onclick="document.getElementById('upload-${trip.trip_id}').click()" style="width: 100%; background: white; color: var(--forest); border: 1px solid var(--forest); padding: 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: 0.3s;">
                    <i class="fa-solid fa-cloud-arrow-up"></i> Upload Foto Kenangan
                </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Gagal memuat trips:", error);
    container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:red;'>Gagal memuat data.</p>";
  }
}

// Fungsi untuk menangani proses upload foto dari tombol di atas
window.uploadFotoBukti = function(tripId) {
    const input = document.getElementById(`upload-${tripId}`);
    const file = input.files[0];
    
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB!");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Photo = e.target.result;
        
        try {
            const response = await fetch(`http://localhost:3000/api/trips/${tripId}/photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: base64Photo })
            });
            const result = await response.json();
            
            if (result.status === "success") {
                alert("Foto kenangan berhasil ditambahkan!");
                loadUserTrips(); // Otomatis me-refresh kartu agar foto baru langsung muncul
            } else {
                alert(result.message);
            }
        } catch(error) {
            console.error(error);
            alert("Gagal mengunggah foto.");
        }
    };
    reader.readAsDataURL(file);
};
// Fungsi untuk menghapus foto dari galeri
window.deleteFotoBukti = async function(tripId, index) {
    // Munculkan peringatan sebelum menghapus
    if (!confirm("Apakah kamu yakin ingin menghapus foto kenangan ini?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/trips/${tripId}/photo`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoIndex: index })
        });
        const result = await response.json();
        
        if (result.status === "success") {
            loadUserTrips(); // Langsung refresh galeri tanpa perlu reload halaman
        } else {
            alert(result.message);
        }
    } catch(error) {
        console.error("Gagal menghapus foto:", error);
        alert("Terjadi kesalahan saat menghubungi server.");
    }
};
// Fungsi untuk membuka preview gambar full
window.openImagePreview = function(src) {
    const modal = document.getElementById("imagePreviewModal");
    const fullImg = document.getElementById("fullImage");
    
    fullImg.src = src;
    modal.classList.add("open"); // Memanfaatkan class .open yang sudah ada di CSS kamu
    document.body.style.overflow = "hidden"; // Biar gak bisa scroll saat liat foto
};

// Fungsi untuk menutup preview
window.closeImagePreview = function() {
    const modal = document.getElementById("imagePreviewModal");
    modal.classList.remove("open");
    document.body.style.overflow = ""; // Balikin scroll
};

// Tambahan: Tutup modal kalau user klik area di luar gambar
document.getElementById("imagePreviewModal").onclick = function(e) {
    if (e.target.id === "imagePreviewModal") {
        closeImagePreview();
    }
};