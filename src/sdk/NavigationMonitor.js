/**
 * NavigationMonitor - Détection de navigation SPA
 * Approche hybride : événements natifs + polling de secours
 * Zéro interférence avec le site hôte
 */
import ErrorHandler from './ErrorHandler.js';

class NavigationMonitor {
  constructor(onNavigate) {
    this.onNavigate = onNavigate;
    this.currentUrl = window.location.href;
    this.listeners = [];
    this.pollingInterval = null;
    this.isActive = false;
  }

  /**
   * Démarre la surveillance de navigation
   * @param {number} pollingIntervalMs - Intervalle de polling (défaut: 2000ms)
   */
  start(pollingIntervalMs = 2000) {
    if (this.isActive) {
      if (ErrorHandler.debugMode) {
        console.warn('[NavigationMonitor] Already started');
      }
      return;
    }

    this.isActive = true;
    
    // 1. Écoute des événements natifs
    this._listenToNativeEvents();
    
    // 2. Polling de secours
    this._startPolling(pollingIntervalMs);

    if (ErrorHandler.debugMode) {
      console.log('[NavigationMonitor] Started', {
        pollingInterval: pollingIntervalMs
      });
    }
  }

  /**
   * Arrête la surveillance
   */
  stop() {
    if (!this.isActive) return;

    // Cleanup événements
    this.listeners.forEach(([target, event, handler, options]) => {
      target.removeEventListener(event, handler, options);
    });
    this.listeners = [];
    
    // Cleanup polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.isActive = false;

    if (ErrorHandler.debugMode) {
      console.log('[NavigationMonitor] Stopped');
    }
  }

  /**
   * Écoute les événements natifs du navigateur
   */
  _listenToNativeEvents() {
    // 1. Navigation arrière/avant (History API)
    const popStateHandler = () => this._checkUrlChange();
    window.addEventListener('popstate', popStateHandler);
    this.listeners.push([window, 'popstate', popStateHandler]);

    // 2. Navigation par hash (#)
    const hashChangeHandler = () => this._checkUrlChange();
    window.addEventListener('hashchange', hashChangeHandler);
    this.listeners.push([window, 'hashchange', hashChangeHandler]);

    // 3. Clics sur liens (détection anticipée)
    const clickHandler = (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.href !== '#') {
        // Délai pour laisser le router SPA faire son travail
        setTimeout(() => this._checkUrlChange(), 100);
      }
    };
    document.addEventListener('click', clickHandler, true);
    this.listeners.push([document, 'click', clickHandler, true]);

    // 4. Soumission de formulaires (peut changer l'URL)
    const submitHandler = () => {
      setTimeout(() => this._checkUrlChange(), 100);
    };
    document.addEventListener('submit', submitHandler, true);
    this.listeners.push([document, 'submit', submitHandler, true]);
  }

  /**
   * Démarre le polling de secours
   * @param {number} interval - Intervalle en ms
   */
  _startPolling(interval) {
    this.pollingInterval = setInterval(() => {
      this._checkUrlChange();
    }, interval);
  }

  /**
   * Vérifie si l'URL a changé et déclenche le callback
   */
  _checkUrlChange() {
    const newUrl = window.location.href;
    
    if (newUrl !== this.currentUrl) {
      if (ErrorHandler.debugMode) {
        console.log('[NavigationMonitor] URL changed:', {
          from: this.currentUrl,
          to: newUrl
        });
      }

      this.currentUrl = newUrl;
      
      // Appel du callback avec gestion d'erreur
      ErrorHandler.wrap(() => {
        this.onNavigate(newUrl);
      }, 'NavigationMonitor.onNavigate')();
    }
  }

  /**
   * Force une vérification immédiate
   */
  checkNow() {
    this._checkUrlChange();
  }
}

export default NavigationMonitor;
