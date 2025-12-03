/**
 * ConsentManager - Gestion du consentement RGPD
 * Gère l'affichage et le stockage du consentement utilisateur
 */
import ErrorHandler from './ErrorHandler.js';

class ConsentManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.config = null;
  }

  /**
   * Configure le gestionnaire de consentement
   * @param {Object} config - Configuration du consentement
   */
  setConfig(config) {
    this.config = {
      enabled: config?.enabled !== false, // Par défaut true
      title: config?.title || "Votre avis nous intéresse",
      description: config?.description || "Nous aimerions recueillir vos retours pour améliorer votre expérience.",
      learnMoreText: config?.learnMoreText || "En savoir plus",
      learnMoreUrl: config?.learnMoreUrl || null,
      dataCollectionInfo: config?.dataCollectionInfo || "Nous collectons vos réponses de manière anonyme pour améliorer nos services. Vos données ne seront jamais partagées avec des tiers.",
      acceptLabel: config?.acceptLabel || "Oui, j'accepte",
      declineLabel: config?.declineLabel || "Non merci",
      privacyPolicyUrl: config?.privacyPolicyUrl || null,
    };

    if (ErrorHandler.debugMode) {
      console.log('[ConsentManager] Configuration mise à jour:', this.config);
    }
  }

  /**
   * Vérifie si le consentement est requis
   * @returns {boolean} - True si le consentement doit être demandé
   */
  isConsentRequired() {
    try {
      // Si le consentement est désactivé, pas besoin de le demander
      if (!this.config || !this.config.enabled) {
        return false;
      }

      // Vérifier si le consentement a déjà été donné ou refusé
      const consentStatus = this.storageManager.getConsent();
      
      // Si aucun consentement enregistré, on doit le demander
      return consentStatus === null;

    } catch (error) {
      ErrorHandler.log(error, 'ConsentManager.isConsentRequired');
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur a donné son consentement
   * @returns {boolean} - True si l'utilisateur a consenti
   */
  hasConsent() {
    try {
      // Si le consentement est désactivé, considérer comme accordé
      if (!this.config || !this.config.enabled) {
        return true;
      }

      const consentStatus = this.storageManager.getConsent();
      return consentStatus === true;

    } catch (error) {
      ErrorHandler.log(error, 'ConsentManager.hasConsent');
      return false;
    }
  }

  /**
   * Enregistre le consentement de l'utilisateur
   * @param {boolean} accepted - True si accepté, false si refusé
   */
  saveConsent(accepted) {
    try {
      this.storageManager.setConsent(accepted);

      if (ErrorHandler.debugMode) {
        console.log(`[ConsentManager] Consentement ${accepted ? 'accepté' : 'refusé'}`);
      }

      // Si refusé, effacer toutes les données collectées (conformité RGPD)
      if (!accepted) {
        this.storageManager.clearAllResponses();
        this.storageManager.clearAllImpressions();
        
        if (ErrorHandler.debugMode) {
          console.log('[ConsentManager] Données utilisateur effacées (refus de consentement)');
        }
      }

    } catch (error) {
      ErrorHandler.log(error, 'ConsentManager.saveConsent');
    }
  }

  /**
   * Réinitialise le consentement (pour permettre à l'utilisateur de le modifier)
   */
  resetConsent() {
    try {
      this.storageManager.clearConsent();
      
      if (ErrorHandler.debugMode) {
        console.log('[ConsentManager] Consentement réinitialisé');
      }

    } catch (error) {
      ErrorHandler.log(error, 'ConsentManager.resetConsent');
    }
  }

  /**
   * Récupère la configuration du consentement
   * @returns {Object} - Configuration du consentement
   */
  getConfig() {
    return this.config;
  }

  /**
   * Récupère le statut actuel du consentement
   * @returns {Object} - { enabled, required, hasConsent, status }
   */
  getStatus() {
    try {
      const status = this.storageManager.getConsent();
      
      return {
        enabled: this.config?.enabled || false,
        required: this.isConsentRequired(),
        hasConsent: this.hasConsent(),
        status: status // null, true, ou false
      };

    } catch (error) {
      ErrorHandler.log(error, 'ConsentManager.getStatus');
      return {
        enabled: false,
        required: false,
        hasConsent: true,
        status: null
      };
    }
  }
}

export default ConsentManager;
