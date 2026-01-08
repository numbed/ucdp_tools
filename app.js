// PDF Editor Application
// Using PDF.js for rendering and PDF-lib for manipulation

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// BGN/EUR Exchange Rate (Fixed for Eurozone entry)
const BGN_EUR_RATE = 1.95583;

// State
let pdfDoc = null;           // PDF.js document for rendering
let pdfBytes = null;         // ArrayBuffer for PDF-lib manipulation
let selectedPages = new Set();
let currentFileName = '';
let mergeFiles = [];         // Files to merge
let reorderMode = false;     // Reorder mode flag
let pageOrder = [];          // Current page order

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const editorSection = document.getElementById('editor-section');
const uploadBox = document.getElementById('upload-box');
const pdfInput = document.getElementById('pdf-input');
const selectBtn = document.getElementById('select-btn');
const pagesContainer = document.getElementById('pages-container');

// Buttons
const compressBtn = document.getElementById('compress-btn');
const downloadBtn = document.getElementById('download-btn');
const closeBtn = document.getElementById('close-btn');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const deleteBtn = document.getElementById('delete-btn');
const mergeBtn = document.getElementById('merge-btn');

// Merge modal elements
const mergeModal = document.getElementById('merge-modal');
const mergeDropzone = document.getElementById('merge-dropzone');
const mergeInput = document.getElementById('merge-input');
const mergeFileList = document.getElementById('merge-file-list');
const doMergeBtn = document.getElementById('do-merge');

// Reorder elements
const reorderBtn = document.getElementById('reorder-btn');
const applyOrderBtn = document.getElementById('apply-order-btn');
const cancelOrderBtn = document.getElementById('cancel-order-btn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Navigation
    setupNavigation();
    
    // Currency calculator
    setupCurrencyCalculator();
    
    // Batch compression
    setupBatchCompression();
    
    // File selection
    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pdfInput.click();
    });
    
    uploadBox.addEventListener('click', (e) => {
        if (e.target === uploadBox || e.target.tagName === 'H2' || e.target.tagName === 'P' || e.target.tagName === 'I') {
            pdfInput.click();
        }
    });
    
    pdfInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });
    
    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });
    
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            loadPDF(file);
        } else {
            showToast('Please select a valid PDF file', 'error');
        }
    });
    
    // Editor buttons
    compressBtn.addEventListener('click', toggleCompressMenu);
    setupCompressionOptions();
    downloadBtn.addEventListener('click', downloadPDF);
    closeBtn.addEventListener('click', closePDF);
    selectAllBtn.addEventListener('click', selectAllPages);
    deselectAllBtn.addEventListener('click', deselectAllPages);
    deleteBtn.addEventListener('click', deleteSelectedPages);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.getElementById('compress-menu').classList.remove('active');
        }
    });
    
    // Merge functionality
    mergeBtn.addEventListener('click', openMergeModal);
    document.getElementById('close-merge-modal').addEventListener('click', closeMergeModal);
    document.getElementById('clear-merge-list').addEventListener('click', clearMergeList);
    doMergeBtn.addEventListener('click', performMerge);
    
    mergeDropzone.addEventListener('click', () => mergeInput.click());
    mergeInput.addEventListener('change', handleMergeFileSelect);
    
    mergeDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        mergeDropzone.classList.add('dragover');
    });
    
    mergeDropzone.addEventListener('dragleave', () => {
        mergeDropzone.classList.remove('dragover');
    });
    
    mergeDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        mergeDropzone.classList.remove('dragover');
        handleMergeFileDrop(e.dataTransfer.files);
    });
    
    // Close modal on background click
    mergeModal.addEventListener('click', (e) => {
        if (e.target === mergeModal) closeMergeModal();
    });
    
    // Reorder functionality
    reorderBtn.addEventListener('click', toggleReorderMode);
    applyOrderBtn.addEventListener('click', applyNewOrder);
    cancelOrderBtn.addEventListener('click', cancelReorder);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        loadPDF(file);
    } else if (file) {
        showToast('Please select a valid PDF file', 'error');
    }
}

