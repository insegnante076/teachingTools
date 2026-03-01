# Reveal Markdown Slideshow

A tool to display reveal.js presentations from CSV data. The CSV should contain columns: `cap,id,title,slides_p1,slides_p2,slides_p3,map_md,map_html`.

Provide the CSV URL and the ID of the row to display. The tool concatenates the content from `slides_p1`, `slides_p2`, and `slides_p3` (if present) and renders it as a reveal.js slideshow using the markdown plugin.

## Usage

Append parameters to the URL:

- `csv`: URL of the CSV file
- `id`: The ID of the row to load slides from

Example: `?csv=https://example.com/slides.csv&id=slide1`

> **Default transition:** Slides will fade between one another by default. This mirrors the behaviour of the main Reveal Slideshow tool. There is currently no per-slide override in this markdown-based variant.

## CSV Format

The CSV must include at least these columns:
- `id`: Unique identifier for the slide set
- `slides_p1`: First part of the markdown content
- `slides_p2`: Second part (optional)
- `slides_p3`: Third part (optional)

Other columns like `cap`, `title`, `map_md`, `map_html` are ignored by this tool.

## Markdown Format

The concatenated markdown should use standard reveal.js markdown syntax:
- Use `---` to separate horizontal slides
- Use `--` to separate vertical slides (child slides)
- Use `##` for slide titles
- Standard markdown for content

Example markdown content with vertical slides:
```
# Slide 1 Title

Content for slide 1

--

# Vertical Slide 1.1

Content for vertical slide

--

# Vertical Slide 1.2

More content

---

# Slide 2 Title

- Bullet point 1
- Bullet point 2

---

## Slide 3

More content...
```

**Note:** Separators (`---` and `--`) should be on their own lines, surrounded by blank lines for proper parsing.