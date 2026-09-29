/* ANCHORPOINT — Success Page */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tracking = params.get('tracking');
  
    if (!tracking) {
      window.location.href = 'ship.html';
      return;
    }
  
    document.getElementById('tracking-number').textContent = tracking;
    document.getElementById('track-btn').href = 'track.html?tracking=' + tracking;
  
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tracking).then(copySuccess, copyFallback);
      } else {
        copyFallback();
      }
  
      function copySuccess() {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      }
  
      function copyFallback() {
        const temp = document.createElement('textarea');
        temp.value = tracking;
        document.body.appendChild(temp);
        temp.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(temp);
        copySuccess();
      }
    });
  });