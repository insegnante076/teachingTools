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
                .join('\n\n');

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
        slidesContainer.innerHTML = `
            <section data-markdown>
                <textarea data-template>${markdown}</textarea>
            </section>
        `;

        // Initialize Reveal.js
        Reveal.initialize({
            hash: true,
            plugins: [RevealMarkdown, RevealHighlight, RevealNotes]
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = `❌ Error: ${message}`;
        errorDiv.style.display = 'block';
        document.querySelector('.loading').style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownSlideShowApp();
});