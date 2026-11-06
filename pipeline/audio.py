"""Mix: voices + lo-fi music bed (synthesised) + sound effects."""
import numpy as np, soundfile as sf, random, wave

SR = 44100

def mix(data, voice_dir, out_wav, seed=11):
    tl, total = data["tl"], data["total"]
    N = int((total + 0.2) * SR); voice = np.zeros(N); music = np.zeros(N); sfx = np.zeros(N)
    rnd = random.Random(seed); rng = np.random.default_rng(seed)
    def add(buf, t, sig):
        i = int(t * SR); j = min(N, i + len(sig))
        if 0 <= i < N: buf[i:j] += sig[: j - i]
    def env(n, a=0.006, r=0.5):
        t = np.arange(n) / SR; d = n / SR; e = np.minimum(1, t / a) * np.exp(-t / (d * r)); e[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR)); return e
    for L in tl:
        a, _ = sf.read(f"{voice_dir}/{L['i']:02d}.wav")
        add(voice, L["vstart"], a * (0.12 / (np.sqrt(np.mean(a ** 2)) + 1e-9)))
    crowd = (data.get("crowd") or {}).get("type")
    def bark(p):
        n = int(0.16 * SR); t = np.arange(n) / SR; f = (520 - 900 * t) * p; ph = 2 * np.pi * np.cumsum(f) / SR
        saw = 2 * ((ph / (2 * np.pi)) % 1) - 1; s = (np.tanh(3 * saw) * 0.6 + rng.normal(0, 0.3, n) * 0.4) * env(n, 0.004, 0.35)
        return np.convolve(s, np.ones(6) / 6, mode="same") * 0.55
    def pop(p):
        n = int(0.09 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (300 * p + 900 * np.exp(-t * 40)) * t) * env(n, 0.002, 0.3) * 0.35
    for L in tl:
        if L.get("excite"):
            for _ in range(9 if L["i"] == 0 else 14):
                t0 = L["start"] + rnd.uniform(0, 1.6 if L["i"] == 0 else 2.6) + (0 if L["i"] == 0 else 0.6)
                add(sfx, t0, (bark(rnd.uniform(0.8, 1.5)) if crowd == "dog" else pop(rnd.uniform(0.8, 1.6))) * rnd.uniform(0.4, 1.0))
    for L in tl[1:]:
        n = int(0.18 * SR); w = rng.normal(0, 1, n); w = np.convolve(w, np.ones(30) / 30, mode="same") * np.sin(np.linspace(0, np.pi, n)) * 0.05
        add(sfx, L["start"] - 0.06, w)
    def ding(f=1320):
        n = int(0.5 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 7) * 0.18
    for L in tl:
        if L.get("tag"): add(sfx, L["start"] + 0.05, ding()); add(sfx, L["start"] + 0.13, ding(1760))
        st = L.get("status")
        if isinstance(st, dict) and st.get("kind") == "stamp": add(sfx, L["start"] + 0.1, ding(990) * 1.4)
    CH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12); seg, t, ci = 2.82, 0.0, 0
    while t < total:
        n = int(seg * SR); tt = np.arange(n) / SR; e = np.minimum(1, tt / 0.25) * np.minimum(1, (seg - tt) / 0.4); s = np.zeros(n)
        for m in CH[ci % 4]: f = mtof(m); s += np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.4 * tt)) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)
        add(music, t, (s * 0.05 + np.sin(2 * np.pi * mtof(CH[ci % 4][0] - 12) * tt) * 1.4 * 0.06) * e)
        beat = 60 / 85
        for b in range(int(seg / beat * 2) + 1):
            bt = t + b * beat / 2
            if bt >= total: break
            if b % 4 == 0: kn = int(0.18 * SR); kt = np.arange(kn) / SR; add(music, bt, np.sin(2 * np.pi * (55 + 90 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 14) * 0.22)
            hn = int(0.04 * SR); h = np.diff(rng.normal(0, 1, hn), prepend=0); add(music, bt, h * np.exp(-np.arange(hn) / SR * 90) * 0.018)
        t += seg; ci += 1
    k = int(0.15 * SR); dk = np.convolve(np.abs(voice), np.ones(k) / k, mode="same"); dk = 1 - 0.45 * np.minimum(1, dk * 8)
    m = voice + music * dk * 0.75 + sfx * 0.8; fade = int(0.6 * SR); m[-fade:] *= np.linspace(1, 0, fade)
    m /= max(1e-9, np.abs(m).max()) / 0.89
    st = (np.stack([m, m], 1) * 32767).astype(np.int16)
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
