# Office Tools - PDF Editor

A web-based office tools suite starting with a PDF editor. Designed to be hosted on Synology NAS for office-wide use.

## Features

### PDF Editor
- **Upload PDFs** - Drag & drop or click to select
- **View all pages** - Thumbnail grid view of all pages
- **Delete pages** - Select and remove unwanted pages
- **Compress PDF** - Reduce file size by removing metadata and optimizing
- **Download** - Save your edited PDF

## Deployment on Synology NAS

### Option 1: Web Station (Recommended)
1. Install **Web Station** from Package Center
2. Create a folder in your web directory (e.g., `/web/office-tools`)
3. Copy all files to that folder:
   - `index.html`
   - `styles.css`
   - `app.js`
4. Access via `http://your-nas-ip/office-tools`

### Option 2: Virtual Host
1. In Web Station, create a virtual host
2. Point it to the folder containing these files
3. Access via your configured domain/subdomain

## Files

```
office-tools/
├── index.html    # Main HTML page
├── styles.css    # Styling
├── app.js        # Application logic
└── README.md     # This file
```

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Security Note

All PDF processing happens **client-side** in the browser. No files are uploaded to any server - everything stays on the user's computer. This makes it safe for sensitive documents.

## Future Tools (Planned)

- Image converter
- Calculator
- Unit converter
- QR code generator
- And more...
