const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');

const User = require('./models/user.js')
const Bus = require('./models/Bus.js');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
// Connect to MongoDB
mongoose
  .connect('mongodb://127.0.0.1:27017/System', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error(err));


// Session Configuration
app.use(
  session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/System' }),
  })
);

// EJS Templating
app.set('view engine', 'ejs');
// Authentication Middleware
function isAuthenticated(role) {
  return (req, res, next) => {
    if (!req.session.userId || req.session.role !== role) {
      return res.redirect('/');
    }
    next();
  };
}

// Routes
// Landing Page
app.get('/', (req, res) => {
  res.render('index');
});

// Signup Page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Register User
// Register (Driver/Student)
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
  
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.render('register', { error: 'Username already exists. Please choose another one.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword, role });
      await newUser.save();
  
      res.redirect('/login');
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

// Login User
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user._id;
    req.session.role = user.role;
    if (user.role === 'driver') return res.redirect('/driver/dashboard');
    if (user.role === 'student') return res.redirect('/student/dashboard');
  }
  res.redirect('/login'); // Invalid login credentials
});

// Logout User
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Driver Dashboard
app.get('/driver/dashboard', isAuthenticated('driver'), async (req, res) => {
  const buses = await Bus.find({ driverId: req.session.userId });
  res.render('driver-dashboard', { buses });
});

// Add Bus
app.get('/driver/bus/add', isAuthenticated('driver'), (req, res) => {
  res.render('add-bus');
});

app.post('/driver/bus', isAuthenticated('driver'), async (req, res) => {
  const { busName, timings } = req.body;
  const newBus = new Bus({ busName, timings, driverId: req.session.userId });
  await newBus.save();
  res.redirect('/driver/dashboard');
});

// Edit Bus
app.get('/driver/bus/:id/edit', isAuthenticated('driver'), async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  res.render('edit-bus', { bus });
});

app.put('/driver/bus/:id', isAuthenticated('driver'), async (req, res) => {
  const { busName, timings } = req.body;
  await Bus.findByIdAndUpdate(req.params.id, { busName, timings });
  res.redirect('/driver/dashboard');
});

// Delete Bus
app.delete('/driver/bus/:id', isAuthenticated('driver'), async (req, res) => {
  await Bus.findByIdAndDelete(req.params.id);
  res.redirect('/driver/dashboard');
});

// Student Dashboard
app.get('/student/dashboard', isAuthenticated('student'), async (req, res) => {
  const buses = await Bus.find();
  res.render('student-dashboard', { buses });
});

// 404 Error Handling
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start Server
const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));