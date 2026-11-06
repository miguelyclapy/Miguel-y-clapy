# Miguel y Clapy — video diario automático

Cada madrugada (3:17 a.m., hora de Ciudad de México) GitHub Actions:
1. toma el guion del día (`episodes/AAAA-MM-DD.json`, o el siguiente de `episodes/queue/`),
2. genera las voces con ElevenLabs (Liam = Miguel, Jessica = Clapy),
3. anima la escena 3D, le pone subtítulos y música,
4. publica el video como **Release** del repositorio, listo para descargar o subir a YouTube,
   con un archivo `_youtube.txt` que trae título, descripción y hashtags.

## Conexión (una sola vez)
1. Sube este proyecto a un repositorio **privado** de GitHub.
2. En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: `ELEVENLABS_API_KEY`
   - Valor: tu API key de ElevenLabs (créala solo con permiso *Text to Speech*).
3. En **Actions**, abre "Video diario Miguel y Clapy" y pulsa **Run workflow** para una prueba.
4. Para recibir aviso al celular: instala la app de GitHub y activa notificaciones de *Releases* (Watch → Custom → Releases).

## Estructura
- `engine/` escena 3D (three.js): casa (cuarto, sala, comedor, baño), Miguel, Clapy, utilería.
- `pipeline/` programa: `make_episode.py` (todo), `tts.py`, `timeline.py`, `audio.py`, `render.py`.
- `episodes/queue/` guiones en cola (se toman en orden). `episodes/done.txt` los ya hechos.
- `assets/avatar.json` aspecto de Miguel.

## Formato del guion
```json
{
  "room": "cuarto | sala | comedor | bano",
  "time": "day | night",
  "screen": {"title": "Paseos Miguel", "subtitle": "$80 MXN por paseo", "icon": "paw|cake|box|money|star"},
  "crowd": {"type": "dog|cake|box", "count": 17},   // opcional
  "youtube": {"title": "...", "description": "...", "hashtags": ["#shorts"]},
  "lines": [
    {"who": "M|C", "text": "...", "shot": "wide|m_cu|m_ms|c_cu|c_ms|screen",
     "pose": "idle|arms_up|hands_head|point|shrug|think|self|wave|cross",
     "face": "neutral|shock|angry|confused|sus|happy", "cface": "normal|happy|smug|shock",
     "status": null | {"text": "...", "kind": "progress|check|slots|stars|stamp", "note": "..."},
     "tag": "1/3 · Consejo", "excite": true, "tail": 2.5}
  ]
}
```

## Hacer un video a mano (local)
```
npm install && pip install -r requirements.txt && python -m playwright install chromium
ELEVENLABS_API_KEY=... python pipeline/make_episode.py --date 2026-11-06
```
