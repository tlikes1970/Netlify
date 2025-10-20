/* ========== feedback-layout-fix.js ==========
   Fixes the feedback section layout to be horizontal instead of vertical
*/

console.log('🔧 Feedback layout fix script loaded - VERSION 2');

function fixFeedbackLayout() {
  const feedbackSection = document.getElementById('feedbackSection');
  if (!feedbackSection) {
    console.log('🔧 Feedback section not found');
    return;
  }

  console.log('🔧 Found feedback section, applying fixes...');

  // Set feedback section to full width with more aggressive overrides
  feedbackSection.style.width = '100vw';
  feedbackSection.style.maxWidth = '100vw';
  feedbackSection.style.minWidth = '100vw';
  feedbackSection.style.marginLeft = '0';
  feedbackSection.style.marginRight = '0';
  feedbackSection.style.paddingLeft = '0';
  feedbackSection.style.paddingRight = '0';
  console.log('🔧 Set feedbackSection to full viewport width (100vw)');

  // Fix overflow issue and set preview container to full width
  const previewContainer = feedbackSection.querySelector('.preview-row-container');
  if (previewContainer) {
    previewContainer.style.overflow = 'visible';
    previewContainer.style.width = '100vw';
    previewContainer.style.maxWidth = '100vw';
    previewContainer.style.minWidth = '100vw';
    previewContainer.style.marginLeft = '0';
    previewContainer.style.marginRight = '0';
    previewContainer.style.paddingLeft = '0';
    previewContainer.style.paddingRight = '0';
    console.log('🔧 Set preview-row-container to full viewport width (100vw)');
  }

  // Fix the feedback actions container with more specific targeting
  const feedbackActions = feedbackSection.querySelector('.feedback-actions');
  if (feedbackActions) {
    // Force the layout without !important
    feedbackActions.style.display = 'flex';
    feedbackActions.style.flexDirection = 'row';
    feedbackActions.style.gap = '16px';
    feedbackActions.style.flexWrap = 'wrap';
    feedbackActions.style.justifyContent = 'flex-start';
    feedbackActions.style.width = '100%';
    feedbackActions.style.paddingLeft = '16px';
    feedbackActions.style.paddingRight = '16px';
    feedbackActions.style.boxSizing = 'border-box';
    console.log('🔧 Fixed feedback-actions layout');
  }

  // Fix the feedback content container to full width with aggressive overrides
  const feedbackContent = feedbackSection.querySelector('.feedback-content');
  if (feedbackContent) {
    feedbackContent.style.width = '100vw';
    feedbackContent.style.maxWidth = '100vw';
    feedbackContent.style.minWidth = '100vw';
    feedbackContent.style.marginLeft = '0';
    feedbackContent.style.marginRight = '0';
    feedbackContent.style.paddingLeft = '0';
    feedbackContent.style.paddingRight = '0';
    console.log('🔧 Set feedback-content to full viewport width (100vw)');
  }

  // Debug: Check widths of all parent containers
  const feedbackCard = feedbackSection.querySelector('.feedback-card');
  const feedbackSectionContent = feedbackSection.querySelector('.feedback-content');
  const previewContainerDebug = feedbackSection.querySelector('.preview-row-container');
  
  console.log('🔧 Container width measurements:');
  console.log('🔧 feedbackSection width:', feedbackSection.offsetWidth);
  console.log('🔧 preview-row-container width:', previewContainerDebug?.offsetWidth);
  console.log('🔧 feedback-content width:', feedbackSectionContent?.offsetWidth);
  console.log('🔧 feedback-card width (before):', feedbackCard?.offsetWidth);
  
  // Fix the feedback card container to full width with aggressive overrides
  if (feedbackCard) {
    feedbackCard.style.width = '100vw';
    feedbackCard.style.maxWidth = '100vw';
    feedbackCard.style.minWidth = '100vw';
    feedbackCard.style.height = '200px';
    feedbackCard.style.minHeight = '200px';
    feedbackCard.style.maxHeight = '200px';
    feedbackCard.style.display = 'block';
    feedbackCard.style.marginLeft = '0';
    feedbackCard.style.marginRight = '0';
    feedbackCard.style.paddingLeft = '0';
    feedbackCard.style.paddingRight = '0';
    console.log('🔧 feedback-card width (after):', feedbackCard.offsetWidth);
    console.log('🔧 Set feedback-card to full viewport width (100vw)');
  }

  // Style the buttons to be more compact
  const buttons = feedbackSection.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.style.minWidth = '180px';
    button.style.maxWidth = '200px';
    button.style.flexShrink = '0';
    button.style.padding = '12px 16px';
    button.style.fontSize = '14px';
    button.style.margin = '0';
  });
  console.log('🔧 Fixed feedback button styling');
}

// Try multiple times to ensure it runs after all content is loaded
function tryFixFeedbackLayout() {
  const feedbackSection = document.getElementById('feedbackSection');
  if (feedbackSection && feedbackSection.querySelector('.feedback-actions')) {
    fixFeedbackLayout();
    console.log('🔧 Feedback layout fix applied successfully');
  } else {
    console.log('🔧 Feedback section not ready, retrying...');
    setTimeout(tryFixFeedbackLayout, 100);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(tryFixFeedbackLayout, 500); // Wait a bit more
  });
} else {
  setTimeout(tryFixFeedbackLayout, 500); // Wait a bit more
}

console.log('🔧 Feedback layout fix initialized');
