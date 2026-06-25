"""Integración IA: escaneo y chat con Gemini (Google AI Studio) + fallbacks."""

import hashlib
import json
import os
import re
from typing import Any

import anthropic
import httpx
from dotenv import load_dotenv

load_dotenv()

VISION_PROMPT = """
Eres un experto en gestión de residuos sólidos en Santa Anita, Lima, Perú.
Analiza la imagen y responde ÚNICAMENTE en este JSON:
{
  "tipo": "plástico|papel|vidrio|orgánico|metal|electrónico|peligroso|no_identificado",
  "confianza": 0.0-1.0,
  "nombre_especifico": "botella PET de 500ml",
  "instrucciones": "Aplasta la botella, retira la tapa, deposítala en Punto Limpio Los Frutales",
  "reciclable": true,
  "puntos": 5,
  "dato_impacto": "Cada botella PET reciclada evita 0.08 kg de CO₂"
}
Si la imagen es borrosa, tiene múltiples objetos o mala iluminación, analiza el objeto más prominente e indica en nombre_especifico que la imagen no era óptima.
"""

ROBUSTNESS_INSTRUCTIONS = """
Si la imagen tiene estos problemas, maneja así:
- BORROSA: Clasifica el objeto más visible, indica confianza baja
- MÚLTIPLES OBJETOS: Clasifica el objeto más prominente o en el centro
- MALA ILUMINACIÓN: Intenta clasificar, indica en nombre_especifico
- OBJETO NO RECONOCIBLE: tipo = "no_identificado", sugiere tomar mejor foto
- IMAGEN NO ES UN RESIDUO: tipo = "no_es_residuo", mensaje amable
"""

CHAT_SYSTEM_PROMPT = """
Eres Kawsaq, el asistente de KawsaqEco. Ayudas a los vecinos de Santa Anita, Lima, Perú a reciclar correctamente y ganar puntos canjeables.

Contexto que siempre tienes disponible:
- El piloto KawsaqEco opera en el distrito de Santa Anita
- Puntos de acopio: Municipalidad (Av. Los Frutales 200), Punto Limpio Los Frutales, Ecoparque Próceres
- Los puntos se ganan escaneando residuos y se canjean por beneficios locales (bodegas, transporte, ecoparque)
- Horario referencial recojo municipal: Mar, Jue y Sáb 6:00–10:00

Reglas:
1. Responde siempre en español latinoamericano, tono cercano y motivador
2. Si preguntan dónde llevar un residuo, recomienda el punto de acopio más cercano en Santa Anita
3. Nunca inventes datos. Si no sabes algo, dilo claramente
4. Máximo 3 párrafos por respuesta, lenguaje simple y directo
5. Al final de cada respuesta, sugiere una acción concreta que el usuario puede hacer hoy en Santa Anita
"""

PERSONALIZATION_PROMPT = """
Dado este historial de reciclaje del usuario de los últimos 30 días:
{historial}

Genera en JSON:
{
  "residuo_frecuente": "plástico",
  "tip_personalizado": "Consejo específico para este usuario",
  "reto_sugerido": "Nombre del reto más adecuado para su nivel",
  "mensaje_motivacion": "Mensaje corto y personal (máx 20 palabras)"
}
"""

MODEL = "claude-sonnet-4-20250514"
DEEPSEEK_MODEL = "deepseek-chat"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Catálogo demo — resultados variados para pruebas sin API de pago
DEMO_SCAN_SAMPLES: list[dict[str, Any]] = [
    {
        "tipo": "plástico",
        "confianza": 0.82,
        "nombre_especifico": "Botella PET (modo demo)",
        "instrucciones": "Aplasta la botella, retira la tapa y deposítala en el contenedor amarillo.",
        "reciclable": True,
        "puntos": 5,
        "dato_impacto": "Cada botella PET reciclada evita 0.08 kg de CO₂",
    },
    {
        "tipo": "papel",
        "confianza": 0.78,
        "nombre_especifico": "Cartón / papel (modo demo)",
        "instrucciones": "Retira cinta adhesiva y plástico. Deposita en contenedor azul o punto de acopio.",
        "reciclable": True,
        "puntos": 5,
        "dato_impacto": "Reciclar 1 kg de papel ahorra 17 litros de agua",
    },
    {
        "tipo": "vidrio",
        "confianza": 0.80,
        "nombre_especifico": "Envase de vidrio (modo demo)",
        "instrucciones": "Enjuaga el envase y llévalo al contenedor verde o punto de acopio.",
        "reciclable": True,
        "puntos": 5,
        "dato_impacto": "El vidrio se recicla infinitamente sin perder calidad",
    },
    {
        "tipo": "metal",
        "confianza": 0.76,
        "nombre_especifico": "Lata de aluminio (modo demo)",
        "instrucciones": "Aplasta la lata y deposítala en el contenedor de metal o acopio.",
        "reciclable": True,
        "puntos": 5,
        "dato_impacto": "Reciclar aluminio ahorra 95% de energía vs producirlo nuevo",
    },
    {
        "tipo": "orgánico",
        "confianza": 0.74,
        "nombre_especifico": "Residuo orgánico (modo demo)",
        "instrucciones": "Composta en casa o deposítalo en contenedor marrón si tu distrito lo tiene.",
        "reciclable": True,
        "puntos": 5,
        "dato_impacto": "Compostar reduce residuos que van al relleno sanitario",
    },
    {
        "tipo": "electrónico",
        "confianza": 0.70,
        "nombre_especifico": "Residuo electrónico (modo demo)",
        "instrucciones": "No lo tires a la basura. Llévalo a un punto de reciclaje de RAEE autorizado.",
        "reciclable": True,
        "puntos": 5,
        "dato_impacto": "Los RAEE contienen metales recuperables y materiales tóxicos",
    },
]


