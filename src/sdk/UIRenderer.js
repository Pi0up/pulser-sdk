/**
 * UIRenderer - Rendu de l'interface utilisateur avec Shadow DOM
 * Utilise Container Queries pour la responsivité
 */
import ErrorHandler from './ErrorHandler.js';
import ValidationManager from './ValidationManager.js';

class UIRenderer {
  constructor(onSubmit, onDismiss, position = 'bottom-right') {
    this.shadowHost = null;
    this.shadowRoot = null;
    this.isVisible = false;
    this.currentQuestion = null;
    this.position = position;
    
    // Callbacks
    this.onSubmit = onSubmit;
    this.onDismiss = onDismiss;
  }

  /**
   * Crée le conteneur Shadow DOM
   */
  createShadowContainer() {
    if (this.shadowHost) return; // Déjà créé

    try {
      // IMPORTANT : Vérifier et supprimer tout pulser-sdk-host existant dans le DOM
      // Cela garantit qu'il n'y a toujours qu'un seul host dans le DOM (comportement singleton)
      const existingHost = document.getElementById('pulser-sdk-host');
      if (existingHost) {
        existingHost.parentNode.removeChild(existingHost);
        if (ErrorHandler.debugMode) {
          console.log('[UIRenderer] Removed existing pulser-sdk-host from DOM (ensuring singleton)');
        }
      }

      // Créer l'élément hôte
      this.shadowHost = document.createElement('div');
      this.shadowHost.id = 'pulser-sdk-host';
      this.shadowHost.setAttribute('data-pulser-sdk', 'true');
      
      // Attacher le Shadow DOM
      this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });
      
      // Injecter les styles
      const styleSheet = document.createElement('style');
      styleSheet.textContent = this._getStyles();
      this.shadowRoot.appendChild(styleSheet);
      
      // Créer le conteneur principal (caché par défaut)
      const container = document.createElement('div');
      container.id = 'feedback-container';
      container.className = 'feedback-hidden';
      this.shadowRoot.appendChild(container);
      
      // Ajouter au DOM
      document.body.appendChild(this.shadowHost);

