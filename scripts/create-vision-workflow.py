import json

SYSTEM_MESSAGE = """You are the sales and customer service assistant for Byte Digital, a premium web design and digital marketing agency based in Christchurch, New Zealand. You are not a generic chatbot — you are the first point of contact and your job is to genuinely help each customer find the right solution while naturally guiding the conversation toward a positive outcome (a booking, purchase, enquiry, or next step).

COMPANY PROFILE:
- Founded by Barry Grottis (14+ years experience)
- Christchurch, Canterbury, New Zealand
- Premium web design & digital marketing for local businesses
- Email: barry@bytedigital.co.nz
- Website: https://bytedigital.co.nz

SERVICES:
1. Web Design — Custom, conversion-focused websites built from scratch
2. Web Development — Fast, scalable web applications with modern frameworks
3. SEO — Rank higher on Google and drive organic traffic
4. Local SEO — Dominate local search results in Christchurch
5. eCommerce — Online stores that sell. Built for conversion
6. WordPress Development — Custom WordPress sites that are fast and secure
7. Branding — Brand strategy and identity that stands out
8. Logo Design — Memorable logos that define your brand
9. Custom Applications — Tailor-made web apps for your business processes
10. Website Maintenance — Keep your site fast, secure, and up to date

IMAGE UPLOAD SUPPORT:
- When a customer uploads a photo, analyze the image carefully and provide helpful advice about what you see
- Describe what you observe in the image and connect it to relevant Byte Digital services
- If the image shows a business card, logo, or branding material, provide feedback and suggest improvements
- If the image shows a website screenshot, provide constructive feedback on design and usability
- Be specific about what you see in the image and how Byte Digital can help

STRICT OUTPUT RULES:
- Return ONLY the final answer to the user
- No tool usage descriptions or metadata
- Keep responses concise and conversational
- Break long text into short paragraphs
- Use emojis sparingly (1-2 per response max)
- Use New Zealand spelling and grammar (e.g., "colour" not "color", "personalised" not "personalized")"""

FILE_VALIDATOR_CODE = """const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if ($binary && Object.keys($binary).length > 0) {
  const binaryKeys = Object.keys($binary);
  const validFiles = [];
  const invalidFiles = [];
  
  for (const key of binaryKeys) {
    const binaryData = $binary[key];
    const mimeType = binaryData.mimeType || '';
    const fileSize = binaryData.fileSize || binaryData.size || 0;
    const fileSizeBytes = typeof fileSize === 'string' ? parseInt(fileSize) : fileSize;
    
    let isValid = true;
    let reason = '';
    
    if (!ALLOWED_TYPES.includes(mimeType)) {
      isValid = false;
      reason = 'Invalid file type (' + mimeType + '). Only JPG, PNG, GIF, WebP accepted.';
    } else if (fileSizeBytes > MAX_FILE_SIZE) {
      isValid = false;
      const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(2);
      reason = 'File too large (' + fileSizeMB + 'MB). Maximum is 10MB.';
    }
    
    if (isValid) {
      validFiles.push(key);
    } else {
      invalidFiles.push({ key, reason });
    }
  }
  
  if (validFiles.length === 0) {
    const errorMessages = invalidFiles.map(f => '\\u2022 ' + f.key + ': ' + f.reason).join('\\n');
    return [{
      json: {
        output: 'Kia ora! I\\'m sorry. I couldn\\'t process your files:\\n\\n' + errorMessages + '\\n\\nPlease upload valid image files (JPG, PNG, GIF, or WebP) under 10MB.'
      }
    }];
  }
  
  if (invalidFiles.length > 0) {
    const warningMessages = invalidFiles.map(f => '\\u2022 ' + f.key + ': ' + f.reason).join('\\n');
    return [{
      json: {
        ...$json,
        fileWarning: 'Kia ora! I skipped some files:\\n' + warningMessages + '\\n\\nI\\'ll process the valid files now.'
      }
    }];
  }
}

return $input.all();"""

