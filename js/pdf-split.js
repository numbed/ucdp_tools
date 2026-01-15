// ==================== PDF SPLIT - Split PDF into Individual Pages ====================

let splitPdfDoc = null;
let splitPdfBytes = null;
let splitFileName = '';

function setupPdfSplit() {
    const splitUpload = document.getElementById('split-upload');
    const splitInput = document.getElementById('split-input');
    const splitCloseBtn = document.getElementById('split-close-btn');
    const splitDownloadBtn = document.getElementById('split-download-btn');
    
    // File upload events
    splitUpload.addEventListener('click', () => splitInput.click());
    splitInput.addEventListener('change', handleSplitFileSelect);
    
    // Drag and drop
    splitUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        splitUpload.classList.add('dragover');
    });
    
    splitUpload.addEventListener('dragleave', () => {
        splitUpload.classList.remove('dragover');
    });
    
    splitUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        splitUpload.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            loadSplitPdf(file);
        } else {
            showToast('Моля качете PDF файл', 'error');
        }
    });
    
    // Button events
    splitCloseBtn.addEventListener('click', closeSplitPdf);
    splitDownloadBtn.addEventListener('click', splitAndDownload);
}

async function handleSplitFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        await loadSplitPdf(file);
    }
}

async function loadSplitPdf(file) {
    try {
        showToast('Зареждане на PDF...', 'info');
        
        const arrayBuffer = await file.arrayBuffer();
        // Store a copy as Uint8Array to prevent ArrayBuffer detachment issues
        splitPdfBytes = new Uint8Array(arrayBuffer);
        splitFileName = file.name;
        
        // Load with PDF.js for rendering (use a copy of the buffer)
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        splitPdfDoc = await loadingTask.promise;
        
        // Update UI
        document.getElementById('split-file-name').textContent = file.name;
        const mb = (splitPdfBytes.byteLength / 1024 / 1024).toFixed(2);
        document.getElementById('split-file-size').textContent = `(${mb} MB)`;
        document.getElementById('split-page-count').textContent = `${splitPdfDoc.numPages} страници`;
        
        // Show editor, hide upload
        document.getElementById('split-upload').style.display = 'none';
        document.getElementById('split-editor').style.display = 'block';
        
        // Render page previews
        await renderSplitPreview();
        
        showToast(`Заредени ${splitPdfDoc.numPages} страници`, 'success');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showToast('Грешка при зареждане на PDF' + ': ' + error.message, 'error');
    }
}

async function renderSplitPreview() {
    const container = document.getElementById('split-preview');
    container.innerHTML = '';
    
    // Show first few pages as preview (max 6)
    const maxPreview = Math.min(splitPdfDoc.numPages, 6);
    
    for (let i = 1; i <= maxPreview; i++) {
        await renderSplitThumbnail(i);
    }
    
    // Show indicator if there are more pages
    if (splitPdfDoc.numPages > maxPreview) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'split-more-indicator';
        moreIndicator.innerHTML = `
            <i class="fas fa-ellipsis-h"></i>
            <span>+${splitPdfDoc.numPages - maxPreview} още страници</span>
        `;
        container.appendChild(moreIndicator);
    }
}

async function renderSplitThumbnail(pageNum) {
    const page = await splitPdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.2 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
    
    const pageCard = document.createElement('div');
    pageCard.className = 'split-page-card';
    
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'page-thumbnail';
    thumbnailDiv.appendChild(canvas);
    
    const pageNumberDiv = document.createElement('div');
    pageNumberDiv.className = 'page-number';
    pageNumberDiv.textContent = `Страница ${pageNum}`;
    
    pageCard.appendChild(thumbnailDiv);
    pageCard.appendChild(pageNumberDiv);
    
    document.getElementById('split-preview').appendChild(pageCard);
}

async function splitAndDownload() {
    if (!splitPdfDoc || splitPdfDoc.numPages === 0) return;
    
    const useZip = document.getElementById('split-zip-option').checked;
    const progressContainer = document.getElementById('split-progress');
    const progressFill = document.getElementById('split-progress-fill');
    const progressText = document.getElementById('split-progress-text');
    
    progressContainer.style.display = 'block';
    
    try {
        showToast('Разделяне на PDF...', 'info');
        
        // Load the PDF with pdf-lib
        const pdfLibDoc = await PDFLib.PDFDocument.load(splitPdfBytes);
        const totalPages = pdfLibDoc.getPageCount();
        const baseName = splitFileName.replace('.pdf', '');
        
        if (useZip) {
            // Download as ZIP using JSZip
            const zip = new JSZip();
            
            for (let i = 0; i < totalPages; i++) {
                // Create a new PDF for this page
                const newPdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfLibDoc, [i]);
                newPdf.addPage(copiedPage);
                
                const pdfBytesResult = await newPdf.save();
                const pageFileName = `${baseName}_page_${String(i + 1).padStart(3, '0')}.pdf`;
                zip.file(pageFileName, pdfBytesResult);
                
                // Update progress
                const progress = Math.round(((i + 1) / totalPages) * 100);
                progressFill.style.width = progress + '%';
                progressText.textContent = `${progress}% (${i + 1}/${totalPages})`;
            }
            
            // Generate and download ZIP
            progressText.textContent = 'Създаване на ZIP архив...';
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseName}_split_${totalPages}pages.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
        } else {
            // Download individual files
            for (let i = 0; i < totalPages; i++) {
                // Create a new PDF for this page
                const newPdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfLibDoc, [i]);
                newPdf.addPage(copiedPage);
                
                const pdfBytesResult = await newPdf.save();
                const blob = new Blob([pdfBytesResult], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseName}_page_${String(i + 1).padStart(3, '0')}.pdf`;
                a.click();
                
                URL.revokeObjectURL(url);
                
                // Update progress
                const progress = Math.round(((i + 1) / totalPages) * 100);
                progressFill.style.width = progress + '%';
                progressText.textContent = `${progress}% (${i + 1}/${totalPages})`;
                
                // Small delay between downloads to prevent browser issues
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        showToast(`Разделени ${totalPages} страници`, 'success');
    } catch (error) {
        console.error('Error splitting PDF:', error);
        showToast('Грешка при разделяне' + ': ' + error.message, 'error');
    } finally {
        progressContainer.style.display = 'none';
        progressFill.style.width = '0%';
    }
}

function closeSplitPdf() {
    splitPdfDoc = null;
    splitPdfBytes = null;
    splitFileName = '';
    
    document.getElementById('split-upload').style.display = 'block';
    document.getElementById('split-editor').style.display = 'none';
    document.getElementById('split-preview').innerHTML = '';
    document.getElementById('split-input').value = '';
    document.getElementById('split-progress').style.display = 'none';
}
