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
