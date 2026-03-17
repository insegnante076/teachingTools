/**
 * Reveal Markdown Slideshow Application
 * Loads slide content from CSV URL and ID, concatenates markdown fields, displays in reveal.js
 */

class MarkdownSlideShowApp {
    constructor() {
        this.csvUrl = URLUtils.getParam('csv');
        this.slideId = URLUtils.getParam('id');
        this.init();
    }

    init() {
        if (!this.csvUrl) {
            this.showError('No CSV URL provided. Use: ?csv=https://your-url/slides.csv&id=your_id');
            return;
        }
        if (!this.slideId) {
            this.showError('No ID provided. Use: ?csv=https://your-url/slides.csv&id=your_id');
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
            const rows = CSVUtils.parseCSVText(csvText);

            // Find the row with matching id
            const row = rows.find(r => (r.id || r.ID) === this.slideId);
            if (!row) {
                throw new Error(`No row found with id: ${this.slideId}`);
            }

            // Concatenate slides_p1, slides_p2, slides_p3
            const markdown = [row.slides_p1, row.slides_p2, row.slides_p3]
                .filter(content => content && content.trim())
                .join('\n');

            if (!markdown.trim()) {
                throw new Error('No slide content found in slides_p1, slides_p2, or slides_p3');
            }

            this.renderSlides(markdown);
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Render slides using reveal.js markdown plugin
     */
    renderSlides(markdown) {
        const slidesContainer = document.getElementById('slidesContainer');
        slidesContainer.innerHTML = this.buildRevealSections(markdown);

        // Initialize Reveal.js
        Reveal.initialize({
            hash: true,
            transition: 'fade',           // default fade transition between slides
            backgroundTransition: 'fade',
            plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealMath],
            math: {
                katex: '../../lib/katex/0.16.9/dist/katex.min.js',
                css: '../../lib/katex/0.16.9/dist/katex.min.css',
                options: {
                    displayMode: false,
                    leqno: false,
                    fleqn: false,
                    macros: {},
                    throwOnError: false
                }
            }
        });

        // Fix aria-hidden warning by using inert instead for future slides
        Reveal.addEventListener('ready', () => {
            const fixAriaHidden = () => {
                document.querySelectorAll('section.future[aria-hidden]').forEach(section => {
                    section.setAttribute('inert', 'true');
                    section.removeAttribute('aria-hidden');
                });
            };
            fixAriaHidden();
            Reveal.addEventListener('slidechanged', fixAriaHidden);
        });
    }

    /**
     * Build Reveal section markup from markdown using explicit separators.
     *
     * This avoids relying on reveal.js parsing of separator/verticalSeparator
     * options, which can be affected by whitespace differences in CSV content.
     */
    buildRevealSections(markdown) {
        const escapeTextarea = (text) => text.replace(/<\/textarea>/gi, '<\\/textarea>');
        const makeSection = (content) => `
            <section data-markdown>
                <textarea data-template>${escapeTextarea(content)}</textarea>
            </section>
        `;

        const horizontalChunks = markdown.split(/\r?\n---\r?\n/);
        return horizontalChunks.map(chunk => {
            const verticalChunks = chunk.split(/\r?\n--\r?\n/);
            if (verticalChunks.length <= 1) {
                return makeSection(chunk);
            }
            const inner = verticalChunks.map(makeSection).join('');
            return `<section>${inner}</section>`;
        }).join('');
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (!errorDiv) {
            console.error('Error: errorMessage element not found');
            return;
        }
        errorDiv.textContent = `❌ Error: ${message}`;
        errorDiv.style.display = 'block';
        const loading = document.querySelector('.loading');
        if (loading) loading.style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownSlideShowApp();
});