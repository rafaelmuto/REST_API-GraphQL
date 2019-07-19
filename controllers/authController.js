const userModel = require('../models/userModel');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, nxt) => {
  console.log('==> authController: signup');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then(hashedPw => {
      const user = new userModel({
        email: email,
        password: hashedPw,
        name: name
      });
      return user.save();
    })
    .then(result => {
      res.status(201).json({ message: 'user created!', userId: result._id });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      nxt(err);
    });
};

exports.login = async (req, res, nxt) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      const error = new Error('a user with this email could not be found.');
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Wrong password');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign({ email: loadedUser.email, userId: loadedUser._id.toString() }, 'secret_word', { expiresIn: '1h' });
    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    return;
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
    return err;
  }
};

exports.getStatus = async (req, res, nxt) => {
  console.log('==> authController: getStatus');

  const userId = req.userId;
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      const error = new Error('user not found!');
      error.statusCode = 404;
      throw error;
    }
    return res.status(200).json({ message: 'user status successfully recovered', status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
    return err;
  }
};

exports.updateStatus = (req, res, nxt) => {
  const newStatus = req.body.status;

  userModel
    .findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('user not found!');
        error.statusCode = 404;
        throw error;
      }
      user.status = newStatus;
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'user status updated' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      nxt(err);
    });
};