IMAGE_TO_BASE64_CODE = """const items = $input.all();
const results = [];

for (const item of items) {
  const json = { ...item.json };
  const binary = item.binary || {};
  
  if (binary.image) {
    const imageData = binary.image;
    const mimeType = imageData.mimeType || 'image/jpeg';
    const data = imageData.data;
    json.imageBase64 = 'data:' + mimeType + ';base64,' + data;
    json.hasImage = true;
  } else {
    json.hasImage = false;
    json.imageBase64 = '';
  }
  
  results.push({ json });
}

return results;"""

CLEAN_RESPONSE_CODE = """function unwrap(o) {
  if (o === null || o === undefined) return '';
  if (typeof o === 'string') {
    var s = o.trim();
    if (s.charAt(0) === '{' && s.charAt(s.length - 1) === '}') {
      try {
        var parsed = JSON.parse(s);
        return unwrap(parsed);
      } catch (e) {
        if (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') return s.substring(1, s.length - 1);
        return s;
      }
    }
    if (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') return s.substring(1, s.length - 1);
    return s;
  }
  if (typeof o === 'object') {
    var keys = Object.keys(o);
    if (keys.length === 1) return unwrap(o[keys[0]]);
    try { return JSON.stringify(o); } catch (e) { return ''; }
  }
  return String(o);
}

var source = ($json && typeof $json === 'object' && $json.text !== undefined) ? $json.text : $json;
var cleaned = unwrap(source);
return { json: { text: cleaned } };"""

