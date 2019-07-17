const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middlewares/isAuth');

describe('Auth middleware', () => {
  it('should throw an error if no authorization header is set', () => {
    const req = {
      get: headerName => {
        return null;
      }
    };

    // calling the middleware function (req, res, nxt):
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('not authenticated.');
  });

  it('should throw an error if the auth header is only one string', () => {
    const req = {
      get: headerName => {
        return 'abc';
      }
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it('should throw an error is the token cannot be verified', () => {
    const req = {
      get: headerName => {
        return 'Bearer notreallyatoken';
      }
    };

    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it('should yield a userId after decoding the token', () => {
    const req = {
      get: headerName => {
        return 'Bearer notreallyatoken';
      }
    };

    // overinding jwt.verify function to bypass the real verification... stub
    // jwt.verify = () => {
    //   return { userId: 'dummyuserid' };
    // };

    // passing the object (package) which has the function you want to stub:
    sinon.stub(jwt, 'verify');
    jwt.verify.returns({ userId: 'anotherdummyuserid' });

    authMiddleware(req, {}, () => {});
    expect(req).to.have.property('userId');
    expect(jwt.verify.called).to.be.true;

    // restoring the original:
    jwt.verify.restore();
  });
});
