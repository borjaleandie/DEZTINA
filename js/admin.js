/**
 * admin.js
 * -----------------------------------------------------------------
 * All admin-only data operations. Every function here relies on
 * Supabase RLS admin policies as the real security boundary — the
 * requireAdmin() page guard (auth.js) just prevents the UI from
 * flashing for non-admins; it is not the source of truth for access.
 * -----------------------------------------------------------------
 */

// ---------------------------------------------------------------
// DASHBOARD STATISTICS
// ---------------------------------------------------------------
async function adminGetStats() {
  const client = window.destinaClient;
  const [
    { count: totalUsers },
    { count: totalDestinations },
    { count: totalReviews },
    { count: totalCategories },
    { data: destinationsWithStats }
  ] = await Promise.all([
    client.from("profiles").select("*", { count: "exact", head: true }),
    client.from("destinations").select("*", { count: "exact", head: true }),
    client.from("reviews").select("*", { count: "exact", head: true }),
    client.from("categories").select("*", { count: "exact", head: true }),
    client.from("destinations").select("id, name, popularity, destination_stats(avg_rating, review_count)")
  ]);

  let mostPopular = null, highestRated = null, mostFavorited = null, avgRatingSum = 0, avgRatingCount = 0;
  (destinationsWithStats || []).forEach(d => {
    const stats = d.destination_stats?.[0] || { avg_rating: 0, review_count: 0 };
    if (!mostPopular || (d.popularity || 0) > (mostPopular.popularity || 0)) mostPopular = d;
    if (!highestRated || stats.avg_rating > (highestRated._avg || 0)) highestRated = { ...d, _avg: stats.avg_rating };
    if (stats.avg_rating > 0) { avgRatingSum += stats.avg_rating; avgRatingCount++; }
  });

  // Most favorited (separate query — group by destination_id)
  const { data: favRows } = await client.from("favorites").select("destination_id");
  const favCounts = {};
  (favRows || []).forEach(f => { favCounts[f.destination_id] = (favCounts[f.destination_id] || 0) + 1; });
  const topFavId = Object.entries(favCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  mostFavorited = (destinationsWithStats || []).find(d => d.id === topFavId) || null;

  return {
    totalUsers: totalUsers || 0,
    totalDestinations: totalDestinations || 0,
    totalReviews: totalReviews || 0,
    totalCategories: totalCategories || 0,
    averageRating: avgRatingCount ? (avgRatingSum / avgRatingCount).toFixed(2) : "0.00",
    mostPopular,
    highestRated,
    mostFavorited: mostFavorited ? { ...mostFavorited, _count: favCounts[topFavId] } : null
  };
}
window.adminGetStats = adminGetStats;

// ---------------------------------------------------------------
// DESTINATIONS
// ---------------------------------------------------------------
async function adminGetDestinations({ search = "", categoryId = "" } = {}) {
  let query = window.destinaClient.from("destinations").select("*, categories(id, name)").order("created_at", { ascending: false });
  if (search) query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  return query;
}
window.adminGetDestinations = adminGetDestinations;

async function adminCreateDestination(payload) {
  const { error } = await window.destinaClient.from("destinations").insert(payload);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Destination added successfully." };
}
window.adminCreateDestination = adminCreateDestination;

async function adminUpdateDestination(id, payload) {
  const { error } = await window.destinaClient.from("destinations").update(payload).eq("id", id);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Destination updated successfully." };
}
window.adminUpdateDestination = adminUpdateDestination;

async function adminDeleteDestination(id) {
  const { error } = await window.destinaClient.from("destinations").delete().eq("id", id);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Destination deleted." };
}
window.adminDeleteDestination = adminDeleteDestination;

// ---------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------
async function adminGetCategoriesWithCounts() {
  const { data: categories, error } = await window.destinaClient.from("categories").select("*").order("name");
  if (error) return { data: [], error };
  const { data: destinations } = await window.destinaClient.from("destinations").select("category_id");
  const counts = {};
  (destinations || []).forEach(d => { if (d.category_id) counts[d.category_id] = (counts[d.category_id] || 0) + 1; });
  return { data: categories.map(c => ({ ...c, _count: counts[c.id] || 0 })), error: null };
}
window.adminGetCategoriesWithCounts = adminGetCategoriesWithCounts;

async function adminCreateCategory(name, description) {
  const { error } = await window.destinaClient.from("categories").insert({ name, description });
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Category added successfully." };
}
window.adminCreateCategory = adminCreateCategory;

async function adminUpdateCategory(id, name, description) {
  const { error } = await window.destinaClient.from("categories").update({ name, description }).eq("id", id);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Category updated." };
}
window.adminUpdateCategory = adminUpdateCategory;

async function adminDeleteCategory(id) {
  const { error } = await window.destinaClient.from("categories").delete().eq("id", id);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Category deleted." };
}
window.adminDeleteCategory = adminDeleteCategory;

// ---------------------------------------------------------------
// USERS
// ---------------------------------------------------------------
async function adminGetUsers({ search = "" } = {}) {
  // Never selects auth.users directly — only the public profiles table,
  // which excludes passwords and other sensitive auth internals.
  let query = window.destinaClient.from("profiles").select("id, full_name, email, role, status, created_at").order("created_at", { ascending: false });
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  return query;
}
window.adminGetUsers = adminGetUsers;

async function adminUpdateUserRole(userId, role) {
  const { error } = await window.destinaClient.from("profiles").update({ role }).eq("id", userId);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: `User role updated to ${role}.` };
}
window.adminUpdateUserRole = adminUpdateUserRole;

