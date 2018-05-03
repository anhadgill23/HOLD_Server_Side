const express = require("express");
// const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const router = express.Router();

router.get('/user', function (req, res, next) {
  res.send({user: 'Hello Dev!'});
  // res.json({ user: 'tobi' })
});

// app.listen(8080, function () {
//   console.log('Dev app listening on port 8080!');
// });

module.exports = router;


// const express = require('express');

// const app = express();
// const port = process.env.PORT || 8080;

// app.get('/api/hello', (req, res) => {
//   res.send({ express: 'Hello From Express' });
// });

// app.listen(port, () => console.log(`Listening on port ${port}`));