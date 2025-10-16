/**
 * Process: FlickWord Modal Module
 * Purpose: FlickWord modal functionality
 * Data Source: DOM elements
 * Update Path: Update modal selectors if needed
 * Dependencies: DOM API
 */

export function initializeFlickWordModal() {
  // FlickWord Modal Functions
  function openFlickWordModal() {
    console.log('🎯 Opening FlickWord modal');
    const modal = document.getElementById('modal-flickword');
    const frame = document.getElementById('flickword-game-frame');

    if (modal && frame) {
      // Set iframe source
      frame.src = '/features/flickword-v2.html';

      // Show modal
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
      modal.classList.add('show');

      // Debug: Check close button
      const closeBtn = modal.querySelector('.gm-close');
      console.log('🎯 Close button found:', closeBtn);
      console.log(
        '🎯 Close button styles:',
        closeBtn ? window.getComputedStyle(closeBtn) : 'Not found',
      );

      // Focus management
      const firstFocusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    } else {
      console.error('❌ FlickWord modal elements not found');
    }
  }

  function closeFlickWordModal() {
    console.log('🎯 Closing FlickWord modal');
    const modal = document.getElementById('modal-flickword');
    const frame = document.getElementById('flickword-game-frame');

    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      modal.classList.remove('show');

      // Clear iframe source to stop any running processes
      if (frame) {
        frame.src = 'about:blank';
      }

      // Update stats display after modal closes and FlickWord tab becomes visible
      setTimeout(() => {
        updateStatsDisplay();
      }, 100);
    }
  }

  // Add retry counter to prevent infinite loops
  let statsUpdateRetryCount = 0;
  const MAX_STATS_UPDATE_RETRIES = 3;

  function updateStatsDisplay() {
    console.log(
      '🎯 Updating stats display after modal close... (attempt',
      statsUpdateRetryCount + 1,
      ')',
    );

    if (!window.lastFlickWordStats) {
      console.log('🎯 No stats to update');
      return;
    }

    const stats = window.lastFlickWordStats;

    // Debug: Check what elements are available
    console.log('🎯 Available elements:');
    console.log(
      '🎯 All elements with data-testid:',
      document.querySelectorAll('[data-testid]').length,
    );
    console.log('🎯 All .stats-card elements:', document.querySelectorAll('.stats-card').length);
    console.log(
      '🎯 All elements with "stats" in class:',
      document.querySelectorAll('[class*="stats"]').length,
    );
    console.log(
      '🎯 All elements with "flickword" in class:',
      document.querySelectorAll('[class*="flickword"]').length,
    );

    // Log the actual elements with "stats" in class
    const statsElements = document.querySelectorAll('[class*="stats"]');
    console.log(
      '🎯 Stats elements found:',
      Array.from(statsElements).map((el) => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.substring(0, 50),
        innerHTML: el.innerHTML?.substring(0, 100),
      })),
    );

    // Also check for any elements that might contain numbers
    const allElements = document.querySelectorAll('*');
    const numberElements = Array.from(allElements).filter((el) => {
      const text = el.textContent?.trim();
      return text && /^\d+$/.test(text) && el.children.length === 0;
    });
    console.log(
      '🎯 Elements with just numbers:',
      numberElements.map((el) => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent,
        parent: el.parentElement?.tagName + '.' + el.parentElement?.className,
        parentText: el.parentElement?.textContent?.substring(0, 50),
        grandparent:
          el.parentElement?.parentElement?.tagName +
          '.' +
          el.parentElement?.parentElement?.className,
      })),
    );

    // Look for any elements that might contain "streak", "best", "win", etc.
    const allTextElements = document.querySelectorAll('*');
    const textElements = Array.from(allTextElements).filter((el) => {
      const text = el.textContent?.toLowerCase();
      return (
        text &&
        (text.includes('streak') ||
          text.includes('best') ||
          text.includes('win') ||
          text.includes('games'))
      );
    });
    console.log(
      '🎯 Elements with stats-related text:',
      textElements.map((el) => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.substring(0, 100),
        parent: el.parentElement?.tagName + '.' + el.parentElement?.className,
        id: el.id,
        dataTestId: el.getAttribute('data-testid'),
      })),
    );

    // Look specifically for elements that might be displaying the stats numbers
    const potentialStatsElements = textElements.filter((el) => {
      const text = el.textContent?.toLowerCase();
      return (
        text &&
        (text.includes('streak') ||
          text.includes('best') ||
          text.includes('win') ||
          text.includes('games')) &&
        (el.children.length === 0 || el.textContent?.match(/^\d+$/))
      );
    });
    console.log(
      '🎯 Potential stats display elements:',
      potentialStatsElements.map((el) => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent,
        parent: el.parentElement?.tagName + '.' + el.parentElement?.className,
        id: el.id,
        dataTestId: el.getAttribute('data-testid'),
        innerHTML: el.innerHTML?.substring(0, 100),
      })),
    );

    // Try to update these potential stats elements directly
    console.log('🎯 Attempting to update potential stats elements...');
    potentialStatsElements.forEach((el, index) => {
      console.log(`🎯 Element ${index + 1}:`, {
        textContent: el.textContent,
        className: el.className,
        id: el.id,
        parent: el.parentElement?.tagName + '.' + el.parentElement?.className,
      });

      // Try to update if it looks like a number
      if (el.textContent && /^\d+$/.test(el.textContent.trim())) {
        console.log(`🎯 Found number element: "${el.textContent}" - attempting to update...`);
        // This is where we'll update the stats
      }
    });

    // Look for stat-label elements specifically in the FlickWord card
    const flickwordCard = document.getElementById('flickwordTile');
    const statLabels = flickwordCard ? flickwordCard.querySelectorAll('.stat-label') : [];
    console.log('🎯 Found FlickWord stat-label elements:', statLabels.length);

    statLabels.forEach((label, index) => {
      console.log(`🎯 Stat label ${index + 1}:`, {
        text: label.textContent,
        parent: label.parentElement?.tagName + '.' + label.parentElement?.className,
        nextSibling: label.nextElementSibling?.tagName + '.' + label.nextElementSibling?.className,
        nextSiblingText: label.nextElementSibling?.textContent,
      });

      // Look for the value element (usually next sibling or child)
      const valueElement =
        label.nextElementSibling ||
        label.parentElement?.querySelector(
          '.stat-value, .stat-number, [class*="value"], [class*="number"]',
        );
      if (valueElement) {
        console.log(`🎯 Found value element for "${label.textContent}":`, {
          text: valueElement.textContent,
          className: valueElement.className,
          tagName: valueElement.tagName,
        });

        // Update based on label text
        if (label.textContent.includes('Streak') && !label.textContent.includes('Best')) {
          valueElement.textContent = stats.streak;
          console.log(`🎯 Updated streak to: ${stats.streak}`);
        } else if (label.textContent.includes('Best')) {
          valueElement.textContent = stats.maxStreak; // Use max streak as best
          console.log(`🎯 Updated best to: ${stats.maxStreak}`);
        } else if (label.textContent.includes('Win')) {
          valueElement.textContent = stats.winRate + '%';
          console.log(`🎯 Updated win rate to: ${stats.winRate}%`);
        } else if (label.textContent.includes('Games') || label.textContent.includes('Total')) {
          valueElement.textContent = stats.totalGames;
          console.log(`🎯 Updated total games to: ${stats.totalGames}`);
        } else if (label.textContent.includes('Won')) {
          valueElement.textContent = stats.wins;
          console.log(`🎯 Updated wins to: ${stats.wins}`);
        } else if (label.textContent.includes('Lost')) {
          valueElement.textContent = stats.losses;
          console.log(`🎯 Updated losses to: ${stats.losses}`);
        }
      }
    });

    // Also check for any elements that might be in the FlickWord tab specifically
    const flickwordTab =
      document.querySelector('[data-tab="flickword"]') ||
      document.querySelector('.flickword-tab') ||
      document.querySelector('[class*="flickword"]');
    console.log('🎯 FlickWord tab found:', !!flickwordTab);
    if (flickwordTab) {
      console.log('🎯 FlickWord tab content:', flickwordTab.innerHTML.substring(0, 200));
      const flickwordNumbers = flickwordTab.querySelectorAll('*');
      const flickwordNumberElements = Array.from(flickwordNumbers).filter((el) => {
        const text = el.textContent?.trim();
        return text && /^\d+$/.test(text) && el.children.length === 0;
      });
      console.log(
        '🎯 Numbers in FlickWord tab:',
        flickwordNumberElements.map((el) => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent,
          parent: el.parentElement?.tagName + '.' + el.parentElement?.className,
        })),
      );
    }

    // Try multiple selectors for stats elements
    const streakElement =
      document.querySelector('[data-testid="stats-streak"]') ||
      document.querySelector('.stats-card__stat-value[data-testid="stats-streak"]') ||
      document.querySelector('.flickword-tab [data-testid="stats-streak"]');

    const bestElement =
      document.querySelector('[data-testid="stats-best"]') ||
      document.querySelector('.stats-card__stat-value[data-testid="stats-best"]') ||
      document.querySelector('.flickword-tab [data-testid="stats-best"]');

    const winElement =
      document.querySelector('[data-testid="stats-win-rate"]') ||
      document.querySelector('.stats-card__stat-value[data-testid="stats-win-rate"]') ||
      document.querySelector('.flickword-tab [data-testid="stats-win-rate"]');

    const totalGamesElement =
      document.querySelector('[data-testid="stats-total-games"]') ||
      document.querySelector('.stats-card__stat-value[data-testid="stats-total-games"]') ||
      document.querySelector('.flickword-tab [data-testid="stats-total-games"]');

    console.log('🎯 Found stats elements after modal close:', {
      streak: !!streakElement,
      best: !!bestElement,
      win: !!winElement,
      totalGames: !!totalGamesElement,
    });

    if (streakElement) {
      streakElement.textContent = stats.streak;
      console.log('🎯 Updated streak to:', stats.streak);
    }

    if (bestElement) {
      bestElement.textContent = stats.streak; // Use current streak as best for now
      console.log('🎯 Updated best to:', stats.streak);
    }

    if (winElement) {
      winElement.textContent = stats.winRate + '%';
      console.log('🎯 Updated win rate to:', stats.winRate + '%');
    }

    if (totalGamesElement) {
      totalGamesElement.textContent = stats.totalGames;
      console.log('🎯 Updated total games to:', stats.totalGames);
    }

    // Try multiple selectors for stats card
    const statsCard =
      document.querySelector('.stats-card') ||
      document.querySelector('.flickword-tab .stats-card') ||
      document.querySelector('[class*="stats-card"]');

    console.log('🎯 Stats card found:', !!statsCard);

    // Also try to update using the StatsCard component
    if (window.updateStatsCard && statsCard) {
      console.log('🎯 Calling updateStatsCard after modal close...');
      window.updateStatsCard(statsCard, stats);
      console.log('🎯 updateStatsCard called successfully after modal close');
    } else {
      console.warn('🎯 No stats card found after modal close or updateStatsCard not available');
    }

    // If we still can't find the elements, try again after a longer delay (with retry limit)
    if (
      !streakElement &&
      !bestElement &&
      !winElement &&
      !totalGamesElement &&
      statsUpdateRetryCount < MAX_STATS_UPDATE_RETRIES
    ) {
      statsUpdateRetryCount++;
      console.log(
        '🎯 No stats elements found, trying again in 500ms... (retry',
        statsUpdateRetryCount,
        'of',
        MAX_STATS_UPDATE_RETRIES,
        ')',
      );
      setTimeout(() => {
        updateStatsDisplay();
      }, 500);
    } else if (statsUpdateRetryCount >= MAX_STATS_UPDATE_RETRIES) {
      console.warn('🎯 Max retries reached, giving up on stats update');
      statsUpdateRetryCount = 0; // Reset for next time
    } else {
      statsUpdateRetryCount = 0; // Reset for next time
    }

    console.log('🎯 Stats display update complete after modal close');
  }

  // Handle game result and update stats
  function handleGameResult(result) {
    console.log('🎯 Processing game result:', result);

    try {
      // Load current stats
      const rawStats = JSON.parse(
        localStorage.getItem('flickword:stats') ||
          localStorage.getItem('flickword-stats') ||
          localStorage.getItem('flicklet-data') ||
          '{}',
      );

      // Create a deep copy to avoid circular references
      const stats = JSON.parse(JSON.stringify(rawStats));

      // Extract FlickWord stats from the data and create a new object
      const originalFlickwordStats = stats.flickword || stats || {};

      // Create a completely new flickwordStats object to avoid circular references
      const flickwordStats = {
        games: originalFlickwordStats.games || 0,
        wins: originalFlickwordStats.wins || 0,
        losses: originalFlickwordStats.losses || 0,
        streak: originalFlickwordStats.streak || 0,
        maxStreak: originalFlickwordStats.maxStreak || 0,
      };

      // Update stats based on game result
      flickwordStats.games += 1;

      if (result.won) {
        flickwordStats.wins += 1;
        flickwordStats.streak += 1;
        // Update best streak if current streak is higher
        if (flickwordStats.streak > flickwordStats.maxStreak) {
          flickwordStats.maxStreak = flickwordStats.streak;
        }
      } else {
        // Don't reset streak to 0, just don't increment it
        // Streak stays at current value until you win again
        // flickwordStats.streak remains unchanged
      }

      // Calculate losses
      flickwordStats.losses = flickwordStats.games - flickwordStats.wins;

      // Calculate win percentage
      const winPercentage = Math.round((flickwordStats.wins / flickwordStats.games) * 100);

      // Create a completely new stats object to save
      const newStats = {
        tv: stats.tv || {},
        movies: stats.movies || {},
        settings: stats.settings || {},
        flickword: flickwordStats,
      };

      // Save updated stats back to localStorage
      localStorage.setItem('flickword:stats', JSON.stringify(newStats));
      localStorage.setItem('flicklet-data', JSON.stringify(newStats));

      console.log('🎯 Updated FlickWord stats:', flickwordStats);

      // Update the display immediately by directly updating the DOM elements
      console.log('🎯 Updating stats display directly...');

      // Find the stats elements in the FlickWord tab
      const streakElement = document.querySelector('[data-testid="stats-streak"]');
      const bestElement = document.querySelector('[data-testid="stats-best"]');
      const winElement = document.querySelector('[data-testid="stats-win-rate"]');

      console.log('🎯 Found stats elements:', {
        streak: !!streakElement,
        best: !!bestElement,
        win: !!winElement,
      });

      if (streakElement) {
        streakElement.textContent = flickwordStats.streak;
        console.log('🎯 Updated streak to:', flickwordStats.streak);
      }

      if (bestElement) {
        bestElement.textContent = flickwordStats.maxStreak;
        console.log('🎯 Updated best to:', flickwordStats.maxStreak);
      }

      if (winElement) {
        winElement.textContent = winPercentage + '%';
        console.log('🎯 Updated win rate to:', winPercentage + '%');
      }

      // Also try to update any other stats elements that might exist
      const allStatsElements = document.querySelectorAll('[data-testid*="stats-"]');
      console.log('🎯 Found all stats elements:', allStatsElements.length);

      console.log('🎯 Stats display update complete');
    } catch (error) {
      console.error('🎯 Error updating FlickWord stats:', error);
    }
  }

  // Expose globally
  window.openFlickWordModal = openFlickWordModal;
  window.closeFlickWordModal = closeFlickWordModal;

  // Initialize event listeners immediately (not waiting for DOMContentLoaded)
  function initializeEventListeners() {
    console.log('🎯 Initializing FlickWord modal event listeners...');

    const openBtn = document.querySelector('[data-action="open-flickword"]');
    const closeBtn = document.querySelector('.gm-close');
    const overlay = document.querySelector('.gm-overlay');

    console.log('🎯 Found elements:', { openBtn, closeBtn, overlay });

    if (openBtn) {
      console.log('🎯 Adding click listener to open button');
      openBtn.addEventListener('click', openFlickWordModal);
    }

    if (closeBtn) {
      console.log('🎯 Adding click listener to close button');
      closeBtn.addEventListener('click', (e) => {
        console.log('🎯 Close button clicked!');
        closeFlickWordModal();
      });
    }

    if (overlay) {
      console.log('🎯 Adding click listener to overlay');
      overlay.addEventListener('click', (e) => {
        console.log('🎯 Overlay clicked!');
        closeFlickWordModal();
      });
    }

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modal-flickword');
        if (modal && modal.getAttribute('aria-hidden') === 'false') {
          closeFlickWordModal();
        }
      }
    });

    // Handle messages from iframe
    window.addEventListener('message', (e) => {
      console.log('🎯 Received message:', e.data);
      if (e.data && e.data.type === 'flickword:close') {
        console.log('🎯 Received close message from iframe');
        closeFlickWordModal();
      } else if (e.data && e.data.type === 'flickword:result') {
        console.log('🎯 Received game result from iframe:', e.data);
        handleGameResult(e.data);
      }
    });
  }

  // Initialize immediately if DOM is ready, otherwise wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
  } else {
    initializeEventListeners();
  }
}
