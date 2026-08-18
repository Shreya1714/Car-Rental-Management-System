'use strict';

/* ============================================================
   GOOGLE SIGN-IN — shared by login.html and register.html.

   Google Identity Services hands the browser an ID token; we post it to
   /api/auth/google, the server verifies it against Google's public keys and
   returns the normal app JWT. Nothing else in the app knows the difference.
   ============================================================ */

let googleClientId = null;   // null = not fetched, '' = feature disabled

async function loadGoogleConfig() {
  if (googleClientId !== null) return googleClientId;
  try {
    const cfg = await Api.authConfig();
    googleClientId = (cfg && cfg.googleEnabled && cfg.googleClientId) ? cfg.googleClientId : '';
  } catch (e) {
    googleClientId = '';
  }
  return googleClientId;
}

/** The GSI script is loaded async, so wait briefly for it to appear. */
function waitForGoogleScript(timeoutMs = 6000) {
  return new Promise((resolve) => {
    const started = Date.now();
    (function poll() {
      if (window.google?.accounts?.id) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(poll, 100);
    })();
  });
}

/**
 * Renders the Google button into #googleBtnHost and reveals #googleBlock.
 * If no client id is configured, both stay hidden and the page just works
 * with username + password.
 *
 * @param {'signin_with'|'signup_with'} buttonText
 */
async function setupGoogleSignIn(buttonText = 'signin_with') {
  const clientId = await loadGoogleConfig();
  if (!clientId) return;

  const ready = await waitForGoogleScript();
  if (!ready) return;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleCredential,
    ux_mode: 'popup',
    auto_select: false,
    cancel_on_tap_outside: true
  });

  const host = document.getElementById('googleBtnHost');
  if (!host) return;
  host.innerHTML = '';
  google.accounts.id.renderButton(host, {
    type: 'standard', theme: 'outline', size: 'large',
    text: buttonText, shape: 'rectangular', logo_alignment: 'center', width: 340
  });

  document.getElementById('googleBlock')?.classList.remove('d-none');
}

async function handleGoogleCredential(response) {
  if (!response || !response.credential) {
    toast('Google sign-in was cancelled.', 'warning');
    return;
  }
  try {
    const res = await Api.googleLogin(response.credential);
    Auth.setSession(res.token, res.username, res.role);
    toastAfterRedirect(`Welcome, ${res.username}!`);
    goAfterLogin(res.role);
  } catch (err) {
    toast(err.message || 'Google sign-in failed.', 'danger');
  }
}

/** Send the user to wherever they were headed, or to their role's home page. */
function goAfterLogin(role) {
  const returnTo = sessionStorage.getItem('returnTo');
  sessionStorage.removeItem('returnTo');
  // Only honour same-origin relative paths — never an absolute URL from elsewhere.
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    location.replace(returnTo);
  } else {
    location.replace(Auth.homePage(role));
  }
}
