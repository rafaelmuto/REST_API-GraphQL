const jwt = require('jsonwebtoken');

module.exports = (req, res, nxt) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'secret_word');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  nxt();
};
