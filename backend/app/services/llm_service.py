from typing import AsyncGenerator, List, Dict, Any, Optional
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from loguru import logger

from app.config import get_settings


class LLMService:
    """Service for interacting with local Hugging Face models."""

    def __init__(self):
        settings = get_settings()
        self.model_name = settings.hf_model
        self.max_new_tokens = settings.max_new_tokens
        self.device = torch.device("cuda" if settings.hf_device.lower() == "cuda" and torch.cuda.is_available() else "cpu")

        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
        self.model.to(self.device)

    def build_rag_prompt(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]]
    ) -> str:
        """Build the prompt for RAG."""
        # Build context from retrieved chunks
        context = "\n\n".join([
            f"--- Source {i+1} ---\n{chunk['text']}"
            for i, chunk in enumerate(context_chunks)
        ])

        prompt = f"""You are a helpful assistant that answers questions based on the provided documents.

Context from documents:
{context}

User question: {query}

Instructions:
1. Use only the context provided to answer the question
2. If the context doesn't contain enough information to fully answer the question, state what you know from the context
3. Be specific and cite the source when referencing information
4. If you cannot find the answer in the context, say so clearly

Answer:"""

        return prompt

    async def generate_stream(
        self,
        prompt: str
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response."""
        try:
            response = self.generate(prompt)
            yield response
        except Exception as e:
            logger.error(f"Error generating stream: {e}")
            yield f"\n\n[Error generating response: {str(e)}]"

    def generate(self, prompt: str) -> str:
        """Generate non-streaming response."""
        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=1024
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=self.max_new_tokens,
                    do_sample=False
                )

            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            return response
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"