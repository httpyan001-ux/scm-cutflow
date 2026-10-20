// SCM CUTFLOW — User Guide content (Myanmar-first, beginner friendly)
// Faction visuals (logo glyph + colors) come from src/lib/factions.ts at render time.

export interface GuideFaction {
  slug: string;
  what: string;
  when: string;
  inputs: string[];
  steps: string[];
  tips: string[];
  output: string;
  costNote: string;
}

export const GUIDE_FACTIONS: GuideFaction[] = [
  {
    slug: "recap",
    what: "ဗီဒီယိုအရှည်ကြီးကို ၁–၃ မိနစ်အနှစ်ချုပ်အဖြစ် ချုံ့ပေးသည်။ အခန်း (chapter) ခွဲခြင်း၊ အဓိကအချက် ထုတ်ခြင်း၊ ၆၀ စက္ကန့် highlight rail ထုတ်ခြင်းတို့ အလိုအလုပ်လုပ်သည်။",
    when: "အတန်းစာသင်ခန်းမှတ်တမ်း၊ အစည်းအဝေးဗီဒီယို၊ ဗလော့ဂ်အရှည်၊ ပေါ့တ်ကတ်စ်တို့ကို အမြန်ပြန်ကြည့်ချင်သူများ။",
    inputs: ["ဗီဒီယိုဖိုင် — MP4 / MOV / WEBM (သို့) mic / စာသား", "⏱ Duration slider — ၃၀ စက္ကန့် မှ အများဆုံး ၁၀ မိနစ်", "▭ Aspect ratio — 9:16 / 16:9 / 1:1 / 3:4 / 4:3", "ရွေးစရာ — Recap style (Cinematic / Meeting / Lecture / Viral)"],
    steps: [
      "RECAP ဖွင့် → FILE / MIC / TEXT ထဲက တစ်ခုရွေးပြီး အရင်းအမြစ်ထည့်.",
      "SUMMARY IGNITE နှိပ် → transcript မှ bullets + chapters ထွက်လာမည် (key မလို).",
      "⏱ Duration slider ဆွဲ — ကြာချိန်စိတ်ကြိုက် (အများဆုံး ၁၀ မိနစ်)။ quick chip တွေနဲ့လည်း ရွေးလို့ရ.",
      "▭ Aspect ratio ရွေး — Reels ဆို 9:16၊ YouTube ဆို 16:9၊ feed ဆို 1:1.",
      "RENDER LANE မှာ ⬢ FORGE (PRO ∞ အခမဲ့) သို့ ⚡ GPU TURBO (+6 CR · ၂.၄× မြန်) နှိပ် → SRT/TXT/JSON export.",
    ],
    tips: ["အသံရှင်းတဲ့ဖိုင်ဆို အနှစ်ချုပ်ပိုတိကျသည်။ ဆူညံသံมากရင် အရင် UPSCALE/denoise စဉ်းစားပါ။", "Meeting ဆို Meeting minutes + 3-min digest၊ စာသင်ခန်းဆို Lecture chapters + 10-chapter map ရွေးပါ။", "အမြန်လိုရင် GPU TURBO — vault ထဲ CR ကြိုဖြည့်ထားပါ။"],
    output: "ရွေးထားသောကြာချိန် (≤10m) အတိအကျ + chapters + bullets + ရွေးထားသော aspect master.",
    costNote: "PRO ∞ အခမဲ့ (PRO member သာ) · ကြာချိန် ≤10m · GPU TURBO +6 CR",
  },
  {
    slug: "reel",
    what: "အလျားလိုက်ဗီဒီယိုကို ဒေါင်လိုက် 9:16 ရီးလ်အတို (TikTok / Reels / Shorts) အဖြစ် အလိုအဖြတ်ပေးသည်။ Hook score + face-track + word-pop စာတန်းပါ တစ်ခါတည်းထုတ်သည်။",
    when: "YouTube ဗီဒီယိုအရှည်ကို TikTok/Reels အတွက် အပိုင်းတိုဖြတ်ချင်သူများ၊ viral hook စမ်းချင်သူများ။",
    inputs: ["ဗီဒီယိုဖိုင် — landscape သို့ portrait", "ရွေးစရာ — Cuts to extract (3 viral / 5 rapid / 1 hero)", "ရွေးစရာ — Caption burn-in (MM+EN / MM only / EN only / none)"],
    steps: [
      "REEL စာမျက်နှာဖွင့် → ဗီဒီယိုဖိုင်ထည့် (အလျားလိုက်ဖိုင်ဆို အကောင်းဆုံး).",
      "ဖြတ်ချင်တဲ့အရေအတွက် ရွေး — စစချင်း 3 viral cuts စမ်းပါ.",
      "Caption ရွေး — မြန်မာပရိသတ်ဆို Burmese + English dual အကြံပြု.",
      "⬢ IGNITE (PRO ∞) သို့မဟုတ် ⚡ GPU TURBO (+6 CR) နှိပ်.",
      "Result မှာ R1/R2/R3 + hook စာသား + virality score စစ် → ကြိုက်တာကို EXPORT.",
    ],
    tips: ["မျက်နှာပါတဲ့အခန်း (talking head) က face-track အကောင်းဆုံးအလုပ်လုပ်သည်။", "Hook စာသား ၃ စက္ကန့်အတွင်းဖမ်းမိမှ viral score 90+ ရသည်။", "Caption မီးစိမ်းမှ Reels မှာ retention တက်သည်။"],
    output: "ရီးလ် ၃ ပုဒ် (R1 32s / R2 27s / R3 41s) + viral score + caption pack.",
    costNote: "PRO ∞ အခမဲ့ · GPU TURBO +6 CR",
  },
  {
    slug: "mm-voice",
    what: "၁၀ စက္ကန့်အသံနမူနာကနေ မြန်မာအသံပွားခြင်း၊ စာသား→အသံ (TTS)၊ dubbing လုပ်ပေးသည်။ မြန်မာသံစဉ် + အသံထွက် တိကျအောင်ထိန်းသည်။",
    when: "ကိုယ့်အသံမသုံးချင်ဘဲ မြန်မာနောက်ခံစကားပြောထည့်ချင်သူများ၊ သတင်း/စာရွက်ကို အသံဖိုင်ပြောင်းချင်သူများ။",
    inputs: ["အသံ/ဗီဒီယိုဖိုင် (MP3/WAV/M4A/MP4) — မရှိလဲ ရသည်", "ရွေးစရာ — Voice vault (Aung / Thiri / Ko Tex / Daw Hla)", "စာသား box — မြန်မာ/English စာသား (ဥပမာ မင်္ဂလာပါ…)"],
    steps: [
      "MM VOICE ဖွင့် → ဖိုင်ရှိရင်ထည့်၊ မရှိရင် စာသားပဲရိုက်ထည့်.",
      "Voice vault ရွေး — နမူနာနားထောင်သလို စိတ်ကူးရွေး (Thiri = နွေးထွေးသော မိန်းကလေးအသံ).",
      "Script box မှာ ပြောစေချင်တဲ့စာသား ရိုက်ထည့်/ကူးထည့်.",
      "⬢ IGNITE (PRO ∞) သို့မဟုတ် ⚡ GPU TURBO (+6 CR) နှိပ်.",
      "Result မှာ transcript + dub tracks (dry vocal / broadcast / room match) စစ် → WAV export.",
    ],
    tips: ["စာသားတိုတို (၁–၂ ကြောင်း) နဲ့အရင်စမ်းပါ — သံစဉ်မှန်မမှန်ကြားရမည်။", "။ သတ်ပုံနဲ့ , ခြားတာက အသံရပ်နားကို ထိန်းသည်။", "Podcast လို ရှည်ရင် အပိုင်းခွဲထုတ်ပါ။"],
    output: "47s master (48kHz) + tone-lock 99.2% + stem ၃ ခု + WAV download.",
    costNote: "PRO ∞ အခမဲ့ · GPU TURBO +6 CR",
  },
  {
    slug: "subs",
    what: "ဗီဒီယိုအသံကို စာသားအဖြစ်ပြောင်း (speech-to-text) + အချိန်ကိုက် စာတန်းထိုးပေးသည်။ မြန်မာစာ ပုံပျက်ခြင်း/ဖြတ်တောက်ခြင်းမရှိအောင် line-height 1.7 နဲ့ထုတ်သည်။",
    when: "မြန်မာစာတန်းထိုးဗီဒီယို လိုချင်သူများ၊ dual-language (MM+EN) ထုတ်ချင်သူများ။",
    inputs: ["ဗီဒီယိုဖိုင် — MP4/MOV/WEBM", "ရွေးစရာ — Subtitle target (MM / EN / MM+EN dual / TH+MM)", "ရွေးစရာ — Burn-in style (karaoke / lower-third / word-pop)"],
    steps: [
      "SUBS ဖွင့် → ဗီဒီယိုဖိုင်ထည့်.",
      "Target ရွေး — မြန်မာပရိသတ်အများစုအတွက် Burmese + English dual.",
      "Style ရွေး — viral ဆို word-pop၊ သန့်ချင်ရင် minimal lower-third.",
      "⬢ IGNITE (PRO ∞) သို့မဟုတ် ⚡ GPU TURBO (+5 CR) နှိပ်.",
      "Result မှာ cue ၃၁၂ ခု + alignment 99.1% စစ် → SRT export / burn-in master.",
    ],
    tips: ["အသံကြည်ရင် cue တိကျမှု 99%+ ရသည်။", "Karaoke style က သီချင်း/စာသင်ဗီဒီယိုနဲ့လိုက်၊ word-pop က Reels နဲ့လိုက်.", "မြန်မာစာလုံးကွဲရင် font ကို Pyidaungsu/Noto Myanmar စစ်ပါ။"],
    output: "312 cues + 99.1% alignment + SRT + burn-in master.",
    costNote: "PRO ∞ အခမဲ့ · GPU TURBO +5 CR",
  },
  {
    slug: "upscale",
    what: "ဝါးသောရုပ်/ဗီဒီယိုကို AI super-resolution နဲ့ 2X/4X ကြည်လင်အောင်မြှင့်သည်။ denoise + deblur + relight တစ်ခါတည်းလုပ်ပြီး အသားအရေအစစ်အတိုင်းထိန်းသည်။",
    when: "ဖုန်းဟောင်းရုပ်တွေ၊ archive footage၊ 720p ကို 4K လိုချင်သူများ။",
    inputs: ["ဗီဒီယို/ပုံ — MP4/PNG/JPG/WEBP", "ရွေးစရာ — Scale (2X balanced / 4X maximum)", "ရွေးစရာ — Enhance mode (Cinematic / Anime / Archive)"],
    steps: [
      "UPSCALE ဖွင့် → ဖိုင်ထည့် (preview မှာ resolution HUD စစ်).",
      "Scale ရွေး — စမ်းချင်ရင် 2X၊ အပြီးထုတ်ချင်ရင် 4X.",
      "Mode ရွေး — လူပုံဆို Cinematic restore၊ ကာတွန်းဆို Anime sharp.",
      "⬢ IGNITE (PRO ∞) သို့မဟုတ် ⚡ GPU TURBO (+8 CR၊ 4K အတွက်အကြံပြု) နှိပ်.",
      "Result မှာ from→to + PSNR + faces restored စစ် → MP4 export.",
    ],
    tips: ["4X က အချိန်ပိုကြာ — GPU TURBO နဲ့ဆို ၂.၄× မြန်သည်။", "Archive ဟောင်းဆို Archive denoise ရွေးပါ။", "မျက်နှာ ၁၄/၁၄ restored ပေါ်မှ အပြည့်အဝ."],
    output: "720p→1440p/4K + PSNR +6.4dB + faces 14/14 + MP4 master.",
    costNote: "PRO ∞ အခမဲ့ · GPU TURBO +8 CR",
  },
  {
    slug: "news",
    what: "ခေါင်းစဉ်တစ်ကြောင်းပေးရုံနဲ့ သတင်းဗီဒီယိုအပြည့်အစုံထုတ်ပေးသည် — anchor + b-roll + lower-thirds + ticker crawl အလိုအပါ။",
    when: "နေ့စဉ်သတင်းအကျဉ်း၊ page အတွက် breaking video၊ explainer လိုချင်သူများ။ ဖိုင်မလိုပါ။",
    inputs: ["Headline စာသား (ဖိုင်မလို)", "ရွေးစရာ — Broadcast tone (Breaking / Evening digest / Explainer)"],
    steps: [
      "NEWS ဖွင့် → Headline box မှာ သတင်းခေါင်းစဉ်ရိုက်.",
      "Tone ရွေး — အရေးပေါ်ဆို Breaking-urgent၊ ညနေဆို Evening-calm.",
      "⬢ ပုံမှန် Generate (15 CR) သို့မဟုတ် ⚡ GPU TURBO (15+8=23 CR၊ ၂.၄× မြန်) နှိပ်.",
      "CR မရှိရင် Credit slider ပွင့်မည် — ဝယ်ပြီးမှ ဆက်လုပ်.",
      "Result မှာ anchor script + rundown (00:00/00:12/00:34/00:52) စစ် → MP4 export.",
    ],
    tips: ["ခေါင်းစဉ်တိုတိုရှင်းရှင်း (၁၀–၁၅ လုံး) က anchor script ပိုကောင်း.", "Explainer ရွေးရင် နက်နက်နဲနဲရှင်းပြချက် ပိုရသည်။", "Ticker စာသားကို result မှာ ပြန်စစ်ပါ။"],
    output: "Broadcast master + anchor script ၃ ပိုဒ် + rundown + MP4.",
    costNote: "15 CR / run · GPU TURBO +8 CR (စုစုပေါင်း 23 CR)",
  },
  {
    slug: "url-recap",
    what: "ဆောင်းပါး link တစ်ခုပေးရုံနဲ့ ၆၂ စက္ကန့်ဗီဒီယိုအနှစ်ချုပ်ထုတ်ပေးသည် — အဓိကအချက် + ကိုးကားချက် + အသံထွက်အပါ။",
    when: "ရှည်တဲ့ဆောင်းပါးကို ဗီဒီယိုအတိုလုပ်ချင်သူများ၊ research digest လိုချင်သူများ။",
    inputs: ["Article URL (https://…)", "ရွေးစရာ — Narrator (Burmese female/male / English neutral)"],
    steps: [
      "URL RECAP ဖွင့် → ဆောင်းပါး link ကူးထည့်.",
      "Narrator ရွေး — မြန်မာလို Burmese female အကြံပြု.",
      "ပုံမှန် (10 CR) သို့မဟုတ် ⚡ GPU TURBO (10+6=16 CR) နှိပ်.",
      "Result မှာ claims ၈ + quotes ၅ + reading-time (12-min→62s) စစ်.",
      "Chapter cards + source links နဲ့ MP4 export.",
    ],
    tips: ["Paywall/link ပျက်နေရင် scrape မရပါ — link အရင်ဖွင့်စစ်ပါ။", "Counterpoint ထိန်းထားတာကို result မှာ စစ်ပါ။", "English ဆောင်းပါးဆို MM narrator ရွေးလဲ မြန်မာလိုပြောပေးသည်။"],
    output: "62s digest + claims/quotes + chapter cards + MP4.",
    costNote: "10 CR / run · GPU TURBO +6 CR (စုစုပေါင်း 16 CR)",
  },
  {
    slug: "yt-pro",
    what: "★ PREMIUM CREDIT FLAGSHIP — YouTube link ပေးရုံနဲ့ thumbnail preview + retention scan + hook mining + 4K relight လုပ်ပြီး ပြန်တင်လို့ရတဲ့ cut ထုတ်ပေးသည်။ Duration slider နဲ့ နာရီဝက် (၃၀ မိနစ်) ထိ သတ်မှတ်နိုင်ပြီး ကြာချိန်အလိုက် tier ဈေးနှုန်းဖြတ်သည်။",
    when: "YouTube ဗီဒီယိုရှည်ကို highlight / chapter map / 4K repost cut လုပ်ချင်သူများ — ကြာချိန်အတိအကျလိုသူများ။",
    inputs: ["YouTube URL (youtube.com / youtu.be) — thumbnail auto preview", "⏱ Duration slider — ၁ မိနစ် မှ အများဆုံး ၃၀ မိနစ် (နာရီဝက်)", "▭ Aspect ratio — 9:16 / 16:9 / 1:1 / 3:4 / 4:3", "ရွေးစရာ — Task (Highlight pack / Chapters+summary / 4K upscale)"],
    steps: [
      "YT PRO ဖွင့် → link ကူးထည့် → thumbnail ပေါ်လာရင် link မှန်ပြီ.",
      "⏱ Duration slider ဆွဲ — ကြာချိန်ပေါ်မူတည်ပြီး tier ပြောင်းသည်: ≤5m = 12 CR · ≤10m = 18 CR · ≤20m = 28 CR · ≤30m = 40 CR.",
      "▭ Aspect ratio ရွေး (၅ မျိုး) + Task ရွေး.",
      "Invoice bar မှာ စုစုပေါင်း CR စစ် → ⬢ GENERATE (ပုံမှန်) သို့ ⚡ GPU TURBO (+7 CR · ၂.၄× မြန်).",
      "Cinema-reel reactor (radar sweep + film strip + EQ) နဲ့ progress ကြည့် → SEALED ဖြစ်ရင် chapters + retention + EXPORT.",
    ],
    tips: ["ကြာချိန်တိုလေ CR သက်သာလေ — စမ်းချင်ရင် ၅ မိနစ်အောက် (12 CR) နဲ့အရင်စမ်းပါ။", "Private link ဆွဲမရ — public/unlisted သာ။", "၂၀ မိနစ်အထက်ဆို GPU TURBO နဲ့လုပ်မှ အချိန်ကုန်သက်သာသည်။"],
    output: "Tier master (≤30m) + chapters + retention report + 4K polish + aspect-matched MP4.",
    costNote: "Tier ဈေး — ≤5m 12 · ≤10m 18 · ≤20m 28 · ≤30m 40 CR · GPU TURBO +7 CR",
  },
  {
    slug: "doc-translate",
    what: "PDF/DOCX/PPTX ကို မြန်မာဘာသာပြန်ပြီး ဆလိုက်ဗီဒီယိုအဖြစ် ပြန်ဖန်တီးပေးသည် — စာမျက်နှာပုံပျက်မရှိ + အသံထွက်အပါ။",
    when: "English စာရွက်ကို မြန်မာဆလိုက် + နောက်ခံစကားပြောနဲ့ ရှင်းပြချင်သူများ (သင်တန်း/အစည်းအဝေး).",
    inputs: ["စာရွက်ဖိုင် — PDF/DOCX/PPTX (50MB အထိ)", "ရွေးစရာ — Language pair (EN→MM / MM→EN / CN→MM / TH→MM)", "ရွေးစရာ — Voiceover (on/off)"],
    steps: [
      "DOC TRANSLATE ဖွင့် → စာရွက်ဖိုင်ထည့် (parsed & staged ပေါ်ရင် ဝင်ပြီ).",
      "Language pair ရွေး — အများစုအတွက် EN→MM.",
      "Voiceover on ထားပါ — မြန်မာအသံထွက်အလိုအပါ.",
      "ပုံမှန် (8 CR) သို့မဟုတ် ⚡ GPU TURBO (8+5=13 CR) နှိပ်.",
      "Result မှာ slide ၉ ခု (cover/terms/CTA) + glossary စစ် → MP4 export.",
    ],
    tips: ["ဇယား/ပုံများရင် re-flow စစ်ပါ။", "မြန်မာစာလုံးကွဲရင် Noto Myanmar + line-height 1.7 စစ်.", "စာမျက်နှာ ၅၀+ ဆို အပိုင်းခွဲတင်ပါ။"],
    output: "18p → 9 slides + glossary + VO + MP4.",
    costNote: "8 CR / run · GPU TURBO +5 CR (စုစုပေါင်း 13 CR)",
  },
  {
    slug: "knowledge",
    what: "🌐 WEB DISCOVERY ENGINE — ခလုပ်နှိပ်တာနဲ့ အင်တာနက်ပေါ်ရှိ ဗဟုသုတဝက်ဘ်ဆိုက်များမှ စိတ်ဝင်စားဖွယ် အချက်အလက် ၁၀ ခုကို ရှာဖွေစုစည်းပေးသည်။ သင်ကြိုက်နှစ်သက်ရာ ၅ ခုရွေး၍ CONFIRM နှိပ်လိုက်ရုံဖြင့် Script ရေး → အသံသွင်း → ဓာတ်ပုံတွဲ → Caption #@ ထည့်ပြီး ၁ မိနစ်ကျော် ဗီဒီယို ထုတ်ပေးသည်။",
    when: "ဗဟုသုတ/သိကောင်းစရာ content ထုတ်သူများ၊ Facebook / TikTok page ပိုင်ရှင်များ၊ နေ့စဉ် fact video တင်ချင်သူများ။",
    inputs: ["Topic စာသား (ဥပမာ space / ဦးနှောက် / မြန်မာ့သမိုင်း) — ဖိုင်မလို", "✅ ရှာတွေ့သော ၁၀ ခုမှ ၅ ခု ရွေးချယ်မှု", "▭ Aspect ratio — 9:16 / 16:9 / 1:1 / 3:4 / 4:3", "🎙 Narrator အသံ ရွေးချယ်မှု"],
    steps: [
      "KNOWLEDGE ဖွင့် → Topic ရိုက်ထည့် (သို့) preset chip တစ်ခုနှိပ်ပါ.",
      "🌐 START နှိပ် → အင်တာနက်မှ ဗဟုသုတ ၁၀ ခု scan လုပ်ပြီး ပုံ + source နဲ့အတူ ပြမည်.",
      "စိတ်ဝင်စားရာ ၅ ခုကို tap ၍ ရွေးပါ (counter 5/5 ပြည့်ရမည်).",
      "Aspect ratio + narrator အသံရွေး → GPU TURBO လိုရင် ဖွင့်ပါ.",
      "✓ CONFIRM နှိပ် → Script → Voice → Image → Caption → Video ၅ ဆင့် reactor ဖြင့်ထုတ် → EXPORT (Video package / Caption #@ / Script / Timestamp).",
    ],
    tips: ["Topic တိကျလေ ရလဒ်ကောင်းလေ — “ocean science” က “science” ထက်ပိုကောင်း။", "၉:၁၆ က TikTok/Reels၊ ၁၆:၉ က YouTube အတွက် အကောင်းဆုံး။", "Caption #@ ကို COPY နှိပ်ပြီး တင်တဲ့အခါ တန်းကူးထည့်လို့ရသည်။"],
    output: "၁ မိနစ်ကျော် narrated ဗီဒီယို + scene ၇ ခု + ဓာတ်ပုံများ + Caption #@ + Timestamp + Script .txt",
    costNote: "5 CR / run · GPU TURBO +4 CR (စုစုပေါင်း 9 CR)",
  },
  {
    slug: "copyright",
    what: "🛡 CLAIM RADAR — တင်မယ့်ဗီဒီယိုကို YouTube · Meta · TikTok ၏ ၂၀၂၆ မူဝါဒအလိုက် အချက် ၈ ချက် (အသံလက်ဗွေ · ရုပ်ပုံ pHash · သီချင်းလိုင်စင် · မူရင်းအပိုင်းအချိုး · ပြုပြင်ဖန်တီးမှု · ကိုးကားချက် · မက်တာဒေတာ · watermark) ဖြင့် စစ်ဆေးပြီး claim ခံရနိုင်ခြေ၊ platform အလိုက် ရမှတ်၊ monetization ဖြစ်နိုင်ခြေနှင့် ပြင်ဆင်နည်းများ ပြပေးသည်။ စကင်ဖတ်ခြင်းမှာ အခမဲ့ဖြစ်သည်။",
    when: "Re-upload / reaction / recap content တင်သူများ၊ claim ခံရမှာ စိုးရိမ်သူများ၊ monetization ထိန်းချင်သူများ။",
    inputs: ["ဗီဒီယိုဖိုင် (optional) သို့ ခေါင်းစဉ်", "🛡 Shield level — off / standard / aggressive / maximum", "အချက်အလက် toggle — သီချင်းပါ/မပါ၊ မှတ်ချက်၊ ကိုးကားချက်၊ အသံပြန်သွင်း၊ လိုဂိုဖယ်", "စုစုပေါင်းကြာချိန် + အရှည်ဆုံးအပိုင်း (စက္ကန့်)"],
    steps: [
      "COPYRIGHT CHECKER ဖွင့် → ဗီဒီယိုရွေး (သို့) ခေါင်းစဉ်ရိုက်.",
      "Shield level ရွေး — RECAP မှာ သုံးခဲ့သည့်အဆင့်နှင့် တူအောင်ထားပါ.",
      "Toggle များ မှန်အောင်ဖွင့်/ပိတ် — သီချင်းပါလား၊ မှတ်ချက်ထည့်ထားလား.",
      "🛡 SCAN နှိပ် → radar စကင်ဖတ်မှု ၆ ဆင့် ပြပြီး အဖြေထွက်မည်.",
      "SAFE / REVIEW / RISK + platform ရမှတ် + ပြင်ဆင်နည်းများ ကြည့် → report .txt ထုတ်ယူပါ.",
    ],
    tips: ["Shield = maximum + အသံပြန်သွင်း ဆိုရင် ရမှတ် အမြင့်ဆုံးရသည်။", "မူရင်းအပိုင်းကို စုစုပေါင်း၏ ၁၀% / ၃၀ စက္ကန့် အောက်ထားပါ။", "ကိုယ်ပိုင်မှတ်ချက် ထည့်တာက fair use အတွက် အခိုင်မာဆုံး အချက်ဖြစ်သည်။"],
    output: "SAFE/REVIEW/RISK verdict + 0–100 ရမှတ် + platform ၃ ခု score + signal ၈ ချက် + ပြင်ဆင်နည်း + fingerprint + report .txt",
    costNote: "Scanner = အခမဲ့ (FREE) · faction task အဖြစ်ထုတ်ရင် 3 CR · GPU +3 CR",
  },
  {
    slug: "voice-clone",
    what: "🎙 VOICEPRINT ENGINE — mic ဖြင့် ၁၀–၆၀ စက္ကန့် အသံသွင်းပါ (သို့) အသံဖိုင်တင်ပါ။ စနစ်က quality score · SNR · pitch · timbre ပါသော voiceprint ဖန်တီးပြီး စာသားမှန်သမျှကို အဲဒီအသံအတိုင်း ခံစားချက် ၆ မျိုး (ပုံမှန် · ပျော်ရွှင် · လေးနက် · ဝမ်းနည်း · စိတ်လှုပ်ရှား · အေးဆေး) ဖြင့် ပြောပေးသည်။ Pitch ±12 နှင့် speed 0.5–1.6× ကိုလည်း ချိန်နိုင်သည်။",
    when: "ကိုယ့်အသံနဲ့ narration လုပ်ချင်သူများ၊ အသံမကောင်းချိန် content ဆက်ထုတ်ချင်သူများ၊ audiobook / podcast / dubbing လုပ်သူများ။",
    inputs: ["🎙 Mic အသံသွင်း (၁၀–၆၀ စက္ကန့်) သို့ အသံဖိုင် (MP3/WAV/M4A/MP4)", "◆ သို့မဟုတ် Vault voice ၆ ခုမှ ရွေးချယ်မှု", "📝 ပြောစေချင်သော စာသား (၁,၅၀၀ လုံးအထိ)", "☺ ခံစားချက် + pitch + speed + ဘာသာစကား"],
    steps: [
      "VOICE CLONE ဖွင့် → MIC / FILE / VAULT ထဲက တစ်ခုရွေးပါ.",
      "MIC ဆို ◉ ခလုပ်နှိပ်၍ ပုံမှန်အတိုင်း စကားပြောပါ — ၂၀–၄၅ စက္ကန့် အကောင်းဆုံး.",
      "ရပ်လိုက်တာနဲ့ voiceprint quality score (0–100) ထွက်လာမည် — အနီဆို ပြန်သွင်းပါ.",
      "စာသားရိုက်ထည့် → ခံစားချက်ရွေး → pitch/speed ချိန်ပါ.",
      "🎙 CLONE & SPEAK နှိပ် → ၅ ဆင့် reactor ဖြင့်ထုတ် → SRT · Script · Caption #@ export.",
    ],
    tips: ["တိတ်ဆိတ်သောအခန်းတွင် သွင်းပါ — SNR မြင့်လေ clone တိကျလေ။", "နမူနာတွင် စာကြောင်းအမျိုးမျိုး ဖတ်ပေးပါ (မေးခွန်း · ပုံမှန် · အာမေဋိတ်)။", "Emotion ပြောင်းရင် pitch/speed အလိုအလျောက် ညှိပေးသည် — manual slider က အပိုချိန်ရန်။"],
    output: "48kHz · 24-bit master + stem ၄ ခု + tone-lock % + line timestamps + SRT + Caption #@",
    costNote: "7 CR / run · GPU TURBO +5 CR (စုစုပေါင်း 12 CR) · voiceprint စစ်ဆေးမှု အခမဲ့",
  },
  {
    slug: "magic",
    what: "✨ MAGIC REEL AI — ဆာဗာထဲက Telegram Clip library (FUNNY / Accident CCTV) ကို အလိုအလျောက် စကင်ဖတ်ပြီး clip အတိုများကို random ဆွဲ၊ scene detect + hook ranking + audio sync လုပ်ကာ ၁ မိနစ်ဝန်းကျင် viral short တစ်ပုဒ်အဖြစ် ခလုပ်တစ်ချက်နှိပ်ရုံဖြင့် ထုတ်ပေးသည်။ ဖိုင်တင်စရာ မလိုပါ။",
    when: "နေ့စဉ် content အမြန်လိုသူများ၊ Telegram မှ clip စုထားသူများ၊ FUNNY / CCTV page ပိုင်ရှင်များ။",
    inputs: ["ဆာဗာထဲ Telegram Clip/FUNNY သို့ Telegram Clip/Accident(CCTV) ဖိုင်များ (ကြိုတင်ထည့်ထား)", "😂 FUNNY သို့ ⚠️ ACCIDENT ရွေးချယ်မှု", "⏱ ကြာချိန် 45 / 60 / 75 စက္ကန့်", "⚡ GPU TURBO (optional, +4 CR)"],
    steps: [
      "Dashboard ဖွင့်တာနဲ့ အပေါ်ဆုံးမှာ MAGIC REEL AI ကတ် မြင်ရမည်.",
      "😂 FUNNY သို့ ⚠️ ACCIDENT category တစ်ခုရွေးပါ — clip အရေအတွက် အောက်မှာပြသည်.",
      "ကြာချိန် (45/60/75s) ရွေး → အမြန်လိုရင် ⚡ GPU ဖွင့်ပါ.",
      "⚡ ONE-CLICK GENERATE နှိပ် → scanning → scene detect → hook rank → audio sync → stitch.",
      "ပြီးရင် clip timeline + viral score ကြည့် → Caption #@ · Script · Timestamp export လုပ်ပါ.",
    ],
    tips: ["clip တစ်ခုချင်း ၃–၂၅ စက္ကန့် ဖြစ်ရင် အကောင်းဆုံး။", "ဖိုင်နာမည်မှာ အကြောင်းအရာထည့်ထားရင် label ပိုလှသည် (ဥပမာ cat-fail-funny.mp4)။", "clip မရှိသေးရင် demo pool နဲ့ စမ်းကြည့်လို့ရသည်။"],
    output: "၁ မိနစ်ဝန်းကျင် 9:16 viral short + clip timeline + transition list + viral score + Caption #@",
    costNote: "PRO ∞ အခမဲ့ · GPU TURBO +4 CR",
  },
];

