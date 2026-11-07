"""Make one episode end to end.
   python pipeline/make_episode.py                 -> episode scheduled for today (Mexico City date)
   python pipeline/make_episode.py --date 2026-11-06
   python pipeline/make_episode.py --file episodes/2026-11-06.json
"""
import os, sys, json, argparse, datetime, re, shutil, time
from zoneinfo import ZoneInfo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts, timeline, audio, render

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def slug(s):
    s = s.lower(); s = re.sub(r"[áàä]", "a", s); s = re.sub(r"[éèë]", "e", s); s = re.sub(r"[íìï]", "i", s); s = re.sub(r"[óòö]", "o", s); s = re.sub(r"[úùü]", "u", s); s = s.replace("ñ", "n")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:50]

def pick(date):
    p = os.path.join(ROOT, "episodes", f"{date}.json")
    if os.path.exists(p): return p
    done = set(open(os.path.join(ROOT, "episodes", "done.txt")).read().split()) if os.path.exists(os.path.join(ROOT, "episodes", "done.txt")) else set()
    queue = sorted(f for f in os.listdir(os.path.join(ROOT, "episodes", "queue")) if f.endswith(".json")) if os.path.isdir(os.path.join(ROOT, "episodes", "queue")) else []
    for f in queue:
        if f not in done: return os.path.join(ROOT, "episodes", "queue", f)
    raise SystemExit(f"No hay episodio para {date} ni en la cola. Hay que escribir guiones nuevos.")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--date"); ap.add_argument("--file"); ap.add_argument("--workers", type=int)
    a = ap.parse_args()
    date = a.date or datetime.datetime.now(ZoneInfo("America/Mexico_City")).date().isoformat()
    path = a.file or pick(date); ep = json.load(open(path))
    name = f"{date}_{slug(ep.get('youtube', {}).get('title', ep.get('title', 'episodio')))}"
    work = os.path.join(ROOT, "work", name); os.makedirs(work, exist_ok=True); out = os.path.join(ROOT, "output"); os.makedirs(out, exist_ok=True)
    t0 = time.time(); print(f"Episodio: {path}\n1/4 voces", flush=True)
    meta = tts.synth(ep, os.path.join(work, "voices"), cache_dir=os.path.join(ROOT, "cache", "voices"))
    print("2/4 linea de tiempo", flush=True)
    data = timeline.build(ep, meta); dp = os.path.join(work, "render_data.json"); json.dump(data, open(dp, "w"))
    print(f"   duracion {data['total']:.1f}s, {len(data['frames'])} cuadros", flush=True)
    print("3/4 audio", flush=True); audio.mix(data, os.path.join(work, "voices"), os.path.join(work, "audio.wav"), seed=datetime.date.fromisoformat(date).toordinal())
    print("4/4 render", flush=True)
    mp4 = os.path.join(out, name + ".mp4")
    render.render(dp, os.path.join(work, "scenes"), os.path.join(work, "audio.wav"), mp4, workers=a.workers)
    yt = ep.get("youtube", {})
    with open(os.path.join(out, name + "_youtube.txt"), "w") as fh:
        fh.write(f"TITULO:\n{yt.get('title', '')}\n\nDESCRIPCION:\n{yt.get('description', '')}\n\nHASHTAGS / TAGS:\n{' '.join(yt.get('hashtags', []))}\n")
    if os.path.dirname(path).endswith("queue"):
        with open(os.path.join(ROOT, "episodes", "done.txt"), "a") as fh: fh.write(os.path.basename(path) + "\n")
    print(f"LISTO: {mp4}  ({(time.time() - t0) / 60:.1f} min)", flush=True)
    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a") as fh: fh.write(f"video={mp4}\nnotes={os.path.join(out, name + '_youtube.txt')}\nname={name}\ntitle={yt.get('title', name)}\n")

if __name__ == "__main__":
    main()
