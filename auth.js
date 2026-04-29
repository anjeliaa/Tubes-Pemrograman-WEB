let currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Catatan: Pembuatan Admin statis dan let users = [] sudah Dihapus 
// karena data sekarang diambil dan dicek langsung ke database MySQL.

document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  try {
    // Memanggil API Register di Node.js
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const result = await response.json();

    if (result.status === "success") {
      alert("Register berhasil! Silakan login.");
      window.location.href = "login.html";
    } else {
      // Menampilkan pesan error dari backend (misal: Email sudah terdaftar)
      alert(result.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan koneksi ke server saat mendaftar.");
  }
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    // Memanggil API Login di Node.js
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.status === "success") {
      currentUser = result.user;
      
      // Simpan session user yang sedang login ke localStorage
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // Redirect berdasarkan role yang didapat dari database
      if (currentUser.role === "admin") {
        window.location.href = "admin/dashboard.html";
      } else {
        window.location.href = "user/dashboard.html";
      }
    } else {
      // Menampilkan pesan error (misal: Password salah / Email tidak ditemukan)
      alert(result.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan koneksi ke server saat login.");
  }
});

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}