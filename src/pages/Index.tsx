import { useState, useCallback, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Tab = "home" | "tasks" | "shop" | "profile" | "settings";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  speed: number;
}

interface FloatLabel {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface Upgrade {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  baseCost: number;
  effect: string;
  level: number;
  maxLevel: number;
  getValue: (level: number) => number;
}

interface Task {
  id: string;
  title: string;
  desc: string;
  reward: number;
  emoji: string;
  done: boolean;
}

interface SaveData {
  stars: number;
  totalStars: number;
  totalClicks: number;
  upgradeLevels: Record<string, number>;
  tasksDone: Record<string, boolean>;
  energy: number;
  level: number;
  xp: number;
}

const EMOJIS = ["⭐", "✨", "💫", "🌟", "⚡", "🔥", "💥", "🌠"];

const UPGRADES_INITIAL: Upgrade[] = [
  { id: "click_power", name: "Сила клика", desc: "Больше звёзд за каждый клик", emoji: "👆", baseCost: 50, effect: "+1 звезда за клик", level: 0, maxLevel: 20, getValue: (l) => l + 1 },
  { id: "star_magnet", name: "Магнит звёзд", desc: "Притягивает звёзды со всей галактики", emoji: "🧲", baseCost: 200, effect: "+5 звёзд за клик", level: 0, maxLevel: 10, getValue: (l) => l * 5 },
  { id: "energy_boost", name: "Турбо-энергия", desc: "Увеличивает максимум энергии", emoji: "⚡", baseCost: 300, effect: "+50 макс. энергии", level: 0, maxLevel: 10, getValue: (l) => l * 50 },
  { id: "auto_clicker", name: "Автокликер", desc: "Автоматически собирает звёзды", emoji: "🤖", baseCost: 500, effect: "+2 звезды/сек", level: 0, maxLevel: 15, getValue: (l) => l * 2 },
  { id: "super_auto", name: "Супер-автомат", desc: "Мощный автоматический коллектор", emoji: "🚀", baseCost: 2000, effect: "+10 звёзд/сек", level: 0, maxLevel: 10, getValue: (l) => l * 10 },
  { id: "multiplier", name: "Множитель", desc: "Усиливает весь доход", emoji: "💎", baseCost: 5000, effect: "x1.5 к доходу", level: 0, maxLevel: 5, getValue: (l) => 1 + l * 0.5 },
  { id: "galaxy_core", name: "Ядро галактики", desc: "Источник бесконечной силы", emoji: "🌌", baseCost: 20000, effect: "+50 звёзд/сек", level: 0, maxLevel: 5, getValue: (l) => l * 50 },
];

const TASKS_INITIAL: Task[] = [
  { id: "t1", title: "Первые 100 звёзд", desc: "Набери 100 звёзд", reward: 50, emoji: "⭐", done: false },
  { id: "t2", title: "Клик-профи", desc: "Кликни 50 раз", reward: 100, emoji: "👆", done: false },
  { id: "t3", title: "Магазин открыт", desc: "Купи первое улучшение", reward: 200, emoji: "🛒", done: false },
  { id: "t4", title: "Тысячник", desc: "Набери 1000 звёзд", reward: 500, emoji: "💫", done: false },
  { id: "t5", title: "Автопилот", desc: "Купи автокликер", reward: 300, emoji: "🤖", done: false },
  { id: "t6", title: "Первый друг", desc: "Пригласи 1 друга по реферальной ссылке", reward: 1000, emoji: "👥", done: false },
];

const XP_PER_LEVEL = 100;
const ENERGY_REGEN_PER_SEC = 1;
const MAX_ENERGY_BASE = 100;

function getUpgradeCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(1.6, upgrade.level));
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem("star_clicker_save");
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch { return null; }
}

function buildUpgrades(levels: Record<string, number>): Upgrade[] {
  return UPGRADES_INITIAL.map((u) => ({ ...u, level: levels[u.id] ?? 0 }));
}

function buildTasks(done: Record<string, boolean>): Task[] {
  return TASKS_INITIAL.map((t) => ({ ...t, done: done[t.id] ?? false }));
}

