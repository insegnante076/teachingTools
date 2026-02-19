# Teaching Tools

A collection of web-based tools designed to help educators create personalized, interactive learning experiences. Each tool can be customized through URL parameters to load educator-specific content.

## 📋 Project Structure

```
teachingTools/
├── index.html              # Hub page with links to all tools
├── hub-launcher.js        # Quick launch form handler
├── README.md              # This file
├── tools/                 # Individual educational tools
│   ├── reveal-slideshow/  # Presentation tool powered by reveal.js
│   ├── knightlab-timeline/# Timeline visualization
│   ├── markmap-visualizer/# Mind map visualizer
│   └── html-content-viewer/ # HTML content renderer
└── shared/                # Shared utilities
    ├── url-utils.js      # URL parameter handling library
    ├── csv-utils.js      # CSV parsing utilities
    └── styles.css        # Common styles
```

## � Available Tools

### 1. Reveal Slideshow

Create beautiful presentations by loading slide content from CSV files.

**Usage:**
```
tools/reveal-slideshow/?csv=https://your-domain.com/slides.csv
```

### 2. Knight Lab Timeline

Interactive timeline visualization powered by Knight Lab. Load historical events from CSV files.

**Usage:**
```
tools/knightlab-timeline/?csv=https://your-domain.com/timeline.csv
```

### 3. Markmap Visualizer

Create interactive mind maps from markdown. Load mind maps from CSV files.

**Usage:**
```
tools/markmap-visualizer/?csv=https://your-domain.com/maps.csv&title=MapTitle
```

### 4. HTML Content Viewer

Display structured HTML content filtered by lesson group. Load educational materials with rich formatting and personalized content filtering.

**Usage:**
```
tools/html-content-viewer/?csv=https://your-domain.com/content.csv&lesson_group=lesson1
```

**Features:**
- Filter content by lesson group
- Support for full HTML formatting
- Responsive design with dark mode support
- Clean, readable layout

## 📌 Supported CSV Sources

All tools support multiple ways to provide CSV data:

### 1. Regular Web Server URLs
```
https://my-website.com/data/slides.csv
https://example.org/content/timeline.csv
```

### 2. Google Sheets (Published as CSV)
1. Create or open a Google Sheet
2. Click **File → Share → Publish to web**
3. Choose **Link**, select **Comma-separated values (.csv)** format
4. Click **Publish** and copy the link
5. Use the link directly in tools:
```
?csv=https://docs.google.com/spreadsheets/d/e/2PACX-1vRkHI6vdOKfZz_OlVDnXKwe7KgMxm4elhgo348GGd2WX_qZXRRggIB9uX2hG9WtkJwidhh2QJFMMWA8/pub?gid=0&single=true&output=csv
```

### 3. GitHub Raw URLs
```
https://raw.githubusercontent.com/user/repo/main/slides.csv
```

### 4. Dropbox Shared Links
Add `?dl=1` to make it direct download:
```
https://www.dropbox.com/s/abc123xyz/timeline.csv?dl=1
```

### 5. OneDrive/SharePoint
Get the "Embed" code and extract the download URL

**Important:** All CSV sources must be publicly accessible (no authentication required).

## 🚀 Getting Started

1. Clone or download this repository
2. Open `index.html` in a web browser to see the hub
3. Use the **Quick Launch** form to easily select a tool and provide your CSV URL
   - Select the tool from the dropdown
   - Paste your CSV/Google Sheet URL
   - Enter any tool-specific parameters (presentation filter, lesson group, etc.)
   - Click "Launch Tool"
4. Alternatively, pass URL parameters directly to customize content (see tool-specific documentation)

## 📝 Creating Content

### For Educators Creating Slideshows:

1. Create a CSV file with slides (see format above)
2. Host it on a web server or cloud storage (Google Drive, GitHub, etc.)
3. Get the public URL to the CSV file
4. Share the link: `tools/reveal-slideshow/?csv=[CSV_URL]`

### Hosting CSV Files:

- **Google Drive**: Right-click → Share → Get link → Change to "Anyone with link" → Use the public URL
- **GitHub**: Use raw.githubusercontent.com URL for raw CSV files
- **Dropbox**: Share file → Get link → Modify to add `?dl=1` at the end
- **Any Web Server**: Upload CSV and use the direct URL

## 🔌 Using the URL Utils Library

For developers adding new tools:

```javascript
// Include the library
<script src="../../shared/url-utils.js"></script>

// Get a specific parameter
const csvUrl = URLUtils.getParam('csv');

// Check if a parameter exists
if (URLUtils.hasParam('theme')) {
    // do something
}

// Get all parameters
const allParams = URLUtils.getAllParams();

// Generate a tool URL
const url = URLUtils.generateToolUrl('tools/my-tool/', {
    csv: 'https://...',
    theme: 'dark'
});
```

## 🎯 Future Tools

Ideas for additional tools:
- Quiz/Assessment builder
- Interactive annotation tool
- Advanced concept mapping
- Assignment submission system
- Learning analytics dashboard

## 📄 License

This project is open for educational use.

## 🤝 Contributing

Feel free to add new tools following the same pattern:
1. Create a new directory in `tools/`
2. Add `index.html` and `app.js`
3. Use URL parameters for customization
4. Add documentation to `README.md`
5. Link from the hub page

---

**Last Updated:** February 2026