async function adminToggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === "active" ? "disabled" : "active";
  const { error } = await window.destinaClient.from("profiles").update({ status: newStatus }).eq("id", userId);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: `User ${newStatus === "disabled" ? "disabled" : "re-enabled"}.`, newStatus };
}
window.adminToggleUserStatus = adminToggleUserStatus;

// ---------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------
async function adminGetReviews({ search = "" } = {}) {
  let query = window.destinaClient
    .from("reviews")
    .select("*, profiles(full_name, email), destinations(id, name)")
    .order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) return { data: [], error };
  if (!search) return { data, error: null };
  const s = search.toLowerCase();
  return {
    data: data.filter(r =>
      r.comment?.toLowerCase().includes(s) ||
      r.profiles?.full_name?.toLowerCase().includes(s) ||
      r.destinations?.name?.toLowerCase().includes(s)),
    error: null
  };
}
window.adminGetReviews = adminGetReviews;

async function adminDeleteReview(id) {
  const { error } = await window.destinaClient.from("reviews").delete().eq("id", id);
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Review deleted." };
}
window.adminDeleteReview = adminDeleteReview;

// ---------------------------------------------------------------
// SHARED ADMIN LAYOUT (sidebar + top bar for every admin/*.html page)
// ---------------------------------------------------------------
function renderAdminChrome(activeKey) {
  const root = document.getElementById("admin-shell-root");
  if (!root) return;

  const links = [
    { key: "dashboard", href: "dashboard.html", label: "Dashboard", icon: "layout-dashboard" },
    { key: "destinations", href: "destinations.html", label: "Destinations", icon: "map-pin" },
    { key: "categories", href: "categories.html", label: "Categories", icon: "tag" },
    { key: "users", href: "users.html", label: "Users", icon: "users" },
    { key: "reviews", href: "reviews.html", label: "Reviews", icon: "message-square" }
  ];

  root.innerHTML = `
    <div class="flex min-h-screen bg-sand">
      <aside class="relative hidden w-64 shrink-0 border-r border-tide/10 bg-white lg:block">
        <a href="../index.html" class="flex items-center gap-2 border-b border-tide/10 px-6 py-5 font-display text-xl font-semibold text-tide">
          <i data-lucide="compass" class="h-5 w-5 text-coral"></i> DESTINA <span class="text-xs font-sans font-normal text-ink/40">Admin</span>
        </a>
        <nav class="flex flex-col gap-1 p-4">
          ${links.map(l => `
            <a href="${l.href}" class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${activeKey === l.key ? "bg-coral/10 text-coral" : "text-tide hover:bg-tide/5"}">
              <i data-lucide="${l.icon}" class="h-4 w-4"></i> ${l.label}
            </a>`).join("")}
        </nav>
        <div class="absolute bottom-0 w-64 border-t border-tide/10 p-4">
          <a href="../index.html" class="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-tide hover:bg-tide/5">
            <i data-lucide="arrow-left" class="h-4 w-4"></i> Back to Site
          </a>
        </div>
      </aside>

      <div class="flex-1">
        <header class="flex items-center justify-between border-b border-tide/10 bg-white px-6 py-4 lg:px-10">
          <button id="admin-mobile-menu-btn" class="lg:hidden" aria-label="Open admin menu">
            <i data-lucide="menu" class="h-6 w-6 text-tide"></i>
          </button>
          <h1 class="font-display text-xl font-semibold capitalize text-tide">${activeKey}</h1>
          <div class="flex items-center gap-3">
            <span data-user-name class="hidden text-sm text-ink/60 sm:inline"></span>
            <button onclick="logoutUser()" class="btn-ghost text-sm">Logout</button>
          </div>
        </header>

        <div id="admin-mobile-menu" class="hidden border-b border-tide/10 bg-white p-4 lg:hidden">
          ${links.map(l => `<a href="${l.href}" class="block rounded-xl px-4 py-2.5 text-sm font-medium ${activeKey === l.key ? "text-coral" : "text-tide"}">${l.label}</a>`).join("")}
        </div>

        <main id="admin-main" class="p-6 lg:p-10"></main>
      </div>
    </div>`;

  document.getElementById("admin-mobile-menu-btn")?.addEventListener("click", () => {
    document.getElementById("admin-mobile-menu")?.classList.toggle("hidden");
  });

  if (window.lucide) window.lucide.createIcons();
}
window.renderAdminChrome = renderAdminChrome;
