<script lang="ts">
	import TomatoMascot from './TomatoMascot.svelte';
	import { workspace, SOUNDSCAPE_PRESETS } from '#lib/state/workspaceState.svelte';
	import { soundEngine } from '#lib/audio/soundEngine';
	import { Minimize2, Play, Pause, RotateCcw, Bell, BellOff, Music, Sliders } from 'lucide-svelte';

	interface Props {
		onApplySoundscape?: (preset: (typeof SOUNDSCAPE_PRESETS)[number]) => void;
	}

	let { onApplySoundscape }: Props = $props();

	let showSoundscapesMenu = $state(false);

	function handleSoundscapeSelect(preset: (typeof SOUNDSCAPE_PRESETS)[number]) {
		soundEngine.playCeramicClick('soft');
		onApplySoundscape?.(preset);
		showSoundscapesMenu = false;
	}
</script>

{#if workspace.isZenMode}
	<div
		class="animate-in fade-in zoom-in-95 fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#faf4ec]/95 p-6 backdrop-blur-2xl duration-200 select-none sm:p-10"
	>
		<!-- Background ambient glows for cozy depth -->
		<div
			class="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#fcdfc7]/50 blur-3xl"
		></div>
		<div
			class="pointer-events-none fixed -right-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-[#e3d5fa]/50 blur-3xl"
		></div>

		<!-- Top Bar: Exit Zen, Mode Pill & Streak -->
		<header class="z-10 flex w-full max-w-4xl items-center justify-between">
			<!-- Exit Zen button -->
			<button
				type="button"
				class="clay-tag flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-stone-700 transition-all hover:text-[#e06848]"
				onclick={() => workspace.toggleZen()}
				title="Thoát chế độ Zen (Phím Esc hoặc F)"
			>
				<Minimize2 class="h-4 w-4" />
				<span>Thoát Zen (Esc)</span>
			</button>

			<!-- Mode status & Streak -->
			<div class="flex items-center gap-3">
				<span
					class="clay-inset-pill rounded-full px-4 py-1.5 text-xs font-black tracking-wider text-[#543b31] uppercase"
				>
					{workspace.mode === 'focus' ? '🍅 Tập trung sâu' : '☕ Giờ nghỉ ngơi'}
				</span>

				<!-- Streak dots -->
				<div class="flex items-center gap-1.5">
					{#each [0, 1, 2, 3] as dotIndex (dotIndex)}
						<span
							class="h-3 w-3 rounded-full transition-all"
							class:bg-[#fa7558]={dotIndex < workspace.streak}
							class:shadow-[0_2px_6px_rgba(250,117,88,0.5)]={dotIndex < workspace.streak}
							class:bg-stone-300={dotIndex >= workspace.streak}
						></span>
					{/each}
				</div>
			</div>
		</header>

		<!-- Center Stage: Big Mascot + Huge Clock + Target & Live Music -->
		<main class="z-10 flex flex-col items-center justify-center gap-4 text-center">
			<!-- Tomato Mascot -->
			<div class="scale-110 sm:scale-125">
				<TomatoMascot
					mascotMood={workspace.mode === 'focus'
						? workspace.isRunning
							? 'focus'
							: 'paused'
						: 'break'}
					isTicking={workspace.isRunning}
					hasCrown={workspace.streak >= 4}
				/>
			</div>

			<!-- Gigantic Digital Clock -->
			<div class="my-2 select-none">
				<span
					class="font-mono text-8xl leading-none font-black tracking-tight text-[#3d2c26] drop-shadow-[0_4px_6px_rgba(255,255,255,0.9)] sm:text-[120px] md:text-[140px]"
				>
					{workspace.formattedTime}
				</span>
			</div>

			<!-- Currently playing track pill with animated soundwave bars -->
			<div
				class="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-xs font-bold text-stone-600 shadow-xs"
			>
				<Music class="h-3.5 w-3.5 text-[#8c65d6]" />
				<span class="max-w-[240px] truncate sm:max-w-xs">{workspace.currentPlayingTrack.title}</span
				>
				{#if workspace.currentPlayingTrack.isPlaying}
					<div class="flex items-end gap-0.5">
						<span class="h-2 w-0.5 animate-pulse rounded-full bg-[#8c65d6]"></span>
						<span class="animation-delay-150 h-3.5 w-0.5 animate-pulse rounded-full bg-[#8c65d6]"
						></span>
						<span class="animation-delay-300 h-2.5 w-0.5 animate-pulse rounded-full bg-[#8c65d6]"
						></span>
					</div>
				{/if}
			</div>
		</main>

		<!-- Bottom Floating Command Dock -->
		<footer class="z-10 flex flex-col items-center gap-3">
			<div
				class="clay-card-left flex items-center gap-3 rounded-3xl border border-white/90 p-2 shadow-2xl backdrop-blur-md sm:gap-4 sm:p-2.5"
			>
				<!-- Reset Button -->
				<button
					type="button"
					class="clay-btn clay-btn-yellow flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl"
					onclick={() => workspace.resetTimer()}
					title="Đặt lại thời gian (R)"
				>
					<RotateCcw class="h-5 w-5 text-[#5c4316]" strokeWidth={2.5} />
				</button>

				<!-- Play / Pause Button -->
				<button
					type="button"
					class="clay-btn clay-btn-peach flex h-14 cursor-pointer items-center justify-center gap-2.5 rounded-2xl px-8 text-base font-black text-[#4a2f24]"
					onclick={() => workspace.toggleStartPause()}
					title="Bắt đầu / Tạm dừng (Space)"
				>
					{#if workspace.isRunning}
						<Pause class="h-5 w-5 fill-current" />
						<span>Tạm dừng</span>
					{:else}
						<Play class="ml-0.5 h-5 w-5 fill-current" />
						<span>Bắt đầu</span>
					{/if}
				</button>

				<!-- Bell Mute / Unmute -->
				<button
					type="button"
					class="clay-btn clay-btn-mint flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl"
					onclick={() => workspace.toggleBell()}
					title={workspace.isBellEnabled ? 'Tắt chuông' : 'Bật chuông'}
				>
					{#if workspace.isBellEnabled}
						<Bell class="h-5 w-5 text-[#284c34]" strokeWidth={2.4} />
					{:else}
						<BellOff class="h-5 w-5 text-[#738a7c]" strokeWidth={2.4} />
					{/if}
				</button>

				<!-- Soundscapes Quick Menu Button -->
				<div class="relative">
					<button
						type="button"
						class="clay-btn clay-btn-blue flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl"
						onclick={() => (showSoundscapesMenu = !showSoundscapesMenu)}
						title="Không gian âm thanh môi trường"
					>
						<Sliders class="h-5 w-5 text-[#2d4d73]" strokeWidth={2.4} />
					</button>

					<!-- Soundscapes popover -->
					{#if showSoundscapesMenu}
						<div
							class="animate-in fade-in zoom-in-95 absolute bottom-18 left-1/2 z-30 flex -translate-x-1/2 flex-col gap-1.5 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-2xl backdrop-blur-md"
						>
							<span class="px-2 py-1 text-[11px] font-black whitespace-nowrap text-stone-500"
								>Không gian âm thanh</span
							>
							{#each SOUNDSCAPE_PRESETS as preset (preset.id)}
								<button
									type="button"
									class="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap text-stone-700 hover:bg-stone-100"
									onclick={() => handleSoundscapeSelect(preset)}
								>
									<span>{preset.icon}</span>
									<span>{preset.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Subtle Keyboard Shortcut Guide -->
			<p class="text-[11px] font-bold text-stone-400">
				[Space] Bắt đầu/Dừng • [R] Đặt lại • [Esc] Thoát Zen
			</p>
		</footer>
	</div>
{/if}
