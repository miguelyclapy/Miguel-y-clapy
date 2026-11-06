"""Episode script + voice clips -> per-frame render data (timing, poses, mouths, excitement)."""
import json, math

FPS = 30
LEAD, TAILPAD = 0.15, 0.32

POSES = {
    "idle":       dict(la=(-14, -6), ra=(14, 6)),
    "arms_up":    dict(la=(-150, -170), ra=(150, 170)),
    "hands_head": dict(la=(-140, 115), ra=(140, -115)),
    "point":      dict(la=(-14, -6), ra=(88, 96)),
    "shrug":      dict(la=(-55, -125), ra=(55, 125)),
    "think":      dict(la=(-14, -6), ra=(25, 165)),
    "self":       dict(la=(-14, -6), ra=(35, -125)),
    "wave":       dict(la=(-14, -6), ra=(140, 175)),
    "cross":      dict(la=(-30, 70), ra=(30, -70)),
}

def ease(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def build(ep, voice_meta):
    """voice_meta: list of {dur, env} per line (env = RMS at 100 Hz, normalised)."""
    tl, t = [], 0.0
    for i, L in enumerate(ep["lines"]):
        vm = voice_meta[i]
        dur = LEAD + vm["dur"] + TAILPAD + L.get("tail", 0)
        tl.append(dict(i=i, start=t, end=t + dur, vstart=t + LEAD, env=vm["env"], **L))
        t += dur
    total = t
    def line_at(tt):
        for L in tl:
            if L["start"] <= tt < L["end"]: return L
        return tl[-1]
    def mouth(tt, who):
        v = 0.0
        for L in tl:
            if L["who"] != who or not (L["start"] - 0.2 <= tt <= L["end"]): continue
            j = int((tt - L["vstart"]) * 100); e = L["env"]
            if 0 <= j < len(e):
                a = max(e[max(0, j - 2):j + 3])
                v = max(v, min(1, a * 1.1) * (0.55 + 0.45 * abs(math.sin(tt * 2 * math.pi * 5.5))))
        return v
    frames = []
    for f in range(round(total * FPS)):
        tt = f / FPS; L = line_at(tt)
        prev = tl[L["i"] - 1].get("pose", "idle") if L["i"] > 0 else L.get("pose", "idle")
        k = ease((tt - L["start"]) / 0.28); A, B = POSES.get(prev, POSES["idle"]), POSES.get(L.get("pose", "idle"), POSES["idle"])
        la = [A["la"][j] + (B["la"][j] - A["la"][j]) * k for j in range(2)]
        ra = [A["ra"][j] + (B["ra"][j] - A["ra"][j]) * k for j in range(2)]
        jump = 0.0
        if L.get("pose") == "arms_up" and L["who"] == "M":
            jump = -abs(math.sin(min(1, (tt - L["start"]) / 0.35) * math.pi)) * 40
        ex = 0.0
        if L.get("excite"):
            ex = max(0.0, 1 - (tt - L["start"]) / 1.8) if L["i"] == 0 else min(1.0, (tt - L["start"]) / 0.6)
        frames.append(dict(t=round(tt, 4), i=L["i"], la=[round(x, 2) for x in la], ra=[round(x, 2) for x in ra],
                           jump=round(jump, 2), mm=round(mouth(tt, "M"), 3), mc=round(mouth(tt, "C"), 3), ex=round(ex, 3)))
    keep = ("i", "start", "end", "vstart", "who", "text", "shot", "pose", "face", "cface", "status", "tag", "excite")
    return dict(fps=FPS, total=total, room=ep.get("room", "cuarto"), time=ep.get("time", "night"),
                screen=ep.get("screen"), crowd=ep.get("crowd"), frames=frames,
                tl=[{k: L.get(k) for k in keep} for L in tl])
