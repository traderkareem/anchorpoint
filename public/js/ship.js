/* ═══════════════════════════════════════════
   ANCHORPOINT — Shipment Form Logic
   ═══════════════════════════════════════════ */

// ═══ COUNTRIES (200+ — alphabetical) ═══
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Congo (DRC)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
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
  selects.forEach(function (id) {
    const sel = document.getElementById(id);
    if (!sel) return;
    countries.forEach(function (c) {
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
  fields.forEach(function (id) {
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

  setText('sum-from', senderCity && senderCountry ? senderCity + ', ' + senderCountry : '—');
  setText('sum-to', receiverCity && receiverCountry ? receiverCity + ', ' + receiverCountry : '—');

  if (serviceOption && serviceOption.value) {
    setText('sum-service', serviceOption.textContent);
  } else {
    setText('sum-service', '—');
  }

  setText('sum-weight', weight > 0 ? weight + ' kg' : '—');

  const baseFee = 15;
  const price = (weight > 0 && rate > 0) ? (baseFee + weight * 4 * rate) : 0;
  setText('sum-price', price > 0 ? '$' + price.toFixed(2) : '$0.00');
}

// ═══ VALIDATION ═══
function attachValidation() {
  const form = document.getElementById('shipment-form');
  const inputs = form.querySelectorAll('input, select');

  inputs.forEach(function (input) {
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
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
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const inputs = form.querySelectorAll('input, select');
    let allValid = true;

    inputs.forEach(function (input) {
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
  new FormData(form).forEach(function (value, key) { data[key] = value; });
  return data;
}

async function showConfirmation(data) {
  const submitBtn = document.querySelector('#shipment-form button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving shipment...';

  try {
    // Include auth token if user is logged in
    const token = localStorage.getItem('anchorpoint_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch('/api/shipments', {
      method: 'POST',
      headers: headers,
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