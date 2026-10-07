const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {authenticateJWT, isAdmin} = require('../middleware/authJwt');

// Advanced list with filters and pagination (for admin)
router.get('/list/advanced', authenticateJWT, isAdmin, orderController.getOrdersList);

// Get participants of an order
router.get('/:orderId/participants', orderController.getOrderParticipants);

// CRUD endpoints
router.post('/', orderController.createOrder);
router.get('/', authenticateJWT, orderController.getOrdersList);
router.get('/my', authenticateJWT, orderController.getMyOrders);
router.get('/:code', authenticateJWT, orderController.getOrderById);
router.put('/:id', authenticateJWT, isAdmin, orderController.updateOrder);
router.delete('/:id', authenticateJWT, isAdmin, orderController.deleteOrder);

module.exports = router;

