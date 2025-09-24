import aiohttp
import asyncio
import logging

logger = logging.getLogger(__name__)

class RealtimeMarketService:
    """Fetch live market data for AI models"""
    def __init__(self):
        self.api_url = "https://api.example.com/marketdata"  # Replace with actual provider

    async def fetch_price(self, symbol: str) -> float:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.api_url}?symbol={symbol}") as resp:
                data = await resp.json()
                return data.get("price", 0.0)

    async def fetch_multiple(self, symbols: list) -> dict:
        tasks = [self.fetch_price(sym) for sym in symbols]
        prices = await asyncio.gather(*tasks)
        return dict(zip(symbols, prices))
