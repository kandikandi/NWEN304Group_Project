$(document).ready(function(e) {

<<<<<<< HEAD
	var ip = 'znufrplxsrwegg:HnOak8O2Rz_px-Yl_-WSRBuLws@ec2-54-225-94-145.compute-1.amazonaws.com:5432/d5fnuc5ovc0p76'
	//var ip = 'localhost';
	//var ip = 'sheltered-beach-50776.herokuapp.com';
=======
	var ip = '130.195.4.170'

>>>>>>> parent of f1cb3b5... Updated ip address of todo
	getTasks();

	$('#add-todo').button({
		icons:{primary:"ui-icon-circle-plus"}}).click(
			function(){
				$('#new-todo').dialog('open');
			});

	$('#new-todo').dialog({
		modal:true, autoOpen:false,
		buttons:{
			"Add task" : function () {
				var taskName = $('#task').val();
				if (taskName === '') { return false; }
				putTask(taskName);
				var taskHTML = '<li><span class="done">%</span>';
				taskHTML += '<span class="delete">x</span>';
				taskHTML += '<span class="task"></span></li>';
				var $newTask = $(taskHTML);
				$newTask.find('.task').text(taskName);
				$newTask.hide();
				$('#task').val('');
				$('#todo-list').prepend($newTask);
				$newTask.show('clip',250).effect('highlight',1000);
				$(this).dialog('close');
			},
			"Cancel" : function(){ $(this).dialog('close'); }
		}
	});

	$('#todo-list').on('click', '.done', function() {
		var $taskItem = $(this).parent('li');
		var itemString = $taskItem.text();
		var taskName = itemString.substring(2,itemString.length);
		updateTask(taskName,false);
		$taskItem.slideUp(250, function() {
			var $this = $(this);
			$this.detach();
			$('#completed-list').prepend($this);
			$this.slideDown();
		});

	});

	$('.sortlist').sortable({
		connectWith: '.sortlist',
		cursor : 'pointer',
		placeholder : 'ui-state-highlight',
		cancel : '.delete,.done'
	});


	var toDelete = "";
	var stringDel = "";
	var temp = "";
	$('.sortlist').on('click','.delete',function() {
		toDelete = $(this);
		temp = toDelete.parent('li').text();
		stringDel = temp.substring(2, temp.length);
	$('#deleted').dialog('open');
	});




	$('#deleted').dialog({
		modal:true, autoOpen:false,
		buttons: {
			"Delete" : function(){
				deleteTask(stringDel);
				$(this).dialog('close');
				$(toDelete).parent('li').effect('puff', function(){ $(toDelete).remove();})
			},// this is where you make it delete
				"Cancel" : function(){ $(this).dialog('close');}
		}
	});

	function updateTask(taskName, isDone){
		var stringURL = 'http://localhost:8080/update';
		$.post(stringURL, { task: taskName, isDone: isDone},
			function success(data, status){
				alert('Data: ' + data + ' Status: '+status);
			});
		// $.ajax({
		// 	method: 'POST',
		// 	url: 'http://localhost:8080/all_tasks/taskID',
		// 	data: JSON.stringify({
		// 		task: task.find('.task').html()
		// 	}),
		// 	contentType: "application/json",
		// 	dataType: "json"
		// }).then(
		// 	function success_func(data){
		// 		//function that handles successes
		// 		console.log('posted data.', dara)
		// 	},
		// 	ERROR_LOG);
	};

	function deleteTask(taskName){
		$.ajax({
			method: 'DELETE',
			url: 'http://localhost:8080/del',
			data: JSON.stringify({
				task: taskName
			}),
			contentType: "application/json",
			dataType: "json"
		}).then(ERROR_LOG);
	};

	function putTask(taskName){
		$.ajax({
			method: 'PUT',
<<<<<<< HEAD
			url: 'http://' + ip+':8080/create',
=======
			url: 'http://localhost:8080/create',
>>>>>>> parent of f1cb3b5... Updated ip address of todo
			data: JSON.stringify({
				task: taskName
			}),
			contentType: "application/json",
			dataType: "json"
		}).then(ERROR_LOG);
	};

	function refreshTasks(data){
		for(task in data){
			var taskName = data[task].task;
			if(taskName === ""){ return false; }
			var taskHTML = '<li><span class="done">%</span>'; 
			taskHTML += '<span class="delete">x</span>';
			taskHTML += '<span class="task"></span></li>';
			var $newTask = $(taskHTML);
			$newTask.find('.task').text(taskName);

			var done = data[task].isdone;
            //adds to completed list if task is done
            if(done){
            	$('#completed-list').prepend($newTask);
            }
            else{
            	$('#todo-list').prepend($newTask);
            }
        }
    };

    function getTasks(){
<<<<<<< HEAD
        $.get('http://' + ip+':8080/all_tasks',function(data){
=======
        $.get("http://localhost:8080/all_tasks",function(data){
>>>>>>> parent of f1cb3b5... Updated ip address of todo
            refreshTasks(data);
        });
    };

	//Redraw the two lists
	function redraw(data){
		console.log('redrawing', data);
	};

	var ERROR_LOG = console.error.bind(console);
}); // end ready