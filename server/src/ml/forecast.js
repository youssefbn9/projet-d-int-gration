'use strict';

const { linearRegression, predict } = require('./linearRegression');

/**
 * Génère une prévision des ventes sur 7 jours et évalue le risque de rupture.
 *
 * @param {Array<{date: string, quantity: number}>} history 30 derniers jours chronologiques
 * @param {number} currentStock Stock actuel disponible
 * @returns {{
 *   history: Array<{date: string, quantity: number}>,
 *   forecast: Array<{date: string, quantity: number}>,
 *   model: { slope: number, intercept: number, r2: number },
 *   avgForecastPerDay: number,
 *   daysBeforeStockout: number|null,
 *   alert: boolean
 * }}
 */
function generateForecast(history = [], currentStock = 0) {
  const stock = Math.max(0, parseInt(currentStock, 10) || 0);

  // Préparation des points pour la régression : x = 0..29
  const points = history.map((h, index) => ({
    x: index,
    y: Number(h.quantity) || 0,
  }));

  const model = linearRegression(points);

  // Trouver la dernière date pour incrémenter les 7 prochains jours
  const lastHistoryDateStr = history.length > 0
    ? history[history.length - 1].date
    : new Date().toISOString().slice(0, 10);

  const forecast = [];
  let forecastSum = 0;

  for (let i = 1; i <= 7; i++) {
    const x = points.length > 0 ? (points.length - 1) + i : 29 + i;
    const rawPredicted = predict(model, x);
    const roundedQty = parseFloat(Math.max(0, rawPredicted).toFixed(2));
    forecastSum += roundedQty;

    const futureDate = new Date(lastHistoryDateStr);
    futureDate.setDate(futureDate.getDate() + i);
    const dateStr = futureDate.toISOString().slice(0, 10);

    forecast.push({
      date: dateStr,
      quantity: roundedQty,
    });
  }

  const avgForecastPerDay = parseFloat((forecastSum / 7).toFixed(2));

  let daysBeforeStockout = null;
  if (avgForecastPerDay > 0) {
    daysBeforeStockout = parseFloat((stock / avgForecastPerDay).toFixed(1));
  }

  const alert = daysBeforeStockout !== null && daysBeforeStockout < 7;

  return {
    history,
    forecast,
    model,
    avgForecastPerDay,
    daysBeforeStockout,
    alert,
  };
}

module.exports = {
  generateForecast,
};

