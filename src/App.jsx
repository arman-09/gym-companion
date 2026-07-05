import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Home, Dumbbell, BookOpen, TrendingUp, Settings, Play, Plus, X, Check,
  ChevronRight, ChevronLeft, Search, Flame, Trophy, Pencil, Trash2, Zap, Scale, Clock
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";

/* Device-local storage shim (persists via the WebView's localStorage) */
const appStorage = {
  async get(key) {
    const v = localStorage.getItem(key);
    if (v === null) throw new Error("key not found");
    return { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
};


/* ------------------------------ data ------------------------------ */

const MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Core", "Cardio"];

const BASE_EXERCISES = [
  ["bb-bench", "Barbell Bench Press", "Chest", "Barbell", "Shoulder blades pinned, bar to mid-chest, drive feet into the floor."],
  ["db-incline", "Incline Dumbbell Press", "Chest", "Dumbbell", "30–45° bench. Lower slow, press up and slightly in."],
  ["cable-fly", "Cable Fly", "Chest", "Cable", "Soft elbows, hug a barrel — squeeze at the midline for a beat."],
  ["pushup", "Push-Up", "Chest", "Bodyweight", "Body in one line, hands under shoulders, full range."],
  ["dip", "Chest Dip", "Chest", "Bodyweight", "Lean forward slightly, elbows track back, don't sink past stretch."],
  ["deadlift", "Deadlift", "Back", "Barbell", "Bar over midfoot, brace hard, push the floor away — hips and chest rise together."],
  ["pullup", "Pull-Up", "Back", "Bodyweight", "Start from a dead hang, pull elbows to ribs, chin over bar."],
  ["bb-row", "Barbell Row", "Back", "Barbell", "Hinge ~45°, pull to lower ribs, no torso heave."],
  ["lat-pd", "Lat Pulldown", "Back", "Machine", "Chest tall, pull bar to collarbone, control the way up."],
  ["cable-row", "Seated Cable Row", "Back", "Cable", "Long spine, drive elbows back, pause with handle at stomach."],
  ["ohp", "Overhead Press", "Shoulders", "Barbell", "Squeeze glutes, bar path close to face, lock out overhead."],
  ["lat-raise", "Dumbbell Lateral Raise", "Shoulders", "Dumbbell", "Lead with elbows, stop at shoulder height, no swinging."],
  ["face-pull", "Face Pull", "Shoulders", "Cable", "Rope to forehead, thumbs back, external rotation at the end."],
  ["arnold", "Arnold Press", "Shoulders", "Dumbbell", "Rotate palms out as you press; keep ribs down."],
  ["bb-curl", "Barbell Curl", "Biceps", "Barbell", "Elbows pinned to sides, no hip drive, full stretch at bottom."],
  ["hammer", "Hammer Curl", "Biceps", "Dumbbell", "Neutral grip, curl to shoulder, slow eccentric."],
  ["inc-curl", "Incline Dumbbell Curl", "Biceps", "Dumbbell", "Arms hang behind torso for a deep stretch — don't cut the bottom."],
  ["pushdown", "Cable Pushdown", "Triceps", "Cable", "Elbows glued to sides, full lockout, control back up."],
  ["skull", "Skull Crusher", "Triceps", "Barbell", "Lower to forehead or just behind, elbows stay narrow."],
  ["oh-ext", "Overhead Triceps Extension", "Triceps", "Dumbbell", "Big stretch behind the head, extend without flaring elbows."],
  ["squat", "Back Squat", "Legs", "Barbell", "Brace, sit between your hips, knees track over toes, hit depth."],
  ["front-squat", "Front Squat", "Legs", "Barbell", "Elbows high, torso upright, bar rests on shoulders not wrists."],
  ["leg-press", "Leg Press", "Legs", "Machine", "Feet mid-platform, lower until hips want to tuck, don't lock knees hard."],
  ["rdl", "Romanian Deadlift", "Legs", "Barbell", "Push hips back, bar close to legs, stop at hamstring stretch."],
  ["lunge", "Walking Lunge", "Legs", "Dumbbell", "Long stride, back knee kisses the floor, drive through front heel."],
  ["leg-ext", "Leg Extension", "Legs", "Machine", "Pause at the top, lower in 2–3 seconds."],
  ["leg-curl", "Leg Curl", "Legs", "Machine", "Hips pinned down, squeeze heel to glute."],
  ["calf", "Standing Calf Raise", "Legs", "Machine", "Full stretch at bottom, 1-second pause at the top."],
  ["hip-thrust", "Hip Thrust", "Glutes", "Barbell", "Chin tucked, ribs down, lock out with a hard glute squeeze."],
  ["bss", "Bulgarian Split Squat", "Glutes", "Dumbbell", "Front foot far enough forward; torso slightly leaned for glutes."],
  ["plank", "Plank", "Core", "Bodyweight", "Glutes on, ribs down — a plank is a push-up you hold."],
  ["leg-raise", "Hanging Leg Raise", "Core", "Bodyweight", "Posterior tilt first, then raise; no swinging."],
  ["cable-crunch", "Cable Crunch", "Core", "Cable", "Crunch spine, don't hinge hips — elbows to knees."],
  ["run", "Treadmill Run", "Cardio", "Machine", "Log minutes in the reps field. Nose-breathing pace for zone 2."],
  ["rower", "Rowing Machine", "Cardio", "Machine", "Legs, then body, then arms. Reverse on the way back."],
].map(([id, name, muscle, equipment, tip]) => ({ id, name, muscle, equipment, tip }));

const DEFAULT_TEMPLATES = [
  { id: "t-push", name: "Push Day", exercises: [
    { exId: "bb-bench", sets: 4, reps: "6-8" }, { exId: "ohp", sets: 3, reps: "8-10" },
    { exId: "db-incline", sets: 3, reps: "10-12" }, { exId: "lat-raise", sets: 3, reps: "12-15" },
    { exId: "pushdown", sets: 3, reps: "12-15" }] },
  { id: "t-pull", name: "Pull Day", exercises: [
    { exId: "deadlift", sets: 3, reps: "5" }, { exId: "pullup", sets: 3, reps: "6-10" },
    { exId: "bb-row", sets: 3, reps: "8-10" }, { exId: "face-pull", sets: 3, reps: "15" },
    { exId: "bb-curl", sets: 3, reps: "10-12" }] },
  { id: "t-legs", name: "Leg Day", exercises: [
    { exId: "squat", sets: 4, reps: "6-8" }, { exId: "rdl", sets: 3, reps: "8-10" },
    { exId: "leg-press", sets: 3, reps: "10-12" }, { exId: "leg-curl", sets: 3, reps: "12" },
    { exId: "calf", sets: 4, reps: "12-15" }] },
  { id: "t-full", name: "Full Body", exercises: [
    { exId: "squat", sets: 3, reps: "8" }, { exId: "bb-bench", sets: 3, reps: "8" },
    { exId: "bb-row", sets: 3, reps: "10" }, { exId: "ohp", sets: 3, reps: "10" },
    { exId: "plank", sets: 3, reps: "45s" }] },
];

const ACCENTS = {
  ember:   { name: "Ember",   a: "#FF6A3D", b: "#FFB03A" },
  glacier: { name: "Glacier", a: "#4FB8FF", b: "#7DF0C8" },
  violet:  { name: "Violet",  a: "#A78BFA", b: "#F472B6" },
  lime:    { name: "Citrus",  a: "#C6F14E", b: "#5CE0A1" },
};
const REST_COLOR = "#4ED8B8";

const DEFAULT_DATA = {
  settings: { name: "", unit: "kg", accent: "ember", restDefault: 90, sound: true, weeklyGoal: 4, increment: 2.5 },
  customExercises: [],
  templates: DEFAULT_TEMPLATES,
  sessions: [],
  bodyweight: [],
};

/* ----------------------------- helpers ---------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const KG_LB = 2.2046226;
const toDisp = (kg, unit) => unit === "lb" ? Math.round(kg * KG_LB * 10) / 10 : Math.round(kg * 10) / 10;
const toKg = (val, unit) => unit === "lb" ? val / KG_LB : val;
const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtVol = (kg, unit) => {
  const v = unit === "lb" ? kg * KG_LB : kg;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;
};
const sessionVolume = (s) => s.entries.reduce((a, e) => a + e.sets.reduce((b, st) => b + (st.weightKg || 0) * (st.reps || 0), 0), 0);
const startOfWeek = (d) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x; };

/* ------------------------------ app ------------------------------- */

export default function GymCompanion() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [session, setSession] = useState(null);          // active workout
  const [rest, setRest] = useState(null);                // {endAt, total}
  const [editTpl, setEditTpl] = useState(null);          // template id being edited
  const [summary, setSummary] = useState(null);          // finished-workout summary
  const audioRef = useRef(null);

  /* persistence */
  useEffect(() => { (async () => {
    try {
      const r = await appStorage.get("gym-companion-v1");
      if (r?.value) {
        const parsed = JSON.parse(r.value);
        setData({ ...DEFAULT_DATA, ...parsed, settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) } });
      }
    } catch (e) { /* first run */ }
    setLoaded(true);
  })(); }, []);

  useEffect(() => {
    if (!loaded) return;
    appStorage.set("gym-companion-v1", JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  const S = data.settings;
  const AC = ACCENTS[S.accent] || ACCENTS.ember;
  const allExercises = useMemo(() => [...BASE_EXERCISES, ...data.customExercises], [data.customExercises]);
  const exById = useMemo(() => Object.fromEntries(allExercises.map(e => [e.id, e])), [allExercises]);

  const beep = useCallback((freq = 880, when = 0, dur = 0.12) => {
    if (!S.sound) return;
    try {
      const ctx = audioRef.current || (audioRef.current = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + when;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }, [S.sound]);

  /* last performance per exercise, for prefills + suggestions */
  const lastPerf = useMemo(() => {
    const m = {};
    [...data.sessions].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(s =>
      s.entries.forEach(e => {
        const top = Math.max(0, ...e.sets.map(st => st.weightKg || 0));
        if (e.sets.length) m[e.exId] = { weightKg: top, sets: e.sets.length };
      }));
    return m;
  }, [data.sessions]);

  /* --------- session actions --------- */
  const startFromTemplate = (tpl) => {
    setSession({
      name: tpl ? tpl.name : "Quick Workout",
      startedAt: Date.now(),
      entries: (tpl ? tpl.exercises : []).map(te => ({
        key: uid(), exId: te.exId, targetReps: te.reps,
        sets: Array.from({ length: te.sets }, () => ({
          done: false,
          reps: "",
          weight: lastPerf[te.exId] ? String(toDisp(lastPerf[te.exId].weightKg, S.unit)) : "",
        })),
      })),
    });
    setTab("train");
  };

  const finishSession = () => {
    const entries = session.entries.map(e => ({
      exId: e.exId,
      sets: e.sets.filter(st => st.done && Number(st.reps) > 0).map(st => ({
        reps: Number(st.reps), weightKg: Math.max(0, toKg(Number(st.weight) || 0, S.unit)),
      })),
    })).filter(e => e.sets.length);
    const rec = {
      id: uid(), date: new Date().toISOString(), name: session.name,
      durationSec: Math.round((Date.now() - session.startedAt) / 1000), entries,
    };
    if (entries.length) setData(d => ({ ...d, sessions: [...d.sessions, rec] }));
    setSummary(entries.length ? rec : null);
    setSession(null); setRest(null);
    if (!entries.length) setTab("train");
  };

  const startRest = () => { beep(660); setRest({ endAt: Date.now() + S.restDefault * 1000, total: S.restDefault }); };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0B0D11", display: "grid", placeItems: "center", color: "#8A93A3", fontFamily: "Inter, sans-serif" }}>
      Loading your training log…
    </div>
  );

  const view = session
    ? <SessionView session={session} setSession={setSession} exById={exById} unit={S.unit} accent={AC}
        increment={S.increment} lastPerf={lastPerf} onSetDone={startRest} onFinish={finishSession} beep={beep} allExercises={allExercises} />
    : summary
    ? <SummaryView rec={summary} unit={S.unit} accent={AC} exById={exById} onClose={() => { setSummary(null); setTab("home"); }} />
    : editTpl
    ? <TemplateEditor data={data} setData={setData} tplId={editTpl} exById={exById} allExercises={allExercises}
        accent={AC} onBack={() => setEditTpl(null)} />
    : tab === "home" ? <HomeView data={data} exById={exById} accent={AC} onStart={startFromTemplate} goTrain={() => setTab("train")} />
    : tab === "train" ? <TrainView data={data} setData={setData} exById={exById} accent={AC} onStart={startFromTemplate} onEdit={setEditTpl} />
    : tab === "library" ? <LibraryView allExercises={allExercises} setData={setData} accent={AC} lastPerf={lastPerf} unit={S.unit} />
    : tab === "progress" ? <ProgressView data={data} setData={setData} exById={exById} accent={AC} />
    : <SettingsView data={data} setData={setData} accent={AC} />;

  return (
    <div style={{ minHeight: "100vh", background: "#07080B", display: "flex", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, select { outline: none; }
        input::placeholder { color: #4E5665; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes pop { 0% { transform: scale(.8); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        button { font-family: inherit; cursor: pointer; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 440, background: "#0B0D11", color: "#EDEFF4", position: "relative", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: session ? 120 : 92 }}>{view}</div>
        {!session && !summary && !editTpl && <TabBar tab={tab} setTab={setTab} accent={AC} />}
        {rest && <RestOverlay rest={rest} setRest={setRest} beep={beep} />}
      </div>
    </div>
  );
}

/* --------------------------- primitives --------------------------- */

const card = { background: "#14181F", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 16 };
const sub = { color: "#8A93A3", fontSize: 12, fontWeight: 500, letterSpacing: 0.2 };
const displayFont = { fontFamily: "'Sora', sans-serif", fontVariantNumeric: "tabular-nums" };
const inputStyle = { background: "#0E1116", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#EDEFF4", padding: "10px 12px", fontSize: 14, width: "100%" };

function GradText({ accent, children, style }) {
  return <span style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", ...style }}>{children}</span>;
}

function PrimaryBtn({ accent, children, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#1B1F27" : `linear-gradient(90deg, ${accent.a}, ${accent.b})`,
      color: disabled ? "#5A6272" : "#0B0D11", border: "none", borderRadius: 14, padding: "13px 18px",
      fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...style,
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.05)", color: "#C7CDD8", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14, padding: "12px 16px", fontWeight: 600, fontSize: 13,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...style,
    }}>{children}</button>
  );
}

function Header({ eyebrow, title, right }) {
  return (
    <div style={{ padding: "26px 20px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
      <div>
        <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.4, fontSize: 11 }}>{eyebrow}</div>
        <div style={{ ...displayFont, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function TabBar({ tab, setTab, accent }) {
  const items = [
    ["home", Home, "Home"], ["train", Dumbbell, "Train"], ["library", BookOpen, "Library"],
    ["progress", TrendingUp, "Progress"], ["settings", Settings, "Settings"],
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(11,13,17,0.92)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", padding: "10px 8px calc(12px + env(safe-area-inset-bottom))" }}>
      {items.map(([id, Icon, label]) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} aria-label={label} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 4 }}>
            <Icon size={21} color={active ? accent.a : "#5A6272"} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#EDEFF4" : "#5A6272" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ home ------------------------------ */

function HomeView({ data, exById, accent, onStart, goTrain }) {
  const S = data.settings;
  const now = new Date();
  const weekStart = startOfWeek(now);
  const thisWeek = data.sessions.filter(s => new Date(s.date) >= weekStart);
  const goal = S.weeklyGoal || 4;
  const pct = Math.min(1, thisWeek.length / goal);

  /* week streak: consecutive weeks (incl. current if active) with ≥1 session */
  let streak = 0;
  { const has = new Set(data.sessions.map(s => startOfWeek(new Date(s.date)).getTime()));
    let w = startOfWeek(now).getTime();
    if (!has.has(w)) w -= 7 * 86400000;
    while (has.has(w)) { streak++; w -= 7 * 86400000; } }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    const vol = data.sessions.filter(s => dayKey(s.date) === key).reduce((a, s) => a + sessionVolume(s), 0);
    return { day: d.toLocaleDateString(undefined, { weekday: "narrow" }), vol: Math.round(vol) };
  });
  const weekVol = thisWeek.reduce((a, s) => a + sessionVolume(s), 0);
  const lastSession = data.sessions[data.sessions.length - 1];

  /* suggest next template: least-recently trained */
  const lastUse = {}; data.sessions.forEach(s => { lastUse[s.name] = s.date; });
  const nextTpl = [...data.templates].sort((a, b) => new Date(lastUse[a.name] || 0) - new Date(lastUse[b.name] || 0))[0];

  const R = 34, C = 2 * Math.PI * R;
  const greet = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ animation: "rise .35s ease" }}>
      <Header eyebrow={greet + (S.name ? `, ${S.name}` : "")} title="Ready to train?"
        right={<div style={{ display: "flex", alignItems: "center", gap: 6, background: "#14181F", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 999, padding: "7px 12px" }}>
          <Flame size={15} color={accent.a} />
          <span style={{ ...displayFont, fontSize: 14, fontWeight: 700 }}>{streak}</span>
          <span style={{ ...sub, fontSize: 11 }}>wk</span>
        </div>} />

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* weekly rhythm */}
        <div style={{ ...card, display: "flex", gap: 18, alignItems: "center" }}>
          <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label="Weekly goal progress">
            <circle cx="44" cy="44" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <circle cx="44" cy="44" r={R} stroke={`url(#hg)`} strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset .6s ease" }} />
            <defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accent.a} /><stop offset="100%" stopColor={accent.b} /></linearGradient></defs>
            <text x="44" y="42" textAnchor="middle" fill="#EDEFF4" style={{ ...displayFont, fontSize: 20, fontWeight: 800 }}>{thisWeek.length}</text>
            <text x="44" y="58" textAnchor="middle" fill="#8A93A3" style={{ fontSize: 10 }}>of {goal}</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10 }}>This week</div>
            <div style={{ ...displayFont, fontSize: 17, fontWeight: 700, marginTop: 3 }}>
              {thisWeek.length >= goal ? <GradText accent={accent}>Goal hit — keep rolling</GradText>
                : `${goal - thisWeek.length} workout${goal - thisWeek.length > 1 ? "s" : ""} to goal`}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <Stat label="Volume" value={fmtVol(weekVol, S.unit)} unit={S.unit} />
              <Stat label="Sessions" value={data.sessions.length} unit="total" />
            </div>
          </div>
        </div>

        {/* quick start */}
        {nextTpl && (
          <div style={{ ...card, background: `linear-gradient(135deg, ${accent.a}22, ${accent.b}10), #14181F` }}>
            <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10 }}>Up next</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <div>
                <div style={{ ...displayFont, fontSize: 20, fontWeight: 800 }}>{nextTpl.name}</div>
                <div style={{ ...sub, marginTop: 4 }}>
                  {nextTpl.exercises.slice(0, 3).map(e => exById[e.exId]?.name.split(" ")[0]).join(" · ")}
                  {nextTpl.exercises.length > 3 ? ` +${nextTpl.exercises.length - 3}` : ""}
                </div>
              </div>
              <PrimaryBtn accent={accent} onClick={() => onStart(nextTpl)} style={{ padding: "12px 16px" }}>
                <Play size={16} fill="#0B0D11" /> Start
              </PrimaryBtn>
            </div>
          </div>
        )}

        {/* last 7 days volume */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10 }}>Last 7 days · volume ({S.unit})</div>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={last7} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: "#5A6272", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="vol" radius={[5, 5, 5, 5]} fill={accent.a} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* last workout */}
        {lastSession ? (
          <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10 }}>Last workout</div>
              <div style={{ ...displayFont, fontSize: 15, fontWeight: 700, marginTop: 4 }}>{lastSession.name}</div>
              <div style={{ ...sub, marginTop: 3 }}>
                {new Date(lastSession.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {fmtDur(lastSession.durationSec)} · {fmtVol(sessionVolume(lastSession), S.unit)} {S.unit}
              </div>
            </div>
            <GhostBtn onClick={goTrain} style={{ padding: "10px 12px" }}>Train <ChevronRight size={15} /></GhostBtn>
          </div>
        ) : (
          <div style={{ ...card, textAlign: "center", padding: 26 }}>
            <div style={{ ...displayFont, fontSize: 16, fontWeight: 700 }}>Your log is empty</div>
            <div style={{ ...sub, marginTop: 6 }}>Start a workout above — every set you check gets saved here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div>
      <div style={{ ...displayFont, fontSize: 17, fontWeight: 800 }}>{value}<span style={{ ...sub, fontSize: 11, marginLeft: 4 }}>{unit}</span></div>
      <div style={{ ...sub, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

/* ------------------------------ train ----------------------------- */

function TrainView({ data, setData, exById, accent, onStart, onEdit }) {
  const newTemplate = () => {
    const id = uid();
    setData(d => ({ ...d, templates: [...d.templates, { id, name: "New Plan", exercises: [] }] }));
    onEdit(id);
  };
  return (
    <div style={{ animation: "rise .35s ease" }}>
      <Header eyebrow="Training" title="Workout plans"
        right={<GhostBtn onClick={newTemplate} style={{ padding: "9px 12px" }}><Plus size={15} /> New</GhostBtn>} />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <PrimaryBtn accent={accent} onClick={() => onStart(null)}>
          <Zap size={16} /> Quick workout — build as you go
        </PrimaryBtn>
        {data.templates.map(t => (
          <div key={t.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...displayFont, fontSize: 16, fontWeight: 700 }}>{t.name}</div>
                <div style={{ ...sub, marginTop: 4 }}>
                  {t.exercises.length} exercises · {t.exercises.reduce((a, e) => a + e.sets, 0)} sets
                </div>
              </div>
              <button onClick={() => onEdit(t.id)} aria-label="Edit plan" style={{ background: "none", border: "none", color: "#8A93A3", padding: 8 }}><Pencil size={17} /></button>
              <PrimaryBtn accent={accent} onClick={() => onStart(t)} style={{ padding: "10px 14px" }}>
                <Play size={14} fill="#0B0D11" /> Start
              </PrimaryBtn>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {t.exercises.map((e, i) => (
                <span key={i} style={{ background: "#0E1116", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 999, padding: "5px 10px", fontSize: 11, color: "#AEB6C4" }}>
                  {exById[e.exId]?.name || "?"} · {e.sets}×{e.reps}
                </span>
              ))}
              {!t.exercises.length && <span style={sub}>Empty — tap the pencil to add exercises.</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- template editor ------------------------ */

function TemplateEditor({ data, setData, tplId, exById, allExercises, accent, onBack }) {
  const tpl = data.templates.find(t => t.id === tplId);
  const [picker, setPicker] = useState(false);
  if (!tpl) { onBack(); return null; }

  const update = (fn) => setData(d => ({ ...d, templates: d.templates.map(t => t.id === tplId ? fn(t) : t) }));
  const setEx = (i, patch) => update(t => ({ ...t, exercises: t.exercises.map((e, j) => j === i ? { ...e, ...patch } : e) }));
  const move = (i, dir) => update(t => {
    const arr = [...t.exercises]; const j = i + dir;
    if (j < 0 || j >= arr.length) return t;
    [arr[i], arr[j]] = [arr[j], arr[i]]; return { ...t, exercises: arr };
  });

  return (
    <div style={{ animation: "rise .3s ease" }}>
      <div style={{ padding: "22px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back" style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 12, padding: 9, color: "#EDEFF4" }}><ChevronLeft size={18} /></button>
        <input value={tpl.name} onChange={e => update(t => ({ ...t, name: e.target.value }))}
          style={{ ...inputStyle, ...displayFont, fontSize: 18, fontWeight: 700, background: "transparent", border: "none", padding: 4 }} />
        <button onClick={() => { setData(d => ({ ...d, templates: d.templates.filter(t => t.id !== tplId) })); onBack(); }}
          aria-label="Delete plan" style={{ background: "none", border: "none", color: "#E0606B", padding: 8 }}><Trash2 size={17} /></button>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {tpl.exercises.map((e, i) => (
          <div key={i} style={{ ...card, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{exById[e.exId]?.name || "Unknown"}</div>
              <div style={{ display: "flex", gap: 2 }}>
                <IconMini onClick={() => move(i, -1)} label="Move up">↑</IconMini>
                <IconMini onClick={() => move(i, 1)} label="Move down">↓</IconMini>
                <IconMini onClick={() => update(t => ({ ...t, exercises: t.exercises.filter((_, j) => j !== i) }))} label="Remove" danger><X size={14} /></IconMini>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <label style={{ flex: 1 }}>
                <div style={{ ...sub, fontSize: 10, marginBottom: 4 }}>SETS</div>
                <input type="number" min="1" value={e.sets} onChange={ev => setEx(i, { sets: Math.max(1, Number(ev.target.value) || 1) })} style={inputStyle} />
              </label>
              <label style={{ flex: 2 }}>
                <div style={{ ...sub, fontSize: 10, marginBottom: 4 }}>TARGET REPS</div>
                <input value={e.reps} onChange={ev => setEx(i, { reps: ev.target.value })} placeholder="e.g. 8-10" style={inputStyle} />
              </label>
            </div>
          </div>
        ))}
        <GhostBtn onClick={() => setPicker(true)}><Plus size={15} /> Add exercise</GhostBtn>
      </div>

      {picker && <ExercisePicker allExercises={allExercises} accent={accent} onClose={() => setPicker(false)}
        onPick={ex => { update(t => ({ ...t, exercises: [...t.exercises, { exId: ex.id, sets: 3, reps: "8-12" }] })); setPicker(false); }} />}
    </div>
  );
}

function IconMini({ children, onClick, label, danger }) {
  return <button onClick={onClick} aria-label={label} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 9, width: 30, height: 30, color: danger ? "#E0606B" : "#8A93A3", display: "grid", placeItems: "center", fontSize: 13 }}>{children}</button>;
}

/* --------------------------- live session ------------------------- */

function SessionView({ session, setSession, exById, unit, accent, increment, lastPerf, onSetDone, onFinish, allExercises }) {
  const [elapsed, setElapsed] = useState(0);
  const [picker, setPicker] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - session.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [session.startedAt]);

  const doneSets = session.entries.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const totalSets = session.entries.reduce((a, e) => a + e.sets.length, 0);

  const patchSet = (ek, si, patch) => setSession(s => ({
    ...s, entries: s.entries.map(e => e.key !== ek ? e : { ...e, sets: e.sets.map((st, j) => j === si ? { ...st, ...patch } : st) }),
  }));
  const addSet = (ek) => setSession(s => ({
    ...s, entries: s.entries.map(e => e.key !== ek ? e : { ...e, sets: [...e.sets, { done: false, reps: "", weight: e.sets[e.sets.length - 1]?.weight || "" }] }),
  }));
  const removeEntry = (ek) => setSession(s => ({ ...s, entries: s.entries.filter(e => e.key !== ek) }));

  return (
    <div style={{ animation: "rise .3s ease" }}>
      {/* sticky session header */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(11,13,17,0.94)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ ...sub, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.3 }}>In session</div>
          <div style={{ ...displayFont, fontSize: 18, fontWeight: 800 }}>{session.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...displayFont, fontSize: 20, fontWeight: 800 }}><GradText accent={accent}>{fmtDur(elapsed)}</GradText></div>
          <div style={{ ...sub, fontSize: 11 }}>{doneSets}/{totalSets} sets</div>
        </div>
      </div>

      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {session.entries.map(entry => {
          const ex = exById[entry.exId];
          const last = lastPerf[entry.exId];
          const suggest = last && last.weightKg > 0 ? toDisp(last.weightKg + increment, unit) : null;
          return (
            <div key={entry.key} style={{ ...card, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{ex?.name || "Exercise"}</div>
                  <div style={{ ...sub, marginTop: 3 }}>
                    {ex?.muscle}{entry.targetReps ? ` · target ${entry.targetReps} reps` : ""}
                    {last?.weightKg > 0 && ` · last ${toDisp(last.weightKg, unit)} ${unit}`}
                  </div>
                </div>
                <IconMini onClick={() => removeEntry(entry.key)} label="Remove exercise" danger><X size={14} /></IconMini>
              </div>
              {suggest && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: `${accent.a}1A`, border: `1px solid ${accent.a}44`, borderRadius: 999, padding: "4px 10px", fontSize: 11, color: accent.b, fontWeight: 600 }}>
                  <TrendingUp size={12} /> Progression: try {suggest} {unit}
                </div>
              )}
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, ...sub, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  <span style={{ width: 24 }}>Set</span><span style={{ flex: 1 }}>Weight ({unit})</span><span style={{ flex: 1 }}>Reps</span><span style={{ width: 40 }} />
                </div>
                {entry.sets.map((st, si) => (
                  <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", opacity: st.done ? 0.9 : 1 }}>
                    <span style={{ width: 24, ...displayFont, fontSize: 13, fontWeight: 700, color: st.done ? accent.b : "#5A6272" }}>{si + 1}</span>
                    <input inputMode="decimal" value={st.weight} disabled={st.done} placeholder="0"
                      onChange={e => patchSet(entry.key, si, { weight: e.target.value })}
                      style={{ ...inputStyle, flex: 1, textAlign: "center", ...displayFont, fontWeight: 600, borderColor: st.done ? `${accent.a}55` : "rgba(255,255,255,0.08)" }} />
                    <input inputMode="numeric" value={st.reps} disabled={st.done} placeholder="0"
                      onChange={e => patchSet(entry.key, si, { reps: e.target.value })}
                      style={{ ...inputStyle, flex: 1, textAlign: "center", ...displayFont, fontWeight: 600, borderColor: st.done ? `${accent.a}55` : "rgba(255,255,255,0.08)" }} />
                    <button aria-label={st.done ? "Undo set" : "Complete set"}
                      onClick={() => {
                        if (st.done) { patchSet(entry.key, si, { done: false }); return; }
                        if (!Number(st.reps)) return;
                        patchSet(entry.key, si, { done: true }); onSetDone();
                      }}
                      style={{ width: 40, height: 40, borderRadius: 12, border: "none", display: "grid", placeItems: "center",
                        background: st.done ? `linear-gradient(135deg, ${accent.a}, ${accent.b})` : "rgba(255,255,255,0.06)",
                        color: st.done ? "#0B0D11" : "#8A93A3", animation: st.done ? "pop .25s ease" : "none" }}>
                      <Check size={17} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addSet(entry.key)} style={{ background: "none", border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 10, padding: 8, color: "#8A93A3", fontSize: 12, fontWeight: 600 }}>
                  + Add set
                </button>
              </div>
            </div>
          );
        })}
        <GhostBtn onClick={() => setPicker(true)}><Plus size={15} /> Add exercise</GhostBtn>
      </div>

      {/* finish bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px calc(16px + env(safe-area-inset-bottom))", background: "linear-gradient(transparent, #0B0D11 30%)", display: "flex", gap: 10 }}>
        <GhostBtn onClick={() => { if (window.confirm("Discard this workout?")) { setSession(null); } }} style={{ flex: 1 }}>Discard</GhostBtn>
        <PrimaryBtn accent={accent} onClick={onFinish} style={{ flex: 2 }} disabled={!doneSets}>
          <Trophy size={16} /> Finish workout
        </PrimaryBtn>
      </div>

      {picker && <ExercisePicker allExercises={allExercises} accent={accent} onClose={() => setPicker(false)}
        onPick={ex => {
          setSession(s => ({ ...s, entries: [...s.entries, { key: uid(), exId: ex.id, targetReps: "", sets: [{ done: false, reps: "", weight: lastPerf[ex.id] ? String(toDisp(lastPerf[ex.id].weightKg, unit)) : "" }] }] }));
          setPicker(false);
        }} />}
    </div>
  );
}

/* --------------------------- rest overlay ------------------------- */

function RestOverlay({ rest, setRest, beep }) {
  const [left, setLeft] = useState(Math.ceil((rest.endAt - Date.now()) / 1000));
  const warned = useRef(false);
  useEffect(() => {
    warned.current = false;
    const t = setInterval(() => {
      const l = Math.ceil((rest.endAt - Date.now()) / 1000);
      setLeft(l);
      if (l === 3 && !warned.current) { warned.current = true; beep(660, 0); beep(660, 0.4); beep(660, 0.8); }
      if (l <= 0) { beep(990, 0, 0.25); beep(990, 0.3, 0.35); setRest(null); }
    }, 250);
    return () => clearInterval(t);
  }, [rest, setRest, beep]);

  const pct = Math.max(0, left) / rest.total;
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, background: "rgba(9,17,16,0.96)", backdropFilter: "blur(16px)", borderTop: `1px solid ${REST_COLOR}44`, borderRadius: "24px 24px 0 0", padding: "18px 20px calc(20px + env(safe-area-inset-bottom))", display: "flex", alignItems: "center", gap: 18, animation: "rise .25s ease" }}>
      <svg width="120" height="120" viewBox="0 0 120 120" role="timer" aria-label="Rest countdown">
        <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="9" fill="none" />
        <circle cx="60" cy="60" r={R} stroke={REST_COLOR} strokeWidth="9" fill="none" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset .25s linear" }} />
        <text x="60" y="66" textAnchor="middle" fill="#EDEFF4" style={{ ...displayFont, fontSize: 26, fontWeight: 800 }}>{fmtDur(Math.max(0, left))}</text>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.4, fontSize: 10, color: REST_COLOR }}>Recovery</div>
        <div style={{ ...displayFont, fontSize: 17, fontWeight: 700, marginTop: 3, color: "#DFF7F0" }}>Breathe. Reset.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => setRest(r => ({ ...r, endAt: r.endAt + 15000, total: r.total + 15 }))}
            style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 12, padding: "10px 14px", color: "#DFF7F0", fontWeight: 700, fontSize: 13 }}>+15s</button>
          <button onClick={() => setRest(null)}
            style={{ background: REST_COLOR, border: "none", borderRadius: 12, padding: "10px 16px", color: "#07120F", fontWeight: 700, fontSize: 13 }}>Skip — back to work</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- workout summary ------------------------ */

function SummaryView({ rec, unit, accent, exById, onClose }) {
  const vol = sessionVolume(rec);
  const sets = rec.entries.reduce((a, e) => a + e.sets.length, 0);
  return (
    <div style={{ padding: "60px 24px 24px", textAlign: "center", animation: "rise .35s ease" }}>
      <div style={{ width: 74, height: 74, margin: "0 auto", borderRadius: 24, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${accent.a}, ${accent.b})`, animation: "pop .4s ease" }}>
        <Trophy size={34} color="#0B0D11" />
      </div>
      <div style={{ ...displayFont, fontSize: 24, fontWeight: 800, marginTop: 18 }}>Workout complete</div>
      <div style={{ ...sub, marginTop: 6 }}>{rec.name} · {new Date(rec.date).toLocaleDateString()}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {[[fmtDur(rec.durationSec), "Duration"], [sets, "Sets done"], [`${fmtVol(vol, unit)} ${unit}`, "Volume"]].map(([v, l]) => (
          <div key={l} style={{ ...card, flex: 1, padding: 14 }}>
            <div style={{ ...displayFont, fontSize: 18, fontWeight: 800 }}><GradText accent={accent}>{v}</GradText></div>
            <div style={{ ...sub, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card, marginTop: 12, textAlign: "left" }}>
        {rec.entries.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < rec.entries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{exById[e.exId]?.name}</span>
            <span style={{ ...sub, ...displayFont }}>{e.sets.length} sets · top {toDisp(Math.max(...e.sets.map(s => s.weightKg)), unit)} {unit}</span>
          </div>
        ))}
      </div>
      <PrimaryBtn accent={accent} onClick={onClose} style={{ marginTop: 20, width: "100%" }}>Done</PrimaryBtn>
    </div>
  );
}

/* ----------------------------- library ---------------------------- */

function LibraryView({ allExercises, setData, accent, lastPerf, unit }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", muscle: "Chest", equipment: "Dumbbell", tip: "" });

  const list = allExercises.filter(e =>
    (muscle === "All" || e.muscle === muscle) && e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ animation: "rise .35s ease" }}>
      <Header eyebrow="Exercise library" title={`${allExercises.length} movements`}
        right={<GhostBtn onClick={() => setAdding(a => !a)} style={{ padding: "9px 12px" }}><Plus size={15} /> Custom</GhostBtn>} />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {adding && (
          <div style={card}>
            <div style={{ ...displayFont, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>New custom exercise</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Exercise name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              <div style={{ display: "flex", gap: 8 }}>
                <select value={form.muscle} onChange={e => setForm(f => ({ ...f, muscle: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
                  {MUSCLES.map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
                  {["Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Kettlebell", "Band"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <input placeholder="Form tip (optional)" value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))} style={inputStyle} />
              <PrimaryBtn accent={accent} disabled={!form.name.trim()} onClick={() => {
                setData(d => ({ ...d, customExercises: [...d.customExercises, { id: "c-" + uid(), ...form, custom: true }] }));
                setForm({ name: "", muscle: "Chest", equipment: "Dumbbell", tip: "" }); setAdding(false);
              }}>Save exercise</PrimaryBtn>
            </div>
          </div>
        )}

        <div style={{ position: "relative" }}>
          <Search size={16} color="#5A6272" style={{ position: "absolute", left: 12, top: 12 }} />
          <input placeholder="Search exercises" value={q} onChange={e => setQ(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {["All", ...MUSCLES].map(m => (
            <button key={m} onClick={() => setMuscle(m)} style={{
              flexShrink: 0, borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 600, border: "1px solid",
              borderColor: muscle === m ? accent.a : "rgba(255,255,255,0.08)",
              background: muscle === m ? `${accent.a}22` : "transparent",
              color: muscle === m ? accent.b : "#8A93A3",
            }}>{m}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map(ex => {
            const isOpen = open === ex.id;
            const pr = lastPerf[ex.id];
            return (
              <div key={ex.id} onClick={() => setOpen(isOpen ? null : ex.id)} style={{ ...card, padding: 14, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {ex.name} {ex.custom && <span style={{ fontSize: 10, color: accent.b, marginLeft: 4 }}>CUSTOM</span>}
                    </div>
                    <div style={{ ...sub, marginTop: 3 }}>{ex.muscle} · {ex.equipment}{pr?.weightKg > 0 ? ` · last ${toDisp(pr.weightKg, unit)} ${unit}` : ""}</div>
                  </div>
                  <ChevronRight size={16} color="#5A6272" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "#0E1116", borderRadius: 12, borderLeft: `3px solid ${accent.a}` }}>
                    <div style={{ ...sub, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Form cue</div>
                    <div style={{ fontSize: 13, color: "#C7CDD8", lineHeight: 1.5 }}>{ex.tip || "No tip added yet."}</div>
                    {ex.custom && (
                      <button onClick={(e) => { e.stopPropagation(); setData(d => ({ ...d, customExercises: d.customExercises.filter(c => c.id !== ex.id) })); }}
                        style={{ marginTop: 10, background: "none", border: "none", color: "#E0606B", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                        <Trash2 size={13} /> Delete custom exercise
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {!list.length && <div style={{ ...card, textAlign: "center", ...sub, padding: 24 }}>No matches — try another search or add a custom exercise.</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- exercise picker ------------------------ */

function ExercisePicker({ allExercises, accent, onPick, onClose }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("All");
  const list = allExercises.filter(e =>
    (muscle === "All" || e.muscle === muscle) && e.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(7,8,11,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "78%", background: "#12151B", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", animation: "rise .25s ease" }}>
        <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...displayFont, fontSize: 16, fontWeight: 700, flex: 1 }}>Add exercise</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, padding: 8, color: "#EDEFF4" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "0 18px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input autoFocus placeholder="Search" value={q} onChange={e => setQ(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {["All", ...MUSCLES].map(m => (
              <button key={m} onClick={() => setMuscle(m)} style={{ flexShrink: 0, borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, border: "1px solid", borderColor: muscle === m ? accent.a : "rgba(255,255,255,0.08)", background: muscle === m ? `${accent.a}22` : "transparent", color: muscle === m ? accent.b : "#8A93A3" }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: "0 18px 24px" }}>
          {list.map(ex => (
            <button key={ex.id} onClick={() => onPick(ex)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "13px 4px", color: "#EDEFF4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</span>
              <span style={{ ...sub }}>{ex.muscle}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- progress --------------------------- */

const PIE_COLORS = ["#FF6A3D", "#FFB03A", "#4ED8B8", "#4FB8FF", "#A78BFA", "#F472B6", "#C6F14E", "#8A93A3", "#E0606B"];

function ProgressView({ data, setData, exById, accent }) {
  const S = data.settings;
  const [bw, setBw] = useState("");

  const volSeries = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const key = dayKey(d);
      const vol = data.sessions.filter(s => dayKey(s.date) === key).reduce((a, s) => a + sessionVolume(s), 0);
      return { day: d.toLocaleDateString(undefined, { day: "numeric" }), vol: Math.round(S.unit === "lb" ? vol * KG_LB : vol) };
    });
  }, [data.sessions, S.unit]);

  const muscleDist = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const counts = {};
    data.sessions.filter(s => new Date(s.date) >= cutoff).forEach(s =>
      s.entries.forEach(e => {
        const m = exById[e.exId]?.muscle || "Other";
        counts[m] = (counts[m] || 0) + e.sets.length;
      }));
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data.sessions, exById]);

  const prs = useMemo(() => {
    const best = {};
    data.sessions.forEach(s => s.entries.forEach(e => e.sets.forEach(st => {
      if (!st.weightKg) return;
      const e1rm = st.weightKg * (1 + st.reps / 30);
      if (!best[e.exId] || e1rm > best[e.exId].e1rm) best[e.exId] = { e1rm, w: st.weightKg, reps: st.reps };
    })));
    return Object.entries(best).map(([exId, v]) => ({ exId, ...v })).sort((a, b) => b.e1rm - a.e1rm).slice(0, 6);
  }, [data.sessions]);

  const bwSeries = data.bodyweight.map(b => ({ day: new Date(b.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }), w: toDisp(b.kg, S.unit) }));
  const tooltipStyle = { background: "#181C24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12, color: "#EDEFF4" };

  return (
    <div style={{ animation: "rise .35s ease" }}>
      <Header eyebrow="Analytics" title="Your progress" />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>

        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 8 }}>Volume · last 14 days ({S.unit})</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={volSeries} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#5A6272", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "#5A6272", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="vol" fill={accent.a} radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 4 }}>Muscle focus · sets, last 30 days</div>
          {muscleDist.length ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <ResponsiveContainer width="55%" height={150}>
                <PieChart>
                  <Pie data={muscleDist} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3} stroke="none">
                    {muscleDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {muscleDist.slice(0, 5).map((m, i) => (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ flex: 1, color: "#C7CDD8" }}>{m.name}</span>
                    <span style={{ ...displayFont, fontWeight: 700 }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ ...sub, padding: "14px 0" }}>Log a workout to see where your sets are going.</div>}
        </div>

        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 8 }}>Strength — best estimated 1RM</div>
          {prs.length ? prs.map((p, i) => (
            <div key={p.exId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < prs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <Trophy size={15} color={i === 0 ? accent.b : "#5A6272"} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{exById[p.exId]?.name || p.exId}</span>
              <span style={{ ...displayFont, fontWeight: 800, fontSize: 14 }}>
                <GradText accent={accent}>{toDisp(p.e1rm, S.unit)} {S.unit}</GradText>
              </span>
              <span style={{ ...sub, fontSize: 11 }}>{toDisp(p.w, S.unit)}×{p.reps}</span>
            </div>
          )) : <div style={{ ...sub, padding: "10px 0" }}>PRs will appear once you log weighted sets.</div>}
        </div>

        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 8 }}>
            <Scale size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Body weight ({S.unit})
          </div>
          {bwSeries.length > 1 && (
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={bwSeries} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#5A6272", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: "#5A6272", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="w" stroke={REST_COLOR} strokeWidth={2.5} dot={{ r: 3, fill: REST_COLOR }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input inputMode="decimal" placeholder={`Today's weight (${S.unit})`} value={bw} onChange={e => setBw(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <PrimaryBtn accent={accent} disabled={!Number(bw)} style={{ padding: "10px 16px" }} onClick={() => {
              setData(d => ({ ...d, bodyweight: [...d.bodyweight.filter(b => dayKey(b.date) !== dayKey(new Date())), { date: new Date().toISOString(), kg: toKg(Number(bw), S.unit) }] }));
              setBw("");
            }}>Log</PrimaryBtn>
          </div>
        </div>

        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 8 }}>History</div>
          {[...data.sessions].reverse().slice(0, 8).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ ...sub, fontSize: 11 }}>{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {fmtDur(s.durationSec)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...displayFont, fontSize: 13, fontWeight: 700 }}>{fmtVol(sessionVolume(s), S.unit)} {S.unit}</span>
                <button aria-label="Delete session" onClick={() => { if (window.confirm("Delete this workout from history?")) setData(d => ({ ...d, sessions: d.sessions.filter(x => x.id !== s.id) })); }}
                  style={{ background: "none", border: "none", color: "#5A6272", padding: 4 }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {!data.sessions.length && <div style={{ ...sub, padding: "10px 0" }}>No workouts yet.</div>}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- settings --------------------------- */

function SettingsView({ data, setData, accent }) {
  const S = data.settings;
  const set = (patch) => setData(d => ({ ...d, settings: { ...d.settings, ...patch } }));
  const Row = ({ icon: Icon, label, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Icon size={17} color="#8A93A3" />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
  const Seg = ({ options, value, onChange }) => (
    <div style={{ display: "flex", background: "#0E1116", borderRadius: 11, padding: 3, border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{
          border: "none", borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 700,
          background: value === v ? `linear-gradient(90deg, ${accent.a}, ${accent.b})` : "transparent",
          color: value === v ? "#0B0D11" : "#8A93A3",
        }}>{l}</button>
      ))}
    </div>
  );

  return (
    <div style={{ animation: "rise .35s ease" }}>
      <Header eyebrow="Preferences" title="Settings" />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 6 }}>Profile</div>
          <input placeholder="Your name" value={S.name} onChange={e => set({ name: e.target.value })} style={inputStyle} />
        </div>

        <div style={card}>
          <Row icon={Scale} label="Units">
            <Seg options={[["kg", "kg"], ["lb", "lb"]]} value={S.unit} onChange={v => set({ unit: v })} />
          </Row>
          <Row icon={Clock} label="Default rest">
            <Seg options={[[60, "60s"], [90, "90s"], [120, "120s"], [180, "3m"]]} value={S.restDefault} onChange={v => set({ restDefault: v })} />
          </Row>
          <Row icon={Zap} label="Sound cues">
            <Seg options={[[true, "On"], [false, "Off"]]} value={S.sound} onChange={v => set({ sound: v })} />
          </Row>
          <Row icon={TrendingUp} label="Progression step">
            <Seg options={[[1.25, "+1.25"], [2.5, "+2.5"], [5, "+5"]]} value={S.increment} onChange={v => set({ increment: v })} />
          </Row>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
            <Trophy size={17} color="#8A93A3" />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Weekly goal</span>
            <Seg options={[[3, "3"], [4, "4"], [5, "5"], [6, "6"]]} value={S.weeklyGoal} onChange={v => set({ weeklyGoal: v })} />
          </div>
        </div>

        <div style={card}>
          <div style={{ ...sub, textTransform: "uppercase", letterSpacing: 1.2, fontSize: 10, marginBottom: 10 }}>Theme accent</div>
          <div style={{ display: "flex", gap: 10 }}>
            {Object.entries(ACCENTS).map(([key, a]) => (
              <button key={key} onClick={() => set({ accent: key })} aria-label={a.name} style={{
                flex: 1, height: 52, borderRadius: 14, border: S.accent === key ? "2px solid #EDEFF4" : "2px solid transparent",
                background: `linear-gradient(135deg, ${a.a}, ${a.b})`, display: "grid", placeItems: "end center", padding: 6,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#0B0D11" }}>{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ ...sub, marginBottom: 10 }}>Progression step is the weight bump suggested when you repeat an exercise. Rest timers start automatically each time you complete a set.</div>
          <GhostBtn style={{ width: "100%", color: "#E0606B" }} onClick={() => {
            if (window.confirm("Reset everything? All workouts, plans and settings will be erased.")) setData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
          }}><Trash2 size={15} /> Reset all data</GhostBtn>
        </div>
      </div>
    </div>
  );
}
