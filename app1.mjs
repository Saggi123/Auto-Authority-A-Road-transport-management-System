import express from 'express';
import bcrypt from 'bcrypt';
import mysql from 'mysql';
import bodyParser from 'body-parser';

const app=express();
app.use(bodyParser.urlencoded({extended:true}));//lets us parse incoming requests with url encoded payload
app.use(bodyParser.json());

const conpool=mysql.createConnection({
    connectionLimit:10,
    host: 'autoauthority.cikjgc7xrldu.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'adminadmin',
    database:'AutoAuthority',
});

app.set('view engnine','hbs');
app.use(express.static('public'));

app.post('/',(req,res)=>{
    res.render("register1",{});
});

var f_name,l_name,dob,gender;
app.post('/register1',async(req,res)=>{
    f_name=req.body.fname;
    l_name=req.b
})
app.listen(3004,()=>{
    console.log("Server is running on port 3004");
})