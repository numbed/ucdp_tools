// ==================== MAIN.JS - Shared State, Utilities & Initialization ====================

// PDF.js configuration - only if PDF.js is loaded
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Currency rate (fixed for Bulgaria's Eurozone entry)
const BGN_EUR_RATE = 1.95583;

// ==================== SHARED STATE ====================
let pdfDoc = null;
let pdfBytes = null;
let selectedPages = new Set();
let currentFileName = '';
let mergeFiles = [];
let reorderMode = false;
let pageOrder = [];

// ==================== DOM ELEMENTS ====================
let pdfInput, uploadBox, uploadSection, editorSection, pagesContainer;
let selectAllBtn, deselectAllBtn, deleteBtn, compressBtn, mergeBtn, downloadBtn, closeBtn;
let reorderBtn, applyOrderBtn, cancelOrderBtn;
let mergeModal, mergeInput, mergeUploadBox, mergeFileList, doMergeBtn;

// ==================== INITIALIZATION ====================

function init() {
    // Get DOM elements (only if they exist - for PDF tools page)
    pdfInput = document.getElementById('pdf-input');
    uploadBox = document.getElementById('upload-box');
    uploadSection = document.getElementById('upload-section');
    editorSection = document.getElementById('editor-section');
    pagesContainer = document.getElementById('pages-container');
    
    selectAllBtn = document.getElementById('select-all-btn');
    deselectAllBtn = document.getElementById('deselect-all-btn');
    deleteBtn = document.getElementById('delete-btn');
    compressBtn = document.getElementById('compress-btn');
    mergeBtn = document.getElementById('merge-btn');
    downloadBtn = document.getElementById('download-btn');
    closeBtn = document.getElementById('close-btn');
    
    reorderBtn = document.getElementById('reorder-btn');
    applyOrderBtn = document.getElementById('apply-order-btn');
    cancelOrderBtn = document.getElementById('cancel-order-btn');
    
    mergeModal = document.getElementById('merge-modal');
    mergeInput = document.getElementById('merge-input');
    mergeUploadBox = document.getElementById('merge-dropzone');
    mergeFileList = document.getElementById('merge-file-list');
    doMergeBtn = document.getElementById('do-merge');
    
    // Setup navigation
    setupNavigation();
    
    // Only setup PDF-related events if on PDF tools page
    if (uploadBox && pdfInput) {
        // File upload events
        uploadBox.addEventListener('click', () => pdfInput.click());
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
                showToast('Please drop a PDF file', 'error');
            }
        });
        
        // Toolbar buttons
        if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllPages);
        if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAllPages);
        if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedPages);
        if (compressBtn) compressBtn.addEventListener('click', toggleCompressMenu);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadPDF);
        if (closeBtn) closeBtn.addEventListener('click', closePDF);
        
        // Reorder buttons
        if (reorderBtn) reorderBtn.addEventListener('click', toggleReorderMode);
        if (applyOrderBtn) applyOrderBtn.addEventListener('click', applyNewOrder);
        if (cancelOrderBtn) cancelOrderBtn.addEventListener('click', cancelReorder);
        
        // Merge functionality
        if (mergeBtn) mergeBtn.addEventListener('click', openMergeModal);
        const closeMergeModalBtn = document.getElementById('close-merge-modal');
        if (closeMergeModalBtn) closeMergeModalBtn.addEventListener('click', closeMergeModal);
        if (mergeUploadBox && mergeInput) {
            mergeUploadBox.addEventListener('click', () => mergeInput.click());
            mergeInput.addEventListener('change', handleMergeFileSelect);
            const clearMergeListBtn = document.getElementById('clear-merge-list');
            if (clearMergeListBtn) clearMergeListBtn.addEventListener('click', clearMergeList);
            if (doMergeBtn) doMergeBtn.addEventListener('click', performMerge);
            
            // Merge drag and drop
            mergeUploadBox.addEventListener('dragover', (e) => {
                e.preventDefault();
                mergeUploadBox.classList.add('dragover');
            });
            
            mergeUploadBox.addEventListener('dragleave', () => {
                mergeUploadBox.classList.remove('dragover');
            });
            
            mergeUploadBox.addEventListener('drop', (e) => {
                e.preventDefault();
                mergeUploadBox.classList.remove('dragover');
                handleMergeFileDrop(e.dataTransfer.files);
            });
        }
        
        // Modal close on backdrop click
        if (mergeModal) {
            mergeModal.addEventListener('click', (e) => {
                if (e.target === mergeModal) {
                    closeMergeModal();
                }
            });
        }
        
        // Compression dropdown
        setupCompressionOptions();
        
        // Setup other PDF tools
        if (typeof setupBatchCompression === 'function') setupBatchCompression();
        if (typeof setupBatchAppend === 'function') setupBatchAppend();
        if (typeof setupPdfExtract === 'function') setupPdfExtract();
        if (typeof setupPdfSplit === 'function') setupPdfSplit();
    }
    
    // Setup currency calculator (only on currency page)
    if (typeof setupCurrencyCalculator === 'function') setupCurrencyCalculator();
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    // Setup PDF subtabs (only on PDF tools page)
    setupPdfSubtabs();
}

function setupPdfSubtabs() {
    const subtabs = document.querySelectorAll('.pdf-subtabs .subtab');
    const subtoolContents = document.querySelectorAll('.pdf-subtool-content');
    
    subtabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const subtool = tab.dataset.subtool;
            
            // Update active subtab
            subtabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Hide all subtool contents
            subtoolContents.forEach(content => content.classList.remove('active'));
            
            // Show selected subtool
            const targetContent = document.getElementById(`pdf-${subtool}-subtool`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// ==================== UTILITY FUNCTIONS ====================

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
