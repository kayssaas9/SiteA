export function getDailyGenerationCount(date = new Date()) {
  const dateSeed = date.getFullYear() * 10000
    + (date.getMonth() + 1) * 100
    + date.getDate();
  const dailyVariation = (dateSeed * 9301 + 49297) % 233280;
  return 10000 + Math.floor((dailyVariation / 233280) * 10001);
}

export function formatDailyGenerationCount(date = new Date()) {
  return getDailyGenerationCount(date).toLocaleString("fr-FR");
}