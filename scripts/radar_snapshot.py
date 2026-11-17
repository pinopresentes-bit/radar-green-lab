"""Snapshot público ESPN, sem odds nem confirmação oficial de escalação."""
import datetime as dt
import json
import pathlib
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from zoneinfo import ZoneInfo

BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/"
LEAGUES = ["bra.1", "bra.2", "eng.1", "esp.1", "ita.1", "ger.1", "fra.1",
           "uefa.champions", "uefa.europa", "conmebol.libertadores",
           "conmebol.sudamericana", "fifa.world", "fifa.friendly",
           "concacaf.gold.cup", "usa.1", "mex.1"]
TZ = ZoneInfo("America/Sao_Paulo")
now = dt.datetime.now(dt.timezone.utc)
dates = [(now.astimezone(TZ) + dt.timedelta(days=i)).strftime("%Y%m%d") for i in range(2)]

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "GreenLabPRO/1.0 (public scoreboard)"})
    with urllib.request.urlopen(req, timeout=12) as response:
        return json.load(response)

def fetch(item):
    league, day = item
    try:
        data = get_json(f"{BASE}{league}/scoreboard?dates={day}&limit=200")
        out = []
        for event in data.get("events", []):
            competition = (event.get("competitions") or [{}])[0]
            competitors = competition.get("competitors") or []
            teams = {x.get("homeAway"): x.get("team", {}).get("displayName", "") for x in competitors}
            state = event.get("status", {}).get("type", {}).get("state", "")
            out.append({"id": str(event.get("id", "")), "league": league,
                        "start": event.get("date"), "home": teams.get("home"),
                        "away": teams.get("away"), "state": state,
                        "source": "ESPN (não oficial)"})
        return out, None
    except Exception as exc:
        return [], {"league": league, "date": day, "error": type(exc).__name__}

games, errors = {}, []
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = [pool.submit(fetch, item) for item in ((league, day) for league in LEAGUES for day in dates)]
    for future in as_completed(futures):
        found, error = future.result()
        if error:
            errors.append(error)
        for game in found:
            if game["id"] and game["home"] and game["away"]:
                games[game["league"] + ":" + game["id"]] = game
result = {"generated_at_utc": now.isoformat(), "timezone": "America/Sao_Paulo",
          "source": "ESPN scoreboard (não oficial)", "games": sorted(games.values(), key=lambda g: g["start"] or ""),
          "failed_requests": errors, "lineups_officially_confirmed": False,
          "odds_available": False, "warning": "Sem cotações e sem validação oficial de titulares; não constitui sinal de aposta."}
path = pathlib.Path("data/radar-snapshot.json")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Jogos: {len(games)}; falhas: {len(errors)}")