async function loadPDF(file) {
    try {
        showToast('Loading PDF...', 'info');
        
        currentFileName = file.name;
        pdfBytes = await file.arrayBuffer();
        
        // Load with PDF.js for rendering
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        // Update UI
        document.getElementById('file-name').textContent = currentFileName;
        updateFileSize(pdfBytes.byteLength);
        document.getElementById('page-count').textContent = `${pdfDoc.numPages} pages`;
        
        // Show editor
        uploadSection.style.display = 'none';
        editorSection.style.display = 'flex';
        
        // Reset selection and initialize page order
        selectedPages.clear();
        updateDeleteButton();
        initPageOrder();
        
        // Render pages
        await renderAllPages();
        
        showToast('PDF loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast('Error loading PDF: ' + error.message, 'error');
    }
}

async function renderAllPages() {
    pagesContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Rendering pages...</div>';
    
    // Small delay to show loading
    await new Promise(r => setTimeout(r, 100));
    
    pagesContainer.innerHTML = '';
    
    // Use pageOrder if in reorder mode, otherwise sequential
    const order = pageOrder.length > 0 ? pageOrder : Array.from({length: pdfDoc.numPages}, (_, i) => i + 1);
    
    for (let idx = 0; idx < order.length; idx++) {
        const pageNum = order[idx];
        const pageCard = document.createElement('div');
        pageCard.className = 'page-card' + (reorderMode ? ' reorder-mode' : '');
        pageCard.dataset.page = pageNum;
        pageCard.dataset.index = idx;
        
        pageCard.innerHTML = `
            <div class="page-thumbnail" id="thumb-${pageNum}">
                <canvas></canvas>
            </div>
            <div class="page-number">Page ${pageNum}</div>
            <div class="drag-indicator"><i class="fas fa-arrows-alt"></i> Drag to reorder</div>
        `;
        
        if (reorderMode) {
            setupPageDragEvents(pageCard);
        } else {
            pageCard.addEventListener('click', () => togglePageSelection(pageNum, pageCard));
        }
        
        pagesContainer.appendChild(pageCard);
        
        // Render thumbnail
        await renderThumbnail(pageNum);
    }
    
    if (reorderMode) {
        pagesContainer.classList.add('reorder-mode');
    } else {
        pagesContainer.classList.remove('reorder-mode');
    }
}

async function renderThumbnail(pageNum) {
    try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.querySelector(`#thumb-${pageNum} canvas`);
        const ctx = canvas.getContext('2d');
        
        // Scale to fit thumbnail
        const viewport = page.getViewport({ scale: 0.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
    } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
    }
}

function togglePageSelection(pageNum, element) {
    if (selectedPages.has(pageNum)) {
        selectedPages.delete(pageNum);
        element.classList.remove('selected');
    } else {
        selectedPages.add(pageNum);
        element.classList.add('selected');
    }
    updateDeleteButton();
}

function selectAllPages() {
    document.querySelectorAll('.page-card').forEach((card, idx) => {
        selectedPages.add(idx + 1);
        card.classList.add('selected');
    });
    updateDeleteButton();
}

function deselectAllPages() {
    selectedPages.clear();
    document.querySelectorAll('.page-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateDeleteButton();
}

function updateDeleteButton() {
    const count = selectedPages.size;
    document.getElementById('selected-count').textContent = count;
    deleteBtn.disabled = count === 0;
}

async function deleteSelectedPages() {
    if (selectedPages.size === 0) {
        showToast('No pages selected', 'error');
        return;
    }
    
    if (selectedPages.size >= pdfDoc.numPages) {
        showToast('Cannot delete all pages', 'error');
        return;
    }
    
    const count = selectedPages.size;
    if (!confirm(`Delete ${count} page(s)? This cannot be undone.`)) {
        return;
    }
    
    try {
        showToast('Deleting pages...', 'info');
        
        // Load with PDF-lib
        const { PDFDocument } = PDFLib;
        const srcDoc = await PDFDocument.load(pdfBytes);
        const newDoc = await PDFDocument.create();
        
        // Copy pages that are NOT selected
        const pagesToKeep = [];
        for (let i = 0; i < srcDoc.getPageCount(); i++) {
            if (!selectedPages.has(i + 1)) {
                pagesToKeep.push(i);
            }
        }
        
        const copiedPages = await newDoc.copyPages(srcDoc, pagesToKeep);
        copiedPages.forEach(page => newDoc.addPage(page));
        
        // Save new PDF
        const newPdfBytes = await newDoc.save();
        pdfBytes = newPdfBytes.buffer;
        
        // Reload with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        // Update UI
        document.getElementById('page-count').textContent = `${pdfDoc.numPages} pages`;
        updateFileSize(pdfBytes.byteLength);
        
        // Reset selection and re-render
        selectedPages.clear();
        updateDeleteButton();
        initPageOrder();
        await renderAllPages();
        
        showToast(`Deleted ${count} page(s) successfully!`, 'success');
    } catch (error) {
        console.error('Error deleting pages:', error);
        showToast('Error deleting pages: ' + error.message, 'error');
    }
}

async function compressPDF() {
    if (!pdfBytes) return;
    
    // Light compression - metadata only
    await compressLight();
}

async function compressLight() {
    try {
        showToast('Compressing PDF (light)...', 'info');
        
        const originalSize = pdfBytes.byteLength;
        
        // Load with PDF-lib
        const { PDFDocument } = PDFLib;
        const pdfLibDoc = await PDFDocument.load(pdfBytes);
        
        // Remove metadata
        pdfLibDoc.setTitle('');
        pdfLibDoc.setAuthor('');
        pdfLibDoc.setSubject('');
        pdfLibDoc.setKeywords([]);
        pdfLibDoc.setProducer('');
        pdfLibDoc.setCreator('');
        
        // Save with compression
        const compressedBytes = await pdfLibDoc.save({
            useObjectStreams: true
        });
        
        const newSize = compressedBytes.byteLength;
        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
        
        pdfBytes = compressedBytes.buffer;
        
        // Reload with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        updateFileSize(pdfBytes.byteLength);
        
        if (reduction > 0) {
            showToast(`Compressed! Size reduced by ${reduction}%`, 'success');
        } else {
            showToast('PDF is already optimized', 'info');
        }
    } catch (error) {
        console.error('Error compressing PDF:', error);
        showToast('Error compressing PDF: ' + error.message, 'error');
    }
}

async function compressWithQuality(dpi, quality) {
    if (!pdfDoc || !pdfBytes) return;
    
    try {
        const originalSize = pdfBytes.byteLength;
        const totalPages = pdfDoc.numPages;
        
        showToast(`Compressing ${totalPages} pages at ${dpi} DPI...`, 'info');
        
        const { PDFDocument } = PDFLib;
        const newPdfDoc = await PDFDocument.create();
        
        for (let i = 1; i <= totalPages; i++) {
            // Update progress
            document.getElementById('status-message').textContent = `Compressing page ${i}/${totalPages}...`;
            
            // Get page from PDF.js
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            
            // Calculate scale based on desired DPI (72 is PDF default)
            const scale = dpi / 72;
            const scaledViewport = page.getViewport({ scale });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            const ctx = canvas.getContext('2d');
            
            // Render page to canvas
            await page.render({
                canvasContext: ctx,
                viewport: scaledViewport
            }).promise;
            
            // Convert to JPEG with quality setting
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
            
            // Embed image in new PDF
            const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
            
            // Add page with original dimensions
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height
            });
            
            // Allow UI to update
            await new Promise(r => setTimeout(r, 10));
        }
        
        // Save compressed PDF
        const compressedBytes = await newPdfDoc.save();
        const newSize = compressedBytes.byteLength;
        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
        
        pdfBytes = compressedBytes.buffer;
        
        // Reload with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        updateFileSize(pdfBytes.byteLength);
        document.getElementById('status-message').textContent = '';
        
        // Re-render thumbnails
        initPageOrder();
        await renderAllPages();
        
        showToast(`Compressed! Size reduced by ${reduction}% (${formatSize(originalSize)} → ${formatSize(newSize)})`, 'success');
    } catch (error) {
        console.error('Error compressing PDF:', error);
        document.getElementById('status-message').textContent = '';
        showToast('Error compressing PDF: ' + error.message, 'error');
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function toggleCompressMenu(e) {
    e.stopPropagation();
    document.getElementById('compress-menu').classList.toggle('active');
}

function setupCompressionOptions() {
    const menu = document.getElementById('compress-menu');
    
    menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            menu.classList.remove('active');
            
            const quality = item.dataset.quality;
            
            switch (quality) {
                case 'light':
                    await compressLight();
                    break;
                case 'medium':
                    await compressWithQuality(150, 0.8);
                    break;
                case 'high':
                    await compressWithQuality(100, 0.6);
                    break;
                case 'maximum':
                    await compressWithQuality(72, 0.4);
                    break;
            }
        });
    });
}

