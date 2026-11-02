-- StockPro – Schéma MySQL 8 pour Déploiement Managé (Production)
-- Adapté pour Railway / Render / PlanetScale / Aiven / Clever Cloud (Pas de CREATE DATABASE ni de USE)
-- Encodage : utf8mb4

-- ── Entreprises ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120)  NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Utilisateurs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  email        VARCHAR(191) NOT NULL,
  password     VARCHAR(255) NOT NULL,
  first_name   VARCHAR(80)  NOT NULL,
  last_name    VARCHAR(80)  NOT NULL,
  role         ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_email (email),
  CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Catégories ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cat_name (company_id, name),
  CONSTRAINT fk_cat_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Fournisseurs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(191),
  phone      VARCHAR(30),
  address    TEXT,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sup_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Clients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(191),
  phone      VARCHAR(30),
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cust_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Produits ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED   NOT NULL,
  category_id     INT UNSIGNED,
  supplier_id     INT UNSIGNED,
  sku             VARCHAR(80)    NOT NULL,
  name            VARCHAR(200)   NOT NULL,
  description     TEXT,
  unit_price      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  cost            DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  stock_quantity  INT            NOT NULL DEFAULT 0,
  stock_min       INT            NOT NULL DEFAULT 0,
  image_url       VARCHAR(500),
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_sku (company_id, sku),
  CONSTRAINT fk_prod_company  FOREIGN KEY (company_id)  REFERENCES companies(id)  ON DELETE CASCADE,
  CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_prod_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Ventes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED   NOT NULL,
  user_id      INT UNSIGNED   NOT NULL,
  customer_id  INT UNSIGNED   NULL,
  total_amount DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
  status       ENUM('pending','paid','cancelled','completed') NOT NULL DEFAULT 'pending',
  note         TEXT,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_company  FOREIGN KEY (company_id)  REFERENCES companies(id)  ON DELETE CASCADE,
  CONSTRAINT fk_sale_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id) REFERENCES customers(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Lignes de vente ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  sale_id      INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NOT NULL,
  quantity     INT           NOT NULL,
  unit_price   DECIMAL(12,2) NOT NULL,
  subtotal     DECIMAL(14,2) NOT NULL,
  CONSTRAINT fk_item_sale    FOREIGN KEY (sale_id)    REFERENCES sales(id)    ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ── Mouvements de stock ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  type         ENUM('entry','exit','adjustment','in','out') NOT NULL,
  quantity     INT          NOT NULL,
  reason       VARCHAR(255),
  sale_id      INT UNSIGNED,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mv_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_mv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_mv_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_mv_sale    FOREIGN KEY (sale_id)    REFERENCES sales(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Index supplémentaires ────────────────────────────────────────────────────
CREATE INDEX idx_products_company    ON products(company_id);
CREATE INDEX idx_sales_company_date  ON sales(company_id, created_at);
CREATE INDEX idx_movements_company   ON stock_movements(company_id, created_at);
