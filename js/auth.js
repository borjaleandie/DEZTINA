/**
 * auth.js
 * -----------------------------------------------------------------
 * All Supabase Authentication logic: register, login, logout,
 * password reset, and helpers to protect pages that require a
 * signed-in user (or an admin).
 *
 * A matching `profiles` row is created automatically by a database
 * trigger (see sql/01_schema.sql handle_new_user) whenever a new
 * auth user signs up — so this file never has to insert into
 * profiles directly on registration.
 * -----------------------------------------------------------------
 */

/**
 * Register a new tourist account.
 * @param {{fullName: string, email: string, password: string, confirmPassword: string}} form
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function registerUser({ fullName, email, password, confirmPassword }) {
  if (!fullName || !email || !password || !confirmPassword) {
    return { success: false, message: "Please fill in every field." };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match." };
  }

  const { data, error } = await window.destinaClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } } // read by the handle_new_user trigger
  });

  if (error) {
    return { success: false, message: window.describeError(error, "Registration failed.") };
  }

  return {
    success: true,
    message: data.session
      ? "Account created! Welcome to DESTINA."
      : "Account created! Please check your email to confirm your address."
  };
}
window.registerUser = registerUser;

/**
 * Log in an existing user.
 * @param {{email: string, password: string}} form
 */
async function loginUser({ email, password }) {
  if (!email || !password) {
    return { success: false, message: "Please enter your email and password." };
  }
  const { error } = await window.destinaClient.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: "Invalid email or password." };
  }
  return { success: true, message: "Login successful!" };
}
window.loginUser = loginUser;

/** Send a password-reset email. */
async function sendPasswordReset(email) {
  if (!email) return { success: false, message: "Please enter your email address." };
  const { error } = await window.destinaClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html"
  });
  if (error) return { success: false, message: window.describeError(error) };
  return { success: true, message: "Password reset link sent — check your email." };
}
window.sendPasswordReset = sendPasswordReset;

/** Sign the current user out and redirect home. */
async function logoutUser() {
  await window.destinaClient.auth.signOut();
  window.location.href = "index.html";
}
window.logoutUser = logoutUser;

/** Returns the current session's user, or null. */
async function getCurrentUser() {
  const { data: { session } } = await window.destinaClient.auth.getSession();
  return session?.user || null;
}
window.getCurrentUser = getCurrentUser;

/** Returns true if the signed-in user has role = 'admin'. */
async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  const { data, error } = await window.destinaClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error) return false;
  return data?.role === "admin";
}
window.checkAdmin = checkAdmin;

/**
 * Call at the top of any page that requires a signed-in user.
 * Redirects to login.html (preserving return path) if not authenticated.
 */
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `login.html?redirect=${returnTo}`;
    return null;
  }
  return user;
}
window.requireAuth = requireAuth;

/**
 * Call at the top of any admin/*.html page.
 * Redirects non-admins away entirely (no partial UI flash).
 */
async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    window.location.href = "../index.html";
    return null;
  }
  return user;
}
window.requireAdmin = requireAdmin;
