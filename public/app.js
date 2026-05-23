// Global application state and DOM references
const state = {
  products: [],
  cart: [],
  currentView: "products",
  currentCategory: "all",
  searchQuery: "",
  currentUser: null,
  token: localStorage.getItem("token"),
  adminView: "users",
};

const API_BASE = "/api";

const elements = {
  productsSection: document.getElementById("productsSection"),
  cartSection: document.getElementById("cartSection"),
  adminSection: document.getElementById("adminSection"),
  productsGrid: document.getElementById("productsGrid"),
  categoryFilter: document.getElementById("categoryFilter"),
  cartContent: document.getElementById("cartContent"),
  cartBadge: document.getElementById("cartBadge"),
  cartBtn: document.getElementById("cartBtn"),
  clearCartBtn: document.getElementById("clearCartBtn"),
  continueShoppingBtn: document.getElementById("continueShoppingBtn"),
  toastContainer: document.getElementById("toastContainer"),
  checkoutModal: document.getElementById("checkoutModal"),
  closeCheckoutModal: document.getElementById("closeCheckoutModal"),
  checkoutCompleteBtn: document.getElementById("checkoutCompleteBtn"),
  checkoutAmount: document.getElementById("checkoutAmount"),
  navTabs: document.querySelectorAll(".nav-tab"),
  searchInput: document.getElementById("searchInput"),
  searchResultsCount: document.getElementById("searchResultsCount"),
  authBtn: document.getElementById("authBtn"),
  userMenu: document.getElementById("userMenu"),
  userMenuBtn: document.getElementById("userMenuBtn"),
  userDropdown: document.getElementById("userDropdown"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  dropdownName: document.getElementById("dropdownName"),
  dropdownEmail: document.getElementById("dropdownEmail"),
  adminMenuBtn: document.getElementById("adminMenuBtn"),
  authModal: document.getElementById("authModal"),
  authModalTitle: document.getElementById("authModalTitle"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginError: document.getElementById("loginError"),
  registerError: document.getElementById("registerError"),
  profileModal: document.getElementById("profileModal"),
  adminPanelTitle: document.getElementById("adminPanelTitle"),
  adminPanelBody: document.getElementById("adminPanelBody"),
};

// ========================================
// Auth helpers
// ========================================
function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  return headers;
}

function saveAuth(token, user) {
  state.token = token;
  state.currentUser = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  updateAuthUI();
}

function clearAuth() {
  state.token = null;
  state.currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateAuthUI();
}

function updateAuthUI() {
  if (state.currentUser) {
    elements.authBtn.classList.add("hidden");
    elements.userMenu.classList.remove("hidden");
    elements.userAvatar.textContent = state.currentUser.username
      .charAt(0)
      .toUpperCase();
    elements.userName.textContent = state.currentUser.username;
    elements.dropdownName.textContent = state.currentUser.username;
    elements.dropdownEmail.textContent = state.currentUser.email;

    if (state.currentUser.role === "admin") {
      document.querySelector(".admin-tab").classList.remove("hidden");
      elements.adminMenuBtn.classList.remove("hidden");
    }
  } else {
    elements.authBtn.classList.remove("hidden");
    elements.userMenu.classList.add("hidden");
    document.querySelector(".admin-tab").classList.add("hidden");
  }
}

function loadSavedAuth() {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  if (savedToken && savedUser) {
    state.token = savedToken;
    state.currentUser = JSON.parse(savedUser);
    updateAuthUI();
  }
}

// ========================================
// Auth Modal
// ========================================
function showAuthModal() {
  elements.authModal.classList.remove("hidden");
}

function closeAuthModal() {
  elements.authModal.classList.add("hidden");
  elements.loginError.classList.add("hidden");
  elements.registerError.classList.add("hidden");
  elements.loginForm.reset();
  elements.registerForm.reset();
}

function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.authTab === tab);
  });
  elements.loginForm.classList.toggle("hidden", tab !== "login");
  elements.registerForm.classList.toggle("hidden", tab !== "register");
  elements.authModalTitle.textContent =
    tab === "login" ? "Login" : "Create Account";
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");

  errorEl.classList.add("hidden");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (result.success) {
      saveAuth(result.data.token, {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        role: result.data.role,
      });
      closeAuthModal();
      showToast("Welcome back, " + result.data.username + "!", "success");
      await fetchCart();
    } else {
      errorEl.textContent = result.message;
      errorEl.classList.remove("hidden");
    }
  } catch (error) {
    errorEl.textContent = "Login failed. Please try again.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById(
    "registerConfirmPassword",
  ).value;
  const errorEl = document.getElementById("registerError");
  const btn = document.getElementById("registerBtn");

  errorEl.classList.add("hidden");

  if (password !== confirmPassword) {
    errorEl.textContent = "Passwords do not match";
    errorEl.classList.remove("hidden");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating account...";

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const result = await response.json();

    if (result.success) {
      saveAuth(result.data.token, {
        id: result.data.id,
        username: result.data.username,
        email: result.data.email,
        role: result.data.role,
      });
      closeAuthModal();
      showToast(
        "Account created! Welcome, " + result.data.username + "!",
        "success",
      );
    } else {
      errorEl.textContent = result.message;
      errorEl.classList.remove("hidden");
    }
  } catch (error) {
    errorEl.textContent = "Registration failed. Please try again.";
    errorEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

function logout() {
  clearAuth();
  state.cart = [];
  updateCartBadge();
  showToast("Logged out successfully", "info");
  switchView("products");
}

function showProfileModal() {
  if (state.currentUser) {
    document.getElementById("profileUsername").value =
      state.currentUser.username;
    document.getElementById("profileEmail").value =
      state.currentUser.email;
    document.getElementById("profileRole").value = state.currentUser.role;
    elements.profileModal.classList.remove("hidden");
  }
}

function closeProfileModal() {
  elements.profileModal.classList.add("hidden");
}

// User dropdown toggle
elements.userMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  elements.userDropdown.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (
    !elements.userDropdown.contains(e.target) &&
    !elements.userMenuBtn.contains(e.target)
  ) {
    elements.userDropdown.classList.remove("show");
  }
});

