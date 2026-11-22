// Layered audio engine: vinyl blues music (real MP3 tracks + night stuck-groove),
// subtle underwater ambient soundscape, and delicate book/dieselpunk UI SFX.

import { AudioSettings } from '../types/game';

export type MusicMode = 'none' | 'morning' | 'evening' | 'night';
export type AmbientMode = 'none' | 'bar_day' | 'bar_evening' | 'bar_night' | 'grotto' | 'expedition';

const MUSIC_URLS: Record<Exclude<MusicMode, 'none'>, string> = {
  morning: '/audio/admiral_blues_morning.mp3',
  evening: '/audio/admiral_blues_evening.mp3',
  night: '/audio/admiral_blues_night.mp3',
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicEnabled: true,
  ambientEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.62,
  ambientVolume: 0.55,
  sfxVolume: 0.72,
};

interface AmbientGraph {
  rootGain: GainNode;
  hullGain: GainNode;
  waterGain: GainNode;
  barMurmurGain: GainNode;
  started: boolean;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  public enabled = true;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

  // Music channel state
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private currentMusicMode: MusicMode = 'none';
  private musicGen = 0;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicTrackGain: GainNode | null = null;
  private nightTimers: number[] = [];
  private nightFinished = false;

  // Ambient channel state
  private currentAmbientMode: AmbientMode = 'none';
  private ambientGraph: AmbientGraph | null = null;
  private creakTimer: number | null = null;

