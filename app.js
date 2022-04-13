const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
// import user from "./src/routes/user";
const user = require('./src/routes/user');


require('dotenv/config');

const app = express();

var urlencoded_body_parser = bodyParser.urlencoded({
    extended: true
});

//MiddleWares 
app.use(bodyParser.json());
app.use(urlencoded_body_parser);
app.use(cors());
app.use(morgan('dev'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use('/', user);



//Routes 
app.get("/", (req, res) => {
    //sending a user a response 
    res.send("Hello!, you have reached the TrustHop API endpoint");
});



//Listening 
app.listen(process.env.PORT, () => { console.log(`Listening to PORT ${process.env.PORT}`); })