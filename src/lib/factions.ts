export type FactionGroup = "pro" | "forge";

export type FactionInputKind =
  | "video"
  | "audio-or-video"
  | "video-plus-lang"
  | "video-or-image"
  | "prompt-plus-topic"
  | "url"
  | "yt-link"
  | "document"
  | "document-knowledge"
  | "scan-video"
  | "voice-sample"
  | "clip-library";

export interface FactionDef {
  slug: string;
  code: string;
  name: string;
  myName: string;
  tagline: string;
  myTagline: string;
  group: FactionGroup;
  cost: number;
  route: string;
  durationSec: number;
  primary: string;
  secondary: string;
  tertiary: string;
  glow: string;
  ink: string;
  motif: string;
  glyph: string;
  hudKind:
    | "timeline"
    | "vertical"
    | "waveform"
    | "captions"
    | "pixels"
    | "ticker"
    | "digest"
    | "extractor"
    | "slides"
    | "graph"
    | "shield"
    | "voiceprint"
    | "magic";
  inputKind: FactionInputKind;
  description: string;
  myDescription: string;
  microHudLabel: string;
  accepts: string;
  extraFields: { key: string; label: string; type: "select" | "text" | "url" | "textarea"; options?: string[]; placeholder?: string; defaultValue?: string }[];
}

