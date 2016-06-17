var express = require('express');
var path = require('path');
var app = express();
var port = process.env.PORT || 3030;
var pg = require('pg');
var http = require('http');
var passport = require('passport');
var session = require('express-session');
var util = require('util');
var bodyParser = require('body-parser');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;

  app.set('views', __dirname);
  app.set('view engine', 'ejs'); 
  app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
  app.use(bodyParser.json()) // parse application/json
 /*for storing session information*/
  app.use(session({
        cookie: {
            path    : '/',
            httpOnly: false,
            maxAge  : 15*60*1000//15 minute timeout
        },
        secret: 'sssshhhhhhhh',
        saveUninitialized: true,
        resave: true       
  }));
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

/*Set up passport for local login*/
passport.use('local-login', new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true   
  },  
  function(username, password, done) {
        console.log("USER is " + username + " PASSOWRD is " + password);
       // console.log("USER is " + req.username + " PASSOWRD is " + req.password);
        var user = client.query("SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "';", callback);  
        function callback(err,res){
             if(res.rows[0]!=undefined){                      
                 return done(null,user);
            }
            else{
                console.log("login failed");
                return done(null,false);
            }          
        } 
     }     
));

app.post('/login/auth', function(req,res, next){
    passport.authenticate('local-login',function(err,user,info){
        if (err) { return next(err); }
        if(user){
            req.session.username = "'" + req.user.username + "'";
            req.session.save();
            res.redirect('/profile');
        }
        else{
            console.log("Login unsucessful");
            res.send({redirect: '/'});
        }
    })(req,res,next);
});
  
/*Set up passport for local registration*/
passport.use('local-register', new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true
  },

  function(req, username, password, done) {
    process.nextTick(function() {
        console.log("USER is " + username + " PASSOWRD is " + password);
        console.log("USER is " + req.username + " PASSOWRD is " + req.password);
        var user = client.query("SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "';", callback);  
        function callback(err,res){
         
            if(res.rows[0]!=undefined){   
                 req.session.username = "'"+username+"'";   
                 req.session.save();     
                 console.log(req.session.username);     
                 return done(null,user);
            }
            else{
                console.log("registration failed");
                return done(null,false);
            }          
        }
    });

}));

app.put('/register', passport.authenticate('local-register', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/register', // redirect back to the register page if there is an error        
    }));

/*set up passport for facebook login*/
passport.use('facebook', new FacebookStrategy({
    clientID: '236128690099176',
    clientSecret: 'c522eb05e7a97cd5e68739655df582c0',
    callbackURL: "https://evening-cove-32171.herokuapp.com/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name'],
    passReqToCallback: true
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
        failureRedirect: '/login' }),
        (req, res)=>{          
        console.log("Actually do stuff in here");
        req.session.username = req.user.id;             
        res.redirect('/profile');
        }
        
    );

//Logout function
app.get('/logout', function(req, res){
   req.session.destroy(function(err) {
      if(err){
        console.log(err);
      }
      else{
        res.clearCookie(session.username);
        res.redirect('/');
      }
    })
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

// GET ALL MENS ITEMS
app.get('/mens', function(request, response){
  var results = [];
  var query = client.query("SELECT * FROM items WHERE cat_id = 2;");

  query.on('row', function(row){
 
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/mens', {
      results: results
    });  
  });

});


// GET ALL WOMENS ITEMS
app.get('/womens', function(request, response){
  var results = [];
  var query = client.query("SELECT * FROM items WHERE cat_id = 1;");

  query.on('row', function(row){
   
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/womens', {
      results: results
    });  
  });


});

//GET ALL CHILDREN ITEMS
app.get('/kids', function(request, response){
  var results = [];
  var result_itemid = [];

  var query = client.query("SELECT * FROM items WHERE cat_id = 0;");

  query.on('row', function(row){
    console.log(row);    
    results.push(row);
  });

  query.on('end', function(row){
    response.render('pages/kids', {
      results: results
    });  
  });
});


//LOGIN
app.get('/login', function(request, response){  
  response.render('pages/login', { user: request.user });   
     
});

/*app.post('/login/check', function(request, response){

  var user_details = request.body.userdetails;
    
  var success = false;
  console.log("here");
  var query = client.query("SELECT * FROM users WHERE username = '"+ user_details.username +"' AND password = '" + user_details.password +"';",
  function (err,res){
       console.log("AND here");
       if(res.rows[0]!=undefined){
          success = true;
       }       
    });
    query.on('end',function(){        
     if(success==true){
        console.log("SETTING COOKIE AND REDIRECTING.....");
        request.session.username = "'" + user_details.username + "'"; 
        console.log("User is : " + request.session.username);  
        request.session.save()     
     }
     else{
     console.log("JUST REDIRECTING....."); 
     }
    });
});*/

//AUTHENTICATE
app.get('/profile/auth', function(req, res, next){
    if(req.session && req.session.username!=undefined){    
        res.redirect('/profile');
    }
    else{
    res.redirect('/login');
    }
});


//PROFILE
app.get('/profile', function(req, res){


var str = req.session.username;
console.log(str);
if(str!=undefined){
    console.log(str);
    var user = str.slice(1, -1);
    console.log(user);
}else{
    var user = "";
}
var query = client.query("SELECT * FROM users WHERE username = '" + user + "';");
var results = [];

  query.on('row', function(row){
    console.log(row);    
    results.push(row);    
  });

  query.on('end', function(row){
    res.render('pages/profile', {
      results: results
    });
  });

});

//PRODUCTS
app.get('/products', function(request, response){
  console.log("BODY: " + request.query.name);
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
  
});

//REGISTER
app.put('/register', function(req, res){
  var user_details = req.body.userdetails;
  console.log('Clicked register button!');
  var success = false;
  var query = client.query("INSERT INTO users (username, email, password) VALUES ('" + user_details.username + "','" + user_details.email + "','" + user_details.password + "')",
    function(error, response){
      if(error){
        res.status(500).send("Internal Server Error when adding ");   
      }else{
        success = true;
        console.log("SUCCESS: " + success);
        console.log(user_details.username + " has been added to users");   
        req.session.username = "'" + user_details.username + "'";     
        req.session.save();
      }
      
    });        
        if(success){        
        console.log("REDIRECTING");
      
      }  
});

app.get('/register', function(req, res){
  console.log("In register page!");
  res.render('pages/register',{
   
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

