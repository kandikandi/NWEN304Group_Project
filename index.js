var express = require('express');
var path = require('path');
var app = express();
var port = process.env.PORT || 3030;
var pg = require('pg');
var http = require('http');
var passport = require('passport');
var util = require('util');
var HerokuStrategy = require('passport-heroku').Strategy;

var HEROKU_CLIENT_ID = 123456; //process.env.HEROKU_CLIENT_ID;
var HEROKU_CLIENT_SECRET = 'abc123';//process.env.HEROKU_CLIENT_SECRET;

/*set up passport*/
passport.serializeUser(function(user,done){
  done(null,user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new HerokuStrategy({
    clientID: HEROKU_CLIENT_ID,
    clientSecret: HEROKU_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/heroku/callback"
  },
  function(accessToken, refreshToken, profile, done) {
   
    process.nextTick(function () {
        
      return done(null, profile);
    });
  }
));

//app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.use(express.logger());
//  app.use(express.cookieParser());
//  app.use(express.bodyParser());
  //app.use(express.methodOverride());
//  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
 // app.use(app.router);
  app.use(express.static(__dirname + '/public'));
//});

/*For defaulting back to https*/
app.get('*',function(req,res,next){
  if(req.headers['x-forwarded-proto']!='https'&&process.env.NODE_ENV === 'production')
    res.redirect('https://'+req.hostname+req.url)
  else
    next() /* Continue to other routes if we're not redirecting */
});

/*default to ssl connections so heroku will allow us to use the apps database*/
pg.defaults.ssl = true;

/*var client = new pg.Client(process.env.DATABASE_URL);
client.connect();

/*Connect to the apps pg database on heroku*/
/*pg.connect(process.env.DATABASE_URL,function(err,client){
    if(err) throw err;
    console.log('Connected to postgres, getting schemas...');

    client.query('SELECT * FROM items;')
    .on('row', function(row) {
        console.log(JSON.stringify(row));
    });
});*/

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
	// console.log('Creating...\n');
	// var query = client.query("INSERT INTO todo (task, isDone) VALUES ('" + req.body.task + "',False)");
	// res.send("Created\n");
});

app.get('/auth/heroku',
  passport.authenticate('heroku'),
  function(req, res){
    // The request will be redirected to Heroku for authentication, so this
    // function will not be called.
  });

app.get('/auth/heroku/callback', 
        passport.authenticate('heroku', { failureRedirect: '/login' }),
        function(req, res) {
          res.redirect('/');
        });

/*app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});*/

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}


// //UPDATE TASK
// app.post('/update',function(req, res){
// 	console.log('Updating...\n');
// 	var query = client.query("UPDATE todo SET isDone = NOT isDone WHERE task = '" + req.body.task + "'");
// 	res.send("Updated\n");
// });

// //DELETE TASK
// app.delete('/del', function(req, res){
// 	console.log('Deleting...\n');
// 	var query = client.query("DELETE FROM todo WHERE task = '" + req.body.task +"'");
// 	res.send("Deleted\n");
// });

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
// GET: curl -H "Content-Type: application/json" -X GET 130.195.4.166:8080/all_tasks
// CREATE: curl -H "Content-Type: application/json" -X PUT -d '{"task":"test task"}' 130.195.4.166:8080/create
// UPDATE: curl -H "Content-Type: application/json" -X POST -d '{"task":"test task", "isDone":"true"}' 130.195.4.166:8080/update
// REMOVE: curl -H "Content-Type: application/json" -X DELETE -d '{"task":"hello"}' 130.195.4.166:8080/del
