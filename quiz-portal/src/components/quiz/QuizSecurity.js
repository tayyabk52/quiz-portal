/**
 * This utility provides security features for the quiz application
 * to prevent cheating or unauthorized actions during quiz sessions.
 */

class QuizSecurity {
  constructor() {
    this.warningShown = false;
    this.handler = null;
    this.callbackFn = null;
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
    
    this.warningShown = false;
    this.callbackFn = null;
  }
}

const quizSecurity = new QuizSecurity();
export default quizSecurity;
