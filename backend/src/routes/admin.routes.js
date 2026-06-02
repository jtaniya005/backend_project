const router = require("express").Router();
const { getAllUsers, updateUserRole, deleteUser, getStats } = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { mongoIdValidator } = require("../middleware/validate");

router.use(authenticate, authorize("admin"));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Platform statistics (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Stats }
 *       403: { description: Forbidden }
 */
router.get("/stats", getStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users list }
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200: { description: Role updated }
 */
router.patch("/users/:id/role", mongoIdValidator, updateUserRole);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 */
router.delete("/users/:id", mongoIdValidator, deleteUser);

module.exports = router;