const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const SETUP = require('../SETUP');
const userModel = require('../models/userModel');
const postModel = require('../models/postModel');
const authController = require('../controllers/authController');
const feedController = require('../controllers/feedController');

describe('testing feedController', () => {
  let dummyUser;
  before(done => {
    mongoose
      .connect(SETUP.MONGODB_TEST, { useNewUrlParser: true })
      .then(result => {
        const user = new userModel({
          email: 'dummy@email',
          password: 'dummypassword',
          name: 'dummyuser',
          posts: []
        });
        return user.save();
      })
      .then(user => {
        dummyUser = user;
        done();
      });
  });

  it('should add a created post to the posts of the creator', () => {
    const req = {
      body: {
        title: 'dummy title',
        content: 'dummy post content'
      },
      file: {
        path: 'dummy/file/path'
      },
      userId: dummyUser._id.toString()
    };
    const res = {
      status: function() {
        return this;
      },
      json: function() {
        return this;
      }
    };

    feedController
      .createPost(req, res, () => {})
      .then(savedUser => {
        expect(savedUser).to.have.property('posts');
        expect(savedUser.posts).to.have.length(1);
        done();
      });
  });

  after(done => {
    userModel
      .deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      });
  });
});
