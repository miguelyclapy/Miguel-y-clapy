"""Render frames in headless Chromium (three.js), draw subtitles/tags with cairo, encode per-scene, join."""
import os, io, sys, json, math, base64, subprocess, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from multiprocessing import Process
import numpy as np, cairo
from PIL import Image

W, H, FPS = 1080, 1920, 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = "Inter"

def ease(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def rr(c, x, y, w, h, r):
    c.new_sub_path(); c.arc(x + w - r, y + r, r, -math.pi / 2, 0); c.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    c.arc(x + r, y + h - r, r, math.pi / 2, math.pi); c.arc(x + r, y + r, r, math.pi, 1.5 * math.pi); c.close_path()

def wrap(c, text, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if c.text_extents(test).x_advance > maxw and cur: lines.append(cur); cur = w
        else: cur = test
    lines.append(cur); return lines

def overlay(bgra, t, data):
    s = cairo.ImageSurface.create_for_data(memoryview(bgra), cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.add_color_stop_rgba(0, 0, 0, 0, 0); g.add_color_stop_rgba(1, 0, 0, 0, 0.42)
    c.set_source(g); c.paint()
    L = next((x for x in data["tl"] if x["start"] <= t < x["end"]), data["tl"][-1])
    if L.get("tag"):
        k = ease((t - L["start"]) / 0.25)
        c.select_font_face(FONT, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); c.set_font_size(40)
        tw = c.text_extents(L["tag"]).x_advance; pw, ph = tw + 110, 78
        c.save(); c.translate(W / 2, 330); sc = 0.6 + 0.4 * k + 0.08 * math.sin(k * math.pi); c.scale(sc, sc)
        c.set_source_rgba(0.49, 0.36, 1.0, 0.96 * k); rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.fill()
        c.set_source_rgba(1, 0.35, 0.45, k); c.arc(-pw / 2 + 44, 0, 12, 0, 7); c.fill()
        c.set_source_rgba(1, 1, 1, k); c.move_to(-pw / 2 + 72, 14); c.show_text(L["tag"]); c.restore()
    c.select_font_face(FONT, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD); c.set_font_size(62)
    k = ease((t - L["start"]) / 0.15)
    for i, ln in enumerate(wrap(c, L["text"], 900)):
        tw = c.text_extents(ln).x_advance; c.move_to(W / 2 - tw / 2, 470 + i * 78); c.text_path(ln)
        c.set_source_rgba(0, 0, 0, 0.7 * k); c.set_line_width(13); c.set_line_join(cairo.LINE_JOIN_ROUND); c.stroke_preserve()
        col = (1, 1, 1) if L["who"] == "M" else (1, 0.86, 0.7)
        c.set_source_rgba(*col, k); c.fill()
    d = t - L["start"]
    if d < 0.06: c.set_source_rgba(0, 0, 0, 0.35 * (1 - d / 0.06)); c.paint()
    if t > data["total"] - 0.5: c.set_source_rgba(0, 0, 0, (t - (data["total"] - 0.5)) / 0.5); c.paint()
    s.flush()

def serve(port):
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", port), h); threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv

def worker(scenes, data_rel, data, outdir, port):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.on("pageerror", lambda e: print("pageerror:", e, flush=True))
        pg.goto(f"http://127.0.0.1:{port}/engine/index.html?data=../{data_rel}")
        pg.wait_for_function("window.READY === true", timeout=300000)
        for idx in scenes:
            L = data["tl"][idx]; f0, f1 = round(L["start"] * FPS), round(L["end"] * FPS)
            tmp, out = f"{outdir}/s{idx:02d}.tmp.mp4", f"{outdir}/s{idx:02d}.mp4"
            ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                   "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp], stdin=subprocess.PIPE)
            for f in range(f0, f1):
                url = pg.evaluate(f"window.renderFrame({f})")
                arr = np.array(Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB"))
                bgra = np.dstack([arr[:, :, 2], arr[:, :, 1], arr[:, :, 0], np.full(arr.shape[:2], 255, np.uint8)]).copy()
                overlay(bgra, f / FPS, data); ff.stdin.write(bgra.tobytes())
            ff.stdin.close()
            if ff.wait() == 0: os.replace(tmp, out)
            print(f"  escena {idx + 1}/{len(data['tl'])} lista", flush=True)
        b.close()

def render(data_path, outdir, audio_wav, out_mp4, workers=None, port=8791):
    data = json.load(open(data_path)); os.makedirs(outdir, exist_ok=True)
    data_rel = os.path.relpath(data_path, ROOT)
    srv = serve(port)
    n = len(data["tl"]); workers = workers or max(1, min(4, os.cpu_count() or 2))
    # balance by duration: longest scenes first, greedy assignment
    order = sorted(range(n), key=lambda i: -(data["tl"][i]["end"] - data["tl"][i]["start"]))
    buckets, loads = [[] for _ in range(workers)], [0.0] * workers
    for i in order:
        j = loads.index(min(loads)); buckets[j].append(i); loads[j] += data["tl"][i]["end"] - data["tl"][i]["start"]
    procs = [Process(target=worker, args=(sorted(bk), data_rel, data, outdir, port)) for bk in buckets if bk]
    for pr in procs: pr.start()
    for pr in procs: pr.join()
    srv.shutdown()
    missing = [i for i in range(n) if not os.path.exists(f"{outdir}/s{i:02d}.mp4")]
    if missing: raise RuntimeError(f"faltan escenas: {missing}")
    with open(f"{outdir}/list.txt", "w") as fh:
        for i in range(n): fh.write(f"file 's{i:02d}.mp4'\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{outdir}/list.txt", "-c", "copy", f"{outdir}/video.mp4"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{outdir}/video.mp4", "-i", audio_wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "44100", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out_mp4], check=True)
