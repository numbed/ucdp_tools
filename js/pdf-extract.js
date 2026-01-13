// ==================== PDF EXTRACT - Extract Pages from PDF ====================

let extractPdfDoc = null;
let extractPdfBytes = null;
let extractSelectedPages = new Set();
let extractFileName = '';

function setupPdfExtract() {
    const extractUpload = document.getElementById('extract-upload');
    const extractInput = document.getElementById('extract-input');
    const extractCloseBtn = document.getElementById('extract-close-btn');
    const extractSelectAll = document.getElementById('extract-select-all');
    const extractDeselectAll = document.getElementById('extract-deselect-all');
    const applyRangeBtn = document.getElementById('apply-range-btn');
    const extractDownloadBtn = document.getElementById('extract-download-btn');
    
    // File upload events
    extractUpload.addEventListener('click', () => extractInput.click());
    extractInput.addEventListener('change', handleExtractFileSelect);
    
    // Drag and drop
    extractUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        extractUpload.classList.add('dragover');
    });
    
    extractUpload.addEventListener('dragleave', () => {
        extractUpload.classList.remove('dragover');
    });
    
    extractUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        extractUpload.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            loadExtractPdf(file);
        } else {
            showToast(t('pleaseDropPdf'), 'error');
        }
    });
    
    // Button events
    extractCloseBtn.addEventListener('click', closeExtractPdf);
    extractSelectAll.addEventListener('click', extractSelectAllPages);
    extractDeselectAll.addEventListener('click', extractDeselectAllPages);
    applyRangeBtn.addEventListener('click', applyPageRange);
    extractDownloadBtn.addEventListener('click', extractAndDownload);
}

async function handleExtractFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        await loadExtractPdf(file);
    }
}

async function loadExtractPdf(file) {
    try {
        showToast(t('loadingPdf'), 'info');
        
        const arrayBuffer = await file.arrayBuffer();
        // Store a copy as Uint8Array to prevent ArrayBuffer detachment issues
        extractPdfBytes = new Uint8Array(arrayBuffer);
        extractFileName = file.name;
        
        // Load with PDF.js for rendering (use a copy of the buffer)
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        extractPdfDoc = await loadingTask.promise;
        
        // Update UI
        document.getElementById('extract-file-name').textContent = file.name;
        const mb = (extractPdfBytes.byteLength / 1024 / 1024).toFixed(2);
        document.getElementById('extract-file-size').textContent = `(${mb} MB)`;
        
        // Show editor, hide upload
        document.getElementById('extract-upload').style.display = 'none';
        document.getElementById('extract-editor').style.display = 'block';
        
        // Render pages
        await renderExtractPages();
        
        showToast(t('loadedPages', extractPdfDoc.numPages), 'success');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast(t('errorLoadingPdf') + ': ' + error.message, 'error');
    }
}

async function renderExtractPages() {
    const container = document.getElementById('extract-pages-container');
    container.innerHTML = '';
    extractSelectedPages.clear();
    updateExtractButton();
    
    for (let i = 1; i <= extractPdfDoc.numPages; i++) {
        await renderExtractThumbnail(i);
    }
}

async function renderExtractThumbnail(pageNum) {
    const page = await extractPdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
    
    const pageCard = document.createElement('div');
    pageCard.className = 'page-card';
    pageCard.dataset.page = pageNum;
    
    pageCard.innerHTML = `
        <div class="page-thumbnail">
            ${canvas.outerHTML}
        </div>
        <div class="page-number">${t('page')} ${pageNum}</div>
    `;
    
    pageCard.addEventListener('click', () => toggleExtractPageSelection(pageNum, pageCard));
    
    document.getElementById('extract-pages-container').appendChild(pageCard);
}

function toggleExtractPageSelection(pageNum, pageCard) {
    if (extractSelectedPages.has(pageNum)) {
        extractSelectedPages.delete(pageNum);
        pageCard.classList.remove('selected');
    } else {
        extractSelectedPages.add(pageNum);
        pageCard.classList.add('selected');
    }
    updateExtractButton();
}

