// ==================== BATCH APPEND ====================

let appendSourceFile = null;
let appendTargetFiles = [];

function setupBatchAppend() {
    const sourceUpload = document.getElementById('append-source-upload');
    const sourceInput = document.getElementById('append-source-input');
    const targetUpload = document.getElementById('append-target-upload');
    const targetInput = document.getElementById('append-target-input');
    const clearBtn = document.getElementById('clear-append');
    const startBtn = document.getElementById('start-append');
    
    // Source file upload
    sourceUpload.addEventListener('click', () => sourceInput.click());
    sourceInput.addEventListener('change', handleAppendSourceSelect);
    
    sourceUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        sourceUpload.classList.add('dragover');
    });
    sourceUpload.addEventListener('dragleave', () => sourceUpload.classList.remove('dragover'));
    sourceUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        sourceUpload.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setAppendSourceFile(file);
        } else {
            showToast('Please drop a PDF file', 'error');
        }
    });
    
    // Target files upload
    targetUpload.addEventListener('click', () => targetInput.click());
    targetInput.addEventListener('change', handleAppendTargetSelect);
    
    targetUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        targetUpload.classList.add('dragover');
    });
    targetUpload.addEventListener('dragleave', () => targetUpload.classList.remove('dragover'));
    targetUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        targetUpload.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (files.length > 0) {
            addAppendTargetFiles(files);
        } else {
            showToast('Please drop PDF files', 'error');
        }
    });
    
    // Action buttons
    clearBtn.addEventListener('click', clearAppendFiles);
    startBtn.addEventListener('click', startBatchAppend);
}

async function handleAppendSourceSelect(e) {
    const file = e.target.files[0];
    if (file) {
        await setAppendSourceFile(file);
    }
    e.target.value = '';
}

async function setAppendSourceFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    appendSourceFile = {
        name: file.name,
        data: arrayBuffer
    };
    
    const upload = document.getElementById('append-source-upload');
    upload.classList.add('has-file');
    document.getElementById('append-source-name').textContent = file.name;
    
    updateAppendActions();
}

function handleAppendTargetSelect(e) {
    addAppendTargetFiles(e.target.files);
    e.target.value = '';
}

async function addAppendTargetFiles(files) {
    for (const file of files) {
        if (file.type !== 'application/pdf') continue;
        if (appendTargetFiles.some(f => f.name === file.name)) continue;
        
        const arrayBuffer = await file.arrayBuffer();
        appendTargetFiles.push({
            name: file.name,
            data: arrayBuffer,
            status: 'pending',
            resultData: null
        });
    }
    
    renderAppendFileList();
    updateAppendActions();
}

function renderAppendFileList() {
    const list = document.getElementById('append-file-list');
    list.innerHTML = '';
    
    appendTargetFiles.forEach((file, index) => {
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
                statusHtml = '<span class="status-done"><i class="fas fa-check"></i> Done</span>';
                actionsHtml = `<button class="download-btn" data-index="${index}"><i class="fas fa-download"></i> Download</button>`;
                break;
            case 'error':
                statusHtml = '<span class="status-error"><i class="fas fa-exclamation-circle"></i> Error</span>';
                actionsHtml = `<button class="remove-btn" data-index="${index}"><i class="fas fa-times"></i></button>`;
                break;
        }
        
        item.innerHTML = `
            <i class="fas fa-file-pdf file-icon"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-sizes">${formatSize(file.data.byteLength)}</div>
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
            appendTargetFiles.splice(index, 1);
            renderAppendFileList();
            updateAppendActions();
        });
    });
    
    list.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            downloadAppendFile(index);
        });
    });
}

function updateAppendActions() {
    const actions = document.getElementById('append-actions');
    const canStart = appendSourceFile && appendTargetFiles.length > 0;
    actions.style.display = canStart ? 'flex' : 'none';
}

function clearAppendFiles() {
    appendSourceFile = null;
    appendTargetFiles = [];
    
    const sourceUpload = document.getElementById('append-source-upload');
    sourceUpload.classList.remove('has-file');
    document.getElementById('append-source-name').textContent = 'Click or drop to select';
    
    renderAppendFileList();
    updateAppendActions();
    document.getElementById('append-progress').style.display = 'none';
}

async function startBatchAppend() {
    if (!appendSourceFile || appendTargetFiles.length === 0) return;
    
    const progressDiv = document.getElementById('append-progress');
    const progressFill = document.getElementById('append-progress-fill');
    const progressText = document.getElementById('append-progress-text');
    
    progressDiv.style.display = 'flex';
    document.getElementById('start-append').disabled = true;
    
    let completed = 0;
    const total = appendTargetFiles.length;
    
    const { PDFDocument } = PDFLib;
    
    // Load source PDF once
    const sourceDoc = await PDFDocument.load(appendSourceFile.data);
    
    for (let i = 0; i < appendTargetFiles.length; i++) {
        const file = appendTargetFiles[i];
        if (file.status === 'done') {
            completed++;
            continue;
        }
        
        file.status = 'processing';
        renderAppendFileList();
        
        try {
            // Load target PDF
            const targetDoc = await PDFDocument.load(file.data);
            
            // Copy all pages from source and append
            const sourcePages = await targetDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
            sourcePages.forEach(page => targetDoc.addPage(page));
            
            // Save merged PDF
            const mergedBytes = await targetDoc.save();
            file.resultData = mergedBytes.buffer;
            file.status = 'done';
        } catch (error) {
            console.error(`Error appending to ${file.name}:`, error);
            file.status = 'error';
        }
        
        completed++;
        const percent = Math.round((completed / total) * 100);
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}% (${completed}/${total})`;
        
        renderAppendFileList();
    }
    
    document.getElementById('start-append').disabled = false;
    showToast(`Appended to ${completed} files!`, 'success');
}

function downloadAppendFile(index) {
    const file = appendTargetFiles[index];
    if (!file.resultData) return;
    
    const blob = new Blob([file.resultData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.pdf', '_merged.pdf');
    a.click();
    URL.revokeObjectURL(url);
}
