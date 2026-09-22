/**
 * supabase.js
 * -----------------------------------------------------------------
 * Central Supabase client used by every page.
 *
 * SECURITY: only the public "anon" key belongs here. It is safe to
 * expose in frontend code because every table is protected by Row
 * Level Security (see sql/02_rls_policies.sql). Never put the
 * service-role key or database password in frontend code.
 *
 * Netlify: set SUPABASE_URL and SUPABASE_ANON_KEY as environment
 * variables, then have your build step inject them here, OR simply
 * hardcode the two public values below before deploying (they are
 * not secrets, but keeping them out of source control is good
 * practice — see README "Environment Variables").
 * -----------------------------------------------------------------
 */

// TODO: replace with your project's values (Supabase Dashboard > Project Settings > API)
const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || "https://mnsxsekvyqunuagzdcqp.supabase.co";
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || "sb_publishable_cOgketh-zGr7fd1eoUKMAQ__H-adUDV";

// `supabase` global comes from the CDN script tag included on every page:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
const destinaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Categories users can pick when building a destination recommendation. */
const RECOMMENDATION_CATEGORIES = [
  "Beach", "Mountain", "Waterfall", "Historical", "Adventure",
  "Nature", "Cultural", "Food", "Family", "Relaxation"
];

/**
 * Small shared helper: consistently log + surface Supabase errors.
 * Every module should call this instead of handling errors ad hoc.
 * @param {any} error
 * @param {string} fallbackMessage
 * @returns {string} user-facing message
 */
function describeError(error, fallbackMessage = "Something went wrong. Please try again.") {
  if (!error) return fallbackMessage;
  console.error(error);
  // Supabase error objects usually have a `.message`
  return error.message || fallbackMessage;
}

// Expose on window so plain <script> includes (no bundler) can share it
window.destinaClient = destinaClient;
window.describeError = describeError;
window.RECOMMENDATION_CATEGORIES = RECOMMENDATION_CATEGORIES;
