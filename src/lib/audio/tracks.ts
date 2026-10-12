export interface Track {
	id: string;
	title: string;
	artist: string;
	stationName?: string;
	bpm?: number;
	duration?: number; // in seconds (undefined or 0 for live streams)
	durationFormatted?: string;
	isLive?: boolean;
	tag: string;
	genre: string;
	coverGradient: string;
	audioUrl?: string;
	youtubeId?: string;
	thumbnail?: string;
	source: 'stream' | 'youtube' | 'procedural';
	description?: string;
	defaultAmbience?: {
		rain?: number;
		cafe?: number;
		night?: number;
		fire?: number;
		vinyl?: number;
	};
}

export const TRACKS: Track[] = [
	// YouTube Curated Chill Lofi & Study Streams
	{
		id: 'lofi-girl',
		title: 'lofi hip hop radio 📚 beats to relax/study to',
		artist: 'Lofi Girl',
		stationName: 'Lofi Girl Live 24/7',
		isLive: true,
		source: 'youtube',
		youtubeId: 'rFZHOHl-L8A',
		thumbnail: 'https://i.ytimg.com/vi/rFZHOHl-L8A/hqdefault.jpg',
		tag: 'đêm khuya',
		genre: 'Lofi Hip Hop / Focus Beats',
		coverGradient: 'radial-gradient(circle, #e27d60 0%, #854d3d 100%)',
		description: 'Giai điệu lofi bất hủ cùng cô bé chăm chỉ học bài phát trực tiếp 24/7.',
		defaultAmbience: { rain: 0.35, vinyl: 0.2, cafe: 0, night: 0, fire: 0 }
	},
	{
		id: 'lofi-vietnam',
		title: 'Nhạc Lofi Việt Nam Thư Giãn Học Tập & Làm Việc',
		artist: 'Phuongg • V-Lofi Chill',
		stationName: 'Lofi Học Tập Việt Nam',
		isLive: false,
		source: 'youtube',
		youtubeId: 'd71m2JJTqw0',
		duration: 4137,
		durationFormatted: '1:08:57',
		thumbnail: 'https://i.ytimg.com/vi/d71m2JJTqw0/hqdefault.jpg',
		tag: 'café',
		genre: 'Acoustic & Baroque Lofi',
		coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
		description: 'Tuyển tập nhạc lofi nhẹ nhàng thư giãn giúp não bộ tập trung làm việc hiệu quả.',
		defaultAmbience: { cafe: 0.3, vinyl: 0.15, rain: 0, night: 0, fire: 0 }
	},
	{
		id: 'chillhop-radio',
		title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
		artist: 'Chillhop Music',
		stationName: 'Chillhop Live 24/7',
		isLive: true,
		source: 'youtube',
		youtubeId: '5yx6BWlEVcY',
		thumbnail: 'https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg',
		tag: 'café',
		genre: 'Jazzy Hop / Coffee Beats',
		coverGradient: 'radial-gradient(circle, #488065 0%, #1e3d30 100%)',
		description: 'Thư giãn cùng chú gấu trúc ngộ nghĩnh và giai điệu jazzhop ấm cúng.',
		defaultAmbience: { cafe: 0.35, vinyl: 0.18, rain: 0, night: 0, fire: 0 }
	},
	{
		id: 'lofi-1am-session',
		title: '1 A.M Study Session 📚 [lofi hip hop]',
		artist: 'Lofi Girl',
		stationName: 'Lofi Night Session',
		isLive: false,
		source: 'youtube',
		youtubeId: 'lTRiuFIWV54',
		duration: 3674,
		durationFormatted: '1:01:14',
		thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg',
		tag: 'đêm khuya',
		genre: 'Midnight Study Lofi',
		coverGradient: 'radial-gradient(circle, #38426d 0%, #171d36 100%)',
		description: 'Phiên học bài 1 giờ sáng tĩnh lặng cho cú đêm tập trung hoàn thành bài vở.',
		defaultAmbience: { night: 0.4, vinyl: 0.2, rain: 0, cafe: 0, fire: 0 }
	},
	{
		id: 'rainy-jazz-cafe',
		title: 'Rainy Jazz Cafe - Slow Jazz & Coffee Shop Ambience',
		artist: 'Coffee Shop Vibes',
		stationName: 'Rainy Jazz Lounge',
		isLive: false,
		source: 'youtube',
		youtubeId: 'NJuSStkIZBg',
		duration: 12000,
		durationFormatted: '3:20:00',
		thumbnail: 'https://i.ytimg.com/vi/NJuSStkIZBg/hqdefault.jpg',
		tag: 'mưa',
		genre: 'Slow Jazz & Coffee Shop',
		coverGradient: 'radial-gradient(circle, #8a624a 0%, #3e271a 100%)',
		description: 'Tiếng mưa rơi tí tách ngoài cửa kính quán cà phê quen thuộc mùa đông.',
		defaultAmbience: { rain: 0.4, cafe: 0.25, vinyl: 0.15, night: 0, fire: 0 }
	},
	{
		id: 'ghibli-piano',
		title: 'Relaxing Piano Studio Ghibli Collection for Studying',
		artist: 'Vagabond Piano',
		stationName: 'Ghibli Piano Lounge',
		isLive: false,
		source: 'youtube',
		youtubeId: 'bHFKkCcUjW0',
		duration: 3600,
		durationFormatted: '1:00:00',
		thumbnail: 'https://i.ytimg.com/vi/bHFKkCcUjW0/hqdefault.jpg',
		tag: 'lửa ấm',
		genre: 'Acoustic Piano Nostalgia',
		coverGradient: 'radial-gradient(circle, #6c4b82 0%, #301f3d 100%)',
		description:
			'Giai điệu piano trong trẻo đầy hoài niệm từ những bộ phim hoạt hình Studio Ghibli.',
		defaultAmbience: { fire: 0.35, vinyl: 0.2, rain: 0, cafe: 0, night: 0 }
	},

	// SomaFM Live Streams (100% legal, free, direct mp3 streams)
	{
		id: 'somafm-groovesalad',
		title: 'Groove Salad',
		artist: 'SomaFM • Ambient Beats & Chill',
		stationName: 'SomaFM Radio',
		isLive: true,
		source: 'stream',
		tag: 'mưa',
		genre: 'Downtempo / Ambient Chill',
		coverGradient: 'radial-gradient(circle, #488065 0%, #1e3d30 100%)',
		audioUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
		description:
			'A nicely chilled plate of ambient beats and grooves. Phát trực tiếp 24/7 từ San Francisco.',
		defaultAmbience: { rain: 0.25, vinyl: 0.15, cafe: 0, night: 0, fire: 0 }
	},
	{
		id: 'somafm-lush',
		title: 'Lush',
		artist: 'SomaFM • Mellow Female Vocals',
		stationName: 'SomaFM Radio',
		isLive: true,
		source: 'stream',
		tag: 'đêm khuya',
		genre: 'Sensuous Vocals & Chillout',
		coverGradient: 'radial-gradient(circle, #7e527d 0%, #3a1f3a 100%)',
		audioUrl: 'https://ice1.somafm.com/lush-128-mp3',
		description: 'Sensuous and mellow female vocals with an electronic influence.',
		defaultAmbience: { night: 0.25, vinyl: 0.18, rain: 0, cafe: 0, fire: 0 }
	},
	{
		id: 'somafm-dronezone',
		title: 'Drone Zone',
		artist: 'SomaFM • Deep Atmospheric Ambient',
		stationName: 'SomaFM Radio',
		isLive: true,
		source: 'stream',
		tag: 'đêm khuya',
		genre: 'Space Ambient / Focus',
		coverGradient: 'radial-gradient(circle, #38426d 0%, #171d36 100%)',
		audioUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
		description: 'Served best chilled. Âm nhạc không gian tập trung sâu không lời.',
		defaultAmbience: { night: 0.35, vinyl: 0.1, rain: 0, cafe: 0, fire: 0 }
	},

	// Procedural Offline Rhodes Synth (100% Offline fallback)
	{
		id: 'offline-procedural',
		title: 'Rhodes Piano Jazz Synth (Offline)',
		artist: 'Bộ phát Web Audio Ngoại Tuyến',
		stationName: 'Offline Procedural Synth',
		bpm: 74,
		duration: 300,
		durationFormatted: '5:00',
		isLive: false,
		source: 'procedural',
		tag: 'ngẫu nhiên',
		genre: 'Procedural Web Audio Synth',
		coverGradient: 'radial-gradient(circle, #7d654b 0%, #3b2c1c 100%)',
		description: 'Bộ tạo hợp âm Rhodes jazz và nhịp lofi vô tận chạy offline 100% không cần mạng.',
		defaultAmbience: { vinyl: 0.25, rain: 0.3, cafe: 0, night: 0, fire: 0 }
	}
];
