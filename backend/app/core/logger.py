import sys
from loguru import logger

def setup_logging():
    """
    Configures the Loguru logger for the application.
    Removes default handlers and adds a new one with a specific format.
    """
    logger.remove()  # Remove the default handler
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True,
    )
    logger.info("Logger configured successfully.")

