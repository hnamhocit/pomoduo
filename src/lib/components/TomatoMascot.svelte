<script lang="ts">
	import { soundEngine } from '#lib/audio/soundEngine';

	interface Props {
		mascotMood?: 'focus' | 'break' | 'paused' | 'completed';
		isTicking?: boolean;
		hasCrown?: boolean;
	}

	let { mascotMood = 'focus', isTicking = false, hasCrown = false }: Props = $props();

	let isSquishing = $state(false);
	let isBlinking = $state(false);
	let pokeCount = $state(0);
	let speechText = $state('');
	let showBubble = $state(false);
	let bubbleTimer: ReturnType<typeof setTimeout> | null = null;

	const CUTE_QUOTES = [
		'Tớ tin bạn làm được mà! 🍅',
		'Hít một hơi thật sâu, thở ra mỉm cười ~ ✨',
		'Uống ngụm nước ấm cho tỉnh táo nhé! 💧',
		'Cứ đi từng bước nhỏ, không cần vội vã! 🍃',
		'Á nhột quá, đừng chọc tớ hoài mà hihi! 🤭',
		'Tớ ngồi đây canh giờ cho bạn nè! ⏰',
		'Một phiên tập trung sâu cực kỳ giá trị! 🔥',
		'Thả lỏng hai vai và cổ một chút nào ~ 🧘',
		'Tuyệt vời lắm, duy trì phong độ nhé! ⭐',
		'Bạn đang tiến gần hơn tới mục tiêu rồi! 🎯'
	];

	// Periodic blinking
	$effect(() => {
		const interval = setInterval(() => {
			if (Math.random() > 0.35) {
				isBlinking = true;
				setTimeout(() => {
					isBlinking = false;
				}, 160);
			}
		}, 3800);

		return () => clearInterval(interval);
	});

	function handlePoke() {
		isSquishing = true;
		pokeCount++;
		soundEngine.playCeramicClick('poke');

		// Show speech bubble
		speechText = CUTE_QUOTES[Math.floor(Math.random() * CUTE_QUOTES.length)];
		showBubble = true;

		if (bubbleTimer) clearTimeout(bubbleTimer);
		bubbleTimer = setTimeout(() => {
			showBubble = false;
		}, 3600);

		setTimeout(() => {
			isSquishing = false;
		}, 350);
	}

	$effect(() => {
		return () => {
			if (bubbleTimer) clearTimeout(bubbleTimer);
		};
	});
</script>

<!-- Tomato Character Container -->
<div
	class="group relative flex cursor-pointer flex-col items-center justify-center select-none"
	onclick={handlePoke}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') handlePoke();
	}}
	role="button"
	tabindex="0"
	aria-label="Cà chua Pomoduo siêu cute, bấm vào để chạm nhẹ"
