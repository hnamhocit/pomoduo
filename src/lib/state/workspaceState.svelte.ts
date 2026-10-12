import { soundEngine } from '#lib/audio/soundEngine';
import confetti from 'canvas-confetti';

export type Mode = 'focus' | 'break';
export type Preset = '25/5' | '50/10' | 'custom';
export type Theme = 'peach' | 'matcha' | 'midnight' | 'mist';

export interface AmbientPreset {
	id: string;
	name: string;
	icon: string;
	rain: number;
	cafe: number;
	night: number;
	vinyl: number;
	fire: number;
}

export const SOUNDSCAPE_PRESETS: AmbientPreset[] = [
	{
		id: 'rainy_night',
		name: 'Mưa đêm chill',
		icon: '🌧️',
		rain: 0.65,
		cafe: 0,
		night: 0.4,
		vinyl: 0.2,
		fire: 0
	},
	{
		id: 'cafe_corner',
		name: 'Góc quán Cafe',
		icon: '☕',
		rain: 0.2,
		cafe: 0.6,
		night: 0,
		vinyl: 0.2,
		fire: 0
	},
	{
		id: 'warm_fireplace',
		name: 'Bên lò sưởi ấm',
		icon: '🔥',
		rain: 0,
		cafe: 0,
		night: 0,
		vinyl: 0.3,
		fire: 0.7
	},
	{
		id: 'deep_night',
		name: 'Tĩnh mịch đêm khuya',
		icon: '🌌',
		rain: 0.2,
		cafe: 0,
		night: 0.7,
		vinyl: 0.15,
		fire: 0
	},
	{
		id: 'silent',
		name: 'Tắt toàn bộ',
		icon: '🔇',
		rain: 0,
		cafe: 0,
		night: 0,
		vinyl: 0,
		fire: 0
	}
];

class WorkspaceState {
	// Mode & durations (Mode transitions strictly automatically upon timer completion)
	mode = $state<Mode>('focus');
	focusDuration = $state(25);
	breakDuration = $state(5);
	longBreakDuration = $state(15);
	activePreset = $state<Preset>('25/5');

	// Time tracking (seconds)
	focusTimeLeft = $state(25 * 60);
	breakTimeLeft = $state(5 * 60);
	isRunning = $state(false);
	isBellEnabled = $state(true);
	autoStartBreaks = $state(true);
	autoStartFocus = $state(false);

	// Streak & sessions
	streak = $state(0);
	totalSessionsCompleted = $state(0);

	// Modals & views
	showSettings = $state(false);
	showShortcuts = $state(false);
	isZenMode = $state(false);
	theme = $state<Theme>('peach');

	// Live track info for Zen mode
	currentPlayingTrack = $state({
		title: 'Lofi Girl - Synthwave Radio',
		artist: 'Lofi Girl',
		isPlaying: false
	});

	onSessionComplete?: () => void;
	toggleMusicPlayback?: () => void;

	private timerInterval: ReturnType<typeof setInterval> | null = null;

	// Derived values
	timeLeft = $derived(this.mode === 'focus' ? this.focusTimeLeft : this.breakTimeLeft);

	minutes = $derived(
		Math.floor(this.timeLeft / 60)
			.toString()
			.padStart(2, '0')
	);

	seconds = $derived((this.timeLeft % 60).toString().padStart(2, '0'));

	formattedTime = $derived(`${this.minutes}:${this.seconds}`);

