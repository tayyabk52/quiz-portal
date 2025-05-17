/**
 * This utility provides security features for the quiz application
 * to prevent cheating or unauthorized actions during quiz sessions.
 */

class QuizSecurity {
  constructor() {
    this.warningShown = false;
    this.handler = null;
    this.callbackFn = null;
    this.fullscreenElement = null;
    this.fullscreenChangeHandler = null;
  }

  /**
   * Activates the security features to prevent leaving the quiz
   * @param {Function} onSecurityViolation - Callback function to execute when security is violated twice
   */
  activate(onSecurityViolation) {
    this.callbackFn = onSecurityViolation;
    
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
      
      // Special handling for Escape key to prevent exiting fullscreen
      if (e.key === "Escape" && this.isFullscreen()) {
        e.preventDefault();
        this.triggerWarning();
        return false;
      }
      
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
    
    // Setup fullscreen change monitoring
    this.fullscreenChangeHandler = this.handleFullscreenChange.bind(this);
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('mozfullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener('MSFullscreenChange', this.fullscreenChangeHandler);
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
      
      // If user exited fullscreen, try to re-enter
      if (!this.isFullscreen() && this.fullscreenElement) {
        this.requestFullscreen(this.fullscreenElement);
      }
    } else if (this.callbackFn) {
      this.callbackFn();
    }
  }

  /**
   * Handles fullscreen change events
   */
  handleFullscreenChange() {
    if (!this.isFullscreen() && this.fullscreenElement) {
      this.triggerWarning();
      
      // Try to re-enter fullscreen after a short delay to avoid browser limitations
      setTimeout(() => {
        if (!this.isFullscreen() && this.fullscreenElement) {
          this.requestFullscreen(this.fullscreenElement);
        }
      }, 500);
    }
  }

  /**
   * Requests fullscreen mode for the specified element
   * @param {HTMLElement} element - The element to make fullscreen
   * @returns {Promise} - Promise that resolves when fullscreen is activated
   */
  requestFullscreen(element) {
    this.fullscreenElement = element;
    
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      return element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      return element.msRequestFullscreen();
    }
    
    return Promise.reject('Fullscreen API not supported');
  }

  /**
   * Checks if the browser is currently in fullscreen mode
   * @returns {boolean} - Whether the browser is in fullscreen mode
   */
  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  /**
   * Exits fullscreen mode
   */
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
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
    
    if (this.fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenChangeHandler);
      this.fullscreenChangeHandler = null;
    }
    
    // Exit fullscreen mode if active
    if (this.isFullscreen()) {
      this.exitFullscreen();
    }
    
    document.removeEventListener("contextmenu", (e) => e.preventDefault());
    document.removeEventListener("keydown", (e) => e.preventDefault());
    window.removeEventListener("beforeunload", (e) => e.preventDefault());
    
    this.warningShown = false;
    this.callbackFn = null;
    this.fullscreenElement = null;
  }
}

const quizSecurity = new QuizSecurity();
export default quizSecurity;
