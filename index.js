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
var configAuth = require('/config/auth.js'); 

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
        secret: configAuth.expressSession.secret,
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


// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

/*Set up passport for local login*/
passport.use('local-login', new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true   
  },  
  function(req,username, password, done) {
        var user = client.query("SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "';", callback);  
        function callback(err,res){
             if(res.rows[0]!=undefined){   
                 req.session.username = "'" + username + "'";
                 req.session.save();                   
                 return done(null,user);
            }
            else{
                console.log("login failed");
                    return done(null,user);
            }          
        } 
     }     
));

  
/*Set up passport for local registration*/
passport.use('local-register', new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password',    
    passReqToCallback : true
  },

  function(req, username, password, done) {
    process.nextTick(function() {    
        console.log("USER is: " + username + " PW: " + password + " email" + req.body.email);
        var user = client.query("SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "';", callback);  
        function callback(err,res){         
            if(res.rows[0]!=undefined){   
                 req.session.username = "'"+username+"'";   
                 req.session.save();     
                 console.log(req.session.username);     
                 return done(null,user);
            }
            else{
                 var query = client.query("INSERT INTO users (username, email, password) VALUES ('" + username + "','" + req.body.email + "','" + password + "')");
                req.session.username = "'"+username+"'";   
                req.session.save();    
                console.log("Registration successful"); 
                return done(null,user);
            }          
        }
    });

}));


/*set up passport for facebook login*/
passport.use('facebook', new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret, 
    callbackURL: "https://evening-cove-32171.herokuapp.com/auth/facebook/callback",
    profileFields: ['id', 'emails']   
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

app.post('/login/auth', function(req,res, next){
      
    passport.authenticate('local-login',function(err,user,info){
        if (err) { return next(err); }
        if(user){            
            res.send('200');
        }
        else{
            console.log("Login unsucessful");
            res.redirect('/login');
        }
    })(req,res,next);
});

//Facebook login + registration

app.get('/auth/facebook', 
    passport.authenticate('facebook',{ scope: 'email'}));

app.get('/auth/facebook/callback', 
        passport.authenticate('facebook', {  
        failureRedirect: '/login' }),
        (req, res)=>{                  
        req.session.username = "'"+req.user.id+"'";     
        req.session.save();        
        res.redirect('/profile');
        }
        
    );


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

//CART STUFF

app.get('/cart', function(req, res){
    res.render('pages/cart');
});

//add an item to cart
app.put('add_cart', function(req, res){
    var results = [];
    //get the item from items db
    var query = client.query("SELECT * FROM item WHERE item_id = '" + req.item_id + "';", function(err, result){
        if(err){
            console.log("Cannot add item to cart!");
        }else{  
            //add item to cart db
            var add_query = client.query("INSERT INTO cart (item_id, item_name, item_price, username) VALUES ('" + result.rows[0].item_id + "','" + result.rows[0].item_name + "','" + result.rows[0].item_price + "','" + req.session.username + "')");
            console.log("Added item to cart");
        }
    });
});



//REGISTER

app.get('/register', function(req, res){
  console.log("In register page!");
  res.render('pages/register',{
   
  });
});

app.post('/register/auth', function(req,res, next){   
    console.log(req.body);
    passport.authenticate('local-register',function(err,user,info){
        if (err) { return next(err); }
        if(user){            
            res.send('200');
        }
        else{
            res.send('304');
        }
    })(req,res,next);
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

