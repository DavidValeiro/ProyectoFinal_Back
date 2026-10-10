const Product = require('../models/product');

function createProduct(req, res) {
    const newProduct = new Product(req.body);
    newProduct.save()
        .then(product => res.status(201).json(product))
        .catch(err => res.status(400).json({ message: err.message }));
}

function getProducts(req, res) {
    Product.find()
        .then(products => res.json(products))
        .catch(err => res.status(500).json({ message: err.message }));
}

function getProductById(req, res) {
    Product.findById(req.params.id)
        .then(product => {   
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function updateProduct(req, res) {
    Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
        .then(updatedProduct => {
            if (!updatedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json(updatedProduct);
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

function deleteProduct(req, res) {
    Product.findByIdAndDelete(req.params.id)
        .then(deletedProduct => {
            if (!deletedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.json({ message: 'Product deleted' });
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
