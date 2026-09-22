/**
 * main.js
 * -----------------------------------------------------------------
 * Shared UI behavior used on every page: toast notifications,
 * mobile hamburger menu, and syncing the navbar to auth state.
 * Depends on supabase.js (must be loaded first) and auth.js.
 * -----------------------------------------------------------------
 */

/** Show a small toast message in the bottom-right corner. */
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "fixed bottom-4 right-4 z-[100] flex flex-col gap-2";
    document.body.appendChild(container);
  }

  const colors = {
    success: "bg-leaf text-white",
    error: "bg-coral-dark text-white",
    info: "bg-tide text-white"
  };

  const toast = document.createElement("div");
  toast.className = `${colors[type] || colors.info} rounded-xl px-4 py-3 shadow-lg text-sm font-medium max-w-xs animate-[fadeIn_0.2s_ease-out]`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
window.showToast = showToast;

/** Convenience helpers used by page-specific scripts while data loads. */
function showLoading(el, message = "Loading...") {
  if (!el) return;
  el.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-tide/60">
      <svg class="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <p>${message}</p>
    </div>`;
}
window.showLoading = showLoading;

function showEmpty(el, message = "Nothing here yet.", icon = "compass") {
  if (!el) return;
  el.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-center text-tide/60">
      <i data-lucide="${icon}" class="h-10 w-10"></i>
      <p class="max-w-xs">${message}</p>
    </div>`;
  if (window.lucide) window.lucide.createIcons();
}
window.showEmpty = showEmpty;

/** Mobile hamburger menu toggle. Expects #mobile-menu-btn and #mobile-menu in the navbar partial. */
function initMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const isOpen = !menu.classList.contains("hidden");
    menu.classList.toggle("hidden", isOpen);
    btn.setAttribute("aria-expanded", String(!isOpen));
  });
}

/**
 * Updates every navbar (desktop + mobile) to reflect the current session:
 * shows Login/Register when signed out, or an avatar/menu + Logout when signed in.
 * Also reveals any element marked [data-admin-only] if the user is an admin.
 */
async function syncNavbarAuthState() {
  const { data: { session } } = await window.destinaClient.auth.getSession();
  const guestEls = document.querySelectorAll("[data-auth='guest']");
  const userEls = document.querySelectorAll("[data-auth='user']");

  if (!session) {
    guestEls.forEach(el => el.classList.remove("hidden"));
    userEls.forEach(el => el.classList.add("hidden"));
    return;
  }

  guestEls.forEach(el => el.classList.add("hidden"));
  userEls.forEach(el => el.classList.remove("hidden"));

  const { data: profile } = await window.destinaClient
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", session.user.id)
    .single();

  document.querySelectorAll("[data-user-name]").forEach(el => {
    el.textContent = profile?.full_name || session.user.email;
  });
  document.querySelectorAll("[data-user-avatar]").forEach(el => {
    if (profile?.avatar_url) el.src = profile.avatar_url;
  });

  const isAdmin = profile?.role === "admin";
  document.querySelectorAll("[data-admin-only]").forEach(el => {
    el.classList.toggle("hidden", !isAdmin);
  });
}
window.syncNavbarAuthState = syncNavbarAuthState;

/**
 * Renders the GWTD-compliant site chrome:
 *   Top Bar → Masthead → Auxiliary Menu   (into #navbar-root)
 *   Agency Footer → Standard Footer        (into #footer-root)
 *
 * Per the Government Website Template Design (GWTD) Guidelines (Annex C
 * to the GWHS Memorandum Circular, DICT / iGovPhil Program):
 *   - Top Bar: Republic Seal, Home, Transparency, Products & Services,
 *     Contact Us, site search, Citizen's Charter link.
 *   - Masthead: Agency Logo (<=100px height), "Republic of the
 *     Philippines", divider, optional Department Name, Agency Name/tagline.
 *   - Auxiliary Menu: max two navigation levels (this site uses one).
 *   - Agency Footer (repeats on every page): Downloads, Archives,
 *     Site Map, FAQs.
 *   - Standard Footer: Government Directory link, Seal of the Republic,
 *     "All content is public domain unless otherwise stated."
 *
 * NOTE ON PLACEHOLDER ASSETS: the Republic Seal and Agency Logo below
 * are clearly-labeled placeholders (inline SVG), not official artwork.
 * Replace REPUBLIC_SEAL_SVG and the masthead logo block with your
 * agency's actual, approved assets before publishing — see README.
 * Likewise, "Department Name" and "Agency Name" are examples; set them
 * to your real department/LGU and office name.
 * @param {string} base "" on top-level pages, "../" inside /admin
 */
