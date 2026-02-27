/**
 * HTML Content Concat Viewer
 * Loads a CSV and renders the row matching the provided id by concatenating
 * the fields: text_p1, text_p2, text_p3 (treated as HTML)
 *
 * Usage: ?csv=https://.../file.csv&id=the-id
 */

class ConcatContentViewerApp {
    constructor() {
        this.csvUrl = URLUtils.getParam('csv');
        this.selectedId = URLUtils.getParam('id') || URLUtils.getParam('item_id') || URLUtils.getParam('itemId');
        this.init();
    }

    init() {
        if (!this.csvUrl) {
            this.showError('No CSV URL provided. Use: ?csv=https://your-url/content.csv&id=some-id');
            return;
        }

        if (!this.selectedId) {
            this.showError('No id specified. Use: ?csv=...&id=some-id');
            return;
        }

        this.loadCSV();
    }

    async loadCSV() {
        try {
            const csvText = await URLUtils.fetchCSV(this.csvUrl);
            const rows = CSVUtils.parseCSVText(csvText);

            // find row by common id field names
            const idFieldNames = ['id', 'Id', 'ID', 'item_id', 'itemId', 'unique_id'];
            const row = rows.find(r => {
                for (const fname of idFieldNames) {
                    if (typeof r[fname] !== 'undefined') {
                        if (String(r[fname]).trim() === String(this.selectedId).trim()) return true;
                    }
                }
                return false;
            });

            if (!row) throw new Error(`No row found with id: "${this.selectedId}"`);

            // Concatenate the three text parts and render as HTML
            const p1 = row.text_p1 || row.textP1 || '';
            const p2 = row.text_p2 || row.textP2 || '';
            const p3 = row.text_p3 || row.textP3 || '';

            const html = `${p1}${p2}${p3}`;

            this.renderHTML(html);
        } catch (err) {
            this.showError(`Failed to load content: ${err.message}`);
        }
    }

    renderHTML(html) {
        const container = document.getElementById('contentContainer');
        container.innerHTML = '';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'concat-content';
        contentDiv.innerHTML = html;

        // Generate a table of contents from headings inside contentDiv
        const toc = this.generateTableOfContents(contentDiv);

        if (toc) container.appendChild(toc);
        container.appendChild(contentDiv);
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
     * Build and return a TOC element based on headings inside a container.
     * Also ensures each heading has a unique id.
     */
    generateTableOfContents(contentDiv) {
        const headingSelector = 'h1,h2,h3,h4,h5,h6';
        const headings = Array.from(contentDiv.querySelectorAll(headingSelector));
        if (!headings.length) return null;

        const tocEntries = headings.map((h, i) => {
            const text = (h.textContent || '').trim();
            const level = parseInt(h.tagName.replace(/[^0-9]/g, ''), 10) || 3;
            const baseId = this.slugify(text) || 'heading';
            const id = h.id ? h.id : `heading-${baseId}-${i}`;
            // Ensure the heading has the id
            if (!h.id) h.id = id;
            return { text, level, id };
        });

        const minLevel = Math.min(...tocEntries.map(e => e.level));

        const tocDiv = document.createElement('div');
        tocDiv.className = 'table-of-contents';

        const tocTitle = document.createElement('div');
        tocTitle.className = 'toc-title';
        tocTitle.textContent = 'Contents';
        tocDiv.appendChild(tocTitle);

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        let currentLevel = minLevel;
        let currentUl = tocList;
        const levelStack = [{ level: minLevel, ul: tocList }];

        tocEntries.forEach(entry => {
            if (entry.level > currentLevel) {
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
                while (entry.level < currentLevel && levelStack.length > 1) {
                    levelStack.pop();
                    currentLevel -= 1;
                }
                currentUl = levelStack[levelStack.length - 1].ul;
            }

            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${entry.id}`;
            link.textContent = entry.text;
            li.appendChild(link);
            currentUl.appendChild(li);
        });

        tocDiv.appendChild(tocList);
        return tocDiv;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        console.error('ConcatContentViewerApp Error:', message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ConcatContentViewerApp();
});
