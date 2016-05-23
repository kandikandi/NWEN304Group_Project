 $(document).ready(function(e) {

var ERROR_LOG = console.error.bind(console);

//GET recieves the information from the items table in database, no changes are made
$.ajax({
    url: "https://evening-cove-32171.herokuapp.com/items",
    type: "GET",
    }).then(redraw, ERROR_LOG);

function redraw(data){
    console.log('redrawing', data);
    };

});

