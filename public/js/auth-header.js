/* ═══════════════════════════════════════════
   ANCHORPOINT — Auth-Aware Header
   Loaded on every page. Updates the header
   based on login state.
   ═══════════════════════════════════════════ */

   (function () {
    document.addEventListener('DOMContentLoaded', function () {
      const container = document.querySelector('.header-actions');
      if (!container) return;
  
      const token = localStorage.getItem('anchorpoint_token');
      const userStr = localStorage.getItem('anchorpoint_user');
  
      // Not logged in — leave default header
      if (!token || !userStr) {
        return;
      }
  
      // Parse user
      let user;
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('anchorpoint_token');
        localStorage.removeItem('anchorpoint_user');
        return;
      }
  
      // Build logged-in header
      const firstName = (user.name || 'Account').split(' ')[0];
      const isAdmin = user.role === 'admin';
  
      let html = '';
      html += '<a href="my-shipments.html" class="btn btn-ghost">My Shipments</a>';
      if (isAdmin) {
        html += '<a href="admin.html" class="btn btn-ghost">Admin</a>';
      }
      html += '<span class="header-user">Hi, ' + escapeHtml(firstName) + '</span>';
      html += '<button id="logout-btn" class="btn btn-accent" type="button">Logout</button>';
  
      container.innerHTML = html;
  
      // Logout handler
      document.getElementById('logout-btn').addEventListener('click', function () {
        localStorage.removeItem('anchorpoint_token');
        localStorage.removeItem('anchorpoint_user');
        window.location.href = 'index.html';
      });
    });
  
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  })();