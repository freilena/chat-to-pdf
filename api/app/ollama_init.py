"""
Ollama initialization module for FastAPI.

This module handles automatic initialization of the Ollama service,
including model pulling and verification on startup.
"""

import asyncio
import logging
import aiohttp
from typing import Optional
from app.ollama_client import OllamaClient, OllamaHealth

logger = logging.getLogger(__name__)

async def initialize_ollama() -> bool:
    """
    Initialize Ollama service and pull the Llama 3.1 8B model if needed.
    
    Returns:
        True if initialization successful, False otherwise
    """
    logger.info("🚀 Initializing Ollama service...")
    
    base_url = "http://ollama:11434"
    max_attempts = 30
    
    # Wait for Ollama service to be ready
    logger.info("⏳ Waiting for Ollama service to be ready...")
    for attempt in range(1, max_attempts + 1):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{base_url}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        logger.info("✅ Ollama service is ready!")
                        break
        except Exception as e:
            if attempt == max_attempts:
                logger.error(f"❌ Failed to connect to Ollama service after {max_attempts} attempts: {e}")
                return False
            logger.info(f"⏳ Attempt {attempt}/{max_attempts}: Ollama not ready yet, waiting 10s...")
            await asyncio.sleep(10)
    
    # Check if model is already available
    logger.info("🔍 Checking if Llama 3.1 8B model is already available...")
    try:
        async with OllamaClient(base_url=base_url) as client:
            health = await client.health_check(use_cache=False)
            
            if health.is_healthy:
                logger.info("✅ Llama 3.1 8B model is already available!")
                return True
            
            # Model not found, need to pull it
            logger.info("📥 Llama 3.1 8B model not found, pulling model...")
            logger.info("⚠️ This may take several minutes for the first time...")
            
            # Pull the model
            async with aiohttp.ClientSession() as session:
                payload = {
                    "name": "llama3.1:8b",
                    "stream": False
                }
                
                async with session.post(
                    f"{base_url}/api/pull",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=600)  # 10 minute timeout for model pull
                ) as response:
                    if response.status == 200:
                        logger.info("✅ Model pull initiated successfully")
                    else:
                        logger.warning(f"Model pull request returned status {response.status}")
                
                # Wait a bit for the model to be available
                await asyncio.sleep(5)
                
                # Verify the model is now available
                for verify_attempt in range(6):
                    health = await client.health_check(use_cache=False)
                    if health.is_healthy:
                        logger.info("✅ Llama 3.1 8B model successfully pulled and verified!")
                        
                        # Log model info
                        models = await client.get_models()
                        for model in models:
                            if "llama3.1:8b" in model.name:
                                logger.info(f"📊 Model: {model.name}, Size: {model.size:,} bytes")
                        
                        return True
                    
                    if verify_attempt < 5:
                        logger.info(f"⏳ Verifying model... attempt {verify_attempt + 1}/6")
                        await asyncio.sleep(10)
                
                logger.error("❌ Failed to verify Llama 3.1 8B model is available after pulling")
                return False
                
    except Exception as e:
        logger.error(f"❌ Ollama initialization failed: {e}")
        return False
    
    logger.info("🎉 Ollama initialization completed successfully!")
    return True

async def ensure_ollama_ready() -> None:
    """
    Ensure Ollama is ready before handling queries.
    This function can be called periodically or on-demand.
    """
    try:
        client = await OllamaClient()
        health = await client.health_check()
        
        if not health.is_healthy or not health.is_available:
            logger.warning(
                f"Ollama is not ready: {health.error_message}. "
                "Queries may fail or use fallback responses."
            )
    except Exception as e:
        logger.error(f"Failed to check Ollama health: {e}")

