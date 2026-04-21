/* ================================================================
   SoulSync - UI Utilities
   Toast, Modal, Sidebar, Theme, WebSocket, Shared Components
   ================================================================ */

// ================================================================
// TOAST NOTIFICATIONS
// ================================================================
const Toast = (() => {
  let container;
  const init = () => {
    container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
  };
  const show = (message, type = "info", duration = 3500) => {
    init();
    const icons = { success: "✅", error: "❌", info: "💬", warning: "⚠️" };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || "ℹ️"}</span>
      <span class="toast-message">${message}</span>
      <button onclick="this.closest('.toast').classList.add('hide')" style="margin-left:auto;opacity:0.5;font-size:1.1rem;">×</button>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };
  return {
    success: (m, d) => show(m, "success", d),
    error:   (m, d) => show(m, "error", d),
    info:    (m, d) => show(m, "info", d),
    warn:    (m, d) => show(m, "warning", d),
  };
})();

// ================================================================
// MODAL MANAGER
// ================================================================
const Modal = (() => {
  const open = (id) => {
    const el = document.getElementById(id);
    if (el) { el.classList.add("open"); document.body.style.overflow = "hidden"; }
  };
  const close = (id) => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("open"); document.body.style.overflow = ""; }
  };
  const closeAll = () => {
    document.querySelectorAll(".modal-overlay.open").forEach(m => {
      m.classList.remove("open");
    });
    document.body.style.overflow = "";
  };
  // Close on overlay click
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) closeAll();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  return { open, close, closeAll };
})();

// ================================================================
// THEME MANAGER
// ================================================================
const Theme = (() => {
  const STORAGE_KEY = "ss_theme";
  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // update toggle icons
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  };
  const toggle = () => {
    const current = localStorage.getItem(STORAGE_KEY) || "light";
    apply(current === "dark" ? "light" : "dark");
  };
  const init = () => {
    const saved = localStorage.getItem(STORAGE_KEY) || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    apply(saved);
  };
  return { init, toggle, apply };
})();

// ================================================================
// SIDEBAR MANAGER
// ================================================================
const Sidebar = (() => {
  const toggle = () => document.querySelector(".sidebar")?.classList.toggle("open");
  const close  = () => document.querySelector(".sidebar")?.classList.remove("open");
  const setActive = (page) => {
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add("active");
  };
  return { toggle, close, setActive };
})();

// ================================================================
// WEBSOCKET MANAGER  
// ================================================================
const WS = (() => {
  let stompClient = null;
  let subscriptions = {};

  const connect = (coupleId, userId) => {
    const token = API.getToken();
    if (!token) return;

    // Load SockJS + STOMP from CDN if not already loaded
    if (!window.SockJS || !window.Stomp) {
      console.warn("WebSocket libraries not loaded");
      return;
    }

    const socket = new SockJS("http://localhost:8080/api/ws");
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Silence debug logs

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        console.log("WS connected");
        // Subscribe to couple chat
        subscribe(`/topic/couple/${coupleId}/messages`, (msg) => {
          document.dispatchEvent(new CustomEvent("ws:message", { detail: JSON.parse(msg.body) }));
        });
        // Subscribe to typing
        subscribe(`/topic/couple/${coupleId}/typing`, (msg) => {
          document.dispatchEvent(new CustomEvent("ws:typing", { detail: JSON.parse(msg.body) }));
        });
        // Subscribe to mood updates
        subscribe(`/topic/couple/${coupleId}/mood`, (msg) => {
          document.dispatchEvent(new CustomEvent("ws:mood", { detail: JSON.parse(msg.body) }));
        });
        // Subscribe to love notes
        subscribe(`/topic/couple/${coupleId}/love-notes`, (msg) => {
          document.dispatchEvent(new CustomEvent("ws:love-note", { detail: JSON.parse(msg.body) }));
        });
        // Subscribe to personal notifications
        subscribe(`/user/${userId}/queue/notifications`, (msg) => {
          document.dispatchEvent(new CustomEvent("ws:notification", { detail: JSON.parse(msg.body) }));
        });
      },
      (err) => console.warn("WS error:", err)
    );
  };

  const subscribe = (dest, callback) => {
    if (!stompClient) return;
    subscriptions[dest] = stompClient.subscribe(dest, callback);
  };

  const send = (dest, body) => {
    if (stompClient?.connected) {
      stompClient.send("/app" + dest, {}, JSON.stringify(body));
    }
  };

  const disconnect = () => {
    if (stompClient?.connected) stompClient.disconnect();
  };

  return { connect, send, disconnect };
})();

