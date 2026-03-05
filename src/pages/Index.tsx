import { useState, useCallback, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Tab = "home" | "tasks" | "shop" | "profile" | "settings";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  dx: number;
  dy: number;
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

const EMOJIS = ["⭐", "✨", "💫", "🌟", "⚡", "🔥", "💥", "🌠"];

const UPGRADES_INITIAL: Upgrade[] = [
  {
    id: "click_power",
    name: "Сила клика",
    desc: "Больше звёзд за каждый клик",
    emoji: "👆",
    baseCost: 50,
    effect: "+1 звезда за клик",
    level: 0,
    maxLevel: 20,
    getValue: (l) => l + 1,
  },
  {
    id: "star_magnet",
    name: "Магнит звёзд",
    desc: "Притягивает звёзды со всей галактики",
    emoji: "🧲",
    baseCost: 200,
    effect: "+5 звёзд за клик",
    level: 0,
    maxLevel: 10,
    getValue: (l) => l * 5,
  },
  {
    id: "auto_clicker",
    name: "Автокликер",
    desc: "Автоматически собирает звёзды",
    emoji: "🤖",
    baseCost: 500,
    effect: "+2 звезды/сек",
    level: 0,
    maxLevel: 15,
    getValue: (l) => l * 2,
  },
  {
    id: "super_auto",
    name: "Супер-автомат",
    desc: "Мощный автоматический коллектор",
    emoji: "🚀",
    baseCost: 2000,
    effect: "+10 звёзд/сек",
    level: 0,
    maxLevel: 10,
    getValue: (l) => l * 10,
  },
  {
    id: "multiplier",
    name: "Множитель",
    desc: "Удваивает весь доход",
    emoji: "⚡",
    baseCost: 5000,
    effect: "x1.5 к доходу",
    level: 0,
    maxLevel: 5,
    getValue: (l) => 1 + l * 0.5,
  },
  {
    id: "galaxy_core",
    name: "Ядро галактики",
    desc: "Источник бесконечной силы",
    emoji: "🌌",
    baseCost: 20000,
    effect: "+50 звёзд/сек",
    level: 0,
    maxLevel: 5,
    getValue: (l) => l * 50,
  },
];

const TASKS_INITIAL: Task[] = [
  { id: "t1", title: "Первые 100 звёзд", desc: "Набери 100 звёзд", reward: 50, emoji: "⭐", done: false },
  { id: "t2", title: "Клик-профи", desc: "Кликни 50 раз", reward: 100, emoji: "👆", done: false },
  { id: "t3", title: "Магазин открыт", desc: "Купи первое улучшение", reward: 200, emoji: "🛒", done: false },
  { id: "t4", title: "Тысячник", desc: "Набери 1000 звёзд", reward: 500, emoji: "💫", done: false },
  { id: "t5", title: "Автопилот", desc: "Купи автокликер", reward: 300, emoji: "🤖", done: false },
];

function getUpgradeCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(1.6, upgrade.level));
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("home");
  const [stars, setStars] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES_INITIAL);
  const [tasks, setTasks] = useState<Task[]>(TASKS_INITIAL);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatLabels, setFloatLabels] = useState<FloatLabel[]>([]);
  const [isClicking, setIsClicking] = useState(false);
  const [glowRings, setGlowRings] = useState<number[]>([]);
  const particleId = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const starsRef = useRef(stars);
  starsRef.current = stars;

  const getClickPower = useCallback(() => {
    let power = 1;
    const clickU = upgrades.find((u) => u.id === "click_power");
    const magnetU = upgrades.find((u) => u.id === "star_magnet");
    const multU = upgrades.find((u) => u.id === "multiplier");
    if (clickU && clickU.level > 0) power += clickU.getValue(clickU.level);
    if (magnetU && magnetU.level > 0) power += magnetU.getValue(magnetU.level);
    if (multU && multU.level > 0) power = Math.floor(power * multU.getValue(multU.level));
    return power;
  }, [upgrades]);

  const getAutoPerSec = useCallback(() => {
    let auto = 0;
    const autoU = upgrades.find((u) => u.id === "auto_clicker");
    const superU = upgrades.find((u) => u.id === "super_auto");
    const galaxyU = upgrades.find((u) => u.id === "galaxy_core");
    const multU = upgrades.find((u) => u.id === "multiplier");
    if (autoU && autoU.level > 0) auto += autoU.getValue(autoU.level);
    if (superU && superU.level > 0) auto += superU.getValue(superU.level);
    if (galaxyU && galaxyU.level > 0) auto += galaxyU.getValue(galaxyU.level);
    if (multU && multU.level > 0) auto = Math.floor(auto * multU.getValue(multU.level));
    return auto;
  }, [upgrades]);

  useEffect(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    const perSec = getAutoPerSec();
    if (perSec > 0) {
      autoRef.current = setInterval(() => {
        setStars((s) => s + perSec);
        setTotalStars((t) => t + perSec);
      }, 1000);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [getAutoPerSec]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const power = getClickPower();
    setStars((s) => s + power);
    setTotalStars((t) => t + power);
    setTotalClicks((c) => c + 1);

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 300);

    const ringId = Date.now();
    setGlowRings((r) => [...r, ringId]);
    setTimeout(() => setGlowRings((r) => r.filter((x) => x !== ringId)), 600);

    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      return {
        id: particleId.current++,
        x: cx,
        y: cy,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
      };
    });
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newParticles.find((n) => n.id === x.id)));
    }, 700);

    const floatId = particleId.current++;
    setFloatLabels((f) => [...f, { id: floatId, x: cx + (Math.random() - 0.5) * 60, y: cy - 20, value: power }]);
    setTimeout(() => setFloatLabels((f) => f.filter((x) => x.id !== floatId)), 900);
  }, [getClickPower]);

  const buyUpgrade = (upgradeId: string) => {
    setUpgrades((prev) =>
      prev.map((u) => {
        if (u.id !== upgradeId) return u;
        const cost = getUpgradeCost(u);
        if (starsRef.current < cost || u.level >= u.maxLevel) return u;
        setStars((s) => s - cost);
        if (["auto_clicker", "super_auto", "galaxy_core"].includes(upgradeId)) {
          setTasks((t) => t.map((task) => task.id === "t5" ? { ...task, done: true } : task));
        }
        setTasks((t) => t.map((task) => task.id === "t3" && !task.done ? { ...task, done: true } : task));
        return { ...u, level: u.level + 1 };
      })
    );
  };

  const isTaskReady = (task: Task) => {
    if (task.done) return false;
    if (task.id === "t1") return totalStars >= 100;
    if (task.id === "t2") return totalClicks >= 50;
    if (task.id === "t3") return upgrades.some((u) => u.level > 0);
    if (task.id === "t4") return totalStars >= 1000;
    if (task.id === "t5") return upgrades.some((u) => ["auto_clicker", "super_auto", "galaxy_core"].includes(u.id) && u.level > 0);
    return false;
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
    return n.toString();
  };

  const autoPerSec = getAutoPerSec();
  const clickPower = getClickPower();

  return (
    <div className="flex flex-col h-full bg-space relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white animate-twinkle"
            style={{
              left: `${(i * 37.3) % 100}%`,
              top: `${(i * 53.7) % 100}%`,
              animationDelay: `${(i * 0.3) % 3}s`,
              opacity: 0.2 + (i % 5) * 0.1,
            }}
          />
        ))}
      </div>

      {/* HEADER */}
      <div className="relative z-10 pt-3 pb-2 px-4 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-white/40 font-rubik uppercase tracking-widest">Баланс</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span className="font-orbitron text-2xl font-black shimmer-text">{formatNum(stars)}</span>
          </div>
        </div>
        <div className="text-right">
          {autoPerSec > 0 && (
            <div className="glass-card rounded-full px-3 py-1 flex items-center gap-1">
              <span className="text-xs">🤖</span>
              <span className="text-xs font-orbitron" style={{ color: "#00F5FF" }}>+{autoPerSec}/с</span>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">

        {/* HOME TAB */}
        {tab === "home" && (
          <div className="flex flex-col items-center justify-center min-h-full px-4 gap-6 py-4">
            <div className="text-center">
              <p className="font-orbitron text-xs tracking-[0.3em] text-white/40 uppercase">Клик = +{clickPower} ⭐</p>
            </div>

            {/* STAR BUTTON */}
            <div className="relative flex items-center justify-center">
              {glowRings.map((id) => (
                <div
                  key={id}
                  className="absolute w-48 h-48 rounded-full border-2 border-yellow-400/60 animate-glow-ring pointer-events-none"
                />
              ))}

              <button
                onClick={handleClick}
                className={`relative w-52 h-52 rounded-full star-btn focus:outline-none ${isClicking ? "animate-star-click" : "animate-star-pulse"}`}
                style={{
                  background: "radial-gradient(circle at 35% 35%, rgba(255,220,50,0.25) 0%, rgba(255,107,53,0.15) 50%, transparent 75%)",
                  boxShadow: "0 0 60px rgba(255,215,0,0.3), 0 0 120px rgba(255,107,53,0.15), inset 0 0 40px rgba(255,215,0,0.05)",
                  border: "2px solid rgba(255,215,0,0.3)",
                }}
              >
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  {particles.map((p) => (
                    <div
                      key={p.id}
                      className="absolute text-lg animate-particle-burst"
                      style={{
                        left: p.x,
                        top: p.y,
                        "--tx": `translate(${p.dx}px, ${p.dy}px)`,
                      } as React.CSSProperties}
                    >
                      {p.emoji}
                    </div>
                  ))}
                </div>
                <span className="text-8xl select-none glow-gold" style={{ display: "block", lineHeight: 1 }}>⭐</span>
              </button>

              {floatLabels.map((f) => (
                <div
                  key={f.id}
                  className="absolute pointer-events-none animate-float-up font-orbitron font-black text-xl"
                  style={{
                    left: f.x,
                    top: f.y,
                    color: "#FFD700",
                    textShadow: "0 0 10px #FFD700",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  +{f.value}
                </div>
              ))}
            </div>

            {/* STATS ROW */}
            <div className="flex gap-3 w-full max-w-xs">
              <div className="flex-1 glass-card rounded-2xl p-3 text-center neon-border">
                <p className="text-white/40 text-xs mb-1">Всего звёзд</p>
                <p className="font-orbitron font-bold text-base" style={{ color: "#FFD700" }}>{formatNum(totalStars)}</p>
              </div>
              <div className="flex-1 glass-card rounded-2xl p-3 text-center neon-border">
                <p className="text-white/40 text-xs mb-1">Кликов</p>
                <p className="font-orbitron font-bold text-base" style={{ color: "#00F5FF" }}>{formatNum(totalClicks)}</p>
              </div>
            </div>

            <p className="text-white/25 text-xs font-rubik text-center">Кликай на звезду, чтобы собирать ⭐</p>
          </div>
        )}

        {/* TASKS TAB */}
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
                    className={`rounded-xl px-3 py-2 text-xs font-orbitron font-bold transition-all ${
                      task.done
                        ? "bg-white/10 text-white/30 cursor-not-allowed"
                        : ready
                        ? "text-black animate-bounce-in"
                        : "bg-white/5 text-white/25 cursor-not-allowed"
                    }`}
                    style={ready && !task.done ? { background: "linear-gradient(135deg, #FFD700, #FF6B35)" } : {}}
                  >
                    {task.done ? "✓" : ready ? "Забрать" : "..."}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* SHOP TAB */}
        {tab === "shop" && (
          <div className="px-4 py-4 space-y-3">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Магазин</h2>
            {upgrades.map((upgrade) => {
              const cost = getUpgradeCost(upgrade);
              const canBuy = stars >= cost && upgrade.level < upgrade.maxLevel;
              const maxed = upgrade.level >= upgrade.maxLevel;
              return (
                <div
                  key={upgrade.id}
                  className={`glass-card rounded-2xl p-4 neon-border transition-all ${canBuy ? "ring-1 ring-yellow-400/30" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{upgrade.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-rubik font-semibold text-sm text-white">{upgrade.name}</p>
                        {upgrade.level > 0 && (
                          <span className="text-xs font-orbitron px-2 py-0.5 rounded-full" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>
                            Ур.{upgrade.level}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">{upgrade.desc}</p>
                      <p className="text-xs mt-1" style={{ color: "#00F5FF" }}>{upgrade.effect}</p>
                    </div>
                    <button
                      onClick={() => buyUpgrade(upgrade.id)}
                      disabled={!canBuy}
                      className={`rounded-xl px-3 py-2 text-xs font-orbitron font-bold flex flex-col items-center gap-0.5 min-w-[64px] transition-all shrink-0 ${
                        maxed
                          ? "bg-white/5 text-white/20 cursor-not-allowed"
                          : canBuy
                          ? "text-black active:scale-95"
                          : "bg-white/5 text-white/30 cursor-not-allowed"
                      }`}
                      style={canBuy && !maxed ? { background: "linear-gradient(135deg, #FFD700, #FF6B35)" } : {}}
                    >
                      {maxed ? <span>MAX</span> : (<><span>⭐</span><span>{formatNum(cost)}</span></>)}
                    </button>
                  </div>
                  {upgrade.level > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-white/30 mb-1">
                        <span>Прогресс</span>
                        <span>{upgrade.level}/{upgrade.maxLevel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%`, background: "linear-gradient(90deg, #FFD700, #FF6B35)" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="px-4 py-4 space-y-4">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Профиль</h2>
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl animate-star-pulse"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,0.2), transparent)", border: "2px solid rgba(255,215,0,0.3)" }}
              >
                ⭐
              </div>
              <div className="text-center">
                <p className="font-orbitron font-black text-xl shimmer-text">Звёздный Путник</p>
                <p className="text-white/40 text-sm mt-1">Исследователь галактики</p>
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

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div className="px-4 py-4 space-y-3">
            <h2 className="font-orbitron font-bold text-lg glow-text-gold mb-4">Настройки</h2>
            <div className="glass-card rounded-2xl p-4 neon-border space-y-4">
              {[
                { label: "Вибрация", desc: "При каждом клике", on: true },
                { label: "Эффекты частиц", desc: "Анимация при клике", on: true },
                { label: "Звуки", desc: "Скоро", on: false },
              ].map((item) => (
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
                      <div
                        className={`w-4 h-4 rounded-full transition-all ${item.on ? "ml-auto" : ""}`}
                        style={item.on ? { background: "#FFD700", boxShadow: "0 0 8px #FFD700" } : { background: "rgba(255,255,255,0.2)" }}
                      />
                    </div>
                  </div>
                  {item !== [{ label: "Звуки", desc: "Скоро", on: false }][0] && <div className="h-px bg-white/5 mt-4" />}
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-4 neon-border">
              <p className="font-rubik font-medium text-sm text-white mb-1">Сбросить прогресс</p>
              <p className="text-white/40 text-xs mb-3">Удалить все звёзды и улучшения</p>
              <button
                onClick={() => {
                  if (confirm("Сбросить весь прогресс?")) {
                    setStars(0);
                    setTotalStars(0);
                    setTotalClicks(0);
                    setUpgrades(UPGRADES_INITIAL);
                    setTasks(TASKS_INITIAL);
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
      </div>

      {/* BOTTOM NAV */}
      <div
        className="relative z-20 flex items-center justify-around px-2 py-2 shrink-0"
        style={{
          background: "rgba(7, 10, 20, 0.92)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,215,0,0.12)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.4)",
        }}
      >
        {(
          [
            { id: "home", icon: "Home", label: "Главная" },
            { id: "tasks", icon: "CheckSquare", label: "Задания" },
            { id: "shop", icon: "ShoppingBag", label: "Магазин" },
            { id: "profile", icon: "User", label: "Профиль" },
            { id: "settings", icon: "Settings", label: "Настройки" },
          ] as { id: Tab; icon: string; label: string }[]
        ).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
              style={active ? { background: "rgba(255,215,0,0.1)" } : {}}
            >
              <Icon
                name={item.icon}
                size={20}
                className={active ? "nav-active" : "text-white/35"}
              />
              <span
                className="text-[10px] font-rubik font-medium transition-all"
                style={active ? { color: "#FFD700" } : { color: "rgba(255,255,255,0.35)" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
