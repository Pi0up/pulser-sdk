import { useEffect, useState } from "react";
import "./sdk/index.js";

// Mock API Server pour la démo
class MockAPIServer {
  private static config = {
    cacheTTL: 24 * 60 * 60 * 1000, // 24h
    consent: {
      enabled: true, // Par défaut, le consentement est activé
      title: "Votre avis nous intéresse",
      description: "Nous aimerions recueillir vos retours pour améliorer votre expérience.",
      learnMoreText: "En savoir plus",
      learnMoreUrl: "https://example.com/feedback-info",
      dataCollectionInfo: "Nous collectons vos réponses de manière anonyme pour améliorer nos services. Vos données ne seront jamais partagées avec des tiers et sont conformes au RGPD.",
      acceptLabel: "Oui, j'accepte",
      declineLabel: "Non merci",
      privacyPolicyUrl: "https://example.com/privacy",
    },
    campaigns: [
      {
        id: "campaign_satisfaction_q4_2024",
        name: "Satisfaction Q4 2024",
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Commencé il y a 7 jours
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // Se termine dans 30 jours
        priority: 1,
        frequencyDays: 0, // Toujours afficher pour la démo
        luckFactor: 1, // 100% pour la démo
        allowListRegex: [],
        blockListRegex: [],
        thankYouMessage: {
          enabled: true,
          text: [
            "Merci pour votre retour ! 🙏",
            "Votre avis compte beaucoup ! ✨",
            "Merci d'avoir pris le temps de répondre ! 💚",
            "Super, merci ! 🎉",
          ],
          duration: 2000,
        },
        questions: [
          {
            id: "q1_satisfaction",
            title: "Comment trouvez-vous cette page ?",
            assistiveText:
              "Votre avis nous aide à améliorer notre service",
            type: "rating",
            responseConfig: { max: 5 },
          },
          {
            id: "q1b_satisfaction_alt",
            title: "Êtes-vous satisfait de votre expérience ?",
            assistiveText: "Donnez-nous une note",
            type: "rating",
            responseConfig: { max: 5 },
          },
        ],
      },
      {
        id: "campaign_nps_2024",
        name: "NPS 2024",
        startDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        priority: 2,
        frequencyDays: 7,
        luckFactor: 0.5,
        allowListRegex: ["^.*$"], // Toutes les pages
        blockListRegex: [],
        thankYouMessage: {
          enabled: true,
          text: [
            "Merci d'avoir pris le temps de répondre ! ✨",
            "Votre avis compte beaucoup pour nous ! 💙",
            "Merci pour votre feedback précieux ! 🌟",
          ],
          duration: 2500,
        },
        questions: [
          {
            id: "q2_nps",
            title: "Recommanderiez-vous notre service ?",
            assistiveText:
              "De 0 (pas du tout) à 10 (absolument)",
            type: "nps",
            responseConfig: {
              minLabel: "Pas du tout",
              maxLabel: "Absolument",
            },
          },
        ],
      },
      {
        id: "campaign_feedback_general",
        name: "Feedback Général",
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        priority: 3,
        frequencyDays: 14,
        luckFactor: 0.3,
        allowListRegex: [],
        blockListRegex: ["^/admin/.*"], // Bloquer les pages admin
        questions: [
          {
            id: "q3_feedback",
            title: "Avez-vous des suggestions ?",
            assistiveText:
              "Partagez vos idées pour nous aider à nous améliorer",
            type: "textarea",
            responseConfig: {
              maxChars: 300,
              placeholder: "Écrivez vos suggestions ici...",
            },
            validation: {
              required: true,
              minLength: 10,
              requiredMessage: "Veuillez partager vos suggestions",
              minLengthMessage: "Merci de détailler un peu plus (au moins 10 caractères)",
            },
            thankYouMessage: {
              enabled: true,
              text: [
                "Merci pour vos précieuses suggestions ! 💡",
                "Votre feedback nous est très utile ! 🙌",
                "Nous prenons note de vos idées ! ✨",
              ],
              duration: 2200,
            },
          },
        ],
      },
      {
        id: "campaign_onboarding",
        name: "Onboarding Success",
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 21 * 24 * 60 * 60 * 1000,
        priority: 4,
        frequencyDays: 3,
        luckFactor: 0.7,
        allowListRegex: [],
        blockListRegex: [],
        questions: [
          {
            id: "q4_boolean",
            title: "Avez-vous trouvé ce que vous cherchiez ?",
            assistiveText: null,
            type: "boolean",
            responseConfig: {
              yesLabel: "Oui",
              noLabel: "Non",
            },
            thankYouMessage: {
              enabled: true,
              text: "Super ! Merci pour votre réponse. 👍",
              duration: 1800,
            },
          },
        ],
      },
      {
        id: "campaign_user_profile",
        name: "Profil Utilisateur",
        startDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
        priority: 5,
        frequencyDays: 30,
        luckFactor: 0.8,
        allowListRegex: [],
        blockListRegex: [],
        thankYouMessage: {
          enabled: true,
          text: "Merci pour ces informations ! 🎉",
          duration: 2000,
        },
        questions: [
          {
            id: "q5_select",
            title: "Quel est votre rôle principal ?",
            assistiveText: "Cela nous aide à mieux comprendre nos utilisateurs",
            type: "select",
            responseConfig: {
              placeholder: "Sélectionnez votre rôle...",
              options: [
                "Développeur",
                "Designer",
                "Product Manager",
                "Marketing",
                "Support Client",
              ],
              allowCustom: true,
            },
          },
          {
            id: "q6_scale",
            title: "Sur une échelle de 1 à 10, comment évaluez-vous votre expérience ?",
            assistiveText: "1 = Très mauvaise, 10 = Excellente",
            type: "scale",
            responseConfig: {
              min: 1,
              max: 10,
            },
          },
        ],
      },
      {
        id: "campaign_contact_validation",
        name: "Contact avec Validation",
        startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        priority: 6,
        frequencyDays: 0,
        luckFactor: 1,
        allowListRegex: [],
        blockListRegex: [],
        questions: [
          {
            id: "q7_contact_email",
            title: "Souhaitez-vous nous laisser votre email ?",
            assistiveText: "Nous ne partagerons jamais vos données",
            type: "textarea",
            responseConfig: {
              maxChars: 100,
              placeholder: "votre.email@exemple.com",
            },
            validation: {
              required: true,
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
              requiredMessage: "L'email est requis pour continuer",
              patternMessage: "Veuillez entrer une adresse email valide",
            },
            thankYouMessage: {
              enabled: true,
              text: "Merci ! Nous vous contacterons bientôt. 📧",
              duration: 2500,
            },
          },
        ],
      },
    ],
  };

