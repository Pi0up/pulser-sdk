/**
 * DataSubmitter - Envoi des données vers l'API
 * Gère les réponses et les impressions
 */
import ErrorHandler from './ErrorHandler.js';

class DataSubmitter {
  constructor(domain, userIdentity = null) {
    this.domain = domain;
    this.apiBaseUrl = `https://api.${domain}/feedback`;
    this.userIdentity = this._normalizeIdentity(userIdentity);
  }

  setUserIdentity(identity) {
    this.userIdentity = this._normalizeIdentity(identity);
  }

  clearUserIdentity() {
    this.userIdentity = null;
  }

  _normalizeIdentity(identity) {
    if (identity === null || identity === undefined) {
      return null;
    }

    const normalized = (typeof identity === 'string' ? identity : String(identity)).trim();
    return normalized.length ? normalized : null;
  }

  _buildHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.userIdentity) {
      headers['X-User-Id'] = this.userIdentity;
    }

    return headers;
  }

  /**
   * Nettoie un objet pour éviter les références circulaires
   * @param {any} obj - Objet à nettoyer
   * @param {WeakSet} seen - Set pour tracker les objets déjà vus
   * @returns {any} Objet nettoyé
   */
  _sanitizeData(obj, seen = null) {
    // Initialiser le WeakSet au premier appel
    if (!seen) {
      seen = new WeakSet();
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    // Si c'est un type primitif, on le retourne tel quel
    if (typeof obj !== 'object') {
      return obj;
    }

    // Si c'est un élément DOM, on le convertit en string
    if (obj instanceof Element || obj instanceof Node) {
      return `[DOM Element: ${obj.nodeName}]`;
    }

    // Si c'est window ou document
    if (obj === window || obj === document) {
      return '[Window/Document]';
    }

    // Vérifier si l'objet a déjà été vu (référence circulaire)
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }

    // Marquer l'objet comme vu
    seen.add(obj);

    // Si c'est un tableau
    if (Array.isArray(obj)) {
      return obj.map(item => this._sanitizeData(item, seen));
    }

    // Si c'est un objet, on parcourt ses propriétés
    const sanitized = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          const value = obj[key];
          
          // Ignorer les fonctions
          if (typeof value === 'function') {
            continue;
          }

          sanitized[key] = this._sanitizeData(value, seen);
        } catch (e) {
          sanitized[key] = '[Unable to serialize]';
        }
      }
    }

    return sanitized;
  }

  /**
   * Envoie une réponse utilisateur
   * @param {string} campaignId - ID de la campagne
   * @param {string} questionId - ID de la question
   * @param {any} answer - Réponse de l'utilisateur
   * @param {Object} metadata - Métadonnées additionnelles
   * @returns {Promise<boolean>}
   */
  async submitAnswer(campaignId, questionId, answer, metadata = {}) {
    try {
      // Nettoyer les métadonnées pour éviter les références circulaires
      const sanitizedMetadata = this._sanitizeData(metadata);
      
      const payload = {
        campaignId,
        questionId,
        answer,
        metadata: sanitizedMetadata,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Nettoyer le payload entier avant stringify pour éviter les erreurs de circularité
      const sanitizedPayload = this._sanitizeData(payload);

      if (ErrorHandler.debugMode) {
        console.log('[DataSubmitter] Submitting answer:', sanitizedPayload);
      }

      const response = await fetch(`${this.apiBaseUrl}/submit`, {
        method: 'POST',
        headers: this._buildHeaders(),
        body: JSON.stringify(sanitizedPayload)
      });

      if (response.ok) {
        if (ErrorHandler.debugMode) {
          console.log('[DataSubmitter] Answer submitted successfully');
        }
        return true;
      } else {
        console.warn('[DataSubmitter] Submit failed with status:', response.status);
        return false;
      }

    } catch (error) {
      ErrorHandler.log(error, 'DataSubmitter.submitAnswer');
      return false;
    }
  }

  /**
   * Envoie une impression (dismiss)
   * @param {string} campaignId - ID de la campagne
   * @param {string} questionId - ID de la question
   * @param {Object} metadata - Métadonnées additionnelles
   * @returns {Promise<boolean>}
   */
  async submitImpression(campaignId, questionId, metadata = {}) {
    try {
      // Nettoyer les métadonnées pour éviter les références circulaires
      const sanitizedMetadata = this._sanitizeData(metadata);
      
      const payload = {
        campaignId,
        questionId,
        metadata: sanitizedMetadata,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Nettoyer le payload entier avant stringify pour éviter les erreurs de circularité
      const sanitizedPayload = this._sanitizeData(payload);

      if (ErrorHandler.debugMode) {
        console.log('[DataSubmitter] Submitting impression:', sanitizedPayload);
      }

      const response = await fetch(`${this.apiBaseUrl}/impression`, {
        method: 'POST',
        headers: this._buildHeaders(),
        body: JSON.stringify(sanitizedPayload)
      });

      if (response.ok) {
        if (ErrorHandler.debugMode) {
          console.log('[DataSubmitter] Impression submitted successfully');
        }
        return true;
      } else {
        console.warn('[DataSubmitter] Impression failed with status:', response.status);
        return false;
      }

    } catch (error) {
      ErrorHandler.log(error, 'DataSubmitter.submitImpression');
      return false;
    }
  }
}

export default DataSubmitter;