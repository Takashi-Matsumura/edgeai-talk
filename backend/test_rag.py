"""Test script for RAG backend."""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from vectordb import vector_db
from embeddings import embedding_model
from text_processing import (
    extract_text_from_file,
    create_chunks_with_metadata,
    clean_text,
)


async def test_upload_sample_data():
    """Upload sample documents to vector database."""
    print("=" * 60)
    print("🧪 Testing Document Upload")
    print("=" * 60)

    sample_dir = Path(__file__).parent / "sample_data"
    files = list(sample_dir.glob("*.md")) + list(sample_dir.glob("*.txt"))

    if not files:
        print("⚠️  No sample files found in sample_data/")
        return

    for file_path in files:
        print(f"\n📄 Processing: {file_path.name}")

        # Read file
        with open(file_path, "rb") as f:
            content = f.read()

        # Extract text
        file_type = file_path.suffix
        text = extract_text_from_file(content, file_type, file_path.name)
        text = clean_text(text)

        print(f"  📊 Text length: {len(text)} characters")

        # Create chunks
        chunk_ids, chunks, metadatas = create_chunks_with_metadata(
            text=text,
            filename=file_path.name,
            file_type=file_type,
        )

        print(f"  📦 Created {len(chunks)} chunks")

        # Generate embeddings
        print(f"  🔢 Generating embeddings...")
        embeddings = embedding_model.encode_documents(chunks)

        # Add to vector database
        vector_db.add_documents(
            ids=chunk_ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        print(f"  ✅ Uploaded successfully")

    total_docs = vector_db.count()
    print(f"\n✅ Total documents in database: {total_docs}")


async def test_rag_query():
    """Test RAG query functionality."""
    print("\n" + "=" * 60)
    print("🧪 Testing RAG Query")
    print("=" * 60)

    test_queries = [
        "EdgeAI株式会社について教えてください",
        "EdgeAI Talkの主な機能は何ですか？",
        "音声入力が動作しない場合はどうすればいいですか？",
        "システム要件を教えてください",
    ]

    for query in test_queries:
        print(f"\n🔍 Query: {query}")

        # Generate query embedding
        query_embedding = embedding_model.encode_query(query)

        # Search vector database
        results = vector_db.query(
            query_embeddings=[query_embedding],
            n_results=3,
        )

        # Display results
        print(f"  📊 Found {len(results['ids'][0])} results:")

        for i in range(len(results['ids'][0])):
            doc_id = results['ids'][0][i]
            document = results['documents'][0][i]
            metadata = results['metadatas'][0][i]
            distance = results['distances'][0][i]

            # Convert distance to similarity
            similarity = 1 - (distance ** 2 / 2)

            filename = metadata.get('filename', 'unknown')
            chunk_idx = metadata.get('chunk_index', '?')

            print(f"  {i+1}. [{filename} - chunk {chunk_idx}] (similarity: {similarity:.4f})")
            print(f"     Preview: {document[:100]}...")

        print()


async def test_document_list():
    """Test document listing."""
    print("=" * 60)
    print("🧪 Testing Document List")
    print("=" * 60)

    results = vector_db.get_all_documents()

    # Group by filename
    docs_map = {}
    for i, doc_id in enumerate(results['ids']):
        metadata = results['metadatas'][i]
        filename = metadata.get('filename', 'unknown')

        if filename not in docs_map:
            docs_map[filename] = {
                'chunk_count': 0,
                'total_chars': 0,
            }

        docs_map[filename]['chunk_count'] += 1
        docs_map[filename]['total_chars'] += metadata.get('char_count', 0)

    print(f"\n📚 Total unique documents: {len(docs_map)}")
    print(f"📦 Total chunks: {len(results['ids'])}")

    for filename, stats in docs_map.items():
        print(f"  - {filename}: {stats['chunk_count']} chunks, {stats['total_chars']} chars")


async def main():
    """Run all tests."""
    print("\n🚀 RAG Backend Test Suite\n")

    try:
        # Test 1: Upload sample data
        await test_upload_sample_data()

        # Test 2: Document list
        await test_document_list()

        # Test 3: RAG query
        await test_rag_query()

        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
