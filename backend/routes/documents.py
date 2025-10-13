"""Document management API routes."""

import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from models import DocumentUploadResponse, DocumentListResponse
from vectordb import vector_db
from embeddings import embedding_model
from text_processing import (
    extract_text_from_file,
    create_chunks_with_metadata,
    clean_text,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document for RAG.

    Supports: .txt, .md, .json, .pdf
    """
    try:
        logger.info(f"📤 Uploading document: {file.filename}")

        # Read file content
        content = await file.read()

        # Determine file type
        file_type = file.content_type or file.filename.split(".")[-1]

        # Extract text from file
        text = extract_text_from_file(content, file_type, file.filename)
        text = clean_text(text)

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Failed to extract text from file or file is empty"
            )

        # Create chunks with metadata
        chunk_ids, chunks, metadatas = create_chunks_with_metadata(
            text=text,
            filename=file.filename,
            file_type=file_type,
        )

        # Generate embeddings for chunks
        logger.info(f"🔢 Generating embeddings for {len(chunks)} chunks...")
        embeddings = embedding_model.encode_documents(chunks)

        # Add to vector database
        vector_db.add_documents(
            ids=chunk_ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        logger.info(
            f"✅ Successfully uploaded {file.filename}: "
            f"{len(chunks)} chunks indexed"
        )

        return DocumentUploadResponse(
            success=True,
            message=f"Successfully uploaded {file.filename}",
            document_count=1,
            chunk_count=len(chunks),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to upload document: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/list", response_model=DocumentListResponse)
async def list_documents():
    """Get list of all uploaded documents."""
    try:
        logger.info("📋 Listing documents...")

        # Get all documents from vector database
        results = vector_db.get_all_documents()

        # Group chunks by filename
        documents_map = {}
        for i, doc_id in enumerate(results["ids"]):
            metadata = results["metadatas"][i]
            filename = metadata.get("filename", "unknown")

            if filename not in documents_map:
                documents_map[filename] = {
                    "filename": filename,
                    "file_type": metadata.get("file_type", "unknown"),
                    "chunk_count": 0,
                    "upload_timestamp": metadata.get("upload_timestamp", ""),
                    "total_chars": 0,
                }

            documents_map[filename]["chunk_count"] += 1
            documents_map[filename]["total_chars"] += metadata.get("char_count", 0)

        documents = list(documents_map.values())

        logger.info(f"📚 Found {len(documents)} unique documents")

        return DocumentListResponse(
            documents=documents,
            total_count=len(documents),
        )

    except Exception as e:
        logger.error(f"❌ Failed to list documents: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.delete("/{filename}")
async def delete_document(filename: str):
    """Delete a document and all its chunks."""
    try:
        logger.info(f"🗑️  Deleting document: {filename}")

        # Delete all chunks for this filename
        deleted_count = vector_db.delete_by_filename(filename)

        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Document not found: {filename}"
            )

        logger.info(f"✅ Deleted {filename}: {deleted_count} chunks removed")

        return {
            "success": True,
            "message": f"Successfully deleted {filename}",
            "chunks_deleted": deleted_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete document: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.post("/reset")
async def reset_collection():
    """Reset the entire collection (delete all documents)."""
    try:
        logger.warning("⚠️  Resetting collection...")

        vector_db.reset()

        logger.info("✅ Collection reset successfully")

        return {
            "success": True,
            "message": "Collection reset successfully",
        }

    except Exception as e:
        logger.error(f"❌ Failed to reset collection: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset collection: {str(e)}"
        )


@router.get("/count")
async def get_document_count():
    """Get total document count in the collection."""
    try:
        count = vector_db.count()
        return {
            "total_chunks": count,
        }

    except Exception as e:
        logger.error(f"❌ Failed to count documents: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to count documents: {str(e)}"
        )