      if (ErrorHandler.debugMode) {
        console.log('[UIRenderer] Shadow DOM created');
      }

    } catch (error) {
      ErrorHandler.log(error, 'UIRenderer.createShadowContainer');
    }
  }

  /**
   * Rend une question dans le widget
   * @param {Object} question - Question à afficher
   * @param {Object} campaign - Campagne associée (optionnel)
   */
  renderQuestion(question, campaign = null) {
    if (!this.shadowRoot) {
      this.createShadowContainer();
    }

    try {
      this.currentQuestion = question;
      this.currentCampaign = campaign;
      const container = this.shadowRoot.getElementById('feedback-container');
      
      if (!container) return;

      container.innerHTML = this._generateQuestionHTML(question);
      this._attachEventListeners();

      if (ErrorHandler.debugMode) {
        console.log('[UIRenderer] Question rendered:', question.id);
      }

    } catch (error) {
      ErrorHandler.log(error, 'UIRenderer.renderQuestion');
    }
  }

  /**
   * Rend l'écran de consentement RGPD
   * @param {Object} consentConfig - Configuration du consentement
   * @param {Function} onConsent - Callback appelé avec true/false selon la réponse
   */
  renderConsent(consentConfig, onConsent) {
    if (!this.shadowRoot) {
      this.createShadowContainer();
    }

    try {
      const container = this.shadowRoot.getElementById('feedback-container');
      if (!container) return;

      container.innerHTML = this._generateConsentHTML(consentConfig);
      this._attachConsentEventListeners(onConsent);

      if (ErrorHandler.debugMode) {
        console.log('[UIRenderer] Consent screen rendered');
      }

    } catch (error) {
      ErrorHandler.log(error, 'UIRenderer.renderConsent');
    }
  }

  /**
   * Affiche le widget
   */
  show() {
    if (!this.shadowRoot) return;

    try {
      const container = this.shadowRoot.getElementById('feedback-container');
      if (container) {
        container.classList.remove('feedback-hidden');
        container.classList.add('feedback-visible');
        this.isVisible = true;

        if (ErrorHandler.debugMode) {
          console.log('[UIRenderer] Widget shown');
        }
      }
    } catch (error) {
      ErrorHandler.log(error, 'UIRenderer.show');
    }
  }

  /**
   * Cache le widget
   */
  hide() {
    if (!this.shadowRoot) return;

    try {
      const container = this.shadowRoot.getElementById('feedback-container');
      if (container) {
        container.classList.remove('feedback-visible');
        container.classList.add('feedback-hidden');
        this.isVisible = false;

        if (ErrorHandler.debugMode) {
          console.log('[UIRenderer] Widget hidden');
        }
      }
    } catch (error) {
      ErrorHandler.log(error, 'UIRenderer.hide');
    }
  }

  /**
   * Détruit le widget
   */
  destroy() {
    if (this.shadowHost && this.shadowHost.parentNode) {
      this.shadowHost.parentNode.removeChild(this.shadowHost);
      this.shadowHost = null;
      this.shadowRoot = null;
      this.isVisible = false;

      if (ErrorHandler.debugMode) {
        console.log('[UIRenderer] Widget destroyed');
      }
    }
  }

  /**
   * Génère le HTML de la question
   * @param {Object} question - Question
   * @returns {string}
   */
  _generateQuestionHTML(question) {
    // Déterminer si on doit masquer le bouton d'envoi (auto-submit)
    const shouldAutoSubmit = this._shouldAutoSubmit(question);
    
    return `
      <div class="feedback-widget">
        <div class="feedback-header">
          <h3 class="feedback-title">${this._escapeHtml(question.title)}</h3>
          <button type="button" id="feedback-close" class="feedback-close" aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        ${question.assistiveText ? `
          <p class="feedback-assistive">${this._escapeHtml(question.assistiveText)}</p>
        ` : ''}
        
        <form id="feedback-form" class="feedback-form">
          ${this._generateInputField(question)}
          ${shouldAutoSubmit ? '' : '<button type="submit" class="feedback-submit">Envoyer</button>'}
        </form>
      </div>
    `;
  }

  /**
   * Génère le champ de saisie selon le type
   * @param {Object} question - Question
   * @returns {string}
   */
  _generateInputField(question) {
    const { type, responseConfig = {} } = question;

    switch (type) {
      case 'textarea':
        return this._renderTextarea(responseConfig);
      
      case 'rating':
        return this._renderRating(responseConfig);
      
      case 'boolean':
        return this._renderBoolean(responseConfig);
      
      case 'nps':
        return this._renderNPS(responseConfig);
      
      case 'scale':
        return this._renderScale(responseConfig);
      
      case 'select':
      case 'dropdown':
        return this._renderSelect(responseConfig);
      
      default:
        return this._renderTextarea(responseConfig);
    }
  }

  /**
   * Rend un champ textarea
   * @param {Object} config - Configuration
   * @returns {string}
   */
  _renderTextarea(config) {
    const maxChars = config.maxChars || 500;
    const placeholder = config.placeholder || 'Votre réponse...';
    
    return `
      <textarea 
        name="answer" 
        class="feedback-textarea" 
        maxlength="${maxChars}"
        placeholder="${this._escapeHtml(placeholder)}"
        required
      ></textarea>
      <div class="feedback-char-count">
        <span class="char-current">0</span> / ${maxChars}
      </div>
    `;
  }

  /**
   * Rend un système de rating (étoiles)
   * @param {Object} config - Configuration
   * @returns {string}
   */
  _renderRating(config) {
    const max = config.max || 5;
    const labels = config.labels || {};
    
    let html = '<div class="feedback-rating">';
    
    for (let i = 1; i <= max; i++) {
      html += `
        <label class="feedback-rating-item">
          <input type="radio" name="rating" value="${i}" required>
          <span class="feedback-star">★</span>
          ${labels[i] ? `<span class="feedback-rating-label">${this._escapeHtml(labels[i])}</span>` : ''}
        </label>
      `;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Rend un choix boolean (Oui/Non)
   * @param {Object} config - Configuration
   * @returns {string}
   */
  _renderBoolean(config) {
    const yesLabel = config.yesLabel || 'Oui';
    const noLabel = config.noLabel || 'Non';
    
    return `
      <div class="feedback-boolean">
        <label class="feedback-boolean-item">
          <input type="radio" name="boolean" value="true" required>
          <span class="feedback-boolean-label">${this._escapeHtml(yesLabel)}</span>
        </label>
        <label class="feedback-boolean-item">
          <input type="radio" name="boolean" value="false" required>
          <span class="feedback-boolean-label">${this._escapeHtml(noLabel)}</span>
        </label>
      </div>
    `;
  }

  /**
   * Rend un NPS (0-10)
   * @param {Object} config - Configuration
   * @returns {string}
   */
  _renderNPS(config) {
    const minLabel = config.minLabel || 'Pas du tout probable';
    const maxLabel = config.maxLabel || 'Très probable';
    
    let html = '<div class="feedback-nps">';
    html += `<div class="feedback-nps-labels">
      <span>${this._escapeHtml(minLabel)}</span>
      <span>${this._escapeHtml(maxLabel)}</span>
    </div>`;
    html += '<div class="feedback-nps-scale">';
    
    for (let i = 0; i <= 10; i++) {
      html += `
        <label class="feedback-nps-item">
          <input type="radio" name="nps" value="${i}" required>
          <span class="feedback-nps-number">${i}</span>
        </label>
      `;
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Rend une échelle personnalisée
   * @param {Object} config - Configuration
   * @returns {string}
   */
  _renderScale(config) {
    const min = config.min || 1;
    const max = config.max || 10;
    
    let html = '<div class="feedback-scale">';
    
    for (let i = min; i <= max; i++) {
      html += `
        <label class="feedback-scale-item">
          <input type="radio" name="scale" value="${i}" required>
          <span class="feedback-scale-number">${i}</span>
        </label>
      `;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Rend une liste déroulante (select)
   * @param {Object} config - Configuration
   * @returns {string}
   */
  _renderSelect(config) {
    const options = config.options || [];
    const placeholder = config.placeholder || 'Sélectionnez une option...';
    const allowCustom = config.allowCustom || false;
    
    let html = '<div class="feedback-select-wrapper">';
    html += `
      <select name="select" class="feedback-select" required>
        <option value="" disabled selected>${this._escapeHtml(placeholder)}</option>
    `;
    
    options.forEach(option => {
      const value = typeof option === 'string' ? option : option.value;
      const label = typeof option === 'string' ? option : option.label || option.value;
      html += `<option value="${this._escapeHtml(value)}">${this._escapeHtml(label)}</option>`;
    });
    
    // Option "Autre" si allowCustom est activé
    if (allowCustom) {
      html += `<option value="__custom__">Autre...</option>`;
    }
    
    html += '</select>';
    
    // Champ texte pour réponse personnalisée (caché par défaut)
    if (allowCustom) {
      html += `
        <input 
          type="text" 
          name="customAnswer" 
          class="feedback-custom-input feedback-custom-hidden" 
          placeholder="Votre réponse..."
          maxlength="200"
        />
      `;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Attache les événements sur le formulaire
   */
  _attachEventListeners() {
    const form = this.shadowRoot.getElementById('feedback-form');
    const closeBtn = this.shadowRoot.getElementById('feedback-close');

    // Submit du formulaire
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._submitAnswer();
      });
    }

    // Fermeture manuelle
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        ErrorHandler.wrap(() => {
          this.onDismiss(this.currentQuestion.id);
        }, 'UIRenderer.onDismiss')();
        this.hide();
      });
    }

    // Compteur de caractères pour textarea + validation en temps réel
    const textarea = this.shadowRoot.querySelector('textarea');
    if (textarea) {
      const charCurrent = this.shadowRoot.querySelector('.char-current');
      textarea.addEventListener('input', () => {
        if (charCurrent) {
          charCurrent.textContent = textarea.value.length;
        }
        
        // Validation en temps réel
        if (this.currentQuestion.validation) {
          const answer = textarea.value.trim();
          const validationResult = ValidationManager.validateLive(answer, this.currentQuestion);
          
          if (!validationResult.valid) {
            this._showValidationErrors(validationResult.errors);
          } else {
            this._clearValidationErrors();
          }
        }
      });
    }

    // Gestion du select avec option "Autre"
    const select = this.shadowRoot.querySelector('select[name="select"]');
    const customInput = this.shadowRoot.querySelector('input[name="customAnswer"]');
    if (select && customInput) {
      select.addEventListener('change', () => {
        if (select.value === '__custom__') {
          customInput.classList.remove('feedback-custom-hidden');
          customInput.required = true;
          customInput.focus();
        } else {
          customInput.classList.add('feedback-custom-hidden');
          customInput.required = false;
          customInput.value = '';
        }
      });
    }

    // Auto-submit pour les types de questions appropriés
    if (this._shouldAutoSubmit(this.currentQuestion)) {
      this._attachAutoSubmitListeners();
    }

    // Effet hover sur rating
    this._attachRatingHoverEffect();
  }

  /**
   * Effet visuel au hover sur les étoiles
   */
  _attachRatingHoverEffect() {
    const ratingInputs = this.shadowRoot.querySelectorAll('.feedback-rating-item input');
    const ratingStars = this.shadowRoot.querySelectorAll('.feedback-star');
    
    ratingInputs.forEach((input, index) => {
      input.addEventListener('mouseenter', () => {
        ratingStars.forEach((star, i) => {
          if (i <= index) {
            star.classList.add('hovered');
          } else {
            star.classList.remove('hovered');
          }
        });
      });

      input.addEventListener('change', () => {
        ratingStars.forEach((star, i) => {
          if (i <= index) {
            star.classList.add('selected');
          } else {
            star.classList.remove('selected');
          }
        });
      });
    });

    const ratingContainer = this.shadowRoot.querySelector('.feedback-rating');
    if (ratingContainer) {
      ratingContainer.addEventListener('mouseleave', () => {
        ratingStars.forEach(star => star.classList.remove('hovered'));
      });
    }
  }

  /**
   * Extrait la réponse du formulaire
   * @returns {any}
   */
  _extractAnswer() {
    const type = this.currentQuestion.type;
    
    switch (type) {
      case 'textarea':
        const textarea = this.shadowRoot.querySelector('textarea');
        return textarea ? textarea.value.trim() : null;
      
      case 'rating':
        const rating = this.shadowRoot.querySelector('input[name="rating"]:checked');
        return rating ? parseInt(rating.value, 10) : null;
      
      case 'boolean':
        const bool = this.shadowRoot.querySelector('input[name="boolean"]:checked');
        return bool ? bool.value === 'true' : null;
      
      case 'nps':
        const nps = this.shadowRoot.querySelector('input[name="nps"]:checked');
        return nps ? parseInt(nps.value, 10) : null;
      
      case 'scale':
        const scale = this.shadowRoot.querySelector('input[name="scale"]:checked');
        return scale ? parseInt(scale.value, 10) : null;
      
      case 'select':
      case 'dropdown':
        const select = this.shadowRoot.querySelector('select[name="select"]');
        if (!select) return null;
        
        // Si l'option "Autre" est sélectionnée, retourner la réponse personnalisée
        if (select.value === '__custom__') {
          const customInput = this.shadowRoot.querySelector('input[name="customAnswer"]');
          return customInput ? customInput.value.trim() : null;
        }
        
        return select.value || null;
      
      default:
        return null;
    }
  }

  /**
   * Détermine si la question doit utiliser l'auto-submit
   * @param {Object} question - Question
   * @returns {boolean}
   */
  _shouldAutoSubmit(question) {
    const { type, responseConfig = {} } = question;
    
    // Si la config force explicitement le bouton, on désactive l'auto-submit
    if (responseConfig.requireSubmitButton === true) {
      return false;
    }
    
    // Par défaut, auto-submit pour NPS, rating, boolean et scale
    // Select/dropdown nécessite toujours un bouton
    return ['nps', 'rating', 'boolean', 'scale'].includes(type);
  }

  /**
   * Attache les listeners pour l'auto-submit
   */
  _attachAutoSubmitListeners() {
    const inputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
    
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        // Petit délai pour permettre l'animation visuelle
        setTimeout(() => {
          this._submitAnswer();
        }, 300);
      });
    });

    if (ErrorHandler.debugMode) {
      console.log('[UIRenderer] Auto-submit listeners attached');
    }
  }

  /**
   * Soumet la réponse (factorisation du code de submit)
   */
  _submitAnswer() {
    const answer = this._extractAnswer();
    
    if (answer !== null) {
      // Valider la réponse avant soumission
      const validationResult = ValidationManager.validate(answer, this.currentQuestion);
      
      if (!validationResult.valid) {
        // Afficher les erreurs de validation
        this._showValidationErrors(validationResult.errors);
        
        if (ErrorHandler.debugMode) {
          console.warn('[UIRenderer] Validation failed:', validationResult.errors);
        }
        return;
      }

      // Nettoyer les erreurs précédentes
      this._clearValidationErrors();

      ErrorHandler.wrap(() => {
        this.onSubmit(this.currentQuestion.id, answer);
      }, 'UIRenderer.onSubmit')();
      
      // Afficher le message de remerciement si configuré
      this._showThankYouMessage();
    }
  }

  /**
   * Affiche le message de remerciement si configuré
   */
  _showThankYouMessage() {
    const thankYouConfig = this.currentQuestion.thankYouMessage || this.currentCampaign?.thankYouMessage;
    
    if (!thankYouConfig || !thankYouConfig.enabled) {
      this.hide();
      return;
    }

    // Gérer les tableaux de messages (choix aléatoire)
    let messageText = thankYouConfig.text || 'Merci pour votre réponse !';
    const isArray = Array.isArray(messageText);
    if (isArray) {
      if (messageText.length === 0) {
        messageText = 'Merci pour votre réponse !';
      } else {
        const randomIndex = Math.floor(Math.random() * messageText.length);
        messageText = messageText[randomIndex];
        
        if (ErrorHandler.debugMode) {
          console.log('[UIRenderer] Random message selected from array:', { 
            index: randomIndex, 
            totalMessages: thankYouConfig.text.length,
            selectedMessage: messageText 
          });
        }
      }
    }

    const message = messageText;
    const duration = thankYouConfig.duration || 2000;

    // Remplacer le contenu du widget par le message de remerciement
    const widget = this.shadowRoot.querySelector('.feedback-widget');
    if (widget) {
      widget.innerHTML = `
        <div class="feedback-thankyou">
          <div class="feedback-thankyou-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="#10b981" opacity="0.1"/>
              <path d="M14 24l8 8 16-16" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="feedback-thankyou-message">${this._escapeHtml(message)}</p>
        </div>
      `;
    }

    // Auto-fermer après la durée configurée
    setTimeout(() => {
      this.hide();
    }, duration);

    if (ErrorHandler.debugMode) {
      console.log('[UIRenderer] Thank you message displayed:', { message, duration, wasArray: isArray });
    }
  }

  /**
   * Affiche les erreurs de validation
   * @param {string[]} errors - Liste des messages d'erreur
   */
  _showValidationErrors(errors) {
    if (!errors || errors.length === 0) return;

    // Nettoyer les erreurs précédentes
    this._clearValidationErrors();

    // Créer le conteneur d'erreurs
    const form = this.shadowRoot.getElementById('feedback-form');
    if (!form) return;

    const errorContainer = document.createElement('div');
    errorContainer.className = 'feedback-validation-errors';
    errorContainer.innerHTML = errors.map(error => `
      <div class="feedback-validation-error">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#ef4444" stroke-width="1.5"/>
          <path d="M8 4v5M8 11h.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>${this._escapeHtml(error)}</span>
      </div>
    `).join('');

    // Insérer au début du formulaire
    form.insertBefore(errorContainer, form.firstChild);

    if (ErrorHandler.debugMode) {
      console.log('[UIRenderer] Validation errors displayed:', errors);
    }
  }

  /**
   * Efface les erreurs de validation
   */
  _clearValidationErrors() {
    const errorContainer = this.shadowRoot.querySelector('.feedback-validation-errors');
    if (errorContainer) {
      errorContainer.remove();
    }
  }

  /**
   * Génère le HTML de l'écran de consentement
   * @param {Object} config - Configuration du consentement
   * @returns {string}
   */
  _generateConsentHTML(config) {
    return `
      <div class="feedback-widget feedback-consent-widget">
        <div class="feedback-header">
          <h3 class="feedback-title">${this._escapeHtml(config.title)}</h3>
          <button type="button" id="feedback-close" class="feedback-close" aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="feedback-consent-content">
          <p class="feedback-consent-description">${this._escapeHtml(config.description)}</p>
          
          ${config.learnMoreUrl ? `
            <a href="${this._escapeHtml(config.learnMoreUrl)}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="feedback-consent-learn-more">
              ${this._escapeHtml(config.learnMoreText)}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 9L9 3M9 3H4M9 3v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          ` : ''}
          
          <div class="feedback-consent-data-info">
            <div class="feedback-consent-data-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#6b7280" stroke-width="1.5"/>
                <path d="M10 7v5M10 13h.01" stroke="#6b7280" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="feedback-consent-data-text">${this._escapeHtml(config.dataCollectionInfo)}</p>
          </div>
          
          ${config.privacyPolicyUrl ? `
            <a href="${this._escapeHtml(config.privacyPolicyUrl)}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="feedback-consent-privacy-link">
              Politique de confidentialité
            </a>
          ` : ''}
        </div>
        
        <div class="feedback-consent-actions">
          <button type="button" id="feedback-consent-accept" class="feedback-consent-button feedback-consent-accept">
            ${this._escapeHtml(config.acceptLabel)}
          </button>
          <button type="button" id="feedback-consent-decline" class="feedback-consent-button feedback-consent-decline">
            ${this._escapeHtml(config.declineLabel)}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attache les écouteurs d'événements pour l'écran de consentement
   * @param {Function} onConsent - Callback appelé avec true/false
   */
  _attachConsentEventListeners(onConsent) {
    // Bouton fermer
    const closeButton = this.shadowRoot.getElementById('feedback-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
        if (this.onDismiss) {
          this.onDismiss('consent_dismissed');
        }
      });
    }

    // Bouton accepter
    const acceptButton = this.shadowRoot.getElementById('feedback-consent-accept');
    if (acceptButton) {
      acceptButton.addEventListener('click', () => {
        if (ErrorHandler.debugMode) {
          console.log('[UIRenderer] Consent accepted');
        }
        onConsent(true);
      });
    }

    // Bouton refuser
    const declineButton = this.shadowRoot.getElementById('feedback-consent-decline');
    if (declineButton) {
      declineButton.addEventListener('click', () => {
        if (ErrorHandler.debugMode) {
          console.log('[UIRenderer] Consent declined');
        }
        onConsent(false);
      });
    }
  }

  /**
   * Échappe le HTML pour éviter XSS
   * @param {string} text - Texte à échapper
   * @returns {string}
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Retourne la configuration CSS selon la position
   */
  _getPositionConfig() {
    const pos = this.position || 'bottom-right';
    const margin = '20px';
    
    const configs = {
      // BOTTOM-RIGHT : Point de référence = coin bas-droit
      'bottom-right': {
        css: `bottom: ${margin}; right: ${margin};`,
        hidden: 'translateY(20px) scale(0.95)',
        visible: 'translateY(0) scale(1)'
      },
      // BOTTOM-LEFT : Point de référence = coin bas-gauche
      'bottom-left': {
        css: `bottom: ${margin}; left: ${margin};`,
        hidden: 'translateY(20px) scale(0.95)',
        visible: 'translateY(0) scale(1)'
      },
      // TOP-RIGHT : Point de référence = coin haut-droit
      'top-right': {
        css: `top: ${margin}; right: ${margin};`,
        hidden: 'translateY(-20px) scale(0.95)',
        visible: 'translateY(0) scale(1)'
      },
      // TOP-LEFT : Point de référence = coin haut-gauche
      'top-left': {
        css: `top: ${margin}; left: ${margin};`,
        hidden: 'translateY(-20px) scale(0.95)',
        visible: 'translateY(0) scale(1)'
      },
      // TOP-CENTER : Point de référence = centre-haut
      'top-center': {
        css: `top: ${margin}; left: 50%;`,
        hidden: 'translate(-50%, -20px) scale(0.95)',
        visible: 'translate(-50%, 0) scale(1)'
      },
      // BOTTOM-CENTER : Point de référence = centre-bas
      'bottom-center': {
        css: `bottom: ${margin}; left: 50%;`,
        hidden: 'translate(-50%, 20px) scale(0.95)',
        visible: 'translate(-50%, 0) scale(1)'
      },
      // MIDDLE-RIGHT : Point de référence = centre-droit
      'middle-right': {
        css: `top: 50%; right: ${margin};`,
        hidden: 'translate(20px, -50%) scale(0.95)',
        visible: 'translate(0, -50%) scale(1)'
      },
      // MIDDLE-LEFT : Point de référence = centre-gauche
      'middle-left': {
        css: `top: 50%; left: ${margin};`,
        hidden: 'translate(-20px, -50%) scale(0.95)',
        visible: 'translate(0, -50%) scale(1)'
      },
      // CENTER : Point de référence = centre absolu
      'center': {
        css: `top: 50%; left: 50%;`,
        hidden: 'translate(-50%, -50%) scale(0.95)',
        visible: 'translate(-50%, -50%) scale(1)'
      }
    };

    return configs[pos] || configs['bottom-right'];
  }

  /**
   * Retourne les styles CSS avec Container Queries
   * @returns {string}
   */
  _getStyles() {
    const posConfig = this._getPositionConfig();

    return `
      /* Reset */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* Container */
      #feedback-container {
        position: fixed;
        ${posConfig.css}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        transition: opacity 0.3s ease, transform 0.3s ease;
        width: auto;
        max-width: 100vw;
      }

      #feedback-container.feedback-hidden {
        opacity: 0;
        transform: ${posConfig.hidden};
        pointer-events: none;
      }

      #feedback-container.feedback-visible {
        opacity: 1;
        transform: ${posConfig.visible};
      }

      /* Widget Principal */
      .feedback-widget {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        padding: 20px;
        width: 380px;
        max-width: 380px;
        min-width: 280px;
      }

      /* MOBILE RESPONSIVE - Force fullwidth en bas sur mobile */
      @media (max-width: 768px) {
        #feedback-container {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: auto !important;
          transform: none !important;
          padding: 0 12px 12px 12px;
        }

        #feedback-container.feedback-hidden {
          transform: translateY(100%) !important;
          opacity: 0;
        }

        #feedback-container.feedback-visible {
          transform: translateY(0) !important;
          opacity: 1;
        }

        .feedback-widget {
          width: 100%;
          max-width: 100%;
          min-width: 100%;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
        }
      }

      /* TABLET - Réduction progressive */
      @media (max-width: 1024px) and (min-width: 769px) {
        .feedback-widget {
          width: 340px;
          max-width: 340px;
        }
      }

      /* DESKTOP - Assurer que le container sur les positions centrées prend la bonne largeur */
      @media (min-width: 769px) {
        #feedback-container {
          width: max-content;
        }
      }

      /* Header */
      .feedback-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .feedback-title {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        line-height: 1.4;
        margin: 0;
        padding-right: 8px;
      }

      .feedback-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #666;
        transition: color 0.2s;
        flex-shrink: 0;
      }

      .feedback-close:hover {
        color: #000;
      }

      .feedback-assistive {
        font-size: 14px;
        color: #666;
        margin-bottom: 16px;
        line-height: 1.5;
      }

      /* Form */
      .feedback-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Textarea */
      .feedback-textarea {
        width: 100%;
        min-height: 80px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.2s;
      }

      .feedback-textarea:focus {
        outline: none;
        border-color: #0066ff;
      }

      .feedback-char-count {
        font-size: 12px;
        color: #999;
        text-align: right;
      }

      /* Rating (Étoiles) */
      .feedback-rating {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      .feedback-rating-item {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .feedback-rating-item input {
        position: absolute;
        opacity: 0;
      }

      .feedback-star {
        font-size: 32px;
        color: #ddd;
        transition: color 0.2s;
      }

      .feedback-star.hovered,
      .feedback-star.selected {
        color: #ffc107;
      }

      .feedback-rating-label {
        font-size: 11px;
        color: #666;
      }

      /* Boolean */
      .feedback-boolean {
        display: flex;
        gap: 12px;
      }

      .feedback-boolean-item {
        flex: 1;
        cursor: pointer;
      }

      .feedback-boolean-item input {
        position: absolute;
        opacity: 0;
      }

      .feedback-boolean-label {
        display: block;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .feedback-boolean-item input:checked + .feedback-boolean-label {
        border-color: #0066ff;
        background: #f0f7ff;
        color: #0066ff;
      }

      /* NPS */
      .feedback-nps {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .feedback-nps-labels {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #666;
      }

      .feedback-nps-scale {
        display: flex;
        gap: 4px;
        justify-content: space-between;
      }

      .feedback-nps-item {
        flex: 1;
        cursor: pointer;
      }

      .feedback-nps-item input {
        position: absolute;
        opacity: 0;
      }

      .feedback-nps-number {
        display: block;
        padding: 8px 4px;
        border: 1px solid #ddd;
        border-radius: 6px;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .feedback-nps-item input:checked + .feedback-nps-number {
        border-color: #0066ff;
        background: #0066ff;
        color: white;
      }

      /* Scale */
      .feedback-scale {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .feedback-scale-item {
        cursor: pointer;
      }

      .feedback-scale-item input {
        position: absolute;
        opacity: 0;
      }

      .feedback-scale-number {
        display: block;
        width: 40px;
        height: 40px;
        line-height: 40px;
        border: 1px solid #ddd;
        border-radius: 6px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .feedback-scale-item input:checked + .feedback-scale-number {
        border-color: #0066ff;
        background: #0066ff;
        color: white;
      }

      /* Select / Dropdown */
      .feedback-select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .feedback-select {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-family: inherit;
        font-size: 15px;
        color: #333;
        background-color: white;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .feedback-select:hover {
        border-color: #999;
      }

      .feedback-select:focus {
        outline: 2px solid #0066ff;
        outline-offset: 2px;
        border-color: #0066ff;
      }

      .feedback-select:disabled {
        background: #f5f5f5;
        color: #999;
        cursor: not-allowed;
      }

      .feedback-select option {
        color: #333;
        background-color: white;
        padding: 8px;
      }

      .feedback-custom-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-family: inherit;
        font-size: 15px;
        color: #333;
        background-color: white;
        transition: border-color 0.2s, opacity 0.2s, max-height 0.3s;
      }

      .feedback-custom-input:hover {
        border-color: #999;
      }

      .feedback-custom-input:focus {
        outline: 2px solid #0066ff;
        outline-offset: 2px;
        border-color: #0066ff;
      }

      .feedback-custom-hidden {
        display: none;
      }

      /* Consent Screen */
      .feedback-consent-widget {
        max-width: 450px;
      }

      .feedback-consent-content {
        padding: 0 24px 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .feedback-consent-description {
        font-size: 15px;
        line-height: 1.6;
        color: #374151;
        margin: 0;
      }

      .feedback-consent-learn-more {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #0066ff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.2s;
      }

      .feedback-consent-learn-more:hover {
        color: #0052cc;
        text-decoration: underline;
      }

      .feedback-consent-data-info {
        display: flex;
        gap: 12px;
        padding: 14px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .feedback-consent-data-icon {
        flex-shrink: 0;
      }

      .feedback-consent-data-text {
        font-size: 13px;
        line-height: 1.5;
        color: #6b7280;
        margin: 0;
      }

      .feedback-consent-privacy-link {
        display: inline-block;
        color: #6b7280;
        text-decoration: underline;
        font-size: 13px;
        transition: color 0.2s;
      }

      .feedback-consent-privacy-link:hover {
        color: #374151;
      }

      .feedback-consent-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 24px 24px 24px;
      }

      .feedback-consent-button {
        width: 100%;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .feedback-consent-accept {
        background: #0066ff;
        color: white;
      }

      .feedback-consent-accept:hover {
        background: #0052cc;
      }

      .feedback-consent-decline {
        background: #f3f4f6;
        color: #6b7280;
      }

      .feedback-consent-decline:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .feedback-consent-button:active {
        transform: scale(0.98);
      }

      /* Validation Errors */
      .feedback-validation-errors {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .feedback-validation-error {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        font-size: 13px;
        color: #dc2626;
        line-height: 1.4;
      }

      .feedback-validation-error svg {
        flex-shrink: 0;
        margin-top: 1px;
      }

      .feedback-validation-error span {
        flex: 1;
      }

      /* Submit Button */
      .feedback-submit {
        background: #0066ff;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }

      .feedback-submit:hover {
        background: #0052cc;
      }

      .feedback-submit:active {
        transform: scale(0.98);
      }

      .feedback-submit:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      /* Thank You Message */
      .feedback-thankyou {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 32px 24px;
        min-height: 200px;
      }

      .feedback-thankyou-icon {
        margin-bottom: 16px;
        animation: thankYouScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes thankYouScale {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .feedback-thankyou-message {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin: 0;
        line-height: 1.5;
        animation: thankYouFadeIn 0.4s ease-out 0.2s both;
      }

      @keyframes thankYouFadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Container Queries - Responsive - Pour desktop uniquement */
      @media (min-width: 769px) {
        @container feedback (max-width: 320px) {
          .feedback-widget {
            padding: 16px;
            max-width: 100%;
          }

          .feedback-title {
            font-size: 14px;
          }

          .feedback-star {
            font-size: 24px;
          }

          .feedback-nps-scale {
            gap: 2px;
          }

          .feedback-nps-number {
            font-size: 11px;
            padding: 6px 2px;
          }
        }

        @container feedback (min-width: 400px) {
          .feedback-widget {
            padding: 24px;
          }

          .feedback-title {
            font-size: 18px;
          }
        }
      }

      /* Mobile optimizations - Petits ajustements */
      @media (max-width: 768px) {
        .feedback-star {
          font-size: 28px;
        }

        .feedback-rating {
          gap: 6px;
        }

        .feedback-nps-scale {
          gap: 3px;
        }

        .feedback-nps-number {
          font-size: 12px;
          padding: 6px 2px;
        }

        .feedback-nps-labels {
          font-size: 10px;
        }
      }
    `;
  }
}

export default UIRenderer;