export default function Index() {
  const saved = loadSave();

  const [tab, setTab] = useState<Tab>("home");
  const [stars, setStars] = useState(saved?.stars ?? 0);
  const [totalStars, setTotalStars] = useState(saved?.totalStars ?? 0);
  const [totalClicks, setTotalClicks] = useState(saved?.totalClicks ?? 0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(saved ? buildUpgrades(saved.upgradeLevels) : UPGRADES_INITIAL);
  const [tasks, setTasks] = useState<Task[]>(saved ? buildTasks(saved.tasksDone) : TASKS_INITIAL);
  const [level, setLevel] = useState(saved?.level ?? 1);
  const [xp, setXp] = useState(saved?.xp ?? 0);
  const [energy, setEnergy] = useState(saved?.energy ?? MAX_ENERGY_BASE);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatLabels, setFloatLabels] = useState<FloatLabel[]>([]);
  const [clickAnim, setClickAnim] = useState(false);
  const [glowRing, setGlowRing] = useState(false);

  const particleId = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const energyRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const starsRef = useRef(stars);
  const upgradesRef = useRef(upgrades);
  const energyRef2 = useRef(energy);
  const levelRef = useRef(level);
  const xpRef = useRef(xp);
  const totalStarsRef = useRef(totalStars);
  const totalClicksRef = useRef(totalClicks);
  const tasksRef = useRef(tasks);

  starsRef.current = stars;
  upgradesRef.current = upgrades;
  energyRef2.current = energy;
  levelRef.current = level;
  xpRef.current = xp;
  totalStarsRef.current = totalStars;
  totalClicksRef.current = totalClicks;
  tasksRef.current = tasks;

  const getMaxEnergy = useCallback((ups: Upgrade[]) => {
    const energyU = ups.find((u) => u.id === "energy_boost");
    return MAX_ENERGY_BASE + (energyU && energyU.level > 0 ? energyU.getValue(energyU.level) : 0);
  }, []);

  const getClickPower = useCallback((ups: Upgrade[]) => {
    let power = 1;
    const clickU = ups.find((u) => u.id === "click_power");
    const magnetU = ups.find((u) => u.id === "star_magnet");
    const multU = ups.find((u) => u.id === "multiplier");
    if (clickU && clickU.level > 0) power += clickU.getValue(clickU.level);
    if (magnetU && magnetU.level > 0) power += magnetU.getValue(magnetU.level);
    if (multU && multU.level > 0) power = Math.floor(power * multU.getValue(multU.level));
    return power;
  }, []);

  const getAutoPerSec = useCallback((ups: Upgrade[]) => {
    let auto = 0;
    const autoU = ups.find((u) => u.id === "auto_clicker");
    const superU = ups.find((u) => u.id === "super_auto");
    const galaxyU = ups.find((u) => u.id === "galaxy_core");
    const multU = ups.find((u) => u.id === "multiplier");
    if (autoU && autoU.level > 0) auto += autoU.getValue(autoU.level);
    if (superU && superU.level > 0) auto += superU.getValue(superU.level);
    if (galaxyU && galaxyU.level > 0) auto += galaxyU.getValue(galaxyU.level);
    if (multU && multU.level > 0) auto = Math.floor(auto * multU.getValue(multU.level));
    return auto;
  }, []);

  // Auto clicker
  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    const perSec = getAutoPerSec(upgrades);
    if (perSec > 0) {
      autoRef.current = setInterval(() => {
        setStars((s) => s + perSec);
        setTotalStars((t) => t + perSec);
      }, 1000);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [upgrades, getAutoPerSec]);

  // Energy regen
  useEffect(() => {
    if (energyRef.current) clearInterval(energyRef.current);
    energyRef.current = setInterval(() => {
      const max = getMaxEnergy(upgradesRef.current);
      setEnergy((e) => Math.min(e + ENERGY_REGEN_PER_SEC, max));
    }, 1000);
    return () => { if (energyRef.current) clearInterval(energyRef.current); };
  }, [upgrades, getMaxEnergy]);

  // Auto-save every 3s
  const triggerSave = useCallback(() => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      const data: SaveData = {
        stars: starsRef.current,
        totalStars: totalStarsRef.current,
        totalClicks: totalClicksRef.current,
        upgradeLevels: Object.fromEntries(upgradesRef.current.map((u) => [u.id, u.level])),
        tasksDone: Object.fromEntries(tasksRef.current.map((t) => [t.id, t.done])),
        energy: energyRef2.current,
        level: levelRef.current,
        xp: xpRef.current,
      };
      localStorage.setItem("star_clicker_save", JSON.stringify(data));
    }, 1500);
  }, []);

  useEffect(() => { triggerSave(); }, [stars, upgrades, tasks, level, xp, energy, triggerSave]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      let newXp = prev + amount;
      let newLevel = levelRef.current;
      const needed = newLevel * XP_PER_LEVEL;
      if (newXp >= needed) {
        newXp -= needed;
        newLevel += 1;
        setLevel(newLevel);
      }
      return newXp;
    });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const curEnergy = energyRef2.current;
    if (curEnergy <= 0) return;

    const ups = upgradesRef.current;
    const power = getClickPower(ups);

    setStars((s) => s + power);
    setTotalStars((t) => t + power);
    setTotalClicks((c) => c + 1);
    setEnergy((en) => Math.max(0, en - 1));
    addXp(1);

    // Click animation — simple flag toggle
    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 250);

    setGlowRing(true);
    setTimeout(() => setGlowRing(false), 500);

    // Particles — pure CSS, limit to 6
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const pid = particleId.current;
    particleId.current += 6;
    const newP: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: pid + i,
      x: cx,
      y: cy,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      angle: (i / 6) * 360,
      speed: 50 + Math.random() * 60,
    }));
    setParticles((p) => [...p.slice(-18), ...newP]);
    setTimeout(() => setParticles((p) => p.filter((x) => x.id < pid || x.id >= pid + 6)), 650);

    const fid = particleId.current++;
    setFloatLabels((f) => [...f.slice(-4), { id: fid, x: cx + (Math.random() - 0.5) * 40, y: cy - 10, value: power }]);
    setTimeout(() => setFloatLabels((f) => f.filter((x) => x.id !== fid)), 800);
  }, [getClickPower, addXp]);

  const buyUpgrade = useCallback((upgradeId: string) => {
    setUpgrades((prev) => {
      const u = prev.find((x) => x.id === upgradeId);
      if (!u) return prev;
      const cost = getUpgradeCost(u);
      if (starsRef.current < cost || u.level >= u.maxLevel) return prev;
      setStars((s) => s - cost);
      setTasks((t) =>
        t.map((task) => {
          if (task.id === "t3" && !task.done) return { ...task, done: true };
          if (task.id === "t5" && !task.done && ["auto_clicker", "super_auto", "galaxy_core"].includes(upgradeId)) return { ...task, done: true };
          return task;
        })
      );
      return prev.map((x) => x.id === upgradeId ? { ...x, level: x.level + 1 } : x);
    });
  }, []);

  const isTaskReady = (task: Task) => {
    if (task.done) return false;
    if (task.id === "t1") return totalStars >= 100;
    if (task.id === "t2") return totalClicks >= 50;
    if (task.id === "t3") return upgrades.some((u) => u.level > 0);
    if (task.id === "t4") return totalStars >= 1000;
    if (task.id === "t5") return upgrades.some((u) => ["auto_clicker", "super_auto", "galaxy_core"].includes(u.id) && u.level > 0);
    if (task.id === "t6") return referrals.length >= 1;
    return false;
  };

  const getRefLink = () => {
    const tgId = getTgUserId();
    const id = tgId || refId;
    return `https://t.me/StarClickerBot?start=${id}`;
  };

  const handleShare = () => {
    const link = getRefLink();
    const text = `🌟 Играю в Star Clicker — кликай по звёздам и зарабатывай! Присоединяйся и получи +${REFERRAL_BONUS} ⭐ бонус!`;
    const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram;
    if (tg?.WebApp?.openTelegramLink) {
      tg.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getRefLink()).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addDemoReferral = () => {
    const name = REF_NAMES[Math.floor(Math.random() * REF_NAMES.length)] + " #" + Math.floor(Math.random() * 999);
    const newRef: Referral = { id: genRefId(), name, joinedAt: Date.now(), bonus: REFERRAL_BONUS };
    setReferrals((r) => [...r, newRef]);
    setStars((s) => s + REFERRAL_BONUS);
    setTotalStars((t) => t + REFERRAL_BONUS);
  };

  const claimTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.done || !isTaskReady(task)) return;
    setStars((s) => s + task.reward);
    setTotalStars((t) => t + task.reward);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done: true } : t));
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return Math.floor(n).toString();
  };

  const autoPerSec = getAutoPerSec(upgrades);
  const clickPower = getClickPower(upgrades);
  const maxEnergy = getMaxEnergy(upgrades);
  const xpToNext = level * XP_PER_LEVEL;
  const energyPct = (energy / maxEnergy) * 100;
  const xpPct = (xp / xpToNext) * 100;

  return (
    <div className="flex flex-col h-full bg-space relative overflow-hidden">

      {/* Static bg dots — no random, no re-render */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[12, 25, 38, 51, 64, 77, 90, 5, 18, 31, 44, 57, 70, 83, 96, 8, 21, 34, 47, 60, 73, 86, 3, 16, 29, 42, 55, 68, 81, 94].map((l, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-white animate-twinkle"
            style={{ left: `${l}%`, top: `${[8,14,22,30,38,46,54,62,70,78,86,92,5,18,27,35,43,51,59,67,75,83,91,12,24,33,41,49,57,65][i]}%`, animationDelay: `${(i * 0.2) % 3}s`, opacity: 0.3 + (i % 4) * 0.1 }}
          />
        ))}
      </div>

      {/* HEADER: баланс + уровень + энергия */}
      <div className="relative z-10 px-4 pt-3 pb-2 shrink-0 space-y-2">
        {/* Row 1: баланс + авто */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span className="font-orbitron text-xl font-black shimmer-text">{formatNum(stars)}</span>
          </div>
          <div className="flex items-center gap-2">
            {autoPerSec > 0 && (
              <div className="glass-card rounded-full px-2.5 py-1 flex items-center gap-1">
                <span className="text-xs">🤖</span>
                <span className="text-xs font-orbitron" style={{ color: "#00F5FF" }}>+{autoPerSec}/с</span>
              </div>
            )}
            <div className="glass-card rounded-full px-2.5 py-1 flex items-center gap-1">
              <span className="text-xs font-orbitron" style={{ color: "#BF5FFF" }}>Ур.{level}</span>
            </div>
          </div>
        </div>

        {/* Row 2: XP bar */}
        <div>
          <div className="flex justify-between text-[10px] text-white/30 mb-0.5">
            <span className="font-rubik">Опыт</span>
            <span className="font-orbitron">{xp}/{xpToNext} XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, #BF5FFF, #00F5FF)" }}
            />
          </div>
        </div>

        {/* Row 3: Energy bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="font-rubik" style={{ color: energy <= 10 ? "#FF2D78" : "rgba(255,255,255,0.4)" }}>
              ⚡ Энергия
            </span>
            <span className="font-orbitron" style={{ color: energy <= 10 ? "#FF2D78" : "rgba(255,255,255,0.4)" }}>
              {Math.floor(energy)}/{maxEnergy}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${energyPct}%`,
                background: energy <= 20
                  ? "linear-gradient(90deg, #FF2D78, #FF6B35)"
                  : "linear-gradient(90deg, #FFD700, #FF6B35)",
              }}
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">

        {/* HOME */}
        {tab === "home" && (
          <div className="flex flex-col items-center justify-center min-h-full px-4 gap-5 py-4">
            <p className="font-orbitron text-[11px] tracking-[0.25em] text-white/40 uppercase">Клик = +{clickPower} ⭐</p>

            {/* STAR BUTTON */}
            <div className="relative flex items-center justify-center select-none">
              {/* Glow ring — CSS only, no state array */}
              {glowRing && (
                <div className="absolute w-52 h-52 rounded-full border-2 border-yellow-400/70 animate-glow-ring pointer-events-none" />
              )}

              <button
                onClick={handleClick}
                className="relative w-52 h-52 rounded-full focus:outline-none transition-transform duration-150"
                style={{
                  transform: clickAnim ? "scale(0.89)" : "scale(1)",
                  background: "radial-gradient(circle at 35% 35%, rgba(255,220,50,0.22) 0%, rgba(255,107,53,0.12) 55%, transparent 75%)",
                  boxShadow: "0 0 50px rgba(255,215,0,0.28), 0 0 100px rgba(255,107,53,0.12), inset 0 0 30px rgba(255,215,0,0.05)",
                  border: "2px solid rgba(255,215,0,0.28)",
                  filter: energy <= 0 ? "grayscale(0.7)" : undefined,
                }}
              >
                {/* Particles inside button */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  {particles.map((p) => (
                    <span
                      key={p.id}
                      className="absolute text-base animate-particle-burst"
                      style={{
                        left: p.x,
                        top: p.y,
                        "--tx": `translate(${Math.cos((p.angle * Math.PI) / 180) * p.speed}px, ${Math.sin((p.angle * Math.PI) / 180) * p.speed}px)`,
                      } as React.CSSProperties}
                    >
                      {p.emoji}
                    </span>
                  ))}
                </div>

                {/* Float labels */}
                {floatLabels.map((f) => (
                  <span
                    key={f.id}
                    className="absolute pointer-events-none animate-float-up font-orbitron font-black text-lg"
                    style={{
                      left: f.x,
                      top: f.y,
                      color: "#FFD700",
                      textShadow: "0 0 8px #FFD700",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    +{f.value}
                  </span>
                ))}

                <span
                  className="text-8xl select-none"
                  style={{
                    display: "block",
                    lineHeight: 1,
                    filter: "drop-shadow(0 0 14px #FFD700) drop-shadow(0 0 30px #FF6B35)",
                    animation: clickAnim ? "none" : "star-pulse 2.5s ease-in-out infinite",
                  }}
                >
                  ⭐
                </span>
              </button>
            </div>

            {energy <= 0 && (
              <p className="text-xs font-rubik" style={{ color: "#FF2D78" }}>Нет энергии! Восстанавливается +1/сек ⚡</p>
            )}

            {/* STATS */}
            <div className="flex gap-3 w-full max-w-xs">
              <div className="flex-1 glass-card rounded-2xl p-3 text-center neon-border">
                <p className="text-white/40 text-xs mb-1">Всего звёзд</p>
                <p className="font-orbitron font-bold text-sm" style={{ color: "#FFD700" }}>{formatNum(totalStars)}</p>
              </div>
              <div className="flex-1 glass-card rounded-2xl p-3 text-center neon-border">
                <p className="text-white/40 text-xs mb-1">Кликов</p>
                <p className="font-orbitron font-bold text-sm" style={{ color: "#00F5FF" }}>{formatNum(totalClicks)}</p>
              </div>
            </div>
          </div>
        )}

        {/* TASKS */}
        {tab === "tasks" && (
          <div className="px-4 py-4 space-y-3">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Задания</h2>
            {tasks.map((task) => {
              const ready = isTaskReady(task);
              return (
                <div
                  key={task.id}
                  className={`glass-card rounded-2xl p-4 flex items-center gap-3 neon-border transition-all ${ready ? "ring-1 ring-yellow-400/50" : ""} ${task.done ? "opacity-50" : ""}`}
                >
                  <span className="text-3xl">{task.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-rubik font-semibold text-sm text-white">{task.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{task.desc}</p>
                    <p className="text-xs mt-1" style={{ color: "#FFD700" }}>+{task.reward} ⭐</p>
                  </div>
                  <button
                    onClick={() => claimTask(task.id)}
                    disabled={task.done || !ready}
                    className={`rounded-xl px-3 py-2 text-xs font-orbitron font-bold transition-all shrink-0 ${task.done ? "bg-white/10 text-white/30 cursor-not-allowed" : ready ? "text-black" : "bg-white/5 text-white/25 cursor-not-allowed"}`}
                    style={ready && !task.done ? { background: "linear-gradient(135deg, #FFD700, #FF6B35)" } : {}}
                  >
                    {task.done ? "✓" : ready ? "Забрать" : "..."}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* SHOP */}
        {tab === "shop" && (
          <div className="px-4 py-4 space-y-3">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Магазин</h2>
            {upgrades.map((upgrade) => {
              const cost = getUpgradeCost(upgrade);
              const canBuy = stars >= cost && upgrade.level < upgrade.maxLevel;
              const maxed = upgrade.level >= upgrade.maxLevel;
              return (
                <div key={upgrade.id} className={`glass-card rounded-2xl p-4 neon-border transition-all ${canBuy ? "ring-1 ring-yellow-400/30" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-rubik font-semibold text-sm text-white">{upgrade.name}</p>
                        {upgrade.level > 0 && (
                          <span className="text-xs font-orbitron px-2 py-0.5 rounded-full" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>Ур.{upgrade.level}</span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">{upgrade.desc}</p>
                      <p className="text-xs mt-1" style={{ color: "#00F5FF" }}>{upgrade.effect}</p>
                    </div>
                    <button
                      onClick={() => buyUpgrade(upgrade.id)}
                      disabled={!canBuy}
                      className={`rounded-xl px-3 py-2 text-xs font-orbitron font-bold flex flex-col items-center gap-0.5 min-w-[60px] shrink-0 transition-transform active:scale-95 ${maxed ? "cursor-not-allowed" : canBuy ? "text-black" : "cursor-not-allowed"}`}
                      style={
                        maxed ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" } :
                        canBuy ? { background: "linear-gradient(135deg, #FFD700, #FF6B35)" } :
                        { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }
                      }
                    >
                      {maxed ? <span>MAX</span> : (<><span>⭐</span><span>{formatNum(cost)}</span></>)}
                    </button>
                  </div>
                  {upgrade.level > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-white/30 mb-1">
                        <span>Прогресс</span>
                        <span>{upgrade.level}/{upgrade.maxLevel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%`, background: "linear-gradient(90deg, #FFD700, #FF6B35)" }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div className="px-4 py-4 space-y-4">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Профиль</h2>
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,0.2), transparent)", border: "2px solid rgba(255,215,0,0.3)", animation: "star-pulse 2.5s ease-in-out infinite" }}
              >
                ⭐
              </div>
              <div className="text-center">
                <p className="font-orbitron font-black text-xl shimmer-text">Звёздный Путник</p>
                <p className="text-white/40 text-sm mt-0.5">Уровень {level} · {xp}/{xpToNext} XP</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Всего звёзд", value: formatNum(totalStars), icon: "⭐" },
                { label: "Кликов", value: formatNum(totalClicks), icon: "👆" },
                { label: "Авто/сек", value: autoPerSec > 0 ? `+${autoPerSec}` : "0", icon: "🤖" },
                { label: "Сила клика", value: `+${clickPower}`, icon: "⚡" },
                { label: "Улучшений", value: upgrades.filter((u) => u.level > 0).length, icon: "🔧" },
                { label: "Заданий", value: `${tasks.filter((t) => t.done).length}/${tasks.length}`, icon: "✅" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-3 neon-border text-center">
                  <p className="text-xl">{stat.icon}</p>
                  <p className="font-orbitron font-bold text-base mt-1" style={{ color: "#FFD700" }}>{stat.value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="px-4 py-4 space-y-3">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Настройки</h2>
            <div className="glass-card rounded-2xl p-4 neon-border space-y-4">
              {[
                { label: "Эффекты частиц", desc: "Анимация при клике", on: true },
                { label: "Автосохранение", desc: "Прогресс сохраняется каждые 1.5с", on: true },
                { label: "Звуки", desc: "Скоро", on: false },
              ].map((item, idx, arr) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-rubik font-medium text-sm text-white">{item.label}</p>
                      <p className="text-white/40 text-xs">{item.desc}</p>
                    </div>
                    <div
                      className="w-12 h-6 rounded-full flex items-center px-1"
                      style={item.on ? { background: "rgba(255,215,0,0.2)", border: "1px solid rgba(255,215,0,0.3)" } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <div className={`w-4 h-4 rounded-full ${item.on ? "ml-auto" : ""}`} style={item.on ? { background: "#FFD700", boxShadow: "0 0 6px #FFD700" } : { background: "rgba(255,255,255,0.2)" }} />
                    </div>
                  </div>
                  {idx < arr.length - 1 && <div className="h-px bg-white/5 mt-4" />}
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-4 neon-border">
              <p className="font-rubik font-medium text-sm text-white mb-1">Сбросить прогресс</p>
              <p className="text-white/40 text-xs mb-3">Удалить все звёзды, уровень и улучшения</p>
              <button
                onClick={() => {
                  if (confirm("Сбросить весь прогресс?")) {
                    localStorage.removeItem("star_clicker_save");
                    setStars(0); setTotalStars(0); setTotalClicks(0);
                    setUpgrades(UPGRADES_INITIAL); setTasks(TASKS_INITIAL);
                    setLevel(1); setXp(0); setEnergy(MAX_ENERGY_BASE);
                    setReferrals([]);
                  }
                }}
                className="w-full py-2 rounded-xl text-sm font-rubik font-medium text-red-400 border border-red-500/30 active:bg-red-500/10 transition-all"
              >
                Сбросить
              </button>
            </div>
            <div className="text-center py-2">
              <p className="text-white/20 text-xs font-rubik">Star Clicker v1.0</p>
              <p className="text-white/10 text-xs mt-0.5">Made with ⭐ in space</p>
            </div>
          </div>
        )}

        {/* REFERRAL */}
        {tab === "referral" && (
          <div className="px-4 py-4 space-y-4">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold">Рефералы</h2>

            {/* Banner */}
            <div
              className="rounded-2xl p-4 text-center space-y-1"
              style={{ background: "linear-gradient(135deg, rgba(191,95,255,0.2), rgba(0,245,255,0.15))", border: "1px solid rgba(191,95,255,0.3)" }}
            >
              <p className="text-3xl">👥</p>
              <p className="font-orbitron font-black text-lg" style={{ color: "#BF5FFF" }}>+{REFERRAL_BONUS} ⭐</p>
              <p className="text-white/70 text-sm font-rubik">за каждого приглашённого друга</p>
              <p className="text-white/40 text-xs">Друг тоже получает бонус при входе</p>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className="flex-1 glass-card rounded-2xl p-3 text-center neon-border">
                <p className="font-orbitron font-black text-2xl" style={{ color: "#BF5FFF" }}>{referrals.length}</p>
                <p className="text-white/40 text-xs mt-1">Друзей</p>
              </div>
              <div className="flex-1 glass-card rounded-2xl p-3 text-center neon-border">
                <p className="font-orbitron font-black text-2xl" style={{ color: "#FFD700" }}>{formatNum(referrals.length * REFERRAL_BONUS)}</p>
                <p className="text-white/40 text-xs mt-1">Заработано ⭐</p>
              </div>
            </div>

            {/* Ref link */}
            <div className="glass-card rounded-2xl p-4 neon-border space-y-3">
              <p className="font-rubik text-xs text-white/40 uppercase tracking-widest">Твоя реф-ссылка</p>
              <div
                className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-xs font-orbitron flex-1 truncate" style={{ color: "#00F5FF" }}>{getRefLink()}</span>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 text-xs font-rubik font-medium px-2 py-1 rounded-lg transition-all"
                  style={{ background: copied ? "rgba(0,245,255,0.2)" : "rgba(255,255,255,0.08)", color: copied ? "#00F5FF" : "rgba(255,255,255,0.5)" }}
                >
                  {copied ? "✓" : "Копировать"}
                </button>
              </div>
              <button
                onClick={handleShare}
                className="w-full py-3 rounded-xl font-orbitron font-bold text-sm text-black transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #BF5FFF, #00F5FF)" }}
              >
                Поделиться в Telegram
              </button>
            </div>

            {/* Friends list */}
            {referrals.length > 0 ? (
              <div className="space-y-2">
                <p className="font-rubik text-xs text-white/40 uppercase tracking-widest px-1">Приглашённые</p>
                {referrals.map((r) => (
                  <div key={r.id} className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 neon-border">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(191,95,255,0.2)" }}>👤</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-rubik font-medium text-sm text-white truncate">{r.name}</p>
                      <p className="text-white/30 text-xs">{new Date(r.joinedAt).toLocaleDateString("ru-RU")}</p>
                    </div>
                    <span className="font-orbitron text-xs font-bold shrink-0" style={{ color: "#FFD700" }}>+{r.bonus} ⭐</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-4xl">🌌</p>
                <p className="text-white/40 text-sm font-rubik">Пока никого нет.<br/>Поделись ссылкой и зови друзей!</p>
              </div>
            )}

            {/* Demo button — for testing */}
            <button
              onClick={addDemoReferral}
              className="w-full py-2 rounded-xl text-xs font-rubik text-white/20 border border-white/5 active:bg-white/5 transition-all"
            >
              + Тест: симулировать приглашение
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div
        className="relative z-20 flex items-center justify-around px-1 py-2 shrink-0"
        style={{ background: "rgba(7,10,20,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,215,0,0.12)", boxShadow: "0 -8px 30px rgba(0,0,0,0.4)" }}
      >
        {([
          { id: "home", icon: "Home", label: "Главная" },
          { id: "tasks", icon: "CheckSquare", label: "Задания" },
          { id: "shop", icon: "ShoppingBag", label: "Магазин" },
          { id: "referral", icon: "Users", label: "Рефералы" },
          { id: "profile", icon: "User", label: "Профиль" },
        ] as { id: Tab; icon: string; label: string }[]).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
              style={active ? { background: "rgba(255,215,0,0.1)" } : {}}
            >
              <Icon name={item.icon} size={20} className={active ? "nav-active" : "text-white/35"} />
              <span className="text-[10px] font-rubik font-medium" style={active ? { color: "#FFD700" } : { color: "rgba(255,255,255,0.35)" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}