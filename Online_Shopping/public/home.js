 $(document).ready(function(e) {

var ERROR_LOG = console.error.bind(console);
var ip = 'https://evening-cove-32171.herokuapp.com'; // app address

//GET recieves the information from the items table in database, no changes are made
$.ajax({
    url: ip+'/items',
    type: "GET",
    }).then(redraw, ERROR_LOG);

function redraw(data){
    console.log('redrawing', data);
    $.each(data, function(i){
    	var item_image = data[i].image;
    	console.log("IMAGE IS: " item_image);
    })
    };





	/*function registerUser(userName, email, password){
		$.ajax({
			method: 'PUT',
			url: ip+'/register',
			data: JSON.stringify({
				username: userName
				email: email
				password: password
			}),
			contentType: "application/json",
			dataType: "json"
		}).then(ERROR_LOG);
	};*/

});