// ================================================================
// DATE / TIME HELPERS
// ================================================================
const DateUtil = {
  formatRelative: (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs  < 24) return `${hrs}h ago`;
    if (days < 7)  return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
  formatTime: (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  },
  formatDate: (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  },
  daysUntil: (dateStr) => {
    const target = new Date(dateStr);
    const today  = new Date(); today.setHours(0,0,0,0);
    target.setHours(0,0,0,0);
    return Math.ceil((target - today) / 86400000);
  },
  countdown: (dateStr) => {
    const target = new Date(dateStr).getTime();
    const now    = Date.now();
    const diff   = target - now;
    if (diff <= 0) return "Today!";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
};

// ================================================================
// SHARED LAYOUT BUILDER
// ================================================================
const Layout = {
  buildSidebar: (activePage) => {
    const user = AppState.get();
    const nav = [
      { page: "dashboard",  icon: "🏠", label: "Dashboard" },
      { page: "chat",       icon: "💬", label: "Chat",        badge: 0 },
      { page: "timeline",   icon: "📸", label: "Memories" },
      { page: "moods",      icon: "💫", label: "Mood Tracker" },
      { page: "dates",      icon: "🗓️",  label: "Special Dates" },
      { page: "notes",      icon: "💌", label: "Love Notes" },
      { page: "settings",   icon: "⚙️", label: "Settings" },
    ];
    const initials = user?.displayName ? user.displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "U";
    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">💗</div>
          <span class="logo-text">SoulSync</span>
        </div>
        <nav>
          <div class="nav-group">
            <span class="nav-label">Navigate</span>
            ${nav.map(n => `
              <a class="nav-link${n.page === activePage ? " active" : ""}" data-page="${n.page}" href="/pages/${n.page}.html">
                <span class="nav-icon">${n.icon}</span>
                <span>${n.label}</span>
                ${n.badge !== undefined ? `<span class="nav-badge" id="badge-${n.page}" style="${n.badge===0?"display:none":""}">${n.badge}</span>` : ""}
              </a>
            `).join("")}
          </div>
        </nav>
        <div class="sidebar-footer">
          <button class="user-card" onclick="window.location='/pages/settings.html'">
            <div class="avatar user-avatar">${user?.avatarUrl ? `<img src="${user.avatarUrl}" alt="">` : initials}</div>
            <div class="user-info">
              <div class="user-name">${user?.displayName || "User"}</div>
              <div class="user-status">@${user?.username || ""}</div>
            </div>
            <span style="color:var(--text-muted)">›</span>
          </button>
        </div>
      </aside>
    `;
  },

  buildTopbar: (title) => `
    <header class="topbar">
      <button class="btn-icon" id="sidebar-toggle" onclick="Sidebar.toggle()" style="display:none">☰</button>
      <h1 class="topbar-title">${title}</h1>
      <div class="topbar-right">
        <button class="topbar-btn" id="theme-toggle" onclick="Theme.toggle()" title="Toggle theme">🌙</button>
        <button class="topbar-btn" onclick="window.location='/pages/notifications.html'" title="Notifications">
          🔔<span class="notif-dot" id="notif-dot" style="display:none"></span>
        </button>
        <button class="topbar-btn" onclick="logout()" title="Logout">🚪</button>
      </div>
    </header>
  `,

  init: async (page, title) => {
    if (!requireAuth()) return;
    Theme.init();
    Sidebar.setActive(page);

    // Load unread notification count
    try {
      const data = await API.notifs.unread();
      if (data?.unreadCount > 0) {
        const dot = document.getElementById("notif-dot");
        const badge = document.getElementById("badge-chat");
        if (dot) dot.style.display = "block";
        if (badge) { badge.textContent = data.unreadCount; badge.style.display = "flex"; }
      }
    } catch {}
  }
};

// Logout helper
async function logout() {
  try { await API.auth.logout(); } catch {}
  API.clearTokens();
  AppState.clear();
  window.location.href = "/index.html";
}

// Init theme on all pages
document.addEventListener("DOMContentLoaded", Theme.init);