  static lastFetchDate: number | null = null;

  static handleConfigRequest(headers: Record<string, string>) {
    const lastFetchHeader = headers["X-Last-Fetch-Date"];

    if (lastFetchHeader && MockAPIServer.lastFetchDate) {
      // Simuler un 304 (pas de changement)
      return {
        status: 304,
        data: null,
      };
    }

    // Nouvelle config
    MockAPIServer.lastFetchDate = Date.now();
    return {
      status: 200,
      data: MockAPIServer.config,
    };
  }

  static handleSubmit(payload: any) {
    console.log("📤 [Mock API] Answer received:", payload);
    return {
      status: 200,
      data: {
        success: true,
        message: "Merci pour votre réponse !",
      },
    };
  }

  static handleImpression(payload: any) {
    console.log("👁️ [Mock API] Impression received:", payload);
    return {
      status: 200,
      data: {
        success: true,
        message: "Impression enregistrée",
      },
    };
  }
}

// Intercepteur fetch pour mocker l'API
const originalFetch = window.fetch;
window.fetch = function (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = input.toString();

  // Mock de l'API de config
  if (url.includes("/feedback/config")) {
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const headerEntries =
        init.headers instanceof Headers
          ? Array.from(init.headers.entries())
          : Object.entries(init.headers);
      headerEntries.forEach(([key, value]) => {
        headers[key] = value as string;
      });
    }

    const response = MockAPIServer.handleConfigRequest(headers);

    return Promise.resolve(
      new Response(
        response.data ? JSON.stringify(response.data) : null,
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
  }

  // Mock de l'API de submit
  if (url.includes("/feedback/submit")) {
    const body = init?.body
      ? JSON.parse(init.body as string)
      : {};
    const response = MockAPIServer.handleSubmit(body);

    return Promise.resolve(
      new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  // Mock de l'API d'impression
  if (url.includes("/feedback/impression")) {
    const body = init?.body
      ? JSON.parse(init.body as string)
      : {};
    const response = MockAPIServer.handleImpression(body);

    return Promise.resolve(
      new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  // Autres requêtes : comportement normal
  return originalFetch(input, init);
};

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState("/");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState("bottom-center");

  useEffect(() => {
    // Initialisation du SDK
    const sdk = (window as any).PulserSDK;

    if (sdk && !isInitialized) {
      sdk
        .init("example.com", "fr", null, {
          debug: true,
          pollingInterval: 500, // Plus réactif pour la démo
          position: selectedPosition,
        })
        .then(() => {
          setIsInitialized(true);
          console.log("✅ SDK initialisé");
        });
    }
  }, [isInitialized]);

  const navigateTo = (path: string) => {
    // Simuler une navigation SPA
    window.history.pushState({}, "", path);
    setCurrentPage(path);
  };

  const forceShowQuestion = (questionId: string) => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      sdk.showQuestion(questionId);
    }
  };

  const forceShowCampaign = (campaignId: string) => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      sdk.showCampaign(campaignId);
    }
  };

  const setUserData = () => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      // Test avec données normales ET références circulaires
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj; // Référence circulaire
      
      sdk.setUserInfo({
        userId: "demo-user-123",
        email: "demo@example.com",
        plan: "premium",
        timestamp: Date.now(),
        // Test de références circulaires (seront nettoyées automatiquement)
        circular: circularObj,
        domElement: document.body,
        windowRef: window,
      });
      alert("✅ Métadonnées utilisateur enregistrées (y compris références circulaires nettoyées)");
    }
  };

  const refreshDebugInfo = () => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      const info = sdk.getDebugInfo();
      setDebugInfo(info);

      // Tests singleton en console
      console.log("=== PULSER SDK DEBUG INFO ===");
      console.log(info);
      console.log("=== SINGLETON TEST ===");
      console.log(
        "Is Singleton:",
        sdk.constructor.getInstance() === sdk,
      );
      console.log(
        "Static instance:",
        sdk.constructor.getInstance(),
      );
    }
  };

  const clearAllData = () => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      sdk.clearData();
      alert("🗑️ Toutes les données du SDK ont été effacées");
    }
  };

  const reloadConfig = async () => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      await sdk.reloadConfig();
      alert("🔄 Configuration rechargée avec succès");
    }
  };

  const handleResetConsent = () => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      sdk.resetConsent();
      alert("🔄 Consentement réinitialisé. La demande de consentement sera affichée à nouveau.");
    }
  };

  const changePosition = async (newPosition: string) => {
    const sdk = (window as any).PulserSDK;
    if (sdk) {
      // Utiliser la nouvelle méthode updatePosition
      sdk.updatePosition(newPosition);
      setSelectedPosition(newPosition);
      console.log(`✅ Position changée vers: ${newPosition}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pulser SDK Demo
              </h1>
              <p className="text-gray-600">
                SDK de feedback utilisateur ultra-léger en
                Vanilla JavaScript
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div
              className={`w-3 h-3 rounded-full ${isInitialized ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
            <span className="text-sm text-gray-600">
              {isInitialized
                ? "✅ SDK initialisé"
                : "⏳ Initialisation..."}
            </span>
          </div>
        </div>

        {/* Navigation SPA Simulator */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🧭 Simulateur de Navigation SPA
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Naviguez entre les pages pour déclencher le moteur
            de décision du SDK
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigateTo("/")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === "/"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏠 Accueil
            </button>
            <button
              onClick={() => navigateTo("/products")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === "/products"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📦 Produits
            </button>
            <button
              onClick={() => navigateTo("/about")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === "/about"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ℹ️ À propos
            </button>
            <button
              onClick={() => navigateTo("/admin/dashboard")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === "/admin/dashboard"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🔐 Admin (Bloqué)
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">
              URL actuelle :{" "}
            </span>
            <code className="text-sm font-mono text-blue-600">
              {currentPage}
            </code>
          </div>
        </div>

        {/* Test des Positions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📐 Test des Positions du Widget
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Testez les 9 positions disponibles sur desktop. Sur mobile (&lt; 768px), toutes les positions forcent le widget en bas pleine largeur.
          </p>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-semibold text-blue-900">
              Position actuelle : 
            </span>
            <code className="ml-2 text-sm font-mono text-blue-700 bg-white px-2 py-1 rounded">
              {selectedPosition}
            </code>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => changePosition("top-left")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "top-left"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ↖️ Top Left
            </button>
            <button
              onClick={() => changePosition("top-center")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "top-center"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⬆️ Top Center
            </button>
            <button
              onClick={() => changePosition("top-right")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "top-right"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ↗️ Top Right
            </button>
            <button
              onClick={() => changePosition("middle-left")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "middle-left"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⬅️ Middle Left
            </button>
            <button
              onClick={() => changePosition("center")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "center"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🎯 Center
            </button>
            <button
              onClick={() => changePosition("middle-right")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "middle-right"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ➡️ Middle Right
            </button>
            <button
              onClick={() => changePosition("bottom-left")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "bottom-left"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ↙️ Bottom Left
            </button>
            <button
              onClick={() => changePosition("bottom-center")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "bottom-center"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⬇️ Bottom Center
            </button>
            <button
              onClick={() => changePosition("bottom-right")}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                selectedPosition === "bottom-right"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ↘️ Bottom Right
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>Astuce :</strong> Après avoir changé la position, cliquez sur "🎯 Satisfaction Q4" dans la section suivante pour voir le widget à la nouvelle position.
            </p>
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Note :</strong> Si les questions "Scale" et "Select" ne fonctionnent pas, cliquez sur "🗑️ Effacer données" puis rechargez la page pour vider le cache.
            </p>
          </div>
        </div>

        {/* Messages de remerciement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💚 Messages de remerciement
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                Fonctionnalité
              </h3>
              <p className="text-sm text-green-800 mb-3">
                Les messages de remerciement s'affichent automatiquement après chaque réponse de l'utilisateur. Ils sont entièrement configurables depuis la configuration de la campagne ou de chaque question.
              </p>
              <ul className="text-sm text-green-800 space-y-2 list-disc list-inside">
                <li><strong>Activation :</strong> <code className="bg-green-100 px-1 rounded">enabled: true</code></li>
                <li><strong>Message personnalisé :</strong> <code className="bg-green-100 px-1 rounded">text: "Votre message"</code> ou tableau de messages</li>
                <li><strong>Messages multiples :</strong> <code className="bg-green-100 px-1 rounded">text: ["Message 1", "Message 2"]</code> - choix aléatoire</li>
                <li><strong>Durée d'affichage :</strong> <code className="bg-green-100 px-1 rounded">duration: 2000</code> (en ms)</li>
                <li><strong>Override par question :</strong> Chaque question peut avoir son propre message</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">
                Exemples dans la configuration
              </h3>
              <div className="text-sm text-purple-800 space-y-2">
                <p>✅ <strong>Satisfaction Q4 :</strong> Tableau de 4 messages (choix aléatoire) - 2s</p>
                <p>✅ <strong>NPS 2024 :</strong> Tableau de 3 messages (choix aléatoire) - 2.5s</p>
                <p>✅ <strong>Question Boolean :</strong> "Super ! Merci pour votre réponse. 👍" (1.8s) - Override au niveau question</p>
                <p>✅ <strong>Profil Utilisateur :</strong> "Merci pour ces informations ! 🎉" (2s)</p>
                <p>❌ <strong>Feedback Général :</strong> Pas de message (désactivé)</p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">
                Exemple de configuration
              </h3>
              <pre className="text-xs bg-yellow-100 p-3 rounded overflow-x-auto text-yellow-900">
{`{
  id: "campaign_example",
  thankYouMessage: {
    enabled: true,
    // Message unique
    text: "Merci pour votre retour ! 🙏",
    // OU tableau de messages (choix aléatoire)
    text: [
      "Merci pour votre retour ! 🙏",
      "Votre avis compte ! ✨",
      "Merci d'avoir répondu ! 💚"
    ],
    duration: 2000 // millisecondes
  },
  questions: [
    {
      id: "q1",
      // Override au niveau question (optionnel)
      thankYouMessage: {
        enabled: true,
        text: "Merci ! 👍",
        duration: 1500
      }
    }
  ]
}`}
              </pre>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Tester les messages
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Testez les messages de remerciement en soumettant des réponses. Les campagnes "Satisfaction Q4" et "NPS 2024" utilisent des tableaux de messages, donc vous verrez un message différent à chaque fois ! 🎲
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => forceShowQuestion("q1_satisfaction")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex-1"
                >
                  🎲 Tester message aléatoire
                </button>
                <button
                  onClick={() => forceShowQuestion("q4_boolean")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex-1"
                >
                  📝 Tester message fixe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Protection données circulaires */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🔒 Sécurité et robustesse
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Protection contre les références circulaires
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Le SDK nettoie automatiquement toutes les données avant stockage et envoi pour éviter les erreurs <code className="bg-blue-100 px-1 rounded">TypeError: Converting circular structure to JSON</code>.
              </p>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li><strong>Métadonnées utilisateur :</strong> Références DOM, Window, et objets circulaires nettoyés</li>
                <li><strong>Envoi API :</strong> Toutes les données sont sanitisées avant JSON.stringify()</li>
                <li><strong>Stockage localStorage :</strong> Protection automatique lors du cache</li>
                <li><strong>Types supportés :</strong> Primitives, tableaux, objets plats</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-900 mb-2">
                Exemple de nettoyage automatique
              </h3>
              <div className="text-sm text-amber-800 space-y-2">
                <p>✅ <code className="bg-amber-100 px-1 rounded">userId: "123"</code> → Préservé</p>
                <p>✅ <code className="bg-amber-100 px-1 rounded">plan: "premium"</code> → Préservé</p>
                <p>⚠️ <code className="bg-amber-100 px-1 rounded">domElement: document.body</code> → <code>[DOM Element: BODY]</code></p>
                <p>⚠️ <code className="bg-amber-100 px-1 rounded">windowRef: window</code> → <code>[Window/Document]</code></p>
                <p>⚠️ <code className="bg-amber-100 px-1 rounded">circular: &#123;self: self&#125;</code> → <code>[Circular Reference]</code></p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                Test en direct
              </h3>
              <p className="text-sm text-green-800 mb-2">
                Le bouton "👤 Métadonnées utilisateur" ci-dessous teste l'envoi de données contenant des références circulaires, des éléments DOM et des références à window. Tout est nettoyé automatiquement !
              </p>
            </div>
          </div>
        </div>

        {/* Contrôles API Publique */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ⚙️ API Publique du SDK
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">
                Forcer une campagne
              </h3>
              <button
                onClick={() =>
                  forceShowCampaign(
                    "campaign_satisfaction_q4_2024",
                  )
                }
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                🎯 Satisfaction Q4
              </button>
              <button
                onClick={() =>
                  forceShowCampaign("campaign_nps_2024")
                }
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                📊 NPS 2024
              </button>
              <button
                onClick={() =>
                  forceShowCampaign("campaign_feedback_general")
                }
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                💬 Feedback Général
              </button>
              <button
                onClick={() =>
                  forceShowCampaign("campaign_onboarding")
                }
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                ✅ Onboarding
              </button>
              <button
                onClick={() =>
                  forceShowCampaign("campaign_user_profile")
                }
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                👤 Profil Utilisateur
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">
                Forcer une question
              </h3>
              <button
                onClick={() =>
                  forceShowQuestion("q1_satisfaction")
                }
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                ⭐ Question Rating
              </button>
              <button
                onClick={() => forceShowQuestion("q2_nps")}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                📊 Question NPS
              </button>
              <button
                onClick={() => forceShowQuestion("q3_feedback")}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                💬 Question Textarea
              </button>
              <button
                onClick={() => forceShowQuestion("q4_boolean")}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                ✅ Question Boolean
              </button>
              <button
                onClick={() => forceShowQuestion("q5_select")}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                📋 Question Select
              </button>
              <button
                onClick={() => forceShowQuestion("q6_scale")}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                🎚️ Question Scale
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">
                Gestion des données
              </h3>
              <button
                onClick={setUserData}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                👤 Métadonnées utilisateur
              </button>
              <button
                onClick={refreshDebugInfo}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                🐛 Debug Info
              </button>
              <button
                onClick={clearAllData}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                🗑️ Effacer données
              </button>
              <button
                onClick={reloadConfig}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                🔄 Recharger config
              </button>
            </div>
          </div>

          {/* Section Consentement RGPD */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              🔐 Gestion du Consentement RGPD
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetConsent}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
              >
                🔄 Réinitialiser
              </button>
              <button
                onClick={() => {
                  const status = (window as any).PulserSDK?.getConsentStatus?.();
                  alert(
                    status 
                      ? `État du consentement:\n\nActivé: ${status.enabled}\nRequis: ${status.required}\nConsenti: ${status.hasConsent}\nStatut: ${status.status === null ? 'Non demandé' : status.status ? 'Accepté' : 'Refusé'}`
                      : 'SDK non initialisé'
                  );
                }}
                className="px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
              >
                📊 Voir statut
              </button>
              <button
                onClick={() => {
                  (window as any).PulserSDK?.setConsent?.(true);
                  alert('Consentement accepté manuellement');
                }}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                ✅ Accepter (manuel)
              </button>
              <button
                onClick={() => {
                  (window as any).PulserSDK?.setConsent?.(false);
                  alert('Consentement refusé manuellement');
                }}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                ❌ Refuser (manuel)
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-3">
              Le consentement est demandé automatiquement la première fois qu'une question doit être affichée. 
              Utilisez "Réinitialiser" pour redemander le consentement.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🐛 Informations de Debug
            </h2>

            {/* État principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                  Statut
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {debugInfo.isInitialized
                    ? "✅ Initialisé"
                    : "⏳ Non initialisé"}
                </div>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">
                  Affichage
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {debugInfo.isDisplaying
                    ? "🔒 En cours"
                    : "✅ Disponible"}
                </div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="text-xs text-green-600 uppercase tracking-wide mb-1">
                  Campagnes
                </div>
                <div className="text-lg font-bold text-green-900">
                  {debugInfo.campaignsCount} actives
                </div>
              </div>
            </div>

            {/* Question courante */}
            {debugInfo.currentQuestion && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                <div className="text-xs text-yellow-700 uppercase tracking-wide mb-2">
                  Question Affichée
                </div>
                <div className="font-bold text-yellow-900">
                  {debugInfo.currentQuestion.title}
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  Campagne: {debugInfo.currentCampaign?.name}{" "}
                  (ID: {debugInfo.currentCampaign?.id})
                </div>
              </div>
            )}

            {/* JSON complet */}
            <details className="cursor-pointer">
              <summary className="text-sm font-semibold text-gray-700 mb-2 hover:text-gray-900">
                📄 Voir le JSON complet
              </summary>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono mt-2">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            ✨ Fonctionnalités Implémentées
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <FeatureItem
                icon="🎯"
                text="Shadow DOM pour isolation totale"
              />
              <FeatureItem
                icon="📐"
                text="Container Queries CSS pour responsivité"
              />
              <FeatureItem
                icon="🔄"
                text="Cache intelligent avec validation 304"
              />
              <FeatureItem
                icon="🛡️"
                text="Fail-safe : aucune erreur exposée"
              />
              <FeatureItem
                icon="🧭"
                text="Détection navigation SPA (hybride)"
              />
              <FeatureItem
                icon="📅"
                text="Campagnes avec dates début/fin"
              />
              <FeatureItem
                icon="🔐"
                text="Singleton : une seule instance"
              />
            </div>

            <div className="space-y-3">
              <FeatureItem
                icon="⏰"
                text="Fréquence par campagne (frequencyDays)"
              />
              <FeatureItem
                icon="🎲"
                text="Chance d'apparition (luckFactor)"
              />
              <FeatureItem
                icon="🔍"
                text="Filtrage URL par campagne (regex)"
              />
              <FeatureItem
                icon="🔒"
                text="Tracking réponses (campaignId:questionId)"
              />
              <FeatureItem
                icon="🎯"
                text="Priorité entre campagnes simultanées"
              />
              <FeatureItem
                icon="⚡"
                text="1 événement = 1 question (debounce 500ms)"
              />
              <FeatureItem
                icon="🐛"
                text="Mode debug activable"
              />
              <FeatureItem
                icon="🔐"
                text="Gestion consentement RGPD intégrée"
              />
            </div>
          </div>
        </div>

        {/* Section Consentement RGPD Documentation */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🔐 Consentement RGPD
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Le SDK intègre un système complet de gestion du consentement conforme au RGPD. 
              La première fois qu'une question doit être affichée, l'utilisateur voit d'abord un écran de consentement.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Fonctionnement
              </h3>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Le consentement est demandé automatiquement avant la première question</li>
                <li>Si accepté : les questions sont affichées normalement</li>
                <li>Si refusé : aucune question n'est affichée et les données sont effacées</li>
                <li>Le choix est stocké en localStorage pour ne pas redemander</li>
                <li>Configurable : peut être désactivé si vous gérez le consentement ailleurs</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                ⚙️ Configuration (dans l'API)
              </h3>
              <pre className="text-xs bg-white p-3 rounded overflow-auto border border-blue-200 text-gray-800 font-mono">{`{
  consent: {
    enabled: true,
    title: "Votre avis nous intéresse",
    description: "Nous aimerions recueillir vos retours...",
    learnMoreText: "En savoir plus",
    learnMoreUrl: "https://example.com/feedback-info",
    dataCollectionInfo: "Nous collectons vos réponses...",
    acceptLabel: "Oui, j'accepte",
    declineLabel: "Non merci",
    privacyPolicyUrl: "https://example.com/privacy"
  }
}`}</pre>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">
                🔌 API Publique
              </h3>
              <div className="text-sm text-purple-800 space-y-2">
                <p><code className="bg-purple-100 px-2 py-1 rounded">getConsentStatus()</code> - Récupère le statut actuel</p>
                <p><code className="bg-purple-100 px-2 py-1 rounded">hasConsent()</code> - Vérifie si consenti</p>
                <p><code className="bg-purple-100 px-2 py-1 rounded">setConsent(accepted)</code> - Définit le consentement manuellement</p>
                <p><code className="bg-purple-100 px-2 py-1 rounded">resetConsent()</code> - Réinitialise pour redemander</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 mt-8 text-white">
          <h2 className="text-xl font-bold mb-4">
            📚 Comment l'utiliser sur votre site
          </h2>

          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
            <code className="text-sm font-mono">
              {
                '<script src="https://cdn.example.com/pulser-sdk.js"></script>'
              }
              <br />
              {"<script>"}
              <br />
              {
                '  window.PulserSDK.init("votre-domain.com", "fr", null, {'
              }
              <br />
              {"    debug: false"}
              <br />
              {"  });"}
              <br />
              {"</script>"}
            </code>
          </div>

          <p className="text-sm opacity-90">
            Le SDK se charge automatiquement et surveille la
            navigation de votre site. Il affichera les questions
            selon la configuration récupérée depuis votre API.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}