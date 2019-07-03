const bcrypt = require('bcryptjs');
const validator = require('validator');

const userModel = require('../models/userModel');

module.exports = {
  createUser: async function(args, req) {
    const email = args.userInput.email;
    const password = args.userInput.password;
    const name = args.userInput.name;

    // validation:
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'email is invalid' });
    }
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
      errors.push({ message: 'password is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      const error = new Error('User already exists');
      throw error;
    }
    const hasedPw = await bcrypt.hash(password, 12);
    const user = new userModel({
      email: email,
      name: name,
      password: hasedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  }
};
