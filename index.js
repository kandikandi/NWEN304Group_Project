var express = require('express');
var path = require('path');
var app = express();
var port = process.env.PORT || 3030;
var pg = require('pg');
var http = require('http');
var passport = require('passport');
var util = require('util');
var FacebookStrategy = require('passport-facebook').Strategy;
//var session = require('express-session');

  app.set('views', __dirname);
  app.set('view engine', 'ejs');
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));
 /* app.use(session({
     secret: 'itsasecret',
     cookie: { maxAge: 60000}
    }));
     


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

/*set up passport for facebook login*/
passport.use('facebook', new FacebookStrategy({
    clientID: '236128690099176',
    clientSecret: 'c522eb05e7a97cd5e68739655df582c0',
    callbackURL: "https://evening-cove-32171.herokuapp.com/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
  },

  function(access_token, refreshToken, profile, done) {
     process.nextTick(function () {

        var user = client.query("SELECT * FROM users WHERE username = '" + profile.id + "';", callback);

        function callback(err,res){
         
            if(res.rows[0]!=undefined){
                 console.log("in if statement");
                 return done(null,profile);
            }
            else{
                 console.log("in the else statement");
                 client.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",[profile.id, profile.emails[0].value, 'facebook']); 
                 return done(null,profile);      
            }   
         }              
                       
     });
  }
));

app.get('/auth/facebook', 
    passport.authenticate('facebook',{ scope: 'email'}));

app.get('/auth/facebook/callback', 
        passport.authenticate('facebook', { 
        successRedirect: '/',        
        failureRedirect: '/login' 
        })
    );

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
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
app.get('/login', function(request, response){
 
  response.render('pages/login', { user: request.user }); 
     
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
  // console.log('Creating...\n');
  // var query = client.query("INSERT INTO todo (task, isDone) VALUES ('" + req.body.task + "',False)");
  // res.send("Created\n");

  
  //console.log("USER DETAILS" + req.body.userdetails);
  var user_details = req.body.userdetails;
  console.log('Clicked register button!');
  console.log("SUCCESS: " + success);
  console.log('USERNAME: ' + user_details.username)
  console.log('Creating new user');
  //console.log('USERNAME: ' + req.body.userdetails);
  var query = client.query("INSERT INTO users (username, email, password) VALUES ('" + user_details.username + "','" + user_details.email + "','" + user_details.password + "')",
    function(error, response){
      if(error){
        res.status(500).send("Internal Server Error when adding ");   
      }else{
        success = true;
        console.log("SUCCES: " + success);
        console.log(user_details.username + " has been added to users");        
      }
      if(success){
        console.log("REDIRECTING");
        res.send();
      }
    });

  

  //res.render('pages/register',{user: req.user});
  //console.log(req.body.task + " has been added to users");
  // res.render('pages/register', {
  //   success: success
  // });
  //res.redirect('/');
});

app.get('/register', function(req, res){
  console.log("In register page!");
  // var query = client.query("INSERT INTO todo (task, isDone) VALUES ('" + req.body.task + "',False)");
  // res.send("Created\n");
  res.render('pages/register',{
    success: success
  });
});

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

