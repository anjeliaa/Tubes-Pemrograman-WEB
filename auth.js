let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!users.find(u => u.role === "admin")) {
  users.push({
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
    avatar: "img/default-avatar.png",
    isProfileComplete: true
  });

  localStorage.setItem("users", JSON.stringify(users));
}

document.getElementById("registerForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  const exist = users.find(u => u.email === email);
  if (exist) {
    alert("Email sudah terdaftar!");
    return;
  }

  const newUser = {
    name,
    email,
    password,
    role: "user",
    avatar: "img/default-avatar.png",
    bio: "",
    isProfileComplete: false
  };

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Register berhasil! Silakan login.");
  window.location.href = "login.html";
});

document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    alert("Email atau password salah!");
    return;
  }

  currentUser = user;

  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  window.location.href = "user/dashboard.html";
});

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}