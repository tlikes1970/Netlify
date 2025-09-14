/**
 * Comprehensive Translation Fix
 * Finds ALL untranslated text and adds data-i18n attributes automatically
 */

console.log('🔧 Starting Comprehensive Translation Fix...');

// Translation mapping for common untranslated text
const translationMap = {
  // Home content sections
  'Personalized Recommendations': 'personalized_recommendations',
  'Based on your watching history and preferences': 'based_on_watching_history',
  'Your anime suggestions': 'your_anime_suggestions',
  'Your horror suggestions': 'your_horror_suggestions',
  'Trending': 'trending',
  'What everyone is watching': 'what_everyone_watching',
  'Staff Picks': 'staff_picks',
  'Curated by us': 'curated_by_us',
  'New This Week': 'new_this_week',
  'Fresh releases': 'fresh_releases',
  'In Theaters Near You': 'in_theaters_near_you',
  'Current theatrical releases': 'current_theatrical_releases',
  'Now Playing': 'now_playing',
  'Find Showtimes': 'find_showtimes',
  'Click "Find Showtimes" to see showtimes at theaters near you': 'click_find_showtimes',
  'Movies': 'movies_count',
  
  // Settings sections
  'Basic layout customization available to all users': 'basic_layout_customization',
  'Show more items per screen by reducing card spacing and padding': 'show_more_items_per_screen',
  'Display poster images for each show and movie in your lists': 'display_poster_images',
  'Switch to dark theme. When enabled, follows your system\'s dark/light mode preference': 'switch_to_dark_theme',
  'Number of curated recommendation sections to show on the home page': 'number_of_curated_sections',
  'Currently Watching Preview Limit': 'currently_watching_preview_limit',
  'Number of currently watching shows to display on the home page preview': 'number_of_currently_watching',
  'Enable Episode Tracking': 'enable_episode_tracking',
  'Allow tracking of individual episodes for TV series (opt-in per series)': 'allow_tracking_of_individual',
  'Advanced layout and theming features for Pro users': 'advanced_layout_and_theming',
  'Choose a visual theme for your Flicklet experience. Pro users get access to premium themes.': 'choose_a_visual_theme',
  'Theme:': 'theme',
  'Pro unlocks more themes': 'pro_unlocks_more_themes',
  'Basic data management features available to all users': 'basic_data_management',
  'Download a complete backup of your lists and settings as a JSON file': 'download_a_complete_backup',
  'Restore your data from a previously exported Flicklet backup file': 'restore_your_data',
  'Generate a shareable text list of your TV shows and movies to send to friends': 'generate_a_shareable_text',
  'Permanently delete all your lists, settings, and data. This cannot be undone.': 'permanently_delete_all',
  'Advanced data management features for Pro users': 'advanced_data_management',
  'Export your data in CSV format for use in spreadsheets (Pro feature)': 'export_your_data_csv',
  'Access additional trivia questions and behind-the-scenes content (Pro feature)': 'access_additional_trivia',
  'Advanced features and premium content available with Flicklet Pro subscription': 'advanced_features_premium',
  
  // About sections
  'About Unique4U': 'about_unique4u',
  'We\'re not here to reinvent the wheel — we\'re here to make the wheel less squeaky. At Unique4U, our rule is simple: keep it simple. The world already has enough apps that feel like a second job to use. We\'d rather give you tools that just… work.': 'were_not_here_to_reinvent',
  'Everything we build has its own personality, but they all live under one roof: a people-first, all-inclusive, slightly offbeat house we call Unique4U. If it\'s fun, useful, and a little different from the pack — it belongs here.': 'everything_we_build',
  'About the Creators': 'about_the_creators',
  'We\'re Pam and Travis. Think of us as casual builders with a shared allergy to overcomplication. We make things because we need them, and we figure you probably do too.': 'were_pam_and_travis',
  'Pam once trained dolphins (true story) and also happens to be really good with numbers. Travis studied English and Philosophy, which means he can overthink and explain it in writing, then somehow turn that into practical business know-how. Together, we\'re like a mash-up of "creative meets operations" — and that combo lets us build apps that are simple, useful, and not boring.': 'pam_once_trained_dolphins',
  'About the App': 'about_the_app',
  'Here\'s the deal: you want to remember what you\'re watching without needing a PhD in App Navigation. We built this because we got tired of two bad options — messy notes on our phones or bloated apps that make you log your "episode 7 mid-season thoughts." (Hard pass.)': 'heres_the_deal',
  'So we made this instead:': 'so_we_made_this_instead',
  'If you watch TV or movies and don\'t want to make it a hobby just to track them, this app\'s for you. Simple lists, zero drama.': 'if_you_watch_tv',
  'Your feedback helps us improve Flicklet. All messages are read and appreciated!': 'your_feedback_helps',
  
  // Common settings text
  'Core Features': 'core_features',
  'Pro Layout Features': 'pro_layout_features',
  'Pro Data Features': 'pro_data_features',
  'Theme Packs': 'theme_packs',
  'Pro Notifications': 'pro_notifications',
  'Advanced notification features for Pro users': 'advanced_notification_features',
  'Advanced Notifications (PRO)': 'advanced_notifications_pro',
  'Configure advanced notification settings with custom lead times and list monitoring': 'configure_advanced_notifications',
  'Enable advanced notifications': 'enable_advanced_notifications',
  'Lead time (hours):': 'lead_time_hours',
  'Monitor lists:': 'monitor_lists',
  'Pro feature - upgrade to unlock advanced notifications': 'pro_feature_upgrade',
  'Saved': 'saved',
  '(1-3)': 'range_1_3',
  '(5-20)': 'range_5_20',
  'Copy': 'copy',
  
  // Settings hints
  'Your name will appear in the header and personalize your experience': 'your_name_will_appear',
  'View your watching statistics and achievements': 'view_your_watching_stats',
  'View and remove items from your "Not Interested" list to see them in recommendations again': 'view_and_remove_items',
  'Get notified when new episodes of shows you\'re watching are about to air': 'get_notified_when_new',
  'Receive weekly recommendations for new shows and movies based on your preferences': 'receive_weekly_recommendations',
  'Get a monthly summary of your watching statistics and achievements': 'get_a_monthly_summary',
  'Loading stats...': 'loading_stats',
  'Currently Watching': 'currently_watching',
  'Want to Watch': 'want_to_watch',
  'Already Watched': 'already_watched',
  'Total Items': 'total_items',
  'TV Shows Breakdown': 'tv_shows_breakdown',
  'Movies Breakdown': 'movies_breakdown',
  'Not Interested Management': 'not_interested_management',
  'Manage shows and movies you\'ve marked as not interested': 'manage_not_interested_description',
  'Manage Not Interested List': 'manage_not_interested_list'
};

