#!/usr/bin/env python3
"""Snapshot público de placares ESPN; não valida odds, titulares nem apostas."""
import datetime as dt
import json
import pathlib
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from zoneinfo import ZoneInfo

LEAGUES = ["uefa.nations","concacaf.nations.league","fifa.friendly","bra.1","bra.2","conmebol.libertadores","eng.1","esp.1","ita.1","ger.1","fra.1","uefa.champions","uefa.europa","mex.1","mex.w.1","usa.1","usa.nwsl","arg.1","uru.1"]
NOW = dt.datetime.now(dt.timezone.utc)
DAY = NOW.astimezone(ZoneInfo("America/Sao_Paulo")).strftime("%Y%m%d")

def fetch(league):
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates={DAY}&limit=200"
    req = urllib.request.Request(url, headers={"User-Agent": "GreenLabPRO/1.0 (public scoreboard)"})
    with urllib.request.urlopen(req, timeout=14) as response:
        data = json.load(response)
    matches = []
    for event in data.get("events", []):
        competition = (event.get("competitions") or [{}])[0]
        teams = competition.get("competitors") or []
        matches.append({
            "id": str(event.get("id", "")),
            "league": league,
            "date": event.get("date"),
            "status": (event.get("status") or {}).get("type", {}).get("name"),
            "teams": [{"name": (t.get("team") or {}).get("displayName"), "score": t.get("score"), "homeAway": t.get("homeAway")} for t in teams],
        })
    return matches

games, failures = [], []
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = {pool.submit(fetch, league): league for league in LEAGUES}
    for future in as_completed(futures):
        try:
            games.extend(future.result())
        except Exception as exc:
            failures.append({"league": futures[future], "error": type(exc).__name__})
if not games and len(failures) == len(LEAGUES):
    raise SystemExit("Todas as fontes falharam; mantendo snapshot anterior")
out = {"updatedAt": NOW.isoformat(), "dateBR": DAY, "source": "ESPN (não oficial)", "verifiedLineups": False, "verifiedOdds": False, "coverage": {"leaguesAttempted": len(LEAGUES), "leaguesFailed": len(failures)}, "failures": failures, "games": games}
path = pathlib.Path("data/latest.json")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Snapshot: {len(games)} jogos; {len(failures)} ligas falharam")
