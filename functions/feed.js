export async function onRequestGet() {

  return Response.json([
    {
      id: 1,
      title: "SPIN Selling",
      description: "خلاصه کتاب فروش به روش اسپین",
      image: "/assets/images/spin.webp",
      platform: "YouTube",
      date: "2026-07-24",
      url: "https://youtube.com/@NightCast-r5e"
    },
    {
      id: 2,
      title: "قدرت عادت",
      description: "خلاصه کتاب قدرت عادت",
      image: "/assets/images/habit.webp",
      platform: "Telegram",
      date: "2026-07-23",
      url: "https://t.me/NightCast_ir"
    }
  ]);
}