async function downloadPDF() {
    if (!pdfBytes) return;
    
    try {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFileName.replace('.pdf', '_edited.pdf');
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('PDF downloaded!', 'success');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showToast('Error downloading PDF', 'error');
    }
}

function closePDF() {
    pdfDoc = null;
    pdfBytes = null;
    selectedPages.clear();
    currentFileName = '';
    pdfInput.value = '';
    pageOrder = [];
    reorderMode = false;
    exitReorderMode();
    
    editorSection.style.display = 'none';
    uploadSection.style.display = 'flex';
}

function updateFileSize(bytes) {
    const mb = (bytes / 1024 / 1024).toFixed(2);
    document.getElementById('file-size').textContent = `(${mb} MB)`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== MERGE FUNCTIONALITY ====================

function openMergeModal() {
    // If we have a current PDF, add it to merge list first
    if (pdfBytes && currentFileName) {
        const currentFile = {
            name: currentFileName,
            size: pdfBytes.byteLength,
            data: pdfBytes
        };
        
        // Check if already in list
        if (!mergeFiles.some(f => f.name === currentFileName)) {
            mergeFiles.push(currentFile);
        }
    }
    
    renderMergeFileList();
    mergeModal.classList.add('active');
}

function closeMergeModal() {
    mergeModal.classList.remove('active');
}

function handleMergeFileSelect(e) {
    const files = Array.from(e.target.files);
    addFilesToMergeList(files);
    mergeInput.value = '';
}

function handleMergeFileDrop(fileList) {
    const files = Array.from(fileList).filter(f => f.type === 'application/pdf');
    if (files.length === 0) {
        showToast('Please drop PDF files only', 'error');
        return;
    }
    addFilesToMergeList(files);
}

async function addFilesToMergeList(files) {
    for (const file of files) {
        if (file.type !== 'application/pdf') {
            showToast(`${file.name} is not a PDF`, 'error');
            continue;
        }
        
        // Check for duplicates
        if (mergeFiles.some(f => f.name === file.name)) {
            showToast(`${file.name} already added`, 'error');
            continue;
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            mergeFiles.push({
                name: file.name,
                size: arrayBuffer.byteLength,
                data: arrayBuffer
            });
        } catch (error) {
            showToast(`Error reading ${file.name}`, 'error');
        }
    }
    
    renderMergeFileList();
}

function renderMergeFileList() {
    mergeFileList.innerHTML = '';
    
    mergeFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'merge-file-item';
        item.draggable = true;
        item.dataset.index = index;
        
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        
        item.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <i class="fas fa-file-pdf file-icon"></i>
            <div class="file-details">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">${sizeMB} MB</div>
            </div>
            <button class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Drag events for reordering
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        
        // Remove button
        item.querySelector('.remove-file').addEventListener('click', (e) => {
            e.stopPropagation();
            mergeFiles.splice(index, 1);
            renderMergeFileList();
        });
        
        mergeFileList.appendChild(item);
    });
    
    // Update merge button state
    doMergeBtn.disabled = mergeFiles.length < 2;
}

