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

  app.set('views', __dirname);
  app.set('view engine', 'ejs');
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + 'public'));


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


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use("/public/css", express.static(__dirname + '/public/css'));
app.use("/public/js", express.static(__dirname + '/public/js'));
app.use("/public/fonts", express.static(__dirname + '/public/fonts'));
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
 // res.sendFile(__dirname+'/pages/index.ejs');
  res.render('pages/index');
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


app.get('/mens', function(request, response){
  var results = [];
  var query = client.query("SELECT * FROM items WHERE cat_id = 2;");

  //console.log(query.results);
  
  // var results = [];
  query.on('row', function(row){
    //console.log(row);    
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/mens', {
      results: results
    });  
  });

  //var results1 = JSON.stringify(results);

  // query.on('end', function(){
  //   response.json(results);
  // });  
});


// GET ALL WOMENS ITEMS
app.get('/womens', function(request, response){
  var results = [];
  var query = client.query("SELECT * FROM items WHERE cat_id = 1;");

  //console.log(query.results);
  
  // var results = [];
  query.on('row', function(row){
    //console.log(row);    
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/womens', {
      results: results
    });  
  });

  //var results1 = JSON.stringify(results);

  // query.on('end', function(){
  //   response.json(results);
  // });  
});

//GET ALL CHILDREN ITEMS
app.get('/kids', function(request, response){
  var results = [];
  var result_itemid = [];

  var query = client.query("SELECT * FROM items WHERE cat_id = 0;");

  //console.log(query.results);
  
  // var results = [];
  query.on('row', function(row){
    console.log(row);    
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/kids', {
      results: results
    });  
  });
  // var query = client.query("SELECT * FROM items WHERE cat_id = 0", function(err, result){
  //   var q = JSON.stringify(result.rows);
  //   var qResult = JSON.parse(q);
    

  //   for(var i = 0; i < qResult.length; i++){
  //     result_name[i] = qResult[i].name;
  //     result_itemid[i] = qResult[i].item_id;
  //     console.log("NAME IS: " + result_name[i]);
  //     console.log("ID IS: " + result_itemid[i]);

  //   }  

  //   response.render('pages/kids', {
  //     result_name: result_name,
  //     result_itemid: result_itemid
  //   }); 
    
  // }); 
  
  // var results = [];
  // query.on('row', function(row){
  //   results.push(row);
    
  // });
  // query.on('end', function(){
  //   results.forEach(function(data){
  //     console.log("NAME IS: " + data.name);
  //   });
  // });
  

  // response.render('pages/kids', {
  //   results: results
  // });
});


//LOGIN
app.get('/login',/*,ensureAuthenticated,*/ function(request, response){
    var query = client.query("SELECT * FROM users WHERE username = '" + request.body.username + "' AND password = '" + request.body.password + "'");  
 /*   if(query == "null"){
        response.send(0);
    }
    else{
        response.send(1);
    }*/
    response.render('pages/login'/*,{user: request.user}*/);      
});

//PRODUCTS
app.get('/products', function(request, response){
  console.log("BODY: "+request.query.name);
  var results = [];

  var query = client.query("SELECT * FROM items WHERE name = '" + request.query.name +"';");

  query.on('row', function(row){
    console.log(row);    
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/products', {
      results: results
    });  
  });
  // var query = client.query("SELECT * FROM items WHERE name = '" + request.query.name +"';", function(err, result){
  //   var q = JSON.stringify(result.rows);
  //   var qResult = JSON.parse(q);

  //   for(var i = 0; i < qResult.length; i++){
  //     des[i] = qResult[i].description;
  //     price[i] = qResult[i].price;
  //   }

  //   response.render('pages/products', {
  //   des: des,
  //   price: price
  // });
    
  // });
  
});

//REGISTER
app.put('/register', function(req, res){
    
	console.log('Creating...\n');
    var query = client.query("INSERT INTO users (username, email, password) VALUES ('" + req.body.username + "','" + req.body.email + "','" + req.body.password + "')");
	//res.send("Created\n");
    res.render('pages/register'/*,{user: req.user}*/);
});

app.get('/register',function(request,response){
    //SQL QUERY
    console.log('Getting items from the database');
    var query = client.query("SELECT * FROM users");
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
  res.redirect('/login');
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

