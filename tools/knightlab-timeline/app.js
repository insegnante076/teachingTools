/**
 * Knight Lab Timeline Application
 * Loads event data from CSV URL and creates an interactive timeline
 */

class TimelineApp {
    constructor() {
        this.csvUrl = URLUtils.getParam('csv');
        this.events = [];
        this.timelineInstance = null;
        this.init();
    }

    init() {
        if (!this.csvUrl) {
            this.showError('No CSV URL provided. Use: ?csv=https://your-url/timeline.csv');
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
            // Use shared CSV parser to get rows as objects (header -> value)
            const rows = CSVUtils.parseCSVText(csvText);
            this.parseRows(rows);
            this.createTimeline();
        } catch (error) {
            this.showError(`Failed to load CSV: ${error.message}`);
        }
    }

    /**
     * Convert parsed CSV rows (objects) into timeline events.
     * Supports KnightLab-style headers like: Year,Month,Day,Time,End Year,...,Headline,Text,Media,Media Credit,Media Caption,Media Thumbnail,Type,Group,Background
     */
    parseRows(rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error('CSV file is empty or could not be parsed');
        }

        const getField = (obj, names) => {
            if (!obj) return '';
            // case-insensitive lookup
            const keys = Object.keys(obj);
            for (const name of names) {
                const lower = name.toLowerCase();
                for (const k of keys) {
                    if ((k || '').toLowerCase() === lower) return (obj[k] || '').trim();
                }
            }
            return '';
        };

        rows.forEach(row => {
            const year = this.parseNumber(getField(row, ['Year', 'year', 'Start Year', 'start year']));
            const month = this.parseNumber(getField(row, ['Month', 'month', 'Start Month', 'start month'])) || 1;
            const day = this.parseNumber(getField(row, ['Day', 'day', 'Start Day', 'start day'])) || 1;
            const time = getField(row, ['Time', 'time']);
            const headline = getField(row, ['Headline', 'headline', 'Title', 'title']);
            const text = getField(row, ['Text', 'text', 'Description', 'description']);
            const mediaUrl = getField(row, ['Media', 'media', 'Media URL', 'media_url']);
            const mediaCredit = getField(row, ['Media Credit', 'media credit', 'credit']);
            const mediaCaption = getField(row, ['Media Caption', 'media caption', 'caption']);
            const mediaThumb = getField(row, ['Media Thumbnail', 'media thumbnail', 'thumbnail']);
            const group = getField(row, ['Group', 'group', 'Type', 'type']);
            const background = getField(row, ['Background', 'background']);

            if (!year || !headline) return; // skip invalid

            const event = {
                start_date: {
                    year: year,
                    month: Math.max(1, Math.min(12, month)),
                    day: Math.max(1, Math.min(31, day))
                },
                text: {
                    headline: headline,
                    // keep HTML in text as provided in CSV (allow <p>, <strong>, etc.)
                    text: text || ''
                }
            };

            // Attach media when available
            if (mediaUrl) {
                event.media = {
                    url: mediaUrl,
                    caption: mediaCaption || '',
                    credit: mediaCredit || ''
                };
                if (mediaThumb) event.media.thumbnail = mediaThumb;
            }

            if (group) event.group = group;
            if (background) {
                // Timeline.js expects a background object with color (e.g. { color: '#01724C' })
                event.background = { color: background };
            }

            this.events.push(event);
        });

        if (this.events.length === 0) {
            throw new Error('No valid events found in CSV');
        }
    }

    /**
     * Create an event object from CSV fields
     * Fields: year, month, day, text, headline, [media_url], [media_caption]
     */
    createEventFromFields(fields) {
        const year = this.parseNumber(fields[0]);
        const month = fields.length > 1 ? this.parseNumber(fields[1]) : 1;
        const day = fields.length > 2 ? this.parseNumber(fields[2]) : 1;
        const text = fields.length > 3 ? fields[3].trim() : '';
        const headline = fields.length > 4 ? fields[4].trim() : '';
        const mediaUrl = fields.length > 5 ? fields[5].trim() : '';
        const mediaCaption = fields.length > 6 ? fields[6].trim() : '';

        if (!year || !headline) {
            return null;
        }

        const event = {
            start_date: {
                year: year,
                month: Math.max(1, Math.min(12, month)),
                day: Math.max(1, Math.min(31, day))
            },
            text: {
                headline: this.escapeHtml(headline),
                text: this.formatContent(text)
            }
        };

        // Add media if provided
        if (mediaUrl) {
            event.media = {
                url: mediaUrl,
                caption: this.escapeHtml(mediaCaption || '')
            };
        }

        return event;
    }

    /**
     * Parse a CSV line handling quoted fields
     */
    // legacy line parser removed — using CSVUtils.parseCSVText for robust parsing

    /**
     * Parse string to number
     */
    parseNumber(str) {
        const num = parseInt(str.trim(), 10);
        return isNaN(num) ? null : num;
    }

    /**
     * Format content for display (handle line breaks)
     */
    formatContent(content) {
        if (!content) return '';
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
     * Create timeline with Knight Lab Timeline.js
     */
    createTimeline() {
        // Normalize events: Timeline.js expects string values for date parts
        const normalizedEvents = this.events.map(ev => {
            const sd = ev.start_date || {};
            const nd = {
                year: sd.year !== undefined && sd.year !== null ? String(sd.year) : '0',
                month: sd.month !== undefined && sd.month !== null ? String(sd.month) : '1',
                day: sd.day !== undefined && sd.day !== null ? String(sd.day) : '1'
            };
            const ne = Object.assign({}, ev, { start_date: nd });
            return ne;
        });

        const timelineData = {
            events: normalizedEvents
        };

        // Hide loading container
        document.getElementById('loadingContainer').style.display = 'none';

        // Initialize timeline with try/catch to report initialization errors
        try {
            this.timelineInstance = new TL.Timeline(
                'timeline',
                timelineData,
                {
                    scale_factor: 2,
                    language: 'en',
                    hash_bookmark: true,
                    debug: false
                }
            );
        } catch (err) {
            console.error('Timeline initialization error:', err);
            this.showError(`Timeline init failed: ${err && err.message ? err.message : String(err)}`);
            return;
        }

        // Responsive resize
        window.addEventListener('resize', () => {
            if (this.timelineInstance) {
                this.timelineInstance.updateDisplay();
            }
        });
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
                <p style="font-size: 0.9em; opacity: 0.7;">Check the URL parameter and ensure the CSV is accessible.</p>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TimelineApp();
});