let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.target.closest('.merge-file-item').dataset.index);
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        // Reorder array
        const [removed] = mergeFiles.splice(draggedIndex, 1);
        mergeFiles.splice(targetIndex, 0, removed);
        renderMergeFileList();
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedIndex = null;
}

function clearMergeList() {
    mergeFiles = [];
    renderMergeFileList();
}

async function performMerge() {
    if (mergeFiles.length < 2) {
        showToast('Add at least 2 PDF files to merge', 'error');
        return;
    }
    
    try {
        showToast('Merging PDFs...', 'info');
        
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        
        for (const file of mergeFiles) {
            const srcDoc = await PDFDocument.load(file.data);
            const pageIndices = srcDoc.getPageIndices();
            const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedBytes = await mergedPdf.save();
        pdfBytes = mergedBytes.buffer;
        
        // Generate merged filename
        currentFileName = 'merged_' + mergeFiles[0].name;
        
        // Load with PDF.js for display
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        // Update UI
        document.getElementById('file-name').textContent = currentFileName;
        updateFileSize(pdfBytes.byteLength);
        document.getElementById('page-count').textContent = `${pdfDoc.numPages} pages`;
        
        // Show editor
        uploadSection.style.display = 'none';
        editorSection.style.display = 'flex';
        
        // Reset selection and render
        selectedPages.clear();
        updateDeleteButton();
        await renderAllPages();
        
        // Close modal and clear list
        closeMergeModal();
        mergeFiles = [];
        
        showToast(`Merged ${mergeFiles.length} files (${pdfDoc.numPages} pages total)`, 'success');
    } catch (error) {
        console.error('Error merging PDFs:', error);
        showToast('Error merging PDFs: ' + error.message, 'error');
    }
}

// ==================== REORDER FUNCTIONALITY ====================

function initPageOrder() {
    if (pdfDoc) {
        pageOrder = Array.from({length: pdfDoc.numPages}, (_, i) => i + 1);
    } else {
        pageOrder = [];
    }
}

function toggleReorderMode() {
    reorderMode = !reorderMode;
    
    if (reorderMode) {
        // Enter reorder mode
        reorderBtn.classList.add('active');
        reorderBtn.innerHTML = '<i class="fas fa-arrows-alt"></i> Reordering...';
        applyOrderBtn.style.display = 'inline-flex';
        cancelOrderBtn.style.display = 'inline-flex';
        
        // Disable selection buttons
        selectAllBtn.disabled = true;
        deselectAllBtn.disabled = true;
        deleteBtn.disabled = true;
        
        // Clear selections
        selectedPages.clear();
        
        showToast('Drag pages to reorder them', 'info');
    } else {
        exitReorderMode();
    }
    
    renderAllPages();
}

function exitReorderMode() {
    reorderMode = false;
    reorderBtn.classList.remove('active');
    reorderBtn.innerHTML = '<i class="fas fa-arrows-alt"></i> Reorder Mode';
    applyOrderBtn.style.display = 'none';
    cancelOrderBtn.style.display = 'none';
    
    // Re-enable selection buttons
    selectAllBtn.disabled = false;
    deselectAllBtn.disabled = false;
    updateDeleteButton();
}

function cancelReorder() {
    // Reset page order to original
    initPageOrder();
    exitReorderMode();
    renderAllPages();
    showToast('Reorder cancelled', 'info');
}

async function applyNewOrder() {
    if (!hasOrderChanged()) {
        exitReorderMode();
        showToast('No changes to apply', 'info');
        return;
    }
    
    try {
        showToast('Applying new page order...', 'info');
        
        const { PDFDocument } = PDFLib;
        const srcDoc = await PDFDocument.load(pdfBytes);
        const newDoc = await PDFDocument.create();
        
        // Copy pages in new order (convert to 0-indexed)
        const indices = pageOrder.map(p => p - 1);
        const copiedPages = await newDoc.copyPages(srcDoc, indices);
        copiedPages.forEach(page => newDoc.addPage(page));
        
        // Save
        const newPdfBytes = await newDoc.save();
        pdfBytes = newPdfBytes.buffer;
        
        // Reload with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        // Reset order for new document
        initPageOrder();
        
        exitReorderMode();
        await renderAllPages();
        
        showToast('Page order applied successfully!', 'success');
    } catch (error) {
        console.error('Error applying page order:', error);
        showToast('Error applying page order: ' + error.message, 'error');
    }
}

function hasOrderChanged() {
    for (let i = 0; i < pageOrder.length; i++) {
        if (pageOrder[i] !== i + 1) return true;
    }
    return false;
}

let draggedPageIndex = null;

function setupPageDragEvents(pageCard) {
    pageCard.draggable = true;
    
    pageCard.addEventListener('dragstart', (e) => {
        draggedPageIndex = parseInt(pageCard.dataset.index);
        pageCard.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    pageCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    pageCard.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = parseInt(pageCard.dataset.index);
        
        if (draggedPageIndex !== null && draggedPageIndex !== targetIndex) {
            // Reorder the pageOrder array
            const [movedPage] = pageOrder.splice(draggedPageIndex, 1);
            pageOrder.splice(targetIndex, 0, movedPage);
            
            // Re-render to show new order
            renderAllPages();
        }
    });
    
    pageCard.addEventListener('dragend', () => {
        pageCard.classList.remove('dragging');
        draggedPageIndex = null;
    });
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pdfMain = document.querySelector('main.container');
    const batchSection = document.getElementById('batch-section');
    const currencySection = document.getElementById('currency-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.dataset.tool;
            
            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Hide all sections
            pdfMain.style.display = 'none';
            batchSection.style.display = 'none';
            currencySection.style.display = 'none';
            
            // Show selected section
            if (tool === 'pdf') {
                pdfMain.style.display = 'block';
            } else if (tool === 'batch') {
                batchSection.style.display = 'block';
            } else if (tool === 'currency') {
                currencySection.style.display = 'flex';
            }
        });
    });
}

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

