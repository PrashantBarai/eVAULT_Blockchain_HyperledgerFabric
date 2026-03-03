/**
 * Standard date formatting utility for eVAULT application.
 * All dates are displayed in dd/mm/yyyy HH:mm format (IST).
 */

/**
 * Format a date string or Date object to dd/mm/yyyy HH:mm
 * @param {string|Date} dateInput - Date string (ISO/any) or Date object
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} Formatted date string in dd/mm/yyyy HH:mm format
 */
export const formatDate = (dateInput, includeTime = true) => {
    if (!dateInput) return 'N/A';

    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'N/A';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        if (!includeTime) {
            return `${day}/${month}/${year}`;
        }

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
        return 'N/A';
    }
};

/**
 * Format a date as relative time (e.g., "5 mins ago") with fallback to dd/mm/yyyy HH:mm
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Relative time string or formatted date
 */
export const formatRelativeDate = (dateInput) => {
    if (!dateInput) return 'N/A';

    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'N/A';

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return formatDate(date);
    } catch {
        return 'N/A';
    }
};

/**
 * Date format label to display on pages
 */
export const DATE_FORMAT_LABEL = '(dd/mm/yyyy HH:mm)';
