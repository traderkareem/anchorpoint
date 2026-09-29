/* ═══════════════════════════════════════════
   ANCHORPOINT — Tracking Page Logic (API-connected)
   ═══════════════════════════════════════════ */

// ═══ DEMO SHIPMENT (for tutorial/testing) ═══
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
      { status: 'Picked up',         location: 'Lagos, NG',          time: '10 Jan 2026, 08:00', state: 'done' },
      { status: 'Departed origin',   location: 'Lagos Airport, NG',  time: '10 Jan 2026, 14:00', state: 'done' },
      { status: 'In transit',        location: 'London Heathrow, UK', time: '11 Jan 2026, 09:30', state: 'done' },
      { status: 'Customs clearance', location: 'New York JFK, US',   time: '12 Jan 2026, 11:15', state: 'current' },
      { status: 'Out for delivery',  location: '—',                  time: 'Pending',            state: 'pending' },
      { status: 'Delivered',         location: '—',                  time: 'Pending',            state: 'pending' }
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
async function searchShipment(trackingNumber) {
  const errorEl = document.getElementById('track-error');
  const resultEl = document.getElementById('track-result');

  let result = null;

  // First, check the demo data
  if (SAMPLE_SHIPMENTS[trackingNumber]) {
    result = SAMPLE_SHIPMENTS[trackingNumber];
  } else {
    // Otherwise, fetch from the API
    try {
      const response = await fetch('/api/shipments/' + trackingNumber);

      if (!response.ok) {
        throw new Error('Not found');
      }

      const shipment = await response.json();
      result = convertShipment(shipment);

    } catch (err) {
      console.error('Tracking lookup failed:', err);
      errorEl.hidden = false;
      resultEl.hidden = true;
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }

  errorEl.hidden = true;
  resultEl.hidden = false;
  renderResult(result);
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══ CONVERT BACKEND FORMAT → FRONTEND FORMAT ═══
function convertShipment(s) {
  return {
    trackingNumber: s.trackingNumber,
    status: s.status,
    statusLabel: s.statusLabel,
    service: titleCase(s.service),
    weight: s.package.weight + ' kg',
    eta: s.eta || 'Pending',
    from: s.sender.city + ', ' + s.sender.country,
    to: s.receiver.city + ', ' + s.receiver.country,
    sender: s.sender.name + '<br />' + s.sender.city + ', ' + s.sender.country,
    receiver: s.receiver.name + '<br />' + s.receiver.city + ', ' + s.receiver.country,
    package: s.package.weight + ' kg · ' + s.package.length + '×' + s.package.width + '×' + s.package.height + ' cm<br />' + s.package.description,
    value: '$' + (s.package.declaredValue || 0).toFixed(2) + ' USD',
    events: s.events
  };
}

function titleCase(str) {
  if (!str) return '';
  return str.split('-').map(function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// ═══ RENDER ═══
function renderResult(data) {
  setText('result-tracking', data.trackingNumber);
  setText('result-service', data.service + ' · ' + data.weight);
  setText('result-eta', data.eta);

  const pill = document.getElementById('result-status-pill');
  pill.textContent = data.statusLabel;
  pill.className = 'status-pill';
  if (data.status === 'delivered') pill.classList.add('delivered');
  else if (data.status === 'pending') pill.classList.add('pending');

  setText('route-from', data.from);
  setText('route-to', data.to);

  document.getElementById('detail-sender').innerHTML = data.sender;
  document.getElementById('detail-receiver').innerHTML = data.receiver;
  document.getElementById('detail-package').innerHTML = data.package;
  setText('detail-value', data.value);

  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';

  data.events.forEach(function (evt) {
    const li = document.createElement('li');
    li.className = evt.state || 'pending';

    let dotContent = '';
    if (evt.state === 'done') dotContent = '✓';
    else if (evt.state === 'current') dotContent = '●';

    // Format time if it's an ISO string
    let timeText = evt.time || 'Pending';
    if (typeof timeText === 'string' && timeText.includes('T')) {
      try {
        timeText = new Date(timeText).toLocaleString();
      } catch (e) {}
    }

    li.innerHTML =
      '<span class="timeline-dot">' + dotContent + '</span>' +
      '<div class="timeline-content">' +
        '<h4>' + evt.status + '</h4>' +
        '<div class="timeline-meta">' +
          '<span class="loc">' + (evt.location || '—') + '</span>' +
          '<span>' + timeText + '</span>' +
        '</div>' +
      '</div>';

    timeline.appendChild(li);
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}