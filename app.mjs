import express from 'express';
import bcrypt from 'bcrypt';
import mysql from 'mysql';
import path from 'path';
import url from "url";
import session from 'express-session';

// Create an Express app
const app = express();
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bodyParser from 'body-parser';


app.use(session({
  secret: 'AutoAuthority2023',
  resave: false,
  saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'autoauthority.cikjgc7xrldu.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'adminadmin',
  database: 'AutoAuthority',
});

// Set up the Handlebars view engine
app.set('view engine', 'hbs');

// Parse request bodies as JSON
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));
console.log(__dirname);
// Render the index page
app.get("/", (req, res) => {
     
  res.render("index");
});
app.get("/register",(req,res)=>{
  res.render("register1",{});
})
app.get("/login",(req,res)=>{
  res.render("login1");
});
var f_name, l_name, dob, age, gender
app.post('/register1', async (req, res) => {
  f_name = req.body.fname
  l_name = req.body.lname
  dob = req.body.dob
  gender = req.body.gender

  //calculating age from dob
  var tempDate = new Date(dob);
  var formattedDate = [tempDate.getDate(), tempDate.getMonth() + 1, tempDate.getFullYear()].join('/');
  const dobParts = formattedDate.split("/");
  const dobDay = parseInt(dobParts[0], 10);
  const dobMonth = parseInt(dobParts[1], 10) - 1; // Note: months are 0-indexed in JavaScript
  const dobYear = parseInt(dobParts[2], 10);
  const dobDate = new Date(dobYear, dobMonth, dobDay);

  // Calculate the age in years
  const ageDiffMs = Date.now() - dobDate.getTime();
  const ageDate = new Date(ageDiffMs); // miliseconds from epoch
  age = Math.abs(ageDate.getUTCFullYear() - 1970);
   if(age<18)
   res.render("register1",{msg:true})
   else
  res.render("register2",{});
});

var phone, email, address_p, address_s
app.post('/register2', async (req, res) => {
  phone = req.body.phone
  email = req.body.email
  address_p = req.body.address_p
  address_s = req.body.address_s
  res.render("register3")
});

var user_id, password, c_password, hash
var salt = bcrypt.genSaltSync(12)
app.post('/register3', async (req, res) => {
  user_id = req.body.userid
  password = req.body.password
  c_password = req.body.cpassword
  if(password === c_password){
    hash = await bcrypt.hash(password, 12)
    const query = 'INSERT INTO user_register (f_name, l_name, dob, age, gender, phone, email, address_p, address_s, user_id, user_pass) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    pool.query(query, [f_name, l_name, dob, age, gender, phone, email, address_p, address_s, user_id, hash], (error, results, fields) => {
      if (error) {
        console.error('Failed to create user:', error);
        res.status(500).send('Failed to create user');
      } else {
        console.log('User created successfully!');
        // res.status(200).send('User created successfully!');
        res.render("login1");
      }
    });
  }
  else{
    console.log('Passwords Do Not Match!');
    res.render("register3",{msg:true});
    return false;
  }
});

// var user_id, password;
app.post('/newuser', async (req, res) => {
  const user_id = req.body.username;
  const password = req.body.password;
  // Retrieve the hashed password value from the database based on the entered user ID.
  const query = 'SELECT user_pass FROM user_register WHERE user_id = ?';
  pool.query(query, [user_id], async (error, results, fields) => {
    if (error) {
      console.error('Error while retrieving user password:', error);
      res.status(500).send('Internal Server Error');
    } else {
      if (results.length > 0) {
        const storedPassword = results[0].user_pass;
        // Use the retrieved hashed password value and the entered plaintext password to compare them using the bcrypt.compare function.
        const isMatch = await bcrypt.compare(password, storedPassword);
        if (isMatch) {
          console.log('Login Success!');
          req.session.user_id = user_id; //store user_id in session
          res.render("index1", {user_id: user_id});
        } else {
          console.log('Incorrect Password!');
          res.render("login1", { msg: true });
        }
      } else {
        console.log('User not found!');
        res.render("login1", { msg: true });
      }
    }
  });
});

app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});

function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}
app.get('/index1', requireLogin, function(req, res) {
  res.render('index');
});


// Start the server
app.listen(3004, () => {
  console.log('Server is running on port 3004');
});
