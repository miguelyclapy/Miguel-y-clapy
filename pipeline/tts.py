"""Voices: ElevenLabs (Liam = Miguel, Jessica = Clapy). One API call per line, cached by text."""
import os, hashlib, json, io, subprocess
import numpy as np, soundfile as sf, requests

VOICES = {"M": "TX3LPaxmHKxFdv7VOQHJ",   # Liam  - Miguel
          "C": "cgSgspJ2msm6clMCkdW9"}   # Jessica - Clapy
MODEL = os.environ.get("ELEVEN_MODEL", "eleven_multilingual_v2")
SR = 44100

def _eleven(text, voice):
    key = os.environ["ELEVENLABS_API_KEY"]
    r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
                      headers={"xi-api-key": key, "Content-Type": "application/json"},
                      json={"text": text, "model_id": MODEL, "language_code": "es",
                            "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}},
                      timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f"ElevenLabs {r.status_code}: {r.text[:300]}")
    wav = subprocess.run(["ffmpeg", "-v", "error", "-i", "-", "-ac", "1", "-ar", str(SR), "-f", "wav", "-"], input=r.content, capture_output=True, check=True).stdout
    a, _ = sf.read(io.BytesIO(wav)); return a

def _trim(a):
    thr = 0.02 * (np.abs(a).max() + 1e-9); idx = np.where(np.abs(a) > thr)[0]
    return a[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.08 * SR)] if len(idx) else a

def synth(ep, outdir, cache_dir="cache/voices"):
    os.makedirs(outdir, exist_ok=True); os.makedirs(cache_dir, exist_ok=True)
    meta = []
    for i, L in enumerate(ep["lines"]):
        voice = VOICES[L["who"]]; text = L.get("say", L["text"])
        h = hashlib.sha1(f"{voice}|{MODEL}|{text}".encode()).hexdigest()[:16]
        cp = os.path.join(cache_dir, h + ".wav")
        if os.path.exists(cp):
            a, _ = sf.read(cp)
        else:
            a = _trim(_eleven(text, voice)); sf.write(cp, a, SR)
        sf.write(os.path.join(outdir, f"{i:02d}.wav"), a, SR)
        hop = SR // 100
        rms = np.array([np.sqrt(np.mean(a[j:j + hop] ** 2)) for j in range(0, len(a), hop)])
        rms = rms / (np.percentile(rms, 95) + 1e-9)
        meta.append(dict(dur=len(a) / SR, env=np.clip(rms, 0, 1.2).round(3).tolist()))
        print(f"  voz {i:02d} {L['who']} {len(a)/SR:4.1f}s  {text}", flush=True)
    json.dump(meta, open(os.path.join(outdir, "meta.json"), "w"))
    return meta
