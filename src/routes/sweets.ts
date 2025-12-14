import { Router } from "express";
import {
  createSweet,
  getSweets,
  searchSweets,
  updateSweet,
  deleteSweet,
  purchaseSweet,
  restockSweet
} from "../controllers/sweetController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireAdmin, createSweet);
router.get("/", getSweets);
router.get("/search", searchSweets);
router.put("/:id", requireAdmin, updateSweet);
router.delete("/:id", requireAdmin, deleteSweet);

router.post("/:id/purchase", purchaseSweet);
router.post("/:id/restock", requireAdmin, restockSweet);

export default router;
