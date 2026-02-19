/**
 * Markmap Visualizer Application
 * Loads markdown mind maps from CSV and renders them as visual maps
 */

class MarkmapApp {
    constructor() {
        this.csvUrl = URLUtils.getParam('csv');
        this.mapTitle = URLUtils.getParam('title');
        this.maps = [];
        this.markmapInstance = null;
        this.initDelay = 0;
        this.init();
    }

    init() {
        if (!this.csvUrl) {
            this.showError('No CSV URL provided. Use: ?csv=https://your-url/maps.csv&title=MapId');
            return;
        }

        if (!this.mapTitle) {
            this.showError('No map id provided. Use: ?csv=...&title=MapId');
            return;
        }

        this.loadCSV();
    }

    /**
     * Wait for required libraries to load
     */
    async waitForLibraries(maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.d3 && window.markmap && window.markmap.Markmap) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Markmap libraries failed to load. Please refresh the page.');
    }

    /**
     * Load and parse CSV from URL
     */
    async loadCSV() {
        try {
            const csvText = await URLUtils.fetchCSV(this.csvUrl);
            this.parseCSV(csvText);
            await this.displayMap();
        } catch (error) {
            this.showError(`Failed to load CSV: ${error.message}`);
        }
    }

    /**
     * Parse CSV content into mind maps
     * Expected format:
     * id,markdown OR title,markdown
     */
    parseCSV(csvText) {
        // Use shared CSVUtils which leverages PapaParse if available
        const rows = CSVUtils.parseCSVText(csvText || '');

        if (!rows || rows.length === 0) {
            throw new Error('No valid maps found in CSV');
        }

        // Determine key names (case-insensitive)
        const keyNames = Object.keys(rows[0]).map(k => k.toLowerCase());

        rows.forEach(row => {
            // find identifier and markdown keys
            const keys = Object.keys(row);
            const idKey = keys.find(k => /^(id|title)$/i.test(k));
            const mdKey = keys.find(k => /^(markdown|md|content)$/i.test(k));

            const identifier = idKey ? (row[idKey] || '').trim() : '';
            const markdown = mdKey ? (row[mdKey] || '').trim() : '';

            if (identifier && markdown) {
                this.maps.push({ id: identifier, title: identifier, markdown });
            }
        });

        if (this.maps.length === 0) {
            throw new Error('No valid maps found in CSV');
        }
    }

    /**
     * Find and display the map with matching title/id
     */
    async displayMap() {
        try {
            // Wait for Markmap library to load
            await this.waitForLibraries();

            const map = this.maps.find(
                m => m.id.toLowerCase() === this.mapTitle.toLowerCase() || 
                     m.title.toLowerCase() === this.mapTitle.toLowerCase()
            );

            if (!map) {
                const availableIds = this.maps.map(m => `"${m.id}"`).join(', ');
                this.showError(
                    `Map with id "${this.mapTitle}" not found. Available maps: ${availableIds}`
                );
                return;
            }

            this.renderMarkedMap(map.markdown, map.id || map.title);
        } catch (error) {
            console.error('Display map error:', error);
            this.showError(`Error: ${error.message}`);
        }
    }

    /**
     * Render markdown as markmap
     */
    renderMarkedMap(markdown, title) {
        try {
            // Hide loading container and show markmap container
            const loadingContainer = document.getElementById('loadingContainer');
            const markmapContainer = document.getElementById('markmapContainer');
            
            loadingContainer.style.display = 'none';
            markmapContainer.style.display = 'flex';
            markmapContainer.classList.add('show');

            // Handle escaped newlines in markdown
            const processedMarkdown = markdown.replace(/\\n/g, '\n');

            console.log('Processing markdown:', processedMarkdown);

            // Get the SVG element
            const svg = document.getElementById('mindmap');
            const debugDiv = document.getElementById('debug');

            // Clear any previous content
            while (svg.firstChild) {
                svg.removeChild(svg.firstChild);
            }

            // Set SVG attributes for proper rendering
            // Set SVG size in pixels based on container to allow Markmap.fit() to compute viewBox
            const containerRect = markmapContainer.getBoundingClientRect();
            const w = Math.max(300, Math.round(containerRect.width || window.innerWidth));
            const h = Math.max(200, Math.round(containerRect.height || window.innerHeight));
            svg.setAttribute('width', String(w));
            svg.setAttribute('height', String(h));
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.display = 'block';
            svg.style.background = 'transparent';

            // Get Markmap utilities
            const { Transformer, Markmap } = window.markmap;

            if (!Transformer || !Markmap) {
                const available = Object.keys(window.markmap || {}).join(', ');
                throw new Error('Markmap library not properly initialized. Available: ' + available);
            }

            console.log('Markmap Transformer and Markmap available');
            if (debugDiv) debugDiv.textContent = 'Libraries loaded ✓';

            // Create transformer and transform markdown
            const transformer = new Transformer();
            
            // Transform the markdown - this returns the tree structure
            const { root } = transformer.transform(processedMarkdown);

            console.log('Transformed markdown to tree:', root);
            console.log('Root children:', root.children?.length || 0);
            if (debugDiv) debugDiv.textContent += '\nMarkdown parsed ✓';

            // Create Markmap instance and render to SVG
            const mm = new Markmap(svg, {
                duration: 300,
                maxWidth: 300,
                spacingHorizontal: 80,
                spacingVertical: 5,
            }, root);
            
            console.log('Markmap instance created:', mm);
            try {
                const proto = Object.getPrototypeOf(mm) || {};
                console.log('Markmap prototype methods:', Object.getOwnPropertyNames(proto));
                console.log('Markmap own keys:', Object.keys(mm));

                if (typeof mm.setData === 'function') {
                    console.log('Calling mm.setData(root)');
                    mm.setData(root);
                } else if (typeof mm.update === 'function') {
                    console.log('Calling mm.update(root)');
                    mm.update(root);
                } else if (typeof mm.setRoot === 'function') {
                    console.log('Calling mm.setRoot(root)');
                    mm.setRoot(root);
                } else {
                    console.log('No setData/update/setRoot methods found on Markmap instance');
                }
            } catch (e) {
                console.error('Error while trying alternative Markmap methods:', e);
            }
            console.log('SVG innerHTML length:', svg.innerHTML.length);
            console.log('SVG childNodes:', svg.childNodes.length);
            // Dump first 2000 chars of innerHTML for debugging
            try {
                console.log('SVG innerHTML (preview):', svg.innerHTML && svg.innerHTML.slice(0, 2000));
            } catch (e) {
                console.error('Error reading svg.innerHTML preview:', e);
            }
            
            // Check if SVG has content
            if (svg.innerHTML.length > 0) {
                if (debugDiv) debugDiv.textContent += '\nSVG rendered ✓ (' + svg.innerHTML.length + ' bytes)';
            } else {
                if (debugDiv) debugDiv.textContent += '\nSVG empty ⚠️';
                throw new Error('SVG rendering produced no output');
            }

            // Fit to view after slight delay to ensure DOM is ready
            setTimeout(() => {
                try {
                    mm.fit();
                    console.log('Markmap fit() called successfully');
                    const vb = svg.getAttribute('viewBox');
                    console.log('SVG viewBox:', vb);
                    // show final svg outerHTML size
                    try {
                        console.log('Final SVG outerHTML length:', svg.outerHTML ? svg.outerHTML.length : 0);
                    } catch (e) {
                        console.error('Error reading svg.outerHTML:', e);
                    }
                    if (debugDiv) debugDiv.textContent += '\nViewBox: ' + (vb || 'none');
                } catch (e) {
                    console.error('Error calling fit():', e);
                    if (debugDiv) debugDiv.textContent += '\nFit error: ' + e.message;
                }
            }, 100);

            // Update document title
            document.title = `${title} - Markmap Visualizer`;

            console.log('Mind map rendered successfully');
            if (debugDiv) debugDiv.textContent += '\n✓ Done!';

        } catch (error) {
            console.error('Markmap rendering error:', error);
            console.error('Window.markmap contents:', window.markmap);
            console.error('Error stack:', error.stack);
            const debugDiv = document.getElementById('debug');
            if (debugDiv) debugDiv.textContent = '❌ Error: ' + error.message;
            this.showError(`Failed to render mind map: ${error.message}`);
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        const loadingContainer = document.getElementById('loadingContainer');
        loadingContainer.innerHTML = `
            <div class="error-box">
                <h2>❌ Error</h2>
                <p>${message}</p>
                <p style="font-size: 0.9em; opacity: 0.7;">Check the URL parameters and ensure the CSV is accessible.</p>
            </div>
        `;
        loadingContainer.style.display = 'flex';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MarkmapApp();
});
