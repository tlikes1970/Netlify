/**
 * Feedback Banner Component
 * Displays a banner in the Feedback section that opens a modal
 */

(function() {
  'use strict';

  console.log('💬 Feedback Banner loaded');

  // Create feedback banner HTML
  function createFeedbackBanner() {
    return `
      <div class="feedback-banner">
        <div class="feedback-banner__content">
          <div class="feedback-banner__text">
            <h4 data-i18n="feedback.banner_title">Help us improve Flicklet</h4>
            <p data-i18n="feedback.banner_cta">Share your thoughts and suggestions</p>
          </div>
          <button class="btn btn-primary feedback-banner__btn" id="feedback-banner-btn">
            <span data-i18n="feedback.modal_title">Send Feedback</span>
          </button>
        </div>
      </div>
    `;
  }

  // Initialize feedback banner
  function initFeedbackBanner() {
    const feedbackSection = document.getElementById('section-feedback-body');
    if (!feedbackSection) {
      console.warn('💬 Feedback section not found');
      return;
    }

    // Add banner HTML
    feedbackSection.innerHTML = createFeedbackBanner();

    // Set up click handler
    const bannerBtn = document.getElementById('feedback-banner-btn');
    if (bannerBtn) {
      bannerBtn.addEventListener('click', () => {
        console.log('💬 Opening feedback modal');
        openFeedbackModal();
      });
    }
  }

  // Open feedback modal
  function openFeedbackModal() {
    // Check if modal already exists
    let modal = document.getElementById('feedback-modal');
    if (!modal) {
      modal = createFeedbackModal();
      document.body.appendChild(modal);
    }

    // Show modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus first input
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) {
      firstInput.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  // Create feedback modal
  function createFeedbackModal() {
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'feedback-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';

    modal.innerHTML = `
      <div class="feedback-modal__backdrop"></div>
      <div class="feedback-modal__content">
        <div class="feedback-modal__header">
          <h3 data-i18n="feedback.modal_title">Send Feedback</h3>
          <button class="feedback-modal__close" id="feedback-modal-close" aria-label="Close">
            <span>×</span>
          </button>
        </div>
        <div class="feedback-modal__body">
          <form id="feedback-form">
            <div class="form-group">
              <label for="feedback-type" data-i18n="feedback.type_label">Type of feedback</label>
              <select id="feedback-type" name="type" required>
                <option value="" data-i18n="feedback.type_select">Select a type</option>
                <option value="bug" data-i18n="feedback.type_bug">Bug Report</option>
                <option value="feature" data-i18n="feedback.type_feature">Feature Request</option>
                <option value="improvement" data-i18n="feedback.type_improvement">Improvement</option>
                <option value="other" data-i18n="feedback.type_other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="feedback-message" data-i18n="feedback.message_label">Your message</label>
              <textarea 
                id="feedback-message" 
                name="message" 
                rows="5" 
                placeholder="Tell us what you think..."
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label for="feedback-email" data-i18n="feedback.email_label">Email (optional)</label>
              <input 
                type="email" 
                id="feedback-email" 
                name="email" 
                placeholder="your@email.com"
              />
            </div>
            <div class="feedback-modal__actions">
              <button type="button" class="btn btn-secondary" id="feedback-cancel">
                <span data-i18n="common.cancel">Cancel</span>
              </button>
              <button type="submit" class="btn btn-primary">
                <span data-i18n="feedback.send">Send Feedback</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Set up event handlers
    setupModalHandlers(modal);

    return modal;
  }

  // Set up modal event handlers
  function setupModalHandlers(modal) {
    // Close button
    const closeBtn = modal.querySelector('#feedback-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeFeedbackModal);
    }

    // Cancel button
    const cancelBtn = modal.querySelector('#feedback-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeFeedbackModal);
    }

    // Backdrop click
    const backdrop = modal.querySelector('.feedback-modal__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeFeedbackModal);
    }

    // Form submission
    const form = modal.querySelector('#feedback-form');
    if (form) {
      form.addEventListener('submit', handleFeedbackSubmit);
    }

    // Escape key
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeFeedbackModal();
      }
    });
  }

  // Close feedback modal
  function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  // Handle feedback form submission
  function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const feedback = {
      type: formData.get('type'),
      message: formData.get('message'),
      email: formData.get('email'),
      timestamp: new Date().toISOString()
    };

    console.log('💬 Feedback submitted:', feedback);

    // Show success message
    showFeedbackSuccess();

    // Close modal
    closeFeedbackModal();

    // Reset form
    e.target.reset();
  }

  // Show feedback success message
  function showFeedbackSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'feedback-success';
    notification.innerHTML = `
      <div class="feedback-success__content">
        <span class="feedback-success__icon">✓</span>
        <span data-i18n="feedback.success_message">Thank you for your feedback!</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedbackBanner);
  } else {
    initFeedbackBanner();
  }

  // Expose globally
  window.feedbackBanner = {
    init: initFeedbackBanner,
    openModal: openFeedbackModal,
    closeModal: closeFeedbackModal
  };

})();
