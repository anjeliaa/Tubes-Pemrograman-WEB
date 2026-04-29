/* =========================================
   DATA UTAMA (Diambil dari Database)
========================================= */
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
  "Kabupaten Rejang Lebong": {
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
        <button class="btn-submit" style="background:#e74c3c; margin-top:10px;" onclick="toggleFavorite(${wisata.id})">
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
        <button class="card-btn" data-id="${wisata.id}">Lihat Detail</button>
      </div>
    `;

    grid.appendChild(card);
  });

  grid.querySelectorAll(".card-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(parseInt(btn.dataset.id));
    });
  });

  grid.querySelectorAll(".wisata-card").forEach(card => {
    card.addEventListener("click", () => {
      const btn = card.querySelector(".card-btn");
      if (btn) openModal(parseInt(btn.dataset.id));
    });
  });
}

/* =========================================
   MODAL & REVIEW SYSTEM (DATABASE)
========================================= */
async function openModal(id) {
  const wisata = dataWisata.find(w => w.id === id);
  if (!wisata) return; 
  
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");

  currentOpenId = id;
  const isFav = favorites.includes(id);
  const loggedIn = getIsLoggedIn();
  const user = getCurrentUser();

  content.innerHTML = `<h3 style="text-align:center; padding: 50px;">Memuat data...</h3>`;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  let reviewsData = [];
  try {
    const res = await fetch(`http://localhost:3000/api/reviews/${id}`);
    const resJson = await res.json();
    if (resJson.status === "success") {
      reviewsData = resJson.data;
    }
  } catch (error) {
    console.error("Gagal mengambil ulasan", error);
  }

  const existingReview = user ? reviewsData.find(r => r.user_id === user.id) : null;
  currentReviewRating = existingReview ? existingReview.rating : 0;

  const avg = reviewsData.length
      ? (reviewsData.reduce((a, b) => a + b.rating, 0) / reviewsData.length).toFixed(1)
      : 0;

  const imgSource = wisata.gambar || wisata.image;

  content.innerHTML = `
  <img src="${imgSource}" class="modal-img">

  <div class="modal-body">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>${wisata.nama}</h2>
      <button id="favBtn" style="background:none; border:none; cursor:pointer; font-size:1.5rem;">
        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #e74c3c;"></i>
      </button>
    </div>
    <p class="modal-location">${wisata.lokasi}</p>
    <p class="modal-desc">${wisata.deskripsi}</p>

    <div class="modal-rating-summary">
      <div class="rating-score">⭐ ${avg}</div>
      <div class="rating-count">(${reviewsData.length} reviews)</div>
    </div>

    <div id="reviewList" class="review-list"></div>

    <button id="viewMoreReviews" class="btn-link">View more</button>
    <hr>

    <div id="reviewForm" class="review-form">
      <h4 id="formHeader">${existingReview ? 'Edit Your Review' : 'Write Review'}</h4>
      <div id="starInput" class="star-input">
        ${[1,2,3,4,5].map(i => `<span data-star="${i}" style="color: ${existingReview && i <= existingReview.rating ? 'gold' : 'gray'}">★</span>`).join("")}
      </div>
      <textarea id="reviewText" placeholder="${loggedIn ? 'Tulis review...' : 'Harap login untuk menulis review...'}" ${loggedIn ? '' : 'disabled'}>${existingReview ? existingReview.komentar : ''}</textarea>
      <button id="submitReview" class="btn-submit">${existingReview ? 'Update Review' : 'Submit'}</button>
      </div>
      <hr>
    <div class="penginapan-section">
      <h4><i class="fa-solid fa-hotel"></i> Rekomendasi Penginapan</h4>
      <div id="penginapanList"><p>Memuat data penginapan...</p></div>
      </div>
  </div>
  `;

  document.getElementById("favBtn").onclick = () => toggleFavorite(id);

  renderReviewsUI(reviewsData, reviewLimit);
  setupReviewLogic(id);
  // Ambil rekomendasi penginapan
const penginapanContainer = document.getElementById("penginapanList");
if (penginapanContainer) {
  try {
    const resPenginapan = await fetch(`http://localhost:3000/api/penginapan/rekomendasi?lokasi=${encodeURIComponent(wisata.lokasi)}`);
    const dataPenginapan = await resPenginapan.json();
    if (dataPenginapan.status === "success" && dataPenginapan.data.length > 0) {
      penginapanContainer.innerHTML = dataPenginapan.data.map(p => `
        <div class="review-item" style="display: flex; align-items: center; gap: 10px;">
          <img src="${p.gambar}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="this.src='../img/default-hotel.jpg'">
          <div style="flex: 1;">
            <strong>${p.nama}</strong><br>
            <small>${p.alamat || ''}</small><br>
            <span style="color: var(--moss); font-weight: 600;">Rp ${Number(p.harga).toLocaleString('id-ID')} / malam</span>
          </div>
        </div>
      `).join("");
    } else {
      penginapanContainer.innerHTML = "<p style='color: gray; font-size: 0.9rem;'>Belum ada rekomendasi penginapan untuk lokasi ini.</p>";
    }
  } catch (error) {
    penginapanContainer.innerHTML = "<p style='color: red;'>Gagal memuat data penginapan.</p>";
  }
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