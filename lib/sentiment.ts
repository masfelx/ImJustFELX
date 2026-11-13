/**
 * ============================================================
 *  SENTIMENT & MOOD DETECTOR ENGINE (Auto-Detect Bahasa & Emoticon)
 * ============================================================
 *  Mendeteksi suasana hati (mood) dari teks cerita secara real-time:
 *  - Patah Hati (Heartbreak) -> ( 💔 ﹏ 💔 )
 *  - Jatuh Cinta (Love)       -> ( ♡ ‿ ♡ )
 *  - Ceria / Bahagia (Happy) -> ( ^ ‿ ^ )
 *  - Sedih / Sendu (Sad)     -> ( ╥ ﹏ ╥ )
 *  - Marah / Kesal (Angry)   -> ( > ﹏ < )
 *  - Netral / Santai         -> ( • ‿ • )
 * ============================================================
 */

export type MoodType =
  | "heartbreak"
  | "love"
  | "happy"
  | "sad"
  | "angry"
  | "neutral";

export interface MoodInfo {
  type: MoodType;
  label: string;
  kaomoji: string;
  ledColor: string;
  glowColor: string;
  bgTint: string;
  badgeEmoji: string;
  description: string;
}

export const MOODS: Record<MoodType, MoodInfo> = {
  heartbreak: {
    type: "heartbreak",
    label: "Patah Hati",
    kaomoji: "( 💔 ﹏ 💔 )",
    ledColor: "text-purple-400",
    glowColor: "#c084fc",
    bgTint: "rgba(192, 132, 252, 0.15)",
    badgeEmoji: "💔",
    description: "Hati terluka, kecewa, & patah hati",
  },
  love: {
    type: "love",
    label: "Jatuh Cinta",
    kaomoji: "( ♡ ‿ ♡ )",
    ledColor: "text-pink-400",
    glowColor: "#f43f5e",
    bgTint: "rgba(244, 63, 94, 0.15)",
    badgeEmoji: "💖",
    description: "Lagi kasmaran & berbunga-bunga",
  },
  happy: {
    type: "happy",
    label: "Ceria",
    kaomoji: "( ^ ‿ ^ )",
    ledColor: "text-emerald-400",
    glowColor: "#10b981",
    bgTint: "rgba(16, 185, 129, 0.15)",
    badgeEmoji: "✨",
    description: "Penuh energi positif & senyuman",
  },
  sad: {
    type: "sad",
    label: "Sedih",
    kaomoji: "( ╥ ﹏ ╥ )",
    ledColor: "text-sky-400",
    glowColor: "#0ea5e9",
    bgTint: "rgba(14, 165, 233, 0.15)",
    badgeEmoji: "🌧️",
    description: "Hati lagi sendu & butuh didengar",
  },
  angry: {
    type: "angry",
    label: "Kesal",
    kaomoji: "( > ﹏ < )",
    ledColor: "text-rose-500",
    glowColor: "#ef4444",
    bgTint: "rgba(239, 68, 68, 0.15)",
    badgeEmoji: "🔥",
    description: "Lagi meluapkan emosi & kejengkelan",
  },
  neutral: {
    type: "neutral",
    label: "Santai",
    kaomoji: "( • ‿ • )",
    ledColor: "text-cyan-300",
    glowColor: "#06b6d4",
    bgTint: "rgba(6, 182, 212, 0.12)",
    badgeEmoji: "💭",
    description: "Menceritakan keseharian apa adanya",
  },
};

// ── KOSAKATA PATAH HATI (HEARTBREAK) ──────────────────────────
const HEARTBREAK_KEYWORDS = [
  "patah hati", "patah", "heartbroken", "heartbreak", "menyepelekan",
  "disepelekan", "sepele", "effort", "effortku", "kurangnya", "banyak kurangnya",
  "kurang apa", "gak cukup", "ga cukup", "tidak cukup", "selingkuh", "diselingkuhi",
  "orang ketiga", "main belakang", "waktunya selama ini", "selama ini", "makasih untuk waktunya",
  "terima kasih untuk waktunya", "makasih ya untuk waktunya", "putus", "diputusin",
  "kita udahan", "udahan", "berakhir", "perpisahan", "pamit", "selamat tinggal",
  "ditinggal", "ditinggalkan", "ditinggal pergi", "ditinggal nikah", "ghosting",
  "dighosting", "diabaikan", "gak dianggap", "ga dianggap", "tidak dianggap",
  "tak dianggap", "gak dihargai", "ga dihargai", "tidak dihargai", "tak dihargai",
  "pilihan kedua", "opsi kedua", "pelampiasan", "badut", "ngebadut", "dibadutin",
  "bertepuk sebelah tangan", "cinta bertepuk", "unrequited", "melepaskan",
  "mengikhlaskan", "merelakan", "relakan", "harus ikhlas", "ikhlas", "mantan",
  "gagal move on", "gamov", "gamon", "move on", "susah lupa", "nyesek",
  "sakit hati", "sakit banget", "remuk", "hancur berkeping", "hancur", "terluka",
  "bukan untukku", "bukan jodoh", "bukan takdir", "jodoh orang", "sama dia",
  "milih dia", "kamu milih dia", "kamu pilih dia", "bahagia sama dia",
  "trauma pacaran", "mati rasa", "sia-sia", "disia-siakan", "menyia-nyiakan",
  "dia pergi", "kamu pergi", "kehilangan kamu", "kehilangan dia", "gapernah dihargai"
];

