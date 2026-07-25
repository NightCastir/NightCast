export async function onRequest(context) {

  const API_KEY = context.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = "UCNv-iKOizOhOIWCdujWQGYA";

  const youtubeUrl =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=8&order=date&type=video&key=${API_KEY}`;

  try {

    const response = await fetch(youtubeUrl);
    const json = await response.json();

    const items = (json.items || []).map(item => ({

      id: item.id.videoId,

      platform: "youtube",

      title: item.snippet.title,

      description: item.snippet.description,

      image: item.snippet.thumbnails.high.url,

      date: item.snippet.publishedAt,

      url: `https://www.youtube.com/watch?v=${item.id.videoId}`

    }));

    return Response.json(items);

  } catch (e) {

    return Response.json({
      error: e.message
    }, { status: 500 });

  }

}
