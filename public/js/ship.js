/* ═══════════════════════════════════════════
   ANCHORPOINT — Shipment Form Logic
   ═══════════════════════════════════════════ */

// ═══ COUNTRY LIST (subset — real list) ═══
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
      document.getElementById(id).addEventListener('input', updateSummary);
      document.getElementById(id).addEventListener('change', updateSummary);
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
    const rate = serviceOption && serviceOption.dataset && serviceOption.dataset.rate
  ? parseFloat(serviceOption.dataset.rate)
  : 0;
    // From / To
    setText('sum-from', senderCity && senderCountry ? `${senderCity}, ${senderCountry}` : '—');
    setText('sum-to', receiverCity && receiverCountry ? `${receiverCity}, ${receiverCountry}` : '—');
    setText('sum-service', serviceOption && serviceOption.value ? serviceOption.textContent : '—');
    setText('sum-weight', weight > 0 ? `${weight} kg` : '—');
  
    // Price calculation
    const baseFee = 15;
    const price = weight > 0 && rate > 0 ? (baseFee + weight * 4 * rate) : 0;
    setText('sum-price', price > 0 ? `$${price.toFixed(2)}` : '$0.00');
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
      else if (!isNaN(min) && num < min) error = `Must be at least ${min}`;
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
  
      // Collect form data
      const data = collectFormData();
      console.log('Shipment data:', data);
  
      // Show confirmation (temporary — will POST to backend in Step 8)
      showConfirmation(data);
    });
  }
  
  function collectFormData() {
    const form = document.getElementById('shipment-form');
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = value; });
    data.estimatedPrice = document.getElementById('sum-price').textContent;
    return data;
  }
  
  function showConfirmation(data) {
    const summary = `
      ✅ Shipment ready to book!
  
      FROM:  ${data.senderCity}, ${data.senderCountry}
      TO:    ${data.receiverCity}, ${data.receiverCountry}
      SERVICE: ${data.serviceType}
      WEIGHT:  ${data.packageWeight} kg
      PRICE:   ${data.estimatedPrice}
  
      (Next: this will save to the database in Step 8.)
    `;
    alert(summary);
  }
  
  // ═══ HELPERS ═══
  function val(id) { return document.getElementById(id).value.trim(); }
  function setText(id, text) { document.getElementById(id).textContent = text; }