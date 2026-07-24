export async function onRequestGet() {

  const posts = [

    {
      id: 1,
      title: "SPIN Selling",
      platform: "YouTube",
      image: "https://nightcast.ir/assets/images/spin.webp",
      url: "https://youtube.com/@NightCast-r5e",
      date: "2026-07-24"
    },

    {
      id: 2,
      title: "قدرت عادت",
      platform: "Telegram",
      image: "https://nightcast.ir/assets/images/habit.webp",
      url: "https://t.me/NightCast_ir",
      date: "2026-07-23"
    }

  ];

  return Response.json(posts);

}
