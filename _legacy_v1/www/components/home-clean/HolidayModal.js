/**
 * HolidayModal Component - Holiday Assignment Modal
 * Phase 4: Modular Component Architecture
 */

class HolidayModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentCard = null;
        this.holidays = [
            'Christmas', 'Halloween', 'Valentine\'s Day', 'Easter', 
            'Thanksgiving', 'New Year\'s', 'Independence Day', 'Labor Day',
            'Memorial Day', 'Veterans Day', 'Mother\'s Day', 'Father\'s Day'
        ];
    }

    /**
     * Create the modal element
     */
    createModal() {
        if (this.modal) return this.modal;

        const modal = document.createElement('div');
        modal.className = 'holiday-modal';
        modal.id = 'holiday-modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="modal-overlay" data-close="true"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Assign Holiday</h3>
                    <button class="modal-close" data-close="true">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="card-title"></p>
                    <div class="holiday-grid">
                        ${this.holidays.map(holiday => `
                            <button class="holiday-option" data-holiday="${holiday}">
                                ${holiday}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" data-close="true">Cancel</button>
                </div>
            </div>
        `;

        this.modal = modal;
        document.body.appendChild(modal);
        this.setupEventListeners();
        
        return modal;
    }

    /**
     * Setup event listeners for the modal
     */
    setupEventListeners() {
        if (!this.modal) return;

        // Close modal handlers
        this.modal.addEventListener('click', (e) => {
            if (e.target.dataset.close === 'true') {
                this.close();
            }
        });

        // Holiday selection handlers
        this.modal.addEventListener('click', (e) => {
            const holidayBtn = e.target.closest('.holiday-option');
            if (holidayBtn) {
                const holiday = holidayBtn.dataset.holiday;
                this.selectHoliday(holiday);
            }
        });

        // Keyboard handlers
        document.addEventListener('keydown', (e) => {
            if (this.isOpen && e.key === 'Escape') {
                this.close();
            }
        });
    }

    /**
     * Open the modal for a specific card
     */
    open(options = {}) {
        this.createModal();
        
        this.currentCard = options;
        this.isOpen = true;
        
        // Update modal content
        const titleEl = this.modal.querySelector('.card-title');
        if (titleEl) {
            titleEl.textContent = `Assign holiday for: ${options.title || 'Unknown'}`;
        }
        
        // Show modal
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus first holiday option
        const firstOption = this.modal.querySelector('.holiday-option');
        if (firstOption) {
            firstOption.focus();
        }
        
        console.log('[HolidayModal] Opened for:', options.title);
    }

    /**
     * Close the modal
     */
    close() {
        if (!this.modal || !this.isOpen) return;
        
        this.isOpen = false;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Clear current card
        this.currentCard = null;
        
        console.log('[HolidayModal] Closed');
    }

    /**
     * Select a holiday and assign it
     */
    selectHoliday(holiday) {
        if (!this.currentCard) return;
        
        console.log('[HolidayModal] Selected holiday:', holiday);
        
        // Call the assignment callback
        if (this.currentCard.onAssign) {
            this.currentCard.onAssign(holiday);
        }
        
        // Close modal
        this.close();
    }

    /**
     * Destroy the modal
     */
    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
        this.isOpen = false;
        this.currentCard = null;
    }
}

// Export for global access
window.HolidayModal = HolidayModal;
