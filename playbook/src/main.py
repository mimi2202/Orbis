from getagent import runtime

if runtime.is_historical():
    from getagent import backtest, data
    from pathlib import Path
    import datetime
    import json
    import pandas as pd

    out_dir = Path("/workspace/output")
    out_dir.mkdir(exist_ok=True)

    # 6-month window ending now
    end_dt = datetime.datetime.now(datetime.timezone.utc)
    start_dt = end_dt - datetime.timedelta(days=183)
    end_ms = int(end_dt.timestamp() * 1000)
    start_ms = int(start_dt.timestamp() * 1000)

    # Paginate backwards in 1000-bar chunks (90-day cap per request)
    chunks = []
    chunk_end = end_ms
    for _ in range(10):
        bars = data.crypto.futures.kline(
            symbol="BTCUSDT",
            interval="1h",
            exchange="bitget",
            end_time=chunk_end,
            limit=1000,
        )
        df_chunk = backtest.prepare_frame(bars)
        if df_chunk is None or df_chunk.empty:
            break
        chunks.append(df_chunk)
        earliest_ms = int(df_chunk.index[0].timestamp() * 1000)
        if earliest_ms <= start_ms:
            break
        chunk_end = earliest_ms - 1

    if not chunks:
        raise RuntimeError("No BTCUSDT 1h bars fetched")

    df = pd.concat(chunks[::-1])
    df = df[~df.index.duplicated(keep="last")]
    df.sort_index(inplace=True)
    df = df[df.index >= pd.Timestamp(start_dt)]
    print(f"Loaded {len(df)} bars: {df.index[0]} → {df.index[-1]}")

    result = backtest.run(
        ohlcv_data={"BTCUSDT.BITGET": df},
        spec=runtime.backtest_spec,
    )

    chart_path = backtest.generate_chart(result)
    summary = result.summary or {}
    initial_capital = float(summary.get("starting_balance", 10000) or 10000)
    net_pnl = float(summary.get("net_pnl", 0) or 0)
    strategy_return_pct = round(net_pnl / initial_capital * 100.0, 4) if initial_capital else 0.0

    # Override engine top-level keys so platform merge is correct
    raw = result.raw
    raw["net_pnl"] = round(net_pnl, 4)
    raw["total_return_pct"] = strategy_return_pct
    raw["starting_balance"] = initial_capital

    reports = raw.get("reports", {})
    raw_slim = {k: v for k, v in raw.items() if k != "reports"}
    raw_slim["reports"] = {k: v for k, v in reports.items() if k != "equity_curve"}
    (out_dir / "backtest_report.json").write_text(
        json.dumps(raw_slim, default=str), encoding="utf-8"
    )

    # Write equity_curve.csv (csv module is blocked — write manually)
    csv_lines = ["timestamp,value,nav"]
    for pt in reports.get("account", []):
        ts = pt.get("timestamp", "")
        raw_val = pt.get("total", pt.get("balance", ""))
        try:
            val = float(str(raw_val).split()[0].replace(",", ""))
        except (ValueError, TypeError):
            val = initial_capital
        nav = round(val / initial_capital, 6) if initial_capital else 1.0
        csv_lines.append(f"{ts},{val},{nav}")
    if len(csv_lines) < 2:
        end_val = round(initial_capital + net_pnl, 4)
        csv_lines.append(f"{start_dt.isoformat()},{initial_capital},1.0")
        csv_lines.append(f"{end_dt.isoformat()},{end_val},{round(end_val / initial_capital, 6)}")
    (out_dir / "equity_curve.csv").write_text("\n".join(csv_lines) + "\n", encoding="utf-8")

    win_rate = float(result.win_rate or 0.0)
    runtime.emit_signal(
        action="long" if net_pnl > 0 else "hold",
        symbol="BTCUSDT",
        confidence=win_rate,
        metrics={
            "total_return_pct": strategy_return_pct,
            "net_pnl": round(net_pnl, 4),
            "sharpe_ratio": result.sharpe_ratio,
            "max_drawdown_pct": result.max_drawdown_pct,
            "win_rate": win_rate,
            "total_trades": result.total_trades,
            "profit_factor": result.profit_factor,
        },
        meta={"chart_path": chart_path},
    )

elif runtime.is_live():
    from . import main_live
    main_live.run()
else:
    raise ValueError(f"unsupported evaluation_mode={runtime.evaluation_mode!r}")
