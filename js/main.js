// ==================== MAIN.JS - Shared State, Utilities & Initialization ====================

// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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
    // Get DOM elements
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
    
    // Apply translations
    updateAllTranslations();
    
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
    selectAllBtn.addEventListener('click', selectAllPages);
    deselectAllBtn.addEventListener('click', deselectAllPages);
    deleteBtn.addEventListener('click', deleteSelectedPages);
    downloadBtn.addEventListener('click', downloadPDF);
    closeBtn.addEventListener('click', closePDF);
    
    // Reorder buttons
    reorderBtn.addEventListener('click', toggleReorderMode);
    applyOrderBtn.addEventListener('click', applyNewOrder);
    cancelOrderBtn.addEventListener('click', cancelReorder);
    
    // Merge functionality
    mergeBtn.addEventListener('click', openMergeModal);
    document.getElementById('close-merge-modal').addEventListener('click', closeMergeModal);
    mergeUploadBox.addEventListener('click', () => mergeInput.click());
    mergeInput.addEventListener('change', handleMergeFileSelect);
    document.getElementById('clear-merge-list').addEventListener('click', clearMergeList);
    doMergeBtn.addEventListener('click', performMerge);
    
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
    
    // Modal close on backdrop click
    mergeModal.addEventListener('click', (e) => {
        if (e.target === mergeModal) {
            closeMergeModal();
        }
    });
    
    // Compression dropdown
    setupCompressionOptions();
    
    // Setup other tools
    setupBatchCompression();
    setupBatchAppend();
    setupCurrencyCalculator();
    setupPdfExtract();
    setupPdfSplit();
}

// ==================== NAVIGATION ====================

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pdfToolsSection = document.getElementById('pdf-tools-section');
    const currencySection = document.getElementById('currency-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.dataset.tool;
            
            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Hide all sections
            pdfToolsSection.style.display = 'none';
            currencySection.style.display = 'none';
            
            // Show selected section
            if (tool === 'pdf-tools') {
                pdfToolsSection.style.display = 'block';
            } else if (tool === 'currency') {
                currencySection.style.display = 'flex';
            }
        });
    });
    
    // Setup PDF subtabs
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
