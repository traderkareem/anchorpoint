/* ═══════════════════════════════════════════
   ANCHORPOINT — Shipment Form Logic
   ═══════════════════════════════════════════ */

// ═══ COUNTRY LIST ═══
const countries = [
  "Nigeria", "United States", "United Kingdom", "Canada", "Germany",
  "France", "Netherlands", "Italy", "Spain", "China", "Japan", "India",
  "Brazil", "South Africa", "Kenya", "Ghana", "Egypt", "UAE",
  "Australia", "New Zealand", "South Korea", "Singapore", "Malaysia",
  "Mexico", "Argentina", "Ireland", "Sweden", "Norway", "Denmark",
  "Poland", "Portugal", "Belgium", "Switzerland", "Austria", "Turkey",
  "Saudi Arabia", "Israel", "Pakistan", "Bangladesh", "Indonesia"
];

// ═══ DOM READY ═══
document.addEventListener('DOMContentLoaded', () => {
  populateCountries();
  attachLiveListeners();
  attachValidation();
  attachSubmit();
});

// ═══ POPULATE COUNTRY DROPDOWNS ═══
function populateCountries() {
  const selects = ['senderCountry', 'receiverCountry'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
  });
}

// ═══ LIVE SUMMARY UPDATE ═══
function attachLiveListeners() {
  const fields = [
    'senderCity', 'senderCountry',
    'receiverCity', 'receiverCountry',
    'packageWeight', 'serviceType'
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', updateSummary);
    el.addEventListener('change', updateSummary);
  });
}

function updateSummary() {
  const senderCity = val('senderCity');
  const senderCountry = val('senderCountry');
  const receiverCity = val('receiverCity');
  const receiverCountry = val('receiverCountry');
  const weight = parseFloat(val('packageWeight')) || 0;

  const serviceSelect = document.getElementById('serviceType');
  const serviceOption = serviceSelect.options[serviceSelect.selectedIndex];

  let rate = 0;
  if (serviceOption && serviceOption.dataset && serviceOption.dataset.rate) {
    rate = parseFloat(serviceOption.dataset.rate);
  }

  // From / To
  setText('sum-from', senderCity && senderCountry ? senderCity + ', ' + senderCountry : '—');
  setText('sum-to', receiverCity && receiverCountry ? receiverCity + ', ' + receiverCountry : '—');

  // Service
  if (serviceOption && serviceOption.value) {
    setText('sum-service', serviceOption.textContent);
  } else {
    setText('sum-service', '—');
  }

  // Weight
  setText('sum-weight', weight > 0 ? weight + ' kg' : '—');

  // Price calculation
  const baseFee = 15;
  const price = (weight > 0 && rate > 0) ? (baseFee + weight * 4 * rate) : 0;
  setText('sum-price', price > 0 ? '$' + price.toFixed(2) : '$0.00');
}

// ═══ VALIDATION ═══
function attachValidation() {
  const form = document.getElementById('shipment-form');
  const inputs = form.querySelectorAll('input, select');

  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) validateField(input);
    });
  });
}

function validateField(input) {
  const errorEl = input.parentElement.querySelector('.error-msg');
  let error = '';

  if (input.required && !input.value.trim()) {
    error = 'This field is required';
  } else if (input.type === 'email' && input.value && !isEmail(input.value)) {
    error = 'Please enter a valid email';
  } else if (input.type === 'number' && input.value) {
    const num = parseFloat(input.value);
    const min = parseFloat(input.min);
    if (isNaN(num)) error = 'Enter a valid number';
    else if (!isNaN(min) && num < min) error = 'Must be at least ' + min;
  }

  if (error) {
    input.classList.add('invalid');
    input.classList.remove('valid');
    if (errorEl) errorEl.textContent = error;
    return false;
  } else {
    input.classList.remove('invalid');
    if (input.value.trim()) input.classList.add('valid');
    if (errorEl) errorEl.textContent = '';
    return true;
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ═══ SUBMIT ═══
function attachSubmit() {
  const form = document.getElementById('shipment-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll('input, select');
    let allValid = true;

    inputs.forEach(input => {
      if (!validateField(input)) allValid = false;
    });

    if (!allValid) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    const data = collectFormData();
    showConfirmation(data);
  });
}

function collectFormData() {
  const form = document.getElementById('shipment-form');
  const data = {};
  new FormData(form).forEach((value, key) => { data[key] = value; });
  return data;
}

async function showConfirmation(data) {
  const submitBtn = document.querySelector('#shipment-form button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving shipment...';

  try {
    const response = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      let msg = result.error || 'Failed to create shipment';
      if (result.details && result.details.length) {
        msg += '\n\n' + result.details.join('\n');
      }
      throw new Error(msg);
    }

    window.location.href = 'ship-success.html?tracking=' + result.trackingNumber;

  } catch (err) {
    console.error('Shipment creation failed:', err);
    alert('❌ Could not create shipment.\n\n' + err.message + '\n\nPlease try again.');

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ═══ HELPERS ═══
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}