>
	<!-- Speech Bubble (Floating above mascot) -->
	{#if showBubble}
		<div
			class="animate-in fade-in zoom-in-90 pointer-events-none absolute -top-8 z-20 flex items-center justify-center rounded-2xl border border-white/90 bg-white/95 px-3 py-1.5 text-xs font-black text-[#543b31] shadow-[0_8px_20px_rgba(200,120,90,0.25)] backdrop-blur-xs transition-all duration-200"
		>
			<span>{speechText}</span>
			<!-- Speech bubble tail -->
			<div
				class="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-white/90 bg-white"
			></div>
		</div>
	{/if}

	<!-- Sleepy "z Z" animation when on Break -->
	{#if mascotMood === 'break'}
		<div class="pointer-events-none absolute -top-2 right-4 flex flex-col items-center">
			<span class="animate-bounce text-xs font-black text-indigo-400 opacity-80 duration-1000"
				>z</span
			>
			<span class="animate-bounce text-sm font-black text-indigo-500 opacity-90 delay-150">Z</span>
		</div>
	{/if}

	<!-- Mascot Floating & Squish Wrapper -->
	<div
		class="relative transform transition-transform duration-300 ease-out"
		class:animate-float={!isSquishing && isTicking}
		class:scale-95={isSquishing}
		style="transform-origin: center bottom;"
	>
		<!-- 3D Clay Tomato SVG -->
		<svg
			viewBox="0 0 220 180"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="h-[185px] w-[230px] drop-shadow-[0_22px_26px_rgba(215,120,95,0.25)] filter transition-all duration-300 sm:h-[215px] sm:w-[270px]"
		>
			<defs>
				<!-- Tomato Body Clay Gradient -->
				<radialGradient id="tomatoClay" cx="40%" cy="30%" r="70%" fx="40%" fy="30%">
					<stop offset="0%" stop-color="#ffb094" />
					<stop offset="30%" stop-color="#ff8966" />
					<stop offset="70%" stop-color="#fa6846" />
					<stop offset="100%" stop-color="#e24c2c" />
				</radialGradient>

				<!-- Top Highlight -->
				<linearGradient id="topLight" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
					<stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
				</linearGradient>

				<!-- Leaf Clay Gradient Left -->
				<linearGradient id="leafGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="#388e3c" />
					<stop offset="50%" stop-color="#66bb6a" />
					<stop offset="100%" stop-color="#a5d6a7" />
				</linearGradient>

				<!-- Leaf Clay Gradient Right -->
				<linearGradient id="leafGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#81c784" />
					<stop offset="60%" stop-color="#4caf50" />
					<stop offset="100%" stop-color="#2e7d32" />
				</linearGradient>

				<!-- Ambient Floor Shadow -->
				<radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#a65d4b" stop-opacity="0.3" />
					<stop offset="70%" stop-color="#d98977" stop-opacity="0.12" />
					<stop offset="100%" stop-color="#000000" stop-opacity="0" />
				</radialGradient>

				<!-- Crown Gold Gradient -->
				<linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#fff099" />
					<stop offset="50%" stop-color="#f5c02b" />
					<stop offset="100%" stop-color="#d98e04" />
				</linearGradient>
			</defs>

			<!-- Ambient contact shadow -->
			<ellipse cx="110" cy="162" rx="68" ry="14" fill="url(#floorShadow)" />

			<!-- Leaves / Sprout on Head -->
			<g
				id="sprout"
				class="origin-[110px_45px] transition-transform duration-300 group-hover:rotate-6"
			>
				<!-- Stem center -->
				<path
					d="M107 48 C108 38, 112 36, 110 32"
					stroke="#2e7d32"
					stroke-width="5"
					stroke-linecap="round"
				/>
				<!-- Left leaf -->
				<path
					d="M109 40 C95 32, 92 18, 102 18 C112 18, 110 34, 109 40 Z"
					fill="url(#leafGradLeft)"
					filter="drop-shadow(0 2px 3px rgba(34,84,36,0.3))"
				/>
				<path
					d="M103 23 C101 28, 106 32, 108 37"
					stroke="#e8f5e9"
					stroke-width="1.2"
					stroke-linecap="round"
					stroke-opacity="0.7"
				/>

				<!-- Right leaf -->
				<path
					d="M109 40 C118 30, 134 26, 131 16 C121 16, 110 30, 109 40 Z"
					fill="url(#leafGradRight)"
					filter="drop-shadow(0 2px 3px rgba(34,84,36,0.25))"
				/>
				<path
					d="M124 20 C118 26, 113 32, 110 36"
					stroke="#c8e6c9"
					stroke-width="1.2"
					stroke-linecap="round"
					stroke-opacity="0.7"
				/>
			</g>

			<!-- Plump Tomato Body -->
			<path
				d="M110 38
				   C156 38, 196 66, 196 102
				   C196 138, 158 158, 110 158
				   C62 158, 24 138, 24 102
				   C24 66, 64 38, 110 38 Z"
				fill="url(#tomatoClay)"
			/>

			<!-- Golden Champion Crown (when completed 4/4 sessions!) -->
			{#if hasCrown}
				<g id="crown" class="animate-pulse">
					<path
						d="M84 32 L94 44 L110 24 L126 44 L136 32 L132 50 L88 50 Z"
						fill="url(#crownGrad)"
						stroke="#fff4a3"
						stroke-width="1.5"
						filter="drop-shadow(0 3px 6px rgba(217,142,4,0.4))"
					/>
					<circle cx="84" cy="32" r="2.5" fill="#ffffff" />
					<circle cx="110" cy="24" r="3.2" fill="#ffffff" />
					<circle cx="136" cy="32" r="2.5" fill="#ffffff" />
				</g>
			{/if}

			<!-- 3D Clay Top Specular Highlight (Soft Porcelain Shine) -->
			<path
				d="M110 42
				   C148 42, 178 62, 180 84
				   C150 72, 85 70, 48 88
				   C46 64, 76 42, 110 42 Z"
				fill="url(#topLight)"
				opacity="0.45"
			/>

			<!-- Rosy Cheeks -->
			<ellipse cx="64" cy="116" rx="9" ry="6" fill="#f87171" opacity="0.4" />
			<ellipse cx="156" cy="116" rx="9" ry="6" fill="#f87171" opacity="0.4" />

			<!-- Cute Eyes -->
			{#if isBlinking}
				<!-- Closed blinking eyes (cute curves) -->
				<path
					d="M78 105 Q85 111 92 105"
					stroke="#2d1d18"
					stroke-width="3.5"
					stroke-linecap="round"
					fill="none"
				/>
				<path
					d="M128 105 Q135 111 142 105"
					stroke="#2d1d18"
					stroke-width="3.5"
					stroke-linecap="round"
					fill="none"
				/>
			{:else if mascotMood === 'break'}
				<!-- Chill happy closed curve eyes -->
				<path
					d="M78 107 Q85 99 92 107"
					stroke="#2d1d18"
					stroke-width="3.5"
					stroke-linecap="round"
					fill="none"
				/>
				<path
					d="M128 107 Q135 99 142 107"
					stroke="#2d1d18"
					stroke-width="3.5"
					stroke-linecap="round"
					fill="none"
				/>
			{:else}
				<!-- Open glossy eyes -->
				<g id="left-eye">
					<ellipse cx="85" cy="104" rx="6.5" ry="7.5" fill="#2d1d18" />
					<!-- Eye glossy catchlight -->
					<circle cx="83.5" cy="101.5" r="2.2" fill="#ffffff" />
					<circle cx="87" cy="106" r="1.1" fill="#ffffff" />
				</g>
				<g id="right-eye">
					<ellipse cx="135" cy="104" rx="6.5" ry="7.5" fill="#2d1d18" />
					<!-- Eye glossy catchlight -->
					<circle cx="133.5" cy="101.5" r="2.2" fill="#ffffff" />
					<circle cx="137" cy="106" r="1.1" fill="#ffffff" />
				</g>
			{/if}

			<!-- Cute Mouth -->
			{#if mascotMood === 'break'}
				<!-- Relaxed happy cat mouth -->
				<path
					d="M102 114 Q106 120 110 116 Q114 120 118 114"
					stroke="#2d1d18"
					stroke-width="3.2"
					stroke-linecap="round"
					fill="none"
				/>
			{:else if isSquishing}
				<!-- Poked surprise mouth :o -->
				<ellipse cx="110" cy="118" rx="5" ry="6.5" fill="#2d1d18" />
				<ellipse cx="110" cy="120" rx="3.5" ry="3.5" fill="#f87171" />
			{:else}
				<!-- Default sweet smile -->
				<path
					d="M102 114 C104 123, 116 123, 118 114"
					stroke="#2d1d18"
					stroke-width="3.2"
					stroke-linecap="round"
					fill="none"
				/>
			{/if}
		</svg>
	</div>

	<!-- Tiny cute poke hint badge when hovered -->
	<span
		class="pointer-events-none absolute -bottom-1 text-[11px] font-medium text-stone-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
	>
		{pokeCount > 0 ? ` chạm x${pokeCount} • bấm để trò chuyện 🍅` : 'chạm vào tớ nè ~'}
	</span>
</div>

<style>
	@keyframes floatAnim {
		0%,
		100% {
			transform: translateY(0px) scale(1);
		}
		50% {
			transform: translateY(-4px) scale(1.01);
		}
	}

	.animate-float {
		animation: floatAnim 4s ease-in-out infinite;
	}
</style>
