const Order = require('../models/order');
const Product = require('../models/product');

async function calculateTotalPrice(products) {
    let total = 0;
    for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
            throw new Error(`Product with ID ${item.product} not found`);
        }
        total += product.price * item.quantity;
    }
    return total;
}

async function createOrder(req, res) {
    try {
        const { user, products, orderStatus } = req.body;
        const totalPrice = await calculateTotalPrice(products);

        const newOrder = new Order({ user, products, totalPrice, orderStatus });
        await newOrder.save();

        await Promise.all(
            products.map(item =>
                Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }, { returnDocument: 'after' })
            )
        );

        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function getOrders(req, res) {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'title price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getOrderById(req, res) {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products.product', 'title price');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateOrder(req, res) {
    const { user, products, orderStatus } = req.body;
    const totalPrice = await calculateTotalPrice(products);
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) {
        return res.status(404).json({ message: 'Order not found' });
    }
    await Promise.all(
        oldOrder.products.map(item =>
            Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } },
                { returnDocument: 'after' }
            )
        )
    );
    Order.findByIdAndUpdate(req.params.id, { user, products, totalPrice, orderStatus }, { returnDocument: 'after' })
        .then(updatedOrder => {
            if (!updatedOrder) {
                return res.status(404).json({ message: 'Order not found' });
            }
            return Promise.all(
                updatedOrder.products.map(item =>
                    Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock: -item.quantity } },
                        { returnDocument: 'after' }
                    )
                )
            ).then(() => updatedOrder);
        })
        .then(order => res.status(201).json(order))
        .catch(err => res.status(500).json({ message: err.message }));
}

async function deleteOrder(req, res) {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await Promise.all(
            deletedOrder.products.map(item =>
                Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { returnDocument: 'after' })
            )
        );

        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder
};