const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const event = require('./routes/event');
const user = require('./routes/users');
const reward = require('./routes/rewards');
const achievement = require('./routes/achievements');
const recommendation = require('./routes/recommendations');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/events', event);
app.use('/users', user);
app.use('/rewards', reward);
app.use('/achievements', achievement);
app.use('/recommendations', recommendation);

app.use(cors());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
});

app.listen(8888, function() {
  console.log("Node server running on http://localhost:8888");
});

module.exports = app;
