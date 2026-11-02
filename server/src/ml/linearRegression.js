'use strict';

/**
 * Régression linéaire simple par la méthode des moindres carrés ordinaires (OLS).
 * Module en JavaScript pur sans aucune dépendance externe.
 *
 * @param {Array<{x: number, y: number}|[number, number]>} points
 * @returns {{ slope: number, intercept: number, r2: number }}
 */
function linearRegression(points = []) {
  if (!Array.isArray(points) || points.length === 0) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = points.length;
  if (n === 1) {
    const y0 = points[0].y !== undefined ? points[0].y : points[0][1];
    return { slope: 0, intercept: Number(y0) || 0, r2: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  const pts = [];

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const x = Number(p.x !== undefined ? p.x : p[0]);
    const y = Number(p.y !== undefined ? p.y : p[1]);
    sumX += x;
    sumY += y;
    pts.push({ x, y });
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  let ssXX = 0;
  let ssXY = 0;
  let ssYY = 0;

  for (const pt of pts) {
    const dx = pt.x - meanX;
    const dy = pt.y - meanY;
    ssXX += dx * dx;
    ssXY += dx * dy;
    ssYY += dy * dy;
  }

  // Cas dégénéré : variance nulle en X (droite verticale)
  if (ssXX === 0) {
    return { slope: 0, intercept: meanY, r2: 0 };
  }

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  // Calcul du coefficient de détermination R²
  let ssRes = 0;
  for (const pt of pts) {
    const yPred = slope * pt.x + intercept;
    const diff = pt.y - yPred;
    ssRes += diff * diff;
  }

  let r2 = 0;
  if (ssYY === 0) {
    // Si toutes les valeurs y sont identiques (droite horizontale parfaite)
    r2 = ssRes < 1e-9 ? 1 : 0;
  } else {
    r2 = Math.max(0, 1 - ssRes / ssYY);
  }

  return {
    slope: parseFloat(slope.toFixed(6)),
    intercept: parseFloat(intercept.toFixed(6)),
    r2: parseFloat(r2.toFixed(4)),
  };
}

/**
 * Prédit la valeur y pour une abscisse x donnée à partir d'un modèle.
 * La prédiction est bornée à 0 (jamais négative).
 *
 * @param {{ slope: number, intercept: number }} model
 * @param {number} x
 * @returns {number}
 */
function predict(model, x) {
  if (!model) return 0;
  const slope = Number(model.slope) || 0;
  const intercept = Number(model.intercept) || 0;
  const raw = slope * Number(x) + intercept;
  return Math.max(0, raw);
}

module.exports = {
  linearRegression,
  predict,
};

