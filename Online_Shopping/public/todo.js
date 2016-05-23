 $(document).ready(function(e) {

var ERROR_LOG = console.error.bind(console);

//GET recieves the information from the items table in database, no changes are made
$.ajax({
    url: "http://localhost:5000/items",
    type: "GET",
    }).then(redraw, ERROR_LOG);

