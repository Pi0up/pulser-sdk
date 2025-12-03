/**
 * DecisionEngine - Moteur de décision pour afficher ou non une campagne
 * Gère la priorité, fréquence, regex URL, et facteur de chance
 */
import ErrorHandler from './ErrorHandler.js';

class DecisionEngine {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Trouve une campagne éligible pour l'URL courante
   * @param {Array} campaigns - Liste des campagnes
   * @param {string} currentUrl - URL actuelle
   * @returns {Object|null} - Campagne éligible avec une question sélectionnée, ou null
   */
  findEligibleCampaign(campaigns, currentUrl) {
    try {
      const now = Date.now();
      
      if (ErrorHandler.debugMode) {
        console.log('[DecisionEngine] Evaluating campaigns:', {
          campaignsCount: campaigns.length,
          currentUrl
        });
      }

      // Filtrer les campagnes actives (dates valides)
      const activeCampaigns = campaigns.filter(campaign => {
        const isActive = now >= campaign.startDate && now <= campaign.endDate;
        
        if (ErrorHandler.debugMode && !isActive) {
          console.log('[DecisionEngine] Campaign not active:', {
            id: campaign.id,
            startDate: new Date(campaign.startDate).toISOString(),
            endDate: new Date(campaign.endDate).toISOString()
          });
        }
        
        return isActive;
      });

      if (activeCampaigns.length === 0) {
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] No active campaigns');
        }
        return null;
      }

      // Filtrer par URL (allowList et blockList au niveau de la campagne)
      const urlEligibleCampaigns = activeCampaigns.filter(campaign => {
        return this._isUrlEligible(campaign, currentUrl);
      });

      if (urlEligibleCampaigns.length === 0) {
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] No campaigns match URL filters');
        }
        return null;
      }

      // Filtrer par fréquence
      const frequencyEligibleCampaigns = urlEligibleCampaigns.filter(campaign => {
        return this.storageManager.canShowCampaign(
          campaign.id,
          campaign.frequencyDays || 0
        );
      });

      if (frequencyEligibleCampaigns.length === 0) {
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] No campaigns pass frequency check');
        }
        return null;
      }

      // Trier par priorité (plus haute = plus importante)
      const sortedCampaigns = frequencyEligibleCampaigns.sort((a, b) => {
        return (b.priority || 0) - (a.priority || 0);
      });

      // Appliquer le facteur de chance sur la campagne la plus prioritaire
      for (const campaign of sortedCampaigns) {
        const luckFactor = campaign.luckFactor !== undefined ? campaign.luckFactor : 1;
        const random = Math.random();
        
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] Testing campaign luck:', {
            campaignId: campaign.id,
            luckFactor,
            random: random.toFixed(3),
            passes: random <= luckFactor
          });
        }

        if (random <= luckFactor) {
          // Sélectionner une question de la campagne
          const selectedQuestion = this._selectQuestionFromCampaign(campaign);
          
          if (selectedQuestion) {
            if (ErrorHandler.debugMode) {
              console.log('[DecisionEngine] Campaign selected:', {
                campaignId: campaign.id,
                questionId: selectedQuestion.id
              });
            }
            
            return {
              campaign: campaign,
              question: selectedQuestion
            };
          }
        }
      }

      if (ErrorHandler.debugMode) {
        console.log('[DecisionEngine] No campaign passed luck factor');
      }

      return null;

    } catch (error) {
      ErrorHandler.log(error, 'DecisionEngine.findEligibleCampaign');
      return null;
    }
  }

  /**
   * Vérifie si l'URL correspond aux filtres de la campagne
   * @param {Object} campaign - Campagne
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   * @private
   */
  _isUrlEligible(campaign, url) {
    try {
      const path = new URL(url).pathname;

      // Vérifier la blockList d'abord (prioritaire)
      if (campaign.blockListRegex && campaign.blockListRegex.length > 0) {
        for (const pattern of campaign.blockListRegex) {
          const regex = new RegExp(pattern);
          if (regex.test(path)) {
            if (ErrorHandler.debugMode) {
              console.log('[DecisionEngine] URL blocked by campaign:', {
                campaignId: campaign.id,
                pattern,
                path
              });
            }
            return false;
          }
        }
      }

      // Vérifier l'allowList (si présente)
      if (campaign.allowListRegex && campaign.allowListRegex.length > 0) {
        for (const pattern of campaign.allowListRegex) {
          const regex = new RegExp(pattern);
          if (regex.test(path)) {
            return true;
          }
        }
        // Si allowList existe mais aucun match, rejeter
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] URL not in allowList for campaign:', {
            campaignId: campaign.id,
            path
          });
        }
        return false;
      }

      // Pas de filtres ou seulement blockList (déjà passé) = OK
      return true;

    } catch (error) {
      ErrorHandler.log(error, 'DecisionEngine._isUrlEligible');
      return false;
    }
  }

  /**
   * Sélectionne une question parmi celles de la campagne
   * Filtre les questions déjà répondues, puis sélection aléatoire
   * @param {Object} campaign - Campagne
   * @returns {Object|null} - Question sélectionnée
   * @private
   */
  _selectQuestionFromCampaign(campaign) {
    try {
      if (!campaign.questions || campaign.questions.length === 0) {
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] Campaign has no questions:', campaign.id);
        }
        return null;
      }

      // Filtrer les questions non-répondues
      const unansweredQuestions = campaign.questions.filter(question => {
        const hasAnswered = this.storageManager.hasAnswered(campaign.id, question.id);
        
        if (hasAnswered && ErrorHandler.debugMode) {
          console.log('[DecisionEngine] Question already answered, skipping:', {
            campaignId: campaign.id,
            questionId: question.id
          });
        }
        
        return !hasAnswered;
      });

      if (unansweredQuestions.length === 0) {
        if (ErrorHandler.debugMode) {
          console.log('[DecisionEngine] All questions answered for campaign:', campaign.id);
        }
        return null;
      }

      // Sélection aléatoire parmi les questions non-répondues
      const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
      const selectedQuestion = unansweredQuestions[randomIndex];

      if (ErrorHandler.debugMode) {
        console.log('[DecisionEngine] Question selected:', {
          campaignId: campaign.id,
          questionId: selectedQuestion.id,
          totalQuestions: campaign.questions.length,
          unansweredQuestions: unansweredQuestions.length
        });
      }

      return selectedQuestion;

    } catch (error) {
      ErrorHandler.log(error, 'DecisionEngine._selectQuestionFromCampaign');
      return null;
    }
  }
}

export default DecisionEngine;