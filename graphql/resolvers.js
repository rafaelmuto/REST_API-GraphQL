const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userModel = require('../models/userModel');
const postModel = require('../models/postModel');

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
  },

  login: async function({ email, password }) {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      const error = new Error('user not found.');
      error.code = 401;
      throw error;
    }
    const isEsqual = await bcrypt.compare(password, user.password);
    if (!isEsqual) {
      const error = new Error('password is incorrect.');
      throw error;
    }

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, 'somesecretword', { expiresIn: '1h' });
    return { token: token, userId: user._id.toString() };
  },

  createPost: async function({ postInput }, req) {
    const errors = [];
    if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
      errors.push({ message: 'title is invalid' });
    }
    if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
      errors.push({ message: 'content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const post = new postModel({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl
    });
    const createdPost = await post.save();
    // add post to user post

    return { ...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString(), updatedAt: createdPost.updatedAt.toISOString() };
  }
};
