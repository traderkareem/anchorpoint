/* ═══════════════════════════════════════════
   ANCHORPOINT — Login Page Logic
   ═══════════════════════════════════════════ */

   document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('login-form');
    const msg  = document.getElementById('auth-msg');
  
    // ═══ SHOW/HIDE PASSWORD TOGGLE ═══
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
  
    // ═══ SUBMIT ═══
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
  
      msg.textContent = '';
      msg.className = 'auth-msg';
  
      if (!email || !password) {
        return showError('Please fill in all fields.');
      }
  
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Logging in...';
  
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }
  
        localStorage.setItem('anchorpoint_token', data.token);
        localStorage.setItem('anchorpoint_user', JSON.stringify(data.user));
  
        msg.textContent = '✅ Logged in! Redirecting...';
        msg.className = 'auth-msg success';
  
        setTimeout(function () {
          if (data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'my-shipments.html';
          }
        }, 700);
  
      } catch (err) {
        console.error('Login error:', err);
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