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
                    return item.lesson_group === this.lessonGroup && item.heading;
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
     * Get heading level from HTML heading tag
     */
    getHeadingLevel(headingHtml) {
        const match = headingHtml.match(/<h([1-6])/i);
        return match ? parseInt(match[1]) : 3; // default to h3
    }

    /**
     * Extract text content from HTML
     */
    extractText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').trim();
    }

    /**
     * Generate slug from text for use as ID
     */
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    /**
     * Render table of contents
     */
    renderTableOfContents() {
        const container = document.getElementById('contentContainer');
        
        // Build TOC entries
        const tocEntries = this.contents.map((item, index) => {
            const text = this.extractText(item.heading);
            const level = this.getHeadingLevel(item.heading);
            const id = `heading-${this.slugify(text)}-${index}`;
            
            return { text, level, id, index };
        });

        // Find min level for proper indentation
        const minLevel = Math.min(...tocEntries.map(e => e.level));

        // Create TOC container
        const tocDiv = document.createElement('div');
        tocDiv.className = 'table-of-contents';

        const tocTitle = document.createElement('div');
        tocTitle.className = 'toc-title';
        tocTitle.textContent = 'Contents';
        tocDiv.appendChild(tocTitle);

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        // Build nested ul structure
        let currentLevel = minLevel;
        let currentUl = tocList;
        const levelStack = [{ level: minLevel, ul: tocList }];

        tocEntries.forEach(entry => {
            // Adjust nesting based on level
            if (entry.level > currentLevel) {
                // Go deeper
                while (entry.level > currentLevel) {
                    const newUl = document.createElement('ul');
                    if (currentUl.lastElementChild) {
                        currentUl.lastElementChild.appendChild(newUl);
                    } else {
                        currentUl.appendChild(newUl);
                    }
                    levelStack.push({ level: currentLevel + 1, ul: newUl });
                    currentUl = newUl;
                    currentLevel += 1;
                }
            } else if (entry.level < currentLevel) {
                // Go shallower
                while (entry.level < currentLevel && levelStack.length > 1) {
                    levelStack.pop();
                    currentLevel -= 1;
                }
                currentUl = levelStack[levelStack.length - 1].ul;
            }

            // Create list item with link
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${entry.id}`;
            link.textContent = entry.text;
            li.appendChild(link);
            currentUl.appendChild(li);

            // Store ID for later use when rendering content
            this.contents[entry.index]._id = entry.id;
        });

        tocDiv.appendChild(tocList);
        container.appendChild(tocDiv);
    }

    /**
     * Render all content items
     */
    renderContent() {
        const container = document.getElementById('contentContainer');
        container.innerHTML = '';

        // First, render table of contents
        this.renderTableOfContents();

        // Then render content items
        let previousHeadingLevel = null;
        
        this.contents.forEach((item, index) => {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content-item';
            contentDiv.id = item._id;
            
            const heading = document.createElement('div');
            heading.className = 'content-heading';
            heading.innerHTML = item.heading;
            
            contentDiv.appendChild(heading);
            
            // Only add content body if there's content
            if (item.content) {
                const body = document.createElement('div');
                body.className = 'content-body';
                body.innerHTML = item.content;
                contentDiv.appendChild(body);
            }
            container.appendChild(contentDiv);

            // Add separator only when moving to a higher-level heading (lower number = higher level)
            if (index > 0) {
                const currentLevel = this.getHeadingLevel(item.heading);
                if (previousHeadingLevel !== null && currentLevel < previousHeadingLevel) {
                    const separator = document.createElement('hr');
                    separator.className = 'content-separator';
                    container.insertBefore(separator, contentDiv);
                }
                previousHeadingLevel = currentLevel;
            } else {
                previousHeadingLevel = this.getHeadingLevel(item.heading);
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
