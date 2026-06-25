"""Router POST /api/chat — agente conversacional Kawsaq con SSE."""

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest, ChatResponse
from services.auth_deps import get_current_user_id
from services.claude_service import chat_with_kawsaq
from services.redis_service import get_chat_history, save_chat_history

router = APIRouter(prefix="/api", tags=["chat"])


def _suggested_for_message(message: str, distrito: str | None) -> list[str]:
    base = ["¿Dónde reciclo?", "Mi impacto hoy", "Retos de la semana"]
    lower = message.lower()
    if "plástico" in lower or "plastico" in lower:
        base = ["Normativa plásticos", "Punto acopio cercano", "¿Qué es PET?"]
    elif "orgánico" in lower or "organico" in lower:
        base = ["Compostaje en casa", "Contenedor marrón", "Impacto CO₂"]
    elif distrito:
        base = [f"Acopio en {distrito}", "Horarios municipalidad", "Retos de la semana"]
    return base


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user_id: str = Depends(get_current_user_id)):
    """Chat con Kawsaq, persiste historial en Redis."""
    try:
        history = body.conversation_history or get_chat_history(user_id)
        history_dicts = [{"role": m.role, "content": m.content} for m in history] if history else []

        context = {}
        if body.distrito:
            context["distrito"] = body.distrito
        if body.lat is not None and body.lng is not None:
            context["ubicacion"] = f"{body.lat:.4f}, {body.lng:.4f}"

        reply = await chat_with_kawsaq(body.message, history_dicts, context=context or None)

        history_dicts.append({"role": "user", "content": body.message})
        history_dicts.append({"role": "assistant", "content": reply})
        save_chat_history(user_id, history_dicts[-20:])

        return ChatResponse(
            reply=reply,
            suggested_actions=_suggested_for_message(body.message, body.distrito),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error en el chat") from e


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest, user_id: str = Depends(get_current_user_id)):
    """Streaming SSE de respuesta del chat."""
    reply = await chat_with_kawsaq(
        body.message,
        [{"role": m.role, "content": m.content} for m in body.conversation_history],
    )

    async def event_generator():
        for word in reply.split(" "):
            yield f"data: {json.dumps({'token': word + ' '})}\n\n"
        yield f"data: {json.dumps({'done': True, 'reply': reply})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
