// Web Audio API Sound Effects + Real Video Soundtrack ("02 - Pipa en Acción") & Urban Beat Engine

export class BarberAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this.musicStation = 0;
    this.musicInterval = null;
    this.mediaAudio = null;
    this.wasPlayingBeforeModal = false;

    this.stations = [
      {
        name: '02 — Pipa en Acción (Ritmo Original)',
        type: 'media',
        src: '../assets/pipa-02.mp4'
      },
      {
        name: 'Urban Barber Beat (Hip-Hop / Boom-Bap)',
        type: 'synth-urban'
      },
      {
        name: '01 — El Estudio (Ritmo Original)',
        type: 'media',
        src: '../assets/pipa-01.mp4'
      },
      {
        name: '05 — El Resultado (Ritmo Original)',
        type: 'media',
        src: '../assets/pipa-05.mp4'
      }
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.mediaAudio) {
      this.mediaAudio = new Audio();
      this.mediaAudio.loop = true;
      this.mediaAudio.volume = 0.55;
      this.mediaAudio.preload = 'auto';
    }
  }

  setMuted(mute) {
    this.muted = mute;
    if (this.mediaAudio) {
      this.mediaAudio.muted = mute;
    }
    if (this.muted && this.musicPlaying) {
      this.stopMusic();
    }
  }

  // Pause background music temporarily when watching a video in the gallery modal
  pauseForModal() {
    if (this.musicPlaying) {
      this.wasPlayingBeforeModal = true;
      this.stopMusic();
    } else {
      this.wasPlayingBeforeModal = false;
    }
  }

  resumeAfterModal() {
    if (this.wasPlayingBeforeModal && !this.muted) {
      this.wasPlayingBeforeModal = false;
      this.startMusic();
    }
  }

  // Subtle UI hover tick
  playHover() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.03);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Mechanical light switch click
  playSwitch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Electric hair clippers buzz ("Bzzzzz!")
  playClippers(duration = 1.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(118, now);
    osc2.frequency.setValueAtTime(236, now);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 18;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    filter.type = 'bandpass';
    filter.frequency.value = 480;
    filter.Q.value = 1.8;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.08);
    gain.gain.setValueAtTime(0.11, now + duration - 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Metallic Barber Scissors "Snip! Snip! Snip!"
  playScissors() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const snipTimes = [0, 0.22, 0.44, 0.72];
    snipTimes.forEach((offset) => {
      const start = this.ctx.currentTime + offset;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2800, start);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3400, start);
      osc.frequency.exponentialRampToValueAtTime(5200, start + 0.045);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(start);
      osc.start(start);
      osc.stop(start + 0.06);
    });
  }

  // Water Spray Bottle "Pssht! Pssht!"
  playSpray() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    [0, 0.28].forEach((offset) => {
      const start = this.ctx.currentTime + offset;
      const duration = 0.19;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4200, start);
      filter.Q.setValueAtTime(1.2, start);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.005, start + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(start);
    });
  }

  // Reception Brass Service Bell ("Ding!")
  playBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1567.98, 3135.96, 4186.01];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const amp = 0.14 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4 - idx * 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.45);
    });
  }

  // Hydraulic Chair Pump / Recline sound
  playHydraulic() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.55;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(165, now + duration);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Pouring Mate / Hot Water sound
  playMatePour() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.9;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(1250, now + duration);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Toggle or cycle through the Barbershop Music Stations
  toggleMusic(cycleNext = false) {
    this.init();
    if (!this.musicPlaying) {
      this.startMusic();
    } else if (cycleNext) {
      this.musicStation = (this.musicStation + 1) % (this.stations.length + 1);
      if (this.musicStation === this.stations.length) {
        // Cycle back to Off after the last station
        this.musicStation = 0;
        this.stopMusic();
      } else {
        this.stopMusic();
        this.startMusic();
      }
    } else {
      this.stopMusic();
    }

    return {
      playing: this.musicPlaying,
      station: this.stations[this.musicStation].name
    };
  }

  startMusic() {
    if (this.muted) return;
    this.init();
    this.stopMusic();
    this.musicPlaying = true;

    const current = this.stations[this.musicStation];

    if (current.type === 'media' && this.mediaAudio) {
      this.mediaAudio.src = current.src;
      this.mediaAudio.currentTime = 0;
      this.mediaAudio.play().catch(() => {
        // Fallback to procedural urban beat if media autoplay blocked
        this.startUrbanBeat();
      });
      return;
    }

    this.startUrbanBeat();
  }

  // Energetic Urban / Trap / Boom-Bap Barber Rhythm (92 BPM, 16-step sequencer)
  startUrbanBeat() {
    if (!this.ctx) return;
    let step = 0;
    const stepMs = 162; // ~92 BPM 16th notes

    const triggerKick = (time) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.3);
    };

    const triggerSnare = (time) => {
      const bufSize = Math.floor(this.ctx.sampleRate * 0.14);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(900, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(time);
    };

    const triggerHat = (time, open = false) => {
      const dur = open ? 0.12 : 0.035;
      const bufSize = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6500, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(open ? 0.06 : 0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(time);
    };

    const triggerSubBass = (time, freq) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, time);
      gain.gain.setValueAtTime(0.11, time);
      gain.gain.exponentialRampToValueAtTime(0.002, time + 0.32);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.34);
    };

    const triggerChordStab = (time, notes) => {
      notes.forEach((f) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);
        gain.gain.setValueAtTime(0.028, time);
        gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.42);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.44);
      });
    };

    const bassNotes = [55.0, 55.0, 65.41, 49.0]; // A1, A1, C2, G1

    const runStep = () => {
      if (!this.musicPlaying || this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const s = step % 16;
      const bar = Math.floor(step / 16) % 4;

      // Kick pattern: 0, 3, 6, 10
      if (s === 0 || s === 3 || s === 6 || s === 10) {
        triggerKick(now);
        triggerSubBass(now, bassNotes[bar]);
      }

      // Snare / Clap on 4 and 12
      if (s === 4 || s === 12) {
        triggerSnare(now);
      }

      // Crisp urban hi-hats with trap double-roll on step 14-15
      if (s % 2 === 0 || s === 7 || s === 14 || s === 15) {
        triggerHat(now, s === 10);
      }

      // Minor chord stabs on step 0 and 6
      if (s === 0 || s === 6) {
        const chords = [
          [220.0, 261.63, 329.63, 392.0], // Am7
          [196.0, 246.94, 293.66, 349.23] // G7
        ];
        triggerChordStab(now, chords[bar % 2]);
      }

      step++;
    };

    runStep();
    this.musicInterval = setInterval(runStep, stepMs);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.mediaAudio) {
      this.mediaAudio.pause();
    }
  }
}

