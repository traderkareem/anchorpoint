/* ═══════════════════════════════════════════
   ANCHORPOINT — My Shipments Page
   ═══════════════════════════════════════════ */

   document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('anchorpoint_token');
  
    // Not logged in → redirect to login
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
  
    loadMyShipments();
  });
  
  async function loadMyShipments() {
    const token = localStorage.getItem('anchorpoint_token');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('empty');
    const list = document.getElementById('shipment-list');
  
    loading.hidden = false;
    empty.hidden = true;
    list.hidden = true;
  
    try {
      const res = await fetch('/api/shipments/user/mine', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
  
      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('anchorpoint_token');
        localStorage.removeItem('anchorpoint_user');
        window.location.href = 'login.html';
        return;
      }
  
      const data = await res.json();
      loading.hidden = true;
  
      // Update stats
      const shipments = data.shipments || [];
      const stats = {
        total: shipments.length,
        pending: shipments.filter(function (s) { return s.status === 'pending'; }).length,
        inTransit: shipments.filter(function (s) { return s.status === 'in_transit'; }).length,
        delivered: shipments.filter(function (s) { return s.status === 'delivered'; }).length
      };
  
      document.getElementById('stat-total').textContent = stats.total;
      document.getElementById('stat-pending').textContent = stats.pending;
      document.getElementById('stat-transit').textContent = stats.inTransit;
      document.getElementById('stat-delivered').textContent = stats.delivered;
  
      // Empty state
      if (!shipments.length) {
        empty.hidden = false;
        return;
      }
  
      // Render list
      renderShipments(shipments);
      list.hidden = false;
  
    } catch (err) {
      console.error('Load error:', err);
      loading.textContent = 'Failed to load shipments. Please refresh.';
    }
  }
  
  function renderShipments(shipments) {
    const list = document.getElementById('shipment-list');
    list.innerHTML = '';
  
    shipments.forEach(function (s) {
      const card = document.createElement('div');
      card.className = 'ship-card';
      card.dataset.tracking = s.trackingNumber;
  
      card.innerHTML =
        '<div class="ship-tracking">' + s.trackingNumber + '</div>' +
        '<div class="ship-route">' +
          '<small>To</small>' +
          s.receiver.city + ', ' + s.receiver.country +
        '</div>' +
        '<div class="ship-service">' + titleCase(s.service) + ' · ' + s.package.weight + ' kg</div>' +
        '<div class="ship-price">$' + s.price.toFixed(2) + '</div>' +
        '<div><span class="ship-status ' + s.status + '">' + s.statusLabel + '</span></div>';
  
      card.addEventListener('click', function () {
        window.location.href = 'track.html?tracking=' + s.trackingNumber;
      });
  
      list.appendChild(card);
    });
  }
  
  function titleCase(str) {
    if (!str) return '';
    return str.split('-').map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }