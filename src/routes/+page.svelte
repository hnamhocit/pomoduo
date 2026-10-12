<script lang="ts">
	import PomodoroTimer from '#lib/components/PomodoroTimer.svelte';
	import MusicPlayer from '#lib/components/MusicPlayer.svelte';
	import ZenMode from '#lib/components/ZenMode.svelte';
	import ShortcutsModal from '#lib/components/ShortcutsModal.svelte';
	import { workspace, type Theme, type AmbientPreset } from '#lib/state/workspaceState.svelte';
	import { soundEngine } from '#lib/audio/soundEngine';
	import { Maximize2, Keyboard, Palette, Flame } from 'lucide-svelte';

	let showThemeMenu = $state(false);
	let soundscapeController: ((preset: AmbientPreset) => void) | null = null;

	const THEMES: { id: Theme; name: string; icon: string }[] = [
		{ id: 'peach', name: 'Gốm Đào', icon: '🍑' },
		{ id: 'matcha', name: 'Matcha Zen', icon: '🍵' },
		{ id: 'midnight', name: 'Đêm Lofi', icon: '🌙' },
		{ id: 'mist', name: 'Sương Mù', icon: '🌊' }
	];

	// Dynamic tab title sync
	$effect(() => {
		if (typeof document === 'undefined') return;
		const timeStr = workspace.formattedTime;
		if (workspace.isRunning) {
			if (workspace.mode === 'focus') {
				document.title = `🍅 (${timeStr}) Focus • Pomoduo`;
			} else {
				document.title = `☕ (${timeStr}) Break • Pomoduo`;
			}
		} else {
			document.title = `⏸ (${timeStr}) Pomoduo`;
		}
	});

	// Theme sync to body class
	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.className = `theme-${workspace.theme}`;
	});

	// Global Keyboard Shortcuts handler
	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if (e.code === 'Space') {
			e.preventDefault();
			workspace.toggleStartPause();
		} else if (e.key === 'r' || e.key === 'R') {
			e.preventDefault();
			workspace.resetTimer();
		} else if (e.key === 'f' || e.key === 'F') {
			e.preventDefault();
			workspace.toggleZen();
		} else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
			e.preventDefault();
			workspace.toggleShortcuts();
		} else if (e.key === 'Escape') {
			if (workspace.isZenMode) workspace.isZenMode = false;
			if (workspace.showShortcuts) workspace.showShortcuts = false;
			if (showThemeMenu) showThemeMenu = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<meta
		name="description"
		content="Đồng hồ Pomodoro quả cà chua siêu cute với góc nhạc lofi chill, đài phát thanh SomaFM trực tiếp, bộ trộn âm thanh môi trường và chế độ Zen tập trung không phân tâm."
	/>
</svelte:head>

<!-- Full-page Clay Experience Canvas -->
<main
	class="relative flex min-h-screen w-full flex-col items-center justify-between overflow-x-hidden px-4 py-6 select-none sm:px-8 md:px-12"
>
	<!-- Background subtle ambient decorative glows -->
	<div
		class="pointer-events-none fixed -top-40 -left-40 -z-10 h-96 w-96 rounded-full bg-[#fcdfc7]/50 blur-3xl"
	></div>
	<div
		class="pointer-events-none fixed -right-40 -bottom-40 -z-10 h-96 w-96 rounded-full bg-[#e3d5fa]/50 blur-3xl"
	></div>

	<!-- Top Bar / Branding header with Themes, Zen Mode & Shortcuts button -->
	<header class="flex w-full max-w-5xl items-center justify-between px-2 py-2">
		<!-- Branding -->
		<div class="flex items-center gap-2">
			<span class="text-2xl drop-shadow-sm filter">🍅</span>
			<span class="text-lg font-black tracking-tight">pomoduo</span>
			<span
				class="ml-1 rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 text-xs font-bold text-stone-600 shadow-2xs"
			>
				v2.5 zen
			</span>
		</div>

		<!-- Action bar: Stats, Theme, Shortcuts & Zen Mode -->
		<div class="flex items-center gap-2">
			<!-- Daily Stats Pill -->
			{#if workspace.totalSessionsCompleted > 0}
				<span
					class="hidden items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-extrabold text-[#e06848] shadow-2xs sm:inline-flex"
					title="Tổng số phiên hoàn tất"
				>
					<Flame class="h-3.5 w-3.5 fill-current" />
					<span>{workspace.totalSessionsCompleted} phiên</span>
				</span>
			{/if}

			<!-- Theme Switcher Pill -->
			<div class="relative">
				<button
					type="button"
					class="clay-tag flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-stone-700 transition-all"
					onclick={() => {
						soundEngine.playCeramicClick('soft');
						showThemeMenu = !showThemeMenu;
					}}
					title="Đổi chủ đề màu sắc"
				>
					<Palette class="h-3.5 w-3.5 text-[#e06848]" />
					<span class="hidden sm:inline">Màu sắc</span>
				</button>

				{#if showThemeMenu}
					<div
						class="animate-in fade-in zoom-in-95 absolute top-10 right-0 z-40 flex min-w-[150px] flex-col gap-1 rounded-2xl border border-stone-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-md"
					>
						<span class="px-2 py-1 text-[11px] font-black text-stone-500">Chọn chủ đề</span>
						{#each THEMES as th (th.id)}
							<button
								type="button"
								class="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-all {workspace.theme ===
								th.id
									? 'bg-[#8c65d6]/15 font-black text-[#6a4ea8]'
									: 'text-stone-700 hover:bg-stone-100/80'}"
								onclick={() => {
									soundEngine.playCeramicClick('soft');
									workspace.setTheme(th.id);
									showThemeMenu = false;
								}}
							>
								<span class="flex items-center gap-2">
									<span>{th.icon}</span>
									<span>{th.name}</span>
								</span>
								{#if workspace.theme === th.id}
									<span class="h-1.5 w-1.5 rounded-full bg-[#8c65d6]"></span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Keyboard Shortcuts Button -->
			<button
				type="button"
				class="clay-tag flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-stone-700 transition-all"
				onclick={() => workspace.toggleShortcuts()}
				title="Bảng phím tắt nhanh (?)"
			>
				<Keyboard class="h-3.5 w-3.5 text-[#8c65d6]" />
				<span class="hidden sm:inline">Phím tắt</span>
			</button>

			<!-- Zen Fullscreen Mode Button -->
			<button
				type="button"
				class="clay-tag flex cursor-pointer items-center gap-1.5 rounded-full bg-[#fde9df] px-3.5 py-1.5 text-xs font-black text-[#e06848] transition-all hover:brightness-105"
				onclick={() => workspace.toggleZen()}
				title="Bật chế độ Zen tập trung toàn màn hình (Phím F)"
			>
				<Maximize2 class="h-3.5 w-3.5" />
				<span>Zen Mode (F)</span>
			</button>
		</div>
	</header>

	<!-- Main Workspace Area: Centered, Beautiful Side-by-Side Cards -->
	<div class="my-auto flex w-full max-w-5xl flex-col items-center justify-center py-6 sm:py-10">
		<div class="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
			<!-- Left Card: Pomodoro Timer -->
			<PomodoroTimer />

			<!-- Right Card: Lofi & Radio Music Player -->
			<MusicPlayer
				onInitSoundscapeController={(fn) => {
					soundscapeController = fn;
				}}
			/>
		</div>
	</div>

	<!-- Footer Note -->
	<footer class="flex w-full max-w-5xl flex-col items-center gap-2 py-5 text-center">
		<p class="text-xs font-semibold tracking-wide opacity-80 sm:text-[13px]">
			phím tắt: <kbd
				class="rounded-md border border-stone-300 bg-white/70 px-1 py-0.5 font-mono text-[11px] font-bold"
				>Space</kbd
			>
			Bắt đầu/Dừng •
			<kbd
				class="rounded-md border border-stone-300 bg-white/70 px-1 py-0.5 font-mono text-[11px] font-bold"
				>F</kbd
			>
			Zen Toàn Màn Hình •
			<kbd
				class="rounded-md border border-stone-300 bg-white/70 px-1 py-0.5 font-mono text-[11px] font-bold"
				>R</kbd
			>
			Đặt lại
		</p>

		<!-- Made with love by povixa, hnamhocit (github) -->
		<div
			class="flex flex-wrap items-center justify-center gap-1.5 text-xs font-semibold opacity-90"
		>
			<span>Made with</span>
			<span class="animate-pulse text-rose-500">❤️</span>
			<span>by</span>
			<span class="font-bold">povixa</span>,
			<a
				href="https://github.com/hnamhocit"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex cursor-pointer items-center gap-1 font-black text-[#6a4ea8] underline underline-offset-3 transition-colors hover:text-[#4b337c]"
			>
				<svg class="inline h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
					<path
						d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
					/>
				</svg>
				<span>hnamhocit</span>
				<span class="text-[11px] font-bold opacity-70">(github)</span>
			</a>
		</div>
	</footer>

	<!-- Fullscreen Zen Mode Overlay -->
	<ZenMode
		onApplySoundscape={(preset) => {
			soundscapeController?.(preset);
		}}
	/>

	<!-- Keyboard Shortcuts Cheat Sheet Modal -->
	<ShortcutsModal />
</main>