// ========================================
// UI feedback helpers
// ========================================
function showToast(message, type = "info") {
  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close">&times;</button>
  `;

  elements.toastContainer.appendChild(toast);

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.remove();
  });

  setTimeout(() => {
    toast.style.animation = "toastIn 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// Data fetching and cart operations
// ========================================
async function fetchProducts() {
  try {
    const params = new URLSearchParams();
    if (state.searchQuery) {
      params.append("search", state.searchQuery);
    }
    if (state.currentCategory !== "all") {
      params.append("category", state.currentCategory);
    }

    const url = `${API_BASE}/products${params.toString() ? "?" + params.toString() : ""}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.success) {
      state.products = result.data;
      renderProducts();
      renderCategoryFilter();
      updateSearchResultsCount();
    } else {
      showToast("Failed to load products: " + result.message, "error");
    }
  } catch (error) {
    showToast("Failed to load products, please refresh", "error");
  }
}

async function fetchCart() {
  if (!state.token) {
    state.cart = [];
    updateCartBadge();
    renderCart();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/cart`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success) {
      state.cart = result.data;
      updateCartBadge();
      renderCart();
    }
  } catch (error) {
    showToast("Failed to load cart", "error");
  }
}

async function addToCart(productId) {
  if (!state.token) {
    showAuthModal();
    showToast("Please login to add items to cart", "info");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    const result = await response.json();
    if (result.success) {
      showToast("Added to cart!", "success");
      await fetchCart();
    } else {
      showToast(
        result.message || "Failed to add, please try again",
        "error",
      );
    }
  } catch (error) {
    showToast("Failed to add, please try again", "error");
  }
}

async function updateCartItem(itemId, quantity) {
  if (!state.token) return;

  try {
    const response = await fetch(`${API_BASE}/cart/${itemId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    const result = await response.json();
    if (result.success) {
      if (result.removed) {
        showToast("Item removed from cart", "info");
      }
      await fetchCart();
    }
  } catch (error) {
    showToast("Failed to update, please try again", "error");
  }
}

async function removeFromCart(itemId) {
  if (!state.token) return;

  try {
    const response = await fetch(`${API_BASE}/cart/${itemId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success) {
      showToast("Item removed from cart", "info");
      await fetchCart();
    }
  } catch (error) {
    showToast("Failed to remove, please try again", "error");
  }
}

async function clearCart() {
  if (!state.token) return;

  try {
    const response = await fetch(`${API_BASE}/cart`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success) {
      showToast("Cart cleared", "info");
      await fetchCart();
    }
  } catch (error) {
    showToast("Failed to clear cart", "error");
  }
}

// ========================================
// Rendering functions for products and cart
// ========================================
function renderProducts() {
  let filteredProducts = state.products;

  if (state.currentCategory && state.currentCategory !== "all") {
    filteredProducts = filteredProducts.filter(
      (p) => p.category === state.currentCategory,
    );
  }

  if (filteredProducts.length === 0) {
    elements.productsGrid.innerHTML = `
      <div class="loading" style="grid-column: 1 / -1;">
        <p style="color: white;">No products found</p>
      </div>
    `;
    return;
  }

  elements.productsGrid.innerHTML = filteredProducts
    .map(
      (product) => `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}" class="product-image"
             onerror="this.src='https://picsum.photos/seed/${product.id}/400/400'">
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
              <span>+</span>
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    `,
    )
    .join("");
}

function renderCategoryFilter() {
  const categories = [...new Set(state.products.map((p) => p.category))];
  elements.categoryFilter.innerHTML = `
    <button class="filter-btn ${state.currentCategory === "all" ? "active" : ""}"
            onclick="filterCategory('all')">All</button>
    ${categories
      .map(
        (cat) => `
      <button class="filter-btn ${state.currentCategory === cat ? "active" : ""}"
              onclick="filterCategory('${cat}')">${cat}</button>
    `,
      )
      .join("")}
  `;
}

function filterCategory(category) {
  state.currentCategory = category;
  renderProducts();
  renderCategoryFilter();
}

function updateSearchResultsCount() {
  if (state.searchQuery) {
    elements.searchResultsCount.textContent = `${state.products.length} found`;
  } else {
    elements.searchResultsCount.textContent = "";
  }
}

function renderCart() {
  if (!state.token) {
    elements.cartContent.innerHTML = `
      <div class="login-required-overlay">
        <div class="login-required-icon">🔒</div>
        <p class="login-required-text">Please login to view your cart</p>
        <button class="login-required-btn" onclick="showAuthModal()">Login / Register</button>
      </div>
    `;
    return;
  }

  if (state.cart.length === 0) {
    elements.cartContent.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p class="cart-empty-text">Your cart is empty</p>
        <button class="cart-empty-btn" onclick="switchView('products')">Continue Shopping</button>
      </div>
    `;
    return;
  }

  const total = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  elements.cartContent.innerHTML = `
    <div class="cart-items">
      ${state.cart
        .map(
          (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image"
               onerror="this.src='https://picsum.photos/seed/${item.product_id}/400/400'">
          <div class="cart-item-info">
            <h3>${item.name}</h3>
            <p>$${item.price.toFixed(2)}</p>
          </div>
          <div class="quantity-control">
            <button class="quantity-btn decrease" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <div style="display: flex; align-items: center;">
            <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="cart-footer">
      <div class="cart-summary">
        <span class="summary-label">Total (${state.cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
        <span class="summary-value">$${total.toFixed(2)}</span>
      </div>
      <button class="checkout-btn" onclick="checkout()">Checkout</button>
    </div>
  `;
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  elements.cartBadge.textContent = count;
  elements.cartBadge.classList.toggle("hidden", count === 0);
}

// ========================================
// Admin functions
// ========================================
async function fetchAdminUsers() {
  try {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success) {
      renderAdminUsers(result.data);
    } else {
      showToast("Failed to load users", "error");
    }
  } catch (error) {
    showToast("Failed to load users", "error");
  }
}

