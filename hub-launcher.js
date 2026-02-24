/**
 * Hub Launcher Script
 * Handles quick launch form for opening tools with parameters
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('quickLaunchForm');
    const toolSelect = document.getElementById('toolSelect');
    const titleGroup = document.getElementById('titleGroup');
    const csvUrl = document.getElementById('csvUrl');
    const mapTitle = document.getElementById('mapTitle');
    const presentationFilterGroup = document.getElementById('presentationFilterGroup');
    const presentationFilter = document.getElementById('presentationFilter');
    const verticalLevelGroup = document.getElementById('verticalLevelGroup');
    const verticalLevel = document.getElementById('verticalLevel');
    const lessonGroupGroup = document.getElementById('lessonGroupGroup');
    const lessonGroup = document.getElementById('lessonGroup');
    const idGroup = document.getElementById('idGroup');
    const slideId = document.getElementById('slideId');

    // Show/hide fields based on tool selection
    toolSelect.addEventListener('change', function() {
        if (this.value === 'markmap-visualizer') {
            titleGroup.style.display = 'flex';
            mapTitle.required = true;
        } else {
            titleGroup.style.display = 'none';
            mapTitle.required = false;
            mapTitle.value = '';
        }

        // Show reveal-specific options
        if (this.value === 'reveal-slideshow') {
            presentationFilterGroup.style.display = 'flex';
            verticalLevelGroup.style.display = 'flex';
        } else {
            presentationFilterGroup.style.display = 'none';
            if (presentationFilter) presentationFilter.value = '';
            verticalLevelGroup.style.display = 'none';
            if (verticalLevel) verticalLevel.value = '';
        }

        // Show html-content-viewer-specific options
        if (this.value === 'html-content-viewer') {
            lessonGroupGroup.style.display = 'flex';
            lessonGroup.required = true;
        } else {
            lessonGroupGroup.style.display = 'none';
            lessonGroup.required = false;
            if (lessonGroup) lessonGroup.value = '';
        }

        // Show reveal-md-slideshow-specific options
        if (this.value === 'reveal-md-slideshow') {
            idGroup.style.display = 'flex';
            slideId.required = true;
        } else {
            idGroup.style.display = 'none';
            slideId.required = false;
            if (slideId) slideId.value = '';
        }
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const tool = toolSelect.value;
        const csv = csvUrl.value.trim();
        const presFilter = presentationFilter ? presentationFilter.value.trim() : '';
        const vLevel = verticalLevel ? verticalLevel.value.trim() : '';
        const lessGrp = lessonGroup ? lessonGroup.value.trim() : '';
        const sId = slideId ? slideId.value.trim() : '';

        // Validate inputs
        if (!tool) {
            showFormError('Please select a tool');
            return;
        }

        if (!csv) {
            showFormError('Please enter a CSV/Sheet URL');
            return;
        }

        // Validate URL format
        if (!isValidUrl(csv)) {
            showFormError('Please enter a valid URL');
            return;
        }

        // Build tool URL
        let toolUrl = `tools/${tool}/`;

        if (tool === 'markmap-visualizer') {
            const title = mapTitle.value.trim();
            if (!title) {
                showFormError('Please enter a map title for Markmap');
                return;
            }
            toolUrl += `?csv=${encodeURIComponent(csv)}&title=${encodeURIComponent(title)}`;
            if (presFilter) toolUrl += `&presentation_filter=${encodeURIComponent(presFilter)}`;
            if (vLevel) toolUrl += `&vertical_level=${encodeURIComponent(vLevel)}`;
        } else if (tool === 'html-content-viewer') {
            if (!lessGrp) {
                showFormError('Please enter a lesson group for HTML Content Viewer');
                return;
            }
            toolUrl += `?csv=${encodeURIComponent(csv)}&lesson_group=${encodeURIComponent(lessGrp)}`;
        } else if (tool === 'reveal-md-slideshow') {
            if (!sId) {
                showFormError('Please enter a slide ID for Reveal Markdown Slideshow');
                return;
            }
            toolUrl += `?csv=${encodeURIComponent(csv)}&id=${encodeURIComponent(sId)}`;
        } else {
            toolUrl += `?csv=${encodeURIComponent(csv)}`;
            if (presFilter) toolUrl += `&presentation_filter=${encodeURIComponent(presFilter)}`;
            if (vLevel) toolUrl += `&vertical_level=${encodeURIComponent(vLevel)}`;
        }

        // Clear any error messages
        clearFormError();

        // Redirect to tool
        window.location.href = toolUrl;
    });

    /**
     * Validate URL format
     */
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Show form error message
     */
    function showFormError(message) {
        clearFormError();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.id = 'formError';
        errorDiv.textContent = '❌ ' + message;
        form.insertBefore(errorDiv, form.firstChild);
    }

    /**
     * Clear form error message
     */
    function clearFormError() {
        const existingError = document.getElementById('formError');
        if (existingError) {
            existingError.remove();
        }
    }
});
