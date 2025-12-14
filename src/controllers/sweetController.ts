import { Request, Response } from "express";
import { pool } from "../db";

export async function createSweet(req: Request, res: Response) {
  try {
    const { name, category, price, quantity } = req.body;

    if (!name || !category || price == null || quantity == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await pool.query(
      "INSERT INTO sweets (name, category, price, quantity) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, category, price, quantity]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getSweets(_req: Request, res: Response) {
  try {
    const result = await pool.query("SELECT * FROM sweets ORDER BY id");
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function searchSweets(req: Request, res: Response) {
  try {
    const { name, category, minPrice, maxPrice } = req.query;

    const conditions: string[] = [];
    const values: any[] = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (minPrice) {
      values.push(minPrice);
      conditions.push(`price >= $${values.length}`);
    }

    if (maxPrice) {
      values.push(maxPrice);
      conditions.push(`price <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM sweets ${where} ORDER BY id`;

    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateSweet(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { name, category, price, quantity } = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      values.push(name);
      fields.push(`name = $${values.length}`);
    }
    if (category !== undefined) {
      values.push(category);
      fields.push(`category = $${values.length}`);
    }
    if (price !== undefined) {
      values.push(price);
      fields.push(`price = $${values.length}`);
    }
    if (quantity !== undefined) {
      values.push(quantity);
      fields.push(`quantity = $${values.length}`);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    values.push(id);
    const sql = `UPDATE sweets SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`;

    const result = await pool.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sweet not found" });
    }

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteSweet(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM sweets WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sweet not found" });
    }

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function purchaseSweet(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      client.release();
      return res.status(400).json({ message: "Invalid quantity" });
    }

    await client.query("BEGIN");

    const sweetResult = await client.query(
      "SELECT * FROM sweets WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (sweetResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ message: "Sweet not found" });
    }

    const sweet = sweetResult.rows[0];

    if (sweet.quantity < qty) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const updated = await client.query(
      "UPDATE sweets SET quantity = quantity - $1 WHERE id = $2 RETURNING *",
      [qty, id]
    );

    await client.query("COMMIT");
    client.release();
    res.json(updated.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    client.release();
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function restockSweet(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      client.release();
      return res.status(400).json({ message: "Invalid quantity" });
    }

    await client.query("BEGIN");

    const sweetResult = await client.query(
      "SELECT * FROM sweets WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (sweetResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ message: "Sweet not found" });
    }

    const updated = await client.query(
      "UPDATE sweets SET quantity = quantity + $1 WHERE id = $2 RETURNING *",
      [qty, id]
    );

    await client.query("COMMIT");
    client.release();
    res.json(updated.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    client.release();
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
}
