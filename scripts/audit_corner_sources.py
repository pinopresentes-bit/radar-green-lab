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
    """Read ESPN team statistics without confusing missing data with zero."""
    if isinstance(stats, dict):
        stats = stats.get("statistics") or stats.get("stats") or list(stats.values())
    for stat in stats or []:
        if not isinstance(stat, dict):
            continue
        labels = [stat.get(k) for k in ("name", "abbreviation", "label", "displayName", "shortDisplayName", "type")]
        normalized = [str(v).lower().replace(" ", "").replace("_", "").replace("-", "") for v in labels if v]
        if not any(k in ("cornerkicks", "corners", "cornerkick", "ck") for k in normalized):
            continue
        value = stat.get("displayValue")
        if value is None:
            value = stat.get("value")
        try:
            n = float(str(value).replace(",", "."))
            return int(n) if n >= 0 and n.is_integer() else None
        except (TypeError, ValueError):
            return None
    return None


def team_corner_totals(data):
    """Try the two ESPN summary structures, retaining the provenance."""
    competition = (data.get("header", {}).get("competitions") or [{}])[0]
    for label, sides in (
        ("header.competitors", competition.get("competitors") or []),
        ("boxscore.teams", (data.get("boxscore") or {}).get("teams") or []),
    ):
        if len(sides) != 2:
            continue
        values = [corner_value(side.get("statistics") or side.get("stats")) for side in sides]
        if all(v is not None for v in values):
            return values, label
    return None, None


def corner_events(feed):
    if not isinstance(feed, list):
        return []
    result = []
    for event in feed:
        if not isinstance(event, dict):
            continue
        event_type = event.get("type")
        labels = [event.get("description"), event.get("text")]
        if isinstance(event_type, dict):
            labels += [event_type.get(k) for k in ("text", "name", "slug")]
        else:
            labels.append(event_type)
        if any("corner" in str(label).lower() for label in labels if label):
            result.append(event)
    return result


def event_period(event):
    period = event.get("period")
    if isinstance(period, dict):
        period = period.get("number", period.get("value"))
    try:
        n = int(period)
        return n if n in (1, 2) else None
    except (TypeError, ValueError):
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
        totals, location = team_corner_totals(data)
        entry["statLocation"] = location
        entry["boxscoreTeamCount"] = len((data.get("boxscore") or {}).get("teams") or [])
        entry["headerTeamCount"] = len((data.get("header", {}).get("competitions") or [{}])[0].get("competitors") or [])
        if totals is not None:
            entry["total"] = sum(totals)
            entry["status"] = "total_only"
            report["totalCornersAvailable"] += 1
            feeds = (data.get("plays"), data.get("keyEvents"),
                     (data.get("details") or {}).get("plays"),
                     (data.get("details") or {}).get("keyEvents"))
            for feed in feeds:
                corners = corner_events(feed)
                if not corners or len(corners) != entry["total"]:
                    continue
                periods = [event_period(p) for p in corners]
                if all(n in (1, 2) for n in periods):
                    entry["firstHalf"] = periods.count(1)
                    entry["secondHalf"] = periods.count(2)
                    entry["status"] = "periods_verified"
                    report["periodCornersVerified"] += 1
                    break
        else:
            entry["reason"] = "ESPN summary has no verifiable two-team corner totals"
    except Exception as exc:
        entry["error"] = type(exc).__name__
        entry["status"] = "fetch_error"
        report["errors"].append({"league": league, "event": event, "error": type(exc).__name__})
    report["matches"].append(entry)

(ROOT / "corner-source-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Checked {report['gamesChecked']} | total {report['totalCornersAvailable']} | periods {report['periodCornersVerified']} | historical {report['historicalGamesFound']} | skipped live/future {report['scheduledSkipped']} | errors {len(report['errors'])}")
