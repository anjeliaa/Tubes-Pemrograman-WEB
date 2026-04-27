const dataWisata = [
  {
    id: 1,
    nama: "Pantai Panjang",
    lokasi: "Kota Bengkulu",
    kategori: "pantai",
    rating: 4.8,
    deskripsi: "Pantai berpasir putih yang membentang sekitar 7 km, menjadi salah satu pantai terpanjang dan terindah di Bengkulu. Cocok untuk bersantai menikmati sunset dan bermain air.",
    gambar: "../img/pantai panjang.jpg"
  },
  {
    id: 2,
    nama: "Benteng Marlborough",
    lokasi: "Kota Bengkulu",
    kategori: "sejarah",
    rating: 4.6,
    deskripsi: "Benteng peninggalan kolonial Inggris yang dibangun pada abad ke-18. Merupakan salah satu benteng terbesar di Asia Tenggara dan menjadi ikon sejarah Bengkulu.",
    gambar: "../img/benteng malborough.jpg"
  },
  {
    id: 3,
    nama: "Bukit Kaba",
    lokasi: "Kabupaten Rejang Lebong",
    kategori: "alam",
    rating: 4.7,
    deskripsi: "Gunung berapi aktif yang menawarkan pengalaman mendaki yang luar biasa. Di puncaknya terdapat kawah belerang dan pemandangan alam yang menakjubkan di ketinggian 1938 mdpl.",
    gambar: "../img/bukit kaba.jpg"
  },
  {
    id: 4,
    nama: "Pantai Tapak Paderi",
    lokasi: "Kota Bengkulu",
    kategori: "pantai",
    rating: 4.5,
    deskripsi: "Pantai eksotis dengan ombak yang tenang, berpasir kecokelatan, dan panorama samudra Hindia yang memukau. Tempat terbaik untuk menikmati sunrise di Bengkulu.",
    gambar: "../img/mdland.jpg"
  },
  {
    id: 5,
    nama: "Taman Nasional Kerinci Seblat",
    lokasi: "Kabupaten Lebong",
    kategori: "alam",
    rating: 4.9,
    deskripsi: "Kawasan konservasi terluas di Sumatera yang menjadi habitat Bunga Rafflesia Arnoldii, bunga terbesar di dunia. Hutan tropis lebat dengan keanekaragaman hayati yang luar biasa.",
    gambar: "../img/pusat pelatihan gajah.jpg"
  },
  {
    id: 6,
    nama: "Rumah Pengasingan Bung Karno",
    lokasi: "Kota Bengkulu",
    kategori: "sejarah",
    rating: 4.7,
    deskripsi: "Rumah bersejarah tempat Presiden pertama RI, Ir. Soekarno, menjalani masa pengasingan dari tahun 1938–1942. Kini menjadi museum yang menyimpan berbagai koleksi bersejarah.",
    gambar: "../img/rumah bung karno.jpg"
  },
  {
    id: 7,
    nama: "Air Terjun Curup",
    lokasi: "Kabupaten Rejang Lebong",
    kategori: "alam",
    rating: 4.6,
    deskripsi: "Air terjun bertingkat yang dikelilingi hutan hijau yang asri. Aliran airnya yang jernih dan segar menjadi surga tersembunyi bagi pecinta alam di Bengkulu.",
    gambar: "../img/curug trisakti curup.jpg"
  },
  {
    id: 8,
    nama: "Pantai Enggano",
    lokasi: "Pulau Enggano, Bengkulu Utara",
    kategori: "pantai",
    rating: 4.9,
    deskripsi: "Surga tersembunyi di pulau terluar Bengkulu dengan pasir putih bersih, air biru jernih, dan terumbu karang yang masih terjaga. Lokasi snorkeling dan diving terbaik di Bengkulu.",
    gambar: "../img/pantai batu lubang enggano.jpg"
  },
  {
    id: 9,
    nama: "Pulau tikus",
    lokasi: "Kota Bengkulu",
    kategori: "pantai",
    rating: 4.9,
    deskripsi: "Surga tersembunyi di pulau terluar Bengkulu dengan pasir putih bersih, air biru jernih, dan terumbu karang yang masih terjaga. Lokasi snorkeling dan diving terbaik di Bengkulu.",
    gambar: "../img/pulau tikus.jpg"
  }
];

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

/* REVIEW DATA  */
let reviewData = JSON.parse(localStorage.getItem("reviewData")) || {
  1: [
    { user: "Aldi", rating: 5, text: "Pantainya bagus banget!" },
    { user: "Siti", rating: 4, text: "Sunset keren." }
  ],
  2: [
    { user: "Budi", rating: 5, text: "Sejarahnya keren." }
  ]
};

