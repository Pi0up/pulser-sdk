/**
 * StorageManager - Gestion du localStorage
 * Persiste les métadonnées utilisateur et l'historique des campagnes
 */
import ErrorHandler from './ErrorHandler.js';

class StorageManager {
  constructor() {
    this.prefix = 'pulser_sdk_';
    
    // Clés de stockage
    this.keys = {
      userMeta: `${this.prefix}user_meta`,
      campaignHistory: `${this.prefix}campaign_history`,
      answeredQuestions: `${this.prefix}answered_questions`,
      configCache: `${this.prefix}config_cache`,
      configLastFetch: `${this.prefix}config_last_fetch`,
      consent: `${this.prefix}consent`
    };
  }

  /**
   * Nettoie une valeur pour éviter les références circulaires
   * @param {any} value - Valeur à nettoyer
   * @param {WeakSet} seen - Set pour tracker les objets déjà vus
   * @returns {any} Valeur nettoyée
   */
  _sanitizeValue(value, seen = null) {
    // Initialiser le WeakSet au premier appel
    if (!seen) {
      seen = new WeakSet();
    }

    if (value === null || value === undefined) {
      return value;
    }

    // Types primitifs
    if (typeof value !== 'object') {
      return value;
    }

    // Éléments DOM
    if (value instanceof Element || value instanceof Node) {
      return `[DOM Element: ${value.nodeName}]`;
    }

    // Window/Document
    if (value === window || value === document) {
      return '[Window/Document]';
    }

    // Vérifier si l'objet a déjà été vu (référence circulaire)
    if (seen.has(value)) {
      return '[Circular Reference]';
    }

    // Marquer l'objet comme vu
    seen.add(value);

    // Tableaux
    if (Array.isArray(value)) {
      return value.map(item => this._sanitizeValue(item, seen));
    }

    // Objets - parcourir manuellement
    const sanitized = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        try {
          if (typeof value[key] === 'function') {
            continue; // Ignorer les fonctions
          }
          sanitized[key] = this._sanitizeValue(value[key], seen);
        } catch (err) {
          sanitized[key] = '[Unable to serialize]';
        }
      }
    }
    return sanitized;
  }

  // ========== Métadonnées utilisateur ==========

  /**
   * Stocke une métadonnée utilisateur
   * @param {string} key - Clé
   * @param {any} value - Valeur
   */
  setUserData(key, value) {
    try {
      const userData = this.getAllUserData();
      // Nettoyer la valeur pour éviter les références circulaires
      const sanitizedValue = this._sanitizeValue(value);
      
      userData[key] = sanitizedValue;
      
      // Nettoyer l'objet complet avant stringify pour plus de sécurité
      const sanitizedUserData = this._sanitizeValue(userData);
      localStorage.setItem(this.keys.userMeta, JSON.stringify(sanitizedUserData));
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] User data saved (sanitized):', { 
          key, 
          value: sanitizedValue
        });
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.setUserData');
    }
  }

  /**
   * Récupère toutes les métadonnées utilisateur
   * @returns {Object}
   */
  getAllUserData() {
    try {
      const data = localStorage.getItem(this.keys.userMeta);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.getAllUserData');
      return {};
    }
  }

  // ========== Historique des campagnes ==========

  /**
   * Récupère l'historique d'une campagne
   * @param {string} campaignId - ID de la campagne
   * @returns {Object|null}
   */
  getCampaignHistory(campaignId) {
    try {
      const history = this._getAllCampaignHistory();
      return history[campaignId] || null;
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.getCampaignHistory');
      return null;
    }
  }

  /**
   * Marque une campagne comme affichée
   * @param {string} campaignId - ID de la campagne
   * @param {string} questionId - ID de la question affichée
   */
  markCampaignAsShown(campaignId, questionId) {
    try {
      const history = this._getAllCampaignHistory();
      const now = Date.now();
      
      if (!history[campaignId]) {
        history[campaignId] = {
          firstShown: now,
          lastShown: now,
          shownCount: 1,
          dismissedCount: 0,
          answeredCount: 0,
          lastQuestionId: questionId
        };
      } else {
        history[campaignId].lastShown = now;
        history[campaignId].shownCount += 1;
        history[campaignId].lastQuestionId = questionId;
      }
      
      // Nettoyer l'historique avant stringify pour éviter les références circulaires
      const sanitizedHistory = this._sanitizeValue(history);
      localStorage.setItem(this.keys.campaignHistory, JSON.stringify(sanitizedHistory));
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Campaign marked as shown:', { campaignId, questionId });
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.markCampaignAsShown');
    }
  }

  /**
   * Marque une campagne comme dismissed
   * @param {string} campaignId - ID de la campagne
   */
  markCampaignAsDismissed(campaignId) {
    try {
      const history = this._getAllCampaignHistory();
      
      if (history[campaignId]) {
        history[campaignId].dismissedCount += 1;
        history[campaignId].lastShown = Date.now();
      }
      
      // Nettoyer l'historique avant stringify pour éviter les références circulaires
      const sanitizedHistory = this._sanitizeValue(history);
      localStorage.setItem(this.keys.campaignHistory, JSON.stringify(sanitizedHistory));
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Campaign marked as dismissed:', campaignId);
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.markCampaignAsDismissed');
    }
  }

  /**
   * Marque une campagne comme answered
   * @param {string} campaignId - ID de la campagne
   * @param {string} questionId - ID de la question répondue
   */
  markCampaignAsAnswered(campaignId, questionId) {
    try {
      const history = this._getAllCampaignHistory();
      
      if (history[campaignId]) {
        history[campaignId].answeredCount += 1;
        history[campaignId].lastShown = Date.now();
      }
      
      // Nettoyer l'historique avant stringify pour éviter les références circulaires
      const sanitizedHistory = this._sanitizeValue(history);
      localStorage.setItem(this.keys.campaignHistory, JSON.stringify(sanitizedHistory));
      
      // Stocker le couple (campaignId, questionId)
      this._storeAnsweredQuestion(campaignId, questionId);
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Campaign marked as answered:', { campaignId, questionId });
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.markCampaignAsAnswered');
    }
  }

  /**
   * Vérifie si une campagne peut être affichée selon sa fréquence
   * @param {string} campaignId - ID de la campagne
   * @param {number} frequencyDays - Nombre de jours minimum entre deux affichages
   * @returns {boolean}
   */
  canShowCampaign(campaignId, frequencyDays) {
    if (frequencyDays === 0) return true; // Toujours afficher
    
    try {
      const history = this.getCampaignHistory(campaignId);
      
      if (!history || !history.lastShown) {
        return true; // Jamais affichée
      }
      
      const daysSinceLastShown = (Date.now() - history.lastShown) / (1000 * 60 * 60 * 24);
      const canShow = daysSinceLastShown >= frequencyDays;
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Can show campaign?', {
          campaignId,
          daysSinceLastShown: daysSinceLastShown.toFixed(2),
          frequencyDays,
          canShow
        });
      }
      
      return canShow;
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.canShowCampaign');
      return true; // Par défaut, autoriser l'affichage
    }
  }

  /**
   * Récupère tout l'historique des campagnes
   * @returns {Object}
   * @private
   */
  _getAllCampaignHistory() {
    try {
      const data = localStorage.getItem(this.keys.campaignHistory);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager._getAllCampaignHistory');
      return {};
    }
  }

  // ========== Questions répondues ==========

  /**
   * Stocke un couple (campaignId, questionId) comme répondu
   * @param {string} campaignId - ID de la campagne
   * @param {string} questionId - ID de la question
   * @private
   */
  _storeAnsweredQuestion(campaignId, questionId) {
    try {
      const answered = this._getAllAnsweredQuestions();
      const key = `${campaignId}:${questionId}`;
      answered[key] = Date.now();
      
      // Nettoyer les données avant stringify pour éviter les références circulaires
      const sanitizedAnswered = this._sanitizeValue(answered);
      localStorage.setItem(this.keys.answeredQuestions, JSON.stringify(sanitizedAnswered));
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Question stored as answered:', { campaignId, questionId });
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager._storeAnsweredQuestion');
    }
  }

  /**
   * Vérifie si une question a déjà été répondue
   * @param {string} campaignId - ID de la campagne
   * @param {string} questionId - ID de la question
   * @returns {boolean}
   */
  hasAnswered(campaignId, questionId) {
    try {
      const answered = this._getAllAnsweredQuestions();
      const key = `${campaignId}:${questionId}`;
      return answered[key] !== undefined;
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.hasAnswered');
      return false;
    }
  }

  /**
   * Récupère toutes les questions répondues
   * @returns {Object}
   * @private
   */
  _getAllAnsweredQuestions() {
    try {
      const data = localStorage.getItem(this.keys.answeredQuestions);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager._getAllAnsweredQuestions');
      return {};
    }
  }

  // ========== Cache de configuration ==========

  /**
   * Stocke la configuration en cache
   * @param {Object} config - Configuration
   */
  setCachedConfig(config) {
    try {
      // Nettoyer la config pour éviter les références circulaires
      const sanitizedConfig = this._sanitizeValue(config);
      localStorage.setItem(this.keys.configCache, JSON.stringify(sanitizedConfig));
      localStorage.setItem(this.keys.configLastFetch, Date.now().toString());
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Config cached');
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.setCachedConfig');
    }
  }

  /**
   * Récupère la configuration en cache
   * @returns {Object|null}
   */
  getCachedConfig() {
    try {
      const data = localStorage.getItem(this.keys.configCache);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.getCachedConfig');
      return null;
    }
  }

  /**
   * Récupère la date du dernier fetch
   * @returns {number|null}
   */
  getLastFetchDate() {
    try {
      const date = localStorage.getItem(this.keys.configLastFetch);
      return date ? parseInt(date, 10) : null;
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.getLastFetchDate');
      return null;
    }
  }

  /**
   * Vérifie si le cache est encore valide
   * @param {number} ttl - TTL en millisecondes
   * @returns {boolean}
   */
  isCacheValid(ttl) {
    const lastFetch = this.getLastFetchDate();
    if (!lastFetch) return false;
    
    const age = Date.now() - lastFetch;
    return age < ttl;
  }

  // ========== Consentement RGPD ==========

  /**
   * Récupère le statut du consentement
   * @returns {boolean|null} - true = accepté, false = refusé, null = pas encore demandé
   */
  getConsent() {
    try {
      const consent = localStorage.getItem(this.keys.consent);
      if (consent === null) return null;
      return consent === 'true';
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.getConsent');
      return null;
    }
  }

  /**
   * Enregistre le consentement de l'utilisateur
   * @param {boolean} accepted - true si accepté, false si refusé
   */
  setConsent(accepted) {
    try {
      localStorage.setItem(this.keys.consent, accepted.toString());
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Consent saved:', accepted);
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.setConsent');
    }
  }

  /**
   * Efface le consentement (pour permettre de le redemander)
   */
  clearConsent() {
    try {
      localStorage.removeItem(this.keys.consent);
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] Consent cleared');
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.clearConsent');
    }
  }

  /**
   * Efface toutes les réponses (pour conformité RGPD)
   */
  clearAllResponses() {
    try {
      localStorage.removeItem(this.keys.answeredQuestions);
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] All responses cleared');
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.clearAllResponses');
    }
  }

  /**
   * Efface toutes les impressions (pour conformité RGPD)
   */
  clearAllImpressions() {
    try {
      localStorage.removeItem(this.keys.campaignHistory);
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] All impressions cleared');
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.clearAllImpressions');
    }
  }

  // ========== Nettoyage ==========

  /**
   * Efface toutes les données du SDK
   */
  clearAll() {
    try {
      Object.values(this.keys).forEach(key => {
        localStorage.removeItem(key);
      });
      
      if (ErrorHandler.debugMode) {
        console.log('[StorageManager] All data cleared');
      }
    } catch (error) {
      ErrorHandler.log(error, 'StorageManager.clearAll');
    }
  }
}

export default StorageManager;