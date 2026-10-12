// Sound Engine for Pomoduo
// Provides tactile ceramic haptic click feedback, notification chimes,
// ambient sound generators (rain, cafe, night, vinyl crackle, fire),
// and procedural/streamed lofi chill music.

class SoundEngine {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private sfxGain: GainNode | null = null;
	private ambientMasterGain: GainNode | null = null;

	// Ambient nodes
	private rainGain: GainNode | null = null;
	private rainSource: AudioNode | null = null;

	private cafeGain: GainNode | null = null;
	private cafeSource: AudioNode | null = null;

	private nightGain: GainNode | null = null;
	private nightSource: AudioNode | null = null;

	private vinylGain: GainNode | null = null;
	private vinylSource: AudioNode | null = null;

	private fireGain: GainNode | null = null;
	private fireSource: AudioNode | null = null;

	// Lofi synth nodes
	private lofiGain: GainNode | null = null;
	private lofiInterval: number | null = null;
	private isLofiPlaying = false;

	// Sound states
	public sfxEnabled = true;
	public ambientVolumes = {
		rain: 0,
		cafe: 0,
		night: 0,
		vinyl: 0.15,
		fire: 0
	};

	private initContext() {
		if (typeof window === 'undefined') return null;
		if (!this.ctx) {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			this.ctx = new AudioContextClass();

			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
			this.masterGain.connect(this.ctx.destination);

			this.sfxGain = this.ctx.createGain();
			this.sfxGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
			this.sfxGain.connect(this.masterGain);

			this.ambientMasterGain = this.ctx.createGain();
			this.ambientMasterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
			this.ambientMasterGain.connect(this.masterGain);

			this.lofiGain = this.ctx.createGain();
			this.lofiGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
			this.lofiGain.connect(this.masterGain);
		}

		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
		return this.ctx;
	}

	/**
	 * Synthesizes ultra-tactile ceramic / porcelain button clicks.
	 * Characteristics: Crisp transient click + hollow resonant ceramic body ping.
	 */
	public playCeramicClick(type: 'ceramic' | 'soft' | 'pop' | 'bell' | 'poke' = 'ceramic') {
		if (!this.sfxEnabled) return;
		const ctx = this.initContext();
		if (!ctx || !this.sfxGain) return;

		const now = ctx.currentTime;

		if (type === 'poke') {
			// Squeaky cute pop for tomato poke
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(480, now);
			osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
			gain.gain.setValueAtTime(0.6, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(now);
			osc.stop(now + 0.13);
			return;
		}

		if (type === 'soft') {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(600, now);
			osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
			gain.gain.setValueAtTime(0.4, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(now);
			osc.stop(now + 0.07);
			return;
		}

		// Realistic ceramic / porcelain haptic button feel
		// High frequency click (transient)
		const bufferSize = ctx.sampleRate * 0.015;
		const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const output = noiseBuffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
		}
		const noise = ctx.createBufferSource();
		noise.buffer = noiseBuffer;

		const noiseFilter = ctx.createBiquadFilter();
		noiseFilter.type = 'bandpass';
		noiseFilter.frequency.setValueAtTime(3200, now);
		noiseFilter.Q.setValueAtTime(2.5, now);

		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(0.65, now);
		noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

		noise.connect(noiseFilter);
		noiseFilter.connect(noiseGain);
		noiseGain.connect(this.sfxGain);
		noise.start(now);

		// Ceramic resonant ping (1100Hz with fast decay)
		const osc = ctx.createOscillator();
		const toneGain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(1080, now);
		osc.frequency.exponentialRampToValueAtTime(840, now + 0.05);

		toneGain.gain.setValueAtTime(0.75, now);
		toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

		osc.connect(toneGain);
		toneGain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 0.07);
	}