function extractSelectAllPages() {
    const container = document.getElementById('extract-pages-container');
    const pageCards = container.querySelectorAll('.page-card');
    
    pageCards.forEach(card => {
        const pageNum = parseInt(card.dataset.page);
        extractSelectedPages.add(pageNum);
        card.classList.add('selected');
    });
    
    updateExtractButton();
}

function extractDeselectAllPages() {
    const container = document.getElementById('extract-pages-container');
    const pageCards = container.querySelectorAll('.page-card');
    
    pageCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    extractSelectedPages.clear();
    updateExtractButton();
}

function applyPageRange() {
    const rangeInput = document.getElementById('extract-range');
    const rangeStr = rangeInput.value.trim();
    
    if (!rangeStr) return;
    
    // Parse page range (e.g., "1-3, 5, 7-9")
    const pages = parsePageRange(rangeStr, extractPdfDoc.numPages);
    
    if (pages.length === 0) {
        showToast(t('invalidPageRange'), 'error');
        return;
    }
    
    // Deselect all first
    extractDeselectAllPages();
    
    // Select specified pages
    const container = document.getElementById('extract-pages-container');
    pages.forEach(pageNum => {
        extractSelectedPages.add(pageNum);
        const card = container.querySelector(`[data-page="${pageNum}"]`);
        if (card) {
            card.classList.add('selected');
        }
    });
    
    updateExtractButton();
    showToast(t('selectedPages', pages.length), 'success');
}

function parsePageRange(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(',');
    
    for (const part of parts) {
        const trimmed = part.trim();
        
        if (trimmed.includes('-')) {
            // Range like "1-5"
            const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
                    pages.add(i);
                }
            }
        } else {
            // Single page like "5"
            const pageNum = parseInt(trimmed);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
                pages.add(pageNum);
            }
        }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
}

function updateExtractButton() {
    const btn = document.getElementById('extract-download-btn');
    const countSpan = document.getElementById('extract-selected-count');
    const count = extractSelectedPages.size;
    
    btn.disabled = count === 0;
    countSpan.innerHTML = `${count} <span data-i18n="pagesSelected">${t('pagesSelected')}</span>`;
}

async function extractAndDownload() {
    if (extractSelectedPages.size === 0) return;
    
    try {
        showToast(t('extractingPages'), 'info');
        
        // Load the PDF with pdf-lib
        const pdfLibDoc = await PDFLib.PDFDocument.load(extractPdfBytes);
        
        // Create a new PDF document
        const newPdf = await PDFLib.PDFDocument.create();
        
        // Get sorted page numbers (0-indexed for pdf-lib)
        const pageNumbers = Array.from(extractSelectedPages).sort((a, b) => a - b);
        const pageIndices = pageNumbers.map(p => p - 1);
        
        // Copy pages to new document
        const copiedPages = await newPdf.copyPages(pdfLibDoc, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        // Save and download
        const pdfBytesResult = await newPdf.save();
        const blob = new Blob([pdfBytesResult], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const baseName = extractFileName.replace('.pdf', '');
        a.download = `${baseName}_extracted_${pageNumbers.length}pages.pdf`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        showToast(t('extractedPages', pageNumbers.length), 'success');
    } catch (error) {
        console.error('Error extracting pages:', error);
        showToast(t('errorExtracting') + ': ' + error.message, 'error');
    }
}

function closeExtractPdf() {
    extractPdfDoc = null;
    extractPdfBytes = null;
    extractSelectedPages.clear();
    extractFileName = '';
    
    document.getElementById('extract-upload').style.display = 'block';
    document.getElementById('extract-editor').style.display = 'none';
    document.getElementById('extract-pages-container').innerHTML = '';
    document.getElementById('extract-range').value = '';
    document.getElementById('extract-input').value = '';
    
    updateExtractButton();
}
