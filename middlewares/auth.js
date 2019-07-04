const jwt = require('jsonwebtoken');

module.exports = (req, res, nxt) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('not authenticated.');
    req.isAuth = false;
    return nxt();
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'somesecretword');
  } catch (err) {
    req.isAuth = false;
    return nxt();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return nxt();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;
  nxt();
};
