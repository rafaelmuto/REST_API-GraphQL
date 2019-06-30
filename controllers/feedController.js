const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const postModel = require('../models/postModel');
const userModel = require('../models/userModel');
const io = require('../socket');

exports.getPosts = async (req, res, nxt) => {
  console.log('==> feedController: getPosts');

  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await postModel.find().countDocuments();
    const posts = await postModel
      .find()
      .populate('creator')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({ message: 'Fetched posts successfully.', posts: posts, totalItems: totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
  }
};

exports.createPost = async (req, res, nxt) => {
  console.log('==> feedController: createPost');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path;

  const post = new postModel({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });

  try {
    await post.save();
    const user = await userModel.findById(req.userId);

    user.posts.push(post);
    await user.save();

    io.getIO().emit('posts', { action: 'create', post: { ...post._doc, creator: { _id: req.userId, name: user.name } } });

    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: { _id: user._id, name: user.name }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
  }
};

exports.getPost = async (req, res, nxt) => {
  console.log('==> feedController: getPost');
  const postId = req.params.postId;
  try {
    const post = await postModel.findById(postId);

    if (!post) {
      const err = new Error('Could not fund post.');
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ message: 'Post fetched.', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
  }
};

exports.updatePost = async (req, res, nxt) => {
  console.log('==> feedController: updatePost');

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await postModel.findById(postId).populate('creator');

    if (!post) {
      const err = new Error('Could not fund post.');
      err.statusCode = 404;
      throw err;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = post.save();

    io.getIO().emit('posts', { action: 'update', post: result });

    res.status(200).json({ message: 'Post updated.', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
  }
};

exports.deletePost = async (req, res, nxt) => {
  console.log('==> feedControler: deletePost');

  const postId = req.params.postId;
  try {
    const post = await postModel.findById(postId);

    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (!post) {
      const err = new Error('Could not fund post.');
      err.statusCode = 404;
      throw err;
    }
    clearImage(post.imageUrl);
    await postModel.findByIdAndRemove(postId);

    const user = await userModel.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    io.getIO().emit('posts', { action: 'delete', post: postId });

    res.status(200).json({ message: 'deleted post.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    nxt(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
