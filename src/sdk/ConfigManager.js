/**
 * ConfigManager - Gestion de la configuration des campagnes
 * Récupère et cache la configuration depuis l'API
 */
import ErrorHandler from './ErrorHandler.js';

class ConfigManager {
  constructor(domain, language, specificId, storageManager) {
    this.domain = domain;
    this.language = language;
    this.specificId = specificId;
    this.storageManager = storageManager;
    
    // URL de l'API
    this.apiBaseUrl = `https://api.${domain}/feedback`;
  }

  /**
   * Récupère la configuration complète (avec cache intelligent)
   * @param {boolean} forceRefresh - Si true, ignore le cache et force un fetch
   * @returns {Promise<Object>} - Configuration complète { campaigns, consent, cacheTTL }
   */
  async fetchConfig(forceRefresh = false) {
    try {
      // Vérifier le cache (sauf si forceRefresh)
      if (!forceRefresh) {
        const cachedConfig = this.storageManager.getCachedConfig();
        const cacheTTL = cachedConfig?.cacheTTL || (24 * 60 * 60 * 1000); // 24h par défaut

        if (cachedConfig && this.storageManager.isCacheValid(cacheTTL)) {
          if (ErrorHandler.debugMode) {
            console.log('[ConfigManager] Using cached config');
          }
          return cachedConfig;
        }
      } else {
        if (ErrorHandler.debugMode) {
          console.log('[ConfigManager] Force refresh requested, ignoring cache');
        }
      }

      // Sinon, fetch depuis l'API
      if (ErrorHandler.debugMode) {
        console.log('[ConfigManager] Fetching config from API');
      }

      const config = await this._fetchFromAPI(forceRefresh);
      
      if (config) {
        // Valider et stocker en cache
        this.storageManager.setCachedConfig(config);
        return config;
      }

      // Fallback sur le cache même expiré si le fetch échoue
      const cachedConfig = this.storageManager.getCachedConfig();
      if (cachedConfig) {
        if (ErrorHandler.debugMode) {
          console.log('[ConfigManager] Using expired cache as fallback');
        }
        return cachedConfig;
      }

      return { campaigns: [], consent: null };

    } catch (error) {
      ErrorHandler.log(error, 'ConfigManager.fetchConfig');
      
      // Fallback sur le cache en cas d'erreur
      const cachedConfig = this.storageManager.getCachedConfig();
      return cachedConfig || { campaigns: [], consent: null };
    }
  }

  /**
   * Récupère les campagnes (avec cache intelligent)
   * Méthode de compatibilité qui retourne uniquement les campagnes
   * @param {boolean} forceRefresh - Si true, ignore le cache et force un fetch
   * @returns {Promise<Array>} - Liste des campagnes
   */
  async fetchCampaigns(forceRefresh = false) {
    const config = await this.fetchConfig(forceRefresh);
    return config.campaigns || [];
  }

  /**
   * Effectue la requête HTTP vers l'API
   * @param {boolean} forceRefresh - Si true, n'envoie pas le header de cache
   * @returns {Promise<Object|null>}
   * @private
   */
  async _fetchFromAPI(forceRefresh = false) {
    try {
      const url = this._buildApiUrl();
      const headers = this._buildHeaders(forceRefresh);

      if (ErrorHandler.debugMode) {
        console.log('[ConfigManager] Fetching:', { url, headers });
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        cache: 'no-cache'
      });

      // HTTP 304 : pas de changement
      if (response.status === 304) {
        if (ErrorHandler.debugMode) {
          console.log('[ConfigManager] Config not modified (304)');
        }
        const cachedConfig = this.storageManager.getCachedConfig();
        return cachedConfig;
      }

      // HTTP 200 : nouvelle config
      if (response.ok) {
        const config = await response.json();
        
        if (ErrorHandler.debugMode) {
          console.log('[ConfigManager] Config fetched successfully:', {
            campaignsCount: config.campaigns?.length || 0
          });
        }

        return config;
      }

      // Autres codes HTTP
      console.warn('[ConfigManager] API responded with status:', response.status);
      return null;

    } catch (error) {
      ErrorHandler.log(error, 'ConfigManager._fetchFromAPI');
      return null;
    }
  }

  /**
   * Construit l'URL de l'API
   * @returns {string}
   * @private
   */
  _buildApiUrl() {
    let url = `${this.apiBaseUrl}/config?lang=${this.language}`;
    
    if (this.specificId) {
      url += `&id=${this.specificId}`;
    }
    
    return url;
  }

  /**
   * Construit les headers HTTP (avec support 304)
   * @param {boolean} forceRefresh - Si true, n'inclut pas le header de cache
   * @returns {Object}
   * @private
   */
  _buildHeaders(forceRefresh = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Ajouter le header pour la validation HTTP 304 (sauf si forceRefresh)
    if (!forceRefresh) {
      const lastFetchDate = this.storageManager.getLastFetchDate();
      if (lastFetchDate) {
        headers['X-Last-Fetch-Date'] = lastFetchDate.toString();
      }
    }

    return headers;
  }
}

export default ConfigManager;