<script lang="ts">
	import { workspace } from '#lib/state/workspaceState.svelte';
	import { soundEngine } from '#lib/audio/soundEngine';
	import { Keyboard, X } from 'lucide-svelte';

	const SHORTCUTS = [
		{ key: 'Space', desc: 'Bắt đầu / Tạm dừng Pomodoro' },
		{ key: 'F', desc: 'Bật / Tắt chế độ Zen toàn màn hình' },
		{ key: 'R', desc: 'Đặt lại thời gian đếm ngược (Reset)' },
		{ key: '?', desc: 'Mở / Đóng bảng phím tắt này' },
		{ key: 'Esc', desc: 'Đóng popover / Thoát chế độ Zen' }
	];

	function close() {
		soundEngine.playCeramicClick('soft');
		workspace.showShortcuts = false;
	}
</script>

{#if workspace.showShortcuts}
	<div
		class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs select-none"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') close();
		}}
	>
		<div
			class="animate-in zoom-in-95 relative flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-md"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-stone-200 pb-3">
				<div class="flex items-center gap-2 text-base font-black text-[#3d2c26]">
					<Keyboard class="h-5 w-5 text-[#8c65d6]" />
					<span>Phím tắt nhanh (Shortcuts)</span>
				</div>
				<button
					type="button"
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-stone-100 font-bold text-stone-500 hover:bg-stone-200"
					onclick={close}
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- List of shortcuts -->
			<div class="flex flex-col gap-2.5">
				{#each SHORTCUTS as item (item.key)}
					<div class="flex items-center justify-between py-1 text-xs">
						<span class="font-bold text-stone-600">{item.desc}</span>
						<kbd
							class="rounded-xl border border-stone-200 bg-stone-100 px-2.5 py-1 font-mono text-[11px] font-black text-stone-800 shadow-2xs"
						>
							{item.key}
						</kbd>
					</div>
				{/each}
			</div>

			<p class="text-center text-[11px] font-semibold text-stone-400">
				Phím tắt tự động bỏ qua khi bạn đang nhập văn bản.
			</p>
		</div>
	</div>
{/if}
