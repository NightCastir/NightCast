export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      status: "NightCast API Ready"
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
