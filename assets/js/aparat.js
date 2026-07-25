export async function onRequest() {

  const RSS_URL = "https://www.aparat.com/rss/nightcast";

  try {

    const response = await fetch(RSS_URL);

    if (!response.ok) {
      return Response.json({
        error: "Cannot load Aparat RSS"
      }, { status: 500 });
    }

    const xml = await response.text();

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8"
      }
    });

  } catch (err) {

    return Response.json({
      error: err.message
    }, { status: 500 });

  }

}
