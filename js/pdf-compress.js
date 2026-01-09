// ==================== PDF COMPRESSION ====================

function toggleCompressMenu() {
    const menu = document.getElementById('compress-menu');
    menu.classList.toggle('active');
    
    // Close when clicking outside
    const closeMenu = (e) => {
        if (!e.target.closest('.compress-dropdown')) {
            menu.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
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

async function compressLight() {
    if (!pdfBytes) return;
    
    try {
        showToast('Compressing (light)...', 'info');
        
        const { PDFDocument } = PDFLib;
        const pdfLibDoc = await PDFDocument.load(pdfBytes);
        
        // Remove metadata
        pdfLibDoc.setTitle('');
        pdfLibDoc.setAuthor('');
        pdfLibDoc.setSubject('');
        pdfLibDoc.setKeywords([]);
        pdfLibDoc.setProducer('');
        pdfLibDoc.setCreator('');
        
        const compressedBytes = await pdfLibDoc.save({ useObjectStreams: true });
        
        const originalSize = pdfBytes.byteLength;
        pdfBytes = compressedBytes.buffer;
        const newSize = pdfBytes.byteLength;
        
        updateFileSize(newSize);
        
        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
        showToast(`Compressed: ${formatSize(originalSize)} → ${formatSize(newSize)} (${reduction}% reduction)`, 'success');
    } catch (error) {
        console.error('Error compressing PDF:', error);
        showToast('Error compressing PDF: ' + error.message, 'error');
    }
}

async function compressWithQuality(dpi, jpegQuality) {
    if (!pdfBytes || !pdfDoc) return;
    
    try {
        showToast(`Compressing at ${dpi} DPI...`, 'info');
        
        const { PDFDocument } = PDFLib;
        const newPdfDoc = await PDFDocument.create();
        
        const scale = dpi / 72;
        
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
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
            
            // Convert to JPEG
            const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
            const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
            
            // Embed in new PDF
            const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height
            });
        }
        
        const compressedBytes = await newPdfDoc.save();
        
        const originalSize = pdfBytes.byteLength;
        pdfBytes = compressedBytes.buffer;
        const newSize = pdfBytes.byteLength;
        
        // Reload with PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        pdfDoc = await loadingTask.promise;
        
        updateFileSize(newSize);
        await renderAllPages();
        
        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
        showToast(`Compressed: ${formatSize(originalSize)} → ${formatSize(newSize)} (${reduction}% reduction)`, 'success');
    } catch (error) {
        console.error('Error compressing PDF:', error);
        showToast('Error compressing PDF: ' + error.message, 'error');
    }
}
