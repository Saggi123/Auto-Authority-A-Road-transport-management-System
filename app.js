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
import cookieParser from 'cookie-parser';
import { diff } from 'semver';


app.use(session({
  secret: 'AutoAuthority2023',
  resave: true,
  saveUninitialized: true
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

app.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

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
//var salt = bcrypt.genSaltSync(12)
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

const validateSession = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}
// var user_id, password;
app.post('/login', async (req, res) => {
  const user_id = req.body.username;
  const password = req.body.password;
  // Retrieve the hashed password value from the database based on the entered user ID.
  const query = 'SELECT user_pass FROM user_register WHERE user_id = ?';
  const query2 = 'SELECT validity from user_license WHERE user_id = ?';
  
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
          req.session.user = user_id;
          req.session.save();
          console.log('Login Success!');
          // res.redirect('/index1', {});
          // res.render("index1", {user_id: user_id});
        } else {
          console.log('Incorrect Password!');
          res.render("login1", { msg: true });
        }
      } else {
        console.log('User not found!');
        res.render("login1", { msg: true });
      }
    }
    var date;
    pool.query(query2, [user_id], async (error, results, fields) => {
      if (error) {
        console.error('Error while fetching Date:', error);
        res.status(500).send('Internal Server Error');
      } 
      else{
        if(results.length == 1){
          date = results[0].validity;
          const formattedDate = date.toLocaleDateString('en-GB');
          var currentDate = new Date();
          currentDate = currentDate.toLocaleDateString('en-GB');
          function getNumberOfDays(date1, date2) {
            // Convert date strings to mm/dd/yyyy format
            const [day1, month1, year1] = date1.split('/');
            const [day2, month2, year2] = date2.split('/');
            const newDate1 = new Date(`${month1}/${day1}/${year1}`);
            const newDate2 = new Date(`${month2}/${day2}/${year2}`);
        
            // Calculate difference in days
            const oneDay = 1000 * 60 * 60 * 24;
            const diffInTime = newDate2.getTime() - newDate1.getTime();
            const diffInDays = Math.round(diffInTime / oneDay);
            return diffInDays;
        }
          
          const noOfDays = getNumberOfDays(currentDate, formattedDate);
          let displayMarquee = false;
          let expired = false;
          if (noOfDays <= 30 && noOfDays >= 1) {
            displayMarquee = true;
          }
          else if(noOfDays < 1){
            displayMarquee = true;
            expired = true;
          }
          res.render("index1", {noOfDays: noOfDays, user_id: user_id, displayMarquee: displayMarquee, expired: expired});
          
        }
      }
    })
  });
  // pool.query(query2, [user_id], async (error, results, fields) =>{
  //   if(error){
  //     console.error('Cannot fetch Date: ', error);
  //     res.status(500).send('Internal Server Error');
  //   }
  //   else {
  //     if (results.length > 0) {
  //       const date = results[0].validity;
  //       res.render('index1', {date : date});
  //     } else {
  //       console.log('User not found!');
  //       res.render("login1", { msg: true });
  //     }
  //   }
  // });
});
// Protected route that requires valid user session
app.get('/protected', validateSession, (req, res) => {
  console.log('This route requires a valid user session');
});

// Check if session is active before rendering index1 page
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.clearCookie('session-id');
      res.render('index');
    }
  });
});

// app.get("/index1", (req, res) => {
//   if (!req.session.user) {
//     res.redirect('login1');
//     return;
//   }
//   res.render("/");
// });

// // Logout route
// app.get("/logout", (req, res) => {
//   // Destroy the session
//   req.session.destroy(err => {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Internal Server Error');
//     } else {
//       res.redirect('/');
//     }
//   });
// });

// Start the server
app.listen(3004, () => {
  console.log('Server is running on port 3004');
});
