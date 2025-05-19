/**
 * This utility provides security features for the quiz application
 * to prevent cheating or unauthorized actions during quiz sessions.
 */

class QuizSecurity {  constructor() {
    this.warningShown = false;
    this.handler = null;
    this.callbackFn = null;
    this.fullscreenExitHandler = null;
    this.isFullscreen = false;
    this.exitFullscreenTime = null;
    this.fullscreenExitWarningTimer = null;
    this.onFullscreenExit = null;
    this.onFullscreenReturn = null;
    this.timerElement = null;
    this.pauseTimerCallback = null;
    this.resumeTimerCallback = null;
    this.exitTimerElement = null;
    this.countdownInterval = null;
    this.countdownValue = 10; // Default countdown time in seconds
    this.fullscreenRequired = true; // Fullscreen is always required - no option to bypass
  }/**
   * Activates the security features to prevent leaving the quiz
   * @param {Function} onSecurityViolation - Callback function to execute when security is violated twice
   * @param {boolean} fullscreenRequired - Whether fullscreen is required or optional (always true now)
   */
  activate(onSecurityViolation, fullscreenRequired = true) {
    this.callbackFn = onSecurityViolation;
    this.fullscreenRequired = true; // Always enforced
    
    // Handle tab/window visibility changes
    this.handler = this.handleVisibilityChange.bind(this);
    document.addEventListener("visibilitychange", this.handler);
    
    // Block right-click context menu
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      return false;
    });
    
    // Block keyboard shortcuts that could navigate away or open dev tools
    document.addEventListener("keydown", (e) => {
      // Block Alt+Tab, Alt+F4, Ctrl+Tab, F12, Ctrl+Shift+I
      const blockedKeys = [
        e.altKey && e.key === "Tab",
        e.altKey && e.key === "F4",
        e.ctrlKey && e.key === "Tab",
        e.key === "F12",
        e.ctrlKey && e.shiftKey && e.key === "I"
      ];
      
      if (blockedKeys.some(condition => condition)) {
        e.preventDefault();
        this.triggerWarning();
        return false;
      }
    });
    
    // Alert when the user is trying to leave the page
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave the quiz? Your progress will be lost.";
      return e.returnValue;
    });

    // Add fullscreen change detection only if fullscreen is required
    if (fullscreenRequired) {
      this.fullscreenExitHandler = this.handleFullscreenChange.bind(this);
      document.addEventListener("fullscreenchange", this.fullscreenExitHandler);
      document.addEventListener("webkitfullscreenchange", this.fullscreenExitHandler);
      document.addEventListener("mozfullscreenchange", this.fullscreenExitHandler);
      document.addEventListener("MSFullscreenChange", this.fullscreenExitHandler);
    }
  }

  /**
   * Handles visibility change events (tab switching or minimizing)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.triggerWarning();
    }
  }

  /**
   * Triggers a warning or executes the security violation callback
   */
  triggerWarning() {
    if (!this.warningShown) {
      alert("Warning: Navigating away from the quiz is not allowed. Your next attempt will result in automatic submission.");
      this.warningShown = true;
    } else if (this.callbackFn) {
      this.callbackFn();
    }
  }

  /**
   * Deactivates all security features
   */
  deactivate() {
    if (this.handler) {
      document.removeEventListener("visibilitychange", this.handler);
      this.handler = null;
    }
    
    document.removeEventListener("contextmenu", (e) => e.preventDefault());
    document.removeEventListener("keydown", (e) => e.preventDefault());
    window.removeEventListener("beforeunload", (e) => e.preventDefault());
    
    // Remove fullscreen event listeners
    if (this.fullscreenExitHandler) {
      document.removeEventListener("fullscreenchange", this.fullscreenExitHandler);
      document.removeEventListener("webkitfullscreenchange", this.fullscreenExitHandler);
      document.removeEventListener("mozfullscreenchange", this.fullscreenExitHandler);
      document.removeEventListener("MSFullscreenChange", this.fullscreenExitHandler);
      this.fullscreenExitHandler = null;
    }

    // Clear any active countdown timers
    this.clearFullscreenExitTimer();
    
    this.warningShown = false;
    this.callbackFn = null;
    this.isFullscreen = false;
    this.onFullscreenExit = null;
    this.onFullscreenReturn = null;
    this.pauseTimerCallback = null;
    this.resumeTimerCallback = null;
  }

  /**
   * Enters full screen mode
   * @param {HTMLElement} element - The element to make fullscreen (default: document.documentElement)
   * @returns {Promise<void>} - A promise that resolves when fullscreen is entered
   */
  enterFullscreen(element = document.documentElement) {
    this.isFullscreen = true;
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { 
      return element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) { 
      return element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      return element.msRequestFullscreen();
    }
    return Promise.reject("Fullscreen API not supported");
  }

  /**
   * Exits full screen mode
   * @returns {Promise<void>} - A promise that resolves when fullscreen is exited
   */
  exitFullscreen() {
    this.isFullscreen = false;
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      return document.msExitFullscreen();
    }
    return Promise.reject("Fullscreen API not supported");
  }

  /**
   * Checks if the browser is in fullscreen mode
   * @returns {boolean} - Whether the browser is in fullscreen mode
   */
  checkFullscreen() {
    return !!document.fullscreenElement || 
           !!document.webkitFullscreenElement || 
           !!document.mozFullScreenElement || 
           !!document.msFullscreenElement;
  }  /**
   * Handles fullscreen change events
   */  handleFullscreenChange() {
    // Fullscreen is always required
    this.fullscreenRequired = true;
    
    const isFullscreenNow = this.checkFullscreen();
    
    if (isFullscreenNow) {
      // User returned to fullscreen
      this.isFullscreen = true;
      
      // Clear any existing timers immediately
      this.clearFullscreenExitTimer();
      
      // Call the fullscreen return callback if provided
      if (this.onFullscreenReturn) {
        this.onFullscreenReturn();
      }
      
      // Resume the timer if callback is provided
      if (this.resumeTimerCallback) {
        this.resumeTimerCallback();
      }

      // Hide the exit warning if it was displayed
      if (this.exitTimerElement) {
        this.exitTimerElement.style.display = 'none';
      }
    } else {
      // User exited fullscreen (or was never in fullscreen)
      // This handles ESC key and all other methods of exiting fullscreen
      if (this.isFullscreen) { // Only trigger if we were previously in fullscreen
        this.isFullscreen = false;
        this.exitFullscreenTime = new Date();
        
        // Call the fullscreen exit callback if provided
        if (this.onFullscreenExit) {
          this.onFullscreenExit();
        }
        
        // Pause the timer if callback is provided
        if (this.pauseTimerCallback) {
          this.pauseTimerCallback();
        }
        
        // Clear any existing timers before starting a new one (in case there was a leftover timer)
        this.clearFullscreenExitTimer();
        
        // Start the countdown for auto-submit
        this.startFullscreenExitTimer();
        console.log('Started fullscreen exit timer');
      }
    }
  }

  /**
   * Sets up fullscreen security with callbacks
   * @param {Function} onExit - Callback when fullscreen is exited
   * @param {Function} onReturn - Callback when fullscreen is reentered
   * @param {Function} onTimeout - Callback when the return timer expires
   * @param {HTMLElement} timerEl - Element to display the countdown timer
   * @param {Function} pauseTimer - Callback to pause the quiz timer
   * @param {Function} resumeTimer - Callback to resume the quiz timer
   * @param {number} countdownTime - Time in seconds to allow returning to fullscreen
   */  setupFullscreenSecurity({
    onExit,
    onReturn,
    onTimeout,
    timerElement,
    pauseTimer,
    resumeTimer,
    countdownTime = 8 // Reduced countdown time to be more strict
  }) {
    this.onFullscreenExit = onExit;
    this.onFullscreenReturn = onReturn;
    this.callbackFn = onTimeout;
    this.exitTimerElement = timerElement;
    this.pauseTimerCallback = pauseTimer;
    this.resumeTimerCallback = resumeTimer;
    this.countdownValue = countdownTime;
  }

  /**
   * Starts the timer for returning to fullscreen
   */  startFullscreenExitTimer() {
    // Clear any existing timer to prevent duplicates
    this.clearFullscreenExitTimer();
    
    // Create a new countdown starting from the full value
    let countdown = this.countdownValue;
    
    // Force update the timer element immediately
    if (this.exitTimerElement) {
      this.exitTimerElement.textContent = countdown.toString();
      console.log(`Timer display initialized: ${countdown}`);
    }
    
    // Start the interval timer for countdown
    this.countdownInterval = setInterval(() => {
      countdown--;
      
      // Update timer display
      if (this.exitTimerElement) {
        this.exitTimerElement.textContent = countdown.toString();
        console.log(`Timer counting down: ${countdown}`);
      }
      
      // Check if countdown has expired
      if (countdown <= 0) {
        this.clearFullscreenExitTimer();
        
        // If time is up and still not in fullscreen, trigger the callback
        if (!this.checkFullscreen() && this.callbackFn) {
          console.log("Auto-submitting due to fullscreen exit timeout");
          this.callbackFn();
          return; // Exit early to prevent any race conditions
        }
      }
    }, 1000);
      // Set a timeout to auto-submit if not returned to fullscreen
    // This serves as a backup in case the interval fails or is cleared
    this.fullscreenExitWarningTimer = setTimeout(() => {
      this.clearFullscreenExitTimer();
      
      if (!this.checkFullscreen() && this.callbackFn) {
        console.log("Auto-submitting from timeout fallback");
        // Store a flag to mark that auto-submit was triggered
        this.autoSubmitTriggered = true;
        // Call the callback function to submit the quiz
        this.callbackFn();
      }
    }, this.countdownValue * 1000);
  }

  /**
   * Clears the fullscreen exit timer
   */
  clearFullscreenExitTimer() {
    if (this.fullscreenExitWarningTimer) {
      clearTimeout(this.fullscreenExitWarningTimer);
      this.fullscreenExitWarningTimer = null;
    }
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}

const quizSecurity = new QuizSecurity();
export default quizSecurity;
