/**
 * Holiday Modal Component
 * Single global modal for holiday assignment functionality
 */

class HolidayModal {
    constructor() {
        this.modal = null;
        this.currentCard = null;
        this.onAssignCallback = null;
        this.eventListeners = new Map();
        this.init();
    }

    /**
     * Initialize the modal
     */
    init() {
        this.createModal();
        this.setupEventListeners();
    }

    /**
     * Create the modal HTML
     */
    createModal() {
        const modalHTML = `
            <div class="holiday-modal-overlay" id="holiday-modal" style="display: none;">
                <div class="holiday-modal" role="dialog" aria-modal="true">
                    <div class="holiday-modal-header">🎄 Assign Holiday Theme</div>
                    <div class="holiday-modal-options">
                        <div class="holiday-option" data-holiday="Halloween">🎃 Halloween</div>
                        <div class="holiday-option" data-holiday="Thanksgiving">🦃 Thanksgiving</div>
                        <div class="holiday-option" data-holiday="Christmas">🎄 Christmas</div>
                        <div class="holiday-option" data-holiday="New Year">🎊 New Year</div>
                        <div class="holiday-option" data-holiday="Valentine's">💝 Valentine's</div>
                        <div class="holiday-option" data-holiday="Easter">🐰 Easter</div>
                    </div>
                    <div class="holiday-modal-actions">
                        <button class="holiday-modal-btn" data-action="cancel">Cancel</button>
                        <button class="holiday-modal-btn primary" data-action="assign">Assign</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const styles = `
            <style>
                .holiday-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }

                .holiday-modal {
                    background: #2a2a2a;
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                    border: 1px solid #444;
                }

                .holiday-modal-header {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 16px;
                    text-align: center;
                    color: #e0e0e0;
                }

                .holiday-modal-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 20px;
                }

                .holiday-option {
                    padding: 12px;
                    border: 2px solid #555;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: center;
                    font-size: 14px;
                    background: #3a3a3a;
                    color: #e0e0e0;
                }

                .holiday-option:hover {
                    border-color: #2563eb;
                    background: #4a4a4a;
                }

                .holiday-option.selected {
                    border-color: #2563eb;
                    background: #1e3a8a;
                }

                .holiday-modal-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                }

                .holiday-modal-btn {
                    padding: 10px 20px;
                    border: 1px solid #555;
                    background: #3a3a3a;
                    color: #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .holiday-modal-btn.primary {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .holiday-modal-btn:hover {
                    background: #4a4a4a;
                }

                .holiday-modal-btn.primary:hover {
                    background: #1d4ed8;
                }
            </style>
        `;

        // Insert styles and modal
        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('holiday-modal');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.modal) return;

        // Holiday option selection
        const optionHandler = (e) => {
            const option = e.target.closest('.holiday-option');
            if (!option) return;

            // Clear previous selection
            this.modal.querySelectorAll('.holiday-option').forEach(opt => 
                opt.classList.remove('selected')
            );
            
            // Select current option
            option.classList.add('selected');
        };

        this.modal.addEventListener('click', optionHandler);
        this.eventListeners.set('option-selection', optionHandler);

        // Modal action buttons
        const actionHandler = (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            
            if (action === 'cancel') {
                this.close();
            } else if (action === 'assign') {
                this.assign();
            }
        };

        this.modal.addEventListener('click', actionHandler);
        this.eventListeners.set('modal-actions', actionHandler);

        // Backdrop click to close
        const backdropHandler = (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        };

        this.modal.addEventListener('click', backdropHandler);
        this.eventListeners.set('backdrop-click', backdropHandler);

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        };

        document.addEventListener('keydown', escHandler);
        this.eventListeners.set('esc-key', escHandler);
    }

    /**
     * Open the modal
     */
    open({ cardEl, onAssign }) {
        this.currentCard = cardEl;
        this.onAssignCallback = onAssign;
        
        if (this.modal) {
            this.modal.style.display = 'flex';
            
            // Clear previous selection
            this.modal.querySelectorAll('.holiday-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Focus trap
            this.modal.focus();
        }
    }

    /**
     * Close the modal
     */
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        
        this.currentCard = null;
        this.onAssignCallback = null;
    }

    /**
     * Assign the selected holiday
     */
    assign() {
        const selectedOption = this.modal?.querySelector('.holiday-option.selected');
        if (!selectedOption || !this.onAssignCallback) return;

        const holiday = selectedOption.dataset.holiday;
        this.onAssignCallback(holiday);
        this.close();
    }

    /**
     * Check if modal is open
     */
    isOpen() {
        return this.modal && this.modal.style.display !== 'none';
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        this.eventListeners.forEach((handler, type) => {
            if (type === 'esc-key') {
                document.removeEventListener('keydown', handler);
            } else if (this.modal) {
                this.modal.removeEventListener('click', handler);
            }
        });
        this.eventListeners.clear();

        // Remove modal from DOM
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

// Global instance
let holidayModalInstance = null;

/**
 * Open holiday modal (global function)
 */
window.openHolidayModal = function(options) {
    if (!holidayModalInstance) {
        holidayModalInstance = new HolidayModal();
    }
    holidayModalInstance.open(options);
};

/**
 * Destroy holiday modal (global function)
 */
window.destroyHolidayModal = function() {
    if (holidayModalInstance) {
        holidayModalInstance.destroy();
        holidayModalInstance = null;
    }
};

// Export for use in index.js
window.HolidayModal = HolidayModal;
