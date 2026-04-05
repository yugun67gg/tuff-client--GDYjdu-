/**
 * OneBlock Menu Integration for TuffClient
 * Adds OneBlock option to single-player world creation menu
 */

(function() {
  'use strict';

  const logger = {
    info: (msg) => console.log('[OneBlockMenu] [INFO] ' + msg),
    warn: (msg) => console.warn('[OneBlockMenu] [WARN] ' + msg),
    error: (msg) => console.error('[OneBlockMenu] [ERROR] ' + msg)
  };

  // Menu state
  const state = {
    menuObserverActive: false,
    oneblockOptionAdded: false,
    worldTypeSelect: null,
    observers: []
  };

  /**
   * Wait for OneBlock loader to be ready
   */
  function waitForOneBlockLoader() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.OneBlockLoader && window.OneBlockLoader.isLoaded()) {
          clearInterval(checkInterval);
          logger.info('OneBlock Loader detected');
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        logger.warn('OneBlock Loader timeout, continuing anyway');
        resolve(false);
      }, 3000);
    });
  }

  /**
   * Find world type selector in the DOM
   */
  function findWorldTypeSelector() {
    // Try multiple selectors for different menu implementations
    const selectors = [
      'select[class*="world"], select[class*="type"]',
      'select[id*="world"], select[id*="type"]',
      'select[name*="world"], select[name*="type"]',
      'select'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.tagName === 'SELECT') {
        return element;
      }
    }
    return null;
  }

  /**
   * Add OneBlock option to world type select
   */
  function addOneBlockOption() {
    try {
      const select = findWorldTypeSelector();
      if (!select) {
        logger.warn('World type selector not found');
        return false;
      }

      // Check if OneBlock option already exists
      const existingOption = Array.from(select.options).find(
        opt => opt.value === 'oneblock' || opt.textContent.includes('OneBlock')
      );

      if (existingOption) {
        logger.info('OneBlock option already exists');
        return true;
      }

      // Create OneBlock option
      const option = document.createElement('option');
      option.value = 'oneblock';
      option.textContent = '📦 OneBlock';
      option.setAttribute('data-mod', 'oneblock');
      option.setAttribute('title', 'Survive on a single block with unlimited inventory');

      // Add to select
      select.appendChild(option);
      state.oneblockOptionAdded = true;
      state.worldTypeSelect = select;

      logger.info('OneBlock option added to menu');

      // Add change event handler
      select.addEventListener('change', handleWorldTypeChange);

      return true;
    } catch (error) {
      logger.error('Failed to add OneBlock option: ' + error.message);
      return false;
    }
  }

  /**
   * Handle world type selection change
   */
  function handleWorldTypeChange(event) {
    if (event.target.value === 'oneblock') {
      logger.info('OneBlock world type selected');
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('oneblockWorldTypeSelected', {
        detail: { selectedValue: 'oneblock' }
      }));
    }
  }

  /**
   * Watch for menu elements using MutationObserver
   */
  function observeMenu() {
    if (state.menuObserverActive) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      // Check if world type selector exists
      if (!state.oneblockOptionAdded) {
        const hasWorldTypeSelect = document.querySelector('select');
        if (hasWorldTypeSelect) {
          addOneBlockOption();
        }
      }
    });

    // Observe document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    state.menuObserverActive = true;
    state.observers.push(observer);
    logger.info('Menu observer started');
  }

  /**
   * Create a OneBlock world
   */
  window.OneBlockMenuIntegration = {
    createOneBlockWorld: function(name, gameMode, difficulty, seed) {
      logger.info('Creating OneBlock world: ' + name);
      
      const worldData = {
        name: name,
        type: 'oneblock',
        gameMode: gameMode || 0, // 0=Survival, 1=Creative
        difficulty: difficulty || 2,
        seed: seed || Math.floor(Math.random() * 0xFFFFFFFF),
        mod: 'oneblock-1.12.2-1.1.2.jar'
      };

      // Dispatch event for world creation
      document.dispatchEvent(new CustomEvent('oneblockCreateWorld', {
        detail: worldData
      }));

      return worldData;
    },

    addOption: addOneBlockOption,
    observeMenu: observeMenu,
    getState: () => ({ ...state }),
    logger: logger
  };

  /**
   * Initialize menu integration
   */
  async function initialize() {
    logger.info('OneBlock Menu Integration v1.0 initializing...');

    // Wait for OneBlock Loader
    await waitForOneBlockLoader();

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observeMenu();
        addOneBlockOption();
      });
    } else {
      setTimeout(() => {
        observeMenu();
        addOneBlockOption();
      }, 500);
    }

    // Listen for OneBlock loaded event
    document.addEventListener('oneblockLoaded', () => {
      logger.info('OneBlock Loader event detected');
      addOneBlockOption();
    });

    logger.info('OneBlock Menu Integration initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 100);
  }
})();