// Function to find and fix untranslated text
function fixUntranslatedText() {
  let fixed = 0;
  let found = 0;
  
  // Get all text elements that might need translation
  const selectors = [
    'h1, h2, h3, h4, h5, h6',
    'p, span, div, label, button',
    '.settings-description, .settings-hint, .settings-label, .settings-subtitle',
    '.preview-row-title, .section-subtitle',
    '.gc-title, .gc-tagline, .gc-stat-label'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      // Skip if already has data-i18n
      if (el.hasAttribute('data-i18n')) return;
      
      // Skip if no text or just whitespace
      const text = el.textContent?.trim();
      if (!text) return;
      
      // Skip if it's just numbers or symbols
      if (/^[\d\s\-\.]+$/.test(text)) return;
      if (text.length <= 2) return;
      
      // Skip if element has child elements (we want leaf text)
      if (el.children.length > 0) return;
      
      // Check if this text needs translation
      if (translationMap[text]) {
        el.setAttribute('data-i18n', translationMap[text]);
        console.log(`✅ Fixed: "${text}" → ${translationMap[text]}`);
        fixed++;
      } else {
        // Check for partial matches
        for (const [key, value] of Object.entries(translationMap)) {
          if (text.includes(key) && text.length < 100) { // Avoid very long text
            el.setAttribute('data-i18n', value);
            console.log(`✅ Fixed (partial): "${text}" → ${value}`);
            fixed++;
            break;
          }
        }
      }
      
      found++;
    });
  });
  
  console.log(`🎯 Found ${found} text elements, fixed ${fixed} translations`);
  return { found, fixed };
}

// Function to add missing translation keys to i18n.js
function addMissingKeys() {
  const missingKeys = [];
  
  // Check which keys are missing from the current i18n system
  Object.values(translationMap).forEach(key => {
    if (typeof window.t === 'function') {
      const translation = window.t(key);
      if (translation === key) { // If translation returns the key, it's missing
        missingKeys.push(key);
      }
    }
  });
  
  if (missingKeys.length > 0) {
    console.log(`⚠️ Missing translation keys: ${missingKeys.join(', ')}`);
    console.log('📝 Add these to i18n.js:');
    missingKeys.forEach(key => {
      const text = Object.keys(translationMap).find(k => translationMap[k] === key);
      console.log(`    ${key}: "${text}",`);
    });
  }
  
  return missingKeys;
}

// Function to trigger translation refresh
function refreshTranslations() {
  if (typeof window.applyTranslations === 'function') {
    console.log('🔄 Refreshing translations...');
    window.applyTranslations();
    
    // Also refresh dynamic content
    if (typeof window.renderCuratedHomepage === 'function') {
      window.renderCuratedHomepage();
    }
    
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('personalized:updated', { detail: { language: 'es' } }));
    }
  }
}

// Main execution
function runComprehensiveFix() {
  console.log('🚀 Running Comprehensive Translation Fix...');
  
  const results = fixUntranslatedText();
  const missingKeys = addMissingKeys();
  
  console.log(`\n📊 Results:`);
  console.log(`   Found: ${results.found} text elements`);
  console.log(`   Fixed: ${results.fixed} translations`);
  console.log(`   Missing keys: ${missingKeys.length}`);
  
  if (results.fixed > 0) {
    refreshTranslations();
    console.log('✅ Translation refresh triggered');
  }
  
  return results;
}

// Run the fix
const results = runComprehensiveFix();

// Expose for manual use
window.runComprehensiveFix = runComprehensiveFix;
window.fixUntranslatedText = fixUntranslatedText;

console.log('✅ Comprehensive Translation Fix complete!');
console.log('💡 Use window.runComprehensiveFix() to run again');
