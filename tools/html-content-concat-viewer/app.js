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

        container.appendChild(contentDiv);
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
