// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		YT?: {
			Player: new (
				elementId: string,
				options: {
					videoId?: string;
					playerVars?: Record<string, unknown>;
					events?: {
						onReady?: (event: {
							target: {
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
							};
						}) => void;
						onStateChange?: (event: { data: number }) => void;
						onError?: (event: { data: number }) => void;
					};
				}
			) => {
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
			};
		};
		onYouTubeIframeAPIReady?: (() => void) | undefined;
	}
}

export {};