// ── KOSAKATA JATUH CINTA (LOVE) ──────────────────────────────
const LOVE_KEYWORDS = [
  "cinta", "sayang", "love", "crush", "gebetan", "pacar", "kekasih", "naksir",
  "baper", "berbunga", "berbunga-bunga", "romantis", "kangen", "rindu", "peluk",
  "cium", "gemes", "manis", "sweet", "lovey", "dating", "jadian", "ayang",
  "bebeb", "soulmate", "kasmaran", "terpikat", "terpesona", "sayangku", "cintaku",
  "nikah", "heart", "kiss", "couple", "tergila-gila", "tresno", "sayang banget",
  "deg degan", "deg-degan", "jatuh hati", "ganteng", "cantik", "flirting",
  "bunga", "genggam tangan", "pegang tangan", "gemas"
];

// ── KOSAKATA CERIA / BAHAGIA (HAPPY) ─────────────────────────
const HAPPY_KEYWORDS = [
  "senang", "bahagia", "ceria", "gembira", "happy", "semangat", "senyum",
  "ketawa", "tertawa", "asik", "seru", "hore", "alhamdulillah", "syukur",
  "puji tuhan", "sukses", "berhasil", "lega", "menang", "mantap", "keren",
  "lucu", "joy", "fun", "smile", "excited", "proud", "bangga", "beruntung",
  "asri", "segar", "damai", "peace", "terhibur", "blessed", "yeay", "yey",
  "gokil", "mantul", "enak", "bersyukur"
];

// Kata tawa yang sering dipakai ironi saat sedih (wkwk, hehe, haha, xixi)
const LAUGHTER_SLANG = ["wkwk", "wkwkwk", "haha", "hahaha", "hehe", "hehehe", "xixi", "xixixi"];

// ── KOSAKATA SEDIH (SAD) ─────────────────────────────────────
const SAD_KEYWORDS = [
  "sedih", "nangis", "menangis", "air mata", "galau", "kecewa", "kesepian",
  "lonely", "hampa", "depresi", "down", "terpuruk", "capek", "lelah", "trauma",
  "kehilangan", "hilang", "kasihan", "rip", "menyesal", "hopeless", "cry",
  "sad", "hurt", "tears", "sunyi", "sepi", "gagal", "putus asa", "menyerah",
  "pilu", "duka", "berduka", "cape banget", "sendiri", "sendirian"
];

// ── KOSAKATA MARAH (ANGRY) ───────────────────────────────────
const ANGRY_KEYWORDS = [
  "marah", "kesel", "kesal", "benci", "jengkel", "emosi", "muak", "anjing",
  "bangsat", "kampret", "toxic", "jahat", "curang", "bohong", "khianat",
  "dendam", "ngamuk", "geram", "hate", "angry", "mad", "pissed", "furious",
  "bodo", "goblok", "tolol", "brengsek", "bajingan", "sialan", "nyebelin",
  "gedek", "emosian", "bego"
];

// ── ASCII TEXT EMOTICONS (SERING DIPAKAI DI SOSMED) ───────────
const SAD_ASCII = [":(", ":-(", ":'(", ":'-(", ":c", ":[", ";(", ";-(", ";_;", "T_T", "T.T", "q_q", ":/", ":-/", ":\\", "</3"];
const HAPPY_ASCII = [":)", ":-)", ":D", ":-D", "^^", "^_^", "^-^", ":3", "=)", "=D"];
const LOVE_ASCII = ["<3", "♡", "♥", "xoxo"];
const ANGRY_ASCII = [">:(", ">:-(", "-_-", ">_<", ">.<"];

