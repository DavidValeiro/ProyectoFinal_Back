const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    badge: { type: String },
    category: { type: String, required: true },
    description: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviews: { type: Number, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    specs: [{ icon: String, label: String, value: String }],
    image: { type: String, required: true },
    images: [{ type: String }]
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