// ==================== BATCH COMPRESSION ====================

let batchFiles = [];

function setupBatchCompression() {
    const batchUpload = document.getElementById('batch-upload');
    const batchInput = document.getElementById('batch-input');
    const clearBatchBtn = document.getElementById('clear-batch');
    const startBatchBtn = document.getElementById('start-batch');
    
    // Click to upload
    batchUpload.addEventListener('click', () => batchInput.click());
    batchInput.addEventListener('change', handleBatchFileSelect);
    
    // Drag and drop
    batchUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchUpload.classList.add('dragover');
    });
    
    batchUpload.addEventListener('dragleave', () => {
        batchUpload.classList.remove('dragover');
    });
    
    batchUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        batchUpload.classList.remove('dragover');
        handleBatchFileDrop(e.dataTransfer.files);
    });
    
    // Action buttons
    clearBatchBtn.addEventListener('click', clearBatchFiles);
    startBatchBtn.addEventListener('click', startBatchCompression);
}

function handleBatchFileSelect(e) {
    addBatchFiles(e.target.files);
    e.target.value = '';
}

function handleBatchFileDrop(fileList) {
    const files = Array.from(fileList).filter(f => f.type === 'application/pdf');
    if (files.length === 0) {
        showToast('Please drop PDF files only', 'error');
        return;
    }
    addBatchFiles(files);
}

