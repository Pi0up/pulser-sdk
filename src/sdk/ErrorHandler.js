/**
 * ErrorHandler - Gestion Fail-Safe des erreurs
 * Garantit que le SDK n'interfère jamais avec le site hôte
 */
class ErrorHandler {
  static debugMode = false;

  /**
   * Enveloppe une fonction pour capturer les erreurs
   * @param {Function} fn - Fonction à protéger
   * @param {string} context - Contexte pour le log
   * @returns {Function} - Fonction protégée
   */
  static wrap(fn, context = 'SDK') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        ErrorHandler.log(error, context);
        return null; // Échec silencieux
      }
    };
  }

  /**
   * Log une erreur (seulement en mode debug ou localhost)
   * @param {Error} error - Erreur à logger
   * @param {string} context - Contexte de l'erreur
   */
  static log(error, context) {
    const shouldLog = 
      ErrorHandler.debugMode || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (shouldLog) {
      console.warn(`[PulserSDK - ${context}]`, error);
    }
  }

  /**
   * Active le mode debug
   */
  static enableDebug() {
    ErrorHandler.debugMode = true;
    console.log('[PulserSDK] Debug mode enabled');
  }

  /**
   * Désactive le mode debug
   */
  static disableDebug() {
    ErrorHandler.debugMode = false;
  }
}

export default ErrorHandler;
