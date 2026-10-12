import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')?.trim();

	if (!query) {
		return json({ results: [] });
	}

	// 1. Check if user entered a direct YouTube URL or 11-char ID
	const youtubeUrlRegex =
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
	const urlMatch = query.match(youtubeUrlRegex);
	const directId = urlMatch ? urlMatch[1] : /^[a-zA-Z0-9_-]{11}$/.test(query) ? query : null;

	if (directId) {
		try {
			const oembedRes = await fetch(
				`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directId}&format=json`
			);
			if (oembedRes.ok) {
				const data = await oembedRes.json();
				return json({
					results: [
						{
							id: directId,
							title: data.title || 'YouTube Video',
							channel: data.author_name || 'YouTube',
							thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
							duration: 'YouTube',
							isLive: false,
							youtubeId: directId
						}
					]
				});
			}
		} catch (err) {
			console.error('Error fetching oEmbed:', err);
		}
	}

	// 2. Fetch search results from YouTube
	try {
		const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
		const response = await fetch(searchUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
			}
		});

		if (!response.ok) {
			return json({ results: [] });
		}

		const html = await response.text();
		const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
		if (!match) {
			return json({ results: [] });
		}

		const parsed = JSON.parse(match[1]);
		const contents =
			parsed.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
				?.contents;

		if (!contents || !Array.isArray(contents)) {
			return json({ results: [] });
		}

		const results: Array<{
			id: string;
			title: string;
			channel: string;
			duration: string;
			thumbnail: string;
			isLive: boolean;
			youtubeId: string;
		}> = [];

		for (const section of contents) {
			const items = section?.itemSectionRenderer?.contents;
			if (Array.isArray(items)) {
				for (const item of items) {
					const vr = item.videoRenderer;
					if (vr && vr.videoId) {
						const isLive = Boolean(
							vr.badges?.some(
								(b: { metadataBadgeRenderer?: { style?: string; label?: string } }) =>
									b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' ||
									b.metadataBadgeRenderer?.label === 'LIVE' ||
									b.metadataBadgeRenderer?.label === 'TRỰC TIẾP'
							)
						);

						const duration = vr.lengthText?.simpleText || (isLive ? 'LIVE' : '');
						const title =
							vr.title?.runs?.map((r: { text?: string }) => r.text || '').join('') ||
							vr.title?.simpleText ||
							'';
						const channel =
							vr.ownerText?.runs?.map((r: { text?: string }) => r.text || '').join('') ||
							vr.shortBylineText?.runs?.map((r: { text?: string }) => r.text || '').join('') ||
							'';
						const thumb =
							vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
							`https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;

						results.push({
							id: vr.videoId,
							title,
							channel,
							duration,
							thumbnail: thumb,
							isLive,
							youtubeId: vr.videoId
						});
					}
				}
			}
		}

		return json({ results: results.slice(0, 24) });
	} catch (error) {
		console.error('Lỗi tìm kiếm YouTube:', error);
		return json({ results: [] });
	}
};
