<script lang="ts">
	import { soundEngine } from '#lib/audio/soundEngine';
	import { Lock, Copy, Check } from 'lucide-svelte';

	let copied = $state(false);

	function copyUrl() {
		soundEngine.playCeramicClick('soft');
		navigator.clipboard?.writeText('https://pomo.povixa.cloud');
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	function handleDotClick() {
		soundEngine.playCeramicClick('pop');
	}
</script>

<div
	class="flex w-full items-center justify-between border-b border-stone-200/50 px-3 py-3.5 sm:px-6"
>
	<!-- 3 Mac-style window controls dots -->
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="h-3.5 w-3.5 cursor-pointer rounded-full bg-[#fa756d] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),0_1px_2px_rgba(250,117,109,0.4)] transition-transform hover:brightness-105 active:scale-90"
			onclick={handleDotClick}
			aria-label="Đóng cửa sổ"
			title="Đóng"
		></button>
		<button
			type="button"
			class="h-3.5 w-3.5 cursor-pointer rounded-full bg-[#fbbd42] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),0_1px_2px_rgba(251,189,66,0.4)] transition-transform hover:brightness-105 active:scale-90"
			onclick={handleDotClick}
			aria-label="Thu nhỏ cửa sổ"
			title="Thu nhỏ"
		></button>
		<button
			type="button"
			class="h-3.5 w-3.5 cursor-pointer rounded-full bg-[#56c271] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),0_1px_2px_rgba(86,194,113,0.4)] transition-transform hover:brightness-105 active:scale-90"
			onclick={handleDotClick}
			aria-label="Phóng to cửa sổ"
			title="Phóng to"
		></button>
	</div>

	<!-- URL Pill Container (pomo.povixa.cloud) -->
	<div
		class="group relative flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#ede6df] px-6 py-1.5 text-xs font-bold text-[#887b73] shadow-[inset_2px_2px_4px_rgba(180,165,150,0.25),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] transition-colors hover:text-[#5e534c]"
		onclick={copyUrl}
		title="Bấm để sao chép địa chỉ"
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter') copyUrl();
		}}
	>
		<Lock class="h-3 w-3 text-[#a0938b] group-hover:text-[#74665e]" />
		<span class="tracking-wide">pomo.povixa.cloud</span>

		{#if copied}
			<span
				class="animate-in fade-in ml-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600"
			>
				<Check class="h-3 w-3" /> Đã chép
			</span>
		{:else}
			<Copy class="ml-0.5 h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-60" />
		{/if}
	</div>

	<!-- Right spacer or subtle mode/indicator -->
	<div class="flex w-14 items-center justify-end text-xs font-medium text-stone-400">
		<span class="hidden text-[11px] font-semibold text-stone-400 sm:inline-block">clay v1.0</span>
	</div>
</div>