	/**
	 * Calming singing bowl / Tibetan bell chime for pomodoro completion.
	 */
	public playCompletionChime() {
		const ctx = this.initContext();
		if (!ctx || !this.sfxGain) return;

		const now = ctx.currentTime;
		const frequencies = [528, 792, 1056, 1584]; // Harmonious Solfeggio 528Hz healing chord
		const weights = [0.4, 0.25, 0.15, 0.08];

		frequencies.forEach((freq, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 2, now);

			const amp = weights[idx] * 1.35;
			gain.gain.setValueAtTime(amp, now);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8 + idx * 0.5);

			osc.connect(gain);
			gain.connect(this.sfxGain!);
			osc.start(now);
			osc.stop(now + 4.8);
		});
	}

	/**
	 * Notification sound when Focus ends -> Time for Break!
	 * Soothing Solfeggio 528Hz healing singing bowl chime.
	 */
	public playFocusComplete() {
		this.playCompletionChime();
	}

	/**
	 * Notification sound when Break ends -> Time for new Focus session!
	 * Uplifting, crisp 4-note ascending chime (C5 -> E5 -> G5 -> C6) to wake up and energize.
	 */
	public playBreakComplete() {
		const ctx = this.initContext();
		if (!ctx || !this.sfxGain) return;

		const now = ctx.currentTime;
		// Ascending uplifting notes
		const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
		const noteDelay = 0.16;

		notes.forEach((freq, idx) => {
			const noteTime = now + idx * noteDelay;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, noteTime);

			gain.gain.setValueAtTime(0.001, noteTime);
			gain.gain.linearRampToValueAtTime(0.45, noteTime + 0.03);
			gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.8);

			// Add harmonic sparkle
			const harm = ctx.createOscillator();
			const harmGain = ctx.createGain();
			harm.type = 'triangle';
			harm.frequency.setValueAtTime(freq * 2, noteTime);
			harmGain.gain.setValueAtTime(0.001, noteTime);
			harmGain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
			harmGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

			osc.connect(gain);
			gain.connect(this.sfxGain!);
			harm.connect(harmGain);
			harmGain.connect(this.sfxGain!);

			osc.start(noteTime);
			osc.stop(noteTime + 1.9);
			harm.start(noteTime);
			harm.stop(noteTime + 1.3);
		});
	}

	/**
	 * Audio cue when starting a new session
	 */
	public playSessionStart() {
		const ctx = this.initContext();
		if (!ctx || !this.sfxGain) return;

		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(392.0, now); // G4
		osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.12); // C5

		gain.gain.setValueAtTime(0.35, now);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 0.85);
	}

	// ==================== AMBIENT SOUND GENERATORS ====================

	/**
	 * Creates pink/brown noise buffer for natural elements.
	 */
	private createNoiseBuffer(duration = 5): AudioBuffer | null {
		if (!this.ctx) return null;
		const bufferSize = this.ctx.sampleRate * duration;
		const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
		const data = buffer.getChannelData(0);
		let b0 = 0,
			b1 = 0,
			b2 = 0,
			b3 = 0,
			b4 = 0,
			b5 = 0,
			b6 = 0;

		for (let i = 0; i < bufferSize; i++) {
			const white = Math.random() * 2 - 1;
			b0 = 0.99886 * b0 + white * 0.0555179;
			b1 = 0.99332 * b1 + white * 0.0750759;
			b2 = 0.969 * b2 + white * 0.153852;
			b3 = 0.8665 * b3 + white * 0.3104856;
			b4 = 0.55 * b4 + white * 0.5329522;
			b5 = -0.7616 * b5 - white * 0.016898;
			data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
			b6 = white * 0.115926;
		}
		return buffer;
	}

	public setRainVolume(vol: number) {
		this.ambientVolumes.rain = Math.max(0, Math.min(1, vol));
		const ctx = this.initContext();
		if (!ctx || !this.ambientMasterGain) return;

		if (this.ambientVolumes.rain > 0 && !this.rainSource) {
			const buffer = this.createNoiseBuffer(5);
			if (!buffer) return;

			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.loop = true;

			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(1400, ctx.currentTime);

			const filter2 = ctx.createBiquadFilter();
			filter2.type = 'highpass';
			filter2.frequency.setValueAtTime(280, ctx.currentTime);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(this.ambientVolumes.rain * 0.9, ctx.currentTime);

			source.connect(filter);
			filter.connect(filter2);
			filter2.connect(gain);
			gain.connect(this.ambientMasterGain);

			source.start();
			this.rainSource = source;
			this.rainGain = gain;
		} else if (this.rainGain) {
			this.rainGain.gain.setTargetAtTime(this.ambientVolumes.rain * 0.9, ctx.currentTime, 0.2);
			if (this.ambientVolumes.rain === 0 && this.rainSource) {
				try {
					(this.rainSource as AudioBufferSourceNode).stop(ctx.currentTime + 0.3);
				} catch {
					/* ignore stop error */
				}
				this.rainSource = null;
			}
		}
	}

	public setCafeVolume(vol: number) {
		this.ambientVolumes.cafe = Math.max(0, Math.min(1, vol));
		const ctx = this.initContext();
		if (!ctx || !this.ambientMasterGain) return;

		if (this.ambientVolumes.cafe > 0 && !this.cafeSource) {
			const buffer = this.createNoiseBuffer(4);
			if (!buffer) return;

			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.loop = true;

			const filter = ctx.createBiquadFilter();
			filter.type = 'bandpass';
			filter.frequency.setValueAtTime(450, ctx.currentTime);
			filter.Q.setValueAtTime(1.2, ctx.currentTime);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(this.ambientVolumes.cafe * 0.8, ctx.currentTime);

			source.connect(filter);
			filter.connect(gain);
			gain.connect(this.ambientMasterGain);

			source.start();
			this.cafeSource = source;
			this.cafeGain = gain;
		} else if (this.cafeGain) {
			this.cafeGain.gain.setTargetAtTime(this.ambientVolumes.cafe * 0.8, ctx.currentTime, 0.2);
			if (this.ambientVolumes.cafe === 0 && this.cafeSource) {
				try {
					(this.cafeSource as AudioBufferSourceNode).stop(ctx.currentTime + 0.3);
				} catch {
					/* ignore stop error */
				}
				this.cafeSource = null;
			}
		}
	}

	public setNightVolume(vol: number) {
		this.ambientVolumes.night = Math.max(0, Math.min(1, vol));
		const ctx = this.initContext();
		if (!ctx || !this.ambientMasterGain) return;

		if (this.ambientVolumes.night > 0 && !this.nightSource) {
			// Night crickets + gentle breeze
			const buffer = this.createNoiseBuffer(6);
			if (!buffer) return;

			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.loop = true;

			const filter = ctx.createBiquadFilter();
			filter.type = 'bandpass';
			filter.frequency.setValueAtTime(4600, ctx.currentTime);
			filter.Q.setValueAtTime(4.0, ctx.currentTime);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(this.ambientVolumes.night * 0.6, ctx.currentTime);

			source.connect(filter);
			filter.connect(gain);
			gain.connect(this.ambientMasterGain);

			source.start();
			this.nightSource = source;
			this.nightGain = gain;
		} else if (this.nightGain) {
			this.nightGain.gain.setTargetAtTime(this.ambientVolumes.night * 0.6, ctx.currentTime, 0.2);
			if (this.ambientVolumes.night === 0 && this.nightSource) {
				try {
					(this.nightSource as AudioBufferSourceNode).stop(ctx.currentTime + 0.3);
				} catch {
					/* ignore stop error */
				}
				this.nightSource = null;
			}
		}
	}

	public setFireVolume(vol: number) {
		this.ambientVolumes.fire = Math.max(0, Math.min(1, vol));
		const ctx = this.initContext();
		if (!ctx || !this.ambientMasterGain) return;

		if (this.ambientVolumes.fire > 0 && !this.fireSource) {
			const buffer = this.createNoiseBuffer(5);
			if (!buffer) return;

			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.loop = true;

			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(350, ctx.currentTime);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(this.ambientVolumes.fire * 0.75, ctx.currentTime);

			source.connect(filter);
			filter.connect(gain);
			gain.connect(this.ambientMasterGain);

			source.start();
			this.fireSource = source;
			this.fireGain = gain;
		} else if (this.fireGain) {
			this.fireGain.gain.setTargetAtTime(this.ambientVolumes.fire * 0.75, ctx.currentTime, 0.2);
			if (this.ambientVolumes.fire === 0 && this.fireSource) {
				try {
					(this.fireSource as AudioBufferSourceNode).stop(ctx.currentTime + 0.3);
				} catch {
					/* ignore stop error */
				}
				this.fireSource = null;
			}
		}
	}

	public setVinylVolume(vol: number) {
		this.ambientVolumes.vinyl = Math.max(0, Math.min(1, vol));
		const ctx = this.initContext();
		if (!ctx || !this.ambientMasterGain) return;

		if (this.ambientVolumes.vinyl > 0 && !this.vinylSource) {
			// Vinyl crackle simulation
			const bufferSize = ctx.sampleRate * 2;
			const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				if (Math.random() < 0.002) {
					data[i] = (Math.random() * 2 - 1) * 0.6;
				} else {
					data[i] = (Math.random() * 2 - 1) * 0.015;
				}
			}
			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.loop = true;

			const filter = ctx.createBiquadFilter();
			filter.type = 'highpass';
			filter.frequency.setValueAtTime(1000, ctx.currentTime);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(this.ambientVolumes.vinyl * 0.65, ctx.currentTime);

			source.connect(filter);
			filter.connect(gain);
			gain.connect(this.ambientMasterGain);

			source.start();
			this.vinylSource = source;
			this.vinylGain = gain;
		} else if (this.vinylGain) {
			this.vinylGain.gain.setTargetAtTime(this.ambientVolumes.vinyl * 0.65, ctx.currentTime, 0.2);
		}
	}

	// ==================== PROCEDURAL LOFI CHILL CHORDS ENGINE ====================
	// Generates soothing Rhodes-style jazz chords & vinyl warmth offline!

	public startProceduralLofi(bpm = 74) {
		if (this.isLofiPlaying) return;
		const ctx = this.initContext();
		if (!ctx || !this.lofiGain) return;

		this.isLofiPlaying = true;
		this.setVinylVolume(0.18); // Turn on subtle vinyl crackle automatically

		// Lofi jazz chord progressions (MIDI notes)
		// Dm9 -> G13 -> Cmaj9 -> Am9
		const progressions = [
			// Dm9: D3, F3, A3, C4, E4
			[146.83, 174.61, 220.0, 261.63, 329.63],
			// G13: G2, F3, B3, E4
			[98.0, 174.61, 246.94, 329.63],
			// Cmaj9: C3, E3, G3, B3, D4
			[130.81, 164.81, 196.0, 246.94, 293.66],
			// Am9: A2, E3, G3, C4, B4
			[110.0, 164.81, 196.0, 261.63, 493.88],
			// Fmaj7: F2, C3, E3, A3, C4
			[87.31, 130.81, 164.81, 220.0, 261.63],
			// Em7: E2, B2, D3, G3, D4
			[82.41, 123.47, 146.83, 196.0, 293.66]
		];

		let chordIndex = 0;
		const beatSec = 60 / bpm;
		const chordDuration = beatSec * 4; // 1 chord every bar (4 beats)

		const playNextChord = () => {
			if (!this.isLofiPlaying || !this.ctx || !this.lofiGain) return;

			const chord = progressions[chordIndex % progressions.length];
			chordIndex++;

			const now = this.ctx.currentTime;

			// Play Rhodes chord notes with warm vibrato & filter
			chord.forEach((freq, idx) => {
				const osc = this.ctx!.createOscillator();
				const gain = this.ctx!.createGain();

				// Soft electric piano / sine + triangle mix
				osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
				// Slight detune for analog warmth
				osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, now);

				// Tremolo LFO for classic Rhodes flutter
				const lfo = this.ctx!.createOscillator();
				const lfoGain = this.ctx!.createGain();
				lfo.frequency.setValueAtTime(4.2, now);
				lfoGain.gain.setValueAtTime(2.5, now);
				lfo.connect(osc.frequency);
				lfo.start(now);
				lfo.stop(now + chordDuration + 0.5);

				// Lowpass filter for cozy muffled lofi feel
				const filter = this.ctx!.createBiquadFilter();
				filter.type = 'lowpass';
				filter.frequency.setValueAtTime(800 + idx * 80, now);
				filter.frequency.exponentialRampToValueAtTime(450, now + chordDuration);

				// Soft attack and slow release
				const noteVolume = 0.24 / Math.sqrt(chord.length);
				gain.gain.setValueAtTime(0.001, now);
				gain.gain.linearRampToValueAtTime(noteVolume, now + 0.15 + idx * 0.03); // Strum delay
				gain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration + 0.4);

				osc.connect(filter);
				filter.connect(gain);
				gain.connect(this.lofiGain!);

				osc.start(now + idx * 0.03);
				osc.stop(now + chordDuration + 0.5);
			});

			// Soft lofi bass kick on beat 1 and 3
			this.playLofiKick(now);
			this.playLofiSnare(now + beatSec * 2);
			this.playLofiKick(now + beatSec * 2.75);
		};

		playNextChord();
		this.lofiInterval = window.setInterval(playNextChord, chordDuration * 1000);
	}

	private playLofiKick(time: number) {
		if (!this.ctx || !this.lofiGain) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(110, time);
		osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

		gain.gain.setValueAtTime(0.45, time);
		gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

		osc.connect(gain);
		gain.connect(this.lofiGain);
		osc.start(time);
		osc.stop(time + 0.26);
	}

	private playLofiSnare(time: number) {
		if (!this.ctx || !this.lofiGain) return;
		// Soft muffled rimshot / brush snare
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(190, time);
		osc.frequency.exponentialRampToValueAtTime(70, time + 0.08);

		gain.gain.setValueAtTime(0.28, time);
		gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

		osc.connect(gain);
		gain.connect(this.lofiGain);
		osc.start(time);
		osc.stop(time + 0.16);
	}

	public stopProceduralLofi() {
		this.isLofiPlaying = false;
		if (this.lofiInterval) {
			clearInterval(this.lofiInterval);
			this.lofiInterval = null;
		}
	}

	public setMusicVolume(vol: number) {
		const ctx = this.initContext();
		if (!ctx || !this.lofiGain) return;
		const clamped = Math.max(0, Math.min(1, vol));
		this.lofiGain.gain.setTargetAtTime(clamped * 1.0, ctx.currentTime, 0.1);
	}

	public setMasterVolume(vol: number) {
		const ctx = this.initContext();
		if (!ctx || !this.masterGain) return;
		const clamped = Math.max(0, Math.min(1, vol));
		this.masterGain.gain.setTargetAtTime(clamped, ctx.currentTime, 0.1);
	}
}

export const soundEngine = new SoundEngine();
