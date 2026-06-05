from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set")

class ImageRequest(BaseModel):
    image: str

@app.post("/api/analyze")
async def analyze_image(request: ImageRequest):
    try:
        image_data = request.image
        if not image_data.startswith("data:image"):
            image_data = f"data:image/jpeg;base64,{image_data}"

        system_prompt = """Tu es un assistant IA expert en analyse d'environnement pour la domotique et la sécurité.
Analyse l'image fournie et retourne UNIQUEMENT un objet JSON valide avec la structure suivante, sans aucun texte supplémentaire :
{
  "health_emergency": "Oui" | "Non" | "Incertain",
  "presence": "Présent" | "Non présent",
  "activity_description": "Description courte de l'activité si une personne est présente, sinon 'Aucune'",
  "domotics_context": "Objets connectés visibles et scénario d'automatisation rapide proposé (ex: 'Baisse de la luminosité car la personne lit')."
}
"""

        payload = {
            "model": "qwen/qwen3.7-plus",
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyse cette image et retourne le JSON demandé."},
                        {"type": "image_url", "image_url": {"url": image_data}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"}
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Oxymis Vision"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            
            content = result["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)
            return parsed_json

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e.response.text))
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON response from VLM")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}