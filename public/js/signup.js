/* ═══════════════════════════════════════════
   ANCHORPOINT — Signup Page Logic
   ═══════════════════════════════════════════ */

   document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signup-form');
    const msg  = document.getElementById('auth-msg');
  
      // ═══ SHOW/HIDE PASSWORD TOGGLES ═══
  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);

      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
        btn.classList.add('active');
      } else {
        input.type = 'password';
        btn.textContent = 'Show';
        btn.classList.remove('active');
      }
    });
  });
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const name     = document.getElementById('name').value.trim();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm  = document.getElementById('confirm').value;
      const phone    = document.getElementById('phone').value.trim();
  
      // Reset
      msg.textContent = '';
      msg.className = 'auth-msg';
  
      // Client-side validation
      if (!name || !email || !password) {
        return showError('Please fill in all required fields.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showError('Please enter a valid email.');
      }
      if (password.length < 6) {
        return showError('Password must be at least 6 characters.');
      }
      if (password !== confirm) {
        return showError('Passwords do not match.');
      }
  
      // Disable button
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Creating account...';
  
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone })
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || 'Signup failed');
        }
  
        // Save token + user
        localStorage.setItem('anchorpoint_token', data.token);
        localStorage.setItem('anchorpoint_user', JSON.stringify(data.user));
  
        // Success
        msg.textContent = '✅ Account created! Redirecting...';
        msg.className = 'auth-msg success';
  
        setTimeout(function () {
          window.location.href = 'my-shipments.html';
        }, 800);
  
      } catch (err) {
        console.error('Signup error:', err);
        showError(err.message);
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  
function showError(text) {
    msg.textContent = text;
    msg.className = 'auth-msg error';
}
  });