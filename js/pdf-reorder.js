// ==================== PDF REORDER FUNCTIONALITY ====================

let draggedPageIndex = null;

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
