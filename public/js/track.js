/* ═══════════════════════════════════════════
   ANCHORPOINT — Tracking Page Logic
   ═══════════════════════════════════════════ */

// ═══ SAMPLE SHIPMENT DATA ═══
// (In Step 8, this will come from the backend API)
const SAMPLE_SHIPMENTS = {
    'AP123456789NG': {
      trackingNumber: 'AP123456789NG',
      status: 'in_transit',
      statusLabel: 'In Transit',
      service: 'International Express',
      weight: '2.5 kg',
      eta: '15 Jan 2026',
      from: 'Lagos, Nigeria',
      to: 'New York, United States',
      sender: 'Nuhu Abdulkarim<br />Lagos, Nigeria',
      receiver: 'Jane Smith<br />New York, United States',
      package: '2.5 kg · 30×20×15 cm<br />Documents',
      value: '$200.00 USD',
      events: [
        { status: 'Picked up',          location: 'Lagos, NG',         time: '10 Jan 2026, 08:00', state: 'done' },
        { status: 'Departed origin',    location: 'Lagos Airport, NG',  time: '10 Jan 2026, 14:00', state: 'done' },
        { status: 'In transit',         location: 'London Heathrow, UK', time: '11 Jan 2026, 09:30', state: 'done' },
        { status: 'Customs clearance',  location: 'New York JFK, US',   time: '12 Jan 2026, 11:15', state: 'current' },
        { status: 'Out for delivery',   location: '—',                  time: 'Pending',            state: 'pending' },
        { status: 'Delivered',          location: '—',                  time: 'Pending',            state: 'pending' }
      ]
    }
  };
  
  // ═══ DOM READY ═══
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('track-form');
    const input = document.getElementById('track-input');
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const trackingNumber = input.value.trim().toUpperCase();
      if (!trackingNumber) return;
      searchShipment(trackingNumber);
    });
  
    // Auto-search if URL has ?tracking= parameter
    const params = new URLSearchParams(window.location.search);
    const urlTracking = params.get('tracking');
    if (urlTracking) {
      input.value = urlTracking;
      searchShipment(urlTracking.toUpperCase());
    }
  });
  
  // ═══ SEARCH ═══
  function searchShipment(trackingNumber) {
    const result = SAMPLE_SHIPMENTS[trackingNumber];
    const errorEl = document.getElementById('track-error');
    const resultEl = document.getElementById('track-result');
  
    if (!result) {
      errorEl.hidden = false;
      resultEl.hidden = true;
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  
    errorEl.hidden = true;
    resultEl.hidden = false;
    renderResult(result);
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // ═══ RENDER ═══
  function renderResult(data) {
    // Header
    setText('result-tracking', data.trackingNumber);
    setText('result-service', `${data.service} · ${data.weight}`);
    setText('result-eta', data.eta);
  
    const pill = document.getElementById('result-status-pill');
    pill.textContent = data.statusLabel;
    pill.className = 'status-pill';
    if (data.status === 'delivered') pill.classList.add('delivered');
    else if (data.status === 'pending') pill.classList.add('pending');
  
    // Route
    setText('route-from', data.from);
    setText('route-to', data.to);
  
    // Details
    document.getElementById('detail-sender').innerHTML = data.sender;
    document.getElementById('detail-receiver').innerHTML = data.receiver;
    document.getElementById('detail-package').innerHTML = data.package;
    setText('detail-value', data.value);
  
    // Timeline
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
  
    data.events.forEach(evt => {
      const li = document.createElement('li');
      li.className = evt.state; // done | current | pending
  
      let dotContent = '';
      if (evt.state === 'done') dotContent = '✓';
      else if (evt.state === 'current') dotContent = '●';
  
      li.innerHTML = `
        <span class="timeline-dot">${dotContent}</span>
        <div class="timeline-content">
          <h4>${evt.status}</h4>
          <div class="timeline-meta">
            <span class="loc">${evt.location}</span>
            <span>${evt.time}</span>
          </div>
        </div>
      `;
      timeline.appendChild(li);
    });
  }
  
  function setText(id, text) {
    document.getElementById(id).textContent = text;
  }