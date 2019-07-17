const expect = require('chai').expect;

const authMiddleware = require('../middlewares/isAuth');

it('should throw an error if no authorization header is set', () => {
  const req = {
    get: headerName => {
      return null;
    }
  };

  // calling the middleware function (req, res, nxt):
  expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('not authenticated.');
});