  private ensureContext(allowCreate = true): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx && allowCreate) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.ambientBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();

      this.musicBus.connect(this.masterGain);
      this.ambientBus.connect(this.masterGain);
      this.sfxBus.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyBusVolumes(true);
    }
    return this.ctx;
  }

  public unlock() {
    const ctx = this.ensureContext(true);
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          this.applyBusVolumes(false);
          if (this.currentAmbientMode !== 'none') {
            this.applyAmbientMode(this.currentAmbientMode);
          }
          if (
            this.currentMusicMode !== 'none' &&
            !this.musicSource &&
            !(this.currentMusicMode === 'night' && this.nightFinished)
          ) {
            this.startMusicMode(this.currentMusicMode);
          }
        })
        .catch(() => {});
    } else {
      if (this.currentAmbientMode !== 'none' && !this.ambientGraph) {
        this.applyAmbientMode(this.currentAmbientMode);
      }
      if (
        this.currentMusicMode !== 'none' &&
        !this.musicSource &&
        !(this.currentMusicMode === 'night' && this.nightFinished)
      ) {
        this.startMusicMode(this.currentMusicMode);
      }
    }
  }

  public syncSettings(enabled: boolean, settings: AudioSettings) {
    const prevMusicActive = this.enabled && this.settings.musicEnabled && this.settings.musicVolume > 0.001;
    this.enabled = enabled;
    this.settings = { ...settings };
    this.applyBusVolumes(false);

    const nextMusicActive = this.enabled && this.settings.musicEnabled && this.settings.musicVolume > 0.001;
    if (!nextMusicActive && this.musicSource) {
      this.stopMusicSource(0.35);
    } else if (
      nextMusicActive &&
      !prevMusicActive &&
      this.currentMusicMode !== 'none' &&
      !this.musicSource &&
      !(this.currentMusicMode === 'night' && this.nightFinished)
    ) {
      this.startMusicMode(this.currentMusicMode);
    }
  }

  private applyBusVolumes(immediate: boolean) {
    if (!this.ctx || !this.masterGain || !this.musicBus || !this.ambientBus || !this.sfxBus) {
      return;
    }
    const now = this.ctx.currentTime;
    const masterTarget = this.enabled ? 1 : 0;
    const musicTarget = this.settings.musicEnabled ? Math.max(0, Math.min(1, this.settings.musicVolume)) * 0.48 : 0;
    const ambientTarget = this.settings.ambientEnabled ? Math.max(0, Math.min(1, this.settings.ambientVolume)) * 0.44 : 0;
    const sfxTarget = this.settings.sfxEnabled ? Math.max(0, Math.min(1, this.settings.sfxVolume)) : 0;

    if (immediate) {
      this.masterGain.gain.setValueAtTime(masterTarget, now);
      this.musicBus.gain.setValueAtTime(musicTarget, now);
      this.ambientBus.gain.setValueAtTime(ambientTarget, now);
      this.sfxBus.gain.setValueAtTime(sfxTarget, now);
    } else {
      this.masterGain.gain.setTargetAtTime(masterTarget, now, 0.08);
      this.musicBus.gain.setTargetAtTime(musicTarget, now, 0.12);
      this.ambientBus.gain.setTargetAtTime(ambientTarget, now, 0.16);
      this.sfxBus.gain.setTargetAtTime(sfxTarget, now, 0.05);
    }
  }

  private getSfxTarget(): { ctx: AudioContext; out: AudioNode } | null {
    if (!this.enabled || !this.settings.sfxEnabled || this.settings.sfxVolume <= 0.001) {
      return null;
    }
    const ctx = this.ensureContext(true);
    if (!ctx || !this.sfxBus) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return { ctx, out: this.sfxBus };
  }

  // =========================================================================
  // VINYL BLUES MUSIC CHANNEL (3 states + authentic Night stuck-groove)
  // =========================================================================

  public setMusicState(mode: MusicMode) {
    if (mode === this.currentMusicMode) {
      // Never restart or duplicate the active record on tab switches or re-renders
      return;
    }
    this.currentMusicMode = mode;
    if (mode !== 'night') {
      this.nightFinished = false;
    }
    this.clearNightTimers();

    if (mode === 'none') {
      this.musicGen++;
      this.stopMusicSource(0.65);
      return;
    }

    if (!this.enabled || !this.settings.musicEnabled || this.settings.musicVolume <= 0.001) {
      this.musicGen++;
      this.stopMusicSource(0.35);
      return;
    }

    this.startMusicMode(mode);
  }

  private clearNightTimers() {
    this.nightTimers.forEach((id) => window.clearTimeout(id));
    this.nightTimers = [];
  }

  private stopMusicSource(fadeSec = 0.5) {
    this.clearNightTimers();
    const src = this.musicSource;
    const gain = this.musicTrackGain;
    this.musicSource = null;
    this.musicTrackGain = null;

    if (!src || !gain || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
      src.stop(now + fadeSec + 0.04);
    } catch {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    }
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    const existing = this.loadingPromises.get(url);
    if (existing) return existing;

    const ctx = this.ensureContext(true);
    if (!ctx) return null;

    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((arr) => ctx.decodeAudioData(arr))
      .then((decoded) => {
        this.bufferCache.set(url, decoded);
        this.loadingPromises.delete(url);
        return decoded;
      })
      .catch(() => {
        this.loadingPromises.delete(url);
        return null;
      });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  private async startMusicMode(mode: Exclude<MusicMode, 'none'>) {
    const gen = ++this.musicGen;
    this.stopMusicSource(0.55);

    const ctx = this.ensureContext(true);
    if (!ctx || !this.musicBus) return;
    if (ctx.state === 'suspended') {
      // Wait for user gesture unlock() to trigger playback cleanly
      return;
    }

    const url = MUSIC_URLS[mode];
    const buffer = await this.loadAudioBuffer(url);
    if (!buffer || gen !== this.musicGen || this.currentMusicMode !== mode) {
      return;
    }
    if (!this.enabled || !this.settings.musicEnabled || this.settings.musicVolume <= 0.001) {
      return;
    }

    const now = ctx.currentTime;
    const trackGain = ctx.createGain();
    const targetLevel = mode === 'morning' ? 0.78 : mode === 'evening' ? 0.9 : 0.74;
    trackGain.gain.setValueAtTime(0.0001, now);
    trackGain.gain.linearRampToValueAtTime(targetLevel, now + 0.95);
    trackGain.connect(this.musicBus);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = mode !== 'night';
    source.connect(trackGain);

    this.playNeedleDrop();
    source.start(now + 0.12);
    this.musicSource = source;
    this.musicTrackGain = trackGain;

    if (mode === 'night') {
      this.scheduleNightStuckGroove(gen, buffer);
    }
  }

  private scheduleNightStuckGroove(gen: number, buffer: AudioBuffer) {
    // Let the haunted night record play ~11.6 seconds before catching the edge scratch
    const scratchDelayMs = 11600;
    const t1 = window.setTimeout(() => {
      if (gen !== this.musicGen || this.currentMusicMode !== 'night' || !this.ctx || !this.musicBus) {
        return;
      }
      if (!this.enabled || !this.settings.musicEnabled) {
        return;
      }

      // Fade out main playback right at the scratch catch
      const prevSrc = this.musicSource;
      const prevGain = this.musicTrackGain;
      this.musicSource = null;
      this.musicTrackGain = null;
      const now = this.ctx.currentTime;
      if (prevSrc && prevGain) {
        try {
          prevGain.gain.cancelScheduledValues(now);
          prevGain.gain.setValueAtTime(prevGain.gain.value, now);
          prevGain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
          prevSrc.stop(now + 0.08);
        } catch {
          // ignore
        }
      }

      // Repeat a ~1.08s fragment 3 times with distinct vinyl needle-skip "шш-тук" clicks
      const loopOffset = Math.min(10.65, Math.max(2.0, buffer.duration - 2.2));
      const loopDur = 1.08;
      const repeats = 3;

      for (let r = 0; r < repeats; r++) {
        const repDelayMs = Math.round(r * (loopDur + 0.06) * 1000);
        const timerId = window.setTimeout(() => {
          if (gen !== this.musicGen || this.currentMusicMode !== 'night' || !this.ctx || !this.musicBus) {
            return;
          }
          if (!this.enabled || !this.settings.musicEnabled) return;

          this.playVinylSkipClick();
          const tNow = this.ctx.currentTime;
          const sliceGain = this.ctx.createGain();
          sliceGain.gain.setValueAtTime(0.001, tNow);
          sliceGain.gain.linearRampToValueAtTime(0.68, tNow + 0.035);
          sliceGain.gain.setValueAtTime(0.68, tNow + loopDur - 0.06);
          sliceGain.gain.linearRampToValueAtTime(0.001, tNow + loopDur);
          sliceGain.connect(this.musicBus);

          const sliceSrc = this.ctx.createBufferSource();
          sliceSrc.buffer = buffer;
          sliceSrc.connect(sliceGain);
          sliceSrc.start(tNow, loopOffset, loopDur + 0.02);
          this.musicSource = sliceSrc;
          this.musicTrackGain = sliceGain;
        }, repDelayMs);
        this.nightTimers.push(timerId);
      }

      // Silver gently lifts the needle after the 3rd skip -> stillness
      const liftDelayMs = Math.round(repeats * (loopDur + 0.06) * 1000) + 90;
      const liftTimer = window.setTimeout(() => {
        if (gen !== this.musicGen || this.currentMusicMode !== 'night') return;
        this.musicSource = null;
        this.musicTrackGain = null;
        this.nightFinished = true;
        this.playNeedleLift();
      }, liftDelayMs);
      this.nightTimers.push(liftTimer);
    }, scratchDelayMs);

    this.nightTimers.push(t1);
  }

  private playVinylSkipClick() {
    if (!this.ctx || !this.musicBus || !this.enabled || !this.settings.musicEnabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Short filtered noise burst ("шш") + crisp needle jump thump ("тук")
    const len = Math.floor(ctx.sampleRate * 0.065);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.exp(-(i / len) * 5.2);
      data[i] = (Math.random() * 2 - 1) * env * 0.45;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(2100, now);
    hp.Q.value = 1.4;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.42, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    noise.connect(hp);
    hp.connect(nGain);
    nGain.connect(this.musicBus);
    noise.start(now);

    const thump = ctx.createOscillator();
    const tGain = ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(165, now + 0.015);
    thump.frequency.exponentialRampToValueAtTime(52, now + 0.06);
    tGain.gain.setValueAtTime(0.26, now + 0.015);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    thump.connect(tGain);
    tGain.connect(this.musicBus);
    thump.start(now + 0.015);
    thump.stop(now + 0.07);
  }

  // =========================================================================
  // UNDERWATER AMBIENT CHANNEL (Single persistent graph — never duplicated)
  // =========================================================================

  public setAmbientState(mode: AmbientMode) {
    if (mode === this.currentAmbientMode && (mode === 'none' || this.ambientGraph)) {
      return;
    }
    this.currentAmbientMode = mode;

    if (mode === 'none') {
      this.stopCreakScheduler();
      if (this.ambientGraph && this.ctx) {
        const now = this.ctx.currentTime;
        this.ambientGraph.rootGain.gain.setTargetAtTime(0, now, 0.35);
      }
      return;
    }

    const ctx = this.ensureContext(true);
    if (!ctx || ctx.state === 'suspended') {
      return;
    }
    this.applyAmbientMode(mode);
  }

  private ensureAmbientGraph(): AmbientGraph | null {
    if (this.ambientGraph) return this.ambientGraph;
    const ctx = this.ensureContext(true);
    if (!ctx || !this.ambientBus) return null;

    const rootGain = ctx.createGain();
    rootGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    rootGain.connect(this.ambientBus);

    // 1. Deep hull hum (warm sub oscillators + slow pressure LFO)
    const hullGain = ctx.createGain();
    hullGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const hullFilter = ctx.createBiquadFilter();
    hullFilter.type = 'lowpass';
    hullFilter.frequency.setValueAtTime(125, ctx.currentTime);

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(46, ctx.currentTime);
    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.setValueAtTime(69.2, ctx.currentTime);
    const oscBGain = ctx.createGain();
    oscBGain.gain.setValueAtTime(0.28, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.085, ctx.currentTime);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(22, ctx.currentTime);
    lfo.connect(lfoDepth);
    lfoDepth.connect(hullFilter.frequency);

    oscA.connect(hullFilter);
    oscB.connect(oscBGain);
    oscBGain.connect(hullFilter);
    hullFilter.connect(hullGain);
    hullGain.connect(rootGain);

    // 2. Distant underwater ocean & pipe vibration (seamless brown-pink noise loop)
    const noiseSec = 6;
    const noiseLen = ctx.sampleRate * noiseSec;
    const noiseBuf = ctx.createBuffer(2, noiseLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = noiseBuf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < noiseLen; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.035 * w) / 1.035;
        data[i] = last * 2.4;
      }
      // Seamless wrap crossfade over 0.25s
      const fade = Math.floor(ctx.sampleRate * 0.25);
      for (let i = 0; i < fade; i++) {
        const a = i / fade;
        data[noiseLen - fade + i] = data[noiseLen - fade + i] * (1 - a) + data[i] * a;
      }
    }

    const waterSrc = ctx.createBufferSource();
    waterSrc.buffer = noiseBuf;
    waterSrc.loop = true;

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.setValueAtTime(210, ctx.currentTime);
    waterFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    const waterLfo = ctx.createOscillator();
    waterLfo.type = 'sine';
    waterLfo.frequency.setValueAtTime(0.055, ctx.currentTime);
    const waterLfoGain = ctx.createGain();
    waterLfoGain.gain.setValueAtTime(55, ctx.currentTime);
    waterLfo.connect(waterLfoGain);
    waterLfoGain.connect(waterFilter.frequency);

    const waterGain = ctx.createGain();
    waterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    waterSrc.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(rootGain);

    // 3. Soft warm evening bar murmur (muffled low-mid room warmth, raised ONLY in evening)
    const murmurSrc = ctx.createBufferSource();
    murmurSrc.buffer = noiseBuf;
    murmurSrc.loop = true;
    murmurSrc.playbackRate.setValueAtTime(1.22, ctx.currentTime);

    const murmurBandA = ctx.createBiquadFilter();
    murmurBandA.type = 'bandpass';
    murmurBandA.frequency.setValueAtTime(340, ctx.currentTime);
    murmurBandA.Q.setValueAtTime(1.6, ctx.currentTime);

    const murmurBandB = ctx.createBiquadFilter();
    murmurBandB.type = 'bandpass';
    murmurBandB.frequency.setValueAtTime(760, ctx.currentTime);
    murmurBandB.Q.setValueAtTime(2.0, ctx.currentTime);

    const murmurMod = ctx.createOscillator();
    murmurMod.type = 'sine';
    murmurMod.frequency.setValueAtTime(0.24, ctx.currentTime);
    const murmurModGain = ctx.createGain();
    murmurModGain.gain.setValueAtTime(70, ctx.currentTime);
    murmurMod.connect(murmurModGain);
    murmurModGain.connect(murmurBandB.frequency);

    const barMurmurGain = ctx.createGain();
    barMurmurGain.gain.setValueAtTime(0.0001, ctx.currentTime);

    murmurSrc.connect(murmurBandA);
    murmurSrc.connect(murmurBandB);
    murmurBandA.connect(barMurmurGain);
    murmurBandB.connect(barMurmurGain);
    barMurmurGain.connect(rootGain);

    oscA.start();
    oscB.start();
    lfo.start();
    waterSrc.start();
    waterLfo.start();
    murmurSrc.start();
    murmurMod.start();

    this.ambientGraph = {
      rootGain,
      hullGain,
      waterGain,
      barMurmurGain,
      started: true,
    };
    return this.ambientGraph;
  }

  private applyAmbientMode(mode: Exclude<AmbientMode, 'none'>) {
    const graph = this.ensureAmbientGraph();
    if (!graph || !this.ctx) return;

    const now = this.ctx.currentTime;
    const profiles: Record<
      Exclude<AmbientMode, 'none'>,
      { root: number; hull: number; water: number; murmur: number }
    > = {
      bar_day: { root: 0.9, hull: 0.16, water: 0.24, murmur: 0.0 },
      bar_evening: { root: 0.95, hull: 0.11, water: 0.17, murmur: 0.22 },
      bar_night: { root: 0.55, hull: 0.11, water: 0.14, murmur: 0.0 },
      grotto: { root: 0.92, hull: 0.18, water: 0.28, murmur: 0.04 },
      expedition: { root: 1.0, hull: 0.24, water: 0.34, murmur: 0.0 },
    };

    const p = profiles[mode];
    graph.rootGain.gain.setTargetAtTime(p.root, now, 0.55);
    graph.hullGain.gain.setTargetAtTime(p.hull, now, 0.7);
    graph.waterGain.gain.setTargetAtTime(p.water, now, 0.7);
    graph.barMurmurGain.gain.setTargetAtTime(p.murmur, now, 0.85);

    this.scheduleNextCreak();
  }

  private stopCreakScheduler() {
    if (this.creakTimer !== null) {
      window.clearTimeout(this.creakTimer);
      this.creakTimer = null;
    }
  }

  private scheduleNextCreak() {
    this.stopCreakScheduler();
    if (this.currentAmbientMode === 'none') return;

    const baseDelay =
      this.currentAmbientMode === 'bar_night'
        ? 18000 + Math.random() * 14000
        : 10500 + Math.random() * 11500;

    this.creakTimer = window.setTimeout(() => {
      this.playDistantHullCreak();
      this.scheduleNextCreak();
    }, baseDelay);
  }

  private playDistantHullCreak() {
    if (
      !this.ctx ||
      !this.ambientBus ||
      !this.enabled ||
      !this.settings.ambientEnabled ||
      this.settings.ambientVolume <= 0.001 ||
      this.currentAmbientMode === 'none'
    ) {
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const isNight = this.currentAmbientMode === 'bar_night';

    // Very soft distant underwater hull groan or pipe knock
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const startFreq = 95 + Math.random() * 65;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * (0.72 + Math.random() * 0.14), now + 1.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220 + Math.random() * 110, now);
    filter.Q.setValueAtTime(4.5, now);

    const peak = isNight ? 0.022 : 0.042;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.32);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientBus);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  // =========================================================================
  // DELICATE BOOK & UI SFX
  // =========================================================================

  public playNeedleDrop() {
    if (!this.ctx || !this.musicBus || !this.enabled || !this.settings.musicEnabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.065);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playNeedleLift() {
    if (!this.ctx || !this.musicBus || !this.enabled || !this.settings.musicEnabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Soft mechanical tonearm lift click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playPageTurn() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.13;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1250, now);
    filter.frequency.exponentialRampToValueAtTime(460, now + 0.13);
    filter.Q.value = 1.1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    noise.start(now);
  }

  public playTabSwitch() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;

    // Soft bookmark silk/paper brush + gentle low wood tap
    const len = Math.floor(ctx.sampleRate * 0.085);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.09;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1650, now);
    filter.frequency.exponentialRampToValueAtTime(780, now + 0.08);
    filter.Q.value = 1.4;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.12, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(out);
    noise.start(now);

    const osc = ctx.createOscillator();
    const oGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.04);
    oGain.gain.setValueAtTime(0.055, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(oGain);
    oGain.connect(out);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playItemPick() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.055);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playClick() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(230, now + 0.04);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.052);
  }

  public playPinClick() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPinSnap() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.16);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playLockOpen() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.24);
    });
  }

  public playSonarPing() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.55);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  public playHit(heavy = false) {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = heavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(heavy ? 160 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + (heavy ? 0.22 : 0.12));
    gain.gain.setValueAtTime(heavy ? 0.16 : 0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.24 : 0.13));
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCoin() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    [1318.5, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.08, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  public playAbyssWhisper() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    [146.83, 155.56, 220].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.94, now + 0.7);
      gain.gain.setValueAtTime(0.038, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.78);
    });
  }

  public playWrench() {
    const target = this.getSfxTarget();
    if (!target) return;
    const { ctx, out } = target;
    const now = ctx.currentTime;
    [420, 680].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(f * 1.4, now + idx * 0.08 + 0.09);
      gain.gain.setValueAtTime(0.095, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.14);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.16);
    });
  }
}

export const sfx = new SoundEngine();
