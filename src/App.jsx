import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Sun,
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  Compass,
  ChevronRight,
  Send,
  Award,
  Smile,
  Star,
  ArrowRight,
  RotateCcw,
  Sparkle,
  ShieldCheck,
  CheckCircle2,
  Feather,
  Flower2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

class RomanticFieldAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.timer = null;
    this.step = 0;
    this.gainNode = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.15; // Soft ambient sound
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playNote(freq, duration = 1.8, type = "sine") {
    if (!this.ctx || !this.isPlaying) return;

    try {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0, this.ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.4);
      noteGain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + duration,
      );

      osc.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback issue", e);
    }
  }

  playCelebration() {
    if (!this.ctx) this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // Bright C major chord fan-fare
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 3.0, "triangle");
      }, idx * 180);
    });
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Golden hour warm chord arpeggios (G major - D major - Em - C)
    const scale = [
      196.0,
      246.94,
      293.66,
      392.0, // G3, B3, D4, G4
      293.66,
      369.99,
      440.0,
      587.33, // D4, F#4, A4, D5
      164.81,
      246.94,
      329.63,
      392.0, // E3, B3, E4, G4
      261.63,
      329.63,
      392.0,
      523.25, // C4, E4, G4, C5
    ];

    const playSequence = () => {
      if (!this.isPlaying) return;
      const freq = scale[this.step % scale.length];

      this.playNote(freq, 2.4, "sine");
      if (this.step % 3 === 0) {
        this.playNote(freq * 1.5, 3.0, "triangle"); // Harmony
      }

      this.step = (this.step + 1) % scale.length;
      this.timer = setTimeout(playSequence, 550);
    };

    playSequence();
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) clearTimeout(this.timer);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

