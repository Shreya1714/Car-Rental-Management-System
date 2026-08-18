'use strict';

if (initPage({ page: 'support', requires: 'CUSTOMER', chat: true })) {

  const FAQ = [
    ['How do I cancel a booking?',
     'Go to My Reservations, find the booking and click Cancel. Cancellations are free if made 24h before the pick-up date.'],
    ['When is payment charged?',
     'Payment is processed immediately when you click Pay Now. The booking stays as Pending until payment is completed.'],
    ['Can I modify my booking dates?',
     'Currently modifications are not supported online. Contact support and we will adjust your booking manually.'],
    ['What documents do I need?',
     'A valid driving licence and a government-issued ID are required at pickup.'],
    ['Why does a car disappear from search?',
     'Availability is checked day by day. If someone books it for an overlapping date range, it drops out of your results.']
  ];

  document.getElementById('faqList').innerHTML = FAQ.map(([q, a]) => `
    <div class="faq-item">
      <div class="faq-q">${escapeHtml(q)}</div>
      <div class="faq-a">${escapeHtml(a)}</div>
    </div>`).join('');

  // Not wired to a backend endpoint — the confirmation is simulated.
  const form = document.getElementById('supportForm');
  const btn  = document.getElementById('supportSubmitBtn');
  form.onsubmit = (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Sent!';
    toast('Your message has been sent. We will get back to you within 24 hours.');
    form.reset();
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send me-1"></i>Send Message';
    }, 3000);
  };
}