export const FACTIONS: FactionDef[] = [
  {
    slug: "recap",
    code: "01",
    name: "RECAP",
    myName: "ရီကက် အနှစ်ချုပ်",
    tagline: "AI Video Summarization & Highlights",
    myTagline: "ဗီဒီယိုအနှစ်ချုပ် နှင့် အထူးအခန်းများ",
    group: "pro",
    cost: 0,
    route: "/api/v1/faction/recap",
    durationSec: 22,
    primary: "#FF2E4C",
    secondary: "#FF7A18",
    tertiary: "#2A0A12",
    glow: "rgba(255,46,76,0.55)",
    ink: "#FFF1F2",
    motif: "timeline-shards",
    glyph: "◈",
    hudKind: "timeline",
    inputKind: "video",
    description: "Ingest any long video. Neural summarizer extracts chapters, key beats and a 60-second highlight rail.",
    myDescription: "ဗီဒီယိုအရှည်ကို တင်ပါ။ AI က အခန်းများ၊ အဓိကအချက်များနှင့် ဟိုက်လိုက်များကို ထုတ်ပေးမည်။",
    microHudLabel: "SUMMARY CORE",
    accepts: "MP4 · MOV · WEBM — up to 2GB",
    extraFields: [
      { key: "style", label: "Recap style", type: "select", options: ["Cinematic beats", "Meeting minutes", "Lecture chapters", "Viral highlights"], defaultValue: "Cinematic beats" },
      { key: "length", label: "Output length", type: "select", options: ["60s flash", "3-min digest", "10-chapter map"], defaultValue: "60s flash" },
    ],
  },
  {
    slug: "reel",
    code: "02",
    name: "REEL",
    myName: "ရီးလ် ဗိုင်းရယ်ဖြတ်",
    tagline: "Vertical 9:16 Short-form & Viral Cut Extractor",
    myTagline: "ဒေါင်လိုက် ၉:၁၆ ဗိုင်းရယ်အပိုင်းဖြတ်",
    group: "pro",
    cost: 0,
    route: "/api/v1/faction/reel",
    durationSec: 24,
    primary: "#E8FF00",
    secondary: "#FF00E5",
    tertiary: "#1A1A05",
    glow: "rgba(232,255,0,0.45)",
    ink: "#FFFEED",
    motif: "phone-frame",
    glyph: "▮",
    hudKind: "vertical",
    inputKind: "video",
    description: "Auto-reframes horizontal footage to punchy 9:16 reels. Virality scorer ranks hooks, captions and cuts.",
    myDescription: "အလျားလိုက်ဗီဒီယိုကို ဒေါင်လိုက်ရီးလ်အဖြစ် အလိုအလျောက်ဖြတ်မည်။",
    microHudLabel: "VIRALITY ENGINE",
    accepts: "MP4 · MOV · WEBM — landscape or portrait",
    extraFields: [
      { key: "count", label: "Cuts to extract", type: "select", options: ["3 viral cuts", "5 rapid cuts", "1 hero cut"], defaultValue: "3 viral cuts" },
      { key: "caption", label: "Caption burn-in", type: "select", options: ["Burmese + English", "Burmese only", "English only", "No burn-in"], defaultValue: "Burmese + English" },
    ],
  },
  {
    slug: "mm-voice",
    code: "03",
    name: "MM VOICE",
    myName: "မြန်မာအသံ",
    tagline: "Burmese AI Voice Cloning, TTS & Dubbing",
    myTagline: "မြန်မာအသံပွား၊ အသံထွက် နှင့် ဒပ်ဗင်း",
    group: "pro",
    cost: 0,
    route: "/api/v1/faction/mm-voice",
    durationSec: 20,
    primary: "#00FF9D",
    secondary: "#00B8FF",
    tertiary: "#03251A",
    glow: "rgba(0,255,157,0.5)",
    ink: "#E6FFF4",
    motif: "waveform",
    glyph: "≋",
    hudKind: "waveform",
    inputKind: "audio-or-video",
    description: "Clone a Burmese voice from 10s sample, then TTS or dub any script with native prosody and tone marks intact.",
    myDescription: "မြန်မာအသံကို ပွားပြီး စာသားမှ အသံသို့ ပြောင်းမည်။ သံစဉ်မှန်ကန်စွာ ထွက်ပေးသည်။",
    microHudLabel: "VOCAL FORGE",
    accepts: "MP3 · WAV · M4A · MP4 — or just a prompt",
    extraFields: [
      { key: "voice", label: "Voice vault", type: "select", options: ["Aung — cinematic male", "Thiri — warm female", "Ko Tex — energetic creator", "Daw Hla — documentary"], defaultValue: "Thiri — warm female" },
      { key: "prompt", label: "Script to speak (MM/EN)", type: "textarea", placeholder: "မင်္ဂလာပါ။ ဒီနေ့ သတင်းအကျဉ်းကို တင်ဆက်ပေးပါမယ်…", defaultValue: "မင်္ဂလာပါ။ SCM Cutflow မှ ကြိုဆိုပါတယ်။" },
    ],
  },
  {
    slug: "subs",
    code: "04",
    name: "SUBS",
    myName: "စာတန်းထိုး",
    tagline: "Polyglot Auto-Subtitles with Burmese rendering",
    myTagline: "ဘာသာစုံ အလိုအလျောက်စာတန်းထိုး",
    group: "pro",
    cost: 0,
    route: "/api/v1/faction/subs",
    durationSec: 18,
    primary: "#00E5FF",
    secondary: "#7C3AED",
    tertiary: "#061B26",
    glow: "rgba(0,229,255,0.5)",
    ink: "#E6FDFF",
    motif: "caption-lines",
    glyph: "☰",
    hudKind: "captions",
    inputKind: "video-plus-lang",
    description: "Speech-to-text in 32 languages, re-timed and rendered with authentic Burmese shaping — no clipped stacks.",
    myDescription: "အသံကို စာသားအဖြစ် ပြောင်းပြီး မြန်မာစာမှန်ကန်စွာ ပြပေးသည်။",
    microHudLabel: "GLYPH RENDERER",
    accepts: "MP4 · MOV · WEBM + language target",
    extraFields: [
      { key: "target", label: "Subtitle target", type: "select", options: ["Burmese (MM)", "English (EN)", "Burmese + English dual", "Thai + Burmese"], defaultValue: "Burmese + English dual" },
      { key: "style2", label: "Burn-in style", type: "select", options: ["Cyber karaoke", "Minimal lower-third", "Viral word-pop"], defaultValue: "Cyber karaoke" },
    ],
  },
  {
    slug: "upscale",
    code: "05",
    name: "UPSCALE",
    myName: "ရုပ်ထွက်မြှင့်",
    tagline: "AI Neural Super-Resolution 2X / 4X",
    myTagline: "AI ဖြင့် ရုပ်ထွက်ကြည်လင်မြှင့်တင်",
    group: "pro",
    cost: 0,
    route: "/api/v1/faction/upscale",
    durationSec: 26,
    primary: "#B794FF",
    secondary: "#7DF9FF",
    tertiary: "#151031",
    glow: "rgba(183,148,255,0.55)",
    ink: "#F3EFFF",
    motif: "pixel-grid",
    glyph: "⬢",
    hudKind: "pixels",
    inputKind: "video-or-image",
    description: "Diffusion super-resolution up to 4X. Denoise, deblur and relight frames while preserving skin texture.",
    myDescription: "ဝါးသောရုပ်ကို ၄ဆအထိ ကြည်လင်အောင် မြှင့်ပေးသည်။",
    microHudLabel: "RESOLUTION LATTICE",
    accepts: "MP4 · PNG · JPG · WEBP",
    extraFields: [
      { key: "scale", label: "Scale factor", type: "select", options: ["2X — balanced", "4X — maximum"], defaultValue: "2X — balanced" },
      { key: "mode", label: "Enhance mode", type: "select", options: ["Cinematic restore", "Anime sharp", "Archive denoise"], defaultValue: "Cinematic restore" },
    ],
  },
  {
    slug: "news",
    code: "06",
    name: "NEWS",
    myName: "သတင်းဗီဒီယို",
    tagline: "Breaking News Video Synthesizer",
    myTagline: "သတင်းဗီဒီယို အလိုအလျောက်ဖန်တီး",
    group: "forge",
    cost: 15,
    route: "/api/v1/faction/news",
    durationSec: 19,
    primary: "#FF8A00",
    secondary: "#FF2E4C",
    tertiary: "#261003",
    glow: "rgba(255,138,0,0.55)",
    ink: "#FFF4E6",
    motif: "ticker",
    glyph: "◉",
    hudKind: "ticker",
    inputKind: "prompt-plus-topic",
    description: "Drop a headline or bullet list. Anchor avatar, b-roll, lower-thirds and ticker assemble into broadcast cut.",
    myDescription: "သတင်းခေါင်းစဉ်ပေးပါ။ သရုပ်ဆောင်၊ နောက်ခံရုပ်နှင့် စာတန်းများ အလိုအလျောက်ဖန်တီးမည်။",
    microHudLabel: "BROADCAST DECK",
    accepts: "Headline + bullets — no file needed",
    extraFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Yangon tech hub launches night forge…", defaultValue: "Yangon night forge powers creator economy" },
      { key: "tone", label: "Broadcast tone", type: "select", options: ["Breaking — urgent", "Evening digest — calm", "Explainer — deep"], defaultValue: "Breaking — urgent" },
    ],
  },
  {
    slug: "url-recap",
    code: "07",
    name: "URL RECAP",
    myName: "လင့်ခ်အနှစ်ချုပ်",
    tagline: "Web / Article Video Digest Generator",
    myTagline: "ဝဘ်ဆောင်းပါးကို ဗီဒီယိုအနှစ်ချုပ်",
    group: "forge",
    cost: 10,
    route: "/api/v1/faction/url-recap",
    durationSec: 16,
    primary: "#38FFC8",
    secondary: "#0EA5E9",
    tertiary: "#03252A",
    glow: "rgba(56,255,200,0.5)",
    ink: "#E6FFF6",
    motif: "link-lattice",
    glyph: "⬣",
    hudKind: "digest",
    inputKind: "url",
    description: "Paste any article URL. Scraper distills claims, quotes and visuals into a narrated 60-second digest.",
    myDescription: "ဆောင်းပါးလင့်ခ်ထည့်ပါ။ အဓိကအချက်များကို ဗီဒီယိုအကျဉ်းအဖြစ် ဖန်တီးမည်။",
    microHudLabel: "SCRAPE LATTICE",
    accepts: "https:// — articles, blogs, docs",
    extraFields: [
      { key: "url", label: "Article URL", type: "url", placeholder: "https://example.com/long-read", defaultValue: "https://example.com/myanmar-creator-report-2026" },
      { key: "voice2", label: "Narrator", type: "select", options: ["Burmese female", "Burmese male", "English neutral"], defaultValue: "Burmese female" },
    ],
  },
  {
    slug: "yt-pro",
    code: "08",
    name: "YT PRO",
    myName: "ယူကျု့အဆင့်မြှင့်",
    tagline: "YouTube Link Video Enhancer & Extractor",
    myTagline: "ယူကျု့လင့်ခ်မှ ဗီဒီယိုဆွဲထုတ်အဆင့်မြှင့်",
    group: "forge",
    cost: 12,
    route: "/api/v1/faction/yt-pro",
    durationSec: 21,
    primary: "#FF3B30",
    secondary: "#FFD60A",
    tertiary: "#26080A",
    glow: "rgba(255,59,48,0.55)",
    ink: "#FFF0EF",
    motif: "tube-rails",
    glyph: "▶",
    hudKind: "extractor",
    inputKind: "yt-link",
    description: "Paste a YouTube link. Chapter extractor, hook finder and 4K polish pipeline produce ready-to-repost cuts.",
    myDescription: "ယူကျု့လင့်ခ်ထည့်ပါ။ အခန်းခွဲ၊ ဟိုက်လိုက်နှင့် ကြည်လင်မှုမြှင့်ပေးမည်။",
    microHudLabel: "TUBE EXTRACTOR",
    accepts: "youtube.com / youtu.be links",
    extraFields: [
      { key: "ytUrl", label: "YouTube URL", type: "url", placeholder: "https://youtu.be/…", defaultValue: "https://youtu.be/dQw4w9WgXcQ" },
      { key: "task", label: "Extraction task", type: "select", options: ["Highlight pack", "Full chapters + summary", "Clean 4K upscale"], defaultValue: "Highlight pack" },
    ],
  },
  {
    slug: "doc-translate",
    code: "09",
    name: "DOC TRANSLATE",
    myName: "စာရွက်ဘာသာပြန်",
    tagline: "PDF / DOCX to Video Slide Translator",
    myTagline: "စာရွက်စာတမ်းကို ဗီဒီယိုဆလိုက်",
    group: "forge",
    cost: 8,
    route: "/api/v1/faction/doc-translate",
    durationSec: 17,
    primary: "#A855F7",
    secondary: "#EC4899",
    tertiary: "#1D0B2E",
    glow: "rgba(168,85,247,0.55)",
    ink: "#F9EFFE",
    motif: "arcane-pages",
    glyph: "✦",
    hudKind: "slides",
    inputKind: "document",
    description: "Upload PDF/DOCX. Layout-aware translator rebuilds slides with Burmese typography and voiceover.",
    myDescription: "PDF/DOCX တင်ပါ။ မြန်မာဘာသာပြန်ပြီး ဆလိုက်ဗီဒီယို ဖန်တီးပေးမည်။",
    microHudLabel: "ARCANE PRESS",
    accepts: "PDF · DOCX · PPTX — up to 50MB",
    extraFields: [
      { key: "pair", label: "Language pair", type: "select", options: ["EN → MM", "MM → EN", "CN → MM", "TH → MM"], defaultValue: "EN → MM" },
      { key: "voice3", label: "Slide voiceover", type: "select", options: ["Burmese narration on", "No narration"], defaultValue: "Burmese narration on" },
    ],
  },
  {
    slug: "knowledge",
    code: "10",
    name: "KNOWLEDGE",
    myName: "အသိပညာထုတ်နုတ်",
    tagline: "Neural AI Document Knowledge Extractor",
    myTagline: "စာရွက်မှ အသိပညာထုတ်နုတ်",
    group: "forge",
    cost: 5,
    route: "/api/v1/faction/knowledge",
    durationSec: 15,
    primary: "#7CFC00",
    secondary: "#00E5FF",
    tertiary: "#0C230A",
    glow: "rgba(124,252,0,0.5)",
    ink: "#F0FFE0",
    motif: "neural-graph",
    glyph: "⟡",
    hudKind: "graph",
    inputKind: "document-knowledge",
    description: "Feed manuals, research or contracts. Entity graph, Q&A memory and timeline emerge as explorable video notes.",
    myDescription: "စာရွက်စာတမ်းထည့်ပါ။ အဓိကအချက်၊ မေးခွန်းဖြေနှင့် မှတ်စုများ ထုတ်ပေးမည်။",
    microHudLabel: "NEURAL LOOM",
    accepts: "PDF · DOCX · TXT · MD",
    extraFields: [
      { key: "depth", label: "Extraction depth", type: "select", options: ["Flash cards", "Deep dossier", "Q&A memory"], defaultValue: "Deep dossier" },
      { key: "query", label: "Focus question", type: "text", placeholder: "What are the renewal terms?", defaultValue: "Summarize obligations and risks" },
    ],
  },
  {
    slug: "copyright",
    code: "11",
    name: "COPYRIGHT CHECKER",
    myName: "မူပိုင်ခွင့်စစ်ဆေးစက်",
    tagline: "Claim Risk Scanner & Shield Verifier",
    myTagline: "မူပိုင်ခွင့် အန္တရာယ် စကင်ဖတ်စစ်ဆေး",
    group: "forge",
    cost: 3,
    route: "/api/v1/faction/copyright",
    durationSec: 14,
    primary: "#00FFC2",
    secondary: "#0066FF",
    tertiary: "#02231E",
    glow: "rgba(0,255,194,0.55)",
    ink: "#E6FFFA",
    motif: "radar-scan",
    glyph: "🛡",
    hudKind: "shield",
    inputKind: "scan-video",
    description: "Scan any finished video for Content-ID style claim risk across YouTube, Meta and TikTok. Returns an 8-signal report, per-platform scores, monetization verdict and exact fixes.",
    myDescription: "ပြီးစီးသော ဗီဒီယိုကို YouTube · Meta · TikTok မူဝါဒအလိုက် claim အန္တရာယ် စစ်ဆေးပေးသည်။ အချက် ၈ ချက် + ပြင်ဆင်နည်းများ ပြပေးမည်။",
    microHudLabel: "CLAIM RADAR",
    accepts: "Video file · or scan a finished forge output",
    extraFields: [
      { key: "shieldLevel", label: "Shield level used", type: "select", options: ["off", "standard", "aggressive", "maximum"], defaultValue: "standard" },
      { key: "title", label: "Video title", type: "text", placeholder: "My recap video…", defaultValue: "Untitled export" },
    ],
  },
  {
    slug: "voice-clone",
    code: "12",
    name: "VOICE CLONE",
    myName: "အသံပွားစက်",
    tagline: "Personal Voiceprint Cloning & Emotion TTS",
    myTagline: "ကိုယ်ပိုင်အသံ ပွားယူ၍ စာသားမှ အသံထွက်",
    group: "forge",
    cost: 7,
    route: "/api/v1/faction/voice-clone",
    durationSec: 18,
    primary: "#C77DFF",
    secondary: "#FF2E9A",
    tertiary: "#1A0A2E",
    glow: "rgba(199,125,255,0.55)",
    ink: "#F6ECFF",
    motif: "voiceprint",
    glyph: "🎙",
    hudKind: "voiceprint",
    inputKind: "voice-sample",
    description: "Record or upload a 10–60 second sample, build a reusable voiceprint, then speak any Burmese or English script in that exact voice with emotion control.",
    myDescription: "၁၀–၆၀ စက္ကန့် အသံနမူနာ သွင်းပါ။ ကိုယ်ပိုင် voiceprint ဖန်တီးပြီး စာသားမှန်သမျှကို အဲဒီအသံအတိုင်း ခံစားချက်ပါ ပြောပေးမည်။",
    microHudLabel: "VOICEPRINT CORE",
    accepts: "MIC record · MP3 · WAV · M4A · MP4 (10–60s)",
    extraFields: [
      { key: "emotion", label: "Emotion", type: "select", options: ["neutral", "happy", "serious", "sad", "excited", "calm"], defaultValue: "neutral" },
      { key: "script", label: "Script to speak", type: "textarea", placeholder: "မင်္ဂလာပါ။ ဒီအသံက ကျွန်တော့်ကိုယ်ပိုင် အသံပါ…", defaultValue: "မင်္ဂလာပါ။ ဒီအသံက ကျွန်တော့်ရဲ့ ကိုယ်ပိုင်အသံ ဖြစ်ပါတယ်။" },
    ],
  },
  {
    slug: "magic",
    code: "13",
    name: "MAGIC REEL AI",
    myName: "မှော်ရီးလ်",
    tagline: "Viral Shorts Generator — auto-scan server clips",
    myTagline: "ဆာဗာမှ clip များဖြင့် viral short အလိုအလျောက်",
    group: "pro",
    cost: 0,
    route: "/api/v1/faction/magic",
    durationSec: 30,
    primary: "#FFE600",
    secondary: "#FF2E9A",
    tertiary: "#1B0B2A",
    glow: "rgba(255,230,0,0.55)",
    ink: "#FFFCE6",
    motif: "magic-wand",
    glyph: "✨",
    hudKind: "magic",
    inputKind: "clip-library",
    description: "Auto-scans your server clip library (FUNNY / Accident CCTV), randomly selects short clips and stitches them into one ~60 second viral short in 30 seconds.",
    myDescription: "ဆာဗာထဲက Telegram Clip (FUNNY / Accident CCTV) ဖိုင်များမှ clip အတိုများကို random ဆွဲပြီး ၁ မိနစ်ဝန်းကျင် viral short တစ်ပုဒ် အလိုအလျောက် ထုတ်ပေးသည်။",
    microHudLabel: "MAGIC CORE",
    accepts: "Server library — no upload needed",
    extraFields: [
      { key: "category", label: "Clip category", type: "select", options: ["funny", "accident"], defaultValue: "funny" },
      { key: "targetSeconds", label: "Reel length", type: "select", options: ["45", "60", "75"], defaultValue: "60" },
    ],
  },
];

export function getFaction(slug: string): FactionDef | undefined {
  return FACTIONS.find((f) => f.slug === slug);
}

export const PRO_FACTIONS = FACTIONS.filter((f) => f.group === "pro");
export const FORGE_FACTIONS = FACTIONS.filter((f) => f.group === "forge");