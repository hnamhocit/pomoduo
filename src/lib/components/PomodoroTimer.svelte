<script lang="ts">
	import TomatoMascot from './TomatoMascot.svelte';
	import { workspace } from '#lib/state/workspaceState.svelte';
	import { soundEngine } from '#lib/audio/soundEngine';
	import {
		RotateCcw,
		Play,
		Pause,
		Bell,
		BellOff,
		Settings2,
		Check,
		Clock,
		Sparkles,
		Trophy
	} from 'lucide-svelte';

	interface Props {
		onSessionComplete?: () => void;
	}

	let { onSessionComplete }: Props = $props();

	$effect(() => {
		workspace.onSessionComplete = onSessionComplete;
	});

	// Temporary input values for settings modal
	let tempFocus = $state(25);
	let tempBreak = $state(5);
	let tempLongBreak = $state(15);
	let tempAutoStartBreaks = $state(true);
	let tempAutoStartFocus = $state(false);

	function openSettings() {
		soundEngine.playCeramicClick('soft');
		tempFocus = workspace.focusDuration;
		tempBreak = workspace.breakDuration;
		tempLongBreak = workspace.longBreakDuration;
		tempAutoStartBreaks = workspace.autoStartBreaks;
		tempAutoStartFocus = workspace.autoStartFocus;
		workspace.showSettings = true;
	}

	function applyCustomTime(f: number, b: number) {
		tempFocus = f;
		tempBreak = b;
	}

	function saveSettings() {
		soundEngine.playCeramicClick('ceramic');
		workspace.autoStartBreaks = tempAutoStartBreaks;
		workspace.autoStartFocus = tempAutoStartFocus;
		workspace.setCustomDurations(tempFocus, tempBreak, tempLongBreak);
	}
</script>

<!-- Pomodoro Card Container (Soft Clay Ceramic - Responsive Size) -->
<div
	class="clay-card-left relative flex w-full max-w-[420px] flex-col items-center justify-between rounded-[32px] border border-white/70 p-5 select-none sm:min-h-[560px] sm:rounded-[40px] sm:p-8 md:min-h-[580px] md:max-w-[460px] lg:max-w-[480px]"
