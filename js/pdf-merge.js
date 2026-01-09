// ==================== PDF MERGE FUNCTIONALITY ====================

let draggedIndex = null;

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
        item.addEventListener('dragstart', handleMergeDragStart);
        item.addEventListener('dragover', handleMergeDragOver);
        item.addEventListener('drop', handleMergeDrop);
        item.addEventListener('dragend', handleMergeDragEnd);
        
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

function handleMergeDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleMergeDragOver(e) {
    e.preventDefault();
}

function handleMergeDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.target.closest('.merge-file-item').dataset.index);
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        // Reorder array
        const [removed] = mergeFiles.splice(draggedIndex, 1);
        mergeFiles.splice(targetIndex, 0, removed);
        renderMergeFileList();
    }
}

function handleMergeDragEnd(e) {
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
        const fileCount = mergeFiles.length;
        closeMergeModal();
        mergeFiles = [];
        
        showToast(`Merged ${fileCount} files (${pdfDoc.numPages} pages total)`, 'success');
    } catch (error) {
        console.error('Error merging PDFs:', error);
        showToast('Error merging PDFs: ' + error.message, 'error');
    }
}
