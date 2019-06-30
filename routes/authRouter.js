const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const userModel = require('../models/userModel');
const isAuth = require('../middlewares/isAuth');

const router = express.Router();

router.put(
  '/signup',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value, { req }) => {
      return userModel.findOne({ email: value }).then(user => {
        if (user) {
          return Promise.reject('email address already exists!');
        }
      });
    }),
  body('password')
    .trim()
    .isLength({ min: 5 }),
  body('name')
    .trim()
    .not()
    .isEmpty(),
  authController.signup
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getStatus);

router.patch(
  '/status',
  isAuth,
  body('status')
    .trim()
    .not()
    .isEmpty(),
  authController.updateStatus
);

module.exports = router;
