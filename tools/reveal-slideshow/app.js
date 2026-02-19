/**
 * Reveal Slideshow Application
 * Loads slide content from CSV URL and displays in reveal.js
 */

class SlideShowApp {
    constructor() {
        this.csvUrl = URLUtils.getParam('csv');
        this.presentationFilter = URLUtils.getParam('presentation_filter') || URLUtils.getParam('presentation');
        this.verticalLevelParam = URLUtils.getParam('vertical_level') || URLUtils.getParam('verticalLevel');
        this.slides = [];
        this.init();
    }

    init() {
        if (!this.csvUrl) {
            this.showError('No CSV URL provided. Use: ?csv=https://your-url/slides.csv');
            return;
        }

        this.loadCSV();
    }

    /**
     * Load and parse CSV from URL
     */
    async loadCSV() {
        try {
            const csvText = await URLUtils.fetchCSV(this.csvUrl);
            this.parseCSV(csvText);
            this.renderSlides();
        } catch (error) {
            this.showError(`Failed to load CSV: ${error.message}`);
        }
    }

    /**
     * Parse CSV content into slides
     * Expected format:
     * title,content
     * "Slide 1 Title","Slide 1 content"
     * "Slide 2 Title","Slide 2 content line 1\nSlide 2 content line 2"
     */
    parseCSV(csvText) {
        // Basic CSV parsing that respects quoted fields and maps header columns
        const rawLines = csvText.split('\n');
        // Remove empty trailing lines
        const lines = rawLines.filter(l => l.trim() !== '');

        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }

        // Parse header
        const header = this.parseCSVLine(lines[0]).map(h => h.trim());
        const colIndex = {};
        header.forEach((name, idx) => {
            colIndex[name] = idx;
        });

        // Required fields in our CSV: slide_id, heading_html, content_html, background, transition, classes, notes, presentation_filter
        for (let i = 1; i < lines.length; i++) {
            const fields = this.parseCSVLine(lines[i]);
            if (fields.length === 0) continue;

            const get = (name) => {
                const idx = colIndex[name];
                return (idx !== undefined && fields[idx] !== undefined) ? fields[idx].trim() : '';
            };

            const slideObj = {
                slide_id: get('slide_id'),
                heading_html: get('heading_html'),
                content_html: get('content_html'),
                background: get('background'),
                transition: get('transition'),
                classes: get('classes'),
                notes: get('notes'),
                presentation_filter: get('presentation_filter')
            };

            // If a presentation filter is set in the URL, only include matching rows
            if (this.presentationFilter) {
                if (!slideObj.presentation_filter) continue;
                if (slideObj.presentation_filter !== this.presentationFilter) continue;
            }

            this.slides.push(slideObj);
        }

