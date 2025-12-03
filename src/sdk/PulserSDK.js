/**
 * PulserSDK - Classe principale du SDK
 * Point d'entrée et orchestration de tous les modules
 */
import ErrorHandler from './ErrorHandler.js';
import StorageManager from './StorageManager.js';
import ConfigManager from './ConfigManager.js';
import DecisionEngine from './DecisionEngine.js';
import DataSubmitter from './DataSubmitter.js';
import NavigationMonitor from './NavigationMonitor.js';
import UIRenderer from './UIRenderer.js';
import ConsentManager from './ConsentManager.js';
import pkg from '../../package.json';

/* Version check: simulate endpoint and notify on new version */
(function() {
  function _versionParts(v) { return v.split('.').map(n => parseInt(n, 10)); }
  function _isNewerVersion(latest, current) {
    const L = _versionParts(latest);
    const C = _versionParts(current);
    for (let i = 0; i < Math.max(L.length, C.length); i++) {
      const a = L[i] ?? 0;
      const b = C[i] ?? 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return false;
  }
  async function _mockVersionEndpoint() {
    await new Promise(resolve => setTimeout(resolve, 120));
    return { latest: '0.2.0' };
  }
  async function _checkVersionOnLoad() {
    try {
      const currentVersion = (typeof pkg !== 'undefined' && pkg.version) ? pkg.version : '0.0.0';
      const resp = await _mockVersionEndpoint();
      const latest = resp.latest;
      if (_isNewerVersion(latest, currentVersion)) {
        console.warn('[PulserSDK] Nouvelle version disponible: ' + latest + ' (courante: ' + currentVersion + ')');
        // Auto-update placeholder (disabled by default)
        const autoUpdate = false;
        if (autoUpdate && typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err) {
      // ignore
    }
  }
  _checkVersionOnLoad();
})();

class PulserSDK {
  // Instance statique pour le pattern Singleton
  static instance = null;

  constructor() {
    // Vérifier si une instance existe déjà (Singleton)
    if (PulserSDK.instance) {
      if (ErrorHandler.debugMode) {
        console.warn('[PulserSDK] Instance already exists, returning existing instance');
      }
      return PulserSDK.instance;
    }

    // Configuration
    this.domain = null;
    this.language = 'en';
    this.specificId = null;
    this.debugMode = false;
    this.position = 'bottom-right';
    
    // Modules
    this.storageManager = null;
    this.configManager = null;
    this.decisionEngine = null;
    this.dataSubmitter = null;
    this.navigationMonitor = null;
    this.uiRenderer = null;
    this.consentManager = null;
    
    // État
    this.isInitialized = false;
    this.campaigns = [];
    this.currentCampaign = null; // Campagne actuellement affichée
    this.currentQuestion = null; // Question actuellement affichée
    this.pollingInterval = 2000; // 2 secondes par défaut
    
    // Protection contre affichages multiples
    this.isDisplaying = false; // Flag pour éviter affichages simultanés
    this.lastTriggerTime = 0; // Timestamp du dernier déclenchement
    this.debounceDelay = 500; // Délai minimum entre deux déclenchements (ms)

    // Stocker l'instance
    PulserSDK.instance = this;
  }

  /**
   * Initialisation du SDK
   * @param {string} domain - Domaine de l'API (ex: 'example.com')
   * @param {string} language - Langue (ex: 'fr', 'en')
   * @param {string|null} specificId - ID spécifique optionnel
   * @param {Object} options - Options additionnelles
   */
  async init(domain, language = 'en', specificId = null, options = {}) {
    if (this.isInitialized) {
      console.warn('[PulserSDK] Already initialized');
      return;
    }

    // Configuration
    this.domain = domain;
    this.language = language;
    this.specificId = specificId;
    this.debugMode = options.debug || false;
    this.pollingInterval = options.pollingInterval || 2000;
    this.position = options.position || 'bottom-right';

    // Active le mode debug si demandé
    if (this.debugMode) {
      ErrorHandler.enableDebug();
    }

    // Initialisation avec gestion d'erreur
    await ErrorHandler.wrap(async () => {
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Initializing...', {
          domain,
          language,
          specificId,
          debug: this.debugMode
        });
      }

      this._setupModules();
      await this._fetchConfiguration();
      this._startMonitoring();
      await this._verifyVersion();
      
      this.isInitialized = true;

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Initialized successfully', {
          campaignsCount: this.campaigns.length
        });
      }
    }, 'init')();
  }

  /**
   * Initialise tous les modules internes
   */
  _setupModules() {
    // Storage
    this.storageManager = new StorageManager();
    
    // Config
    this.configManager = new ConfigManager(
      this.domain,
      this.language,
      this.specificId,
      this.storageManager
    );
    
    // Décision
    this.decisionEngine = new DecisionEngine(this.storageManager);
    
    // Data
    this.dataSubmitter = new DataSubmitter(this.domain);
    
    // UI
    this.uiRenderer = new UIRenderer(
      this._handleSubmit.bind(this),
      this._handleDismiss.bind(this),
      this.position
    );
    
    // Navigation
    this.navigationMonitor = new NavigationMonitor(
      this._handlePageChange.bind(this)
    );

    // Consent
    this.consentManager = new ConsentManager(this.storageManager);

    if (ErrorHandler.debugMode) {
      console.log('[PulserSDK] Modules initialized');
    }
  }

  /**
   * Charge la configuration depuis l'API (avec cache)
   */
  async _fetchConfiguration() {
    const config = await this.configManager.fetchConfig();
    this.campaigns = config.campaigns || [];
    
    // Configurer le consentement
    if (config.consent) {
      this.consentManager.setConfig(config.consent);
    } else {
      // Configuration par défaut si non fournie
      this.consentManager.setConfig({
        enabled: true
      });
    }
    
    if (ErrorHandler.debugMode) {
      console.log('[PulserSDK] Configuration loaded:', {
        campaignsCount: this.campaigns.length,
        campaigns: this.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          priority: c.priority,
          questionsCount: c.questions?.length || 0
        })),
        consentStatus: this.consentManager.getStatus()
      });
    }
  }

  /**
   * Démarre la surveillance de navigation
   */
  _startMonitoring() {
    // Démarrer le monitor avec l'intervalle configuré
    this.navigationMonitor.start(this.pollingInterval);
    
    // Évaluation initiale au chargement
    this._handlePageChange(window.location.href);
  }

  /**
   * Callback appelé à chaque changement de page
   * @param {string} url - Nouvelle URL
   */
  _handlePageChange(url) {
    ErrorHandler.wrap(() => {
      // Debounce : Éviter plusieurs déclenchements rapides
      const now = Date.now();
      if (now - this.lastTriggerTime < this.debounceDelay) {
        if (ErrorHandler.debugMode) {
          console.log('[PulserSDK] Debounced: Too soon after last trigger');
        }
        return;
      }

      // Vérifier si une question est déjà en cours d'affichage
      if (this.isDisplaying) {
        if (ErrorHandler.debugMode) {
          console.log('[PulserSDK] Already displaying a question, skipping');
        }
        return;
      }

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Page change detected:', url);
      }

      const processNewPage = () => {
        // Marquer comme en cours d'affichage
        this.isDisplaying = true;
        this.lastTriggerTime = now;

        // Vérifier le consentement RGPD
        if (this.consentManager.isConsentRequired()) {
          // Afficher l'écran de consentement
          if (ErrorHandler.debugMode) {
            console.log('[PulserSDK] Consent required, showing consent screen');
          }
          
          const consentConfig = this.consentManager.getConfig();
          this.uiRenderer.renderConsent(consentConfig, (accepted) => {
            this.consentManager.saveConsent(accepted);
            
            if (accepted) {
              // Consentement accepté, continuer avec la question
              this._showNextQuestion(url);
            } else {
              // Consentement refusé, masquer et libérer
              this.uiRenderer.hide();
              this.isDisplaying = false;
            }
          });
          this.uiRenderer.show();
          return;
        }

        // Vérifier si l'utilisateur a consenti
        if (!this.consentManager.hasConsent()) {
          if (ErrorHandler.debugMode) {
            console.log('[PulserSDK] No consent given, skipping questions');
          }
          this.isDisplaying = false;
          return;
        }

        // Afficher la question
        this._showNextQuestion(url);
      };

      // Si un widget est déjà visible, on le ferme d'abord (transition 300ms)
      if (this.uiRenderer.isVisible) {
        if (ErrorHandler.debugMode) {
          console.log('[PulserSDK] Closing widget due to navigation');
        }
        this.uiRenderer.hide();
        setTimeout(processNewPage, 350);
      } else {
        processNewPage();
      }
    }, 'handlePageChange')();
  }

  /**
   * Affiche la prochaine question éligible
   * @param {string} url - URL courante
   * @private
   */
  _showNextQuestion(url) {
    // Trouver une campagne éligible
    const result = this.decisionEngine.findEligibleCampaign(
      this.campaigns,
      url
    );

    if (result) {
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Eligible campaign found:', {
          campaignId: result.campaign.id,
          questionId: result.question.id
        });
      }
      
      this.currentCampaign = result.campaign;
      this.currentQuestion = result.question;
      
      this.uiRenderer.renderQuestion(result.question, result.campaign);
      this.uiRenderer.show();
      
      // Marquer la campagne comme affichée
      this.storageManager.markCampaignAsShown(
        result.campaign.id,
        result.question.id
      );
    } else {
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] No eligible campaign for this page');
      }
      // Libérer le flag si aucune question trouvée
      this.isDisplaying = false;
    }
  }

  /**
   * Gestion de la soumission d'une réponse
   * @param {string} questionId - ID de la question
   * @param {any} answer - Réponse de l'utilisateur
   */
  _handleSubmit(questionId, answer) {
    ErrorHandler.wrap(async () => {
      if (!this.currentCampaign) {
        console.warn('[PulserSDK] No current campaign');
        return;
      }

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Answer submitted:', {
          campaignId: this.currentCampaign.id,
          questionId,
          answer
        });
      }

      // Envoi de la réponse
      await this.dataSubmitter.submitAnswer(
        this.currentCampaign.id,
        questionId,
        answer,
        this.storageManager.getAllUserData()
      );
      
      // Marquer la campagne comme answered avec le couple (campaignId, questionId)
      this.storageManager.markCampaignAsAnswered(this.currentCampaign.id, questionId);

      // Libérer le flag d'affichage
      this.isDisplaying = false;

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Answer sent successfully, display flag released');
      }
    }, 'handleSubmit')();
  }

  /**
   * Gestion de la fermeture manuelle (dismiss)
   * @param {string} questionId - ID de la question
   */
  _handleDismiss(questionId) {
    ErrorHandler.wrap(async () => {
      if (!this.currentCampaign) {
        console.warn('[PulserSDK] No current campaign');
        return;
      }

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Question dismissed:', {
          campaignId: this.currentCampaign.id,
          questionId
        });
      }

      // Envoi de l'impression
      await this.dataSubmitter.submitImpression(
        this.currentCampaign.id,
        questionId,
        this.storageManager.getAllUserData()
      );
      
      // Marquer la campagne comme dismissed
      this.storageManager.markCampaignAsDismissed(this.currentCampaign.id);

      // Libérer le flag d'affichage
      this.isDisplaying = false;

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Impression sent successfully, display flag released');
      }
    }, 'handleDismiss')();
  }

  // ========== API PUBLIQUE ==========

  /**
   * Force l'affichage d'une campagne spécifique
   * @param {string} campaignId - ID de la campagne à afficher
   */
  showCampaign(campaignId) {
    if (!this.isInitialized) {
      console.warn('[PulserSDK] Not initialized. Call init() first.');
      return;
    }

    ErrorHandler.wrap(() => {
      // Réinitialiser le flag pour permettre l'affichage forcé
      this.isDisplaying = false;

      const campaign = this.campaigns.find(c => c.id === campaignId);
      
      if (campaign && campaign.questions && campaign.questions.length > 0) {
        if (ErrorHandler.debugMode) {
          console.log('[PulserSDK] Forcing display of campaign:', campaignId);
        }
        
        // Sélectionner une question non-répondue ou aléatoire si toutes répondues
        const unansweredQuestions = campaign.questions.filter(q => 
          !this.storageManager.hasAnswered(campaign.id, q.id)
        );
        
        const questionsToChooseFrom = unansweredQuestions.length > 0 
          ? unansweredQuestions 
          : campaign.questions;
        
        const randomIndex = Math.floor(Math.random() * questionsToChooseFrom.length);
        const question = questionsToChooseFrom[randomIndex];
        
        this.currentCampaign = campaign;
        this.currentQuestion = question;
        this.isDisplaying = true;
        
        this.uiRenderer.renderQuestion(question, campaign);
        this.uiRenderer.show();
        
        this.storageManager.markCampaignAsShown(campaign.id, question.id);
      } else {
        console.warn(`[PulserSDK] Campaign not found or has no questions: ${campaignId}`);
      }
    }, 'showCampaign')();
  }

  /**
   * Force l'affichage d'une question spécifique (pour compatibilité)
   * Recherche la question dans toutes les campagnes
   * @param {string} questionId - ID de la question à afficher
   */
  showQuestion(questionId) {
    if (!this.isInitialized) {
      console.warn('[PulserSDK] Not initialized. Call init() first.');
      return;
    }

    ErrorHandler.wrap(() => {
      // Réinitialiser le flag pour permettre l'affichage forcé
      this.isDisplaying = false;

      // Rechercher la question dans toutes les campagnes
      for (const campaign of this.campaigns) {
        if (campaign.questions) {
          const question = campaign.questions.find(q => q.id === questionId);
          if (question) {
            if (ErrorHandler.debugMode) {
              console.log('[PulserSDK] Forcing display of question:', {
                campaignId: campaign.id,
                questionId
              });
            }
            
            this.currentCampaign = campaign;
            this.currentQuestion = question;
            this.isDisplaying = true;
            
            this.uiRenderer.renderQuestion(question, campaign);
            this.uiRenderer.show();
            
            this.storageManager.markCampaignAsShown(campaign.id, question.id);
            return;
          }
        }
      }
      
      // Debug: afficher toutes les questions disponibles
      if (ErrorHandler.debugMode) {
        const allQuestions = [];
        this.campaigns.forEach(c => {
          if (c.questions) {
            c.questions.forEach(q => allQuestions.push({ campaignId: c.id, questionId: q.id, type: q.type }));
          }
        });
        console.warn(`[PulserSDK] Question not found: ${questionId}`);
        console.log('[PulserSDK] Available questions:', allQuestions);
      } else {
        console.warn(`[PulserSDK] Question not found: ${questionId}`);
      }
    }, 'showQuestion')();
  }

  /**
   * Enrichit les métadonnées utilisateur
   * @param {Object} userData - Données utilisateur (ex: {id: '123', email: 'user@example.com'})
   */
  setUserInfo(userData) {
    if (!this.isInitialized) {
      console.warn('[PulserSDK] Not initialized. Call init() first.');
      return;
    }

    ErrorHandler.wrap(() => {
      if (typeof userData !== 'object' || userData === null) {
        console.warn('[PulserSDK] setUserInfo expects an object');
        return;
      }

      // Vérification de sécurité : détecter les objets problématiques
      if (userData === window || userData === document) {
        console.error('[PulserSDK] Cannot use window or document as user data');
        return;
      }

      Object.entries(userData).forEach(([key, value]) => {
        // Vérifier aussi les valeurs individuelles
        if (value === window || value === document) {
          console.warn(`[PulserSDK] Skipping key "${key}": cannot store window or document references`);
          return;
        }
        this.storageManager.setUserData(key, value);
      });

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] User info updated:', userData);
      }
    }, 'setUserInfo')();
  }

  /**
   * Cache le widget actuellement affiché
   */
  hide() {
    if (this.uiRenderer) {
      this.uiRenderer.hide();
      // Libérer le flag d'affichage
      this.isDisplaying = false;
    }
  }

  /**
   * Affiche le widget (si une question est déjà rendue)
   */
  show() {
    if (this.uiRenderer && this.uiRenderer.currentQuestion) {
      this.uiRenderer.show();
    }
  }

  /**
   * Force une réévaluation immédiate (utile après navigation manuelle)
   */
  refresh() {
    if (!this.isInitialized) return;
    
    this.navigationMonitor.checkNow();
  }

  /**
   * Change la position du widget sans réinitialiser le SDK
   * @param {string} newPosition - Nouvelle position (ex: 'bottom-center')
   */
  updatePosition(newPosition) {
    if (!this.isInitialized) {
      console.warn('[PulserSDK] SDK not initialized');
      return;
    }

    ErrorHandler.wrap(() => {
      // Sauvegarder l'état actuel
      const wasDisplaying = this.isDisplaying;
      const currentQ = this.currentQuestion;
      const currentC = this.currentCampaign;

      // Détruire l'UI actuelle
      if (this.uiRenderer) {
        this.uiRenderer.destroy();
      }

      // Créer un nouveau renderer avec la nouvelle position
      this.position = newPosition;
      this.uiRenderer = new UIRenderer(
        this._handleSubmit.bind(this),
        this._handleDismiss.bind(this),
        newPosition
      );

      // Restaurer l'état si une question était affichée
      if (wasDisplaying && currentQ && currentC) {
        this.currentQuestion = currentQ;
        this.currentCampaign = currentC;
        this.uiRenderer.renderQuestion(currentQ, currentC);
        this.uiRenderer.show();
        this.isDisplaying = true;
      }

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Position updated to:', newPosition);
      }
    }, 'updatePosition')();
  }

  /**
   * Détruit complètement le SDK
   */
  destroy() {
    if (!this.isInitialized) return;

    ErrorHandler.wrap(() => {
      // Arrêter la surveillance
      if (this.navigationMonitor) {
        this.navigationMonitor.stop();
      }
      
      // Détruire l'UI
      if (this.uiRenderer) {
        this.uiRenderer.destroy();
      }
      
      // Reset l'état
      this.isInitialized = false;
      this.campaigns = [];
      this.currentCampaign = null;
      this.currentQuestion = null;
      this.isDisplaying = false;

      // Supprimer l'instance singleton
      PulserSDK.instance = null;

      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Destroyed');
      }
    }, 'destroy')();
  }

  /**
   * Efface toutes les données du SDK (cache, fréquences, etc.)
   */
  clearData() {
    if (this.storageManager) {
      this.storageManager.clearAll();
      
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] All data cleared');
      }
    }
  }

  // ========== Méthodes de gestion du consentement RGPD ==========

  /**
   * Récupère le statut actuel du consentement
   * @returns {Object} - { enabled, required, hasConsent, status }
   */
  getConsentStatus() {
    if (!this.consentManager) {
      return {
        enabled: false,
        required: false,
        hasConsent: true,
        status: null
      };
    }
    return this.consentManager.getStatus();
  }

  /**
   * Vérifie si l'utilisateur a donné son consentement
   * @returns {boolean}
   */
  hasConsent() {
    if (!this.consentManager) return true;
    return this.consentManager.hasConsent();
  }

  /**
   * Réinitialise le consentement (pour permettre de le redemander)
   * Utile pour les paramètres utilisateur ou les tests
   */
  resetConsent() {
    if (!this.consentManager) return;
    
    ErrorHandler.wrap(() => {
      this.consentManager.resetConsent();
      
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Consent reset');
      }
    }, 'resetConsent')();
  }

  /**
   * Définit manuellement le consentement (pour une intégration externe)
   * @param {boolean} accepted - true si accepté, false si refusé
   */
  setConsent(accepted) {
    if (!this.consentManager) return;
    
    ErrorHandler.wrap(() => {
      this.consentManager.saveConsent(accepted);
      
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Consent manually set:', accepted);
      }
    }, 'setConsent')();
  }

  /**
   * Recharge la configuration depuis l'API (force un refresh)
   * @returns {Promise<void>}
   */
  async reloadConfig() {
    if (!this.isInitialized) {
      console.warn('[PulserSDK] Not initialized. Call init() first.');
      return;
    }

    return ErrorHandler.wrap(async () => {
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Reloading configuration...');
      }

      // Forcer le rechargement en ignorant le cache
      this.campaigns = await this.configManager.fetchCampaigns(true);
      
      if (ErrorHandler.debugMode) {
        console.log('[PulserSDK] Configuration reloaded:', {
          campaignsCount: this.campaigns.length,
          campaigns: this.campaigns.map(c => ({ id: c.id, name: c.name, questionsCount: c.questions?.length || 0 }))
        });
      }
    }, 'reloadConfig')();
  }

  /**
  /**
   * Vérifie la version du SDK contre une source mock et affiche un avertissement si mise à jour disponible
   */
  async _verifyVersion() {
    const currentVersion = (typeof pkg !== 'undefined' && pkg?.version) ? pkg.version : '0.0.0';
    try {
      const resp = await this._mockVersionEndpoint();
      const latest = resp.latest;
      if (this._isNewerVersion(latest, currentVersion)) {
        console.warn('[PulserSDK] Nouvelle version disponible: ' + latest + ' (courante: ' + currentVersion + ')');
        // Option d'auto-mise à jour (désactivée par défaut)
        const autoUpdate = false;
        if (autoUpdate && typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err) {
      // Ignore les erreurs de vérification
    }
  }

  _mockVersionEndpoint() {
    // Endpoint fictif simulé qui retourne la dernière version
    return new Promise(resolve => {
      setTimeout(() => resolve({ latest: '0.2.0' }), 120);
    });
  }

  _versionParts(v) {
    return (v || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  }

  _isNewerVersion(latest, current) {
    const L = this._versionParts(latest);
    const C = this._versionParts(current);
    for (let i = 0; i < Math.max(L.length, C.length); i++) {
      const a = L[i] ?? 0;
      const b = C[i] ?? 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return false;
  }
  /**
   * Récupère la version actuelle du SDK à partir du package.json
   * @returns {string}
   */
  getVersion() {
    return (typeof pkg !== 'undefined' && pkg.version) ? pkg.version : '0.0.0';
  }

 /**
  * Récupère les informations de debug
  * @returns {Object}
  */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      domain: this.domain,
      language: this.language,
      specificId: this.specificId,
      debugMode: this.debugMode,
      campaignsCount: this.campaigns.length,
      campaigns: this.campaigns.map(c => ({
        id: c.id,
        name: c.name,
        priority: c.priority,
        frequencyDays: c.frequencyDays,
        luckFactor: c.luckFactor,
        questionsCount: c.questions?.length || 0,
        canShow: this.storageManager.canShowCampaign(c.id, c.frequencyDays || 0)
      })),
      currentCampaign: this.currentCampaign ? {
        id: this.currentCampaign.id,
        name: this.currentCampaign.name
      } : null,
      currentQuestion: this.currentQuestion ? {
        id: this.currentQuestion.id,
        title: this.currentQuestion.title
      } : null,
      currentUrl: window.location.href,
      isWidgetVisible: this.uiRenderer?.isVisible || false,
      isDisplaying: this.isDisplaying,
      lastTriggerTime: this.lastTriggerTime,
      userData: this.storageManager?.getAllUserData() || {}
    };
  }

  /**
   * Méthode statique pour obtenir l'instance singleton
   * @returns {PulserSDK|null}
   */
  static getInstance() {
    return PulserSDK.instance;
  }
}

export default PulserSDK;
