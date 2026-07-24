export async function onRequest() {

  return Response.json({
    platform: "youtube",
    status: "ready",
    channel: "@NightCast-r5e",
    items: []
  });

}
