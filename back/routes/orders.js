const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const { createOrder, getOrders, getOrderById, updateOrder, deleteOrder } = require('../controllers/orders-controllers');

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