        if (this.slides.length === 0) {
            throw new Error('No valid slides found in CSV for the selected presentation');
        }
    }

    /**
     * Parse vertical level parameter into an integer (1-6) or null
     */
    parseVerticalLevel() {
        if (!this.verticalLevelParam) return null;
        const v = this.verticalLevelParam.trim().toLowerCase();
        let n = null;
        if (v.startsWith('h')) {
            n = parseInt(v.slice(1), 10);
        } else {
            n = parseInt(v, 10);
        }
        if (isNaN(n) || n < 1 || n > 6) return null;
        return n;
    }

    /**
     * Get heading level from an HTML snippet like '<h2>Title</h2>'
     */
    getHeadingLevel(html) {
        if (!html) return null;
        const m = html.match(/<h([1-6])\b/i);
        if (m) return parseInt(m[1], 10);
        return null;
    }

    /**
     * Parse a CSV line handling quoted fields
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                // If next char is also a quote, treat as escaped quote
                if (insideQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // skip next quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result.map(f => {
            // Trim surrounding quotes if present
            const trimmed = f.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                return trimmed.slice(1, -1);
            }
            return trimmed;
        });
    }

    /**
     * Render slides into the reveal.js container
     */
    renderSlides() {
        const container = document.getElementById('slidesContainer');
        container.innerHTML = '';
        // If no vertical level requested, render all as horizontal slides
        const verticalThreshold = this.parseVerticalLevel();

        if (!verticalThreshold) {
            this.slides.forEach((slide) => {
                const section = document.createElement('section');
                if (slide.background) section.setAttribute('data-background-color', slide.background);
                if (slide.transition) section.setAttribute('data-transition', slide.transition);
                if (slide.classes) section.className = slide.classes;
                const headingHtml = slide.heading_html || '';
                const contentHtml = slide.content_html || '';
                section.innerHTML = `${headingHtml}<div class="slide-content">${contentHtml}</div>`;
                if (slide.notes) {
                    const aside = document.createElement('aside');
                    aside.className = 'notes';
                    aside.innerHTML = this.escapeHtml(slide.notes);
                    section.appendChild(aside);
                }
                container.appendChild(section);
            });
        } else {
            // Build node list grouping vertical slides under previous lower-level heading
            const nodes = [];
            for (let i = 0; i < this.slides.length; i++) {
                const slide = this.slides[i];
                const lvl = this.getHeadingLevel(slide.heading_html) || 1;

                if (lvl < verticalThreshold) {
                    // top-level slide
                    nodes.push({ type: 'single', slide });
                } else {
                    // vertical candidate — attach to previous top-level if exists
                    const last = nodes[nodes.length - 1];
                    if (last && last.type === 'stack') {
                        last.slides.push(slide);
                    } else if (last && last.type === 'single') {
                        // convert single to stack with parent + this child
                        nodes[nodes.length - 1] = { type: 'stack', slides: [last.slide, slide] };
                    } else {
                        // no previous parent — treat as single
                        nodes.push({ type: 'single', slide });
                    }
                }
            }

            // Render nodes
            nodes.forEach((node) => {
                if (node.type === 'single') {
                    const s = node.slide;
                    const section = document.createElement('section');
                    if (s.background) section.setAttribute('data-background-color', s.background);
                    if (s.transition) section.setAttribute('data-transition', s.transition);
                    if (s.classes) section.className = s.classes;
                    section.innerHTML = `${s.heading_html || ''}<div class="slide-content">${s.content_html || ''}</div>`;
                    if (s.notes) {
                        const aside = document.createElement('aside');
                        aside.className = 'notes';
                        aside.innerHTML = this.escapeHtml(s.notes);
                        section.appendChild(aside);
                    }
                    container.appendChild(section);
                } else if (node.type === 'stack') {
                    const wrapper = document.createElement('section');
                    node.slides.forEach((s) => {
                        const child = document.createElement('section');
                        if (s.background) child.setAttribute('data-background-color', s.background);
                        if (s.transition) child.setAttribute('data-transition', s.transition);
                        if (s.classes) child.className = s.classes;
                        child.innerHTML = `${s.heading_html || ''}<div class="slide-content">${s.content_html || ''}</div>`;
                        if (s.notes) {
                            const aside = document.createElement('aside');
                            aside.className = 'notes';
                            aside.innerHTML = this.escapeHtml(s.notes);
                            child.appendChild(aside);
                        }
                        wrapper.appendChild(child);
                    });
                    container.appendChild(wrapper);
                }
            });
        }

        // Initialize reveal.js
        this.initializeReveal();
    }

    /**
     * Format content for display (handle line breaks, lists, etc)
     */
    formatContent(content) {
        // Handle escaped newlines
        let formatted = content.replace(/\\n/g, '<br>');
        // Escape HTML
        formatted = this.escapeHtml(formatted);
        return formatted;
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Initialize reveal.js with configuration
     */
    initializeReveal() {
        Reveal.initialize({
            hash: true,
            center: true,
            transition: 'slide',
            backgroundTransition: 'fade',
            slideNumber: true,
            keyboard: true,
            touch: true,
            overview: true,
            width: '100%',
            height: '100%',
            margin: 0.1,
        });
    }

    /**
     * Show error message to user
     */
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const container = document.getElementById('slidesContainer');
        
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        container.innerHTML = `
            <div class="loading" style="flex-direction: column; gap: 20px;">
                <h2>❌ Error</h2>
                <p>${message}</p>
                <p style="font-size: 0.9em; opacity: 0.7;">Check the URL parameter and ensure the CSV is accessible.</p>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SlideShowApp();
});
