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
var configAuth = require('./config/auth'); 
var configTime = require('./config/time');
var bcrypt = require('bcrypt');


const saltRounds = configAuth.bcryptHash.saltRounds;

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
  app.use(express.static(__dirname + '/public', { maxAge: 86400000 }));

 
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
        var user = client.query("SELECT * FROM users WHERE username = '" + username + "';", callback);  
        function callback(err,res){
             if(res.rows[0]!=undefined){                   
               var isRight = bcrypt.compareSync(password, res.rows[0].password);
               if(isRight){                   
                    req.session.username = username;   
                    req.session.save();                                            
               }                
             }                              
         }         
         return done(null,user);      
}));

  
/*Set up passport for local registration*/
passport.use('local-register', new LocalStrategy({
    usernameField : 'username',
    passwordField : 'password',    
    passReqToCallback : true
  },
  function(req, username, password, done) {
    process.nextTick(function() {            
        var user = client.query("SELECT * FROM users WHERE username = '" + username + "';", callback);  
        function callback(err,res){         
           if(res.rows[0]!=undefined){                   
               var isRight = bcrypt.compareSync(password, res.rows[0].password);
               if(isRight){                   
                    req.session.username = username;   
                    req.session.save();                                            
               }                
             }      
           else{
                bcrypt.hash(password, saltRounds,function(err,hash){
                    var query = client.query("INSERT INTO users (username, email, password) VALUES ('" + username + "','" + req.body.email + "','" + hash + "')");
                });
                    req.session.username = username;   
                    req.session.save();                    
                    return done(null, user);
            } 
            return done(null, false);         
        }
    });

}));


/*set up passport for facebook login*/
passport.use('facebook', new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret, 
    callbackURL: "https://evening-cove-32171.herokuapp.com/auth/facebook/callback",
    profileFields: ['name', 'emails']   
  },

  function(access_token, refreshToken, profile, done) {
     process.nextTick(function () {
        var user = client.query("SELECT * FROM users WHERE username = '" + profile.name.givenName+"_"+profile.name.familyName + "';", callback);
        function callback(err,res){         
            if(res.rows[0]!=undefined){                
                 return done(null,profile);
            }
            else{                
                 bcrypt.hash(profile.id, saltRounds,function(err,hash){
                 client.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",[profile.name.givenName+"_"+profile.name.familyName, profile.emails[0].value, hash]); });
                 return done(null,profile);      
            }   
         }              
                       
     });
  }
));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use("/public/css", express.static(__dirname + '/public/css', { maxAge: 86400000 }));
app.use("/public/js", express.static(__dirname + '/public/js', { maxAge: 86400000 }));
app.use("/public/fonts", express.static(__dirname + '/public/fonts', { maxAge: 86400000 }));
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
    res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.month);
    res.render('pages/index');
});


// GET ALL MENS ITEMS
app.get('/mens', function(req, res){
  var results = [];
  var query = client.query("SELECT * FROM items WHERE cat_id = 2;", function(err, result){
    if(err){
      console.log("Error getting mens items");
      return;
    }
  });

  query.on('row', function(row){
 
    results.push(row);
  });

  query.on('end', function(row){
    res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
    res.render('pages/mens', {
      results: results
    });  
  });

});


// GET ALL WOMENS ITEMS
app.get('/womens', function(req, res){
  var results = [];
  var query = client.query("SELECT * FROM items WHERE cat_id = 1;", function(err, result){
    if(err){
      console.log("Error getting womens items");
      return;
    }
  });

  query.on('row', function(row){
   
    results.push(row);
  });

  query.on('end', function(row){
    res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
    res.render('pages/womens', {
      results: results
    });  
  });


});

//GET ALL CHILDREN ITEMS
app.get('/kids', function(req, res){
  var results = [];
  var result_itemid = [];

  var query = client.query("SELECT * FROM items WHERE cat_id = 0;", function(err, result){
      if(err){
        console.log("Error getting childrens items");
        return;
      }
  });

  query.on('row', function(row){
    //console.log(row);    
    results.push(row);
  });

  query.on('end', function(row){
    res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
    res.render('pages/kids', {
      results: results
    });  
  });
});


//LOGIN
app.get('/login', function(req, res){  
  res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.month);
  res.render('pages/login', { user: req.user });        
});

