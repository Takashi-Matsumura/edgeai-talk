"""LM Studio LLM client."""

import logging
from typing import List, Dict, Any, AsyncGenerator
import httpx

from config import settings
from models import Message

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for LM Studio OpenAI-compatible API."""

    def __init__(self):
        """Initialize LLM client."""
        self.base_url = settings.lm_studio_base_url
        self.model = settings.lm_studio_model
        self.timeout = httpx.Timeout(120.0, connect=10.0)

    async def chat_completion(
        self,
        messages: List[Message],
        stream: bool = True,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """
        Generate chat completion using LM Studio.

        Args:
            messages: Conversation history
            stream: Whether to stream the response
            temperature: Sampling temperature

        Yields:
            Response chunks (if streaming)
        """
        try:
            logger.info(f"🤖 Calling LM Studio API (model: {self.model})")

            # Convert messages to dict format
            messages_dict = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]

            payload = {
                "model": self.model,
                "messages": messages_dict,
                "temperature": temperature,
                "stream": stream,
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                if stream:
                    # Streaming response
                    async with client.stream(
                        "POST",
                        f"{self.base_url}/chat/completions",
                        json=payload,
                    ) as response:
                        response.raise_for_status()

                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]  # Remove "data: " prefix

                                if data == "[DONE]":
                                    break

                                yield data

                else:
                    # Non-streaming response
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        json=payload,
                    )
                    response.raise_for_status()
                    yield response.text

        except httpx.HTTPError as e:
            logger.error(f"❌ LM Studio API HTTP error: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ LM Studio API error: {e}")
            raise


def create_rag_prompt(context: List[Dict[str, Any]], question: str) -> str:
    """
    Create a prompt with RAG context.

    Args:
        context: List of context items from RAG search
        question: User's question

    Returns:
        Formatted prompt with context
    """
    if not context:
        return question

    # Build context section
    context_parts = []
    for i, item in enumerate(context, 1):
        content = item["content"]
        metadata = item.get("metadata", {})
        filename = metadata.get("filename", "不明")

        context_parts.append(
            f"[参考資料 {i}: {filename}]\n{content}"
        )

    context_text = "\n\n".join(context_parts)

    # Create prompt
    prompt = f"""以下の参考資料を基に、質問に回答してください。

参考資料:
{context_text}

質問: {question}

回答:"""

    return prompt


# Global LLM client instance
llm_client = LLMClient()