>
	<!-- Top Bar: Logo & Automatic Phase Status Indicator -->
	<div class="mb-1 flex w-full items-center justify-between">
		<!-- Title -->
		<button
			type="button"
			class="group flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-left sm:gap-2"
			onclick={() => soundEngine.playCeramicClick('poke')}
		>
			<span
				class="text-2xl drop-shadow-[0_2px_4px_rgba(230,80,60,0.3)] filter transition-transform group-hover:scale-110 sm:text-3xl"
				>🍅</span
			>
			<span class="text-xl font-black tracking-tight text-[#3d2c26] sm:text-2xl"
				>đồng hồ pomodoro</span
			>
		</button>

		<!-- Automatic Mode Status Pill (Controlled strictly by timer cycle, no manual cheat button) -->
		<div
			class="clay-inset-pill flex items-center rounded-full px-3 py-1 text-xs font-black tracking-wide sm:px-4 sm:py-1.5"
		>
			{#if workspace.mode === 'focus'}
				<span class="flex items-center gap-1.5 text-[#e06848]">
					<span class="h-2 w-2 animate-pulse rounded-full bg-[#fa7558]"></span>
					Focus
				</span>
			{:else}
				<span class="flex items-center gap-1.5 text-emerald-600">
					<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
					Break
				</span>
			{/if}
		</div>
	</div>

	<!-- Quick Preset Selector (25/5, 50/10, Custom) -->
	<div class="my-1 flex w-full items-center justify-center gap-1.5 sm:gap-2">
		<button
			type="button"
			class="clay-tag flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all sm:px-3.5 sm:py-1.5"
			class:clay-tag-active={workspace.activePreset === '25/5'}
			class:text-[#e06848]={workspace.activePreset === '25/5'}
			class:text-stone-500={workspace.activePreset !== '25/5'}
			onclick={() => workspace.selectPreset('25/5')}
			title="Chu kỳ chuẩn 25 phút tập trung, 5 phút nghỉ"
		>
			<span>25 / 5 min</span>
		</button>

		<button
			type="button"
			class="clay-tag flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all sm:px-3.5 sm:py-1.5"
			class:clay-tag-active={workspace.activePreset === '50/10'}
			class:text-[#e06848]={workspace.activePreset === '50/10'}
			class:text-stone-500={workspace.activePreset !== '50/10'}
			onclick={() => workspace.selectPreset('50/10')}
			title="Chu kỳ tập trung sâu 50 phút, 10 phút nghỉ"
		>
			<Sparkles class="h-3 w-3 text-amber-500" />
			<span>50 / 10 min</span>
		</button>

		<button
			type="button"
			class="clay-tag flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all sm:px-3.5 sm:py-1.5"
			class:clay-tag-active={workspace.activePreset === 'custom'}
			class:text-[#e06848]={workspace.activePreset === 'custom'}
			class:text-stone-500={workspace.activePreset !== 'custom'}
			onclick={openSettings}
			title="Tùy chỉnh thời gian theo ý muốn"
		>
			<Settings2 class="h-3 w-3 text-stone-500" />
			<span
				>{workspace.activePreset === 'custom'
					? `${workspace.focusDuration}/${workspace.breakDuration}`
					: 'Tùy chỉnh'}</span
			>
		</button>
	</div>

	<!-- Center: Plump Tomato Mascot with Golden Crown on 4-streak -->
	<div class="my-0.5 flex items-center justify-center sm:my-1">
		<TomatoMascot
			mascotMood={workspace.mode === 'focus' ? (workspace.isRunning ? 'focus' : 'paused') : 'break'}
			isTicking={workspace.isRunning}
			hasCrown={workspace.streak >= 4}
		/>
	</div>

	<!-- Digital Clock Display (Large Bold Rounded Clickable) -->
	<button
		type="button"
		class="group my-0.5 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 select-none sm:my-1"
		onclick={openSettings}
		title="Bấm để chỉnh lại thời gian"
	>
		<span
			class="timer-display font-mono text-6xl leading-none font-black tracking-tight text-[#3d2c26] transition-transform group-hover:scale-105 sm:text-[80px] md:text-[90px]"
		>
			{workspace.formattedTime}
		</span>
	</button>

	<!-- Session Streak Dots (Streak is 4 then resets!) -->
	<div class="my-1 flex flex-col items-center gap-1 sm:my-2 sm:gap-1.5">
		<div class="flex items-center gap-3 sm:gap-3.5">
			{#each [0, 1, 2, 3] as dotIndex (dotIndex)}
				<button
					type="button"
					class="streak-dot h-4.5 w-4.5 cursor-pointer rounded-full transition-all duration-300 sm:h-5 sm:w-5"
					class:streak-dot-active={dotIndex < workspace.streak}
					class:streak-dot-inactive={dotIndex >= workspace.streak}
					class:scale-110={dotIndex === workspace.streak && workspace.isRunning}
					onclick={() => {
						soundEngine.playCeramicClick('soft');
						workspace.streak = dotIndex + 1 === workspace.streak ? dotIndex : dotIndex + 1;
						workspace.saveToLocalStorage();
					}}
					title={`Streak chu kỳ ${dotIndex + 1}/4 (Đủ 4 chu kỳ sẽ tự động reset)`}
					aria-label={`Streak chu kỳ ${dotIndex + 1}/4`}
				></button>
			{/each}
		</div>

		<!-- Subtle Streak Badge / Counter -->
		<div class="flex items-center gap-1.5 text-[11px] font-bold text-stone-500">
			{#if workspace.streak >= 4}
				<span class="flex animate-pulse items-center gap-1 font-black text-amber-600">
					<Trophy class="h-3 w-3" /> Hoàn thành 4/4! Nghỉ dài {workspace.longBreakDuration}m 👑
				</span>
			{:else}
				<span>Chu kỳ {workspace.streak}/4</span>
				<span class="text-stone-300">•</span>
				<span>Tổng {workspace.totalSessionsCompleted} phiên hoàn tất</span>
			{/if}
		</div>
	</div>

	<!-- Ceramic Action Buttons (Reset, Start/Pause, Bell) -->
	<div class="mt-2 flex w-full items-center justify-between gap-2.5 px-0.5 sm:gap-4 sm:px-1">
		<!-- Left: Reset Ceramic Button (Yellow) -->
		<button
			type="button"
			class="clay-btn clay-btn-yellow flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl sm:h-16 sm:w-16"
			onclick={() => workspace.resetTimer()}
			title="Đặt lại thời gian (Phím tắt: R)"
			aria-label="Đặt lại thời gian"
		>
			<RotateCcw class="h-5 w-5 text-[#5c4316] sm:h-6 sm:w-6" strokeWidth={2.6} />
		</button>

		<!-- Center: Start/Pause Ceramic Button (Peach Coral Pill) -->
		<button
			type="button"
			class="clay-btn clay-btn-peach flex h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-base font-extrabold sm:h-16 sm:gap-3 sm:px-8 sm:text-lg"
			onclick={() => workspace.toggleStartPause()}
			title={workspace.isRunning ? 'Tạm dừng (Phím Space)' : 'Bắt đầu (Phím Space)'}
		>
			{#if workspace.isRunning}
				<Pause class="h-5 w-5 fill-current text-[#4a2f24] sm:h-6 sm:w-6" />
				<span class="tracking-wide text-[#4a2f24]">Tạm dừng</span>
			{:else}
				<Play class="ml-0.5 h-5 w-5 fill-current text-[#4a2f24] sm:h-6 sm:w-6" />
				<span class="tracking-wide text-[#4a2f24]">Bắt đầu</span>
			{/if}
		</button>

		<!-- Right: Sound / Bell Ceramic Button (Mint Green) -->
		<button
			type="button"
			class="clay-btn clay-btn-mint relative flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl sm:h-16 sm:w-16"
			onclick={() => workspace.toggleBell()}
			title={workspace.isBellEnabled ? 'Tắt chuông báo' : 'Bật chuông báo'}
			aria-label={workspace.isBellEnabled ? 'Tắt chuông báo' : 'Bật chuông báo'}
		>
			{#if workspace.isBellEnabled}
				<Bell class="h-5 w-5 fill-[#284c34]/20 text-[#284c34] sm:h-6 sm:w-6" strokeWidth={2.4} />
			{:else}
				<BellOff class="h-5 w-5 text-[#738a7c] sm:h-6 sm:w-6" strokeWidth={2.4} />
			{/if}
		</button>
	</div>

	<!-- Custom Settings Modal / Drawer (Clay Popover) -->
	{#if workspace.showSettings}
		<div
			class="animate-in fade-in zoom-in-95 absolute inset-x-5 top-14 z-30 flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white/95 p-6 shadow-2xl backdrop-blur-md duration-150"
		>
			<div class="flex items-center justify-between border-b border-stone-200 pb-1">
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-[#e06848]" />
					<span class="text-base font-extrabold text-[#3d2c26]">Tùy chỉnh Pomodoro</span>
				</div>
				<button
					type="button"
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-stone-100 font-bold text-stone-500 hover:bg-stone-200"
					onclick={() => (workspace.showSettings = false)}
				>
					✕
				</button>
			</div>

			<!-- Quick Preset Buttons inside modal -->
			<div class="flex items-center gap-2 text-xs font-bold">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-stone-100 px-2.5 py-1 text-stone-700 hover:bg-stone-200"
					onclick={() => applyCustomTime(25, 5)}
				>
					25 / 5 m
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-stone-100 px-2.5 py-1 text-stone-700 hover:bg-stone-200"
					onclick={() => applyCustomTime(50, 10)}
				>
					50 / 10 m
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-stone-100 px-2.5 py-1 text-stone-700 hover:bg-stone-200"
					onclick={() => applyCustomTime(45, 15)}
				>
					45 / 15 m
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-stone-100 px-2.5 py-1 text-stone-700 hover:bg-stone-200"
					onclick={() => applyCustomTime(90, 20)}
				>
					90 / 20 m
				</button>
			</div>

			<!-- Focus Minutes Input -->
			<div class="flex flex-col gap-1.5">
				<div class="flex justify-between text-xs font-bold text-stone-700">
					<span>Thời gian tập trung (Focus):</span>
					<span class="font-black text-[#e06848]">{tempFocus} phút</span>
				</div>
				<input
					type="range"
					bind:value={tempFocus}
					min="1"
					max="120"
					step="1"
					class="h-2 w-full cursor-pointer rounded-full bg-stone-200 accent-[#f28f73]"
				/>
				<div class="flex justify-between text-[11px] font-medium text-stone-400">
					<span>5 phút</span>
					<span>25 phút</span>
					<span>50 phút</span>
					<span>120 phút</span>
				</div>
			</div>

			<!-- Break Minutes Input -->
			<div class="flex flex-col gap-1.5">
				<div class="flex justify-between text-xs font-bold text-stone-700">
					<span>Nghỉ ngắn (Break):</span>
					<span class="font-black text-[#e06848]">{tempBreak} phút</span>
				</div>
				<input
					type="range"
					bind:value={tempBreak}
					min="1"
					max="45"
					step="1"
					class="h-2 w-full cursor-pointer rounded-full bg-stone-200 accent-[#f28f73]"
				/>
			</div>

			<!-- Long Break Minutes Input -->
			<div class="flex flex-col gap-1.5">
				<div class="flex justify-between text-xs font-bold text-stone-700">
					<span>Nghỉ dài sau 4 chu kỳ:</span>
					<span class="font-black text-[#e06848]">{tempLongBreak} phút</span>
				</div>
				<input
					type="range"
					bind:value={tempLongBreak}
					min="5"
					max="60"
					step="1"
					class="h-2 w-full cursor-pointer rounded-full bg-stone-200 accent-[#f28f73]"
				/>
			</div>

			<!-- Auto Start Break & Focus Toggles -->
			<div class="flex flex-col gap-2 rounded-2xl bg-stone-100/80 p-3 text-xs">
				<label class="flex cursor-pointer items-center justify-between gap-2">
					<span class="font-bold text-stone-700">Tự động đếm ngược giờ nghỉ ngơi:</span>
					<input
						type="checkbox"
						bind:checked={tempAutoStartBreaks}
						class="h-4 w-4 cursor-pointer rounded accent-[#e06848]"
					/>
				</label>
				<label class="flex cursor-pointer items-center justify-between gap-2 border-t border-stone-200/60 pt-2">
					<span class="font-bold text-stone-700">Tự động bắt đầu phiên tập trung mới:</span>
					<input
						type="checkbox"
						bind:checked={tempAutoStartFocus}
						class="h-4 w-4 cursor-pointer rounded accent-[#e06848]"
					/>
				</label>
			</div>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#f5bba3] py-2.5 text-sm font-black text-[#4a2f24] shadow-md hover:brightness-105"
				onclick={saveSettings}
			>
				<Check class="h-4 w-4" /> Áp dụng & Lưu cấu hình
			</button>
		</div>
	{/if}
</div>
