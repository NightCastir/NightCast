export async function onRequest(context) {

  return Response.json({
    keyExists: !!context.env.YOUTUBE_API_KEY
  });

}
