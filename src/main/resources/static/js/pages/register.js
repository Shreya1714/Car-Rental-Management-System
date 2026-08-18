'use strict';

if (initPage({ page: 'register', guestOnly: true })) {

  const form = document.getElementById('registerForm');
  const btn  = document.getElementById('registerSubmitBtn');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const res = await Api.register({
        fullName: fd.get('fullName').trim() || null,
        username: fd.get('username').trim(),
        email:    fd.get('email').trim(),
        phone:    fd.get('phone').trim() || null,
        password: fd.get('password')
      });
      Auth.setSession(res.token, res.username, res.role);
      toastAfterRedirect('Account created — welcome!');
      goAfterLogin(res.role);
    } catch (err) {
      toast(err.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  };

  setupGoogleSignIn('signup_with');
}
