/**
 * ValidationManager - Validation des réponses utilisateur
 * Gère les règles de validation et les messages d'erreur
 */
import ErrorHandler from './ErrorHandler.js';

class ValidationManager {
  /**
   * Valide une réponse selon les règles configurées
   * @param {any} answer - Réponse à valider
   * @param {Object} question - Configuration de la question
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(answer, question) {
    try {
      const { type, responseConfig = {}, validation = {} } = question;
      const errors = [];

      // Si pas de règles de validation, considérer comme valide
      if (!validation || Object.keys(validation).length === 0) {
        return { valid: true, errors: [] };
      }

      // Validation selon le type de question
      switch (type) {
        case 'textarea':
          this._validateTextarea(answer, validation, errors);
          break;
        
        case 'select':
        case 'dropdown':
          this._validateSelect(answer, validation, errors);
          break;
        
        case 'rating':
        case 'nps':
        case 'scale':
          this._validateNumeric(answer, validation, errors);
          break;
        
        case 'boolean':
          this._validateBoolean(answer, validation, errors);
          break;
        
        default:
          // Validation générique
          this._validateGeneric(answer, validation, errors);
      }

      // Validateur personnalisé (si fourni)
      if (validation.custom && typeof validation.custom === 'function') {
        const customResult = validation.custom(answer);
        if (customResult !== true && typeof customResult === 'string') {
          errors.push(customResult);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      ErrorHandler.log(error, 'ValidationManager.validate');
      // En cas d'erreur de validation, considérer comme valide pour ne pas bloquer l'utilisateur
      return { valid: true, errors: [] };
    }
  }

  /**
   * Valide un champ textarea
   * @private
   */
  static _validateTextarea(answer, validation, errors) {
    if (answer === null || answer === undefined || answer === '') {
      if (validation.required !== false) { // required par défaut
        errors.push(validation.requiredMessage || 'Ce champ est requis');
      }
      return;
    }

    const text = String(answer);
    
    // Longueur minimale
    if (validation.minLength !== undefined && text.length < validation.minLength) {
      errors.push(
        validation.minLengthMessage || 
        `La réponse doit contenir au moins ${validation.minLength} caractères`
      );
    }

    // Longueur maximale
    if (validation.maxLength !== undefined && text.length > validation.maxLength) {
      errors.push(
        validation.maxLengthMessage || 
        `La réponse ne doit pas dépasser ${validation.maxLength} caractères`
      );
    }

    // Pattern (regex)
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(text)) {
        errors.push(
          validation.patternMessage || 
          'Le format de la réponse est incorrect'
        );
      }
    }

    // Mots interdits
    if (validation.forbiddenWords && Array.isArray(validation.forbiddenWords)) {
      const lowerText = text.toLowerCase();
      const foundForbidden = validation.forbiddenWords.filter(word => 
        lowerText.includes(word.toLowerCase())
      );
      
      if (foundForbidden.length > 0) {
        errors.push(
          validation.forbiddenWordsMessage || 
          `Votre réponse contient des mots non autorisés : ${foundForbidden.join(', ')}`
        );
      }
    }
  }

  /**
   * Valide un champ select/dropdown
   * @private
   */
  static _validateSelect(answer, validation, errors) {
    if (answer === null || answer === undefined || answer === '') {
      if (validation.required !== false) {
        errors.push(validation.requiredMessage || 'Veuillez sélectionner une option');
      }
      return;
    }

    // Valeurs interdites
    if (validation.forbiddenValues && Array.isArray(validation.forbiddenValues)) {
      if (validation.forbiddenValues.includes(answer)) {
        errors.push(
          validation.forbiddenValuesMessage || 
          'Cette option n\'est pas autorisée'
        );
      }
    }
  }

  /**
   * Valide un champ numérique (rating, nps, scale)
   * @private
   */
  static _validateNumeric(answer, validation, errors) {
    if (answer === null || answer === undefined) {
      if (validation.required !== false) {
        errors.push(validation.requiredMessage || 'Veuillez sélectionner une valeur');
      }
      return;
    }

    const num = Number(answer);

    // Valeur minimale
    if (validation.min !== undefined && num < validation.min) {
      errors.push(
        validation.minMessage || 
        `La valeur minimale est ${validation.min}`
      );
    }

    // Valeur maximale
    if (validation.max !== undefined && num > validation.max) {
      errors.push(
        validation.maxMessage || 
        `La valeur maximale est ${validation.max}`
      );
    }

    // Valeurs interdites
    if (validation.forbiddenValues && Array.isArray(validation.forbiddenValues)) {
      if (validation.forbiddenValues.includes(num)) {
        errors.push(
          validation.forbiddenValuesMessage || 
          'Cette valeur n\'est pas autorisée'
        );
      }
    }
  }

  /**
   * Valide un champ boolean
   * @private
   */
  static _validateBoolean(answer, validation, errors) {
    if (answer === null || answer === undefined) {
      if (validation.required !== false) {
        errors.push(validation.requiredMessage || 'Veuillez faire un choix');
      }
      return;
    }

    // Valeur forcée (ex: forcer "Oui" pour un consentement)
    if (validation.mustBeTrue && answer !== true) {
      errors.push(
        validation.mustBeTrueMessage || 
        'Vous devez accepter pour continuer'
      );
    }

    if (validation.mustBeFalse && answer !== false) {
      errors.push(
        validation.mustBeFalseMessage || 
        'Vous devez refuser pour continuer'
      );
    }
  }

  /**
   * Validation générique
   * @private
   */
  static _validateGeneric(answer, validation, errors) {
    if (answer === null || answer === undefined || answer === '') {
      if (validation.required !== false) {
        errors.push(validation.requiredMessage || 'Ce champ est requis');
      }
    }
  }

  /**
   * Valide en temps réel (pour affichage d'erreurs pendant la saisie)
   * Retourne seulement les erreurs "en cours de saisie" (pas les erreurs de champ vide)
   * @param {any} answer - Réponse à valider
   * @param {Object} question - Configuration de la question
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateLive(answer, question) {
    try {
      const { type, validation = {} } = question;
      const errors = [];

      // Ne pas valider les champs vides en temps réel (attendre le submit)
      if (answer === null || answer === undefined || answer === '') {
        return { valid: true, errors: [] };
      }

      switch (type) {
        case 'textarea':
          const text = String(answer);
          
          // Longueur maximale
          if (validation.maxLength !== undefined && text.length > validation.maxLength) {
            errors.push(
              validation.maxLengthMessage || 
              `La réponse ne doit pas dépasser ${validation.maxLength} caractères`
            );
          }

          // Pattern
          if (validation.pattern) {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(text)) {
              errors.push(
                validation.patternMessage || 
                'Le format de la réponse est incorrect'
              );
            }
          }

          // Mots interdits
          if (validation.forbiddenWords && Array.isArray(validation.forbiddenWords)) {
            const lowerText = text.toLowerCase();
            const foundForbidden = validation.forbiddenWords.filter(word => 
              lowerText.includes(word.toLowerCase())
            );
            
            if (foundForbidden.length > 0) {
              errors.push(
                validation.forbiddenWordsMessage || 
                `Mots non autorisés : ${foundForbidden.join(', ')}`
              );
            }
          }
          break;
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      ErrorHandler.log(error, 'ValidationManager.validateLive');
      return { valid: true, errors: [] };
    }
  }
}

export default ValidationManager;
