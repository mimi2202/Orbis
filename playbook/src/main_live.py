from getagent import data, runtime
import pandas as pd


def run() -> None:
    config = runtime.manifest["strategy_config"]
    symbol = config.get("trading_symbols", ["BTCUSDT"])[0]
    sma_fast = int(config.get("sma_fast", 20))
    sma_slow = int(config.get("sma_slow", 50))
    rsi_period = int(config.get("rsi_period", 14))
    vol_period = int(config.get("volatility_period", 20))
    threshold = float(config.get("confidence_threshold", 0.60))

    bars = data.crypto.futures.kline(symbol=symbol, interval="1h", limit=1000)
    df = data.to_dataframe(bars)

    df["sma_fast"] = df["close"].rolling(sma_fast).mean()
    df["sma_slow"] = df["close"].rolling(sma_slow).mean()
    df["rsi"] = _calc_rsi(df["close"], rsi_period)
    df["vol"] = df["close"].pct_change().rolling(vol_period).std()

    latest = df.iloc[-1]
    vol_threshold = df["vol"].quantile(0.7)

    action, confidence, reason = None, 0.0, "unclear_regime"
    if latest["sma_fast"] > latest["sma_slow"]:
        action, confidence, reason = "buy", 0.75, "trend_up"
    elif latest["sma_fast"] < latest["sma_slow"]:
        action, confidence, reason = "sell", 0.70, "trend_down"
    elif latest["vol"] <= vol_threshold:
        if latest["rsi"] < 30:
            action, confidence, reason = "buy", 0.60, "oversold"
        elif latest["rsi"] > 70:
            action, confidence, reason = "sell", 0.60, "overbought"

    if action and confidence >= threshold:
        runtime.emit_signal(
            action=action,
            symbol=symbol,
            confidence=confidence,
            meta={"reason": reason},
        )


def _calc_rsi(prices: pd.Series, period: int) -> pd.Series:
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))