export default function App() {
  // Navigation & Story Progress States
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isWalking, setIsWalking] = useState(false);

  // Checkpoint Modal States
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState([]);

  // Final Proposal States
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [noButtonOffset, setNoButtonOffset] = useState({ x: 0, y: 0 });
  const [noButtonTextIdx, setNoButtonTextIdx] = useState(0);

  // Audio State
  const audioSynthRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Canvas Reference
  const canvasRef = useRef(null);
  const fieldDataRef = useRef({
    sunflowers: [],
    pollen: [],
    fireworks: [],
    walkSpeed: 0,
  });

  const checkpoints = useMemo(
    () => [
      {
        id: 1,
        targetProgress: 22,
        title: "Primer Destello de Luz 🌻",
        quote:
          "Gracias por llegar a mi vida e iluminar cada uno de mis días con tu hermosa sonrisa.",
        subtext: "Tu alegría hace que todo lo gris desaparezca al instante.",
      },
      {
        id: 2,
        targetProgress: 48,
        title: "Paciencia y Dulzura 🌾",
        quote:
          "Gracias por tu paciencia, tu ternura y por estar siempre presente en los momentos más especiales.",
        subtext:
          "Con cada detalle me demuestras lo valiosa e incondicional que eres.",
      },
      {
        id: 3,
        targetProgress: 72,
        title: "Un Sol en mi Camino ☀️",
        quote:
          "Estar a tu lado hace que todo sea más bonito y brillante, como un campo infinito de girasoles.",
        subtext:
          "A tu lado aprendí que la felicidad está en las cosas más simples.",
      },
      {
        id: 4,
        targetProgress: 92,
        title: "El Destino Juntos ✨",
        quote:
          "Cada paso que doy contigo me confirma lo infinitamente afortunado que soy de tenerte.",
        subtext: "Caminar a tu lado es el regalo más hermoso de mi vida.",
      },
    ],
    [],
  );

  const playfulNoTexts = [
    "¿Segura? 😜",
    "¡Esa opción no vale! 😉",
    "Ups, se movió el botón 💛",
    "¡Inténtalo otra vez! ✨",
    "Solo hay una respuesta correcta 🌻",
    "¡SÍ es el camino! 💛",
  ];

  useEffect(() => {
    audioSynthRef.current = new RomanticFieldAudio();
    return () => {
      if (audioSynthRef.current) audioSynthRef.current.stop();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Inicializar Girasoles con distribución 3D real por todo el terreno
    const numSunflowers = 120;
    const flowers = Array.from({ length: numSunflowers }, () => ({
      x: (Math.random() - 0.5) * 3.2, // Dispersión lateral amplia
      z: Math.random() * 900 + 40, // Profundidad de 40 a 940
      scale: Math.random() * 0.35 + 0.75,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.015,
      petals: Math.floor(Math.random() * 4) + 14,
    }));

    // Initialize Floating Pollen particles
    const pollen = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 0.6 + 0.2,
      speedX: Math.sin(Math.random() * Math.PI) * 0.5,
      opacity: Math.random() * 0.8 + 0.2,
    }));

    fieldDataRef.current.sunflowers = flowers;
    fieldDataRef.current.pollen = pollen;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Cielo de Atardecer Dorado
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, "#1e1b4b");
      skyGradient.addColorStop(0.35, "#7c2d12");
      skyGradient.addColorStop(0.65, "#ea580c");
      skyGradient.addColorStop(1, "#d97706");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      const horizonY = height * 0.52;

      // 2. SUELO DE TIERRA REALISTA (Tono Terroso y Textura de Surcos)
      const groundGradient = ctx.createLinearGradient(0, horizonY, 0, height);
      groundGradient.addColorStop(0, "#582f0e"); // Tierra cálida en el horizonte
      groundGradient.addColorStop(0.25, "#3a1e05"); // Arcilla/Tierra húmeda
      groundGradient.addColorStop(0.65, "#241002"); // Sombra de tierra oscura
      groundGradient.addColorStop(1, "#0f0500"); // Profundidad de primer plano
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Líneas de perspectiva y destellos sobre la tierra secada por el sol
      ctx.save();
      for (let i = 1; i <= 25; i++) {
        const depthProgress = i / 25;
        const lineY =
          horizonY + Math.pow(depthProgress, 2.2) * (height - horizonY);
        const lineThickness = 1 + depthProgress * 3;

        ctx.fillStyle = `rgba(245, 158, 11, ${0.12 - depthProgress * 0.08})`;
        ctx.fillRect(0, lineY, width, lineThickness);
      }
      ctx.restore();

      // 2. Sun Glow Aura on Horizon
      const sunGlowRadius = Math.min(width, height) * 0.35;
      const sunGlow = ctx.createRadialGradient(
        width / 2,
        horizonY,
        10,
        width / 2,
        horizonY,
        sunGlowRadius,
      );
      sunGlow.addColorStop(0, "rgba(254, 240, 138, 0.95)"); // Bright golden yellow
      sunGlow.addColorStop(0.4, "rgba(245, 158, 11, 0.5)"); // Warm amber
      sunGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(width / 2, horizonY, sunGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Sol / Girasol Gigante del Horizonte (Resplandeciente y Cálido)
      const currProgress = progressRef.current;
      const giantScale = 0.45 + (currProgress / 100) * 0.85;
      const giantRadius = 40 * giantScale;

      ctx.save();
      ctx.translate(width / 2, horizonY - 12);

      // Rayos de luz giratorios
      ctx.save();
      ctx.rotate(Date.now() * 0.0003);
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(
          0,
          0,
          giantRadius * 4,
          (i * Math.PI) / 6,
          ((i + 0.3) * Math.PI) / 6,
        );
        ctx.fillStyle = "rgba(253, 224, 71, 0.09)";
        ctx.fill();
      }
      ctx.restore();

      // Pétalos dorados del Sol
      const giantPetalCount = 20;
      for (let i = 0; i < giantPetalCount; i++) {
        const angle = (i * Math.PI * 2) / giantPetalCount;
        ctx.save();
        ctx.rotate(angle + Math.sin(Date.now() * 0.001) * 0.05);
        ctx.beginPath();
        ctx.ellipse(
          giantRadius * 1.25,
          0,
          giantRadius * 0.85,
          giantRadius * 0.28,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#facc15";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#fbbf24";
        ctx.fill();
        ctx.restore();
      }

      // Centro del Sol brillante (no oscuro)
      const sunCenterGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        giantRadius * 0.85,
      );
      sunCenterGrad.addColorStop(0, "#fef08a");
      sunCenterGrad.addColorStop(0.5, "#f59e0b");
      sunCenterGrad.addColorStop(1, "#78350f");

      ctx.beginPath();
      ctx.arc(0, 0, giantRadius * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = sunCenterGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#f59e0b";
      ctx.fill();
      ctx.restore();

      // 4. Campo de Girasoles en Distribución 3D Real
      const speed = fieldDataRef.current.walkSpeed;
      const time = Date.now() * 0.002;

      fieldDataRef.current.sunflowers.sort((a, b) => b.z - a.z);

      fieldDataRef.current.sunflowers.forEach((flower) => {
        if (speed > 0) {
          flower.z -= speed;
          if (flower.z < 25) {
            flower.z = 900;
            const side = Math.random() > 0.5 ? 1 : -1;
            flower.x = side * (Math.random() * 1.2 + 0.2);
          }
        }

        // Proyección matemática para cubrir todo el suelo verticalmente
        const perspective = 380 / flower.z;
        const screenX = width / 2 + flower.x * width * perspective;

        // Mapear Z para que las flores se repartan desde el horizonte hasta abajo
        const depthRatio = 1 - flower.z / 950;
        const screenY =
          horizonY + Math.pow(depthRatio, 1.8) * (height - horizonY - 20);

        if (
          screenX < -120 ||
          screenX > width + 120 ||
          screenY < horizonY - 10
        ) {
          return;
        }

        const flowerSize = Math.min(
          Math.max(12, 60 * perspective * flower.scale),
          90,
        );
        const sway =
          Math.sin(time * flower.swaySpeed + flower.swayOffset) *
          (flowerSize * 0.12);

        ctx.save();
        ctx.translate(screenX + sway, screenY);

        // --- HOJAS EN EL TALLO ---
        if (flowerSize > 20) {
          const drawLeaf = (isLeft) => {
            const side = isLeft ? -1 : 1;
            const leafLen = flowerSize * 1.1;
            const leafW = flowerSize * 0.55;

            ctx.save();
            ctx.rotate((side * 35 * Math.PI) / 180);

            const leafGrad = ctx.createLinearGradient(0, 0, side * leafLen, 0);
            leafGrad.addColorStop(0, "#14532d");
            leafGrad.addColorStop(1, "#15803d");

            ctx.beginPath();
            ctx.moveTo(0, flowerSize * 1.5);
            ctx.bezierCurveTo(
              side * leafW,
              flowerSize * 1.1,
              side * leafLen,
              flowerSize * 1.8,
              0,
              flowerSize * 2.3,
            );
            ctx.fillStyle = leafGrad;
            ctx.fill();

            // Nervadura
            ctx.beginPath();
            ctx.moveTo(0, flowerSize * 1.5);
            ctx.lineTo(side * leafLen * 0.7, flowerSize * 1.8);
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = Math.max(1, flowerSize * 0.02);
            ctx.stroke();

            ctx.restore();
          };
          drawLeaf(true);
          drawLeaf(false);
        }

        // --- TALLO ---
        const stemGrad = ctx.createLinearGradient(-3, 0, 3, 0);
        stemGrad.addColorStop(0, "#15803d");
        stemGrad.addColorStop(1, "#166534");

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          -sway * 0.3,
          flowerSize * 1.5,
          0,
          flowerSize * 3.2,
        );
        ctx.lineWidth = Math.max(2, flowerSize * 0.12);
        ctx.strokeStyle = stemGrad;
        ctx.stroke();

        // --- PÉTALOS EN 2 CAPAS ---
        const drawPetalSet = (count, lenMult, angleOff, color1, color2) => {
          for (let p = 0; p < count; p++) {
            const angle = (p * Math.PI * 2) / count + angleOff;
            ctx.save();
            ctx.rotate(angle);

            const grad = ctx.createLinearGradient(
              0,
              0,
              flowerSize * lenMult,
              0,
            );
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);

            ctx.beginPath();
            ctx.moveTo(flowerSize * 0.3, 0);
            ctx.quadraticCurveTo(
              flowerSize * 0.65 * lenMult,
              -flowerSize * 0.18,
              flowerSize * lenMult,
              0,
            );
            ctx.quadraticCurveTo(
              flowerSize * 0.65 * lenMult,
              flowerSize * 0.18,
              flowerSize * 0.3,
              0,
            );
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
          }
        };

        drawPetalSet(14, 1.1, Math.PI / 14, "#d97706", "#eab308"); // Traseros
        drawPetalSet(14, 0.95, 0, "#f59e0b", "#fef08a"); // Delanteros

        // --- CENTRO DE LA FLOR ---
        const centerR = flowerSize * 0.36;
        const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, centerR);
        cGrad.addColorStop(0, "#1c0a00");
        cGrad.addColorStop(0.7, "#451a03");
        cGrad.addColorStop(1, "#92400e");

        ctx.beginPath();
        ctx.arc(0, 0, centerR, 0, Math.PI * 2);
        ctx.fillStyle = cGrad;
        ctx.fill();

        ctx.restore();
      });
      // 5. Render Pollen & Floating Particles
      fieldDataRef.current.pollen.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y / 30) * p.speedX;

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "#fef08a";
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#f59e0b";
        ctx.fill();
        ctx.restore();
      });

      // 6. Render Fireworks (When Proposal Accepted!)
      if (hasAcceptedRef.current) {
        fieldDataRef.current.fireworks.forEach((fw, idx) => {
          fw.x += fw.vx;
          fw.y += fw.vy;
          fw.vy += 0.08; // Gravity
          fw.alpha -= 0.012;

          ctx.save();
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, fw.radius, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.globalAlpha = Math.max(0, fw.alpha);
          ctx.shadowBlur = 12;
          ctx.shadowColor = fw.color;
          ctx.fill();
          ctx.restore();

          if (fw.alpha <= 0) {
            fieldDataRef.current.fireworks.splice(idx, 1);
          }
        });

        // Continuously spawn celebration particles
        if (Math.random() < 0.3) {
          spawnFireworkBurst(
            Math.random() * width,
            Math.random() * height * 0.6,
          );
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sync state refs for canvas animation
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const hasAcceptedRef = useRef(hasAccepted);
  useEffect(() => {
    hasAcceptedRef.current = hasAccepted;
  }, [hasAccepted]);

  // Spawn Fireworks Helper
  const spawnFireworkBurst = (x, y) => {
    const colors = [
      "#facc15",
      "#f59e0b",
      "#fb923c",
      "#f43f5e",
      "#a855f7",
      "#38bdf8",
    ];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      fieldDataRef.current.fireworks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  };

  const handleWalk = useCallback(() => {
    if (activeCheckpoint || isProposalOpen || hasAccepted) return;

    fieldDataRef.current.walkSpeed = 4.5;
    setIsWalking(true);

    setProgress((prev) => {
      const nextProgress = Math.min(100, prev + 0.6);

      // Check if user hit any unvisited checkpoint
      const triggered = checkpoints.find(
        (cp) =>
          nextProgress >= cp.targetProgress &&
          !visitedCheckpoints.includes(cp.id),
      );

      if (triggered) {
        fieldDataRef.current.walkSpeed = 0;
        setIsWalking(false);
        setActiveCheckpoint(triggered);
        setVisitedCheckpoints((v) => [...v, triggered.id]);
      } else if (nextProgress >= 100 && !isProposalOpen && !hasAccepted) {
        fieldDataRef.current.walkSpeed = 0;
        setIsWalking(false);
        setIsProposalOpen(true);
      }

      return nextProgress;
    });
  }, [
    activeCheckpoint,
    isProposalOpen,
    hasAccepted,
    checkpoints,
    visitedCheckpoints,
  ]);

  const stopWalk = useCallback(() => {
    fieldDataRef.current.walkSpeed = 0;
    setIsWalking(false);
  }, []);

  // Handle Keydown/Keyup for Spacebar or ArrowUp to walk
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        handleWalk();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        stopWalk();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleWalk, stopWalk]);

  const handleAcceptProposal = async () => {
    setHasAccepted(true);
    setIsProposalOpen(false);

    // 1. Guardar la respuesta de amor en Supabase
    try {
      const { error } = await supabase.from("respuestas").insert([
        {
          respuesta: "¡SÍ, ACEPTO! 💛",
          mensaje_personalizado:
            "Aceptó la propuesta en el campo de girasoles el 21 de septiembre.",
        },
      ]);

      if (error) {
        console.error("Error al guardar en Supabase:", error);
      } else {
        console.log("¡Respuesta guardada exitosamente en Supabase!");
      }
    } catch (err) {
      console.error("Error de conexión:", err);
    }

    // 2. Audio de celebración y fuegos artificiales
    if (audioSynthRef.current) {
      audioSynthRef.current.playCelebration();
    }

    const canvas = canvasRef.current;
    if (canvas) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          spawnFireworkBurst(
            Math.random() * canvas.width,
            Math.random() * (canvas.height * 0.5),
          );
        }, i * 300);
      }
    }
  };

  const handleNoButtonHover = () => {
    // Random offset dodging mouse/touch
    const randomX = (Math.random() - 0.5) * 220;
    const randomY = (Math.random() - 0.5) * 160;
    setNoButtonOffset({ x: randomX, y: randomY });
    setNoButtonTextIdx((prev) => (prev + 1) % playfulNoTexts.length);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-50 relative overflow-hidden font-sans select-none">
      {/* 3D Field Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* Atmospheric Vignette Overlay */}
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-10 opacity-40" />

      {/* Top Header Navigation & Audio Control */}
      <header className="relative z-20 max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-950/60 border border-amber-400/30 px-4 py-2 rounded-full backdrop-blur-md shadow-lg">
          <Sun
            className="w-5 h-5 text-amber-400 animate-spin"
            style={{ animationDuration: "15s" }}
          />
          <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
            21 de Septiembre • Flores Amarillas
          </span>
        </div>

        {/* Ambient Audio Toggle */}
        <button
          onClick={() => {
            if (audioSynthRef.current) {
              const playing = audioSynthRef.current.toggle();
              setIsAudioPlaying(playing);
            }
          }}
          className={`p-3 rounded-full border backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold ${
            isAudioPlaying
              ? "bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              : "bg-slate-900/80 border-slate-700 text-slate-400 hover:border-amber-400/40"
          }`}
          title="Música de fondo"
        >
          {isAudioPlaying ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isAudioPlaying ? "Música Encendida" : "Música"}
          </span>
        </button>
      </header>

      {/* VIEW 1: INTRO EXPERIENCE SCREEN */}
      {!hasStarted && (
        <main className="relative z-20 min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
          <div className="bg-slate-900/80 border border-amber-400/40 p-8 sm:p-12 rounded-3xl backdrop-blur-xl shadow-[0_0_60px_rgba(251,191,36,0.25)] space-y-8 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_30px_#f59e0b]">
              <span className="text-4xl">🌻</span>
            </div>

            <div className="space-y-3">
              <span className="text-amber-400 font-semibold tracking-widest text-xs uppercase block">
                Una Experiencia Especial
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 leading-tight">
                El Campo de Girasoles 💛
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                Hoy es 21 de septiembre. Para agradecerte por tu hermosa
                presencia, preparé un recorrido mágico a través de un campo de
                girasoles infinitos.
              </p>
            </div>

            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed text-left space-y-2">
              <p className="flex items-center gap-2 font-semibold text-amber-300">
                <Compass className="w-4 h-4" /> Cómo explorar:
              </p>
              <p>
                • Camina por el campo usando el botón principal o dejando
                presionada la barra espaciadora.
              </p>
              <p>
                • Descubre 4 girasoles de agradecimiento guardados en el camino.
              </p>
              <p>
                • Llega hasta la gran flor del horizonte para una sorpresa
                especial.
              </p>
            </div>

            <button
              onClick={() => {
                setHasStarted(true);
                if (audioSynthRef.current && !isAudioPlaying) {
                  audioSynthRef.current.start();
                  setIsAudioPlaying(true);
                }
              }}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-base shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span>Comenzar el Recorrido 🌻</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </main>
      )}

      {/* VIEW 2: ACTIVE FIELD WALK HUD */}
      {hasStarted && !hasAccepted && (
        <div className="relative z-20 max-w-2xl mx-auto px-6 flex flex-col items-center justify-between min-h-[82vh]">
          {/* Progress Tracker Bar */}
          <div className="w-full bg-slate-900/80 border border-amber-400/30 rounded-2xl p-4 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Camino Recorrido: {Math.floor(progress)}%</span>
              </span>
              <span className="text-slate-400">
                {visitedCheckpoints.length}/4 Flores Encontradas
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-amber-400/20 relative">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-200 shadow-[0_0_15px_#f59e0b]"
                style={{ width: `${progress}%` }}
              />

              {/* Checkpoint Indicators on Bar */}
              {checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className={`absolute top-0 bottom-0 w-2 rounded-full border ${
                    visitedCheckpoints.includes(cp.id)
                      ? "bg-amber-300 border-amber-100"
                      : "bg-slate-700 border-slate-500"
                  }`}
                  style={{ left: `${cp.targetProgress}%` }}
                  title={cp.title}
                />
              ))}
            </div>
          </div>

          {/* Interactive Walk Action Button */}
          <div className="w-full pb-8 flex flex-col items-center gap-3">
            <p className="text-xs text-amber-200/80 font-medium tracking-wide animate-pulse bg-slate-950/60 px-4 py-1.5 rounded-full border border-amber-400/20 backdrop-blur-md">
              {isWalking
                ? "Avanzando entre girasoles..."
                : "Manten presionado o toca para caminar 🌻"}
            </p>

            <button
              onMouseDown={handleWalk}
              onMouseUp={stopWalk}
              onTouchStart={handleWalk}
              onTouchEnd={stopWalk}
              onClick={handleWalk}
              disabled={!!activeCheckpoint || isProposalOpen}
              className={`w-full max-w-md py-5 px-8 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg shadow-[0_0_40px_rgba(251,191,36,0.5)] transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                isWalking
                  ? "scale-[1.03] ring-4 ring-amber-300/50"
                  : "hover:scale-[1.02]"
              } ${activeCheckpoint || isProposalOpen ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-2xl">🌻</span>
              <span>Caminar por el Campo</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: CHECKPOINT APPRECIATION MODAL */}
      {activeCheckpoint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-400/60 max-w-md w-full p-8 rounded-3xl shadow-[0_0_60px_rgba(251,191,36,0.3)] relative text-center space-y-6">
            {/* Glowing Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-[0_0_25px_#f59e0b] animate-bounce">
              🌻
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block mb-1">
                Girasol de Agradecimiento #{activeCheckpoint.id}
              </span>
              <h3 className="text-2xl font-extrabold text-amber-100">
                {activeCheckpoint.title}
              </h3>
            </div>

            <div className="bg-slate-950/80 border border-amber-400/30 p-5 rounded-2xl space-y-3">
              <p className="text-amber-200 text-base font-serif italic leading-relaxed">
                "{activeCheckpoint.quote}"
              </p>
              <p className="text-slate-400 text-xs">
                {activeCheckpoint.subtext}
              </p>
            </div>

            <button
              onClick={() => setActiveCheckpoint(null)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Continuar Caminando</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: PROPOSAL MODAL (AT 100% PROGRESS) */}
      {isProposalOpen && !hasAccepted && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-400/80 max-w-lg w-full p-8 sm:p-10 rounded-3xl shadow-[0_0_80px_rgba(251,191,36,0.4)] relative text-center space-y-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-4 border-amber-300 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(251,191,36,0.8)] animate-pulse">
              👑
            </div>

            <div className="space-y-3">
              <span className="text-amber-400 text-xs uppercase tracking-widest font-extrabold block">
                Llegaste al Corazón del Campo 💛
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500">
                Tengo una pregunta para ti...
              </h2>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light bg-amber-400/10 border border-amber-400/20 p-5 rounded-2xl">
              Has recorrido cada girasol y leído cada agradecimiento. Eres la
              persona más especial de mi universo y la razón por la que cada día
              brilla como la primavera.
            </p>

            {/* The Big Question */}
            <div className="py-2">
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                ¿Quieres ser mi novia? 💛
              </h3>
            </div>

            {/* Interactive Response Buttons */}
            <div className="relative pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 min-h-[100px]">
              {/* YES Button */}
              <button
                onClick={handleAcceptProposal}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-lg shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center gap-2 z-10"
              >
                <Heart className="w-5 h-5 fill-slate-950" />
                <span>¡SÍ, ACEPTO! 💛</span>
              </button>

              {/* Playful Runaway NO Button */}
              <button
                onMouseEnter={handleNoButtonHover}
                onClick={handleNoButtonHover}
                onTouchStart={handleNoButtonHover}
                style={{
                  transform: `translate(${noButtonOffset.x}px, ${noButtonOffset.y}px)`,
                  transition: "transform 0.2s ease-out",
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800/80 border border-slate-600 text-slate-300 hover:text-amber-300 font-semibold text-sm transition-colors"
              >
                {playfulNoTexts[noButtonTextIdx]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: CELEBRATION ACCEPTED VIEW */}
      {hasAccepted && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in text-center">
          <div className="max-w-xl w-full bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-2 border-amber-400 p-8 sm:p-12 rounded-3xl shadow-[0_0_100px_rgba(251,191,36,0.6)] space-y-8 relative overflow-hidden">
            <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(251,191,36,0.9)] animate-bounce">
              💐
            </div>

            <div className="space-y-3">
              <span className="text-amber-400 text-xs uppercase tracking-widest font-black block">
                ¡El Mejor Día de Todos! ✨
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400">
                ¡DIJISTE QUE SÍ! 💛
              </h1>
            </div>

            <div className="bg-slate-950/80 border border-amber-400/30 p-6 rounded-2xl text-slate-200 text-sm sm:text-base leading-relaxed space-y-3 text-left">
              <p>
                Prometo cuidar de ti, hacerte sonreír todos los días y regalarte
                no solo flores amarillas cada 21 de septiembre, sino un amor
                sincero e infinito cada segundo de nuestras vidas.
              </p>
              <p className="font-bold text-amber-300 text-center pt-2">
                ¡Gracias por hacer mi mundo entero más brillante! Te amo con
                todo mi corazón. 🌻
              </p>
            </div>

            <button
              onClick={() => {
                setHasAccepted(false);
                setIsProposalOpen(false);
                setProgress(0);
                setVisitedCheckpoints([]);
                setHasStarted(false);
              }}
              className="px-6 py-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-semibold text-xs border border-amber-400/40 transition-all inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Volver a recorrer el campo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