# Build workflow
wf = {
    "name": "Byte Digital Business Chatbot with Vision",
    "settings": {"executionOrder": "v1"},
    "nodes": [
        # 1. Webhook
        {
            "id": "webhook-1",
            "name": "Webhook",
            "parameters": {
                "httpMethod": "POST",
                "path": "byte-digital-chatbot-vision",
                "responseMode": "lastNode",
                "options": {"allowedOrigins": "*"}
            },
            "position": [-816, -336],
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2
        },
        # 2. File Validator
        {
            "id": "file-validator",
            "name": "File Validator",
            "parameters": {
                "mode": "runOnceForAllItems",
                "jsCode": FILE_VALIDATOR_CODE
            },
            "position": [-640, -336],
            "type": "n8n-nodes-base.code",
            "typeVersion": 2
        },
        # 3. File Warning
        {
            "id": "file-warning",
            "name": "File Warning",
            "parameters": {
                "assignments": {
                    "assignments": [
                        {
                            "id": "text",
                            "name": "text",
                            "value": r"={{ $json.fileWarning ? $json.fileWarning + '\n\n' + $json.chatInput : $json.chatInput }}",
                            "type": "string"
                        }
                    ]
                }
            },
            "position": [-560, -336],
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4
        },
        # 4. Image to Base64
        {
            "id": "image-to-base64",
            "name": "Image to Base64",
            "parameters": {
                "mode": "runOnceForAllItems",
                "jsCode": IMAGE_TO_BASE64_CODE
            },
            "position": [-480, -336],
            "type": "n8n-nodes-base.code",
            "typeVersion": 2
        },
        # 5. Prepare Prompt (sets system message and user message)
        {
            "id": "prepare-prompt",
            "name": "Prepare Prompt",
            "parameters": {
                "assignments": {
                    "assignments": [
                        {
                            "id": "system-message",
                            "name": "systemMessage",
                            "value": SYSTEM_MESSAGE,
                            "type": "string"
                        },
                        {
                            "id": "user-message",
                            "name": "userMessage",
                            "value": "={{ $json.userMessage || $json.chatInput || $json.message || 'Hello' }}",
                            "type": "string"
                        }
                    ]
                },
                "options": {}
            },
            "position": [-400, -336],
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4
        },
        # 6. If (has image?)
        {
            "id": "if-image",
            "name": "If (has image?)",
            "parameters": {
                "conditions": {
                    "boolean": [
                        {
                            "value1": "={{ $json.hasImage }}",
                            "value2": True
                        }
                    ]
                },
                "looseTypeValidation": True
            },
            "position": [-320, -336],
            "type": "n8n-nodes-base.if",
            "typeVersion": 2
        },
        # 7. Vision Request (has image)
        {
            "id": "vision-request",
            "name": "Vision Request",
            "parameters": {
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "method": "POST",
                "authentication": "predefinedCredentialType",
                "nodeCredentialType": "openRouterApi",
                "options": {},
                "bodyParametersJson": "= {\n  \"model\": \"openai/gpt-4o-mini\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": {{ $json.systemMessage }}\n    },\n    {\n      \"role\": \"user\",\n      \"content\": [\n        {\n          \"type\": \"text\",\n          \"text\": {{ $json.userMessage }}\n        },\n        {\n          \"type\": \"image_url\",\n          \"image_url\": {\n            \"url\": {{ $json.imageBase64 }},\n            \"detail\": \"auto\"\n          }\n        }\n      ]\n    }\n  ]\n}",
                "sendBody": True,
                "specifyBody": "json"
            },
            "position": [-240, -432],
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.4,
            "credentials": {
                "openRouterApi": {
                    "id": "uSUc5626duAfakQP",
                    "name": "OpenRouter account"
                }
            }
        },
        # 8. Text Request (no image) - primary
        {
            "id": "text-request",
            "name": "Text Request",
            "parameters": {
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "method": "POST",
                "authentication": "predefinedCredentialType",
                "nodeCredentialType": "openRouterApi",
                "options": {},
                "bodyParametersJson": "= {\n  \"model\": \"openai/gpt-oss-120b:free\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": {{ $json.systemMessage }}\n    },\n    {\n      \"role\": \"user\",\n      \"content\": {{ $json.userMessage }}\n    }\n  ]\n}",
                "sendBody": True,
                "specifyBody": "json"
            },
            "position": [-240, -240],
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.4,
            "credentials": {
                "openRouterApi": {
                    "id": "uSUc5626duAfakQP",
                    "name": "OpenRouter account"
                }
            }
        },
        # 9. Text Request Fallback (no image) - fallback
        {
            "id": "text-fallback",
            "name": "Text Fallback",
            "parameters": {
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "method": "POST",
                "authentication": "predefinedCredentialType",
                "nodeCredentialType": "openRouterApi",
                "options": {},
                "bodyParametersJson": "= {\n  \"model\": \"moonshotai/kimi-k2.5\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": {{ $json.systemMessage }}\n    },\n    {\n      \"role\": \"user\",\n      \"content\": {{ $json.userMessage }}\n    }\n  ]\n}",
                "sendBody": True,
                "specifyBody": "json"
            },
            "position": [-240, -180],
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.4,
            "credentials": {
                "openRouterApi": {
                    "id": "uSUc5626duAfakQP",
                    "name": "OpenRouter account"
                }
            },
            "continueOnFail": True
        },
        # 10. If (text request failed?)
        {
            "id": "if-text-failed",
            "name": "If (text failed?)",
            "parameters": {
                "conditions": {
                    "boolean": [
                        {
                            "value1": "={{ $input.all().length === 0 }}",
                            "value2": True
                        }
                    ]
                },
                "looseTypeValidation": True
            },
            "position": [-160, -240],
            "type": "n8n-nodes-base.if",
            "typeVersion": 2
        },
        # 11. Merge (vision + text + fallback)
        {
            "id": "merge-responses",
            "name": "Merge Responses",
            "parameters": {
                "mode": "combine",
                "combinationMode": "multiplex",
                "options": {}
            },
            "position": [-80, -336],
            "type": "n8n-nodes-base.merge",
            "typeVersion": 3
        },
        # 12. Extract Response
        {
            "id": "extract-response",
            "name": "Extract Response",
            "parameters": {
                "assignments": {
                    "assignments": [
                        {
                            "id": "extracted-text",
                            "name": "text",
                            "value": "={{ $json.choices[0].message.content }}",
                            "type": "string"
                        }
                    ]
                },
                "options": {}
            },
            "position": [0, -336],
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4
        },
        # 13. Clean Response
        {
            "id": "clean-response",
            "name": "Clean Response",
            "parameters": {
                "jsCode": CLEAN_RESPONSE_CODE,
                "options": {}
            },
            "position": [80, -336],
            "type": "n8n-nodes-base.code",
            "typeVersion": 2
        },
        # 14. Chat History (Google Sheets)
        {
            "id": "chat-history",
            "name": "Chat History",
            "parameters": {
                "operation": "append",
                "documentId": {
                    "__rl": True,
                    "value": "1-9iXUJrfA4iLJthAGKz5zorEx6ttrxalhLl77CJ2c5Q",
                    "mode": "id"
                },
                "sheetName": {
                    "__rl": True,
                    "value": "Sheet1",
                    "mode": "name"
                },
                "columns": {
                    "mappingMode": "defineBelow",
                    "value": {
                        "Timestamp": "={{ $now.setZone(\"Pacific/Auckland\").format(\"DD HH:mm:ss\") }}",
                        "Session_ID": "={{ $json.sessionId || \"N/A\" }}",
                        "Customer_Input": "={{ $json.userMessage || $json.chatInput }}",
                        "AI_Response": "={{ $json.text }}"
                    },
                    "matchingColumns": ["Timestamp"],
                    "schema": [
                        {"id": "Timestamp", "displayName": "Timestamp", "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
                        {"id": "Session_ID", "displayName": "Session_ID", "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
                        {"id": "Customer_Input", "displayName": "Customer_Input", "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
                        {"id": "AI_Response", "displayName": "AI_Response", "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False}
                    ],
                    "attemptToConvertTypes": False,
                    "convertFieldsToString": False
                },
                "options": {}
            },
            "position": [160, -336],
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.6,
            "credentials": {
                "googleSheetsOAuth2Api": {
                    "id": "sKGt1IvW53HbDevG",
                    "name": "Google Sheets account"
                }
            }
        }
    ],
    "connections": {
        "Webhook": {
            "main": [[{"node": "File Validator", "type": "main", "index": 0}]]
        },
        "File Validator": {
            "main": [[{"node": "File Warning", "type": "main", "index": 0}]]
        },
        "File Warning": {
            "main": [[{"node": "Image to Base64", "type": "main", "index": 0}]]
        },
        "Image to Base64": {
            "main": [[{"node": "Prepare Prompt", "type": "main", "index": 0}]]
        },
        "Prepare Prompt": {
            "main": [[{"node": "If (has image?)", "type": "main", "index": 0}]]
        },
        "If (has image?)": {
            "true": [[{"node": "Vision Request", "type": "main", "index": 0}]],
            "false": [[{"node": "Text Request", "type": "main", "index": 0}]]
        },
        "Vision Request": {
            "main": [[{"node": "Merge Responses", "type": "main", "index": 0}]]
        },
        "Text Request": {
            "main": [[{"node": "If (text failed?)", "type": "main", "index": 0}]]
        },
        "If (text failed?)": {
            "true": [[{"node": "Text Fallback", "type": "main", "index": 0}]],
            "false": [[{"node": "Merge Responses", "type": "main", "index": 0}]]
        },
        "Text Fallback": {
            "main": [[{"node": "Merge Responses", "type": "main", "index": 0}]]
        },
        "Merge Responses": {
            "main": [[{"node": "Extract Response", "type": "main", "index": 0}]]
        },
        "Extract Response": {
            "main": [[{"node": "Clean Response", "type": "main", "index": 0}]]
        },
        "Clean Response": {
            "main": [[{"node": "Chat History", "type": "main", "index": 0}]]
        }
    }
}

# Save
with open('C:/Users/barry/OneDrive/Desktop/ByteDigital/scripts/byte-digital-workflow-vision.json', 'w') as f:
    json.dump(wf, f, indent=2)

print(f"Created vision workflow with {len(wf['nodes'])} nodes")
print(f"Saved to: scripts/byte-digital-workflow-vision.json")
PYEOF