"use client";

// Lightweight Web Audio sound engine — no asset files, all synthesized.
// Plays short procedural SFX for game events. Respects a global mute flag.

type SfxName =
  | "putt"
  | "wall"
  | "bumper"
  | "splash"
  | "cup"
  | "warp"
  | "wind"
  | "sink";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicPlaying = false;
  muted = false;
  sfxVolume = 0.5; // 0..1
  musicVolume = 0.12; // 0..1 (music is quieter by default)

  private ensure() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.master);
    }
    // resume on demand (browsers suspend until user gesture)
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
    if (m && this.musicPlaying) this.stopMusic();
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v)) * 0.25; // cap at 0.25
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    slideTo?: number
  ) {
    this.ensure();
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, slideTo),
        t + dur
      );
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(dur: number, vol: number, filterFreq: number) {
    this.ensure();
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // ---- Ambient music: a slow evolving pad using two detuned oscillators
  // that drift between chords in a pentatonic scale. Very quiet + relaxing.
  private static readonly MUSIC_NOTES = [
    261.63, 293.66, 329.63, 392.0, 440.0, // C D E G A (C major pentatonic)
  ];
  private musicChordIndex = 0;

  startMusic() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;
    // Create two sustained detuned oscillators (a soft pad)
    const make = (freq: number, type: OscillatorType, vol: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start();
      return { osc, gain };
    };
    const f = SoundEngine.MUSIC_NOTES[0];
    this.musicNodes = [
      make(f, "sine", 0.5),
      make(f * 1.005, "sine", 0.35),
      make(f * 2, "triangle", 0.12),
    ];
    // chord progression timer — change the base note every 5 seconds
    this.musicChordIndex = 0;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicGain) return;
      this.musicChordIndex = (this.musicChordIndex + 1) % SoundEngine.MUSIC_NOTES.length;
      const base = SoundEngine.MUSIC_NOTES[this.musicChordIndex];
      const t = this.ctx.currentTime;
      this.musicNodes.forEach((n, i) => {
        const target = i === 2 ? base * 2 : base * (i === 0 ? 1 : 1.005);
        n.osc.frequency.exponentialRampToValueAtTime(target, t + 1.5);
      });
    }, 5000);
  }

  stopMusic() {
    if (!this.musicPlaying) return;
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    const t = this.ctx?.currentTime ?? 0;
    this.musicNodes.forEach((n) => {
      try {
        n.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        n.osc.stop(t + 0.7);
      } catch {
        /* ignore */
      }
    });
    this.musicNodes = [];
  }

  get isMusicPlaying() {
    return this.musicPlaying;
  }

  play(name: SfxName, intensity = 1) {
    if (this.muted) return;
    switch (name) {
      case "putt":
        // soft thwack: short noise + low tone
        this.noiseBurst(0.08, 0.25 * intensity, 1200);
        this.blip(180, 0.12, "triangle", 0.18 * intensity, 90);
        break;
      case "wall":
        this.noiseBurst(0.05, 0.18 * Math.min(1, intensity), 800);
        this.blip(120, 0.08, "square", 0.1 * intensity, 80);
        break;
      case "bumper":
        // bright ping
        this.blip(660, 0.14, "sine", 0.22 * intensity, 990);
        this.blip(880, 0.1, "sine", 0.12 * intensity);
        break;
      case "splash":
        // water: filtered noise sweep down
        this.noiseBurst(0.35, 0.3, 600);
        this.blip(220, 0.3, "sine", 0.12, 110);
        break;
      case "cup":
        // satisfying drop-in: two-tone descending then warm chord
        this.blip(523, 0.1, "sine", 0.2);
        setTimeout(() => this.blip(392, 0.18, "sine", 0.22), 90);
        setTimeout(() => this.blip(261, 0.3, "triangle", 0.18), 220);
        break;
      case "warp":
        // teleport: rising zwoosh
        this.blip(200, 0.3, "sawtooth", 0.2, 1400);
        this.noiseBurst(0.25, 0.12, 3000);
        break;
      case "wind":
        // ambient gust
        this.noiseBurst(0.6, 0.08, 500);
        break;
      case "sink":
        this.blip(330, 0.15, "sine", 0.2, 660);
        break;
    }
  }
}

// Singleton — safe on client only.
let instance: SoundEngine | null = null;

export function getSound(): SoundEngine {
  if (!instance) instance = new SoundEngine();
  return instance;
}
