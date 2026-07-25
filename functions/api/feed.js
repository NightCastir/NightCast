export async function onRequest() {
  return Response.json({
    test: "NEW VERSION"
  });
}
