/**
 * Draggable Modal Utility
 * Purpose: Shared functionality for draggable and resizable modals
 * Data Source: DOM elements
 * Update Path: Update modal selectors if needed
 * Dependencies: DOM API
 */

export class DraggableModal {
  constructor(modalId, options = {}) {
    this.modalId = modalId;
    this.modal = document.getElementById(modalId);
    this.options = {
      minWidth: 300,
      minHeight: 200,
      maxWidth: window.innerWidth * 0.9,
      maxHeight: window.innerHeight * 0.9,
      ...options
    };
    
    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.modalPosition = { x: 0, y: 0 };
    this.modalSize = { width: 500, height: 600 };
    
    this.init();
  }

  init() {
    if (!this.modal) {
      console.error(`❌ Modal with id "${this.modalId}" not found`);
      return;
    }

    this.setupModal();
    this.setupEventListeners();
    this.centerModal();
  }

  setupModal() {
    const dialog = this.modal.querySelector('.gm-dialog');
    if (!dialog) {
      console.error(`❌ .gm-dialog not found in modal "${this.modalId}"`);
      return;
    }

    // Add draggable classes
    dialog.classList.add('gm-draggable');
    
    // Create resize handle if it doesn't exist
    if (!dialog.querySelector('.gm-resize-handle')) {
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'gm-resize-handle';
      dialog.appendChild(resizeHandle);
    }

    // Make header draggable
    const header = dialog.querySelector('.gm-header');
    if (header) {
      header.classList.add('gm-drag-handle');
    }
  }

  setupEventListeners() {
    const dialog = this.modal.querySelector('.gm-dialog');
    if (!dialog) return;

    // Mouse down events
    dialog.addEventListener('mousedown', this.handleMouseDown.bind(this));
    
    // Global mouse events
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Resize handle events
    const resizeHandle = dialog.querySelector('.gm-resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', this.handleResizeStart.bind(this));
    }

    // Escape key
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleMouseDown(e) {
    // Only start dragging if clicking on header or drag handle
    if (e.target.classList.contains('gm-drag-handle') || 
        e.target.closest('.gm-drag-handle')) {
      e.preventDefault();
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragOffset = { 
        x: e.clientX - this.modalPosition.x, 
        y: e.clientY - this.modalPosition.y 
      };
      
      // Add dragging class for visual feedback
      this.modal.querySelector('.gm-dialog').classList.add('gm-dragging');
    }
  }

  handleResizeStart(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    
    // Add resizing class for visual feedback
    this.modal.querySelector('.gm-dialog').classList.add('gm-resizing');
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.dragStart.x;
      const deltaY = e.clientY - this.dragStart.y;
      
      this.modalPosition = {
        x: this.dragOffset.x + deltaX,
        y: this.dragOffset.y + deltaY
      };
      
      this.updateModalPosition();
    } else if (this.isResizing) {
      const deltaX = e.clientX - this.dragStart.x;
      const deltaY = e.clientY - this.dragStart.y;
      
      this.modalSize = {
        width: Math.max(this.options.minWidth, 
               Math.min(this.options.maxWidth, this.modalSize.width + deltaX)),
        height: Math.max(this.options.minHeight, 
                Math.min(this.options.maxHeight, this.modalSize.height + deltaY))
      };
      
      this.updateModalSize();
      this.dragStart = { x: e.clientX, y: e.clientY };
    }
  }

  handleMouseUp() {
    if (this.isDragging || this.isResizing) {
      this.isDragging = false;
      this.isResizing = false;
      
      // Remove visual feedback classes
      const dialog = this.modal.querySelector('.gm-dialog');
      if (dialog) {
        dialog.classList.remove('gm-dragging', 'gm-resizing');
      }
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.isModalOpen()) {
      this.closeModal();
    }
  }

  updateModalPosition() {
    const dialog = this.modal.querySelector('.gm-dialog');
    if (dialog) {
      // Use transform for smooth positioning without affecting layout
      dialog.style.transform = `translate(${this.modalPosition.x}px, ${this.modalPosition.y}px)`;
      dialog.style.position = 'relative';
    }
  }

  updateModalSize() {
    const dialog = this.modal.querySelector('.gm-dialog');
    if (dialog) {
      dialog.style.width = `${this.modalSize.width}px`;
      dialog.style.height = `${this.modalSize.height}px`;
    }
  }

  centerModal() {
    const dialog = this.modal.querySelector('.gm-dialog');
    if (!dialog) return;

    // Reset position to center
    this.modalPosition = { x: 0, y: 0 };
    this.updateModalPosition();
    
    // Ensure modal is centered
    dialog.style.position = 'relative';
    dialog.style.margin = 'auto';
    dialog.style.left = 'auto';
    dialog.style.top = 'auto';
  }

  openModal() {
    if (this.modal) {
      this.modal.setAttribute('aria-hidden', 'false');
      this.modal.style.display = 'flex';
      this.modal.classList.add('show');
      
      // Center modal when opening
      setTimeout(() => this.centerModal(), 10);
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.setAttribute('aria-hidden', 'true');
      this.modal.style.display = 'none';
      this.modal.classList.remove('show');
      
      // Reset position for next open
      this.centerModal();
    }
  }

  isModalOpen() {
    return this.modal && this.modal.style.display === 'flex';
  }

  destroy() {
    // Remove event listeners
    const dialog = this.modal.querySelector('.gm-dialog');
    if (dialog) {
      dialog.removeEventListener('mousedown', this.handleMouseDown);
    }
    
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
