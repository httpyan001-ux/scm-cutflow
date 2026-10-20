# ⚡ GPU TURBO — Google Colab (Free T4) Render Worker

ပုံမှန် (normal) render = သင့် **VPS** ပေါ်။
**GPU TURBO** render = **Google Colab T4** ပေါ်။

## စတင်နည်း

1. **VPS `.env`** မှာ secret ထည့်ပါ
   ```env
   GPU_WORKER_SECRET=<long-random-string>
   ```
2. `SCM_CUTFLOW_GPU_Worker.ipynb` ကို Google Colab မှာ ဖွင့်ပါ
3. `Runtime → Change runtime type → T4 GPU`
4. Cell 1 မှာ `CUTFLOW_API` (သင့် VPS URL) နဲ့ **တူညီသော** `GPU_WORKER_SECRET` ထည့်ပါ
5. Run all → နောက်ဆုံး cell က worker ကို ဆက်တိုက် run ပေးမည်

## အလုပ်လုပ်ပုံ

```
⚡ GPU TURBO နှိပ် → VPS က credit ဖြတ် → task (lane=gpu, runner=colab)
        ↓ tunnel ရှိရင် /wake ping
Colab  POST /api/v1/worker/claim      ← job ဆွဲယူ
Colab  POST /api/v1/worker/progress   → % + stage + log stream
Colab  POST /api/v1/worker/complete   → ရလဒ် seal
```

- Request တိုင်းကို **HMAC-SHA256** (`X-Cutflow-Signature`) ဖြင့် လက်မှတ်ထိုးသည်
- Worker က heartbeat ပို့သည်; **၄၅ စက္ကန့်** အတွင်း ဘယ်သူမှ မယူရင် **VPS က အလိုအလျောက် ဆက်လုပ်** (user မပိတ်မိ)
- Worker သေသွားရင် lease (၂ မိနစ်) ကုန်ပြီးနောက် အခြား worker သို့မဟုတ် VPS က ပြန်ယူသည်

## API

| Endpoint | အလုပ် |
|---|---|
| `POST /api/v1/worker` | register + heartbeat |
| `GET /api/v1/worker` | fleet status (online/idle/busy/queued) |
| `POST /api/v1/worker/claim` | job ဆွဲယူ (atomic lease) |
| `POST /api/v1/worker/progress` | % · stage · log |
| `POST /api/v1/worker/complete` | result seal / error → VPS fallback |

## အစစ်အမှန် render ထည့်ရန်

`worker.py` ထဲ `render_job()` မှာ `time.sleep()` နေရာတွင် —
```python
subprocess.run(["ffmpeg","-hwaccel","cuda","-i",src,
                "-c:v","h264_nvenc","-preset","p4", out], check=True)
```
သို့မဟုတ် diffusers (upscale) · whisper (subs) · XTTS (mm-voice) ခေါ်ပါ။
