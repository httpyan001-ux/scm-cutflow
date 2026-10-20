/* ============================================================
   KNOWLEDGE FACTION — web discovery → select 5 → produce video
   Works with zero API key (curated offline knowledge web),
   upgrades to live web search when a key is present.
   ============================================================ */

export interface DiscoveredTopic {
  id: string;
  title: string;
  myTitle: string;
  summary: string;
  category: string;
  source: string;
  sourceUrl: string;
  readMins: number;
  interest: number; // 0-100
  image: string;    // remote news/stock image
  tags: string[];
}

export interface ScriptLine {
  idx: number;
  start: number;      // seconds
  end: number;
  speaker: "NARRATOR";
  text: string;       // Burmese narration
  onScreen: string;   // caption burned on screen
  image: string;
  topicId: string;
}

export interface ProducedVideo {
  title: string;
  myTitle: string;
  totalSeconds: number;
  aspect: string;
  voice: string;
  lines: ScriptLine[];
  caption: string;        // social caption with #@
  hashtags: string[];
  mentions: string[];
  scriptText: string;
  timestamps: { t: string; label: string }[];
  images: string[];
  download: string;
}

/* ---------- curated knowledge web (offline source pool) ---------- */
const POOL: Omit<DiscoveredTopic, "id" | "interest">[] = [
  {
    title: "Why the human brain forgets on purpose",
    myTitle: "ဦးနှောက်က တမင် မေ့ပစ်ရတဲ့ အကြောင်းရင်း",
    summary: "မှတ်ဉာဏ်သည် သိမ်းဆည်းခြင်းထက် 'ဖယ်ရှားခြင်း' ကို ပိုအလေးထားသည်။ သုတေသနအရ မလိုအပ်သော အချက်အလက်များကို ဖျက်ခြင်းက ဆုံးဖြတ်ချက်ချရာတွင် ပိုမြန်စေသည်။",
    category: "Neuroscience",
    source: "Nature Neuroscience",
    sourceUrl: "https://www.nature.com/neuro/",
    readMins: 7,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=70",
    tags: ["brain", "memory", "science"],
  },
  {
    title: "Deep-sea mining and the race for battery metals",
    myTitle: "ပင်လယ်အောက် သတ္တုတူးဖော်ရေးနှင့် ဘက်ထရီအပြိုင်အဆိုင်",
    summary: "ပစိဖိတ်သမုဒ္ဒရာအောက်ရှိ polymetallic nodules များသည် ကမ္ဘာ့ဘက်ထရီလိုအပ်ချက်ကို ဆယ်စုနှစ်များစွာ ဖြည့်ဆည်းနိုင်သော်လည်း ဂေဟစနစ်အတွက် အန္တရာယ်ရှိသည်။",
    category: "Environment",
    source: "MIT Technology Review",
    sourceUrl: "https://www.technologyreview.com/",
    readMins: 9,
    image: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=800&q=70",
    tags: ["ocean", "energy", "climate"],
  },
  {
    title: "How ancient Bagan engineers made quake-resistant temples",
    myTitle: "ပုဂံဘုရားများ ငလျင်ဒဏ်ခံနိုင်ပုံ အင်ဂျင်နီယာပညာ",
    summary: "ပုဂံခေတ် အုတ်ညှပ်နည်းပညာနှင့် ထုံးသရက်ရည် ဆက်စပ်မှုက ငလျင်လှုပ်ခတ်မှုစွမ်းအင်ကို ဖြန့်ကျဲပေးသည်ဟု ခေတ်သစ်တိုင်းတာမှုများက ညွှန်ပြသည်။",
    category: "History",
    source: "UNESCO Heritage",
    sourceUrl: "https://whc.unesco.org/",
    readMins: 6,
    image: "https://images.unsplash.com/photo-1545126178-275ddd0290b4?w=800&q=70",
    tags: ["bagan", "architecture", "myanmar"],
  },
  {
    title: "The quiet revolution of small language models",
    myTitle: "မော်ဒယ်သေးသေးများ၏ တိတ်ဆိတ်သော တော်လှန်ရေး",
    summary: "ဖုန်းပေါ်တွင်တိုက်ရိုက်အလုပ်လုပ်နိုင်သော မော်ဒယ်သေးများသည် cloud မလိုဘဲ privacy ကိုကာကွယ်ပြီး ကုန်ကျစရိတ် ၉၀% အထိ လျှော့ချပေးသည်။",
    category: "Technology",
    source: "Stanford HAI",
    sourceUrl: "https://hai.stanford.edu/",
    readMins: 8,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=70",
    tags: ["ai", "privacy", "mobile"],
  },
  {
    title: "Sleep pressure: the chemical clock behind tiredness",
    myTitle: "အိပ်ငိုက်ခြင်းနောက်ကွယ်က ဓာတုနာရီ",
    summary: "Adenosine စုပုံမှုသည် နာရီပေါင်းများစွာ နိုးနေချိန်တွင် အိပ်ချင်စိတ်ကို တွန်းအားပေးသည်။ ကော်ဖီက ထိုအချက်ပြကို ယာယီပိတ်ဆို့သည်သာ ဖြစ်သည်။",
    category: "Health",
    source: "Harvard Medical",
    sourceUrl: "https://hms.harvard.edu/",
    readMins: 5,
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=70",
    tags: ["sleep", "health", "caffeine"],
  },
  {
    title: "Why some languages have 20 words for rain",
    myTitle: "ဘာသာစကားအချို့တွင် မိုးအတွက် စကားလုံး ၂၀ ရှိရခြင်း",
    summary: "ပတ်ဝန်းကျင်နှင့် နေ့စဉ်ဘဝလိုအပ်ချက်က ဝေါဟာရကြွယ်ဝမှုကို ပုံဖော်သည်။ မြန်မာဘာသာတွင်လည်း မိုးအမျိုးအစား ခွဲခြားမှုများ ရှိသည်။",
    category: "Linguistics",
    source: "Cambridge Linguistics",
    sourceUrl: "https://www.cambridge.org/",
    readMins: 6,
    image: "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&q=70",
    tags: ["language", "culture", "rain"],
  },
  {
    title: "Vertical farms are finally turning a profit",
    myTitle: "ဒေါင်လိုက်လယ်ယာများ အမြတ်ထွက်လာပြီ",
    summary: "LED စွမ်းအင်ကုန်ကျစရိတ် ကျဆင်းမှုနှင့် အလိုအလျောက်စနစ်များကြောင့် မြို့တွင်းစိုက်ပျိုးရေးသည် စီးပွားဖြစ်လာသည်။",
    category: "Agriculture",
    source: "FAO Report",
    sourceUrl: "https://www.fao.org/",
    readMins: 7,
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=70",
    tags: ["farming", "cities", "food"],
  },
  {
    title: "The physics of why cats always land upright",
    myTitle: "ကြောင်များ ခြေထောက်ဖြင့် ဆင်းသက်နိုင်ခြင်း ရူပဗေဒ",
    summary: "ကြောင်သည် ခန္ဓာကိုယ်ကို နှစ်ပိုင်းခွဲလှည့်ခြင်းဖြင့် angular momentum မပျက်ဘဲ ဦးတည်ချက်ပြောင်းနိုင်သည်။",
    category: "Physics",
    source: "Scientific American",
    sourceUrl: "https://www.scientificamerican.com/",
    readMins: 4,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=70",
    tags: ["physics", "animals", "motion"],
  },
  {
    title: "Myanmar's creator economy crosses a tipping point",
    myTitle: "မြန်မာ့ဖန်တီးသူစီးပွားရေး အလှည့်အပြောင်းအမှတ်",
    summary: "မိုဘိုင်းအင်တာနက်ကျယ်ပြန့်မှုနှင့် ဒေသတွင်းငွေပေးချေမှုစနစ်များက တစ်ကိုယ်တော်ဖန်တီးသူများကို အသက်မွေးနိုင်စေသည်။",
    category: "Economy",
    source: "Asia Creator Report",
    sourceUrl: "https://www.statista.com/",
    readMins: 8,
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=70",
    tags: ["myanmar", "creator", "economy"],
  },
  {
    title: "Antarctic ice cores reveal 1.2 million years of air",
    myTitle: "အန္တာတိကရေခဲတိုင်မှ နှစ်ပေါင်း ၁၂ သိန်းစာ လေထု",
    summary: "ရေခဲထဲပိတ်မိနေသော လေပူဖောင်းများသည် ရှေးခေတ်လေထုဖွဲ့စည်းမှုကို တိုက်ရိုက်မှတ်တမ်းတင်ထားသည်။",
    category: "Climate",
    source: "British Antarctic Survey",
    sourceUrl: "https://www.bas.ac.uk/",
    readMins: 9,
    image: "https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=800&q=70",
    tags: ["climate", "ice", "history"],
  },
  {
    title: "How noise-cancelling actually cancels sound",
    myTitle: "ဆူညံသံဖျက်စနစ် အလုပ်လုပ်ပုံ",
    summary: "ပြောင်းပြန်လှိုင်း (anti-phase) ထုတ်လွှတ်ခြင်းဖြင့် လှိုင်းနှစ်ခု အပြန်အလှန်ဖျက်သိမ်းကြသည်။",
    category: "Engineering",
    source: "IEEE Spectrum",
    sourceUrl: "https://spectrum.ieee.org/",
    readMins: 5,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=70",
    tags: ["audio", "engineering", "waves"],
  },
  {
    title: "The gut-brain axis is rewriting nutrition science",
    myTitle: "အူလမ်းကြောင်း–ဦးနှောက် ဆက်သွယ်မှု",
    summary: "အူတွင်းဘက်တီးရီးယားများသည် စိတ်ခံစားမှုနှင့် အာရုံစူးစိုက်မှုကို တိုက်ရိုက်လွှမ်းမိုးနိုင်သည်။",
    category: "Health",
    source: "Cell Metabolism",
    sourceUrl: "https://www.cell.com/",
    readMins: 7,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=70",
    tags: ["gut", "nutrition", "mood"],
  },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Deterministic-but-varied discovery of 10 topics for a query. */
export function discoverTopics(query: string, count = 10): DiscoveredTopic[] {
  const q = (query || "general knowledge").trim().toLowerCase();
  const seed = hash(q);
  const ordered = [...POOL]
    .map((p, i) => ({ p, k: hash(`${q}:${p.title}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map(({ p }) => p);

  // bias topics that match the query words to the top
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  ordered.sort((a, b) => {
    const score = (t: typeof a) => (words.some((w) => `${t.title} ${t.myTitle} ${t.category} ${t.tags.join(" ")}`.toLowerCase().includes(w)) ? 1 : 0);
    return score(b) - score(a);
  });

  return ordered.slice(0, count).map((p, i) => ({
    ...p,
    id: `t${i + 1}`,
    interest: 72 + ((seed + i * 13) % 27),
  }));
}

/* ---------- script / caption production ---------- */
const HOOKS = [
  "သိထားသင့်တဲ့ အချက်တစ်ခု ရှိပါတယ် —",
  "ဒါကို ကြားဖူးပေမယ့် အကြောင်းရင်းကို သိသူ နည်းပါတယ် —",
  "ခဏလောက် စဉ်းစားကြည့်ပါ —",
  "ဒီအချက်က အံ့သြစရာ ကောင်းပါတယ် —",
  "သုတေသနအသစ်တစ်ခုက ဖော်ပြတာကတော့ —",
];

function fmtT(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Build a >1 minute narrated script from the user's 5 picks. */
export function produceVideo(
  topics: DiscoveredTopic[],
  opts: { query?: string; voice?: string; aspect?: string } = {}
): ProducedVideo {
  const voice = opts.voice || "Thiri — warm female";
  const aspect = opts.aspect || "9:16";
  const picks = topics.slice(0, 5);
  const lines: ScriptLine[] = [];
  let t = 0;

  // intro
  const intro = `မင်္ဂလာပါ။ ဒီနေ့ ကမ္ဘာတစ်ဝှမ်းက စိတ်ဝင်စားစရာ အချက် ${picks.length} ချက်ကို ၁ မိနစ်ကျော်အတွင်း အတိုချုံးပြီး မျှဝေပေးပါမယ်။ အဆုံးထိ ကြည့်ဖို့ မမေ့ပါနဲ့။`;
  lines.push({ idx: 1, start: 0, end: 8, speaker: "NARRATOR", text: intro, onScreen: "📌 စိတ်ဝင်စားစရာ အချက် ၅ ချက်", image: picks[0]?.image ?? "", topicId: "intro" });
  t = 8;

  picks.forEach((p, i) => {
    const hook = HOOKS[i % HOOKS.length];
    const body = `${hook} ${p.myTitle}။ ${p.summary} ဒါကို ${p.source} က မှတ်တမ်းတင်ထားပါတယ်။`;
    const dur = Math.max(11, Math.min(16, 11 + Math.round(p.summary.length / 42)));
    lines.push({
      idx: lines.length + 1,
      start: t,
      end: t + dur,
      speaker: "NARRATOR",
      text: body,
      onScreen: `${i + 1}. ${p.myTitle}`,
      image: p.image,
      topicId: p.id,
    });
    t += dur;
  });

  // outro
  const outro = "ဒီအချက်တွေထဲက ဘယ်ဟာအကြိုက်ဆုံးလဲ comment မှာ ပြောပြပါ။ ဗဟုသုတရရင် like နဲ့ share လုပ်ပေးပါ — နောက်ထပ်အချက်တွေကို ဆက်တင်ပေးပါမယ်။";
  lines.push({ idx: lines.length + 1, start: t, end: t + 9, speaker: "NARRATOR", text: outro, onScreen: "💬 ဘယ်ဟာ အကြိုက်ဆုံးလဲ?", image: picks[picks.length - 1]?.image ?? "", topicId: "outro" });
  t += 9;

  const scriptText = lines
    .map((l) => `[${fmtT(l.start)} - ${fmtT(l.end)}]  ${l.speaker}\n${l.text}\nON-SCREEN: ${l.onScreen}\n`)
    .join("\n");

  const baseTags = ["ဗဟုသုတ", "knowledge", "မြန်မာ", "didyouknow", "facts", "learnontiktok", "scmcutflow"];
  const topicTags = picks.flatMap((p) => p.tags).slice(0, 6);
  const hashtags = Array.from(new Set([...baseTags, ...topicTags])).map((h) => `#${h.replace(/\s+/g, "")}`);
  const mentions = ["@scm.cutflow", "@knowledge.mm"];

  const headline = picks[0]?.myTitle ?? "ဗဟုသုတ ၅ ချက်";
  const caption = [
    `🧠 ${headline} — နှင့် နောက်ထပ် ${Math.max(0, picks.length - 1)} ချက်`,
    "",
    ...picks.map((p, i) => `${i + 1}. ${p.myTitle} (${p.source})`),
    "",
    "ဘယ်အချက်က အံ့သြဖို့ အကောင်းဆုံးလဲ? 👇",
    "",
    hashtags.join(" "),
    mentions.join(" "),
  ].join("\n");

  return {
    title: `Knowledge Drop — ${picks.length} facts`,
    myTitle: `ဗဟုသုတ ${picks.length} ချက်`,
    totalSeconds: t,
    aspect,
    voice,
    lines,
    caption,
    hashtags,
    mentions,
    scriptText,
    timestamps: lines.map((l) => ({ t: fmtT(l.start), label: l.onScreen })),
    images: Array.from(new Set(lines.map((l) => l.image).filter(Boolean))),
    download: `knowledge-${picks.length}facts-${aspect.replace(":", "x")}.mp4`,
  };
}

export { fmtT as fmtTimestamp };