	progressPercent = $derived.by(() => {
		const total =
			this.mode === 'focus'
				? this.focusDuration * 60
				: (this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
		if (total <= 0) return 0;
		return Math.min(100, Math.max(0, Math.round(((total - this.timeLeft) / total) * 100)));
	});

	constructor() {
		if (typeof window !== 'undefined') {
			this.loadFromLocalStorage();
		}
	}

	loadFromLocalStorage() {
		if (typeof window === 'undefined') return;
		try {
			// Timer config
			const savedTimer = localStorage.getItem('pomoduo_timer_config');
			if (savedTimer) {
				const parsed = JSON.parse(savedTimer);
				if (parsed.mode === 'focus' || parsed.mode === 'break') this.mode = parsed.mode;
				if (parsed.focusDuration) this.focusDuration = parsed.focusDuration;
				if (parsed.breakDuration) this.breakDuration = parsed.breakDuration;
				if (parsed.longBreakDuration) this.longBreakDuration = parsed.longBreakDuration;
				if (parsed.activePreset) this.activePreset = parsed.activePreset;
				if (typeof parsed.isBellEnabled === 'boolean') {
					this.isBellEnabled = parsed.isBellEnabled;
					soundEngine.sfxEnabled = this.isBellEnabled;
				}
				if (typeof parsed.autoStartBreaks === 'boolean') {
					this.autoStartBreaks = parsed.autoStartBreaks;
				}
				if (typeof parsed.autoStartFocus === 'boolean') {
					this.autoStartFocus = parsed.autoStartFocus;
				}
				if (typeof parsed.streak === 'number')
					this.streak = Math.min(4, Math.max(0, parsed.streak));
				if (typeof parsed.totalSessionsCompleted === 'number')
					this.totalSessionsCompleted = parsed.totalSessionsCompleted;

				if (typeof parsed.focusTimeLeft === 'number' && parsed.focusTimeLeft > 0) {
					this.focusTimeLeft = parsed.focusTimeLeft;
				} else {
					this.focusTimeLeft = this.focusDuration * 60;
				}

				if (typeof parsed.breakTimeLeft === 'number' && parsed.breakTimeLeft > 0) {
					this.breakTimeLeft = parsed.breakTimeLeft;
				} else {
					this.breakTimeLeft =
						(this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
				}
			}

			// Theme config
			const savedTheme = localStorage.getItem('pomoduo_theme') as Theme | null;
			if (
				savedTheme &&
				(savedTheme === 'peach' ||
					savedTheme === 'matcha' ||
					savedTheme === 'midnight' ||
					savedTheme === 'mist')
			) {
				this.theme = savedTheme;
			}
		} catch (e) {
			console.error('Lỗi đọc localStorage workspace:', e);
		}
	}

	saveToLocalStorage() {
		if (typeof window === 'undefined') return;
		try {
			const config = {
				mode: this.mode,
				focusDuration: this.focusDuration,
				breakDuration: this.breakDuration,
				longBreakDuration: this.longBreakDuration,
				activePreset: this.activePreset,
				isBellEnabled: this.isBellEnabled,
				autoStartBreaks: this.autoStartBreaks,
				autoStartFocus: this.autoStartFocus,
				streak: this.streak,
				totalSessionsCompleted: this.totalSessionsCompleted,
				focusTimeLeft: this.focusTimeLeft,
				breakTimeLeft: this.breakTimeLeft
			};
			localStorage.setItem('pomoduo_timer_config', JSON.stringify(config));
			localStorage.setItem('pomoduo_theme', this.theme);
		} catch (e) {
			console.error('Lỗi lưu localStorage workspace:', e);
		}
	}

	startTimer() {
		if (this.isRunning) return;
		soundEngine.playSessionStart();
		this.isRunning = true;

		if (
			typeof window !== 'undefined' &&
			'Notification' in window &&
			Notification.permission === 'default'
		) {
			Notification.requestPermission().catch(() => {});
		}

		this.timerInterval = setInterval(() => {
			if (this.mode === 'focus') {
				if (this.focusTimeLeft > 0) {
					this.focusTimeLeft--;
				} else {
					this.handleTimerComplete();
				}
			} else {
				if (this.breakTimeLeft > 0) {
					this.breakTimeLeft--;
				} else {
					this.handleTimerComplete();
				}
			}
		}, 1000);
	}

	pauseTimer() {
		if (!this.isRunning) return;
		soundEngine.playCeramicClick('soft');
		this.isRunning = false;
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
		this.saveToLocalStorage();
	}

	toggleStartPause() {
		if (this.isRunning) {
			this.pauseTimer();
		} else {
			this.startTimer();
		}
	}

	resetTimer() {
		soundEngine.playCeramicClick('ceramic');
		this.pauseTimer();
		if (this.mode === 'focus') {
			this.focusTimeLeft = this.focusDuration * 60;
		} else {
			this.breakTimeLeft = (this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
		}
		this.saveToLocalStorage();
	}

	selectPreset(preset: '25/5' | '50/10') {
		soundEngine.playCeramicClick('ceramic');
		this.pauseTimer();
		this.activePreset = preset;
		if (preset === '25/5') {
			this.focusDuration = 25;
			this.breakDuration = 5;
		} else if (preset === '50/10') {
			this.focusDuration = 50;
			this.breakDuration = 10;
		}
		this.focusTimeLeft = this.focusDuration * 60;
		this.breakTimeLeft = (this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
		this.saveToLocalStorage();
	}

	toggleBell() {
		soundEngine.playCeramicClick('ceramic');
		this.isBellEnabled = !this.isBellEnabled;
		soundEngine.sfxEnabled = this.isBellEnabled;
		this.saveToLocalStorage();

		if (
			this.isBellEnabled &&
			typeof window !== 'undefined' &&
			'Notification' in window &&
			Notification.permission === 'default'
		) {
			Notification.requestPermission().catch(() => {});
		}
	}

	/**
	 * Strictly automated Pomodoro cycle transition:
	 * Focus reaches 0:00 -> Automatically switches to Break.
	 * Break reaches 0:00 -> Automatically switches to Focus.
	 * Manual cheating is prevented.
	 */
	handleTimerComplete() {
		this.pauseTimer();

		if (this.mode === 'focus') {
			this.totalSessionsCompleted++;
			this.streak++;

			if (this.isBellEnabled) {
				soundEngine.playFocusComplete();
			}

			// Confetti celebration
			confetti({
				particleCount: this.streak >= 4 ? 160 : 90,
				spread: this.streak >= 4 ? 110 : 75,
				origin: { y: 0.6 },
				colors: ['#ff8966', '#fce7a2', '#c5e8ce', '#d8b4fe']
			});

			if (
				typeof window !== 'undefined' &&
				'Notification' in window &&
				Notification.permission === 'granted'
			) {
				try {
					const title =
						this.streak >= 4
							? '🏆 Pomoduo: Xuất sắc! Hoàn thành 4/4 chu kỳ!'
							: `🍅 Pomoduo: Hoàn thành phiên ${this.streak}/4!`;
					const body =
						this.streak >= 4
							? `Hãy tận hưởng giờ nghỉ dài ${this.longBreakDuration} phút nhé.`
							: `Đến giờ nghỉ ngơi ${this.breakDuration} phút rồi bạn ơi!`;
					new Notification(title, { body, icon: '/favicon.svg' });
				} catch {
					/* ignore notification error */
				}
			}

			// Automatically transition to Break mode
			this.mode = 'break';
			this.focusTimeLeft = this.focusDuration * 60;
			this.breakTimeLeft = (this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
			this.saveToLocalStorage();

			if (this.autoStartBreaks) {
				this.startTimer();
			}
		} else {
			if (this.isBellEnabled) {
				soundEngine.playBreakComplete();
			}

			if (
				typeof window !== 'undefined' &&
				'Notification' in window &&
				Notification.permission === 'granted'
			) {
				try {
					new Notification('⏰ Pomoduo: Hết giờ nghỉ giải lao!', {
						body: 'Sẵn sàng bắt đầu phiên tập trung mới thôi nào!',
						icon: '/favicon.svg'
					});
				} catch {
					/* ignore notification error */
				}
			}

			if (this.streak >= 4) {
				this.streak = 0;
			}

			// Automatically transition to Focus mode
			this.mode = 'focus';
			this.breakTimeLeft = (this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
			this.focusTimeLeft = this.focusDuration * 60;
			this.saveToLocalStorage();

			if (this.autoStartFocus) {
				this.startTimer();
			}
		}

		this.onSessionComplete?.();
	}

	toggleZen() {
		soundEngine.playCeramicClick('ceramic');
		this.isZenMode = !this.isZenMode;
	}

	toggleShortcuts() {
		soundEngine.playCeramicClick('soft');
		this.showShortcuts = !this.showShortcuts;
	}

	setTheme(newTheme: Theme) {
		soundEngine.playCeramicClick('soft');
		this.theme = newTheme;
		this.saveToLocalStorage();
	}

	setCustomDurations(f: number, b: number, lb: number) {
		this.focusDuration = Math.max(1, Math.min(180, f));
		this.breakDuration = Math.max(1, Math.min(60, b));
		this.longBreakDuration = Math.max(5, Math.min(60, lb));

		if (this.focusDuration === 25 && this.breakDuration === 5) {
			this.activePreset = '25/5';
		} else if (this.focusDuration === 50 && this.breakDuration === 10) {
			this.activePreset = '50/10';
		} else {
			this.activePreset = 'custom';
		}

		if (!this.isRunning) {
			this.focusTimeLeft = this.focusDuration * 60;
			this.breakTimeLeft = (this.streak >= 4 ? this.longBreakDuration : this.breakDuration) * 60;
		}
		this.showSettings = false;
		this.saveToLocalStorage();
	}

	destroy() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}
}

export const workspace = new WorkspaceState();