// ── UNICODE EMOJIS ───────────────────────────────────────────
const HEARTBREAK_EMOJIS = /[\uD83D\uDC94|\uD83E\uDE79|\uD83E\uDD40]/gu; // 💔 🩹 🥀
const LOVE_EMOJIS = /[\u2764\uFE0F|\uD83D\uDC95|\uD83D\uDC96|\uD83D\uDC97|\uD83D\uDC98|\uD83D\uDC99|\uD83D\uDC9A|\uD83D\uDC9B|\uD83D\uDC9C|\uD83E\uDD0E|\uD83E\uDD0D|\uD83D\uDE0D|\uD83E\uDD70|\uD83D\uDE18|\uD83D\uDC8B|\uD83D\uDC9D|\uD83D\uDC9E|\uD83D\uDC9F|\uD83E\uDD7A]/gu;
const HAPPY_EMOJIS = /[\uD83D\uDE00|\uD83D\uDE01|\uD83D\uDE02|\uD83E\uDD23|\uD83D\uDE03|\uD83D\uDE04|\uD83D\uDE06|\uD83D\uDE0A|\uD83E\uDD73|\u2728|\uD83C\uDF89|\uD83D\uDE0E|\uD83D\uDC4D|\u270C\uFE0F]/gu;
const SAD_EMOJIS = /[\uD83D\uDE22|\uD83D\uDE2D|\uD83E\uDD79|\uD83D\uDE14|\uD83D\uDE1E|\uD83D\uDE25|\uD83D\uDE29|\uD83D\uDE3F|\uD83C\uDF27\uFE0F]/gu;
const ANGRY_EMOJIS = /[\uD83D\uDE21|\uD83D\uDE20|\uD83E\uDD2C|\uD83D\uDC7F|\uD83D\uDCA2|\uD83D\uDE44|\uD83E\uDD2E]/gu;

/**
 * Mendeteksi mood secara otomatis dari isi teks
 */
export function detectMood(text: string): MoodInfo {
  if (!text || text.trim().length === 0) {
    return MOODS.neutral;
  }

  const raw = text;
  const lower = text.toLowerCase();

  let heartbreakScore = 0;
  let loveScore = 0;
  let happyScore = 0;
  let sadScore = 0;
  let angryScore = 0;

  // 1. Cek Patah Hati (bobot tinggi karena sangat spesifik)
  HEARTBREAK_KEYWORDS.forEach((word) => {
    if (lower.includes(word)) {
      heartbreakScore += 3;
    }
  });

  // 2. Cek Jatuh Cinta
  LOVE_KEYWORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) loveScore += matches.length * 2;
  });

  // 3. Cek Sedih
  SAD_KEYWORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) sadScore += matches.length * 2;
  });

  // 4. Cek Marah
  ANGRY_KEYWORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) angryScore += matches.length * 2.5;
  });

  // 5. Cek Ceria / Bahagia
  HAPPY_KEYWORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) happyScore += matches.length * 2;
  });

  // 6. Evaluasi Tawa Slang (wkwk, hehe, dsb)
  // JIKA teks mengandung unsur patah hati atau sedih, tawa seperti "hehe", "wkwk"
  // adalah senyum getir/ironi (coping mechanism) -> JANGAN tambahkan happyScore!
  let laughterCount = 0;
  LAUGHTER_SLANG.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) laughterCount += matches.length;
  });

  if (laughterCount > 0) {
    if (heartbreakScore > 0 || sadScore > 0) {
      // Ironi / senyum pahit: memperkuat indikasi patah hati / kesedihan
      heartbreakScore += laughterCount * 2;
    } else {
      happyScore += laughterCount * 2;
    }
  }

  // 7. Cek Text / ASCII Emoticons
  SAD_ASCII.forEach((emo) => {
    if (raw.includes(emo)) {
      sadScore += 3;
      heartbreakScore += 3;
    }
  });

  HAPPY_ASCII.forEach((emo) => {
    if (raw.includes(emo) && heartbreakScore === 0 && sadScore === 0) {
      happyScore += 3;
    }
  });

  LOVE_ASCII.forEach((emo) => {
    if (raw.includes(emo)) loveScore += 3;
  });

  ANGRY_ASCII.forEach((emo) => {
    if (raw.includes(emo)) angryScore += 3;
  });

  // 8. Cek Emojis Unicode
  const hbEmo = text.match(HEARTBREAK_EMOJIS);
  if (hbEmo) heartbreakScore += hbEmo.length * 4;

  const loveEmo = text.match(LOVE_EMOJIS);
  if (loveEmo) loveScore += loveEmo.length * 3;

  const happyEmo = text.match(HAPPY_EMOJIS);
  if (happyEmo) {
    if (heartbreakScore > 0 || sadScore > 0) {
      heartbreakScore += 1;
    } else {
      happyScore += happyEmo.length * 3;
    }
  }

  const sadEmo = text.match(SAD_EMOJIS);
  if (sadEmo) sadScore += sadEmo.length * 3;

  const angryEmo = text.match(ANGRY_EMOJIS);
  if (angryEmo) angryScore += angryEmo.length * 3;

  // 9. Penentuan Mood Dominan
  const scores: { mood: MoodType; score: number }[] = [
    { mood: "heartbreak", score: heartbreakScore },
    { mood: "love", score: loveScore },
    { mood: "sad", score: sadScore },
    { mood: "angry", score: angryScore },
    { mood: "happy", score: happyScore },
  ];

  scores.sort((a, b) => b.score - a.score);

  if (scores[0].score < 2) {
    return MOODS.neutral;
  }

  return MOODS[scores[0].mood];
}
