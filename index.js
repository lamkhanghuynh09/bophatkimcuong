const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'freefire_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');

// Load user data
let users = [];
const usersFilePath = path.join(__dirname, 'users.json');
if (fs.existsSync(usersFilePath)) {
  users = JSON.parse(fs.readFileSync(usersFilePath));
}

// Middleware to check login
function checkLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/');
  next();
}

// Trang chủ giả lập (ví dụ home)
app.get('/', (req, res) => {
  res.send('<h2>Chào mừng! Vui lòng đăng nhập trước.</h2>');
});

// Trang đổi kim cương
app.get('/exchange', checkLogin, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.render('exchange', { user, message: null, error: null });
});

app.post('/exchange', checkLogin, (req, res) => {
  const amount = parseInt(req.body.amount);
  const user = users.find(u => u.id === req.session.userId);

  if (isNaN(amount) || amount < 200000) {
    return res.render('exchange', { user, message: null, error: 'Phải nhập ít nhất 200.000 xu.' });
  }

  if (user.coins < amount) {
    return res.render('exchange', { user, message: null, error: 'Bạn không đủ xu.' });
  }

  const diamondsToAdd = Math.floor(amount / 200000) * 1800;
  user.coins -= amount;
  user.diamonds = (user.diamonds || 0) + diamondsToAdd;

  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  res.render('exchange', { user, message: `Đổi thành công ${diamondsToAdd} kim cương!`, error: null });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
