/**
 * Process: CSV Export System
 * Purpose: Export user data to CSV format for Pro users
 * Data Source: window.appData for all lists and settings
 * Update Path: Modify export format or add new export types in this file
 * Dependencies: Pro gating system, window.appData, Blob API
 */

(function () {
  'use strict';

  if (window.ExportCSV) return; // Prevent double initialization

  console.log('📊 Initializing CSV export system...');

  // Check if user is Pro
  function isPro() {
    return localStorage.getItem('flicklet:pro') === '1';
  }

  // Show Pro required message
  function showProRequired() {
    if (window.Toast && window.Toast.show) {
      window.Toast.show('CSV export is a Pro feature. Upgrade to Pro to export your data.', 'info');
    } else if (window.showNotification) {
      window.showNotification(
        'CSV export is a Pro feature. Upgrade to Pro to export your data.',
        'info',
      );
    }
  }

  // Convert data to CSV format
  function convertToCSV(data, filename) {
    if (!data || data.length === 0) {
      return null;
    }

    // Get headers from first item
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      // Headers
      headers.join(','),
      // Data rows
      ...data.map((item) =>
        headers
          .map((header) => {
            const value = item[header];
            // Escape CSV values (handle commas, quotes, newlines)
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (
              stringValue.includes(',') ||
              stringValue.includes('"') ||
              stringValue.includes('\n')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  // Prepare data for export
  function prepareExportData() {
    if (!window.appData) {
      console.warn('📊 No app data available for export');
      return null;
    }

    const exportData = [];

    // Export TV shows
    ['watching', 'wishlist', 'watched'].forEach((listType) => {
      const items = window.appData.tv?.[listType] || [];
      items.forEach((item) => {
        exportData.push({
          type: 'TV Show',
          list: listType,
          id: item.id,
          title: item.name || item.title || 'Unknown',
          overview: item.overview || '',
          first_air_date: item.first_air_date || '',
          vote_average: item.vote_average || '',
          poster_path: item.poster_path || '',
          networks: (item.networks || []).map((n) => n.name).join('; '),
          genres: (item.genres || []).map((g) => g.name).join('; '),
          added_date: item.added_date || '',
          user_rating: item.user_rating || '',
          like_status: item.like_status || '',
          notes: item.notes || '',
          tags: (item.tags || []).join('; '),
        });
      });
    });

    // Export Movies
    ['watching', 'wishlist', 'watched'].forEach((listType) => {
      const items = window.appData.movies?.[listType] || [];
      items.forEach((item) => {
        exportData.push({
          type: 'Movie',
          list: listType,
          id: item.id,
          title: item.title || item.name || 'Unknown',
          overview: item.overview || '',
          release_date: item.release_date || '',
          vote_average: item.vote_average || '',
          poster_path: item.poster_path || '',
          genres: (item.genres || []).map((g) => g.name).join('; '),
          runtime: item.runtime || '',
          added_date: item.added_date || '',
          user_rating: item.user_rating || '',
          like_status: item.like_status || '',
          notes: item.notes || '',
          tags: (item.tags || []).join('; '),
        });
      });
    });

    return exportData;
  }

  // Download CSV file
  function downloadCSV(csvContent, filename) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        // Modern browsers
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback for older browsers
        window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      }

      return true;
    } catch (error) {
      console.error('📊 CSV download failed:', error);
      return false;
    }
  }

  // Main export function
  function exportToCSV() {
    console.log('📊 Starting CSV export...');

    // Check Pro status
    if (!isPro()) {
      showProRequired();
      return false;
    }

    // Prepare data
    const data = prepareExportData();
    if (!data || data.length === 0) {
      if (window.Toast && window.Toast.show) {
        window.Toast.show(
          'No data to export. Add some shows or movies to your lists first.',
          'info',
        );
      }
      return false;
    }

    // Convert to CSV
    const csvContent = convertToCSV(data, 'flicklet-export.csv');
    if (!csvContent) {
      if (window.Toast && window.Toast.show) {
        window.Toast.show('Failed to generate CSV data.', 'error');
      }
      return false;
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `flicklet-export-${timestamp}.csv`;

    // Download file
    const success = downloadCSV(csvContent, filename);

    if (success) {
      if (window.Toast && window.Toast.show) {
        window.Toast.show(`Exported ${data.length} items to ${filename}`, 'success');
      }
      console.log('📊 CSV export completed successfully');
    } else {
      if (window.Toast && window.Toast.show) {
        window.Toast.show('Failed to download CSV file.', 'error');
      }
    }

    return success;
  }

  // Export specific list
  function exportListToCSV(listType, mediaType) {
    console.log(`📊 Exporting ${mediaType} ${listType} list...`);

    if (!isPro()) {
      showProRequired();
      return false;
    }

    if (!window.appData) {
      console.warn('📊 No app data available for export');
      return false;
    }

    const items = window.appData[mediaType]?.[listType] || [];
    if (items.length === 0) {
      if (window.Toast && window.Toast.show) {
        window.Toast.show(`No items in ${listType} list to export.`, 'info');
      }
      return false;
    }

    const exportData = items.map((item) => ({
      type: mediaType === 'tv' ? 'TV Show' : 'Movie',
      list: listType,
      id: item.id,
      title: item.name || item.title || 'Unknown',
      overview: item.overview || '',
      date: mediaType === 'tv' ? item.first_air_date || '' : item.release_date || '',
      vote_average: item.vote_average || '',
      poster_path: item.poster_path || '',
      added_date: item.added_date || '',
      user_rating: item.user_rating || '',
      like_status: item.like_status || '',
      notes: item.notes || '',
      tags: (item.tags || []).join('; '),
    }));

    const csvContent = convertToCSV(exportData, `flicklet-${mediaType}-${listType}-export.csv`);
    if (!csvContent) {
      if (window.Toast && window.Toast.show) {
        window.Toast.show('Failed to generate CSV data.', 'error');
      }
      return false;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `flicklet-${mediaType}-${listType}-${timestamp}.csv`;

    const success = downloadCSV(csvContent, filename);

    if (success) {
      if (window.Toast && window.Toast.show) {
        window.Toast.show(`Exported ${items.length} items from ${listType} list`, 'success');
      }
    }

    return success;
  }

  // Public API
  window.ExportCSV = {
    exportAll: exportToCSV,
    exportList: exportListToCSV,
    isPro: isPro,
  };

  // Also expose the main function globally for onclick handlers
  window.exportToCSV = exportToCSV;

  // Auto-bind export buttons
  function bindExportButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pro-feature="export-csv"]');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      // Check if it's a specific list export
      const listType = btn.dataset.listType;
      const mediaType = btn.dataset.mediaType;

      if (listType && mediaType) {
        exportListToCSV(listType, mediaType);
      } else {
        exportToCSV();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindExportButtons);
  } else {
    bindExportButtons();
  }

  console.log('📊 CSV export system initialized');
})();
