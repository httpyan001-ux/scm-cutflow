#!/data/data/com.termux/files/usr/bin/bash

OLD_ZIP="$HOME/storage/downloads/SCM_YOUTUBE_PRO_RECAP_FINAL (1).zip"
TMP_DIR="$HOME/tmp_old_scm_env"
NEW_ENV="$HOME/scm-cutflow/.env"

echo "📦 [1/3] အဟောင်း Zip ဖိုင်ကို ဖွင့်နေပါတယ်..."
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
unzip -q "$OLD_ZIP" -d "$TMP_DIR"

OLD_ENV_FILE=$(find "$TMP_DIR" -name ".env" | head -n 1)

if [ -z "$OLD_ENV_FILE" ]; then
  echo "❌ အဟောင်း .env ဖိုင် မတွေ့ပါ။ (Zip ထဲမှာ မပါဝင်နိုင်ပါ)"
  rm -rf "$TMP_DIR"
  exit 1
fi

echo "✅ [2/3] အဟောင်း .env ကို တွေ့ပါပြီ။ Key များကို ရှာနေပါတယ်..."

# OPENAI နဲ့ GEMINI ပါတဲ့ လိုင်းတွေကို ဆွဲထုတ်မယ်
KEYS=$(grep -E "^(OPENAI_API_KEY|OPENAI_MODEL|GEMINI_API_KEY|GEMINI_MODEL)=.+" "$OLD_ENV_FILE")

if [ -z "$KEYS" ]; then
  echo "⚠️ အဟောင်း .env ထဲမှာ API Key များ မတွေ့ပါ။"
  rm -rf "$TMP_DIR"
  exit 0
fi

echo "🔑 တွေ့ရှိတဲ့ Key များ -"
echo "$KEYS" | sed 's/=.*/=****** (Hidden)/'

# လက်ရှိ .env ထဲက Key အဟောင်းတွေကို ဖျက်မယ် (Duplicate မဖြစ်အောင်)
grep -vE "^(OPENAI_API_KEY|OPENAI_MODEL|GEMINI_API_KEY|GEMINI_MODEL)=" "$NEW_ENV" > "${NEW_ENV}.tmp"

# Key အသစ်တွေကို ထပ်ဖြည့်မယ်
echo "" >> "${NEW_ENV}.tmp"
echo "# --- Keys copied from Old Project ---" >> "${NEW_ENV}.tmp"
echo "$KEYS" >> "${NEW_ENV}.tmp"

mv "${NEW_ENV}.tmp" "$NEW_ENV"

echo "🎉 [3/3] အောင်မြင်ပါတယ်! Key များကို လက်ရှိ Project ထဲ ကူးထည့်ပြီးပါပြီ။"
rm -rf "$TMP_DIR"
