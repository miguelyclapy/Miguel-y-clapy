import sys, io, base64, os
from PIL import Image
from playwright.sync_api import sync_playwright
# usage: stills.py <data_json_rel_to_engine> <outdir> name:frame ...
data, out = sys.argv[1], sys.argv[2]
port = os.environ.get("PORT", "8770")
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    pg.on("pageerror", lambda e: print("pageerror:", e)); pg.on("console", lambda m: print("console:", m.text) if m.type == "error" else None)
    pg.goto(f"http://127.0.0.1:{port}/engine/index.html?data={data}")
    pg.wait_for_function("window.READY === true", timeout=180000)
    for spec in sys.argv[3:]:
        name, f = spec.split(":")
        url = pg.evaluate(f"window.renderFrame({int(f)})")
        Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).save(f"{out}/{name}.jpg", quality=88)
    b.close()
