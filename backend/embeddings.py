"""Text embedding generation using Sentence Transformers."""

import logging
from typing import List
from sentence_transformers import SentenceTransformer

from config import settings

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """Wrapper for Sentence Transformers embedding model."""

    def __init__(self):
        """Initialize the embedding model."""
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the Sentence Transformers model."""
        try:
            logger.info(f"🔄 Loading embedding model: {settings.embedding_model}")

            self.model = SentenceTransformer(
                settings.embedding_model,
                device=settings.embedding_device,
            )

            # Get embedding dimension
            self.embedding_dim = self.model.get_sentence_embedding_dimension()

            logger.info(
                f"✅ Embedding model loaded successfully "
                f"(dimension: {self.embedding_dim})"
            )

        except Exception as e:
            logger.error(f"❌ Failed to load embedding model: {e}")
            raise

    def encode(self, texts: List[str], show_progress: bool = False) -> List[List[float]]:
        """
        Encode texts to embedding vectors.

        Args:
            texts: List of text strings to encode
            show_progress: Whether to show progress bar

        Returns:
            List of embedding vectors
        """
        try:
            logger.debug(f"🔢 Encoding {len(texts)} texts...")

            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=show_progress,
                normalize_embeddings=True,  # Normalize for cosine similarity
            )

            # Convert to list of lists
            embeddings_list = embeddings.tolist()

            logger.debug(f"✅ Encoded {len(texts)} texts to embeddings")
            return embeddings_list

        except Exception as e:
            logger.error(f"❌ Failed to encode texts: {e}")
            raise

    def encode_query(self, query: str) -> List[float]:
        """
        Encode a single query text.

        Args:
            query: Query text to encode

        Returns:
            Embedding vector
        """
        try:
            # For E5 models, add "query: " prefix for better retrieval
            if "e5" in settings.embedding_model.lower():
                query = f"query: {query}"

            embeddings = self.encode([query], show_progress=False)
            return embeddings[0]

        except Exception as e:
            logger.error(f"❌ Failed to encode query: {e}")
            raise

    def encode_documents(self, documents: List[str]) -> List[List[float]]:
        """
        Encode documents for indexing.

        Args:
            documents: List of document texts

        Returns:
            List of embedding vectors
        """
        try:
            # For E5 models, add "passage: " prefix for documents
            if "e5" in settings.embedding_model.lower():
                documents = [f"passage: {doc}" for doc in documents]

            return self.encode(documents, show_progress=True)

        except Exception as e:
            logger.error(f"❌ Failed to encode documents: {e}")
            raise


# Global embedding model instance
embedding_model = EmbeddingModel()
