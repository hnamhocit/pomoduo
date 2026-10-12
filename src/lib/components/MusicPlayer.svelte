<script lang="ts">
	import { onMount } from 'svelte';
	import { soundEngine } from '#lib/audio/soundEngine';
	import { TRACKS, type Track } from '#lib/audio/tracks';
	import {
		workspace,
		SOUNDSCAPE_PRESETS,
		type AmbientPreset
	} from '#lib/state/workspaceState.svelte';
	import {
		Play,
		Pause,
		SkipBack,
		SkipForward,
		Volume2,
		VolumeX,
		Shuffle,
		Sliders,
		Music,
		CloudRain,
		Coffee,
		Moon,
		Flame,
		Disc,
		Search,
		Radio,
		ListMusic,
		RadioTower,
		Tv,
		Heart,
		Loader2,
		X,
		FileAudio,
		Upload,
		Link,
		Trash2,
		Maximize2,
		Minimize2
	} from 'lucide-svelte';

	interface Props {
		onInitSoundscapeController?: (fn: (preset: AmbientPreset) => void) => void;
	}

	let { onInitSoundscapeController }: Props = $props();

	// Tracks & Playlist state
	let tracks = $state<Track[]>(TRACKS);
	let currentTrackId = $state<string>(TRACKS[0].id);
	let currentTrack = $derived(
		tracks.find((t) => t && t.id === currentTrackId) || tracks[0] || TRACKS[0]
	);

	// Playback state & Strict State Machine
	let isPlaying = $state(false);
	let isUserPaused = $state(true);
	let activeEngine = $state<'none' | 'youtube' | 'stream' | 'procedural'>('none');
	let currentLoadedYtId = $state('');
	let playSessionId = 0;
	let lastToggleTime = 0;

	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(0.85);
	let isMuted = $state(false);
	let volumePercent = $derived(isMuted ? 0 : Math.round(volume * 100));
	let isShuffle = $state(false);

	// Display mode: 'turntable' (3D Vinyl Disc) or 'video' (Clay Mini TV screen)
	let viewMode = $state<'turntable' | 'video'>('turntable');
	let isFullscreen = $state(false);

	// Search & Playlist UI state
	let showPlaylist = $state(false);
	let searchQuery = $state('');
	let isSearching = $state(false);
	let searchResults = $state<Track[]>([]);
	let savedTracks = $state<Track[]>([]);
	let selectedTab = $state<'saved' | 'presets' | 'search' | 'somafm' | 'audio'>('saved');
	let activePlaylistMode = $state<'preset' | 'my-playlist' | 'search' | 'audio' | 'stream'>('preset');
	let playlistQuickAddInput = $state('');
	let isAddingToPlaylist = $state(false);

	// Direct Audio & Uploaded Files state
	let fileInputElement: HTMLInputElement | null = null;
	let directAudioUrl = $state('');
	let directAudioTitle = $state('');
	let audioTracks = $state<Track[]>([
		{
			id: 'audio-groovesalad',
			title: 'Groove Salad (Chill Audio)',
			artist: 'SomaFM Stream',
			stationName: 'Direct MP3 Stream',
			isLive: true,
			source: 'stream',
			tag: 'mưa',
			genre: 'Ambient Downtempo',
			coverGradient: 'radial-gradient(circle, #488065 0%, #1e3d30 100%)',
			audioUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
			description: 'Luồng audio mp3 chất lượng cao phát trực tiếp 24/7.'
		},
		{
			id: 'audio-dronezone',
			title: 'Drone Zone (Không gian tĩnh lặng)',
			artist: 'SomaFM Stream',
			stationName: 'Direct MP3 Stream',
			isLive: true,
			source: 'stream',
			tag: 'đêm khuya',
			genre: 'Atmospheric Ambient',
			coverGradient: 'radial-gradient(circle, #38426d 0%, #171d36 100%)',
			audioUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
			description: 'Âm thanh không gian vô tận giúp tập trung sâu.'
		},
		{
			id: 'audio-lush',
			title: 'Lush (Mellow Vocals Audio)',
			artist: 'SomaFM Stream',
			stationName: 'Direct MP3 Stream',
			isLive: true,
			source: 'stream',
			tag: 'đêm khuya',
			genre: 'Chillout Vocals',
			coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
			audioUrl: 'https://ice1.somafm.com/lush-128-mp3',
			description: 'Giai điệu vocal êm dịu thư giãn.'
		}
	]);

	// Ambient layers state
	let rainActive = $state(true);
	let cafeActive = $state(false);
	let nightActive = $state(false);
	let fireActive = $state(false);
	let vinylActive = $state(true);

	// Ambient volume levels state
	let rainVolume = $state(0.4);
	let cafeVolume = $state(0.35);
	let nightVolume = $state(0.3);
	let fireVolume = $state(0.35);
	let vinylVolume = $state(0.2);

	// Ambient mixer drawer toggle
	let showMixer = $state(false);

	// Audio Elements & YouTube Player
	let audioElement: HTMLAudioElement | null = null;
	interface YTPlayerInstance {
		setVolume: (v: number) => void;
		playVideo: () => void;
		pauseVideo: () => void;
		stopVideo: () => void;
		loadVideoById: (id: string) => void;
		seekTo: (sec: number, allow: boolean) => void;
		getCurrentTime: () => number;
		getDuration: () => number;
		mute: () => void;
		unMute: () => void;
	}
	let ytPlayer: YTPlayerInstance | null = null;
	let ytReady = $state(false);
	let syncTimer: ReturnType<typeof setInterval> | null = null;

	// Quick search tags for study & lofi
	const QUICK_TAGS = [
		{ label: 'Lofi Girl 🎧', query: 'lofi girl beats to relax study to' },
		{ label: 'Lofi Việt Nam 🇻🇳', query: 'nhac lofi viet nam chill hoc tap' },
		{ label: 'Nhạc Học Bài 📚', query: 'nhac baroque tap trung hoc tap' },
		{ label: 'Cafe Jazz ☕', query: 'coffee shop jazz lofi chill' },
		{ label: 'Piano Ghibli 🎹', query: 'studio ghibli relaxing piano' },
		{ label: 'Synthwave 🌆', query: 'synthwave chill study' },
		{ label: 'Tiếng Mưa 🌧️', query: 'lofi rain sleep study' }
	];

	// ==================== TIME FORMATTING & STORAGE ====================

	function parseDurationToSeconds(str?: string): number {
		if (!str || str === 'LIVE' || str === 'TRỰC TIẾP' || str === 'YouTube') return 0;
		const parts = str.split(':').map(Number);
		if (parts.some((n) => isNaN(n))) return 0;
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return parts[0] || 0;
	}

	function formatTime(sec: number): string {
		if (isNaN(sec) || sec <= 0) return '0:00';
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		const s = Math.floor(sec % 60);
		if (h > 0) {
			return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
		}
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function saveToLocalStorage() {
		if (typeof window === 'undefined') return;
		try {
			const config = {
				volume,
				isMuted,
				isShuffle,
				currentTrackId,
				currentTime,
				viewMode,
				activePlaylistMode,
				rainActive,
				cafeActive,
				nightActive,
				fireActive,
				vinylActive,
				rainVolume,
				cafeVolume,
				nightVolume,
				fireVolume,
				vinylVolume
			};
			localStorage.setItem('pomoduo_music_config', JSON.stringify(config));
			localStorage.setItem('pomoduo_saved_tracks', JSON.stringify(savedTracks));
			localStorage.setItem('pomoduo_current_track', JSON.stringify(currentTrack));
			localStorage.setItem('pomoduo_current_time', String(currentTime));
		} catch (e) {
			console.error('Lỗi lưu localStorage music:', e);
		}
	}

	function loadFromLocalStorage() {
		if (typeof window === 'undefined') return;
		try {
			// 1. First restore saved & custom tracks
			const storedTracks = localStorage.getItem('pomoduo_saved_tracks');
			if (storedTracks) {
				try {
					const list = JSON.parse(storedTracks);
					if (Array.isArray(list)) {
						savedTracks = list.filter((t) => t && typeof t.id === 'string' && typeof t.title === 'string');
					}
				} catch {
					savedTracks = [];
				}
			}

			// 2. Restore currentTrack object so any YouTube video watched previously is guaranteed to exist in tracks
			const storedCurrentTrack = localStorage.getItem('pomoduo_current_track');
			if (storedCurrentTrack) {
				try {
					const trackObj = JSON.parse(storedCurrentTrack);
					if (trackObj && trackObj.id) {
						currentTrackId = trackObj.id;
					}
				} catch {
					/* ignore */
				}
			}

			// 3. Restore config
			const saved = localStorage.getItem('pomoduo_music_config');
			if (saved) {
				const parsed = JSON.parse(saved);
				if (typeof parsed.volume === 'number') volume = Math.max(0, Math.min(1, parsed.volume));
				if (typeof parsed.isMuted === 'boolean') isMuted = parsed.isMuted;
				if (typeof parsed.isShuffle === 'boolean') isShuffle = parsed.isShuffle;
				if (parsed.viewMode === 'turntable' || parsed.viewMode === 'video') {
					viewMode = parsed.viewMode;
				}
				if (parsed.activePlaylistMode) {
					activePlaylistMode = parsed.activePlaylistMode;
				}
				if (typeof parsed.currentTrackId === 'string' && parsed.currentTrackId) {
					currentTrackId = parsed.currentTrackId;
				}
				if (typeof parsed.currentTime === 'number' && parsed.currentTime > 0) {
					currentTime = parsed.currentTime;
				}
				if (typeof parsed.rainActive === 'boolean') rainActive = parsed.rainActive;
				if (typeof parsed.cafeActive === 'boolean') cafeActive = parsed.cafeActive;
				if (typeof parsed.nightActive === 'boolean') nightActive = parsed.nightActive;
				if (typeof parsed.fireActive === 'boolean') fireActive = parsed.fireActive;
				if (typeof parsed.vinylActive === 'boolean') vinylActive = parsed.vinylActive;

				if (typeof parsed.rainVolume === 'number') rainVolume = parsed.rainVolume;
				if (typeof parsed.cafeVolume === 'number') cafeVolume = parsed.cafeVolume;
				if (typeof parsed.nightVolume === 'number') nightVolume = parsed.nightVolume;
				if (typeof parsed.fireVolume === 'number') fireVolume = parsed.fireVolume;
				if (typeof parsed.vinylVolume === 'number') vinylVolume = parsed.vinylVolume;
			}

			// 4. Setup active tracks queue
			if (activePlaylistMode === 'my-playlist' && savedTracks.length > 0) {
				tracks = [...savedTracks];
			} else {
				tracks = [...TRACKS];
			}

			// Ensure currentTrackId is found in tracks
			if (!tracks.some((t) => t && t.id === currentTrackId)) {
				const foundInSaved = savedTracks.find((t) => t && t.id === currentTrackId);
				const foundInPresets = TRACKS.find((t) => t && t.id === currentTrackId);
				if (foundInSaved) {
					tracks = [foundInSaved, ...tracks];
				} else if (foundInPresets) {
					tracks = [foundInPresets, ...tracks];
				} else {
					currentTrackId = (tracks[0] && tracks[0].id) || TRACKS[0].id;
				}
			}

			const storedTime = localStorage.getItem('pomoduo_current_time');
			if (storedTime) {
				const parsedTime = Number(storedTime);
				if (!isNaN(parsedTime) && parsedTime > 0) {
					currentTime = parsedTime;
				}
			}
		} catch (e) {
			console.error('Lỗi đọc localStorage music:', e);
		}
	}

	// ==================== YOUTUBE IFRAME API ====================

	function loadYouTubeAPI(): Promise<void> {
		return new Promise((resolve) => {
			if (typeof window === 'undefined') return resolve();
			if (window.YT && window.YT.Player) return resolve();

			const existingScript = document.getElementById('youtube-iframe-api');
			if (!existingScript) {
				const tag = document.createElement('script');
				tag.id = 'youtube-iframe-api';
				tag.src = 'https://www.youtube.com/iframe_api';
				document.head.appendChild(tag);
			}

			const prev = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				if (prev) prev();
				resolve();
			};

			const interval = setInterval(() => {
				if (window.YT && window.YT.Player) {
					clearInterval(interval);
					resolve();
				}
			}, 300);
			setTimeout(() => {
				clearInterval(interval);
				resolve();
			}, 4000);
		});
	}

	function toggleVideoFullscreen() {
		soundEngine.playCeramicClick('soft');
		const container = document.getElementById('yt-video-container');
		if (!container) return;
		if (!document.fullscreenElement) {
			container
				.requestFullscreen?.()
				.then(() => {
					isFullscreen = true;
				})
				.catch(() => {});
		} else {
			document
				.exitFullscreen?.()
				.then(() => {
					isFullscreen = false;
				})
				.catch(() => {});
		}
	}

	async function initYouTubePlayer(initialVideoId?: string) {
		if (typeof window === 'undefined') return;
		if (ytPlayer) return;
		await loadYouTubeAPI();
		if (!window.YT || !window.YT.Player) return;

		const slot = document.getElementById('yt-iframe-slot');
		if (!slot) return;

		const videoIdToInit = initialVideoId || currentTrack.youtubeId || 'rFZHOHl-L8A';

		if (!ytPlayer) {
			ytPlayer = new window.YT.Player('yt-iframe-slot', {
				videoId: videoIdToInit,
				playerVars: {
					autoplay: 0,
					controls: 0,
					modestbranding: 1,
					rel: 0,
					playsinline: 1,
					enablejsapi: 1,
					iv_load_policy: 3,
					fs: 0
				},
				events: {
					onReady: (e: { target: YTPlayerInstance }) => {
						ytReady = true;
						currentLoadedYtId = videoIdToInit;
						e.target.setVolume(isMuted ? 0 : volume * 100);

						// Only play if user has explicitly asked to play
						if (currentTime > 0) {
							e.target.seekTo(currentTime, true);
						}

						// Only play if user has explicitly asked to play
						if (!isUserPaused && isPlaying && currentTrack.source === 'youtube') {
							if (currentLoadedYtId !== currentTrack.youtubeId && currentTrack.youtubeId) {
								e.target.loadVideoById(currentTrack.youtubeId);
								currentLoadedYtId = currentTrack.youtubeId;
								if (currentTime > 0) {
									e.target.seekTo(currentTime, true);
								}
							}
							e.target.playVideo();
						}
					},
					onStateChange: (e: { data: number }) => {
						// 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
						if (e.data === 1) {
							// If user pressed Pause while video was buffering, force pause!
							if (isUserPaused) {
								try {
									ytPlayer?.pauseVideo();
								} catch {
									/* ignore */
								}
								isPlaying = false;
								return;
							}
							isPlaying = true;
							updateAmbience();
						} else if (e.data === 2) {
							if (activeEngine === 'youtube') {
								isPlaying = false;
							}
						} else if (e.data === 0) {
							if (!isUserPaused) {
								nextTrack();
							}
						}
					},
					onError: () => {
						if (!isUserPaused && isPlaying) {
							soundEngine.startProceduralLofi(74);
						}
					}
				}
			});
		}
	}

	// ==================== HTML5 AUDIO ELEMENT ====================

	function initHtmlAudio() {
		if (typeof window === 'undefined') return;
		if (!audioElement) {
			audioElement = new Audio();
			audioElement.crossOrigin = 'anonymous';
			audioElement.volume = isMuted ? 0 : volume;

			audioElement.addEventListener('ended', () => {
				if (!isUserPaused) nextTrack();
			});

			audioElement.addEventListener('loadedmetadata', () => {
				if (currentTrack.source === 'stream' && !currentTrack.isLive && audioElement) {
					if (
						audioElement.duration &&
						!isNaN(audioElement.duration) &&
						isFinite(audioElement.duration)
					) {
						duration = Math.floor(audioElement.duration);
					}
				}
			});

			audioElement.addEventListener('timeupdate', () => {
				if (currentTrack.source === 'stream' && !currentTrack.isLive && audioElement) {
					currentTime = Math.floor(audioElement.currentTime);
					if (
						audioElement.duration &&
						!isNaN(audioElement.duration) &&
						isFinite(audioElement.duration)
					) {
						duration = Math.floor(audioElement.duration);
					}
				}
			});

			audioElement.addEventListener('error', () => {
				if (activeEngine === 'stream' && isPlaying && !isUserPaused) {
					soundEngine.startProceduralLofi(currentTrack.bpm || 74);
				}
			});
		}
	}

	// ==================== STRICT PLAYBACK CONTROL ====================

	async function playTrackById(id: string) {
		soundEngine.playCeramicClick('ceramic');
		let target = tracks.find((t) => t.id === id);
		if (!target) {
			target = TRACKS.find((t) => t.id === id);
			if (target) {
				tracks = [...TRACKS];
				activePlaylistMode = 'preset';
			}
		}
		if (target) {
			currentTrackId = target.id;
			saveToLocalStorage();
			await play(target);
		}
	}

	function togglePlay() {
		const now = Date.now();
		// Throttle rapid spam clicks to prevent desync
		if (now - lastToggleTime < 180) return;
		lastToggleTime = now;

		soundEngine.playCeramicClick('ceramic');
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}

	async function play(targetTrack?: Track) {
		const isSwitchingTrack = targetTrack && targetTrack.id !== currentTrackId;
		const track = targetTrack || currentTrack;
		currentTrackId = track.id;

		if (isSwitchingTrack) {
			currentTime = 0;
		}

		// Session token guarantees old delayed responses cannot hijack playback
		playSessionId++;
		const currentSession = playSessionId;

		isUserPaused = false;
		isPlaying = true;
		updateAmbience();

		initHtmlAudio();

		if (track.source === 'youtube') {
			// Stop other engines immediately
			if (audioElement) {
				audioElement.pause();
				audioElement.src = '';
			}
			soundEngine.stopProceduralLofi();
			activeEngine = 'youtube';

			if (!ytPlayer) {
				await initYouTubePlayer(track.youtubeId);
			} else if (ytReady) {
				// Abort if user paused or switched during async load
				if (currentSession !== playSessionId || isUserPaused) return;

				try {
					if (currentLoadedYtId !== track.youtubeId && track.youtubeId) {
						ytPlayer.loadVideoById(track.youtubeId);
						currentLoadedYtId = track.youtubeId;
						if (currentTime > 0) {
							ytPlayer.seekTo(currentTime, true);
						}
					} else {
						ytPlayer.playVideo();
					}
					ytPlayer.setVolume(isMuted ? 0 : volume * 100);
				} catch (e) {
					console.error('Error playing YouTube track:', e);
				}
			}
		} else if (track.source === 'stream') {
			// Stop YouTube & Procedural
			if (ytPlayer && ytReady) {
				try {
					ytPlayer.pauseVideo();
				} catch {
					/* ignore */
				}
			}
			soundEngine.stopProceduralLofi();
			activeEngine = 'stream';

			if (audioElement && track.audioUrl) {
				audioElement.src = track.audioUrl;
				audioElement.load();
				audioElement.play().catch(() => {
					if (currentSession === playSessionId && !isUserPaused) {
						soundEngine.startProceduralLofi(track.bpm || 74);
					}
				});
			}
		} else if (track.source === 'procedural') {
			// Stop YouTube & Audio Element
			if (ytPlayer && ytReady) {
				try {
					ytPlayer.pauseVideo();
				} catch {
					/* ignore */
				}
			}
			if (audioElement) {
				audioElement.pause();
				audioElement.src = '';
			}
			activeEngine = 'procedural';
			soundEngine.startProceduralLofi(track.bpm || 74);
		}

		startSyncTimer();
		saveToLocalStorage();
	}

	function pause() {
		// Immediately set user intention
		isUserPaused = true;
		isPlaying = false;
		playSessionId++;

		// Force stop all audio engines synchronously
		if (ytPlayer && ytReady) {
			try {
				ytPlayer.pauseVideo();
			} catch {
				/* ignore */
			}
		}
		if (audioElement) {
			audioElement.pause();
		}
		soundEngine.stopProceduralLofi();

		// Mute all ambient sounds
		soundEngine.setRainVolume(0);
		soundEngine.setCafeVolume(0);
		soundEngine.setNightVolume(0);
		soundEngine.setFireVolume(0);
		soundEngine.setVinylVolume(0);

		stopSyncTimer();
		saveToLocalStorage();
	}

	function nextTrack() {
		soundEngine.playCeramicClick('soft');
		currentTime = 0;

		const currentIdx = tracks.findIndex((t) => t.id === currentTrackId);
		let nextIdx: number;

		if (isShuffle && tracks.length > 1) {
			do {
				nextIdx = Math.floor(Math.random() * tracks.length);
			} while (nextIdx === currentIdx);
		} else {
			nextIdx = (currentIdx + 1) % tracks.length;
		}

		const next = tracks[nextIdx] || TRACKS[0];
		currentTrackId = next.id;
		saveToLocalStorage();

		if (isPlaying && !isUserPaused) {
			play(next);
		}
	}

	function prevTrack() {
		soundEngine.playCeramicClick('soft');
		if (currentTime > 4) {
			currentTime = 0;
			if (currentTrack.source === 'youtube' && ytPlayer && ytReady) {
				try {
					ytPlayer.seekTo(0, true);
				} catch {
					/* ignore */
				}
			} else if (audioElement) {
				audioElement.currentTime = 0;
			}
		} else {
			const currentIdx = tracks.findIndex((t) => t.id === currentTrackId);
			const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
			const prev = tracks[prevIdx] || TRACKS[0];
			currentTrackId = prev.id;
			currentTime = 0;
			saveToLocalStorage();

			if (isPlaying && !isUserPaused) {
				play(prev);
			}
		}
	}

	function handleSeek(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = Number(target.value);
		currentTime = val;

		if (currentTrack.source === 'youtube' && ytPlayer && ytReady) {
			try {
				ytPlayer.seekTo(val, true);
			} catch {
				/* ignore */
			}
		} else if (audioElement && audioElement.duration) {
			audioElement.currentTime = val;
		}
	}

	function handleVolume(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = Number(target.value);
		isMuted = volume === 0;

		const effVol = isMuted ? 0 : volume;
		if (ytPlayer && ytReady) {
			try {
				ytPlayer.setVolume(effVol * 100);
				if (isMuted) ytPlayer.mute();
				else ytPlayer.unMute();
			} catch {
				/* ignore */
			}
		}
		if (audioElement) {
			audioElement.volume = effVol;
		}
		soundEngine.setMusicVolume(effVol);
		saveToLocalStorage();
	}

	function toggleMute() {
		soundEngine.playCeramicClick('soft');
		isMuted = !isMuted;
		const effVol = isMuted ? 0 : volume;

		if (ytPlayer && ytReady) {
			try {
				if (isMuted) {
					ytPlayer.mute();
				} else {
					ytPlayer.unMute();
					ytPlayer.setVolume(effVol * 100);
				}
			} catch {
				/* ignore */
			}
		}
		if (audioElement) {
			audioElement.volume = effVol;
		}
		soundEngine.setMusicVolume(effVol);
		saveToLocalStorage();
	}

	function startSyncTimer() {
		if (syncTimer) clearInterval(syncTimer);
		syncTimer = setInterval(() => {
			if (!isPlaying || isUserPaused) return;

			if (currentTrack.source === 'youtube' && ytPlayer && ytReady) {
				try {
					const curr = Math.floor(ytPlayer.getCurrentTime() || 0);
					currentTime = curr;
					const dur = Math.floor(ytPlayer.getDuration() || 0);
					if (dur > 0) duration = dur;

					if (curr > 0 && curr % 5 === 0) {
						localStorage.setItem('pomoduo_current_time', String(curr));
					}
				} catch {
					/* ignore */
				}
			} else if (currentTrack.source === 'procedural') {
				currentTime = (currentTime + 1) % 300;
				duration = 300;
			}
		}, 1000);
	}

	function stopSyncTimer() {
		if (syncTimer) {
			clearInterval(syncTimer);
			syncTimer = null;
		}
	}

	function updateAmbience() {
		if (isUserPaused || !isPlaying) return;
		soundEngine.setRainVolume(rainActive ? rainVolume : 0);
		soundEngine.setCafeVolume(cafeActive ? cafeVolume : 0);
		soundEngine.setNightVolume(nightActive ? nightVolume : 0);
		soundEngine.setFireVolume(fireActive ? fireVolume : 0);
		soundEngine.setVinylVolume(vinylActive ? vinylVolume : 0);
	}

	function toggleTag(tag: 'mưa' | 'café' | 'đêm khuya' | 'ngẫu nhiên' | 'lửa ấm') {
		soundEngine.playCeramicClick('ceramic');
		if (tag === 'ngẫu nhiên') {
			isShuffle = !isShuffle;
			if (isShuffle) nextTrack();
			saveToLocalStorage();
			return;
		}

		if (tag === 'mưa') {
			rainActive = !rainActive;
			if (rainActive && rainVolume === 0) rainVolume = 0.45;
		} else if (tag === 'café') {
			cafeActive = !cafeActive;
			if (cafeActive && cafeVolume === 0) cafeVolume = 0.35;
		} else if (tag === 'đêm khuya') {
			nightActive = !nightActive;
			if (nightActive && nightVolume === 0) nightVolume = 0.3;
		} else if (tag === 'lửa ấm') {
			fireActive = !fireActive;
			if (fireActive && fireVolume === 0) fireVolume = 0.35;
		}

		if (isPlaying && !isUserPaused) {
			updateAmbience();
		}
		saveToLocalStorage();
	}

	// ==================== SEARCH & FAVORITES ====================

	function triggerFileUpload() {
		soundEngine.playCeramicClick('soft');
		fileInputElement?.click();
	}

	function handleAudioFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const files = Array.from(input.files);
		const newItems: Track[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const blobUrl = URL.createObjectURL(file);
			const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
			const track: Track = {
				id: `local-file-${Date.now()}-${i}`,
				title: nameWithoutExt,
				artist: 'Tệp Audio máy tính',
				stationName: 'Tệp cục bộ',
				isLive: false,
				source: 'stream',
				audioUrl: blobUrl,
				tag: 'audio',
				genre: 'Audio Cục Bộ',
				coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
				description: `Tập tin âm thanh: ${file.name}`
			};
			newItems.push(track);
		}

		audioTracks = [...newItems, ...audioTracks];
		tracks = [...newItems, ...tracks];
		selectedTab = 'audio';

		if (newItems[0]) {
			selectAndPlay(newItems[0]);
		}

		input.value = '';
	}

	function handleAddDirectAudioUrl() {
		const url = directAudioUrl.trim();
		if (!url) return;
		soundEngine.playCeramicClick('soft');

		const cleanTitle =
			directAudioTitle.trim() || url.split('/').pop()?.split('?')[0] || 'Audio Trực Tuyến';
		const newTrack: Track = {
			id: `direct-audio-${Date.now()}`,
			title: cleanTitle,
			artist: 'Audio Web / Podcast',
			stationName: 'Direct Stream',
			isLive: false,
			source: 'stream',
			audioUrl: url,
			tag: 'audio',
			genre: 'Audio Trực Tuyến',
			coverGradient: 'radial-gradient(circle, #488065 0%, #1e3d30 100%)',
			description: `Nguồn audio: ${url}`
		};

		audioTracks = [newTrack, ...audioTracks];
		tracks = [newTrack, ...tracks];
		directAudioUrl = '';
		directAudioTitle = '';
		selectAndPlay(newTrack);
	}

	function removeAudioTrack(id: string) {
		soundEngine.playCeramicClick('soft');
		audioTracks = audioTracks.filter((t) => t.id !== id);
		tracks = tracks.filter((t) => t.id !== id);
	}

	async function performSearch(queryToSearch?: string) {
		const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
		if (!q) return;

		// Check if user pasted direct audio stream or audio file URL
		if (
			q.match(/\.(mp3|wav|ogg|m4a|aac|flac)($|\?)/i) ||
			(q.startsWith('http') &&
				(q.includes('stream') || q.includes('audio') || q.includes('icecast')))
		) {
			const directTrack: Track = {
				id: `direct-audio-${Date.now()}`,
				title: q.split('/').pop()?.split('?')[0] || 'Audio Trực Tuyến',
				artist: 'Audio Web',
				stationName: 'Direct Stream',
				isLive: false,
				source: 'stream',
				audioUrl: q,
				tag: 'audio',
				genre: 'Direct Audio Stream',
				coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
				description: `Nguồn audio: ${q}`
			};
			tracks = [directTrack, ...tracks];
			audioTracks = [directTrack, ...audioTracks];
			selectedTab = 'audio';
			selectAndPlay(directTrack);
			return;
		}

		searchQuery = q;
		isSearching = true;
		selectedTab = 'search';

		try {
			const res = await fetch(`/api/search-music?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.results)) {
					interface SearchItem {
						id: string;
						title: string;
						channel?: string;
						isLive?: boolean;
						youtubeId?: string;
						thumbnail?: string;
						duration?: string;
					}
					searchResults = data.results.map((r: SearchItem) => ({
						id: `yt-${r.id}`,
						title: r.title,
						artist: r.channel || 'YouTube Artist',
						stationName: r.channel,
						isLive: Boolean(r.isLive),
						source: 'youtube' as const,
						youtubeId: r.youtubeId || r.id,
						thumbnail: r.thumbnail,
						duration: parseDurationToSeconds(r.duration),
						durationFormatted: r.duration,
						tag: 'ngẫu nhiên',
						genre: r.isLive ? 'Live YouTube Stream' : 'YouTube Chill / Lofi',
						coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
						description: `Tìm thấy trên YouTube: ${r.title}`
					}));
				}
			}
		} catch (e) {
			console.error('Lỗi tìm kiếm nhạc:', e);
		} finally {
			isSearching = false;
		}
	}

	function playPlaylistTrack(track: Track) {
		soundEngine.playCeramicClick('ceramic');
		activePlaylistMode = 'my-playlist';
		tracks = [...savedTracks];
		currentTrackId = track.id;
		saveToLocalStorage();
		play(track);
	}

	function playAllMyPlaylist() {
		if (savedTracks.length === 0) return;
		soundEngine.playCeramicClick('ceramic');
		activePlaylistMode = 'my-playlist';
		tracks = [...savedTracks];
		currentTrackId = savedTracks[0].id;
		saveToLocalStorage();
		play(savedTracks[0]);
	}

	function shuffleMyPlaylist() {
		if (savedTracks.length === 0) return;
		soundEngine.playCeramicClick('ceramic');
		activePlaylistMode = 'my-playlist';
		isShuffle = true;
		tracks = [...savedTracks];
		const randIdx = Math.floor(Math.random() * savedTracks.length);
		currentTrackId = savedTracks[randIdx].id;
		saveToLocalStorage();
		play(savedTracks[randIdx]);
	}

	function clearPlaylist() {
		if (savedTracks.length === 0) return;
		soundEngine.playCeramicClick('pop');
		savedTracks = [];
		if (activePlaylistMode === 'my-playlist') {
			tracks = [...TRACKS];
			activePlaylistMode = 'preset';
		}
		saveToLocalStorage();
	}

	async function handleAddDirectTrackToPlaylist() {
		const q = playlistQuickAddInput.trim();
		if (!q) return;

		isAddingToPlaylist = true;
		try {
			if (
				q.match(/\.(mp3|wav|ogg|m4a|aac|flac)($|\?)/i) ||
				(q.startsWith('http') &&
					(q.includes('stream') || q.includes('audio') || q.includes('icecast')))
			) {
				const directTrack: Track = {
					id: `direct-audio-${Date.now()}`,
					title: q.split('/').pop()?.split('?')[0] || 'Audio Trực Tuyến',
					artist: 'Audio Tùy Chọn',
					stationName: 'Direct Stream',
					isLive: false,
					source: 'stream',
					audioUrl: q,
					tag: 'audio',
					genre: 'Audio Playlist',
					coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
					description: `Đã thêm vào playlist: ${q}`
				};
				if (!savedTracks.some((t) => t.id === directTrack.id)) {
					savedTracks = [directTrack, ...savedTracks];
					if (activePlaylistMode === 'my-playlist') {
						tracks = [...savedTracks];
					}
					saveToLocalStorage();
				}
				playlistQuickAddInput = '';
				soundEngine.playCeramicClick('ceramic');
				return;
			}

			const res = await fetch(`/api/search-music?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data.results) && data.results.length > 0) {
					const r = data.results[0];
					const newTrack: Track = {
						id: `yt-${r.id}`,
						title: r.title,
						artist: r.channel || 'YouTube Artist',
						stationName: r.channel,
						isLive: Boolean(r.isLive),
						source: 'youtube' as const,
						youtubeId: r.youtubeId || r.id,
						thumbnail: r.thumbnail,
						duration: parseDurationToSeconds(r.duration),
						durationFormatted: r.duration,
						tag: 'ngẫu nhiên',
						genre: r.isLive ? 'Live YouTube Stream' : 'YouTube Chill / Lofi',
						coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
						description: `Thêm từ YouTube: ${r.title}`
					};

					if (
						!savedTracks.some(
							(t) => t.id === newTrack.id || (Boolean(t.youtubeId) && t.youtubeId === newTrack.youtubeId)
						)
					) {
						savedTracks = [newTrack, ...savedTracks];
						if (activePlaylistMode === 'my-playlist') {
							tracks = [...savedTracks];
						}
						saveToLocalStorage();
						soundEngine.playCeramicClick('ceramic');
					}
					playlistQuickAddInput = '';
				}
			}
		} catch (err) {
			console.error('Lỗi thêm bài vào playlist:', err);
		} finally {
			isAddingToPlaylist = false;
		}
	}

	function selectAndPlay(track: Track) {
		soundEngine.playCeramicClick('ceramic');
		activePlaylistMode = 'search';

		// Check if track is in current tracks list
		if (!tracks.some((t) => t.id === track.id)) {
			tracks = [track, ...tracks];
		}

		currentTrackId = track.id;
		saveToLocalStorage();
		play(track);
	}

	function toggleFavorite(track?: Track, e?: MouseEvent) {
		if (!track) return;
		if (e) e.stopPropagation();
		soundEngine.playCeramicClick('pop');

		const exists = savedTracks.some(
			(t) => t.id === track.id || (Boolean(t.youtubeId) && t.youtubeId === track.youtubeId)
		);
		if (exists) {
			savedTracks = savedTracks.filter(
				(t) => t.id !== track.id && (!t.youtubeId || t.youtubeId !== track.youtubeId)
			);
			if (activePlaylistMode === 'my-playlist') {
				tracks = tracks.filter(
					(t) => t.id !== track.id && (!t.youtubeId || t.youtubeId !== track.youtubeId)
				);
				if (tracks.length === 0) {
					tracks = [...TRACKS];
					activePlaylistMode = 'preset';
				}
			}
		} else {
			savedTracks = [track, ...savedTracks];
			if (activePlaylistMode === 'my-playlist') {
				if (!tracks.some((t) => t.id === track.id)) {
					tracks = [track, ...tracks];
				}
			}
		}
		saveToLocalStorage();
	}

	function isFavorited(track?: Track): boolean {
		if (!track) return false;
		return savedTracks.some(
			(t) => t.id === track.id || (Boolean(t.youtubeId) && t.youtubeId === track.youtubeId)
		);
	}

	export function applySoundscapePreset(preset: AmbientPreset) {
		soundEngine.playCeramicClick('soft');
		rainVolume = preset.rain;
		rainActive = preset.rain > 0;
		cafeVolume = preset.cafe;
		cafeActive = preset.cafe > 0;
		nightVolume = preset.night;
		nightActive = preset.night > 0;
		vinylVolume = preset.vinyl;
		vinylActive = preset.vinyl > 0;
		fireVolume = preset.fire;
		fireActive = preset.fire > 0;

		if (isPlaying && !isUserPaused) {
			soundEngine.setRainVolume(rainVolume);
			soundEngine.setCafeVolume(cafeVolume);
			soundEngine.setNightVolume(nightVolume);
			soundEngine.setVinylVolume(vinylVolume);
			soundEngine.setFireVolume(fireVolume);
		}
		saveToLocalStorage();
	}

	// ==================== LIFECYCLE ====================

	$effect(() => {
		workspace.toggleMusicPlayback = togglePlay;
		workspace.currentPlayingTrack = {
			title: currentTrack.title,
			artist: currentTrack.artist,
			isPlaying: isPlaying && !isUserPaused
		};
	});

	onMount(() => {
		onInitSoundscapeController?.(applySoundscapePreset);
		loadFromLocalStorage();
		initYouTubePlayer();

		const handleFsChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFsChange);

		return () => {
			stopSyncTimer();
			document.removeEventListener('fullscreenchange', handleFsChange);
			if (audioElement) {
				audioElement.pause();
				audioElement.src = '';
			}
			soundEngine.stopProceduralLofi();
		};
	});