async function addBatchFiles(files) {
    for (const file of files) {
        if (file.type !== 'application/pdf') {
            showToast(`${file.name} is not a PDF`, 'error');
            continue;
        }
        
        // Check for duplicates
        if (batchFiles.some(f => f.name === file.name)) {
            continue;
        }
        
        const arrayBuffer = await file.arrayBuffer();
        batchFiles.push({
            name: file.name,
            originalSize: arrayBuffer.byteLength,
            data: arrayBuffer,
            status: 'pending',
            compressedData: null,
            compressedSize: null
        });
    }
    
    renderBatchFileList();
    updateBatchActions();
}

function renderBatchFileList() {
    const list = document.getElementById('batch-file-list');
    list.innerHTML = '';
    
    batchFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'batch-file-item';
        
        let statusHtml = '';
        let actionsHtml = '';
        
        switch (file.status) {
            case 'pending':
                statusHtml = '<span class="status-pending"><i class="fas fa-clock"></i> Pending</span>';
                actionsHtml = `<button class="remove-btn" data-index="${index}"><i class="fas fa-times"></i></button>`;
                break;
            case 'processing':
                statusHtml = '<span class="status-processing"><i class="fas fa-spinner fa-spin"></i> Processing</span>';
                break;
            case 'done':
                const reduction = ((1 - file.compressedSize / file.originalSize) * 100).toFixed(1);
                statusHtml = `<span class="status-done"><i class="fas fa-check"></i> -${reduction}%</span>`;
                actionsHtml = `<button class="download-btn" data-index="${index}"><i class="fas fa-download"></i> Download</button>`;
                break;
            case 'error':
                statusHtml = '<span class="status-error"><i class="fas fa-exclamation-circle"></i> Error</span>';
                actionsHtml = `<button class="remove-btn" data-index="${index}"><i class="fas fa-times"></i></button>`;
                break;
        }
        
        const sizeInfo = file.compressedSize 
            ? `${formatSize(file.originalSize)} → ${formatSize(file.compressedSize)}`
            : formatSize(file.originalSize);
        
        item.innerHTML = `
            <i class="fas fa-file-pdf file-icon"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-sizes">${sizeInfo}</div>
            </div>
            <div class="file-status">${statusHtml}</div>
            ${actionsHtml}
        `;
        
        list.appendChild(item);
    });
    
    // Add event listeners
    list.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            batchFiles.splice(index, 1);
            renderBatchFileList();
            updateBatchActions();
        });
    });
    
    list.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            downloadBatchFile(index);
        });
    });
}

