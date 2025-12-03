/**
 * Point d'entrée du SDK Pulser
 * Expose l'instance globale sur window
 */
import PulserSDK from './PulserSDK.js';

// Auto-initialisation : exposition sur window
(function() {
  if (typeof window !== 'undefined') {
    // Créer une instance unique
    const sdkInstance = new PulserSDK();
    
    // Exposer sur window
    window.PulserSDK = sdkInstance;
    
    // Log en mode développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[PulserSDK] SDK loaded and ready. Usage:');
      console.log('  window.PulserSDK.init("your-domain.com", "fr", null, { debug: true })');
    }
  }
})();

// Export pour utilisation en module
export default PulserSDK;