def _get_deepseek_key() -> str | None:
    """Obtiene API key de DeepSeek si está configurada."""
    key = os.getenv("DEEPSEEK_API_KEY", "")
    if key and not key.startswith("TU_"):
        return key
    return None


async def _gemini_chat(messages: list[dict], max_tokens: int = 1024) -> str:
    """Chat con Gemini Flash — misma API key que el escaneo."""
    api_key = _get_gemini_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY no configurada")

    system_text = ""
    contents: list[dict] = []
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
            continue
        role = "model" if m["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})

    if not contents:
        raise ValueError("Sin mensajes para Gemini")

    payload: dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.7,
        },
    }
    if system_text:
        payload["systemInstruction"] = {"parts": [{"text": system_text}]}

    url = GEMINI_URL.format(model=GEMINI_MODEL) + f"?key={api_key}"
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _llm_chat(messages: list[dict], max_tokens: int = 1024) -> str:
    """Chat: Gemini primero, DeepSeek como respaldo."""
    if _get_gemini_key():
        try:
            return await _gemini_chat(messages, max_tokens=max_tokens)
        except Exception:
            pass
    if _get_deepseek_key():
        return await _deepseek_chat(messages, max_tokens=max_tokens)
    raise ValueError("Sin API de chat configurada (GEMINI_API_KEY o DEEPSEEK_API_KEY)")


async def _deepseek_chat(messages: list[dict], max_tokens: int = 1024) -> str:
    """Llama a DeepSeek API (formato OpenAI-compatible)."""
    api_key = _get_deepseek_key()
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY no configurada")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            DEEPSEEK_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


