var express = require('express');
var app = express();
var port = process.env.PORT ||8080;
var path = require('path');
//just testing
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.listen(port, function(){
	console.log('Example app listening on port ' + port + '!');
});



var pg = require('pg').native;

var connectionString = process.env.DATABASE_URL;
//var connectionString = "postgres://znufrplxsrwegg:HnOak8O2Rz_px-Yl_-WSRBuLws@ec2-54-225-94-145.compute-1.amazonaws.com:5432/d5fnuc5ovc0p76";
//var connectionString = "postgres://huntdani1:password@depot:5432/huntdani1_nodejs";

var client = new pg.Client(connectionString);
client.connect();

app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/fonts", express.static(__dirname + '/fonts'));
app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
     res.sendFile(path.join(__dirname+'/index.html'));
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


//TEST CASES
// GET: curl -H "Content-Type: application/json" -X GET 130.195.4.166:8080/all_tasks
// CREATE: curl -H "Content-Type: application/json" -X PUT -d '{"task":"test task"}' 130.195.4.166:8080/create
// UPDATE: curl -H "Content-Type: application/json" -X POST -d '{"task":"test task", "isDone":"true"}' 130.195.4.166:8080/update
// REMOVE: curl -H "Content-Type: application/json" -X DELETE -d '{"task":"hello"}' 130.195.4.166:8080/del
