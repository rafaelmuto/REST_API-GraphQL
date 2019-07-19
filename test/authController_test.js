const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const SETUP = require('../SETUP');
const userModel = require('../models/userModel');
const authController = require('../controllers/authController');

describe('testing authController - Login', () => {
  it('should throw an error with code 500 if accessing the database fails', done => {
    //stubing userModel:
    sinon.stub(userModel, 'findOne');
    userModel.findOne.throws();

    // dummy loggin:
    const req = {
      body: {
        email: 'dummy@email.com',
        password: 'dummypassword'
      }
    };

    authController
      .login(req, {}, () => {})
      .then(result => {
        expect(result).to.be.an('error');
        expect(result).to.have.property('statusCode', 500);
        done();
      });

    userModel.findOne.restore();
  });

  it('should send a response with a valid status for an existing user', function(done) {
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
        const req = { userId: user._id };
        const res = {
          statusCode: 500,
          userStatus: null,
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            this.userStatus = data.status;
            return this;
          }
        };

        authController
          .getStatus(req, res, () => {})
          .then(res => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.userStatus).to.be.equal('I am new!');
            done();
          });
      })
      .catch(err => {
        console.log(err);
      });
  });
});
