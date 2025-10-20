/**
 * Process: My Rows Settings UI
 * Purpose: Allow users to configure their two personalized rows from available presets
 * Data Source: ROW_PRESETS from api/content.js, user selections from user-settings.js
 * Update Path: Settings tab navigation and form submission handlers
 * Dependencies: ROW_PRESETS, getMyRows, setMyRows, i18n, analytics
 */

(function () {
  'use strict';

  console.log('⚙️ My Rows settings module loaded');

  /**
   * Render the My Rows settings panel
   * @param {HTMLElement} root - Container element to render into
   */
  window.renderMyRowsSettings = function renderMyRowsSettings(root) {
    if (!root) {
      console.error('❌ No root element provided for My Rows settings');
      return;
    }

    console.log('🎛️ Rendering My Rows settings');

    const selected = window.getMyRows ? window.getMyRows() : [null, null];

    root.innerHTML = `
      <div class="settings-subsection">
        <h3 class="settings-title">🎯 <span data-i18n="settings.my_rows">My Rows</span></h3>
        <p class="settings-description" data-i18n="settings.my_rows_description">Choose what content appears in your personalized rows on the home screen</p>
        
        <div class="my-rows-container">
          ${[0, 1]
            .map(
              (i) => `
            <div class="settings-control-group my-row-slot">
              <label class="settings-label" data-i18n="settings.row">Row</label>
              <span class="row-number">${i + 1}</span>
              <select class="settings-select" data-slot="${i}" id="row-${i}-select">
                <option value="" data-i18n="settings.none">None</option>
                ${(window.ROW_PRESETS || [])
                  .map(
                    (preset) => `
                  <option value="${preset.key}" ${selected[i]?.key === preset.key ? 'selected' : ''}>
                    ${window.t ? window.t(preset.labelKey) : preset.labelKey}
                  </option>
                `,
                  )
                  .join('')}
              </select>
              <p class="settings-hint" data-i18n="settings.row_hint">Select a content type for this row</p>
            </div>
          `,
            )
            .join('')}
        </div>

        <div class="settings-actions">
          <button class="btn btn-primary" id="save-my-rows">
            💾 <span data-i18n="common.save">Save</span>
          </button>
          <button class="btn btn-secondary" id="clear-my-rows">
            🗑️ <span data-i18n="settings.clear_rows">Clear All</span>
          </button>
        </div>

        <div class="settings-preview">
          <h4 class="settings-subtitle" data-i18n="settings.preview">Preview</h4>
          <p class="settings-hint" data-i18n="settings.preview_description">Your personalized rows will appear on the home screen in this order</p>
          <div class="preview-rows">
            ${[0, 1]
              .map((i) => {
                const preset = selected[i]
                  ? (window.ROW_PRESETS || []).find((p) => p.key === selected[i].key)
                  : null;
                return `
                <div class="preview-row">
                  <div class="preview-row-header">
                    <span class="preview-row-title">
                      ${window.t ? window.t('rows.personalized_slot', { n: i + 1 }) : `Your Row ${i + 1}`}
                    </span>
                    <span class="preview-row-content">
                      ${preset ? (window.t ? window.t(preset.labelKey) : preset.labelKey) : window.t ? window.t('settings.none') : 'None'}
                    </span>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    bindMyRowsEvents(root);
  };

  /**
   * Bind event handlers for My Rows settings
   * @param {HTMLElement} root - Container element
   */
  function bindMyRowsEvents(root) {
    // Save button
    const saveBtn = root.querySelector('#save-my-rows');
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSaveMyRows);
    }

    // Clear button
    const clearBtn = root.querySelector('#clear-my-rows');
    if (clearBtn) {
      clearBtn.addEventListener('click', handleClearMyRows);
    }

    // Live preview updates
    const selects = root.querySelectorAll('.settings-select');
    selects.forEach((select) => {
      select.addEventListener('change', updatePreview);
    });
  }

  /**
   * Handle saving My Rows configuration
   */
  function handleSaveMyRows() {
    try {
      const selects = document.querySelectorAll('.settings-select[data-slot]');
      const rows = Array.from(selects).map((select) => {
        const value = select.value;
        return value ? { type: 'preset', key: value } : null;
      });

      if (window.setMyRows) {
        const success = window.setMyRows(rows);
        if (success) {
          // Notify Home to rerender personalized section (ghost → real)
          try {
            window.dispatchEvent(
              new CustomEvent('personalized:updated', { detail: { a: rows[0], b: rows[1] } }),
            );
          } catch (e) {}

          // Show success feedback
          if (window.showNotification) {
            window.showNotification(
              window.t ? window.t('settings.saved') : 'Settings saved!',
              'success',
            );
          }

          // Track analytics if available
          if (window.analytics && window.analytics.track) {
            window.analytics.track('my_rows_saved', {
              rows: rows,
              timestamp: Date.now(),
            });
          }

          console.log('✅ My rows saved successfully:', rows);
        } else {
          throw new Error('Failed to save rows');
        }
      } else {
        throw new Error('setMyRows function not available');
      }
    } catch (error) {
      console.error('❌ Failed to save My Rows:', error);
      if (window.showNotification) {
        window.showNotification(
          window.t ? window.t('settings.save_error') : 'Failed to save settings',
          'error',
        );
      }
    }
  }

  /**
   * Handle clearing all My Rows
   */
  function handleClearMyRows() {
    if (
      confirm(
        window.t ? window.t('settings.clear_confirm') : 'Are you sure you want to clear all rows?',
      )
    ) {
      try {
        if (window.clearMyRows) {
          window.clearMyRows();

          // Reset UI
          const selects = document.querySelectorAll('.settings-select[data-slot]');
          selects.forEach((select) => {
            select.value = '';
          });

          updatePreview();

          if (window.showNotification) {
            window.showNotification(
              window.t ? window.t('settings.cleared') : 'Rows cleared!',
              'success',
            );
          }

          console.log('✅ My rows cleared');
        }
      } catch (error) {
        console.error('❌ Failed to clear My Rows:', error);
      }
    }
  }

  /**
   * Update the preview section
   */
  function updatePreview() {
    const selects = document.querySelectorAll('.settings-select[data-slot]');
    const previewRows = document.querySelectorAll('.preview-row');

    selects.forEach((select, index) => {
      const previewRow = previewRows[index];
      if (!previewRow) return;

      const value = select.value;
      const preset = value ? (window.ROW_PRESETS || []).find((p) => p.key === value) : null;
      const contentSpan = previewRow.querySelector('.preview-row-content');

      if (contentSpan) {
        contentSpan.textContent = preset
          ? window.t
            ? window.t(preset.labelKey)
            : preset.labelKey
          : window.t
            ? window.t('settings.none')
            : 'None';
      }
    });
  }
})();
