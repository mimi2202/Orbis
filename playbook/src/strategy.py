from nautilus_trader.trading.strategy import Strategy, StrategyConfig
from nautilus_trader.model.data import Bar, BarType
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.objects import Quantity
import pandas as pd


class SyntraV2Config(StrategyConfig, frozen=True):
    # Engine auto-injects these four fields for single-instrument strategies
    instrument_id: str = ""
    instrument_ids: tuple = ()
    bar_type: str = ""
    bar_types: tuple = ()
    # Strategy tunables
    trade_qty: str = "0.001"
    sma_fast: int = 20
    sma_slow: int = 50
    rsi_period: int = 14
    volatility_period: int = 20
    confidence_threshold: float = 0.60
    margin_budget: str = "50"


class SyntraV2Strategy(Strategy):
    def __init__(self, config: SyntraV2Config) -> None:
        super().__init__(config)
        self._bars: list = []
        self._regime: str = "flat"  # "flat" | "long" | "short"

    def on_start(self) -> None:
        bt = self.config.bar_type
        if bt:
            self.subscribe_bars(bt if isinstance(bt, BarType) else BarType.from_str(str(bt)))

    def on_bar(self, bar: Bar) -> None:
        self._bars.append(bar)
        if len(self._bars) < self.config.sma_slow + 2:
            return
        self._evaluate()

    def _instr_id(self):
        raw = self.config.instrument_id
        if not raw:
            return None
        return raw if isinstance(raw, InstrumentId) else InstrumentId.from_str(str(raw))

    def _evaluate(self) -> None:
        closes = pd.Series([float(b.close) for b in self._bars[-200:]])
        sma_f = closes.rolling(self.config.sma_fast).mean().iloc[-1]
        sma_s = closes.rolling(self.config.sma_slow).mean().iloc[-1]
        rsi = _calc_rsi(closes, self.config.rsi_period).iloc[-1]
        vol = closes.pct_change().rolling(self.config.volatility_period).std()
        is_low_vol = bool(vol.iloc[-1] <= vol.quantile(0.7))

        action, confidence = "hold", 0.0
        if sma_f > sma_s:
            action, confidence = "buy", 0.75
        elif sma_f < sma_s:
            action, confidence = "sell", 0.70
        elif is_low_vol:
            if rsi < 30:
                action, confidence = "buy", 0.60
            elif rsi > 70:
                action, confidence = "sell", 0.60

        if confidence < self.config.confidence_threshold:
            action = "hold"

        self._manage_position(action)

    def _manage_position(self, action: str) -> None:
        # Transitions go through FLAT to avoid NETTING ambiguity.
        # LONG→SHORT: bar N closes long → FLAT, bar N+1 opens short.
        instr_id = self._instr_id()
        if instr_id is None:
            return

        qty = Quantity.from_str(f"{float(self.config.trade_qty):.6f}")

        if action == "buy":
            if self._regime == "flat":
                self.submit_order(self.order_factory.market(
                    instrument_id=instr_id,
                    order_side=OrderSide.BUY,
                    quantity=qty,
                ))
                self._regime = "long"
            elif self._regime == "short":
                # Close short first; next bar will open long
                self.submit_order(self.order_factory.market(
                    instrument_id=instr_id,
                    order_side=OrderSide.BUY,
                    quantity=qty,
                ))
                self._regime = "flat"

        elif action == "sell":
            if self._regime == "flat":
                self.submit_order(self.order_factory.market(
                    instrument_id=instr_id,
                    order_side=OrderSide.SELL,
                    quantity=qty,
                ))
                self._regime = "short"
            elif self._regime == "long":
                # Close long first; next bar will open short
                self.submit_order(self.order_factory.market(
                    instrument_id=instr_id,
                    order_side=OrderSide.SELL,
                    quantity=qty,
                ))
                self._regime = "flat"

        elif action == "hold" and self._regime != "flat":
            close_side = OrderSide.SELL if self._regime == "long" else OrderSide.BUY
            self.submit_order(self.order_factory.market(
                instrument_id=instr_id,
                order_side=close_side,
                quantity=qty,
            ))
            self._regime = "flat"

    def on_stop(self) -> None:
        instr_id = self._instr_id()
        if instr_id:
            self.cancel_all_orders(instr_id)
            self.close_all_positions(instr_id)


def _calc_rsi(prices: pd.Series, period: int) -> pd.Series:
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))
