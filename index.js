const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// 中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 数据库连接
mongoose.connect('mongodb://localhost/exercise-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 用户模型
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true },
  log: [{
    description: String,
    duration: Number,
    date: { type: Date, default: Date.now }
  }]
}));

// 创建用户
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 获取所有用户
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// 添加运动记录
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const exercise = {
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.params._id,
      { $push: { log: exercise } },
      { new: true }
    );

    res.json({
      _id: user._id,
      username: user.username,
      ...exercise,
      date: exercise.date.toDateString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 获取运动日志
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id);

    let log = user.log;
    if (from) log = log.filter(e => e.date >= new Date(from));
    if (to) log = log.filter(e => e.date <= new Date(to));
    if (limit) log = log.slice(0, Number(limit));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log: log.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