</script>

<!-- Right Card: Lofi Music & Radio Player (Pastel Lavender Ceramic - Responsive Size) -->
<div
	class="clay-card-right relative flex w-full max-w-[420px] flex-col justify-between rounded-[32px] border border-white/70 p-5 select-none sm:min-h-[560px] sm:rounded-[40px] sm:p-8 md:min-h-[580px] md:max-w-[460px] lg:max-w-[480px]"
>
	<!-- Top Bar: Header, Live Badge & Playlist Search Button -->
	<div class="mb-1 flex w-full items-center justify-between">
		<!-- Title -->
		<div class="flex items-center gap-2">
			<Music class="h-5 w-5 text-[#6b5880]" strokeWidth={2.4} />
			<span class="text-xl font-black tracking-tight text-[#473b55]">góc lofi & radio</span>
		</div>

		<!-- Status Badge & Mode/Search Controls -->
		<div class="flex items-center gap-2">
			<!-- Video / Turntable Toggle Pill (Only available for YouTube tracks) -->
			{#if currentTrack.source === 'youtube'}
				<button
					type="button"
					class="flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all {viewMode ===
					'video'
						? 'bg-[#6a4ea8] text-white shadow-xs'
						: 'bg-white/80 text-[#6a4ea8] hover:bg-white'}"
					onclick={() => {
						soundEngine.playCeramicClick('soft');
						viewMode = viewMode === 'turntable' ? 'video' : 'turntable';
						saveToLocalStorage();
					}}
					title={viewMode === 'turntable' ? 'Mở màn hình video' : 'Chuyển về đĩa than'}
				>
					{#if viewMode === 'video'}
						<Disc class="h-3.5 w-3.5" />
						<span>Đĩa than</span>
					{:else}
						<Tv class="h-3.5 w-3.5" />
						<span>Xem video</span>
					{/if}
				</button>
			{/if}

			<!-- Playlist & Search Button -->
			<button
				type="button"
				class="flex h-8 items-center gap-1.5 cursor-pointer rounded-full bg-white/80 px-2.5 text-[#6a4ea8] shadow-sm transition-transform hover:scale-105 hover:bg-white"
				onclick={() => {
					soundEngine.playCeramicClick('soft');
					showPlaylist = !showPlaylist;
				}}
				title="Playlist của tôi & Chọn bài hát"
				aria-label="Playlist của tôi"
			>
				<ListMusic class="h-4 w-4" />
				<span class="text-xs font-bold">Playlist</span>
				{#if savedTracks.length > 0}
					<span class="rounded-full bg-[#8c65d6] px-1.5 text-[10px] font-black text-white">
						{savedTracks.length}
					</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Hidden/Rendered YouTube Player Container (Guarantees uninterrupted audio stream & 16:9 aspect ratio) -->
	<div
		id="yt-video-container"
		class={viewMode === 'video' && currentTrack.source === 'youtube'
			? 'group relative my-2 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner'
			: 'pointer-events-none fixed top-0 -left-[9999px] h-1 w-1 opacity-0'}
	>
		<div id="yt-iframe-slot" class="h-full w-full"></div>

		{#if viewMode === 'video' && currentTrack.source === 'youtube'}
			<!-- Custom Overlay: Click to Play/Pause, Fullscreen toggle, Clean Mini Ceramic TV Look -->
			<div
				class="absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-all {isPlaying
					? 'bg-transparent hover:bg-black/20'
					: 'bg-black/35'}"
				onclick={togglePlay}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') togglePlay();
				}}
				role="button"
				tabindex="0"
				aria-label="Màn hình video, bấm để phát hoặc dừng"
			>
				{#if !isPlaying}
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#6a4ea8] shadow-lg backdrop-blur-xs transition-transform hover:scale-110 active:scale-95"
					>
						<Play class="ml-0.5 h-6 w-6 fill-current" />
					</div>
				{/if}

				<!-- Top-right Fullscreen Button -->
				<button
					type="button"
					class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white/90 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
					onclick={(e) => {
						e.stopPropagation();
						toggleVideoFullscreen();
					}}
					title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình'}
					aria-label={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình'}
				>
					{#if isFullscreen}
						<Minimize2 class="h-4 w-4" />
					{:else}
						<Maximize2 class="h-4 w-4" />
					{/if}
				</button>
			</div>
		{/if}
	</div>

	<!-- Hidden Audio File Picker -->
	<input
		type="file"
		bind:this={fileInputElement}
		accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac"
		multiple
		class="hidden"
		onchange={handleAudioFiles}
	/>

	<!-- Turntable Vinyl Section & Song Info (Visible in Turntable mode) -->
	{#if viewMode === 'turntable' || currentTrack.source !== 'youtube'}
		<div class="my-2 flex items-center gap-4">
			<!-- 3D Grooved Vinyl Disc with Spin Animation & Tonearm -->
			<div
				class="group relative h-24 w-24 shrink-0 cursor-pointer sm:h-28 sm:w-28 md:h-32 md:w-32"
				onclick={togglePlay}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') togglePlay();
				}}
				role="button"
				tabindex="0"
				aria-label="Đĩa than lofi, bấm để phát hoặc dừng"
			>
				<!-- Outer Vinyl Edge with 3D drop shadow -->
				<div
					class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#241f2e] shadow-[0_10px_22px_rgba(35,28,48,0.38),inset_0_2px_5px_rgba(255,255,255,0.22)] transition-transform duration-300 group-hover:scale-105"
					class:animate-spin-slow={isPlaying}
					style="animation-play-state: {isPlaying ? 'running' : 'paused'};"
				>
					<!-- Vinyl Concentric Grooves (SVG rings) -->
					<svg
						class="pointer-events-none absolute inset-0 h-full w-full opacity-40"
						viewBox="0 0 100 100"
					>
						<circle
							cx="50"
							cy="50"
							r="45"
							stroke="#ffffff"
							stroke-width="0.75"
							fill="none"
							opacity="0.3"
						/>
						<circle
							cx="50"
							cy="50"
							r="39"
							stroke="#ffffff"
							stroke-width="0.5"
							fill="none"
							opacity="0.25"
						/>
						<circle
							cx="50"
							cy="50"
							r="33"
							stroke="#ffffff"
							stroke-width="0.75"
							fill="none"
							opacity="0.3"
						/>
						<circle
							cx="50"
							cy="50"
							r="27"
							stroke="#ffffff"
							stroke-width="0.5"
							fill="none"
							opacity="0.25"
						/>
						<circle
							cx="50"
							cy="50"
							r="21"
							stroke="#ffffff"
							stroke-width="0.75"
							fill="none"
							opacity="0.3"
						/>
					</svg>

					<!-- Vinyl Sheen / Radial Reflection -->
					<div
						class="pointer-events-none absolute inset-0 rounded-full opacity-25"
						style="background: conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.45) 60deg, transparent 120deg, transparent 180deg, rgba(255,255,255,0.45) 240deg, transparent 300deg);"
					></div>

					<!-- Center Label Ceramic Disc (Displays Track Thumbnail if available!) -->
					<div
						class="relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.4)] transition-colors"
						style="background: {currentTrack.coverGradient};"
					>
						{#if currentTrack.thumbnail}
							<img
								src={currentTrack.thumbnail}
								alt={currentTrack.title}
								class="h-full w-full rounded-full object-cover"
							/>
						{:else if currentTrack.isLive}
							<Radio class="h-5 w-5 text-white/90" />
						{:else}
							<span class="text-sm font-bold text-white/90">♪</span>
						{/if}
					</div>

					<!-- Center Spindle Hole -->
					<div class="absolute z-20 h-2.5 w-2.5 rounded-full bg-[#16131c] shadow-inner"></div>
				</div>

				<!-- Realistic Tonearm (Pivots onto record when playing!) -->
				<div
					class="pointer-events-none absolute -top-1 -right-1 z-30 h-16 w-9 origin-top-right transition-transform duration-500 ease-out"
					style="transform: {isPlaying ? 'rotate(20deg)' : 'rotate(-15deg)'};"
				>
					<div
						class="h-4 w-4 rounded-full border border-white bg-[#ded6e8] shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
					></div>
					<div
						class="mx-auto -mt-1 h-11 w-1.5 rounded-full bg-gradient-to-b from-[#bcb2ca] to-[#8d829e] shadow-xs"
					></div>
					<div class="mx-auto -mt-0.5 h-4 w-3 rounded-xs bg-[#473b55] shadow-xs"></div>
				</div>
			</div>

			<!-- Song Details & Equalizer -->
			<div class="min-w-0 flex-1 pr-1">
				<div class="flex items-center justify-between gap-1.5">
					<h3
						class="truncate text-base leading-tight font-extrabold tracking-tight text-[#392e47] sm:text-lg"
						title={currentTrack.title}
					>
						{currentTrack.title}
					</h3>
					<button
						type="button"
						class="shrink-0 p-1.5 cursor-pointer rounded-full transition-transform hover:bg-rose-50 active:scale-90"
						onclick={(e) => toggleFavorite(currentTrack, e)}
						title={isFavorited(currentTrack) ? 'Bỏ lưu khỏi playlist' : 'Lưu vào playlist của tôi'}
						aria-label="Lưu vào playlist"
					>
						<Heart
							class="h-4.5 w-4.5 {isFavorited(currentTrack)
								? 'fill-rose-500 text-rose-500'
								: 'text-stone-400 hover:text-rose-400'}"
						/>
					</button>
				</div>

				<div class="mt-1 flex items-center gap-1.5">
					{#if activePlaylistMode === 'my-playlist'}
						{@const pIndex = savedTracks.findIndex((t) => t.id === currentTrack.id)}
						<span
							class="inline-flex items-center gap-1 rounded bg-[#ece2fb] px-1.5 py-0.5 text-[10px] font-bold text-[#6a4ea8]"
						>
							<ListMusic class="h-3 w-3 text-[#6a4ea8]" /> Playlist của tôi{pIndex >= 0 ? ` (${pIndex + 1}/${savedTracks.length})` : ''}
						</span>
					{:else if currentTrack.source === 'youtube'}
						<span
							class="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
						>
							<span class="h-1.5 w-1.5 rounded-full bg-red-600"></span> YouTube
						</span>
					{:else if currentTrack.isLive}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
						>
							<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600"></span> Radio
						</span>
					{:else if currentTrack.source === 'stream'}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700"
						>
							<span class="h-1.5 w-1.5 rounded-full bg-violet-600"></span> Audio
						</span>
					{/if}
					<p class="truncate text-xs font-semibold text-[#806f94]">
						{currentTrack.artist}
					</p>
				</div>

				<p class="mt-0.5 truncate text-[11px] font-medium text-[#9a8aa8]">
					{currentTrack.genre}
				</p>

				<!-- Equalizer Animated Ceramic Bars -->
				<div class="mt-2.5 flex h-3.5 items-end gap-1">
					{#each [1, 2, 3, 4, 5, 6, 7] as bar, i (bar)}
						<div
							class="w-1 rounded-full bg-[#9f85c9] transition-all"
							style="height: {isPlaying
								? `${Math.sin(currentTime * 3 + i) * 7 + 10}px`
								: '3px'}; opacity: {isPlaying ? 0.9 : 0.35};"
						></div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- Video Mode Title Bar -->
		<div class="my-1 flex items-center justify-between px-1">
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<h3 class="truncate text-sm font-extrabold text-[#392e47]">{currentTrack.title}</h3>
					{#if activePlaylistMode === 'my-playlist'}
						<span class="shrink-0 rounded bg-[#ece2fb] px-1.5 py-0.5 text-[9px] font-bold text-[#6a4ea8]">
							Playlist
						</span>
					{/if}
				</div>
				<p class="truncate text-xs font-medium text-[#806f94]">{currentTrack.artist}</p>
			</div>
			<button
				type="button"
				class="shrink-0 p-1 cursor-pointer rounded-full transition-transform hover:bg-rose-50 active:scale-90"
				onclick={(e) => toggleFavorite(currentTrack, e)}
				title={isFavorited(currentTrack) ? 'Bỏ lưu khỏi playlist' : 'Lưu vào playlist của tôi'}
				aria-label="Lưu vào playlist"
			>
				<Heart
					class="h-4 w-4 {isFavorited(currentTrack)
						? 'fill-rose-500 text-rose-500'
						: 'text-stone-400 hover:text-rose-400'}"
				/>
			</button>
		</div>
	{/if}

	<!-- Seekable Progress Bar (for duration tracks) OR Live Radio Indicator -->
	<div class="my-1 flex w-full flex-col gap-1 px-0.5">
		{#if currentTrack.isLive}
			<!-- Live Station Pulse Bar -->
			<div
				class="flex w-full items-center justify-between rounded-2xl bg-[#e6dcf5] px-3 py-2 text-xs font-bold text-[#624b82]"
			>
				<span class="flex items-center gap-2">
					<RadioTower class="h-4 w-4 animate-pulse text-emerald-600" />
					{currentTrack.stationName || 'Phát trực tiếp 24/7'}
				</span>
				<span class="text-[11px] font-semibold text-stone-500">Live Stream</span>
			</div>
		{:else}
			<!-- Track Seek Slider with Dynamic Filled Progress Background -->
			{@const maxDur = duration || currentTrack.duration || 180}
			{@const progressPct =
				maxDur > 0 ? Math.min(100, Math.max(0, (currentTime / maxDur) * 100)) : 0}
			<div class="relative flex w-full items-center">
				<input
					type="range"
					min="0"
					max={maxDur}
					value={currentTime}
					oninput={handleSeek}
					class="clay-seek-slider h-2.5 w-full cursor-pointer appearance-none rounded-full shadow-inner"
					style="--progress: {progressPct}%; background: linear-gradient(to right, #ff9b7d 0%, #ff9b7d {progressPct}%, #e0d6ee {progressPct}%, #e0d6ee 100%);"
					aria-label="Tiến trình phát nhạc"
				/>
			</div>
			<div class="flex w-full items-center justify-between px-0.5 text-xs font-bold text-[#847399]">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(maxDur)}</span>
			</div>
		{/if}
	</div>

	<!-- Mood & Ambience Preset Tags (Single-line balanced ceramic pills) -->
	<div class="my-2 flex w-full items-center justify-between gap-1.5">
		<!-- Rain tag -->
		<button
			type="button"
			class="clay-tag flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full py-1.5 text-xs font-bold transition-all"
			class:clay-tag-active={rainActive}
			class:text-[#42526e]={!rainActive}
			class:text-[#2d4373]={rainActive}
			onclick={() => toggleTag('mưa')}
			title="Bật/tắt âm thanh tiếng mưa"
		>
			<CloudRain class="h-3.5 w-3.5 shrink-0 text-[#5e92d9]" />
			<span>mưa</span>
		</button>

		<!-- Cafe tag -->
		<button
			type="button"
			class="clay-tag flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full py-1.5 text-xs font-bold transition-all"
			class:clay-tag-active={cafeActive}
			class:text-[#52413b]={!cafeActive}
			class:text-[#4a2e21]={cafeActive}
			onclick={() => toggleTag('café')}
			title="Bật/tắt không gian quán cà phê"
		>
			<Coffee class="h-3.5 w-3.5 shrink-0 text-[#9c6f50]" />
			<span>café</span>
		</button>

		<!-- Midnight tag -->
		<button
			type="button"
			class="clay-tag flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full py-1.5 text-xs font-bold transition-all"
			class:clay-tag-active={nightActive}
			class:text-[#4f4369]={!nightActive}
			class:text-[#322354]={nightActive}
			onclick={() => toggleTag('đêm khuya')}
			title="Bật/tắt âm thanh dế kêu đêm hè"
		>
			<Moon class="h-3.5 w-3.5 shrink-0 text-[#e6b435]" />
			<span>đêm</span>
		</button>

		<!-- Shuffle tag -->
		<button
			type="button"
			class="clay-tag flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full py-1.5 text-xs font-bold transition-all"
			class:clay-tag-active={isShuffle}
			class:text-[#a06322]={!isShuffle}
			class:text-[#914d0a]={isShuffle}
			onclick={() => toggleTag('ngẫu nhiên')}
			title="Trộn ngẫu nhiên bài hát"
		>
			<Shuffle class="h-3.5 w-3.5 shrink-0 text-[#d97706]" />
			<span class="truncate">trộn</span>
		</button>

		<!-- Mixer open button -->
		<button
			type="button"
			class="clay-tag flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-500 transition-all hover:text-stone-800 {showMixer
				? 'bg-[#ede5fa] text-[#6a4ea8]'
				: ''}"
			onclick={() => {
				soundEngine.playCeramicClick('soft');
				showMixer = !showMixer;
			}}
			title="Mở bộ trộn âm thanh môi trường & lửa ấm"
			aria-label="Mở bộ trộn âm thanh"
		>
			<Sliders class="h-3.5 w-3.5 text-[#79629b]" />
		</button>
	</div>

	<!-- Ceramic Player Playback Controls & Volume Slider -->
	<div class="mt-2 flex w-full items-center justify-between gap-1.5 px-0.5 sm:gap-2 sm:px-1">
		<!-- Previous Track Ceramic Button (Soft Blue) -->
		<button
			type="button"
			class="clay-btn clay-btn-blue flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl sm:h-13 sm:w-13 md:h-14 md:w-14"
			onclick={prevTrack}
			title="Bài trước"
			aria-label="Bài trước"
		>
			<SkipBack class="h-4.5 w-4.5 fill-current text-[#2b4566] sm:h-5 sm:w-5" />
		</button>

		<!-- Center Play/Pause Ceramic Button (Warm Butter / Peach) -->
		<button
			type="button"
			class="clay-btn clay-btn-butter flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl sm:h-15 sm:w-15 md:h-16 md:w-16"
			onclick={togglePlay}
			title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
			aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
		>
			{#if isPlaying}
				<Pause class="h-5 w-5 fill-current text-[#4a3818] sm:h-6 sm:w-6" />
			{:else}
				<Play class="ml-0.5 h-5 w-5 fill-current text-[#4a3818] sm:h-6 sm:w-6" />
			{/if}
		</button>

		<!-- Next Track Ceramic Button (Soft Blue) -->
		<button
			type="button"
			class="clay-btn clay-btn-blue flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl sm:h-13 sm:w-13 md:h-14 md:w-14"
			onclick={nextTrack}
			title="Bài kế tiếp"
			aria-label="Bài kế tiếp"
		>
			<SkipForward class="h-4.5 w-4.5 fill-current text-[#2b4566] sm:h-5 sm:w-5" />
		</button>

		<!-- Ceramic Volume Slider Bar -->
		<div class="flex max-w-[105px] flex-1 items-center gap-1.5 pl-1 sm:max-w-[125px] sm:gap-2">
			<button
				type="button"
				class="cursor-pointer text-[#7e6d94] hover:text-[#473b55]"
				onclick={toggleMute}
				title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
				aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
			>
				{#if isMuted || volume === 0}
					<VolumeX class="h-4 w-4" />
				{:else}
					<Volume2 class="h-4 w-4" />
				{/if}
			</button>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				value={isMuted ? 0 : volume}
				oninput={handleVolume}
				class="clay-volume-slider h-2.5 w-full cursor-pointer appearance-none rounded-full shadow-inner"
				style="--vol: {volumePercent}%; background: linear-gradient(to right, #9c83bd 0%, #9c83bd {volumePercent}%, #ded6e8 {volumePercent}%, #ded6e8 100%);"
				aria-label="Âm lượng nhạc"
			/>
		</div>
	</div>

	<!-- ==================== SEARCH & PLAYLIST CENTERED MODAL ==================== -->
	{#if showPlaylist}
		<div
			class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-3 sm:p-6 backdrop-blur-xs select-none"
			onclick={(e) => {
				if (e.target === e.currentTarget) {
					soundEngine.playCeramicClick('soft');
					showPlaylist = false;
				}
			}}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					soundEngine.playCeramicClick('soft');
					showPlaylist = false;
				}
			}}
		>
			<div
				class="animate-in zoom-in-95 relative flex flex-col w-full max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-[32px] border border-white/80 bg-white/95 p-5 sm:p-7 shadow-2xl backdrop-blur-md select-text gap-3.5"
			>
				<!-- Modal Header -->
				<div class="flex items-center justify-between border-b border-stone-200/80 pb-3">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f2ebfc] text-[#8c65d6] shadow-inner"
						>
							<ListMusic class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-base sm:text-lg font-black text-[#473b55]">
								Playlist & Khám phá nhạc
							</h3>
							<p class="text-[11px] sm:text-xs font-medium text-stone-500">
								Quản lý playlist cá nhân, tìm kiếm bài hát YouTube và nghe radio trực tuyến
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="hidden sm:inline-block rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-mono text-stone-400"
						>
							Esc để đóng
						</span>
						<button
							type="button"
							class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 font-bold text-stone-500 transition hover:bg-stone-200 hover:text-stone-800"
							onclick={() => {
								soundEngine.playCeramicClick('soft');
								showPlaylist = false;
							}}
							title="Đóng modal"
							aria-label="Đóng"
						>
							<X class="h-4 w-4" />
						</button>
					</div>
				</div>

				<!-- Search Bar & Direct URL input -->
				<form
					class="relative flex w-full items-center gap-2"
					onsubmit={(e) => {
						e.preventDefault();
						performSearch();
					}}
				>
					<div class="relative flex-1">
						<Search class="absolute top-3 left-3.5 h-4 w-4 text-stone-400" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Tìm nhạc lofi, học bài, dán link YouTube (https://youtube.com/watch?v=...)..."
							class="w-full rounded-2xl border border-stone-200 bg-stone-50/80 py-2.5 pr-9 pl-10 text-xs sm:text-sm font-medium text-stone-800 placeholder-stone-400 outline-none transition focus:border-[#8c65d6] focus:bg-white focus:ring-2 focus:ring-[#8c65d6]/20"
						/>
						{#if searchQuery}
							<button
								type="button"
								class="absolute top-2.5 right-3 text-stone-400 hover:text-stone-600"
								onclick={() => {
									searchQuery = '';
									searchResults = [];
								}}
							>
								<X class="h-4 w-4" />
							</button>
						{/if}
					</div>
					<button
						type="submit"
						class="flex cursor-pointer items-center gap-1.5 rounded-2xl bg-[#8c65d6] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#7853bf] active:scale-95 disabled:opacity-50"
						disabled={isSearching}
					>
						{#if isSearching}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Đang tìm...</span>
						{:else}
							<span>Tìm</span>
						{/if}
					</button>
				</form>

				<!-- Quick Search Topic Tags -->
				<div class="flex flex-wrap items-center gap-1.5 text-xs font-bold text-stone-600">
					<span class="text-[11px] font-black text-stone-400 mr-1">Chủ đề gợi ý:</span>
					{#each QUICK_TAGS as tag (tag.label)}
						<button
							type="button"
							class="shrink-0 cursor-pointer rounded-xl bg-stone-100 px-3 py-1.5 transition-colors hover:bg-[#ece2fb] hover:text-[#6a4ea8] active:scale-95"
							onclick={() => performSearch(tag.query)}
						>
							{tag.label}
						</button>
					{/each}
				</div>

				<!-- Category Tabs -->
				<div
					class="flex flex-wrap items-center gap-1.5 border-b border-stone-200/70 pb-2 text-xs sm:text-sm font-bold"
				>
					<button
						type="button"
						class="cursor-pointer rounded-xl px-3.5 py-1.5 transition-all {selectedTab === 'saved'
							? 'bg-[#8c65d6] text-white shadow-xs'
							: 'bg-stone-100 text-stone-600 hover:bg-stone-200'}"
						onclick={() => (selectedTab = 'saved')}
					>
						Playlist của tôi 💜 ({savedTracks.length})
					</button>
					<button
						type="button"
						class="cursor-pointer rounded-xl px-3.5 py-1.5 transition-all {selectedTab === 'presets'
							? 'bg-[#8c65d6] text-white shadow-xs'
							: 'bg-stone-100 text-stone-600 hover:bg-stone-200'}"
						onclick={() => (selectedTab = 'presets')}
					>
						Gợi ý chọn lọc ✨
					</button>
					<button
						type="button"
						class="cursor-pointer rounded-xl px-3.5 py-1.5 transition-all {selectedTab === 'search'
							? 'bg-[#8c65d6] text-white shadow-xs'
							: 'bg-stone-100 text-stone-600 hover:bg-stone-200'}"
						onclick={() => (selectedTab = 'search')}
					>
						Tìm kiếm YouTube 🔍 {searchResults.length > 0 ? `(${searchResults.length})` : ''}
					</button>
					<button
						type="button"
						class="cursor-pointer rounded-xl px-3.5 py-1.5 transition-all {selectedTab === 'somafm'
							? 'bg-[#8c65d6] text-white shadow-xs'
							: 'bg-stone-100 text-stone-600 hover:bg-stone-200'}"
						onclick={() => (selectedTab = 'somafm')}
					>
						Radio 📻
					</button>
					<button
						type="button"
						class="cursor-pointer rounded-xl px-3.5 py-1.5 transition-all {selectedTab === 'audio'
							? 'bg-[#8c65d6] text-white shadow-xs'
							: 'bg-stone-100 text-stone-600 hover:bg-stone-200'}"
						onclick={() => (selectedTab = 'audio')}
					>
						File Audio 🎧 ({audioTracks.length})
					</button>
				</div>

				<!-- Scrollable Track List Container -->
				<div class="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
				{#if selectedTab === 'search'}
					<!-- Search Results Tab -->
					{#if isSearching}
						<div
							class="flex flex-col items-center justify-center py-10 text-xs font-semibold text-stone-500"
						>
							<Loader2 class="mb-2 h-6 w-6 animate-spin text-[#8c65d6]" />
							<span>Đang tìm kiếm nhạc học tập & lofi...</span>
						</div>
					{:else if searchResults.length > 0}
						<div class="flex flex-col gap-1.5">
							{#each searchResults as track (track.id)}
								{@const active = currentTrack.youtubeId === track.youtubeId}
								<div
									class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-3 transition-colors {active
										? 'border border-[#d6c5ee] bg-[#f1ebfa]'
										: 'bg-stone-50/70 hover:bg-stone-100'}"
									onclick={() => selectAndPlay(track)}
									role="button"
									tabindex="0"
									onkeydown={(e) => {
										if (e.key === 'Enter') selectAndPlay(track);
									}}
								>
									<div class="flex min-w-0 items-center gap-3">
										<img
											src={track.thumbnail ||
												`https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
											alt={track.title}
											class="h-11 w-11 shrink-0 rounded-xl object-cover shadow-xs"
										/>
										<div class="min-w-0 flex-1">
											<h4 class="truncate text-xs sm:text-sm font-bold text-stone-800">{track.title}</h4>
											<p class="truncate text-[11px] sm:text-xs font-medium text-stone-500">{track.artist}</p>
										</div>
									</div>

									<div class="flex shrink-0 items-center gap-2">
										{#if track.isLive}
											<span
												class="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
												>LIVE</span
											>
										{:else if track.durationFormatted}
											<span class="font-mono text-xs text-stone-400"
												>{track.durationFormatted}</span
											>
										{/if}
										{#if active && isPlaying}
											<span class="h-2 w-2 animate-pulse rounded-full bg-[#8c65d6]"></span>
										{/if}

										<button
											type="button"
											class="cursor-pointer p-1.5 text-stone-400 transition-colors hover:text-rose-500 active:scale-90"
											onclick={(e) => toggleFavorite(track, e)}
											title={isFavorited(track) ? 'Bỏ lưu' : 'Lưu vào bài hát yêu thích'}
										>
											<Heart
												class="h-4 w-4 {isFavorited(track)
													? 'fill-rose-500 text-rose-500'
													: 'text-stone-400 hover:text-rose-400'}"
											/>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-12 text-center text-xs sm:text-sm font-medium text-stone-400">
							Nhập từ khóa tìm kiếm hoặc bấm các chủ đề gợi ý phía trên để tìm nhạc học bài & lofi chill
						</div>
					{/if}
				{:else if selectedTab === 'saved'}
					<!-- My Playlist Tab -->
					{#if savedTracks.length > 0}
						<div class="flex flex-col gap-3">
							<!-- Playlist Action Bar: Play all, Shuffle, Clear -->
							<div
								class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-violet-100 bg-violet-50/80 px-3.5 py-2.5 text-xs sm:text-sm"
							>
								<div class="flex items-center gap-2">
									<span class="font-extrabold text-violet-900">
										{savedTracks.length} bài hát trong playlist
									</span>
									{#if activePlaylistMode === 'my-playlist'}
										<span
											class="inline-flex items-center gap-1.5 rounded-full bg-violet-200/80 px-2.5 py-0.5 text-[11px] font-bold text-violet-800"
										>
											<span class="h-2 w-2 animate-pulse rounded-full bg-violet-600"></span>
											Đang phát playlist này
										</span>
									{/if}
								</div>

								<div class="flex items-center gap-2">
									<button
										type="button"
										class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#8c65d6] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#7851c4] active:scale-95"
										onclick={playAllMyPlaylist}
										title="Phát danh sách từ đầu"
									>
										<Play class="h-3.5 w-3.5 fill-current" />
										<span>Phát tất cả</span>
									</button>
									<button
										type="button"
										class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-2xs transition hover:bg-violet-100 active:scale-95"
										onclick={shuffleMyPlaylist}
										title="Phát ngẫu nhiên trong playlist"
									>
										<Shuffle class="h-3.5 w-3.5" />
										<span>Ngẫu nhiên</span>
									</button>
									<button
										type="button"
										class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-400 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
										onclick={clearPlaylist}
										title="Xóa toàn bộ bài trong playlist"
										aria-label="Xóa playlist"
									>
										<Trash2 class="h-3.5 w-3.5" />
										<span class="hidden sm:inline">Xóa hết</span>
									</button>
								</div>
							</div>

							<!-- Quick add YouTube link / search to playlist -->
							<form
								class="flex items-center gap-2"
								onsubmit={(e) => {
									e.preventDefault();
									handleAddDirectTrackToPlaylist();
								}}
							>
								<div class="relative flex-1">
									<input
										type="text"
										bind:value={playlistQuickAddInput}
										placeholder="+ Dán link YouTube hoặc tên bài hát để thêm ngay vào playlist..."
										class="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-3 text-xs sm:text-sm font-medium text-stone-700 outline-none transition focus:border-[#8c65d6] focus:bg-white"
									/>
								</div>
								<button
									type="submit"
									class="flex cursor-pointer items-center gap-1 rounded-xl bg-stone-800 px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-stone-700 active:scale-95 disabled:opacity-40"
									disabled={!playlistQuickAddInput.trim() || isAddingToPlaylist}
								>
									{#if isAddingToPlaylist}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<span>Thêm vào playlist</span>
									{/if}
								</button>
							</form>

							<!-- Track List -->
							<div class="flex flex-col gap-1.5">
								{#each savedTracks as track, index (track.id)}
									{@const active = currentTrack.id === track.id}
									<div
										class="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-3 transition-colors {active
											? 'border border-[#d6c5ee] bg-[#f1ebfa]'
											: 'bg-stone-50/70 hover:bg-stone-100'}"
										onclick={() => playPlaylistTrack(track)}
										role="button"
										tabindex="0"
										onkeydown={(e) => {
											if (e.key === 'Enter') playPlaylistTrack(track);
										}}
									>
										<div class="flex min-w-0 items-center gap-3">
											<span
												class="w-5 text-center font-mono text-xs font-bold text-stone-400"
											>
												{index + 1}
											</span>
											{#if track.thumbnail}
												<img
													src={track.thumbnail}
													alt={track.title}
													class="h-11 w-11 shrink-0 rounded-xl object-cover shadow-xs"
												/>
											{:else}
												<div
													class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
													style="background: {track.coverGradient};"
												>
													♪
												</div>
											{/if}
											<div class="min-w-0 flex-1">
												<h4
													class="flex items-center gap-2 truncate text-xs sm:text-sm font-bold text-stone-800"
												>
													<span class="truncate">{track.title}</span>
													{#if active && isPlaying}
														<span
															class="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#8c65d6]"
														></span>
													{/if}
												</h4>
												<p class="truncate text-[11px] sm:text-xs font-medium text-stone-500">
													{track.artist}
												</p>
											</div>
										</div>

										<div class="flex shrink-0 items-center gap-2">
											{#if track.durationFormatted}
												<span class="font-mono text-xs text-stone-400">
													{track.durationFormatted}
												</span>
											{/if}
											<button
												type="button"
												class="cursor-pointer p-1.5 text-stone-400 transition-colors hover:text-rose-500 active:scale-90"
												onclick={(e) => toggleFavorite(track, e)}
												title="Xóa khỏi playlist của tôi"
												aria-label="Xóa khỏi playlist"
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<!-- Empty State -->
						<div class="flex flex-col items-center justify-center px-4 py-8 text-center">
							<div
								class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-[#8c65d6] shadow-inner"
							>
								<Heart class="h-6 w-6 fill-violet-300 text-[#8c65d6]" />
							</div>
							<h4 class="mb-1 text-sm font-extrabold text-stone-800">
								Playlist của bạn đang trống
							</h4>
							<p class="mb-4 max-w-[280px] text-xs text-stone-500">
								Bấm icon trái tim <span class="font-bold text-rose-500">❤️</span> ở bài hát đang phát hoặc
								chọn bài bạn thích bên dưới để thêm vào playlist!
							</p>
							<div class="flex items-center gap-2">
								<button
									type="button"
									class="cursor-pointer rounded-xl bg-[#8c65d6] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#7851c4] active:scale-95"
									onclick={() => (selectedTab = 'presets')}
								>
									✨ Chọn bài gợi ý
								</button>
								<button
									type="button"
									class="cursor-pointer rounded-xl bg-stone-100 px-3.5 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-stone-200 active:scale-95"
									onclick={() => (selectedTab = 'search')}
								>
									🔍 Tìm kiếm bài hát
								</button>
							</div>
						</div>
					{/if}
				{:else if selectedTab === 'somafm'}
					<!-- SomaFM Streams Tab -->
					<div class="flex flex-col gap-1.5">
						{#each TRACKS.filter((t) => t.source === 'stream') as track (track.id)}
							{@const active = currentTrack.id === track.id}
							<div
								class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-3 text-left transition-colors {active
									? 'border border-[#d6c5ee] bg-[#f1ebfa]'
									: 'bg-stone-50/60 hover:bg-stone-100'}"
								onclick={() => playTrackById(track.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter') playTrackById(track.id);
								}}
							>
								<div class="flex min-w-0 items-center gap-3">
									<div
										class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
										style="background: {track.coverGradient};"
									>
										<Radio class="h-5 w-5" />
									</div>
									<div class="min-w-0 flex-1">
										<h4 class="truncate text-xs sm:text-sm font-bold text-stone-800">{track.title}</h4>
										<p class="truncate text-[11px] sm:text-xs font-medium text-stone-500">{track.artist}</p>
									</div>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<span
										class="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
										>RADIO</span
									>
									{#if active && isPlaying}
										<span class="h-2 w-2 animate-pulse rounded-full bg-[#8c65d6]"></span>
									{/if}
									<button
										type="button"
										class="cursor-pointer p-1.5 transition-colors active:scale-90"
										onclick={(e) => toggleFavorite(track, e)}
										title={isFavorited(track) ? 'Bỏ lưu khỏi playlist' : 'Lưu vào playlist của tôi'}
										aria-label="Lưu vào playlist"
									>
										<Heart
											class="h-4 w-4 {isFavorited(track)
												? 'fill-rose-500 text-rose-500'
												: 'text-stone-400 hover:text-rose-400'}"
										/>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else if selectedTab === 'audio'}
					<!-- Local Audio Files & Direct URL Stream Tab -->
					<div class="flex flex-col gap-3">
						<!-- Action Box: Upload Local Files & Add Stream URL -->
						<div
							class="flex flex-col gap-2 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3"
						>
							<div class="flex items-center justify-between gap-2">
								<span class="text-xs font-bold text-stone-700">Nghe nhạc từ máy tính:</span>
								<button
									type="button"
									class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#8c65d6] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#7851c4] active:scale-95"
									onclick={triggerFileUpload}
								>
									<Upload class="h-3.5 w-3.5" />
									<span>Chọn file nhạc (.mp3, .wav, ...)</span>
								</button>
							</div>

							<!-- Or Direct URL input -->
							<div class="mt-1 border-t border-stone-200/60 pt-2">
								<span class="text-[11px] font-semibold text-stone-500"
									>Hoặc phát từ link audio / direct stream URL:</span
								>
								<div class="mt-1.5 flex gap-1.5">
									<div class="relative flex-1">
										<Link
											class="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
										/>
										<input
											type="url"
											bind:value={directAudioUrl}
											placeholder="https://.../music.mp3"
											class="w-full rounded-xl border border-stone-200 bg-white py-1.5 pr-2 pl-8 text-xs text-stone-700 transition outline-none focus:border-[#8c65d6]"
											onkeydown={(e) => {
												if (e.key === 'Enter') handleAddDirectAudioUrl();
											}}
										/>
									</div>
									<button
										type="button"
										class="cursor-pointer rounded-xl bg-stone-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-stone-700 active:scale-95 disabled:opacity-40"
										onclick={handleAddDirectAudioUrl}
										disabled={!directAudioUrl.trim()}
									>
										Phát
									</button>
								</div>
							</div>
						</div>

						<!-- Uploaded & Added Audio Track List -->
						{#if audioTracks.length > 0}
							<div class="flex flex-col gap-1.5">
								<div
									class="flex items-center justify-between px-1 text-xs font-semibold text-stone-500"
								>
									<span>Danh sách audio ({audioTracks.length}):</span>
								</div>
								{#each audioTracks as track (track.id)}
									{@const active = currentTrack.id === track.id}
									<div
										class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-3 text-left transition-colors {active
											? 'border border-[#d6c5ee] bg-[#f1ebfa]'
											: 'bg-stone-50/60 hover:bg-stone-100'}"
										onclick={() => selectAndPlay(track)}
										role="button"
										tabindex="0"
										onkeydown={(e) => {
											if (e.key === 'Enter') selectAndPlay(track);
										}}
									>
										<div class="flex min-w-0 items-center gap-3">
											<div
												class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
												style="background: {track.coverGradient};"
											>
												<FileAudio class="h-5 w-5" />
											</div>
											<div class="min-w-0 flex-1">
												<h4 class="truncate text-xs sm:text-sm font-bold text-stone-800">{track.title}</h4>
												<p class="truncate text-[11px] sm:text-xs text-stone-500">{track.artist}</p>
											</div>
										</div>
										<div class="flex shrink-0 items-center gap-2">
											<span
												class="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700"
											>
												AUDIO
											</span>
											{#if active && isPlaying}
												<span class="h-2 w-2 animate-pulse rounded-full bg-[#8c65d6]"></span>
											{/if}
											<button
												type="button"
												class="cursor-pointer p-1.5 transition-colors active:scale-90"
												onclick={(e) => toggleFavorite(track, e)}
												title={isFavorited(track) ? 'Bỏ lưu khỏi playlist' : 'Lưu vào playlist của tôi'}
												aria-label="Lưu vào playlist"
											>
												<Heart
													class="h-4 w-4 {isFavorited(track)
														? 'fill-rose-500 text-rose-500'
														: 'text-stone-400 hover:text-rose-400'}"
												/>
											</button>
											<button
												type="button"
												class="cursor-pointer p-1.5 text-stone-400 hover:text-rose-500"
												onclick={(e) => {
													e.stopPropagation();
													removeAudioTrack(track.id);
												}}
												title="Xóa khỏi danh sách"
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-8 text-center text-xs sm:text-sm font-medium text-stone-400">
								Chưa có file audio nào. Bấm <b>"Chọn file nhạc"</b> hoặc nhập link audio phía trên để
								nghe ngay!
							</div>
						{/if}
					</div>
				{:else}
					<!-- Presets Tab (Curated YouTube Study & Lofi Streams) -->
					<div class="flex flex-col gap-1.5">
						{#each TRACKS as track (track.id)}
							{@const active = currentTrack.id === track.id}
							<div
								class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-3 text-left transition-colors {active
									? 'border border-[#d6c5ee] bg-[#f1ebfa]'
									: 'bg-stone-50/60 hover:bg-stone-100'}"
								onclick={() => playTrackById(track.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter') playTrackById(track.id);
								}}
							>
								<div class="flex min-w-0 items-center gap-3">
									{#if track.thumbnail}
										<img
											src={track.thumbnail}
											alt={track.title}
											class="h-11 w-11 shrink-0 rounded-xl object-cover shadow-xs"
										/>
									{:else}
										<div
											class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
											style="background: {track.coverGradient};"
										>
											{#if track.isLive}
												<Radio class="h-4 w-4" />
											{:else}
												♪
											{/if}
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<h4 class="truncate text-xs sm:text-sm font-bold text-stone-800">{track.title}</h4>
										<p class="truncate text-[11px] sm:text-xs font-medium text-stone-500">{track.artist}</p>
									</div>
								</div>

								<div class="flex shrink-0 items-center gap-2">
									{#if track.source === 'youtube'}
										<span
											class="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
											>YT</span
										>
									{/if}
									{#if track.isLive}
										<span
											class="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600"
											>LIVE</span
										>
									{:else if track.durationFormatted}
										<span class="font-mono text-xs text-stone-400"
											>{track.durationFormatted}</span
										>
									{/if}
									{#if active && isPlaying}
										<span class="h-2 w-2 animate-pulse rounded-full bg-[#8c65d6]"></span>
									{/if}
									<button
										type="button"
										class="cursor-pointer p-1.5 transition-colors active:scale-90"
										onclick={(e) => toggleFavorite(track, e)}
										title={isFavorited(track) ? 'Bỏ lưu khỏi playlist' : 'Lưu vào playlist của tôi'}
										aria-label="Lưu vào playlist"
									>
										<Heart
											class="h-4 w-4 {isFavorited(track)
												? 'fill-rose-500 text-rose-500'
												: 'text-stone-400 hover:text-rose-400'}"
										/>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
	{/if}

	<!-- Ambient Sound Mixer Drawer -->
	{#if showMixer}
		<div
			class="animate-in fade-in zoom-in-95 absolute inset-x-5 top-14 z-40 flex flex-col gap-3.5 rounded-3xl border border-stone-200 bg-white/95 p-6 shadow-2xl backdrop-blur-md duration-150"
		>
			<div class="flex items-center justify-between border-b border-stone-200 pb-1">
				<div class="flex items-center gap-2 text-base font-extrabold text-[#473b55]">
					<Sliders class="h-4 w-4 text-[#8c65d6]" />
					<span>Bộ trộn âm thanh môi trường</span>
				</div>
				<button
					type="button"
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-stone-100 font-bold text-stone-500 hover:bg-stone-200"
					onclick={() => (showMixer = false)}
				>
					✕
				</button>
			</div>

			<!-- Quick 1-Click Soundscape Presets -->
			<div class="flex flex-col gap-1.5 rounded-2xl bg-stone-100/80 p-2.5">
				<span class="text-[11px] font-black text-stone-500">Không gian âm thanh 1-chạm:</span>
				<div class="flex flex-wrap gap-1.5">
					{#each SOUNDSCAPE_PRESETS as preset (preset.id)}
						<button
							type="button"
							class="cursor-pointer rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-stone-700 shadow-2xs transition-all hover:bg-[#ede5fa] hover:text-[#6a4ea8]"
							onclick={() => applySoundscapePreset(preset)}
						>
							<span>{preset.icon}</span>
							<span class="ml-1">{preset.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Rain Volume -->
			<div class="flex items-center justify-between text-xs font-bold text-stone-700">
				<span class="flex items-center gap-2"
					><CloudRain class="h-4 w-4 text-blue-500" /> Tiếng mưa rơi:</span
				>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={rainActive ? rainVolume : 0}
					oninput={(e) => {
						const val = Number((e.target as HTMLInputElement).value);
						rainVolume = val;
						rainActive = val > 0;
						if (isPlaying && !isUserPaused) soundEngine.setRainVolume(val);
						saveToLocalStorage();
					}}
					class="w-28 accent-[#8c65d6]"
				/>
			</div>

			<!-- Cafe Volume -->
			<div class="flex items-center justify-between text-xs font-bold text-stone-700">
				<span class="flex items-center gap-2"
					><Coffee class="h-4 w-4 text-amber-700" /> Quán cà phê:</span
				>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={cafeActive ? cafeVolume : 0}
					oninput={(e) => {
						const val = Number((e.target as HTMLInputElement).value);
						cafeVolume = val;
						cafeActive = val > 0;
						if (isPlaying && !isUserPaused) soundEngine.setCafeVolume(val);
						saveToLocalStorage();
					}}
					class="w-28 accent-[#8c65d6]"
				/>
			</div>

			<!-- Night Volume -->
			<div class="flex items-center justify-between text-xs font-bold text-stone-700">
				<span class="flex items-center gap-2"
					><Moon class="h-4 w-4 text-indigo-500" /> Đêm khuya:</span
				>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={nightActive ? nightVolume : 0}
					oninput={(e) => {
						const val = Number((e.target as HTMLInputElement).value);
						nightVolume = val;
						nightActive = val > 0;
						if (isPlaying && !isUserPaused) soundEngine.setNightVolume(val);
						saveToLocalStorage();
					}}
					class="w-28 accent-[#8c65d6]"
				/>
			</div>

			<!-- Vinyl Crackle Volume -->
			<div class="flex items-center justify-between text-xs font-bold text-stone-700">
				<span class="flex items-center gap-2"
					><Disc class="h-4 w-4 text-purple-700" /> Tiếng đĩa than:</span
				>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={vinylActive ? vinylVolume : 0}
					oninput={(e) => {
						const val = Number((e.target as HTMLInputElement).value);
						vinylVolume = val;
						vinylActive = val > 0;
						if (isPlaying && !isUserPaused) soundEngine.setVinylVolume(val);
						saveToLocalStorage();
					}}
					class="w-28 accent-[#8c65d6]"
				/>
			</div>

			<!-- Fire Volume -->
			<div class="flex items-center justify-between text-xs font-bold text-stone-700">
				<span class="flex items-center gap-2"
					><Flame class="h-4 w-4 text-orange-500" /> Lửa sưởi ấm:</span
				>
				<input
					type="range"
					min="0"
					max="1"
					step="0.05"
					value={fireActive ? fireVolume : 0}
					oninput={(e) => {
						const val = Number((e.target as HTMLInputElement).value);
						fireVolume = val;
						fireActive = val > 0;
						if (isPlaying && !isUserPaused) soundEngine.setFireVolume(val);
						saveToLocalStorage();
					}}
					class="w-28 accent-[#8c65d6]"
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes spinSlow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin-slow {
		animation: spinSlow 8s linear infinite;
	}

	/* Clay sliders */
	.clay-seek-slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		background: #ff9b7d;
		box-shadow:
			0 2px 4px rgba(255, 120, 95, 0.4),
			inset 1px 1px 2px rgba(255, 255, 255, 0.8);
		cursor: pointer;
	}

	.clay-seek-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border: none;
		border-radius: 9999px;
		background: #ff9b7d;
		box-shadow:
			0 2px 4px rgba(255, 120, 95, 0.4),
			inset 1px 1px 2px rgba(255, 255, 255, 0.8);
		cursor: pointer;
	}

	.clay-volume-slider::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 9999px;
		background: #fdf5e6;
		box-shadow:
			0 2px 5px rgba(180, 150, 130, 0.35),
			inset 1px 1px 2px rgba(255, 255, 255, 0.9);
		cursor: pointer;
	}

	.clay-volume-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 9999px;
		background: #fdf5e6;
		box-shadow:
			0 2px 5px rgba(180, 150, 130, 0.35),
			inset 1px 1px 2px rgba(255, 255, 255, 0.9);
		cursor: pointer;
	}
</style>