app.post('/login/auth', function(req,res, next){      
    passport.authenticate('local-login',function(err,user,info){
        if (err) { return next(err); }
        if(user){            
            res.send('200');
        }
        else{
            console.log("Login unsucessful"); 
            res.send('Login unsuccessful');
            return;           
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
        req.session.username = req.user.name.givenName+"_"+req.user.name.familyName;
        req.session.save();        
        res.redirect('/profile');
        }
        
    );

//PROFILE
app.get('/profile', function(req, res){

console.log(req.session.username);
var query = client.query("SELECT * FROM users WHERE username = '" + req.session.username + "';");
var results = [];

  query.on('row', function(row){
    console.log(row);    
    results.push(row);    
  });

  query.on('end', function(row){
    res.setHeader('Cache-Control','private, no-cache, no-store, must-revalidate');
    res.render('pages/profile', {
      results: results
    });
  });

});

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


//PRODUCTS
app.get('/products', function(req, res){
 
  var results = [];

  // console.log("BODY: " + req.query.item_id);
  // console.log("products");

  var query = client.query("SELECT * FROM items WHERE item_id = " + req.query.item_id +";");

  

  query.on('row', function(row){   
    results.push(row);
  });

  query.on('end', function(row){
    res.setHeader('Cache-Control','private, no-cache, no-store, must-revalidate');
    res.render('pages/products', {
      results: results
    });  
  });
  
});

//SHOPPING CART

app.get('/cart', function(req, res){
  var results = [];

     
  if(req.session.userrname==undefined){
    res.send('Please log in first');
    return;
  }

  
  var query = client.query("SELECT * FROM cart WHERE username = '" + req.session.username + "';", function(err, result){
    if(err){
      console.log("Error getting items from cart");
      return;
    }
  });
 

  query.on('row', function(row){      
    results.push(row);
  });

  query.on('end', function(row){
    res.setHeader('Cache-Control','private, no-cache, no-store, must-revalidate');
    res.render('pages/cart', {
      results: results
    });  
  });
});


//Delete from cart
app.delete('/cart/deleteone', function(req, res){

    var query = client.query("DELETE FROM cart WHERE item_id = " + req.body.item_id +" AND username = '" + req.session.username + "';", function(err, result){
      if(err){
        console.log("Error deleting from cart");
        return;
      }
    });
    res.redirect('/cart');
});

app.delete('/cart/deleteall', function(req, res){   
    console.log("deleteall");
    var query = client.query("DELETE FROM cart WHERE username = '" + req.session.username +"';");
    query.on('end', function(row){
    res.redirect('pages/cart')});  
});

//add an item to cart
app.post('/cart/add', function(req, res){
    console.log("post cart");
    console.log("BODY: " + req.body.item_id);  
    console.log("USER IS CURRENTLY: " +req.session.username);
    if(req.session.username==undefined){    
         res.send('please login first');
         return;
    }
    //get the item from items db
    console.log("ITEM ID IS : " +req.body.item_id);
    var query = client.query("SELECT * FROM items WHERE item_id = " + req.body.item_id + ";", function(err, result){
        if(err){
            console.log("Cannot add item to cart!");
            res.send('Failed to add item');
            return;
        }else{  
            //console.log(result.rows[0]);       
            query = client.query("INSERT INTO cart (item_id, item_name, item_price, username) VALUES ($1, $2, $3, $4)",[result.rows[0].item_id,result.rows[0].name,  result.rows[0].price, req.session.username]);          
            query.on('end',function(){
            console.log("Added item to cart");
            res.send('200');
            });
        }
    });
});

//buy all items in cart
app.post('/cart/buy', function(req,res){
    
    if(req.session.username==undefined){ 
      res.send('please login first');
      return;
    }

    var products = [];
    var query = client.query("SELECT item_id FROM cart WHERE username = '" + req.session.username +"';", function(err, result){
        if(err){
            console.log("Error getting item from cart when buying");            
            res.send('Could not purchase items');
            return;
        }
    }); 
        query.on('row', function(row){    
          //console.log(row); 
          products.push(row.item_id);
        });
        query = client.query("INSERT INTO purchases (orders, username) VALUES ($1, $2)",[products, req.session.username]);
        query.on('end',function(){
            query = client.query("DELETE FROM cart WHERE username = '" + req.session.username +"';");
        });
        res.send('200');       

});

//purchase successful page
app.get('/success', function(req, res){
    var results = [];
    var query = client.query("SELECT * FROM purchases WHERE username = '" + req.session.username + "';", function(userErr, userRes){
        if(userErr){
            console.log("Error when getting username");
            res.send('Error when getting username');
            return;
        }
        //console.log("USERRES IS: " + userRes.rows[0].orders[0]);
        query = client.query("SELECT * FROM items WHERE item_id = " + userRes.rows[0].orders[0] + ";", function(itemErr, itemRes){
            if(itemErr){
                console.log("Error when getting item_id");
                res.send('Error when retrieving recommenations');
                return;
            }
            //console.log("CATRES IS: " + itemRes.rows[0].cat_id);
            query = client.query("SELECT * FROM items WHERE cat_id = " + itemRes.rows[0].cat_id + ";", function(catErr, catRes){
                if(catErr){
                    console.log("Error when getting cat_id");
                    res.send('Error when retrieving recommenations');
                    return;
                }                
            });
            query.on('row', function(row){
                //console.log("HI " + row.name);
                results.push(row);
                //console.log("ROW IS: " + results);
            });

            query.on('end', function(){
                //console.log("ITEMS HERE " + results);
                res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.year);
                res.render('pages/success',{
                    results: results
            });
    });
        });
    });
    
    
});



//REGISTER

app.get('/register', function(req, res){
  //console.log("In register page!");
  res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.month);
  res.render('pages/register',{   
  });
});

app.post('/register/auth', function(req,res, next){       
    passport.authenticate('local-register',function(err,user,info){
        if (err) { return next(err); }
        if(user){            
            res.send('200');
        }
        else{      
            res.send('registration unsuccessful')
            return;     
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