const REPUBLIC_SEAL_SVG = `
  <svg viewBox="0 0 40 40" class="h-6 w-6 shrink-0" aria-label="Republic Seal placeholder" role="img">
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1"/>
    <path d="M20 10 L22.5 17.5 L30 17.5 L24 22 L26 29.5 L20 25 L14 29.5 L16 22 L10 17.5 L17.5 17.5 Z" fill="currentColor"/>
  </svg>`;

function renderChrome(base = "") {
  const navRoot = document.getElementById("navbar-root");
  const current = document.body.dataset.page || "";

  const navLink = (href, label, key) => `
    <a href="${base}${href}" class="text-sm font-medium transition hover:text-coral ${current === key ? "text-coral" : "text-tide"}">${label}</a>`;

  if (navRoot) {
    navRoot.innerHTML = `
      <header class="sticky top-0 z-50">

        <!-- TOP BAR -->
        <div class="bg-tide-dark text-sand/90">
          <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-1 px-6 py-1.5 text-xs sm:px-10 lg:px-16">
            <span class="flex items-center gap-1.5 text-sand" title="Republic Seal (placeholder — replace with official asset)">
              ${REPUBLIC_SEAL_SVG}
            </span>
            <a href="${base}index.html" class="hover:text-coral">Home</a>
            <a href="${base}transparency.html" class="hover:text-coral">Transparency</a>
            <a href="${base}products-services.html" class="hover:text-coral">Products &amp; Services</a>
            <a href="${base}contact.html" class="hover:text-coral">Contact Us</a>
            <a href="${base}citizens-charter.html" class="hover:text-coral">Citizen's Charter</a>
            <form action="${base}destinations.html" method="get" class="ml-auto flex items-center gap-1.5" role="search">
              <label for="topbar-search" class="sr-only">Search this site</label>
              <input id="topbar-search" name="q" type="text" placeholder="Search this site..."
                     class="hidden w-40 rounded-full border-0 bg-white/10 px-3 py-1 text-xs text-white placeholder:text-sand/50 focus:bg-white/20 focus:outline-none sm:block">
              <button type="submit" class="rounded-full p-1 hover:bg-white/10" aria-label="Search">
                <i data-lucide="search" class="h-3.5 w-3.5"></i>
              </button>
            </form>
          </div>
        </div>

        <!-- MASTHEAD -->
        <div class="border-b border-tide/10 bg-white">
          <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3 sm:px-10 lg:px-16">
            <div class="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg bg-tide text-white" title="Agency Logo placeholder — max 100px height">
              <i data-lucide="compass" class="h-7 w-7 text-coral"></i>
            </div>
            <div class="hidden h-10 w-px bg-tide/15 sm:block" aria-hidden="true"></div>
            <div class="leading-tight">
              <p class="text-xs font-medium uppercase tracking-wide text-ink/50">Republic of the Philippines</p>
              <p class="text-xs text-ink/40">Department of Tourism · Local Tourism Office <span class="italic">(sample — replace with your agency)</span></p>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <a href="${base}index.html" class="flex items-center gap-2 font-display text-2xl font-semibold text-tide">
                DESTINA
              </a>
            </div>
            <p class="w-full font-display text-sm italic text-coral sm:hidden">Discover. Explore. Experience.</p>
          </div>
        </div>

        <!-- AUXILIARY MENU -->
        <nav class="border-b border-tide/10 bg-sand/80 backdrop-blur" aria-label="Auxiliary Menu">
          <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-10 lg:px-16">
            <div class="hidden items-center gap-8 md:flex">
              ${navLink("index.html", "Home", "home")}
              ${navLink("destinations.html", "Destinations", "destinations")}
              ${navLink("map.html", "Map", "map")}
              ${navLink("recommendations.html", "Recommendations", "recommendations")}
              ${navLink("about.html", "About", "about")}
              ${navLink("faq.html", "FAQs", "faq")}
            </div>

            <div class="hidden items-center gap-3 md:flex">
              <div data-auth="guest" class="flex items-center gap-3">
                <a href="${base}login.html" class="btn-ghost">Login</a>
                <a href="${base}register.html" class="btn-primary">Register</a>
              </div>
              <div data-auth="user" class="hidden items-center gap-4">
                <a href="${base}favorites.html" class="text-tide hover:text-coral" title="Favorites"><i data-lucide="heart" class="h-5 w-5"></i></a>
                <a href="${base}admin/dashboard.html" data-admin-only class="hidden text-tide hover:text-coral" title="Admin dashboard"><i data-lucide="shield" class="h-5 w-5"></i></a>
                <a href="${base}profile.html" class="flex items-center gap-2 text-sm font-medium text-tide hover:text-coral">
                  <img data-user-avatar src="https://api.dicebear.com/7.x/initials/svg?seed=U" class="h-8 w-8 rounded-full border border-tide/20 object-cover" alt="">
                  <span data-user-name>Account</span>
                </a>
                <button onclick="logoutUser()" class="btn-ghost">Logout</button>
              </div>
            </div>

            <button id="mobile-menu-btn" class="md:hidden" aria-label="Open menu" aria-expanded="false">
              <i data-lucide="menu" class="h-6 w-6 text-tide"></i>
            </button>
          </div>

          <div id="mobile-menu" class="hidden border-t border-tide/10 bg-sand px-6 py-4 md:hidden">
            <div class="flex flex-col gap-4">
              ${navLink("index.html", "Home", "home")}
              ${navLink("destinations.html", "Destinations", "destinations")}
              ${navLink("map.html", "Map", "map")}
              ${navLink("recommendations.html", "Recommendations", "recommendations")}
              ${navLink("about.html", "About", "about")}
              ${navLink("faq.html", "FAQs", "faq")}
              <hr class="border-tide/10">
              <div data-auth="guest" class="flex flex-col gap-3">
                <a href="${base}login.html" class="btn-secondary w-full">Login</a>
                <a href="${base}register.html" class="btn-primary w-full">Register</a>
              </div>
              <div data-auth="user" class="hidden flex-col gap-3">
                <a href="${base}profile.html" class="btn-secondary w-full">My Profile</a>
                <a href="${base}favorites.html" class="btn-secondary w-full">Favorites</a>
                <a href="${base}admin/dashboard.html" data-admin-only class="hidden btn-secondary w-full">Admin Dashboard</a>
                <button onclick="logoutUser()" class="btn-primary w-full">Logout</button>
              </div>
            </div>
          </div>
        </nav>
      </header>`;
  }

  const footerRoot = document.getElementById("footer-root");
  if (footerRoot) {
    footerRoot.innerHTML = `
      <footer>
        <!-- AGENCY FOOTER (repeats identically on every page) -->
        <div class="border-t border-tide/10 bg-tide text-sand/80">
          <div class="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
            <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div class="flex items-center gap-2 font-display text-xl font-semibold text-white">
                  <i data-lucide="compass" class="h-5 w-5 text-coral"></i> DESTINA
                </div>
                <p class="mt-3 text-sm leading-relaxed">Discover. Explore. Experience.</p>
              </div>
              <div>
                <h4 class="mb-3 text-sm font-semibold text-white">Explore</h4>
                <ul class="space-y-2 text-sm">
                  <li><a href="${base}destinations.html" class="hover:text-coral">Destinations</a></li>
                  <li><a href="${base}map.html" class="hover:text-coral">Map</a></li>
                  <li><a href="${base}recommendations.html" class="hover:text-coral">Recommendations</a></li>
                </ul>
              </div>
              <div>
                <h4 class="mb-3 text-sm font-semibold text-white">Agency Footer</h4>
                <ul class="space-y-2 text-sm">
                  <li><a href="${base}downloads.html" class="hover:text-coral">Downloads</a></li>
                  <li><a href="${base}archives.html" class="hover:text-coral">Archives</a></li>
                  <li><a href="${base}sitemap.html" class="hover:text-coral">Site Map</a></li>
                  <li><a href="${base}faq.html" class="hover:text-coral">FAQs</a></li>
                </ul>
              </div>
              <div>
                <h4 class="mb-3 text-sm font-semibold text-white">Open Access</h4>
                <ul class="space-y-2 text-sm">
                  <li><a href="${base}transparency.html" class="hover:text-coral">Transparency Seal</a></li>
                  <li><a href="${base}citizens-charter.html" class="hover:text-coral">Citizen's Charter</a></li>
                  <li><a href="${base}privacy.html" class="hover:text-coral">Data Privacy</a></li>
                  <li><a href="${base}contact.html" class="hover:text-coral">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- STANDARD FOOTER (government-wide band) -->
        <div class="bg-tide-dark text-sand/70">
          <div class="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-6 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left lg:px-16">
            <div class="flex items-center gap-3">
              <span title="Seal of the Republic of the Philippines (placeholder)">${REPUBLIC_SEAL_SVG}</span>
              <a href="https://www.gov.ph" target="_blank" rel="noopener" class="text-xs font-medium hover:text-coral">
                Official Directory of Philippine Government Websites
              </a>
            </div>
            <p class="text-xs">All content is public domain unless otherwise stated.</p>
          </div>
        </div>
      </footer>`;
  }

  if (window.lucide) window.lucide.createIcons();
}
window.renderChrome = renderChrome;

document.addEventListener("DOMContentLoaded", () => {
  const base = document.body.dataset.base ?? "";
  renderChrome(base);
  initMobileMenu();
  if (window.destinaClient) syncNavbarAuthState();
  if (window.lucide) window.lucide.createIcons();
});