export interface GuideStep {
  n: string;
  title: string;
  my: string;
  body: string;
}

export const GUIDE_START: GuideStep[] = [
  { n: "01", title: "Profile ဖွင့်", my: "ကိုယ်ဘယ်သူလဲ သတ်မှတ်", body: "ညာအပေါ် avatar → Profile tab မှာ နာမည် + ကိုယ်ပွား + နောက်ခံရွေး → SAVE PROFILE. ဒါမှ hero + reactor က သင့်အရောင်နဲ့လင်းမည်။" },
  { n: "02", title: "PRO သို့မဟုတ် Credit ရွေး", my: "ငွေချေစနစ် နားလည်", body: "Tool ၅ မျိုး (RECAP/REEL/VOICE/SUBS/UPSCALE) က PRO ∞ အခမဲ့။ ကျန် ၅ မျိုးက Credit (5–15 CR)။ Profile → PRO / Credits tab မှာ KBZPay/WavePay/Card နဲ့ဝယ်။ BYOK toggle ဖွင့်ရင် −40% သက်သာသည်။" },
  { n: "03", title: "Tool ရွေး + ဖိုင်ထည့်", my: "HEX aperture ထဲ ကျွေး", body: "Deck က tool ကတ်နှိပ် → HEX-INGESTION APERTURE ထဲ ဖိုင်ထည့် (သို့မဟုတ် NEWS/URL/YT ဆို စာသား/link ရိုက်)။ Preview + duration HUD ပေါ်မှ ဆက်လုပ်။" },
  { n: "04", title: "Lane ရွေး — Normal / GPU", my: "မြန်ချင်လား ခြွေတာချင်လား", body: "⬢ IGNITE = ပုံမှန် (PRO ∞ / base CR)။ ⚡ GPU TURBO = ၂.၄× မြန်၊ vault က +4–8 CR ဖြတ်။ CR မရှိရင် BUY CR ဖြစ်ပြီး slider ပွင့်မည်။" },
  { n: "05", title: "Result စစ် + Export", my: "ရလဒ်သိမ်း ပြန်သုံး", body: "Reactor 100% → LEGENDARY DROP frame မှာ chapters/bullets/slides စစ် → EXPORT (SRT/TXT/JSON/MP4)။ History/Ledger မှာ အမြဲပြန်ကြည့်လို့ရ။" },
];

