from fastapi import APIRouter
import pandas as pd
import numpy as np

router = APIRouter()

@router.post("/backtest")
async def backtest_strategy(prices: list):
    df = pd.DataFrame(prices, columns=["price"])
    df["returns"] = df["price"].pct_change()
    total_return = (df["price"].iloc[-1] - df["price"].iloc[0]) / df["price"].iloc[0]
    sharpe = df["returns"].mean() / (df["returns"].std() + 1e-6) * np.sqrt(252)
    return {"total_return": total_return, "sharpe_ratio": sharpe}
