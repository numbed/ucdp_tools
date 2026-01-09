// ==================== PDF EDITOR - Core Loading, Viewing, Selection, Download ====================

async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        await loadPDF(file);
    }
}

async function loadPDF(file) {
    try {
        showToast('Loading PDF...', 'info');
        
        const arrayBuffer = await file.arrayBuffer();
        pdfBytes = arrayBuffer;
        currentFileName = file.name;
        
        // Load with PDF.js for rendering
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        pdfDoc = await loadingTask.promise;
        
        // Update UI
        document.getElementById('file-name').textContent = file.name;
        updateFileSize(arrayBuffer.byteLength);
        document.getElementById('page-count').textContent = `${pdfDoc.numPages} pages`;
        
        // Show editor
        uploadSection.style.display = 'none';
        editorSection.style.display = 'flex';
        
        // Initialize page order for reordering
        initPageOrder();
        
        // Render pages
        await renderAllPages();
        
        showToast(`Loaded ${pdfDoc.numPages} pages`, 'success');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast('Error loading PDF: ' + error.message, 'error');
    }
}

async function renderAllPages() {
    pagesContainer.innerHTML = '';
    selectedPages.clear();
    updateDeleteButton();
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        await renderThumbnail(i);
    }
}

async function renderThumbnail(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
    
    // Get the actual page number (for reorder mode)
    const displayNum = reorderMode ? pageOrder[pageNum - 1] : pageNum;
    
    const pageCard = document.createElement('div');
    pageCard.className = 'page-card';
    pageCard.dataset.page = pageNum;
    pageCard.dataset.index = pageNum - 1;
    
    if (reorderMode) {
        pageCard.classList.add('reorder-mode');
        setupPageDragEvents(pageCard);
    }
    
    pageCard.innerHTML = `
        <div class="page-thumbnail">
            ${canvas.outerHTML}
        </div>
        <div class="page-number">Page ${displayNum}</div>
    `;
    
    if (!reorderMode) {
        pageCard.addEventListener('click', () => togglePageSelection(pageNum, pageCard));
    }
    
    pagesContainer.appendChild(pageCard);
}

function togglePageSelection(pageNum, pageCard) {
    if (reorderMode) return;
    
    if (selectedPages.has(pageNum)) {
        selectedPages.delete(pageNum);
        pageCard.classList.remove('selected');
    } else {
        selectedPages.add(pageNum);
        pageCard.classList.add('selected');
    }
    
    updateDeleteButton();
}

function selectAllPages() {
    if (reorderMode) return;
    
    const pageCards = document.querySelectorAll('.page-card');
    pageCards.forEach((card, i) => {
        selectedPages.add(i + 1);
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
    deleteBtn.disabled = count === 0;
    deleteBtn.innerHTML = count > 0 
        ? `<i class="fas fa-trash"></i> Delete (${count})`
        : '<i class="fas fa-trash"></i> Delete';
}

async function deleteSelectedPages() {
    if (selectedPages.size === 0) return;
    
    if (selectedPages.size >= pdfDoc.numPages) {
        showToast('Cannot delete all pages', 'error');
        return;
    }
    
    try {
        showToast('Deleting pages...', 'info');
        
        const { PDFDocument } = PDFLib;
        const pdfLibDoc = await PDFDocument.load(pdfBytes);
        
        // Get pages to keep (0-indexed)
        const pagesToDelete = Array.from(selectedPages).sort((a, b) => b - a);
        
        for (const pageNum of pagesToDelete) {
            pdfLibDoc.removePage(pageNum - 1);
        }
        
        // Save the modified PDF
        const newPdfBytes = await pdfLibDoc.save();
        pdfBytes = newPdfBytes.buffer;
        
        // Reload with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        pdfDoc = await loadingTask.promise;
        
        // Update UI
        updateFileSize(pdfBytes.byteLength);
        document.getElementById('page-count').textContent = `${pdfDoc.numPages} pages`;
        
        // Reset page order
        initPageOrder();
        
        // Re-render
        await renderAllPages();
        
        showToast(`Deleted ${pagesToDelete.length} page(s)`, 'success');
    } catch (error) {
        console.error('Error deleting pages:', error);
        showToast('Error deleting pages: ' + error.message, 'error');
    }
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
