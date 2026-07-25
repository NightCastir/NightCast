export async function onRequest(context) {

  const API_KEY = context.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = "UCNv-iKOizOhOIWCdujWQGYA";

  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?key=${API_KEY}` +
    `&channelId=${CHANNEL_ID}` +
    `&part=snippet` +
    `&order=date` +
    `&maxResults=8`;

  const res = await fetch(url);
  const json = await res.json();

  const items = (json.items || [])
    .filter(i => i.id.videoId)
    .map(i => ({
      platform: "youtube",
      title: i.snippet.title,
      description: i.snippet.description,
      image: i.snippet.thumbnails.high.url,
      date: i.snippet.publishedAt,
      url: `https://youtu.be/${i.id.videoId}`
    }));

  return Response.json(items);
}
