const bcrypt = require('bcryptjs');

const userModel = require('../models/userModel');

module.exports = {
  createUser: async function(args, req) {
    const email = args.userInput.email;
    const password = args.userInput.password;
    const name = args.userInput.name;

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
