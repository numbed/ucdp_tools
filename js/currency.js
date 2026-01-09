// ==================== CURRENCY CALCULATOR ====================

function setupCurrencyCalculator() {
    const bgnInput = document.getElementById('bgn-input');
    const eurInput = document.getElementById('eur-input');
    const swapBtn = document.getElementById('swap-currency');
    
    // BGN to EUR conversion
    bgnInput.addEventListener('input', () => {
        const bgn = parseFloat(bgnInput.value);
        if (!isNaN(bgn)) {
            eurInput.value = (bgn / BGN_EUR_RATE).toFixed(2);
        } else {
            eurInput.value = '';
        }
    });
    
    // EUR to BGN conversion
    eurInput.addEventListener('input', () => {
        const eur = parseFloat(eurInput.value);
        if (!isNaN(eur)) {
            bgnInput.value = (eur * BGN_EUR_RATE).toFixed(2);
        } else {
            bgnInput.value = '';
        }
    });
    
    // Swap values
    swapBtn.addEventListener('click', () => {
        const temp = bgnInput.value;
        bgnInput.value = eurInput.value;
        eurInput.value = temp;
        
        // Recalculate based on BGN
        const bgn = parseFloat(bgnInput.value);
        if (!isNaN(bgn)) {
            eurInput.value = (bgn / BGN_EUR_RATE).toFixed(2);
        }
    });
    
    // Quick convert buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.bgn) {
                bgnInput.value = btn.dataset.bgn;
                eurInput.value = (parseFloat(btn.dataset.bgn) / BGN_EUR_RATE).toFixed(2);
            } else if (btn.dataset.eur) {
                eurInput.value = btn.dataset.eur;
                bgnInput.value = (parseFloat(btn.dataset.eur) * BGN_EUR_RATE).toFixed(2);
            }
        });
    });
}
