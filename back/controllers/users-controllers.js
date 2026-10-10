const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createUser(req, res) {
    const { name, email, password, is_admin } = req.body;
    bcrypt.hash(password, 10)
        .then(hashedPassword => {
            const newUser = new User({ name, email, password: hashedPassword, is_admin });
            return newUser.save();
        })
        .then(user => {
            user.password = undefined;
            res.status(201).json(user);
        })
        .catch(err => res.status(400).json({ message: err.message }));
}

function loginUser(req, res) {
    const { email, password } = req.body;
    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Email o contraseña incorrectos' });
            }
            return bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.status(401).json({ message: 'Email o contraseña incorrectos' });
                    }
                    const token = jwt.sign(
                        { id: user._id, email: user.email, is_admin: user.is_admin },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    user.password = undefined;
                    res.json({ ...user.toObject(), token });
                });
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

function getUsers(req, res) {
    User.find().select('-password')
        .then(users => res.json(users))
        .catch(err => res.status(500).json({ message: err.message }));
}

function getUserById(req, res) {
    User.findById(req.params.id).select('-password')
        .then(user => {   
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function updateUser(req, res) {
    const updateData = { ...req.body };
    delete updateData._id;

    const applyUpdate = (data) => User.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after' })
        .select('-password')
        .then(updatedUser => {
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(updatedUser);
        })
        .catch(err => res.status(500).json({ message: err.message }));

    if (updateData.password) {
        bcrypt.hash(updateData.password, 10)
            .then(hashedPassword => {
                updateData.password = hashedPassword;
                applyUpdate(updateData);
            })
            .catch(err => res.status(500).json({ message: err.message }));
    } else {
        delete updateData.password;
        applyUpdate(updateData);
    }
}

function deleteUser(req, res) {
    User.findByIdAndDelete(req.params.id)
        .then(deletedUser => {
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted' });
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = {
    createUser,
    loginUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};