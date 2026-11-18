#!/usr/bin/env python3
"""Audit ESPN corner coverage without inventing first-half totals."""
import json
import pathlib
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path("data")
ROOT.mkdir(exist_ok=True)
source = json.loads((ROOT / "latest.json").read_text(encoding="utf-8"))
games = source.get("games", [])
report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "source": "ESPN public unofficial API", "gamesChecked": 0, "totalCornersAvailable": 0, "periodCornersVerified": 0, "matches": []}
for game in games[:30]:
    league, event = game.get("league"), game.get("id")
    if not league or not event:
        continue
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={event}"
    entry = {"id": event, "league": league, "total": None, "firstHalf": None, "secondHalf": None, "status": "unavailable"}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GreenLabPRO/1.0"})
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.load(response)
        report["gamesChecked"] += 1
        competitors = (data.get("header", {}).get("competitions") or [{}])[0].get("competitors") or []
        totals = []
        for side in competitors:
            stats = side.get("statistics") or []
            value = next((s.get("displayValue", s.get("value")) for s in stats if str(s.get("name", "")).lower().replace(" ", "") in ("cornerkicks", "corners")), None)
            try:
                totals.append(int(float(value)))
            except (ValueError, TypeError):
                pass
        if len(totals) == 2:
            entry["total"] = sum(totals)
            entry["status"] = "total_only"
            report["totalCornersAvailable"] += 1
            for feed in (data.get("plays"), data.get("keyEvents"), (data.get("details") or {}).get("plays")):
                if not isinstance(feed, list):
                    continue
                corners = [p for p in feed if "corner" in str(p.get("type", {}).get("text", "") if isinstance(p.get("type"), dict) else p.get("type", "")).lower()]
                if len(corners) != entry["total"]:
                    continue
                periods = []
                for play in corners:
                    period = play.get("period")
                    n = period.get("number") if isinstance(period, dict) else period
                    periods.append(n)
                if all(n in (1, 2) for n in periods):
                    entry["firstHalf"] = periods.count(1)
                    entry["secondHalf"] = periods.count(2)
                    entry["status"] = "periods_verified"
                    report["periodCornersVerified"] += 1
                    break
    except Exception as exc:
        entry["error"] = type(exc).__name__
    report["matches"].append(entry)
(ROOT / "corner-source-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Checked {report['gamesChecked']} | total {report['totalCornersAvailable']} | periods {report['periodCornersVerified']}")
