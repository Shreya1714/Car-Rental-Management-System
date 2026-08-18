'use strict';

if (initPage({ page: 'login', guestOnly: true })) {

  const form = document.getElementById('loginForm');
  const btn  = document.getElementById('loginSubmitBtn');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const res = await Api.login({
        username: fd.get('username').trim(),
        password: fd.get('password')
      });
      Auth.setSession(res.token, res.username, res.role);
      toastAfterRedirect(`Welcome back, ${res.username}!`);
      goAfterLogin(res.role);
    } catch (err) {
      toast(err.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  };

  setupGoogleSignIn('signin_with');
}
