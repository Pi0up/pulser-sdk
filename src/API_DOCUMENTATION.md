# 🔌 Pulser API - Documentation Backend

## Table des Matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
4. [Webhooks](#webhooks)
5. [Formats de Données](#formats-de-données)
6. [Exemples d'Intégration](#exemples-dintégration)
7. [Limites et Quotas](#limites-et-quotas)
8. [Gestion des Erreurs](#gestion-des-erreurs)
9. [Sécurité et CORS](#sécurité-et-cors)
10. [Migration et Versioning](#migration-et-versioning)

---

## Introduction

L'API Pulser permet de gérer les campagnes de feedback, récupérer les réponses et configurer le SDK côté serveur.

### Base URL

```
Production:  https://api.pulser.io/v1
Staging:     https://api-staging.pulser.io/v1
```

### Principes

- **RESTful** : Suit les conventions REST
- **JSON** : Toutes les requêtes/réponses en JSON
- **HTTPS** : TLS 1.2+ obligatoire
- **Rate Limiting** : 1000 requêtes/minute par domaine
- **Idempotence** : POST avec `Idempotency-Key` header

---

## Authentification

### API Keys

Chaque domaine possède une clé API unique.

#### Header requis

```http
GET /config HTTP/1.1
Host: api.pulser.io
X-Pulser-Domain: example.com
X-Pulser-API-Key: pk_live_1234567890abcdef
Content-Type: application/json
```

#### Types de clés

```
pk_live_*    → Production (rate limiting strict)
pk_test_*    → Test (données sandbox, rate limiting relâché)
```

### Obtenir votre API Key

```bash
# Via Dashboard
https://dashboard.pulser.io/settings/api-keys

# Via CLI
pulser auth:create --domain example.com
```

---

## Endpoints

### 1. Configuration du SDK

#### GET `/config`

Récupère la configuration complète pour un domaine.

**Headers**
```http
X-Pulser-Domain: example.com
X-Pulser-API-Key: pk_live_xxx
```

**Query Parameters**
```
language    (optional) : Code langue (fr, en, es...)
version     (optional) : Version SDK pour compatibilité
```

**Exemple de requête**

```bash
curl -X GET "https://api.pulser.io/v1/config?language=fr" \
  -H "X-Pulser-Domain: example.com" \
  -H "X-Pulser-API-Key: pk_live_xxx"
```

**Réponse 200 OK**

```json
{
  "campaigns": [
    {
      "id": "campaign_nps_2024",
      "name": "NPS Survey Q1 2024",
      "active": true,
      "priority": 10,
      "trigger": {
        "type": "navigation",
        "urlPatterns": ["/products/*", "/pricing"],
        "excludePatterns": ["/admin/*"]
      },
      "targeting": {
        "userMeta": {
          "plan": ["premium", "enterprise"]
        }
      },
      "frequency": {
        "maxPerSession": 1,
        "cooldownDays": 30,
        "maxPerCampaign": 1
      },
      "questions": [
        {
          "id": "q1_nps",
          "type": "nps",
          "question": "Recommanderiez-vous notre produit ?",
          "scale": { "min": 0, "max": 10 },
          "labels": { "min": "Pas du tout", "max": "Absolument" },
          "validation": {
            "required": true,
            "errorMessages": {
              "required": "Veuillez sélectionner une note"
            }
          },
          "thankYouMessage": "Merci pour votre feedback !"
        }
      ]
    }
  ],
  "consent": {
    "required": true,
    "title": "Aidez-nous à améliorer votre expérience",
    "description": "Nous collectons vos retours pour améliorer nos services.",
    "learnMoreUrl": "https://example.com/privacy",
    "dataCollected": [
      "Vos réponses aux questions de feedback",
      "URL des pages que vous consultez",
      "Horodatage de vos interactions"
    ],
    "acceptLabel": "J'accepte",
    "declineLabel": "Je refuse"
  },
  "settings": {
    "position": "bottom-right",
    "pollingInterval": 300000,
    "theme": {
      "primaryColor": "#4F46E5",
      "backgroundColor": "#FFFFFF",
      "textColor": "#1F2937"
    }
  }
}
```

**Codes d'erreur**
- `400` : Domaine manquant ou invalide
- `401` : API Key invalide ou expirée
- `404` : Aucune configuration pour ce domaine
- `429` : Rate limit dépassé

---

### 2. Soumission de Réponses

#### POST `/responses`

Enregistre une réponse utilisateur.

**Headers**
```http
X-Pulser-Domain: example.com
X-Pulser-API-Key: pk_live_xxx
Idempotency-Key: uuid-v4-here (optionnel mais recommandé)
Content-Type: application/json
```

**Body**

```json
{
  "campaignId": "campaign_nps_2024",
  "questionId": "q1_nps",
  "answer": 9,
  "userMeta": {
    "userId": "user_123",
    "email": "user@example.com",
    "plan": "premium"
  },
  "context": {
    "url": "https://example.com/products/premium",
    "referrer": "https://google.com",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2024-12-03T10:30:00Z",
    "sessionId": "session_xyz"
  }
}
```

**Réponse 201 Created**

```json
{
  "id": "response_abc123",
  "campaignId": "campaign_nps_2024",
  "questionId": "q1_nps",
  "answer": 9,
  "status": "recorded",
  "timestamp": "2024-12-03T10:30:00Z",
  "webhookStatus": "pending"
}
```

**Codes d'erreur**
- `400` : Données invalides (validation échouée)
- `401` : API Key invalide
- `409` : Réponse déjà enregistrée (check Idempotency-Key)
- `422` : Format de réponse invalide pour le type de question
- `429` : Rate limit dépassé

---

### 3. Gestion des Campagnes

#### GET `/campaigns`

Liste toutes les campagnes.

**Query Parameters**
```
status      (optional) : active | inactive | all (default: active)
page        (optional) : Page number (default: 1)
limit       (optional) : Items per page (default: 20, max: 100)
```

**Réponse 200 OK**

```json
{
  "campaigns": [
    {
      "id": "campaign_nps_2024",
      "name": "NPS Survey Q1 2024",
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "stats": {
        "impressions": 1523,
        "responses": 842,
        "conversionRate": 0.553
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

#### POST `/campaigns`

Crée une nouvelle campagne.

**Body**

```json
{
  "name": "Product Feedback 2024",
  "active": true,
  "priority": 10,
  "trigger": {
    "type": "navigation",
    "urlPatterns": ["/products/*"]
  },
  "questions": [
    {
      "type": "rating",
      "question": "Rate our product",
      "scale": { "min": 1, "max": 5 }
    }
  ]
}
```

**Réponse 201 Created**

```json
{
  "id": "campaign_xyz789",
  "name": "Product Feedback 2024",
  "active": true,
  "createdAt": "2024-12-03T10:30:00Z"
}
```

---

#### PUT `/campaigns/:campaignId`

Met à jour une campagne existante.

**Body** : Mêmes champs que POST (tous optionnels)

**Réponse 200 OK**

```json
{
  "id": "campaign_xyz789",
  "name": "Product Feedback 2024 (Updated)",
  "active": false,
  "updatedAt": "2024-12-03T11:00:00Z"
}
```

---

#### DELETE `/campaigns/:campaignId`

Désactive une campagne (soft delete).

**Réponse 204 No Content**

---

### 4. Analytics et Statistiques

#### GET `/analytics/responses`

Récupère les réponses avec filtres avancés.

**Query Parameters**
```
campaignId    (optional) : Filter by campaign
questionId    (optional) : Filter by question
startDate     (optional) : ISO 8601 date
endDate       (optional) : ISO 8601 date
userMeta      (optional) : JSON filter (e.g., {"plan":"premium"})
page          (optional) : Page number
limit         (optional) : Items per page
```

**Exemple**

```bash
curl -X GET "https://api.pulser.io/v1/analytics/responses?campaignId=campaign_nps_2024&startDate=2024-01-01" \
  -H "X-Pulser-Domain: example.com" \
  -H "X-Pulser-API-Key: pk_live_xxx"
```

**Réponse 200 OK**

```json
{
  "responses": [
    {
      "id": "response_abc123",
      "campaignId": "campaign_nps_2024",
      "questionId": "q1_nps",
      "answer": 9,
      "userMeta": {
        "userId": "user_123",
        "plan": "premium"
      },
      "context": {
        "url": "https://example.com/products",
        "timestamp": "2024-12-03T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 842
  }
}
```

---

#### GET `/analytics/summary`

Récupère des statistiques agrégées.

**Query Parameters**
```
campaignId    (optional) : Filter by campaign
startDate     (optional) : ISO 8601 date
endDate       (optional) : ISO 8601 date
```

**Réponse 200 OK**

```json
{
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-03T23:59:59Z"
  },
  "summary": {
    "totalImpressions": 5432,
    "totalResponses": 2891,
    "conversionRate": 0.532,
    "averageNPS": 42,
    "promoters": 1234,
    "passives": 987,
    "detractors": 670
  },
  "byCampaign": [
    {
      "campaignId": "campaign_nps_2024",
      "impressions": 1523,
      "responses": 842,
      "conversionRate": 0.553
    }
  ],
  "byQuestion": [
    {
      "questionId": "q1_nps",
      "type": "nps",
      "averageScore": 8.2,
      "distribution": {
        "0": 5,
        "1": 3,
        "2": 8,
        "...": "...",
        "10": 124
      }
    }
  ]
}
```

---

### 5. Gestion du Consentement

#### POST `/consent`

Enregistre le consentement utilisateur.

**Body**

```json
{
  "userId": "user_123",
  "consent": true,
  "timestamp": "2024-12-03T10:30:00Z",
  "context": {
    "url": "https://example.com/products",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Réponse 201 Created**

```json
{
  "id": "consent_xyz",
  "userId": "user_123",
  "consent": true,
  "recordedAt": "2024-12-03T10:30:00Z"
}
```

---

#### GET `/consent/:userId`

Récupère le statut de consentement d'un utilisateur.

**Réponse 200 OK**

```json
{
  "userId": "user_123",
  "consent": true,
  "grantedAt": "2024-01-15T10:30:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

### 6. Export de Données

#### GET `/export/responses`

Exporte les réponses en CSV ou JSON.

**Query Parameters**
```
format        (required) : csv | json
campaignId    (optional) : Filter by campaign
startDate     (optional) : ISO 8601 date
endDate       (optional) : ISO 8601 date
```

**Exemple**

```bash
curl -X GET "https://api.pulser.io/v1/export/responses?format=csv&campaignId=campaign_nps_2024" \
  -H "X-Pulser-Domain: example.com" \
  -H "X-Pulser-API-Key: pk_live_xxx" \
  -o responses.csv
```

**Réponse 200 OK** (CSV)

```csv
id,campaignId,questionId,answer,userId,plan,url,timestamp
response_abc123,campaign_nps_2024,q1_nps,9,user_123,premium,https://example.com/products,2024-12-03T10:30:00Z
response_def456,campaign_nps_2024,q1_nps,7,user_456,free,https://example.com/pricing,2024-12-03T11:00:00Z
```

---

## Webhooks

### Configuration

Configurez des webhooks pour recevoir les événements en temps réel.

**Dashboard** : `https://dashboard.pulser.io/settings/webhooks`

**Événements disponibles** :
- `response.created` : Nouvelle réponse enregistrée
- `campaign.activated` : Campagne activée
- `campaign.deactivated` : Campagne désactivée
- `consent.granted` : Consentement accordé
- `consent.revoked` : Consentement révoqué

---

### Format des Webhooks

#### POST `https://your-server.com/webhooks/pulser`

**Headers**
```http
Content-Type: application/json
X-Pulser-Signature: sha256=abc123... (HMAC signature)
X-Pulser-Event: response.created
X-Pulser-Delivery-ID: uuid-v4
```

**Body (response.created)**

```json
{
  "event": "response.created",
  "timestamp": "2024-12-03T10:30:00Z",
  "data": {
    "id": "response_abc123",
    "campaignId": "campaign_nps_2024",
    "questionId": "q1_nps",
    "answer": 9,
    "userMeta": {
      "userId": "user_123",
      "plan": "premium"
    },
    "context": {
      "url": "https://example.com/products",
      "timestamp": "2024-12-03T10:30:00Z"
    }
  }
}
```

---

### Vérification de Signature

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage
app.post('/webhooks/pulser', (req, res) => {
  const signature = req.headers['x-pulser-signature'];
  const secret = process.env.PULSER_WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Traiter l'événement
  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);
  
  res.status(200).send('OK');
});
```

---

### Retry Policy

En cas d'échec, Pulser retry selon ce schéma :

```
Attempt 1:  Immédiat
Attempt 2:  +1 minute
Attempt 3:  +5 minutes
Attempt 4:  +15 minutes
Attempt 5:  +1 heure
Attempt 6:  +6 heures
Attempt 7:  +24 heures
```

Si tous les attempts échouent (7 jours), l'événement est marqué comme `failed`.

---

## Formats de Données

### Question Types

#### 1. Rating

```json
{
  "type": "rating",
  "question": "How would you rate our service?",
  "scale": { "min": 1, "max": 5 },
  "labels": { "min": "Poor", "max": "Excellent" }
}
```

**Réponse attendue** : `number` (1-5)

---

#### 2. NPS

```json
{
  "type": "nps",
  "question": "How likely are you to recommend us?",
  "scale": { "min": 0, "max": 10 },
  "labels": { "min": "Not at all", "max": "Extremely likely" }
}
```

**Réponse attendue** : `number` (0-10)

---

#### 3. Boolean

```json
{
  "type": "boolean",
  "question": "Did you find what you were looking for?",
  "labels": { "true": "Yes", "false": "No" }
}
```

**Réponse attendue** : `boolean`

---

#### 4. Textarea

```json
{
  "type": "textarea",
  "question": "Share your feedback",
  "placeholder": "Your thoughts...",
  "validation": {
    "minLength": 10,
    "maxLength": 500
  }
}
```

**Réponse attendue** : `string`

---

#### 5. Select

```json
{
  "type": "select",
  "question": "What's your favorite feature?",
  "options": [
    { "value": "feature_a", "label": "Feature A" },
    { "value": "feature_b", "label": "Feature B" }
  ]
}
```

**Réponse attendue** : `string` (value)

---

#### 6. Scale

```json
{
  "type": "scale",
  "question": "How satisfied are you?",
  "scale": { "min": 1, "max": 7 },
  "labels": { "min": "Not satisfied", "max": "Very satisfied" }
}
```

**Réponse attendue** : `number` (1-7)

---

### Validation Rules

```json
{
  "validation": {
    "required": true,
    "minLength": 10,
    "maxLength": 500,
    "pattern": "^[a-zA-Z0-9]+$",
    "forbiddenWords": ["spam", "test"],
    "custom": "(value) => value.length > 5 ? null : 'Too short'",
    "errorMessages": {
      "required": "This field is required",
      "minLength": "Minimum 10 characters",
      "maxLength": "Maximum 500 characters",
      "pattern": "Only alphanumeric characters allowed",
      "forbiddenWords": "Your message contains forbidden words",
      "custom": "Custom validation failed"
    }
  }
}
```

---

### User Metadata

Structure flexible pour stocker les informations utilisateur :

```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "premium",
  "accountAge": 365,
  "customField1": "value1",
  "customField2": "value2"
}
```

⚠️ **Limites** :
- Max 50 champs
- Clés : max 64 caractères
- Valeurs : max 256 caractères
- Types supportés : `string`, `number`, `boolean`

---

## Exemples d'Intégration

### Node.js / Express

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
const PULSER_API_KEY = process.env.PULSER_API_KEY;
const PULSER_DOMAIN = 'example.com';

// Endpoint pour récupérer la config
app.get('/api/feedback-config', async (req, res) => {
  try {
    const response = await axios.get('https://api.pulser.io/v1/config', {
      headers: {
        'X-Pulser-Domain': PULSER_DOMAIN,
        'X-Pulser-API-Key': PULSER_API_KEY
      },
      params: {
        language: req.query.lang || 'en'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Pulser API error:', error.response?.data);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Webhook handler
app.post('/webhooks/pulser', express.json(), (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'response.created':
      console.log('New response:', data);
      // Envoyer à votre analytics, CRM, etc.
      break;
      
    case 'consent.granted':
      console.log('Consent granted:', data.userId);
      break;
  }
  
  res.status(200).send('OK');
});

app.listen(3000);
```

---

### Python / Flask

```python
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)
PULSER_API_KEY = os.environ.get('PULSER_API_KEY')
PULSER_DOMAIN = 'example.com'

@app.route('/api/feedback-config')
def get_config():
    try:
        response = requests.get(
            'https://api.pulser.io/v1/config',
            headers={
                'X-Pulser-Domain': PULSER_DOMAIN,
                'X-Pulser-API-Key': PULSER_API_KEY
            },
            params={
                'language': request.args.get('lang', 'en')
            }
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        print(f'Pulser API error: {e}')
        return jsonify({'error': 'Failed to fetch config'}), 500

@app.route('/webhooks/pulser', methods=['POST'])
def webhook_handler():
    payload = request.json
    event = payload.get('event')
    data = payload.get('data')
    
    if event == 'response.created':
        print(f'New response: {data}')
        # Process response
    
    return 'OK', 200

if __name__ == '__main__':
    app.run(port=3000)
```

---

### PHP

```php
<?php
// Récupérer la configuration
function getPulserConfig($language = 'en') {
    $domain = 'example.com';
    $apiKey = getenv('PULSER_API_KEY');
    
    $ch = curl_init('https://api.pulser.io/v1/config?language=' . $language);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-Pulser-Domain: ' . $domain,
        'X-Pulser-API-Key: ' . $apiKey
    ]);
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($statusCode === 200) {
        return json_decode($response, true);
    }
    
    return null;
}

// Webhook handler
$payload = json_decode(file_get_contents('php://input'), true);

if ($payload['event'] === 'response.created') {
    $data = $payload['data'];
    error_log('New response: ' . json_encode($data));
    // Process response
}

http_response_code(200);
echo 'OK';
?>
```

---

### Ruby / Rails

```ruby
require 'net/http'
require 'json'

class PulserService
  BASE_URL = 'https://api.pulser.io/v1'
  
  def initialize
    @domain = 'example.com'
    @api_key = ENV['PULSER_API_KEY']
  end
  
  def get_config(language = 'en')
    uri = URI("#{BASE_URL}/config?language=#{language}")
    request = Net::HTTP::Get.new(uri)
    request['X-Pulser-Domain'] = @domain
    request['X-Pulser-API-Key'] = @api_key
    
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
    
    JSON.parse(response.body) if response.code == '200'
  end
end

# Webhook controller
class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  def pulser
    payload = JSON.parse(request.body.read)
    
    case payload['event']
    when 'response.created'
      Rails.logger.info "New response: #{payload['data']}"
      # Process response
    end
    
    head :ok
  end
end
```

---

## Limites et Quotas

### Rate Limiting

| Plan | Requêtes/minute | Requêtes/jour | Webhooks/minute |
|------|-----------------|---------------|-----------------|
| Free | 100 | 5,000 | 10 |
| Pro | 1,000 | 100,000 | 100 |
| Enterprise | Custom | Custom | Custom |

**Headers de réponse** :
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1638360000
```

---

### Limites de Données

| Ressource | Limite |
|-----------|--------|
| Campagnes actives | 50 (Free) / 500 (Pro) / Illimité (Enterprise) |
| Questions par campagne | 10 |
| Réponses stockées | 10,000 (Free) / Illimité (Pro+) |
| Taille réponse textarea | 5,000 caractères |
| User metadata champs | 50 |
| Webhooks endpoints | 5 (Free) / 20 (Pro) / Illimité (Enterprise) |

---

## Gestion des Erreurs

### Format d'Erreur Standard

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or expired",
    "details": {
      "domain": "example.com",
      "timestamp": "2024-12-03T10:30:00Z"
    },
    "requestId": "req_xyz123"
  }
}
```

---

### Codes d'Erreur

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_API_KEY` | 401 | API key invalide ou expirée |
| `MISSING_DOMAIN` | 400 | Header X-Pulser-Domain manquant |
| `DOMAIN_NOT_FOUND` | 404 | Domaine non configuré |
| `RATE_LIMIT_EXCEEDED` | 429 | Quota dépassé |
| `INVALID_CAMPAIGN` | 404 | Campagne introuvable |
| `INVALID_QUESTION_TYPE` | 422 | Type de question non supporté |
| `VALIDATION_FAILED` | 400 | Données invalides |
| `WEBHOOK_FAILED` | 500 | Erreur d'envoi webhook |

---

### Retry Strategy

Pour les erreurs temporaires (5xx, 429), implémentez un exponential backoff :

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Retry sur 429 et 5xx
      if (response.status === 429 || response.status >= 500) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## Sécurité et CORS

### CORS

L'API Pulser autorise les requêtes cross-origin depuis votre domaine configuré.

**Headers retournés** :
```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: X-Pulser-Domain, X-Pulser-API-Key, Content-Type
Access-Control-Max-Age: 86400
```

---

### Sécurité des API Keys

✅ **Bonnes pratiques** :
- Ne jamais exposer votre API key côté client
- Utiliser des variables d'environnement
- Rotation régulière des keys (tous les 90 jours)
- Utiliser des keys différentes par environnement

❌ **À éviter** :
```javascript
// ❌ MAUVAIS : Exposé côté client
const apiKey = 'pk_live_1234567890';
fetch('https://api.pulser.io/v1/config', {
  headers: { 'X-Pulser-API-Key': apiKey }
});
```

✅ **Correct** :
```javascript
// ✅ BON : Proxy backend
fetch('/api/feedback-config') // Votre backend gère l'API key
```

---

### HTTPS Only

Toutes les requêtes doivent utiliser HTTPS. Les requêtes HTTP sont automatiquement rejetées.

---

### Content Security Policy

Si vous utilisez CSP, ajoutez :

```http
Content-Security-Policy: 
  connect-src 'self' https://api.pulser.io;
  script-src 'self' https://cdn.pulser.io;
```

---

## Migration et Versioning

### Versioning de l'API

L'API suit le semantic versioning : `v1`, `v2`, etc.

**URL avec version** :
```
https://api.pulser.io/v1/config
https://api.pulser.io/v2/config (future)
```

---

### Breaking Changes

Les breaking changes déclenchent une nouvelle version majeure (v2, v3...).

**Non-breaking changes** (v1.x) :
- Ajout de nouveaux champs (optionnels)
- Nouveaux endpoints
- Nouveaux query parameters (optionnels)

**Breaking changes** (v2) :
- Suppression de champs
- Modification de types
- Changement de formats
- Nouveaux champs obligatoires

---

### Deprecation Policy

1. **Annonce** : 6 mois avant deprecation
2. **Warning headers** : 3 mois avant
   ```http
   X-Pulser-Deprecated: true
   X-Pulser-Sunset: 2025-06-01
   ```
3. **Migration guide** : Documentation complète
4. **Support overlap** : Les 2 versions coexistent 12 mois

---

### Migration de v1 à v2 (futur)

Exemple de changelog :

```markdown
## v2.0.0 (2025-06-01)

### Breaking Changes
- `POST /responses` : Champ `context.userAgent` maintenant obligatoire
- `GET /config` : Format de `frequency` modifié

### Migration
1. Mettre à jour l'URL : `v1` → `v2`
2. Ajouter `context.userAgent` dans les requêtes
3. Adapter le parsing de `frequency`

### Code Example
# Avant (v1)
response = requests.post('https://api.pulser.io/v1/responses', ...)

# Après (v2)
response = requests.post('https://api.pulser.io/v2/responses', {
  ...
  'context': {
    'userAgent': navigator.userAgent  # Maintenant obligatoire
  }
})
```

---

## Support et Resources

### Documentation
- Guide SDK : [DOCUMENTATION.md](./DOCUMENTATION.md)
- Architecture : [ARCHITECTURE.md](./ARCHITECTURE.md)
- Changelog : [CHANGELOG.md](./CHANGELOG.md)

### Support
- Email : support@pulser.io
- Status Page : https://status.pulser.io
- Community : https://community.pulser.io

### Tools
- Postman Collection : https://pulser.io/postman
- OpenAPI Spec : https://api.pulser.io/openapi.json
- SDK Libraries : https://github.com/pulser-io

---

**Pulser API** - Collectez, analysez, améliorez.
