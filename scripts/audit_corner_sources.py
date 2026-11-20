#!/usr/bin/env python3
"""Audit real ESPN corner coverage on completed matches, not future fixtures."""
import json
import pathlib
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = pathlib.Path("data")
ROOT.mkdir(exist_ok=True)
source = json.loads((ROOT / "latest.json").read_text(encoding="utf-8"))
games = source.get("games", [])
leagues = list(dict.fromkeys(g.get("league") for g in games if g.get("league")))
report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "source": "ESPN public unofficial API",
          "gamesChecked": 0, "totalCornersAvailable": 0, "periodCornersVerified": 0,
          "scheduledSkipped": 0, "historicalGamesFound": 0, "errors": [], "matches": []}

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "GreenLabPRO/1.0"})
    with urllib.request.urlopen(req, timeout=12) as response:
        return json.load(response)

def corner_value(stats):
    for stat in stats or []:
        key = str(stat.get("name") or stat.get("abbreviation") or stat.get("label") or "").lower().replace(" ", "").replace("_", "")
        if key in ("cornerkicks", "corners", "ck"):
            try:
                return int(float(stat.get("displayValue", stat.get("value"))))
            except (TypeError, ValueError):
                return None
    return None

# The live snapshot contains future/in-progress matches, for which complete
# historical corner totals cannot exist. Audit finished matches instead.
candidates = {}
for game in games:
    if game.get("status") == "STATUS_FINAL":
        candidates[(game["league"], str(game["id"]))] = game
    else:
        report["scheduledSkipped"] += 1

for league in leagues:
    for days_ago in (1, 2, 3, 4, 5, 6, 7):
        date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y%m%d")
        try:
            board = get_json(f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates={date}&limit=100")
            for event in board.get("events", []):
                status = event.get("status", {}).get("type", {})
                if status.get("completed") is True or status.get("name") == "STATUS_FINAL":
                    event_id = str(event.get("id") or "")
                    if event_id:
                        candidates[(league, event_id)] = {"league": league, "id": event_id}
        except Exception as exc:
            report["errors"].append({"league": league, "date": date, "error": type(exc).__name__})

report["historicalGamesFound"] = len(candidates)
for (league, event), game in list(candidates.items())[:60]:
    entry = {"id": event, "league": league, "total": None, "firstHalf": None,
             "secondHalf": None, "status": "unavailable"}
    try:
        data = get_json(f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={event}")
        report["gamesChecked"] += 1
        competition = (data.get("header", {}).get("competitions") or [{}])[0]
        competitors = competition.get("competitors") or []
        totals = [corner_value(side.get("statistics")) for side in competitors]
        if len(totals) != 2 or any(v is None for v in totals):
            # ESPN may expose team statistics in the boxscore rather than header.
            teams = (data.get("boxscore") or {}).get("players") or []
            totals = [corner_value(t.get("statistics")) for t in (data.get("boxscore") or {}).get("teams", [])]
        if len(totals) == 2 and all(v is not None for v in totals):
            entry["total"] = sum(totals)
            entry["status"] = "total_only"
            report["totalCornersAvailable"] += 1
            for feed in (data.get("plays"), data.get("keyEvents"), (data.get("details") or {}).get("plays")):
                if not isinstance(feed, list):
                    continue
                corners = [p for p in feed if "corner" in str(p.get("type", {}).get("text", "") if isinstance(p.get("type"), dict) else p.get("type", "")).lower()]
                if len(corners) != entry["total"]:
                    continue
                periods = [p.get("period", {}).get("number") if isinstance(p.get("period"), dict) else p.get("period") for p in corners]
                if all(n in (1, 2) for n in periods):
                    entry["firstHalf"], entry["secondHalf"] = periods.count(1), periods.count(2)
                    entry["status"] = "periods_verified"
                    report["periodCornersVerified"] += 1
                    break
    except Exception as exc:
        entry["error"] = type(exc).__name__
    report["matches"].append(entry)

(ROOT / "corner-source-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Checked {report['gamesChecked']} | total {report['totalCornersAvailable']} | periods {report['periodCornersVerified']} | historical {report['historicalGamesFound']} | skipped live/future {report['scheduledSkipped']} | errors {len(report['errors'])}")
