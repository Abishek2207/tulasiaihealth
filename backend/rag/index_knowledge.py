"""
RAG Knowledge Base Indexer for TulsiHealth
Indexes all knowledge base documents into ChromaDB for retrieval
"""

import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone

import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
import tiktoken

from api.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class KnowledgeBaseIndexer:
    """Indexes knowledge base documents into ChromaDB"""
    
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="rag/chroma_db")
        self.embedding_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.collection_name = settings.chroma_collection
        self.chunk_size = 512  # tokens
        self.chunk_overlap = 50  # tokens
        
        # Initialize tokenizer for chunking
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
    def get_collection(self):
        """Get or create ChromaDB collection"""
        try:
            collection = self.chroma_client.get_collection(name=self.collection_name)
            logger.info(f"Using existing collection: {self.collection_name}")
        except Exception:
            collection = self.chroma_client.create_collection(
                name=self.collection_name,
                metadata={"description": "TulsiHealth RAG Knowledge Base"}
            )
            logger.info(f"Created new collection: {self.collection_name}")
        return collection
    
    def load_knowledge_files(self) -> List[Dict[str, Any]]:
        """Load all knowledge base files"""
        knowledge_dir = Path("rag/knowledge_base")
        documents = []
        
        file_mappings = {
            "namaste_descriptions.txt": {
                "source": "NAMASTE Codes",
                "category": "Terminology",
                "language": "en",
                "system": "AYUSH"
            },
            "ayurveda_classics.txt": {
                "source": "Ayurveda Classics",
                "category": "Classical Texts",
                "language": "en",
                "system": "Ayurveda"
            },
            "siddha_medicine.txt": {
                "source": "Siddha Medicine",
                "category": "Classical Texts",
                "language": "en",
                "system": "Siddha"
            },
            "icd11_tm2_chapter26.txt": {
                "source": "ICD-11 TM2 Chapter 26",
                "category": "International Classification",
                "language": "en",
                "system": "WHO"
            },
            "drug_safety_rules.txt": {
                "source": "Drug Safety Rules",
                "category": "Clinical Guidelines",
                "language": "en",
                "system": "Safety"
            },
            "dosha_theory.txt": {
                "source": "Dosha Theory",
                "category": "Fundamental Principles",
                "language": "en",
                "system": "Ayurveda"
            }
        }
        
        for file_path, metadata in file_mappings.items():
            full_path = knowledge_dir / file_path
            if full_path.exists():
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    document = {
                        "content": content,
                        "source": metadata["source"],
                        "category": metadata["category"],
                        "language": metadata["language"],
                        "system": metadata["system"],
                        "file_path": str(full_path)
                    }
                    documents.append(document)
                    logger.info(f"Loaded {file_path}: {len(content)} characters")
                    
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
            else:
                logger.warning(f"File not found: {full_path}")
        
        return documents
    
    def chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chunk text into smaller pieces for embedding"""
        chunks = []
        
        # Split text into paragraphs first
        paragraphs = text.split('\n\n')
        
        current_chunk = ""
        current_length = 0
        chunk_id = 0
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # Get token count for paragraph
            paragraph_tokens = len(self.tokenizer.encode(paragraph))
            
            # If paragraph is too long, split it further
            if paragraph_tokens > self.chunk_size:
                # Split long paragraph into sentences
                sentences = paragraph.split('. ')
                for sentence in sentences:
                    sentence = sentence.strip()
                    if not sentence:
                        continue
                    
                    sentence_tokens = len(self.tokenizer.encode(sentence))
                    
                    # If adding this sentence exceeds chunk size
                    if current_length + sentence_tokens > self.chunk_size and current_chunk:
                        # Save current chunk
                        chunks.append({
                            "id": f"{metadata['source']}_chunk_{chunk_id}",
                            "text": current_chunk.strip(),
                            "metadata": {
                                **metadata,
                                "chunk_id": chunk_id,
                                "token_count": current_length,
                                "created_at": datetime.now(timezone.utc).isoformat()
                            }
                        })
                        
                        # Start new chunk with overlap
                        overlap_text = self.get_overlap_text(current_chunk)
                        current_chunk = overlap_text + sentence + ". "
                        current_length = len(self.tokenizer.encode(current_chunk))
                        chunk_id += 1
                    else:
                        current_chunk += sentence + ". "
                        current_length += sentence_tokens
            else:
                # If adding this paragraph exceeds chunk size
                if current_length + paragraph_tokens > self.chunk_size and current_chunk:
                    # Save current chunk
                    chunks.append({
                        "id": f"{metadata['source']}_chunk_{chunk_id}",
                        "text": current_chunk.strip(),
                        "metadata": {
                            **metadata,
                            "chunk_id": chunk_id,
                            "token_count": current_length,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                    })
                    
                    # Start new chunk
                    current_chunk = paragraph + "\n\n"
                    current_length = paragraph_tokens
                    chunk_id += 1
                else:
                    current_chunk += paragraph + "\n\n"
                    current_length += paragraph_tokens
        
        # Save the last chunk if it exists
        if current_chunk.strip():
            chunks.append({
                "id": f"{metadata['source']}_chunk_{chunk_id}",
                "text": current_chunk.strip(),
                "metadata": {
                    **metadata,
                    "chunk_id": chunk_id,
                    "token_count": current_length,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            })
        
        return chunks
    
    def get_overlap_text(self, text: str) -> str:
        """Get overlap text for chunk continuity"""
        # Get last few sentences for overlap
        sentences = text.split('. ')
        if len(sentences) <= 2:
            return text
        
        # Return last 2 sentences
        overlap_sentences = sentences[-2:]
        return '. '.join(overlap_sentences) + '. '
    
    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for text chunks"""
        logger.info(f"Creating embeddings for {len(texts)} chunks")
        
        # Process in batches to avoid memory issues
        batch_size = 32
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = self.embedding_model.encode(
                batch_texts,
                convert_to_tensor=True,
                show_progress_bar=False
            )
            all_embeddings.extend(batch_embeddings.tolist())
            
            if (i + batch_size) % 100 == 0:
                logger.info(f"Processed {i + batch_size}/{len(texts)} chunks")
        
        logger.info(f"Created {len(all_embeddings)} embeddings")
        return all_embeddings
    
    def index_documents(self, clear_existing: bool = True):
        """Index all documents into ChromaDB"""
        logger.info("Starting knowledge base indexing...")
        
        # Get collection
        collection = self.get_collection()
        
        # Clear existing data if requested
        if clear_existing:
            try:
                collection.delete()
                logger.info("Cleared existing collection data")
            except Exception as e:
                logger.warning(f"Could not clear collection: {e}")
        
        # Load documents
        documents = self.load_knowledge_files()
        logger.info(f"Loaded {len(documents)} documents")
        
        # Chunk documents
        all_chunks = []
        for doc in documents:
            chunks = self.chunk_text(doc["content"], doc)
            all_chunks.extend(chunks)
            logger.info(f"Created {len(chunks)} chunks from {doc['source']}")
        
        logger.info(f"Total chunks created: {len(all_chunks)}")
        
        # Prepare data for insertion
        ids = []
        texts = []
        metadatas = []
        
        for chunk in all_chunks:
            ids.append(chunk["id"])
            texts.append(chunk["text"])
            metadatas.append(chunk["metadata"])
        
        # Create embeddings
        embeddings = self.create_embeddings(texts)
        
        # Insert into ChromaDB
        try:
            collection.add(
                ids=ids,
                documents=texts,
                metadatas=metadatas,
                embeddings=embeddings
            )
            logger.info(f"Successfully indexed {len(ids)} chunks")
        except Exception as e:
            logger.error(f"Error indexing chunks: {e}")
            raise
        
        # Verify indexing
        try:
            count = collection.count()
            logger.info(f"Collection now contains {count} documents")
        except Exception as e:
            logger.warning(f"Could not verify collection count: {e}")
        
        logger.info("Knowledge base indexing completed successfully!")
    
    def test_retrieval(self, query: str, n_results: int = 5):
        """Test document retrieval"""
        logger.info(f"Testing retrieval for query: {query}")
        
        collection = self.get_collection()
        
        try:
            # Create query embedding
            query_embedding = self.embedding_model.encode([query])
            
            # Search collection
            results = collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=n_results
            )
            
            logger.info(f"Retrieved {len(results['ids'][0])} results")
            
            for i, (doc_id, document, metadata) in enumerate(zip(
                results['ids'][0], 
                results['documents'][0], 
                results['metadatas'][0]
            )):
                logger.info(f"\nResult {i+1}:")
                logger.info(f"  ID: {doc_id}")
                logger.info(f"  Source: {metadata.get('source', 'Unknown')}")
                logger.info(f"  Category: {metadata.get('category', 'Unknown')}")
                logger.info(f"  System: {metadata.get('system', 'Unknown')}")
                logger.info(f"  Tokens: {metadata.get('token_count', 'Unknown')}")
                logger.info(f"  Text: {document[:200]}...")
                
        except Exception as e:
            logger.error(f"Error during retrieval test: {e}")
    
    def get_collection_stats(self):
        """Get collection statistics"""
        collection = self.get_collection()
        
        try:
            count = collection.count()
            logger.info(f"Collection statistics:")
            logger.info(f"  Total documents: {count}")
            
            # Get sample to analyze categories
            sample = collection.get(limit=100)
            categories = {}
            sources = {}
            systems = {}
            
            for metadata in sample['metadatas']:
                category = metadata.get('category', 'Unknown')
                source = metadata.get('source', 'Unknown')
                system = metadata.get('system', 'Unknown')
                
                categories[category] = categories.get(category, 0) + 1
                sources[source] = sources.get(source, 0) + 1
                systems[system] = systems.get(system, 0) + 1
            
            logger.info("  Sample breakdown (first 100 documents):")
            logger.info("    Categories:")
            for cat, count in categories.items():
                logger.info(f"      {cat}: {count}")
            
            logger.info("    Sources:")
            for src, count in sources.items():
                logger.info(f"      {src}: {count}")
            
            logger.info("    Systems:")
            for sys, count in systems.items():
                logger.info(f"      {sys}: {count}")
                
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
    
    def rebuild_index(self):
        """Rebuild the entire index"""
        logger.info("Rebuilding knowledge base index...")
        self.index_documents(clear_existing=True)
        self.get_collection_stats()
        
        # Test retrieval
        test_queries = [
            "Vataja Jwara symptoms",
            "diabetes treatment in Ayurveda",
            "pregnancy contraindicated herbs",
            "heart disease in Siddha medicine",
            "ICD-11 TM2 coding"
        ]
        
        for query in test_queries:
            self.test_retrieval(query)


async def main():
    """Main indexing function"""
    indexer = KnowledgeBaseIndexer()
    
    try:
        # Rebuild index
        indexer.rebuild_index()
        
    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        raise


if __name__ == "__main__":
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    asyncio.run(main())