async function fetchAdminCarts() {
  try {
    const response = await fetch(`${API_BASE}/admin/carts`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (result.success) {
      renderAdminCarts(result.data);
    } else {
      showToast("Failed to load carts", "error");
    }
  } catch (error) {
    showToast("Failed to load carts", "error");
  }
}

function renderAdminUsers(users) {
  elements.adminPanelTitle.textContent = `All Users (${users.length})`;

  if (users.length === 0) {
    elements.adminPanelBody.innerHTML = `
      <div class="no-carts">
        <p>No users found</p>
      </div>
    `;
    return;
  }

  elements.adminPanelBody.innerHTML = `
    <table class="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Email</th>
          <th>Role</th>
          <th>Cart Items</th>
          <th>Cart Total</th>
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (user) => `
          <tr>
            <td>#${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${user.cart_items_count}</td>
            <td>$${user.cart_total.toFixed(2)}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderAdminCarts(userCarts) {
  elements.adminPanelTitle.textContent = `Users' Shopping Carts (${userCarts.length})`;

  if (userCarts.length === 0) {
    elements.adminPanelBody.innerHTML = `
      <div class="no-carts">
        <p>No carts found</p>
      </div>
    `;
    return;
  }

  elements.adminPanelBody.innerHTML = `
    <div class="user-carts-container">
      ${userCarts
        .map(
          (user) => `
        <div class="user-cart-card">
          <div class="user-cart-header">
            <div class="user-cart-info">
              <h3>${user.username}</h3>
              <p>${user.email}</p>
            </div>
            <div class="user-cart-total">$${user.total.toFixed(2)}</div>
          </div>
          <div class="user-cart-items">
            ${user.items
              .map(
                (item) => `
              <div class="user-cart-item">
                <img src="${item.image}" alt="${item.product_name}"
                     onerror="this.src='https://picsum.photos/seed/${item.product_id}/400/400'">
                <div class="user-cart-item-info">
                  <h4>${item.product_name}</h4>
                  <p>$${item.price.toFixed(2)} × ${item.quantity}</p>
                </div>
                <div class="user-cart-item-subtotal">$${item.subtotal.toFixed(2)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function switchAdminView(view) {
  state.adminView = view;
  document.querySelectorAll(".admin-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.adminView === view);
  });

  if (view === "users") {
    fetchAdminUsers();
  } else {
    fetchAdminCarts();
  }
}

// ========================================
// View switching and checkout logic
// ========================================
function switchView(view) {
  state.currentView = view;

  elements.productsSection.classList.toggle(
    "hidden",
    view !== "products",
  );
  elements.cartSection.classList.toggle("hidden", view !== "cart");
  elements.adminSection.classList.toggle("hidden", view !== "admin");

  elements.navTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  elements.userDropdown.classList.remove("show");

  if (view === "cart") {
    renderCart();
  } else if (view === "admin" && state.currentUser?.role === "admin") {
    switchAdminView("users");
  }
}

async function checkout() {
  if (!state.token) {
    showAuthModal();
    showToast("Please login to checkout", "info");
    return;
  }

  if (state.cart.length === 0) {
    showToast("Your cart is empty", "error");
    return;
  }

  const total = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  elements.checkoutAmount.textContent = `$${total.toFixed(2)}`;
  elements.checkoutModal.classList.remove("hidden");

  try {
    for (const item of state.cart) {
      await fetch(`${API_BASE}/cart/${item.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    }
    await fetchCart();
  } catch (error) {
    console.error("Failed to clear cart after checkout:", error);
  }
}

// ========================================
// Event listeners
// ========================================
elements.cartBtn.addEventListener("click", () => switchView("cart"));
elements.continueShoppingBtn?.addEventListener("click", () =>
  switchView("products"),
);
elements.clearCartBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear your cart?")) {
    clearCart();
  }
});

elements.navTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (
      tab.dataset.view === "admin" &&
      state.currentUser?.role !== "admin"
    ) {
      showToast("Admin access required", "error");
      return;
    }
    switchView(tab.dataset.view);
  });
});

document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () =>
    switchAdminView(tab.dataset.adminView),
  );
});

elements.closeCheckoutModal.addEventListener("click", () => {
  elements.checkoutModal.classList.add("hidden");
  switchView("products");
});

elements.checkoutCompleteBtn.addEventListener("click", () => {
  elements.checkoutModal.classList.add("hidden");
  switchView("products");
});

elements.checkoutModal.addEventListener("click", (e) => {
  if (e.target === elements.checkoutModal) {
    elements.checkoutModal.classList.add("hidden");
    switchView("products");
  }
});

elements.authModal.addEventListener("click", (e) => {
  if (e.target === elements.authModal) {
    closeAuthModal();
  }
});

elements.profileModal.addEventListener("click", (e) => {
  if (e.target === elements.profileModal) {
    closeProfileModal();
  }
});

let searchTimeout;
elements.searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    fetchProducts();
  }, 300);
});

// ========================================
// App initialization
// ========================================
async function init() {
  loadSavedAuth();
  await fetchProducts();
  await fetchCart();
}

init();
