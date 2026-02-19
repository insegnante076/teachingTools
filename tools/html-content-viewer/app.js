/**
 * HTML Content Viewer Application
 * Loads content from CSV URL and displays filtered by lesson_group
 */

class ContentViewerApp {
    constructor() {
        this.csvUrl = URLUtils.getParam('csv');
        this.lessonGroup = URLUtils.getParam('lesson_group') || URLUtils.getParam('lessonGroup');
        this.contents = [];
        this.init();
    }

    init() {
        if (!this.csvUrl) {
            this.showError('No CSV URL provided. Use: ?csv=https://your-url/content.csv&lesson_group=lesson1');
            return;
        }

        if (!this.lessonGroup) {
            this.showError('No lesson_group specified. Use: ?csv=...&lesson_group=lesson1');
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
            
            // Map rows to internal content model and filter by lesson_group
            this.contents = rows
                .map(r => ({
                    heading: (r.heading || '').trim(),
                    content: (r.content || '').trim(),
                    lesson_group: (r.lesson_group || '').trim()
                }))
                .filter(item => {
                    return item.lesson_group === this.lessonGroup && item.heading && item.content;
                });

            if (this.contents.length === 0) {
                throw new Error(`No content found for lesson_group: "${this.lessonGroup}"`);
            }

            this.renderContent();
        } catch (error) {
            this.showError(`Failed to load content: ${error.message}`);
        }
    }

    /**
     * Render all content items
     */
    renderContent() {
        const container = document.getElementById('contentContainer');
        container.innerHTML = '';

        this.contents.forEach((item, index) => {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content-item';
            
            const heading = document.createElement('div');
            heading.className = 'content-heading';
            heading.innerHTML = item.heading;
            
            const body = document.createElement('div');
            body.className = 'content-body';
            body.innerHTML = item.content;
            
            contentDiv.appendChild(heading);
            contentDiv.appendChild(body);
            container.appendChild(contentDiv);

            // Add separator between items, but not after the last one
            if (index < this.contents.length - 1) {
                const separator = document.createElement('hr');
                separator.className = 'content-separator';
                container.appendChild(separator);
            }
        });
    }

    /**
     * Display error message
     */
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        console.error('ContentViewerApp Error:', message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ContentViewerApp();
});
