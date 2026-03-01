 # Reveal Slideshow Tool

A web-based presentation tool that loads slide content from CSV files. This version supports rich HTML fields, presentation filtering, and vertical grouping of slides based on heading level.

## 🎯 Quick Start

1. Create a CSV file with the headers described below.
2. Host it online (Google Drive, GitHub, Dropbox, etc.).
3. Open the tool with the CSV URL, for example:
   ```
   https://your-domain.com/tools/reveal-slideshow/index.html?csv=https://your-csv-url.com/slides.csv
   ```

## 📝 CSV Format (advanced)

The CSV must include a header row with the following column names (order does not matter):

- `slide_id` : unique identifier (optional but recommended)
- `heading_html` : HTML snippet containing the heading for the slide (e.g. `<h2>Title</h2>`)
- `content_html` : HTML snippet for the slide body (may contain lists, code, fragments)
- `background` : background color or image for reveal.js (e.g. `#111827`)
- `transition` : reveal.js transition name (e.g. `fade`, `slide`, `convex`, `zoom`). Slides with no transition specified will default to **fade**.
- `classes` : space-separated CSS classes to add to the slide section
- `notes` : speaker notes (plain text)
- `presentation_filter` : logical grouping key — use with `presentation_filter` URL parameter to show only selected rows

Example header row:
```csv
slide_id,heading_html,content_html,background,transition,classes,notes,presentation_filter
```

Important: `heading_html` is used to detect heading level (h1..h6) for vertical grouping.

## 🔧 URL Parameters

- `csv` (required): URL of the CSV file
- `presentation_filter` (optional): only rows whose `presentation_filter` column matches this value will be shown
- `vertical_level` (optional): threshold heading level (e.g. `h3`) — headings with level >= threshold will be shown vertically grouped under the previous higher-level heading

Example with filter and vertical grouping:
```
.../tools/reveal-slideshow/index.html?csv=https://.../slides.csv&presentation_filter=presentation_1&vertical_level=h3
```

## ⚠️ Security note

The fields `heading_html` and `content_html` are inserted as raw HTML into slides. Only use CSVs from trusted sources — do not load untrusted or user-supplied HTML without sanitization, otherwise you may introduce XSS risks.

## 🎛 Quick Launch Integration

The hub quick-launch supports the `presentation_filter` and `vertical_level` parameters; choose **Reveal Slideshow** and set the fields in the quick launch form to generate the correct URL.

## ✅ Tips & Troubleshooting

- If slides don't appear, check the browser console for network or CORS errors.
- Verify the CSV header names match the expected column names.
- The app automatically appends a cache‑buster to the CSV URL and requests with `cache: 'no-store'`, so you should see updates immediately when the source CSV changes. If you ever experience stale content, try hard‑reloading the page (Ctrl+Shift+R) or append a unique query string yourself.
- Use `vertical_level=h2` to create vertical stacks under `h1` headings, `h3` to stack under `h2`, etc.
- If your headings are missing or not standard HTML, the tool will treat those slides as top-level.

## 📚 Example CSV

See `test-slides.csv` in this folder as a minimal example with `presentation_1`.

---

Made with ❤️ for educators