def _get_client() -> anthropic.Anthropic:
    """Crea cliente Anthropic con API key del entorno."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key.startswith("TU_"):
        raise ValueError("ANTHROPIC_API_KEY no configurada")
    return anthropic.Anthropic(api_key=api_key)


def _parse_json(text: str) -> dict[str, Any]:
    """Extrae JSON de la respuesta de Claude."""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No se pudo parsear JSON de la respuesta")
    return json.loads(match.group())


def _get_gemini_key() -> str | None:
    """Obtiene API key de Google Gemini (gratis en AI Studio)."""
    key = os.getenv("GEMINI_API_KEY", "")
    if key and not key.startswith("TU_"):
        return key
    return None


def _demo_scan(image_base64: str) -> dict[str, Any]:
    """Demo inteligente: resultado variado según hash de la imagen."""
    raw = image_base64.split(",")[-1] if "," in image_base64 else image_base64
    digest = hashlib.md5(raw[:2000].encode()).hexdigest()
    idx = int(digest, 16) % len(DEMO_SCAN_SAMPLES)
    return dict(DEMO_SCAN_SAMPLES[idx])


async def _gemini_scan(image_base64: str) -> dict[str, Any]:
    """Escaneo con Gemini Flash — tier gratuito de Google AI Studio."""
    api_key = _get_gemini_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY no configurada")

    raw = image_base64.split(",")[-1] if "," in image_base64 else image_base64
    url = GEMINI_URL.format(model=GEMINI_MODEL) + f"?key={api_key}"
    prompt = VISION_PROMPT + "\n" + ROBUSTNESS_INSTRUCTIONS

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            url,
            json={
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": raw}},
                    ],
                }],
            },
        )
        response.raise_for_status()
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return _parse_json(text)


async def _claude_scan(image_base64: str) -> dict[str, Any]:
    """Escaneo con Claude Vision (de pago)."""
    client = _get_client()
    media_type = "image/jpeg"
    if image_base64.startswith("data:"):
        header, image_base64 = image_base64.split(",", 1)
        media_type = header.split(";")[0].replace("data:", "")

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_base64}},
                {"type": "text", "text": VISION_PROMPT + "\n" + ROBUSTNESS_INSTRUCTIONS},
            ],
        }],
    )
    return _parse_json(response.content[0].text)


def _fallback_scan(image_base64: str = "") -> dict[str, Any]:
    """Alias del demo para compatibilidad."""
    return _demo_scan(image_base64) if image_base64 else dict(DEMO_SCAN_SAMPLES[0])


def normalize_scan_result(raw: dict[str, Any]) -> dict[str, Any]:
    """Normaliza la respuesta de IA — evita nulls que rompen ScanResponse."""
    tipo = str(raw.get("tipo") or "no_identificado").strip().lower()

    try:
        confianza = float(raw.get("confianza", 0.5))
    except (TypeError, ValueError):
        confianza = 0.5
    confianza = max(0.0, min(1.0, confianza))

    try:
        puntos = int(raw.get("puntos", 5))
    except (TypeError, ValueError):
        puntos = 5
    if tipo in ("no_identificado", "no_es_residuo"):
        puntos = 0

    reciclable = raw.get("reciclable")
    if reciclable is None:
        reciclable = tipo not in ("no_identificado", "no_es_residuo", "peligroso")

    return {
        "tipo": tipo,
        "confianza": confianza,
        "nombre_especifico": str(raw.get("nombre_especifico") or "Residuo identificado"),
        "instrucciones": str(
            raw.get("instrucciones") or "Sepáralo correctamente y llévalo al acopio más cercano en Santa Anita."
        ),
        "reciclable": bool(reciclable),
        "puntos": puntos,
        "dato_impacto": str(raw.get("dato_impacto") or ""),
    }


async def analyze_waste_image(image_base64: str) -> dict[str, Any]:
    """Escaneo: Gemini (gratis) → Claude (pago) → demo inteligente."""
    # 1. Gemini gratis (recomendado para hackathon)
    if _get_gemini_key():
        try:
            return normalize_scan_result(await _gemini_scan(image_base64))
        except Exception:
            pass

    # 2. Claude si tiene créditos
    if os.getenv("ANTHROPIC_API_KEY", "").startswith("sk-ant"):
        try:
            return normalize_scan_result(await _claude_scan(image_base64))
        except Exception:
            pass

    # 3. Demo sin costo — suficiente para pruebas y demo al jurado
    return normalize_scan_result(_demo_scan(image_base64))


async def chat_with_kawsaq(
    message: str,
    history: list[dict],
    context: dict[str, str] | None = None,
) -> str:
    """Envía mensaje al agente Kawsaq vía Gemini (DeepSeek como respaldo)."""
    try:
        system = CHAT_SYSTEM_PROMPT
        if context:
            extra = "\n".join(f"- {k}: {v}" for k, v in context.items())
            system += f"\n\nContexto del usuario actual:\n{extra}"
        messages = [{"role": "system", "content": system}]
        for m in history:
            role = "assistant" if m["role"] == "assistant" else "user"
            messages.append({"role": role, "content": m["content"]})
        messages.append({"role": "user", "content": message})
        return await _llm_chat(messages)
    except Exception:
        return (
            "¡Hola! Soy Kawsaq 🌱 En modo demo puedo ayudarte con reciclaje en Santa Anita. "
            "Prueba preguntarme dónde reciclar plástico o cuál es el impacto del cambio climático. "
            "Hoy puedes escanear un residuo y ganar 5 puntos."
        )


async def generate_personalization(historial: str) -> dict[str, Any]:
    """Genera recomendaciones personalizadas vía Gemini (DeepSeek como respaldo)."""
    try:
        prompt = PERSONALIZATION_PROMPT.format(historial=historial)
        text = await _llm_chat([
            {"role": "system", "content": "Responde solo JSON válido, sin markdown."},
            {"role": "user", "content": prompt},
        ], max_tokens=512)
        return _parse_json(text)
    except Exception:
        return {
            "residuo_frecuente": "plástico",
            "tip_personalizado": "Separa las tapas de las botellas antes de reciclar.",
            "reto_sugerido": "Reto Semilla: 5 escaneos esta semana",
            "mensaje_motivacion": "Cada botella cuenta. ¡Sigue así!",
        }
