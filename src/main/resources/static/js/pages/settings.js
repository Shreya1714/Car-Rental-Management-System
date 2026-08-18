'use strict';

if (initPage({ page: 'settings', requires: 'ANY' })) {

  document.getElementById('acctUsername').textContent = Auth.getUsername() || '—';
  document.getElementById('acctRole').textContent =
    Auth.getRole() === 'ADMIN' ? 'Administrator' : 'Customer';

  const form = document.getElementById('changePasswordForm');
  const btn  = document.getElementById('changePasswordBtn');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    btn.disabled = true;
    try {
      await Api.changePassword({
        currentPassword: fd.get('currentPassword'),
        newPassword: fd.get('newPassword')
      });
      toast('Password updated successfully');
      form.reset();
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  };
}