function updateBatchActions() {
    const actions = document.getElementById('batch-actions');
    actions.style.display = batchFiles.length > 0 ? 'flex' : 'none';
}

function clearBatchFiles() {
    batchFiles = [];
    renderBatchFileList();
    updateBatchActions();
    document.getElementById('batch-progress').style.display = 'none';
}

async function startBatchCompression() {
    if (batchFiles.length === 0) return;
    
    const quality = document.querySelector('input[name="batch-quality"]:checked').value;
    const progressDiv = document.getElementById('batch-progress');
    const progressFill = document.getElementById('batch-progress-fill');
    const progressText = document.getElementById('batch-progress-text');
    
    progressDiv.style.display = 'flex';
    document.getElementById('start-batch').disabled = true;
    
    let completed = 0;
    const total = batchFiles.length;
    
    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        if (file.status === 'done') {
            completed++;
            continue;
        }
        
        file.status = 'processing';
        renderBatchFileList();
        
        try {
            const compressedData = await compressPDFBuffer(file.data, quality);
            file.compressedData = compressedData;
            file.compressedSize = compressedData.byteLength;
            file.status = 'done';
        } catch (error) {
            console.error(`Error compressing ${file.name}:`, error);
            file.status = 'error';
        }
        
        completed++;
        const percent = Math.round((completed / total) * 100);
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}% (${completed}/${total})`;
        
        renderBatchFileList();
    }
    
    document.getElementById('start-batch').disabled = false;
    showToast(`Compressed ${completed} files!`, 'success');
}

async function compressPDFBuffer(buffer, quality) {
    const { PDFDocument } = PDFLib;
    
    if (quality === 'light') {
        // Light compression - metadata only
        const pdfLibDoc = await PDFDocument.load(buffer);
        pdfLibDoc.setTitle('');
        pdfLibDoc.setAuthor('');
        pdfLibDoc.setSubject('');
        pdfLibDoc.setKeywords([]);
        pdfLibDoc.setProducer('');
        pdfLibDoc.setCreator('');
        
        const compressed = await pdfLibDoc.save({ useObjectStreams: true });
        return compressed.buffer;
    }
    
    // Heavy compression - render as images
    const dpiMap = { medium: 150, high: 100, maximum: 72 };
    const qualityMap = { medium: 0.8, high: 0.6, maximum: 0.4 };
    
    const dpi = dpiMap[quality];
    const jpegQuality = qualityMap[quality];
    
    // Load with PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdfJsDoc = await loadingTask.promise;
    
    const newPdfDoc = await PDFDocument.create();
    
    for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const scale = dpi / 72;
        const scaledViewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        
        await page.render({
            canvasContext: ctx,
            viewport: scaledViewport
        }).promise;
        
        const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
        
        const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height
        });
    }
    
    const compressed = await newPdfDoc.save();
    return compressed.buffer;
}

function downloadBatchFile(index) {
    const file = batchFiles[index];
    if (!file.compressedData) return;
    
    const blob = new Blob([file.compressedData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.pdf', '_compressed.pdf');
    a.click();
    URL.revokeObjectURL(url);
}