export const GUIDE_PIPELINE: GuideStep[] = [
  { n: "INGEST", title: "Hex Ingestion", my: "သွင်းယူခြင်း", body: "ဖိုင်/link/စာသား လက်ခံ → preview + duration/resolution HUD + PURGE. 150–196px mobile-friendly, single-tap picker + drag-drop." },
  { n: "WEAVE", title: "Neural Weave", my: "AI ရက်လုပ်ခြင်း", body: "Cloud (key ရှိရင်) သို့မဟုတ် Offline forge (key မရှိရင်) က chapters/bullets/captions ရက်လုပ်သည်။ Error တက်လဲ fallback ပြန်ကျ — မပျက်။" },
  { n: "RENDER", title: "Plasma Render", my: "ပုံဖော်ခြင်း", body: "CPU-FORGE (ပုံမှန်) သို့မဟုတ် GPU-TURBO (၂.၄× မြန်၊ +CR) lane နဲ့ render. Progress ring + stage banner + streaming log တိုက်ရိုက်ပြ။" },
  { n: "SEAL", title: "Legendary Seal", my: "တံဆိပ်ခတ်ခြင်း", body: "100% ရောက်ရင် holo rarity frame + ember storm + master sealed. Lane (CPU/GPU) + prompt + download အမြဲပါ။" },
  { n: "LEDGER", title: "Forge Ledger", my: "မှတ်တမ်းသိမ်းခြင်း", body: "Job တိုင်း History/Ledger + Stats matrix မှာသိမ်း — cost, status, progress, input. ⚡ GPU badge နဲ့ခွဲ." },
];

