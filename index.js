var express = require('express');
var path = require('path');
var app = express();
var port = process.env.PORT || 3030;
var pg = require('pg');
var http = require('http');
var passport = require('passport');
var util = require('util');
var FacebookStrategy = require('passport-facebook').Strategy;

/*set up passport*/
passport.serializeUser(function(user,done){
  done(null,user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new FacebookStrategy({
    clientID: '236128690099176',
    clientSecret: 'c522eb05e7a97cd5e68739655df582c0',
    callbackURL: "https://evening-cove-32171.herokuapp.com/auth/facebook/callback"
  },
  function(token, refreshToken, profile, done) {
   
    process.nextTick(function () {
    
      return done(null, profile);
    });
  }
));

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));


/*For defaulting back to https*/
app.get('*',function(req,res,next){
  if(req.headers['x-forwarded-proto']!='https'&&process.env.NODE_ENV === 'production')
    res.redirect('https://'+req.hostname+req.url)
  else
    next() /* Continue to other routes if we're not redirecting */
});

/*default to ssl connections so heroku will allow us to use the apps database*/
pg.defaults.ssl = true;

var client = new pg.Client(process.env.DATABASE_URL);
client.connect();

/*Connect to the apps pg database on heroku*/
pg.connect(process.env.DATABASE_URL,function(err,client){
    if(err) throw err;
    console.log('Connected to postgres, getting schemas...');

    client.query('SELECT * FROM items;')
    .on('row', function(row) {
        console.log(JSON.stringify(row));
    });
});

//just testing
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use("/Online_Shopping/css", express.static(__dirname + '/Online_Shopping/css'));
app.use("/Online_Shopping/js", express.static(__dirname + '/Online_Shopping/js'));
app.use("/Online_Shopping/fonts", express.static(__dirname + '/Online_Shopping/fonts'));
app.use(express.static(__dirname + '/'));
app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
        }
    next();
    })

app.get('/', function(req, res){
    res.sendFile(__dirname+'/Online_Shopping/public/index.html');
});


//GET ALL ITEMS
app.get('/items',function(request,response){
    //SQL QUERY
    console.log('Getting items from the database');
    var query = client.query("SELECT * FROM items");
    var results = [];
    
    //Stream results back one row at a time
    query.on('row', function(row){
    console.log(row);        
    results.push(row);
        });
  
    //After all data is returned, close connection and return results
    query.on('end', function(){
        response.json(results);
        });
    });


// GET ALL MENS ITEMS
app.get('/catalogue/mens', function(request, response){
  var query = client.query("SELECT * FROM items WHERE cat_id = 2");
  var results = [];
  query.on('row', function(row){
    results.push(row);
  });
  query.on('end', function(){
    response.json(results);
  });
});

// GET ALL WOMENS ITEMS
app.get('/catalogue/womens', function(request, response){
  var query = client.query("SELECT * FROM items WHERE cat_id = 1");
  var results = [];
  query.on('row', function(row){
    results.push(row);
  });
  query.on('end', function(){
    response.json(results);
  });
});

//GET ALL CHILDREN ITEMS
app.get('/catalogue/kids', function(request, response){
    var query = client.query("SELECT * FROM items WHERE cat_id = 0");
  var results = [];
  query.on('row', function(row){
    results.push(row);
  });
  query.on('end', function(){
    response.json(results);
  });
});


//LOGIN
app.get('/login',ensureAuthenticated, function(request, response){
   res.render('login',{user: req.user});   
});

//REGISTER
app.put('/register', function(req, res){
    res.render('register',{user: req.user});
	console.log('Creating...\n');
    var query = client.query("INSERT INTO users (username, email, password) VALUES ('" + req.body.username + "','" + req.body.email + "','" + req.body.password + "')");
	res.send("Created\n");
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){   
  });

app.get('/auth/facebook/callback', 
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function(req, res) {
         return res.redirect('/');
        });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}



//Add headers
app.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
	next();

});

app.listen(port, function () {
    console.log('app listening on port ' + port);
    });


//TEST CASES

