/* ═══════════════════════════════════════════
   ANCHORPOINT — Admin Dashboard Logic (fixed)
   ═══════════════════════════════════════════ */

   let currentFilter = 'all';
   let currentSearch = '';
   
   // ═══ ADMIN GUARD ═══
// Redirect to login if not authenticated as admin
(function () {
  const token = localStorage.getItem('anchorpoint_token');
  const userStr = localStorage.getItem('anchorpoint_user');

  if (!token || !userStr) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      // Logged in but not admin
      alert('Admin access required.');
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    localStorage.removeItem('anchorpoint_token');
    localStorage.removeItem('anchorpoint_user');
    window.location.href = 'login.html';
  }
})();

   document.addEventListener('DOMContentLoaded', () => {
     attachFilters();
     attachSearch();
     attachDrawerClose();
     attachRefresh();
     attachAddEvent();
     attachDelete();
     loadShipments();
   });
   
   // ═══ FILTERS ═══
   function attachFilters() {
     const tabs = document.querySelectorAll('.filter-tab');
     tabs.forEach(function (tab) {
       tab.addEventListener('click', function () {
         tabs.forEach(function (t) { t.classList.remove('active'); });
         tab.classList.add('active');
         currentFilter = tab.dataset.status;
         loadShipments();
       });
     });
   }
   
   // ═══ SEARCH ═══
   function attachSearch() {
     const input = document.getElementById('search-input');
     let timer;
     input.addEventListener('input', function () {
       clearTimeout(timer);
       timer = setTimeout(function () {
         currentSearch = input.value.trim();
         loadShipments();
       }, 300);
     });
   }
   
   // ═══ REFRESH ═══
   function attachRefresh() {
     document.getElementById('refresh-btn').addEventListener('click', loadShipments);
   }
   
   // ═══ LOAD SHIPMENTS ═══
   async function loadShipments() {
     const loading = document.getElementById('loading');
     const table   = document.getElementById('shipments-table');
     const empty   = document.getElementById('empty-state');
   
     loading.hidden = false;
     table.hidden = true;
     empty.hidden = true;
   
     try {
       let url = '/api/shipments?';
       if (currentFilter !== 'all') url += 'status=' + currentFilter + '&';
       if (currentSearch) url += 'search=' + encodeURIComponent(currentSearch);
   
       const response = await fetch(url);
       const data = await response.json();
   
       // Stats
       document.getElementById('stat-total').textContent     = data.stats.total;
       document.getElementById('stat-pending').textContent   = data.stats.pending;
       document.getElementById('stat-transit').textContent   = data.stats.inTransit;
       document.getElementById('stat-delivered').textContent = data.stats.delivered;
   
       // Table
       if (!data.shipments.length) {
         empty.hidden = false;
         loading.hidden = true;
         return;
       }
   
       renderTable(data.shipments);
       table.hidden = false;
   
     } catch (err) {
       console.error('Load error:', err);
       loading.textContent = 'Error loading shipments';
     } finally {
       loading.hidden = true;
     }
   }
   
   // ═══ RENDER TABLE ═══
   function renderTable(shipments) {
     const tbody = document.getElementById('shipments-tbody');
     tbody.innerHTML = '';
   
     shipments.forEach(function (s) {
       const tr = document.createElement('tr');
       tr.dataset.tracking = s.trackingNumber;
   
       const created = new Date(s.createdAt).toLocaleDateString();
   
       tr.innerHTML =
         '<td class="tracking-cell">' + s.trackingNumber + '</td>' +
         '<td>' + s.sender.city + ', ' + s.sender.country + '</td>' +
         '<td>' + s.receiver.city + ', ' + s.receiver.country + '</td>' +
         '<td>' + titleCase(s.service) + '</td>' +
         '<td>$' + s.price.toFixed(2) + '</td>' +
         '<td><span class="status-badge ' + s.status + '">' + s.statusLabel + '</span></td>' +
         '<td>' + created + '</td>' +
         '<td><button class="row-action" title="Delete">✕</button></td>';
   
       tr.addEventListener('click', function (e) {
         if (e.target.classList.contains('row-action')) return;
         openDrawer(s.trackingNumber);
       });
   
       tr.querySelector('.row-action').addEventListener('click', function (e) {
         e.stopPropagation();
         if (confirm('Delete shipment ' + s.trackingNumber + '?')) {
           deleteShipment(s.trackingNumber);
         }
       });
   
       tbody.appendChild(tr);
     });
   }
   
   // ═══════════════════════════════════════════
   // DRAWER
   // ═══════════════════════════════════════════
   function attachDrawerClose() {
     const closeBtn = document.getElementById('drawer-close');
     const overlay  = document.getElementById('drawer-overlay');
   
     // Click on ✕ button
     closeBtn.addEventListener('click', function (e) {
       e.preventDefault();
       e.stopPropagation();
       closeDrawer();
     });
   
     // Click on dark overlay
     overlay.addEventListener('click', function (e) {
       e.preventDefault();
       closeDrawer();
     });
   
     // Escape key as backup
     document.addEventListener('keydown', function (e) {
       if (e.key === 'Escape' || e.keyCode === 27) {
         const drawer = document.getElementById('drawer');
         if (drawer && !drawer.hidden) {
           closeDrawer();
         }
       }
     });
   }
   
   async function openDrawer(tracking) {
     // Reset UI first
     const msg = document.getElementById('drawer-msg');
     if (msg) {
       msg.textContent = '';
       msg.className = 'drawer-msg';
     }
     document.getElementById('event-status').value = '';
     document.getElementById('event-location').value = '';
   
     try {
       const res = await fetch('/api/shipments/' + tracking);
       if (!res.ok) throw new Error('Not found');
       const s = await res.json();
   
       document.getElementById('drawer-tracking').textContent = s.trackingNumber;
       document.getElementById('drawer-service').textContent =
         titleCase(s.service) + ' · $' + s.price.toFixed(2);
   
       document.getElementById('drawer-from').textContent =
         s.sender.name + ' — ' + s.sender.city + ', ' + s.sender.country;
       document.getElementById('drawer-to').textContent =
         s.receiver.name + ' — ' + s.receiver.city + ', ' + s.receiver.country;
   
       document.getElementById('drawer-package').innerHTML =
         s.package.weight + ' kg · ' +
         s.package.length + '×' + s.package.width + '×' + s.package.height + ' cm<br />' +
         s.package.description + ' · $' + (s.package.declaredValue || 0).toFixed(2);
   
       renderDrawerEvents(s.events);
   
       document.getElementById('drawer').hidden = false;
       document.getElementById('drawer-overlay').hidden = false;
   
     } catch (err) {
       alert('Could not load shipment: ' + err.message);
     }
   }
   
   function closeDrawer() {
     document.getElementById('drawer').hidden = true;
     document.getElementById('drawer-overlay').hidden = true;
   }
   
   function renderDrawerEvents(events) {
     const ul = document.getElementById('drawer-events');
     ul.innerHTML = '';
   
     events.forEach(function (evt) {
       const li = document.createElement('li');
       let time = evt.time;
       if (time && time.indexOf('T') !== -1) {
         try { time = new Date(time).toLocaleString(); } catch (e) {}
       }
       li.innerHTML =
         '<strong>' + evt.status + '</strong>' +
         '<span>' + (evt.location || '—') + ' · ' + time + '</span>';
       ul.appendChild(li);
     });
   }
   
   // ═══ ADD EVENT ═══
   function attachAddEvent() {
     document.getElementById('add-event-btn').addEventListener('click', async function () {
       const status = document.getElementById('event-status').value;
       const location = document.getElementById('event-location').value.trim();
       const msg = document.getElementById('drawer-msg');
   
       const tracking = document.getElementById('drawer-tracking').textContent.trim();
   
       if (!tracking || tracking === '—') {
         msg.textContent = 'Please open a shipment first.';
         msg.className = 'drawer-msg error';
         return;
       }
   
       if (!status) {
         msg.textContent = 'Please select an event.';
         msg.className = 'drawer-msg error';
         return;
       }
   
       msg.textContent = 'Updating...';
       msg.className = 'drawer-msg';
   
       try {
        const token = localStorage.getItem('anchorpoint_token');
        const res = await fetch('/api/shipments/' + tracking, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            newEvent: { status: status, location: location || '—' }
          })
        });
   
         const result = await res.json();
         if (!res.ok) throw new Error(result.error || 'Update failed');
   
         msg.textContent = '✅ Updated successfully.';
         msg.className = 'drawer-msg success';
   
         renderDrawerEvents(result.shipment.events);
   
         document.getElementById('event-status').value = '';
         document.getElementById('event-location').value = '';
   
         setTimeout(loadShipments, 800);
   
       } catch (err) {
         msg.textContent = '❌ ' + err.message;
         msg.className = 'drawer-msg error';
       }
     });
   }
   
   // ═══ DELETE ═══
   function attachDelete() {
     document.getElementById('delete-btn').addEventListener('click', function () {
       const tracking = document.getElementById('drawer-tracking').textContent.trim();
       if (!tracking || tracking === '—') return;
       if (confirm('Delete shipment ' + tracking + '? This cannot be undone.')) {
         deleteShipment(tracking);
       }
     });
   }
   
   async function deleteShipment(tracking) {
    try {
      const token = localStorage.getItem('anchorpoint_token');
      const res = await fetch('/api/shipments/' + tracking, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        const err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || 'Delete failed');
      }
      closeDrawer();
      loadShipments();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }
   
   // ═══ HELPERS ═══
   function titleCase(str) {
     if (!str) return '';
     return str.split('-').map(function (w) {
       return w.charAt(0).toUpperCase() + w.slice(1);
     }).join(' ');
   }