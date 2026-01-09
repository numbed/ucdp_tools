// ==================== TRANSLATIONS ====================

const translations = {
    en: {
        // Header
        officeTools: 'Office Tools',
        pdfEditor: 'PDF Editor',
        batchCompress: 'Batch Compress',
        batchAppend: 'Batch Append',
        bgnEur: 'BGN/EUR',
        
        // PDF Editor - Upload
        uploadPdfFile: 'Upload PDF File',
        dragDropPdf: 'Drag & drop your PDF here or click to browse',
        selectFile: 'Select File',
        
        // PDF Editor - Toolbar
        mergeFiles: 'Merge Files',
        download: 'Download',
        close: 'Close',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        deleteSelected: 'Delete Selected',
        reorderMode: 'Reorder Mode',
        reordering: 'Reordering...',
        applyOrder: 'Apply Order',
        cancel: 'Cancel',
        pages: 'pages',
        page: 'Page',
        
        // Compression
        compress: 'Compress',
        light: 'Light',
        lightDesc: 'Metadata only',
        medium: 'Medium',
        mediumDesc: '150 DPI',
        high: 'High',
        highDesc: '100 DPI',
        maximum: 'Maximum',
        maximumDesc: '72 DPI',
        
        // Merge Modal
        mergePdfFiles: 'Merge PDF Files',
        mergeInfo: 'Add PDF files to merge. Drag to reorder. Files will be combined in the order shown.',
        dropPdfsHere: 'Drop PDFs here or click to add',
        clearAll: 'Clear All',
        mergePdfs: 'Merge PDFs',
        
        // Batch Compress
        batchPdfCompression: 'Batch PDF Compression',
        compressMultiple: 'Compress multiple PDF files at once',
        dropPdfFilesHere: 'Drop PDF files here',
        clickToSelectMultiple: 'or click to select multiple files',
        compressionLevel: 'Compression Level:',
        compressAll: 'Compress All',
        downloadAll: 'Download All',
        pending: 'Pending',
        processing: 'Processing',
        error: 'Error',
        
        // Batch Append
        batchAppendPdf: 'Batch Append PDF',
        appendOneToMultiple: 'Append one PDF to the end of multiple files',
        fileToAppend: 'File to Append',
        fileToAppendHelp: 'This file will be added to the end of all target files',
        targetFiles: 'Target Files',
        targetFilesHelp: 'Files that will have the source appended',
        clickOrDropToSelect: 'Click or drop to select',
        clickOrDropMultiple: 'Click or drop multiple PDFs',
        appendToAll: 'Append to All',
        done: 'Done',
        
        // Currency
        bgnEurConverter: 'BGN ↔ EUR Converter',
        fixedRate: 'Fixed rate for Bulgaria\'s Eurozone entry:',
        bulgarianLev: 'Bulgarian Lev (BGN)',
        euro: 'Euro (EUR)',
        quickConvert: 'Quick Convert',
        referenceTable: 'Reference Table',
        
        // Toasts
        loadingPdf: 'Loading PDF...',
        loadedPages: 'Loaded {0} pages',
        errorLoadingPdf: 'Error loading PDF',
        deletingPages: 'Deleting pages...',
        deletedPages: 'Deleted {0} page(s)',
        cannotDeleteAll: 'Cannot delete all pages',
        compressingLight: 'Compressing (light)...',
        compressingAt: 'Compressing at {0} DPI...',
        compressed: 'Compressed: {0} → {1} ({2}% reduction)',
        pdfDownloaded: 'PDF downloaded!',
        errorDownloading: 'Error downloading PDF',
        mergingPdfs: 'Merging PDFs...',
        mergedFiles: 'Merged {0} files ({1} pages total)',
        addAtLeast2: 'Add at least 2 PDF files to merge',
        dragToReorder: 'Drag pages to reorder them',
        applyingOrder: 'Applying new page order...',
        orderApplied: 'Page order applied successfully!',
        noChanges: 'No changes to apply',
        reorderCancelled: 'Reorder cancelled',
        compressedFiles: 'Compressed {0} files!',
        appendedToFiles: 'Appended to {0} files!',
        downloadingFiles: 'Downloading {0} files...',
        noFilesToDownload: 'No files to download',
        pleaseDropPdf: 'Please drop a PDF file',
        pleaseDropPdfs: 'Please drop PDF files only',
        notAPdf: '{0} is not a PDF',
        alreadyAdded: '{0} already added',
        errorReading: 'Error reading {0}'
    },
    bg: {
        // Header
        officeTools: 'Офис Инструменти',
        pdfEditor: 'PDF Редактор',
        batchCompress: 'Групово Компресиране',
        batchAppend: 'Групово Добавяне',
        bgnEur: 'лв/EUR',
        
        // PDF Editor - Upload
        uploadPdfFile: 'Качване на PDF файл',
        dragDropPdf: 'Плъзнете PDF тук или кликнете за избор',
        selectFile: 'Избери файл',
        
        // PDF Editor - Toolbar
        mergeFiles: 'Обедини файлове',
        download: 'Изтегли',
        close: 'Затвори',
        selectAll: 'Избери всички',
        deselectAll: 'Премахни избора',
        deleteSelected: 'Изтрий избраните',
        reorderMode: 'Пренареждане',
        reordering: 'Пренареждане...',
        applyOrder: 'Приложи',
        cancel: 'Отказ',
        pages: 'страници',
        page: 'Страница',
        
        // Compression
        compress: 'Компресирай',
        light: 'Леко',
        lightDesc: 'Само метаданни',
        medium: 'Средно',
        mediumDesc: '150 DPI',
        high: 'Силно',
        highDesc: '100 DPI',
        maximum: 'Максимално',
        maximumDesc: '72 DPI',
        
        // Merge Modal
        mergePdfFiles: 'Обединяване на PDF файлове',
        mergeInfo: 'Добавете PDF файлове за обединяване. Плъзнете за пренареждане.',
        dropPdfsHere: 'Пуснете PDF тук или кликнете',
        clearAll: 'Изчисти всички',
        mergePdfs: 'Обедини PDF',
        
        // Batch Compress
        batchPdfCompression: 'Групово PDF Компресиране',
        compressMultiple: 'Компресирайте множество PDF файлове наведнъж',
        dropPdfFilesHere: 'Пуснете PDF файлове тук',
        clickToSelectMultiple: 'или кликнете за избор на файлове',
        compressionLevel: 'Ниво на компресия:',
        compressAll: 'Компресирай всички',
        downloadAll: 'Изтегли всички',
        pending: 'Чакащ',
        processing: 'Обработка',
        error: 'Грешка',
        
        // Batch Append
        batchAppendPdf: 'Групово Добавяне на PDF',
        appendOneToMultiple: 'Добавете един PDF към края на множество файлове',
        fileToAppend: 'Файл за добавяне',
        fileToAppendHelp: 'Този файл ще бъде добавен в края на всички целеви файлове',
        targetFiles: 'Целеви файлове',
        targetFilesHelp: 'Файлове, към които ще бъде добавен източникът',
        clickOrDropToSelect: 'Кликнете или пуснете за избор',
        clickOrDropMultiple: 'Кликнете или пуснете няколко PDF',
        appendToAll: 'Добави към всички',
        done: 'Готово',
        
        // Currency
        bgnEurConverter: 'лв ↔ EUR Конвертор',
        fixedRate: 'Фиксиран курс за приемане на България в Еврозоната:',
        bulgarianLev: 'Български лев (лв)',
        euro: 'Евро (EUR)',
        quickConvert: 'Бързо конвертиране',
        referenceTable: 'Справочна таблица',
        
        // Toasts
        loadingPdf: 'Зареждане на PDF...',
        loadedPages: 'Заредени {0} страници',
        errorLoadingPdf: 'Грешка при зареждане на PDF',
        deletingPages: 'Изтриване на страници...',
        deletedPages: 'Изтрити {0} страница(и)',
        cannotDeleteAll: 'Не може да изтриете всички страници',
        compressingLight: 'Компресиране (леко)...',
        compressingAt: 'Компресиране при {0} DPI...',
        compressed: 'Компресирано: {0} → {1} ({2}% намаление)',
        pdfDownloaded: 'PDF изтеглен!',
        errorDownloading: 'Грешка при изтегляне на PDF',
        mergingPdfs: 'Обединяване на PDF...',
        mergedFiles: 'Обединени {0} файла ({1} страници общо)',
        addAtLeast2: 'Добавете поне 2 PDF файла за обединяване',
        dragToReorder: 'Плъзнете страниците за пренареждане',
        applyingOrder: 'Прилагане на нов ред...',
        orderApplied: 'Редът е приложен успешно!',
        noChanges: 'Няма промени за прилагане',
        reorderCancelled: 'Пренареждането е отменено',
        compressedFiles: 'Компресирани {0} файла!',
        appendedToFiles: 'Добавено към {0} файла!',
        downloadingFiles: 'Изтегляне на {0} файла...',
        noFilesToDownload: 'Няма файлове за изтегляне',
        pleaseDropPdf: 'Моля, пуснете PDF файл',
        pleaseDropPdfs: 'Моля, пуснете само PDF файлове',
        notAPdf: '{0} не е PDF',
        alreadyAdded: '{0} вече е добавен',
        errorReading: 'Грешка при четене на {0}'
    }
};

let currentLang = localStorage.getItem('lang') || 'en';

function t(key, ...args) {
    let text = translations[currentLang][key] || translations['en'][key] || key;
    args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
    });
    return text;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    updateAllTranslations();
}

function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'bg' : 'en');
}

function updateAllTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (el.tagName === 'INPUT' && el.placeholder) {
            el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    
    // Update elements with data-i18n-html (for innerHTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.dataset.i18nHtml;
        el.innerHTML = t(key);
    });
    
    // Update language button
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'en' ? 'BG' : 'EN';
        langBtn.title = currentLang === 'en' ? 'Switch to Bulgarian' : 'Превключи на английски';
    }
    
    // Update page title
    document.title = t('officeTools') + ' - ' + t('pdfEditor');
}
