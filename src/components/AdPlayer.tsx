import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import n1 from "@/assets/nature-1.jpg";
import n2 from "@/assets/nature-2.jpg";
import n3 from "@/assets/nature-3.jpg";
import n4 from "@/assets/nature-4.jpg";
import n5 from "@/assets/nature-5.jpg";

const SLIDES = [
  { src: n1, title: "Florestas tropicais", text: "Plantas que renovam o ar do planeta" },
  { src: n2, title: "Vida selvagem", text: "Elefantes e zebras ao pôr do sol" },
  { src: n3, title: "Águas cristalinas", text: "Cascatas que dão vida aos vales" },
  { src: n4, title: "Flores e polinizadores", text: "Beija-flores em jardins tropicais" },
  { src: n5, title: "Recifes de coral", text: "Um mundo colorido debaixo de água" },
];

const DURATION = 300; // 5 minutos

export function AdPlayer() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [slide, setSlide] = useState(0);
  const audioRef = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!playing) {
      audioRef.current?.stop();
      audioRef.current = null;
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.06;
    master.connect(ctx.destination);

    // Ambiente natural: vento suave (ruído filtrado) + tons harmónicos calmos
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) channel[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    noise.connect(filter).connect(master);
    noise.start();

    const oscs = [220, 330, 440].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = 0.05 / (i + 1);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.04 / (i + 1);
      lfo.connect(lfoGain).connect(gain.gain);
      osc.connect(gain).connect(master);
      osc.start();
      lfo.start();
      return { osc, lfo };
    });

    audioRef.current = {
      ctx,
      stop: () => {
        noise.stop();
        oscs.forEach(({ osc, lfo }) => {
          osc.stop();
          lfo.stop();
        });
        void ctx.close();
      },
    };
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
    };
  }, [playing]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const current = SLIDES[slide]!;

  return (
    <section className="overflow-hidden rounded-3xl border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="relative aspect-[16/10]">
        {SLIDES.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.title}
            width={1024}
            height={640}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Publicidade • Natureza</p>
          <h3 className="text-lg font-bold">{current.title}</h3>
          <p className="text-sm text-muted-foreground">{current.text}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-card p-4">
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000"
              style={{ width: `${(elapsed / DURATION) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {mm}:{ss}
            </span>
            <span className="flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5" /> 05:00
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}