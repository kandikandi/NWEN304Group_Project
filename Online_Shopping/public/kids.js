 $(document).ready(function(e) {

var ERROR_LOG = console.error.bind(console);
var ip = 'https://evening-cove-32171.herokuapp.com'; // app address

//GET recieves the information from the items table in database, no changes are made
$.ajax({
    url: ip+'/catalogue/kids',
    type: "GET",
    }).then(redraw, ERROR_LOG);

function redraw(data){
    console.log('redrawing', data);
    }; 
