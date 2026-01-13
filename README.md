# Office Tools

A web-based office tools suite with PDF tools and currency converter. Designed to be hosted on Synology NAS or GitHub Pages for office-wide use.

## Features

### PDF Tools
All PDF-related tools are grouped under one tab with subtabs:

#### PDF Editor
- **Upload PDFs** - Drag & drop or click to select
- **View all pages** - Thumbnail grid view of all pages
- **Select/Delete pages** - Select and remove unwanted pages
- **Reorder pages** - Drag and drop to rearrange page order
- **Merge PDFs** - Combine multiple PDF files into one
- **Compress PDF** - Reduce file size with multiple compression levels (Light, Medium, High, Maximum)
- **Download** - Save your edited PDF

#### Batch Compress
- Compress multiple PDF files at once
- Choose compression level
- Download all compressed files

#### Batch Append
- Append one PDF to multiple target files
- Useful for adding cover pages or footers to multiple documents

#### Extract Pages
- Select specific pages from a PDF
- Use page range input (e.g., "1-3, 5, 7-9")
- Extract and download selected pages as a new PDF

#### Split PDF
- Split a PDF into individual page files
- Download as ZIP or individual PDFs
- Progress indicator for large files

### BGN/EUR Currency Converter
- Fixed rate converter for Bulgaria's Eurozone entry (1 EUR = 1.95583 BGN)
- Quick convert buttons
- Reference table

### External Links
- **ET Tool** - Link to the UCDP ET Tool

## Internationalization

Supports two languages:
- 🇬🇧 English
- 🇧🇬 Bulgarian

Toggle language using the button in the navigation bar.

## Deployment on Synology NAS

### Option 1: Web Station (Recommended)
1. Install **Web Station** from Package Center
2. Create a folder in your web directory (e.g., `/web/office-tools`)
3. Copy all files to that folder
4. Access via `http://your-nas-ip/office-tools`

### Option 2: Virtual Host
1. In Web Station, create a virtual host
2. Point it to the folder containing these files
3. Access via your configured domain/subdomain

### Option 3: GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Access via `https://username.github.io/repository-name`

## Files

```
office-tools/
├── index.html           # Main HTML page
├── styles.css           # Styling
├── logo.png             # Logo image
├── README.md            # This file
└── js/
    ├── translations.js  # i18n translations (EN/BG)
    ├── main.js          # Initialization & navigation
    ├── pdf-editor.js    # PDF viewing & page selection
    ├── pdf-compress.js  # PDF compression
    ├── pdf-reorder.js   # Page reordering
    ├── pdf-merge.js     # PDF merging
    ├── pdf-extract.js   # Page extraction
    ├── pdf-split.js     # PDF splitting
    ├── batch-compress.js # Batch compression
    ├── batch-append.js  # Batch append
    └── currency.js      # Currency converter
```

## Libraries Used

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [JSZip](https://stuk.github.io/jszip/) - ZIP file creation
- [Font Awesome](https://fontawesome.com/) - Icons

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Security Note

All PDF processing happens **client-side** in the browser. No files are uploaded to any server - everything stays on the user's computer. This makes it safe for sensitive documents.