/* FITUR LOGIN & FAVORITE STATE */
let favorites = JSON.parse(localStorage.getItem("userFavorites")) || [];
function getIsLoggedIn() {
  return localStorage.getItem("currentUser") !== null;
}
function getCurrentUserName() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  return user ? (user.name || "User") : "Guest";
}

let selectedRating = 0;
let reviewLimit = 2;
let currentReviewRating = 0;
let isEditing = false;
let editIndex = null;

/* STATE */
let currentSearch = "";
let currentCategory = "semua";
let currentLocation = "semua";
let initialized = false;

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

/* HELPERS */
function stars(rating) {
  return "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);
}

function generateStars(rating) {
  const full = Math.floor(rating);
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

/* FAVORITE LOGIC */
function toggleFavorite(id) {
  if (!getIsLoggedIn()) {
    alert("Silakan login terlebih dahulu untuk menambahkan ke favorit!");
    return;
  }
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
    alert("Berhasil ditambahkan ke favorit!");
  } else {
    favorites.splice(index, 1);
    alert("Dihapus dari favorit.");
  }
  localStorage.setItem("userFavorites", JSON.stringify(favorites));
}

/* FUNGSI RENDER FAVORITES (LOGIKA BARU) */
function renderFavoritesPage() {
  const favoritesGrid = document.getElementById("favoritesGrid");
  const emptyFavorites = document.getElementById("emptyFavorites");

  if (!favoritesGrid) return; // Keluar jika bukan halaman favorites.html

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
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${wisata.gambar}" class="card-img" alt="${wisata.nama}">
        <span class="card-badge ${getBadgeClass(wisata.kategori)}">${capitalize(wisata.kategori)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${wisata.nama}</h3>
        <p class="card-location">${wisata.lokasi}</p>
        <div class="card-rating">
          <span class="stars">${generateStars(wisata.rating)}</span>
          <span>${wisata.rating}</span>
        </div>
        <button class="btn-submit" style="background:#e74c3c; margin-top:10px;" onclick="removeFavorite(${wisata.id})">
          <i class="fa-solid fa-trash"></i> Hapus
        </button>
      </div>
    `;
    favoritesGrid.appendChild(card);
  });
}

window.removeFavorite = function(id) {
  if (confirm("Hapus dari favorit?")) {
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem("userFavorites", JSON.stringify(favorites));
    renderFavoritesPage();
  }
};

/* FILTER */
function filterData() {
  return dataWisata.filter(w => {
    const matchLocation =
      currentLocation === "semua" || w.lokasi === currentLocation;

    const matchSearch =
      w.nama.toLowerCase().includes(currentSearch.toLowerCase()) ||
      w.lokasi.toLowerCase().includes(currentSearch.toLowerCase());

    const matchCategory =
      currentCategory === "semua" || w.kategori === currentCategory;

    return matchSearch && matchCategory && matchLocation;
  });
}

/* RENDER */
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

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${wisata.gambar}" class="card-img" alt="${wisata.nama}" loading="lazy">
        <span class="card-badge ${getBadgeClass(wisata.kategori)}">
          ${capitalize(wisata.kategori)}
        </span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${wisata.nama}</h3>
        <p class="card-location">${wisata.lokasi}</p>
        <div class="card-rating">
          <span class="stars">${generateStars(wisata.rating)}</span>
          <span>${wisata.rating}</span>
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

/* MODAL */
function openModal(id) {
  const wisata = dataWisata.find(w => w.id === id);
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");

  currentOpenId = id;

  const reviews = reviewData[id] || [];
  const isFav = favorites.includes(id);
  const loggedIn = getIsLoggedIn();

  const avg =
    reviews.length
      ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
      : 0;

  content.innerHTML = `
  <img src="${wisata.gambar}" class="modal-img">

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
      <div class="rating-count">(${reviews.length} reviews)</div>
    </div>

    <div id="reviewList" class="review-list"></div>

    <button id="viewMoreReviews" class="btn-link">
      View more
    </button>

    <hr>

    <div id="reviewForm" class="review-form">

      <h4 id="formHeader">Write Review</h4>

      <div id="starInput" class="star-input">
        ${[1,2,3,4,5].map(i => `<span data-star="${i}">★</span>`).join("")}
      </div>

      <textarea id="reviewText" placeholder="${loggedIn ? 'Tulis review...' : 'Harap login untuk menulis review...'}" ${loggedIn ? '' : 'disabled'}></textarea>

      <button id="submitReview" class="btn-submit">
        Submit
      </button>

    </div>

  </div>
`;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  document.getElementById("favBtn").onclick = () => {
    toggleFavorite(id);
    if (getIsLoggedIn()) {
      const icon = document.querySelector("#favBtn i");
      icon.classList.toggle("fa-solid"); icon.classList.toggle("fa-regular");
    }
  };

  renderReviews(id, reviewLimit);
  setupReview(id);
}

/* REVIEW RENDER */
function renderReviews(id, limit = 2) {
  const list = document.getElementById("reviewList");
  const reviews = reviewData[id] || [];
  const currentUser = getCurrentUserName();

  list.innerHTML = reviews.slice(0, limit).map((r, idx) => `
    <div class="review-item">
      <div style="display: flex; justify-content: space-between;">
        <div class="review-user"><strong>${r.user}</strong></div>
        ${(getIsLoggedIn() && r.user === currentUser) ? `
          <div>
            <button onclick="editReview(${id}, ${idx})" class="btn-link" style="color:var(--moss); font-size:0.8rem; margin-right:8px;">Edit</button>
            <button onclick="deleteReview(${id}, ${idx})" class="btn-link" style="color:#e74c3c; font-size:0.8rem;">Hapus</button>
          </div>
        ` : ""}
      </div>
      <div class="stars">${generateStars(r.rating)}</div>
      <div class="review-text">${r.text}</div>
    </div>
  `).join("");
}

/* REVIEW SYSTEM */
function setupReview(id) {
  const stars = document.querySelectorAll("#starInput span");
  const text = document.getElementById("reviewText");
  const btn = document.getElementById("submitReview");
  const viewMore = document.getElementById("viewMoreReviews");

  /* star click */
  stars.forEach(s => {
    s.onclick = () => {
      currentReviewRating = parseInt(s.dataset.star);
      stars.forEach(x => x.style.color = "gray");
      for (let i = 0; i < currentReviewRating; i++) {
        stars[i].style.color = "gold";
      }
    };
  });

  /* submit review */
  btn.onclick = () => {
    if (!getIsLoggedIn()) {
      alert("Kamu harus login dulu!");
      return;
    }

    if (!currentReviewRating || !text.value) {
      alert("Isi rating & review!");
      return;
    }

    if (isEditing) {
      reviewData[id][editIndex] = { user: getCurrentUserName(), rating: currentReviewRating, text: text.value };
      isEditing = false; editIndex = null; btn.textContent = "Submit";
      document.getElementById("formHeader").textContent = "Write Review";
    } else {
      if (!reviewData[id]) reviewData[id] = [];
      reviewData[id].unshift({
        user: getCurrentUserName(),
        rating: currentReviewRating,
        text: text.value
      });
    }

    localStorage.setItem("reviewData", JSON.stringify(reviewData));
    text.value = "";
    currentReviewRating = 0;
    renderReviews(id, reviewLimit);
  };

  /* view more */
  viewMore.onclick = () => {
    if (!getIsLoggedIn()) {
      alert("Login dulu untuk lihat lebih banyak review!");
      return;
    }

    reviewLimit += 5;
    renderReviews(id, reviewLimit);
  };
}

/* GLOBAL ACTIONS FOR REVIEWS */
window.editReview = function(wisataId, idx) {
  const r = reviewData[wisataId][idx];
  const text = document.getElementById("reviewText");
  const btn = document.getElementById("submitReview");
  text.value = r.text; currentReviewRating = r.rating;
  isEditing = true; editIndex = idx; btn.textContent = "Update Review";
  document.getElementById("formHeader").textContent = "Edit Your Review";
  document.getElementById("reviewForm").scrollIntoView({ behavior: "smooth" });
};

window.deleteReview = function(wisataId, idx) {
  if (confirm("Hapus ulasan ini?")) {
    reviewData[wisataId].splice(idx, 1);
    localStorage.setItem("reviewData", JSON.stringify(reviewData));
    renderReviews(wisataId, reviewLimit);
  }
};

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  if (initialized) return;
  initialized = true;

  renderCards(dataWisata);
  renderFavoritesPage(); // Memanggil render untuk halaman favorites

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
    searchInput.value = "";
    currentSearch = "";
    searchClear.style.display = "none";
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

    searchInput.value = "";
    locationFilter.value = "semua";
    searchClear.style.display = "none";

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

    document.querySelectorAll(".card-btn").forEach(btn => {
    btn.onclick = () => openModal(parseInt(btn.dataset.id));
  });

 document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").onclick = (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});

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
  card.classList.add("fade-in");
  observer.observe(card);
});

/* NAV ACTIVE */
window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  navbar.classList.toggle("scrolled", window.scrollY > 60);
});