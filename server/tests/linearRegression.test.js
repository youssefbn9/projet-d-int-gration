'use strict';

const { linearRegression, predict } = require('../src/ml/linearRegression');

describe('Module de Régression Linéaire (server/src/ml/linearRegression.js)', () => {
  // ── 1. Droite parfaite (y = 2x + 1) ──────────────────────────────────────────
  it('identifie parfaitement une relation linéaire exacte y = 2x + 1', () => {
    // Points : (0, 1), (1, 3), (2, 5), (3, 7), (4, 9)
    const points = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
      { x: 4, y: 9 },
    ];

    const model = linearRegression(points);

    expect(model.slope).toBeCloseTo(2, 4);
    expect(model.intercept).toBeCloseTo(1, 4);
    expect(model.r2).toBeCloseTo(1, 4);

    // Prédiction sur x = 5 -> attendu 2*5 + 1 = 11
    expect(predict(model, 5)).toBeCloseTo(11, 4);
    // Prédiction sur x = 10 -> attendu 2*10 + 1 = 21
    expect(predict(model, 10)).toBeCloseTo(21, 4);
  });

  // ── 2. Données bruitées ──────────────────────────────────────────────────────
  it('calcule correctement la pente, l\'ordonnée et un R² réaliste sur données bruitées', () => {
    // Relation théorique ~ y = 1.5x + 2 avec petites variations
    const noisyPoints = [
      { x: 0, y: 2.1 },
      { x: 1, y: 3.4 },
      { x: 2, y: 5.2 },
      { x: 3, y: 6.3 },
      { x: 4, y: 8.1 },
      { x: 5, y: 9.6 },
    ];

    const model = linearRegression(noisyPoints);

    expect(model.slope).toBeGreaterThan(1.3);
    expect(model.slope).toBeLessThan(1.7);
    expect(model.intercept).toBeGreaterThan(1.5);
    expect(model.intercept).toBeLessThan(2.5);
    expect(model.r2).toBeGreaterThan(0.95);
  });

  // ── 3. Cas dégénérés ─────────────────────────────────────────────────────────
  describe('Cas dégénérés', () => {
    it('gère 0 point (tableau vide)', () => {
      const model = linearRegression([]);
      expect(model).toEqual({ slope: 0, intercept: 0, r2: 0 });
      expect(predict(model, 5)).toBe(0);
    });

    it('gère 1 seul point', () => {
      const model = linearRegression([{ x: 2, y: 10 }]);
      expect(model.slope).toBe(0);
      expect(model.intercept).toBe(10);
      expect(model.r2).toBe(0);
      expect(predict(model, 5)).toBe(10);
    });

    it('gère une variance nulle en X (points verticaux)', () => {
      const verticalPoints = [
        { x: 3, y: 4 },
        { x: 3, y: 8 },
        { x: 3, y: 12 },
      ];
      const model = linearRegression(verticalPoints);
      expect(model.slope).toBe(0);
      expect(model.intercept).toBe(8); // moyenne de Y = (4+8+12)/3
      expect(model.r2).toBe(0);
    });

    it('gère une variance nulle en Y (points horizontaux y constant)', () => {
      const horizontalPoints = [
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 2, y: 5 },
      ];
      const model = linearRegression(horizontalPoints);
      expect(model.slope).toBe(0);
      expect(model.intercept).toBe(5);
      expect(model.r2).toBe(1); // Droite horizontale parfaite
      expect(predict(model, 10)).toBe(5);
    });
  });

  // ── 4. Prédiction non négative ───────────────────────────────────────────────
  it('garantit une prédiction non négative (bornée à 0)', () => {
    // Droite descendante forte : y = -5x + 10
    const points = [
      { x: 0, y: 10 },
      { x: 1, y: 5 },
      { x: 2, y: 0 },
    ];
    const model = linearRegression(points);

    // À x = 5, le modèle donnerait -5*5 + 10 = -15
    const pred = predict(model, 5);
    expect(pred).toBe(0); // Jamais négatif
  });
});
