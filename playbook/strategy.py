# strategies/syntra_v2_strategy.py
from getagent import backtest, data, runtime
import numpy as np
def run() -> None:
    # 1. Fetch market data
    bars = data.crypto.futures.kline(
        symbol="BTCUSDT", 
        interval="1h", 
        limit=1000
    )
    # 2. Prepare data frame for analysis
    df = backtest.prepare_frame(bars)
    # 3. Calculate indicators for market regime
    df['sma_20'] = df['close'].rolling(20).mean()
    df['sma_50'] = df['close'].rolling(50).mean()
    df['rsi'] = calculate_rsi(df['close'], 14)
    df['volatility'] = df['close'].pct_change().rolling(20).std()
    # 4. Determine market regime
    df['trend'] = np.where(df['sma_20'] > df['sma_50'], 'trending', 'ranging')
    df['vol_regime'] = np.where(df['volatility'] > df['volatility'].quantile(0.7), 'high_vol', 'low_vol')
    # 5. Generate signals based on regime
    latest = df.iloc[-1]
    signal = None
    if latest['trend'] == 'trending':
        # Trend-following: EMA crossover
        if latest['sma_20'] > latest['sma_50']:
            signal = {'action': 'buy', 'confidence': 0.75, 'reason': 'trend_up'}
        else:
            signal = {'action': 'sell', 'confidence': 0.70, 'reason': 'trend_down'}
    elif latest['trend'] == 'ranging' and latest['vol_regime'] == 'low_vol':
        # Mean reversion in low volatility
        if latest['rsi'] < 30:
            signal = {'action': 'buy', 'confidence': 0.60, 'reason': 'oversold'}
        elif latest['rsi'] > 70:
            signal = {'action': 'sell', 'confidence': 0.60, 'reason': 'overbought'}
    else:
        # Stay flat when unclear
        signal = {'action': 'hold', 'confidence': 0, 'reason': 'unclear_regime'}
    # 6. Emit the signal
    if signal and signal['action'] != 'hold':
        runtime.emit_signal(
            action=signal['action'],
            symbol="BTCUSDT",
            confidence=signal['confidence'],
            metadata={'reason': signal['reason']}
        )
def calculate_rsi(prices, period=14):
    \"\"\"Calculate RSI indicator\"\"\"
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi
