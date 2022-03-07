const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

mongoose.connect(process.env.MONGO_URI);

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});

const userSchema = new mongoose.Schema({
  username: String,
  date: String,
  duration: Number,
  description: String,
  count: { type: Number, default: 0 },
  log: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const user = new User({ username: username });
  user.save((err, data) => {
    res.json(data);
  });
});

app.get('/api/users', (req, res) => {
  User.find({}).exec((err, data) => {
    res.json(data);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const actualTime = new Date();

  const description = req.body.description;
  const date = req.body.date
    ? new Date(req.body.date).toDateString()
    : actualTime.toDateString();
  const duration = +req.body.duration;
  const id = req.params['_id'];

  User.findOneAndUpdate(
    { _id: id },
    { description: description, date: date, duration: duration },
    { returnDocument: 'after' },
    (err, data) => {
      data.log.push({
        description: description,
        duration: duration,
        date: date
      });
      data.count += 1;
      data.save();
      res.json({
        username: data.username,
        description: data.description,
        duration: data.duration,
        date: data.date,
        _id: data['_id']
      });
    }
  );
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params['_id'];

  const limit = +req.query.limit;
  const fromDate = new Date(req.query.from);
  const toDate = new Date(req.query.to);

  User.findOne({ _id: id }, (err, data) => {
    let logs = data.log;

    if (fromDate && toDate) {
      logs.filter(el => {
        const tempDate = new Date(el.date);
        return tempDate >= fromDate && tempDate <= toDate;
      });
    }

    if (limit) {
      for (let i = 1; i <= limit; i++) {
        logs.pop();
      }
    }

    logs = data.log.map(el => ({
      ...el.toJSON(),
      date: new Date(el.date).toDateString()
    }));

    res.json({
      username: data.username,
      count: data.count,
      log: logs
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
