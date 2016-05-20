var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var pg = require('pg');//.native;

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL,function(err,client){
    if(err) throw err;
    console.log('Connected to postgres, getting schemas...');

    client.query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
        console.log(JSON.stringify(row));
    });
});



/*var connectionString = process.env.DATABASE_URL;

var client = new pg.Client(connectionString);
client.connect();

//just testing
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

//var connectionString = "postgres://znufrplxsrwegg:HnOak8O2Rz_px-Yl_-WSRBuLws@ec2-54-225-94-145.compute-1.amazonaws.com:5432/d5fnuc5ovc0p76";
//var connectionString = "postgres://huntdani1:password@depot:5432/huntdani1_nodejs";
//var connectionString = "postgres://ygpsmtdckladgb:GO050OIP0M3Q5rU9ciSjV3Na0a@ec2-54-235-177-62.compute-1.amazonaws.com:5432/d7cihg4lmsobh0";

//var pg = require('pg');

/*app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
})*/

app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/fonts", express.static(__dirname + '/fonts'));
app.use(express.static(__dirname + '/'));
app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
        }
    next();
    });


app.get('/', function(req, res){
     //res.sendFile(path.join(__dirname+'/index.html'));
});

// GET ALL MENS ITEMS
app.get('/catalogue/mens', function(request, response){
	// //SQL Query > Select Data
	// var query = client.query("SELECT * FROM todo");
	// var results = [];
	// //stream results back one row at a time
	// query.on('row', function(row){
	// 	results.push(row);
	// });
	// // after all data is returned close connection and return results
	// query.on('end', function(){
	// 	response.json(results);
	//});
});

// GET ALL WOMENS ITEMS
app.get('/catalogue/womens', function(request, response){

});

//GET ALL CHILDREN ITEMS
app.get('/catalogue/kids', function(request, response){

});

//LOGIN
app.get('/login', function(request, response){

});

//REGISTER
app.put('/register', function(req, res){
	// console.log('Creating...\n');
	// var query = client.query("INSERT INTO todo (task, isDone) VALUES ('" + req.body.task + "',False)");
	// res.send("Created\n");
});

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
