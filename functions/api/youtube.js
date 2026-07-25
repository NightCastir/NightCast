const response = await fetch(youtubeUrl);
const json = await response.json();

return Response.json(json);