export const GUIDE_FAQ = [
  { q: "ဘယ်ကနေစရမလဲ — ဘာမှမသိဘူး", a: "Profile ဖွင့် → PRO (STANDARD) သို့မဟုတ် Credit 50 ဝယ် → RECAP မှာ SAMPLE နှိပ် → SUMMARY IGNITE. ၁ မိနစ်အတွင်း ရလဒ်မြင်ရမည်။ အသေးစိတ်ကို အောက်က Start Here checklist အတိုင်းလုပ်။" },
  { q: "PRO နဲ့ Credit ဘာကွာလဲ?", a: "PRO = လစဉ်ကြေး (15,000/39,000/129,000 Ks)၊ Tool ၅ မျိုး ∞ အခမဲ့။ Credit = တစ်ခါသုံးခွ (5–15 CR/run)၊ ကျန် ၅ မျိုးအတွက်။ BYOK toggle ဖွင့်ရင် PRO −40% (ကိုယ့် API key သုံး)။ GPU TURBO က ဘယ် tool မဆို +4–8 CR ထပ်ဖြတ်။" },
  { q: "API Key မရှိဘဲ ရလား?", a: "ရသည်။ Key မရှိရင် Offline forge auto — mic speak-to-text + local အနှစ်ချုပ်။ Key ဖြည့် (Profile → API သို့မဟုတ် .env OPENAI_API_KEY) တာနဲ့ cloud ကို auto အဆင့်မြှင့်။ Key မှားလဲ fallback ပြန်ကျ — app မပျက်။" },
  { q: "GPU TURBO က ဘာလဲ — ဘယ်တော့သုံးရမလဲ?", a: "Render ကို ၂.၄× မြန်အောင်လုပ်တဲ့ lane။ အမြန်လိုရင် (breaking news, 4K upscale, live event) သုံး။ Vault CR ကနေဖြတ် (+4–8)။ CR မရှိရင် ခလုတ် BUY CR ဖြစ်ပြီး slider ပွင့်မည်။ ပုံမှန်အလုပ် IGNITE နဲ့လုံလောက်သည်။" },
  { q: "302/402 error — PRO_REQUIRED / INSUFFICIENT_CREDITS?", a: "PRO_REQUIRED = PRO Zone tool ကို FREE အကောင့်နဲ့ခေါ်မိတာ → Profile → PRO payment card ဖွင့်။ INSUFFICIENT_CREDITS = vault CR မလောက် → Credit slider ဝယ်။ GPU error ဆို base+GPU စုစုပေါင်း (ဥပမာ 15+8=23) လိုကြောင်း message မှာပြ။" },
  { q: "မြန်မာစာပျက်တယ် / line-height ကပ်တယ်?", a: "Noto Sans Myanmar + line-height 1.78 locked. SUBS/DOC result မှာ Pyidaungsu-safe cue စစ်ပါ။ Browser font override ပိတ်ထားပါ။ စာလုံးကွဲရင် burn-in style ပြောင်းစမ်းပါ။" },
  { q: "ဖိုင်တင်မရဘူး / mic အသံမတက်ဘူး?", a: "ဖိုင် — MP4/MOV/WEBM/MP3/WAV, 2GB အောက် စစ်ပါ။ Mic — Chrome/Edge + mic permission Allow လုပ်ပါ။ File ဖွင့်တာနဲ့ auto-capture ON ထားပါ။ Text tab ကနေ စာရိုက်ထည့်လဲ ရသည်။" },
  { q: "Theme/Avatar ပြောင်းချင်တယ်?", a: "Avatar → Profile/Theme tab → preset ၆ ရောင် သို့မဟုတ် custom color picker ၂ ခု → APPLY THEME → SAVE PROFILE. Hero, reactor, button အားလုံး လိုက်ပြောင်းမည်။" },
];

export const GUIDE_CHECKLIST = [
  { id: "profile", label: "Profile + avatar + theme သိမ်း", my: "ကိုယ့်ပုံစံချ" },
  { id: "pro-credit", label: "PRO သို့မဟုတ် Credit 50+ ဖြည့်", my: "လောင်စာဖြည့်" },
  { id: "recap", label: "RECAP SAMPLE → SUMMARY IGNITE", my: "ပထမအနှစ်ချုပ်" },
  { id: "reel", label: "REEL တစ်ပုဒ်ဖြတ်", my: "ရီးလ်စမ်းဖြတ်" },
  { id: "gpu", label: "GPU TURBO တစ်ခါစမ်း", my: "အမြန်လမ်း" },
  { id: "export", label: "SRT/JSON export + History စစ်", my: "သိမ်း + ပြန်ကြည့်" },
];
