const errorHandler = (err, req, res, next) => {
    res.status(500).json({ message: err.message || 'Internal server error' });
};

module.exports = errorHandler;