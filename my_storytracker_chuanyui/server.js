var express  = require('express'),
	app = express(),
 	http     = require('http').createServer(app),
	mysql    = require('mysql'),
	parser   = require('body-parser'),
	io = require('socket.io')(http);

// Database Connection
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'woojung0802',
  database : 'storytracker'
});
try {
	connection.connect();

} catch(e) {
	console.log('Database Connetion failed:' + e);
}

app.use(express.static(__dirname + "/"));


io.on('connection', function(socket) {
	console.log('connected!');

    checkTableExist();

	socket.on('post', function(mList) {
        if(!mList) {
            console.log("There is no points");
            return;
        }
        mList.forEach(function(point) {
            var lat = point.lat, lng = point.lng, alt = point.alt;
            connection.query('INSERT INTO points (lat, lng, alt) VALUES (?, ?, ?);',
                [lat, lng, alt],
                function(err, result) {
                    console.log("POSTED!, Affected row:" + result.affectedRows);
                    // socket.emit('respond', result, point);
                }
            );
        });
	});

    socket.on('request', function() {
        console.log('requesting...');
        connection.query('SELECT * FROM Points', 
            function(err, result, fields) {
                if (err) throw err;
                
                socket.emit('draw', result);
            }
        );
    });

});

var checkTableExist = function() {
    connection.query('SELECT 1 FROM Points LIMIT 1;', function(err, result) {
        if(err) {
            connection.query('CREATE TABLE Points (' +
                'id INT NOT NULL AUTO_INCREMENT,' +
                'lat DOUBlE NOT NULL,' +
                'lng DOUBlE NOT NULL,' +
                'alt DOUBlE NOT NULL,' +
                'PRIMARY KEY (id)' +
                ');'
            , (err, result) => {
                if(err) throw err; 
                
                console.log('Tables does not exist, created one');
            });
        }
    });
}



// app.get('/', function (req, res) {
// 	res.send('<html><body><p>Storytracker</p></body></html>');
// });

// app.post('/points/put/:id', function (req,res) {
// 	var id = req.params.id, response = [];

// 	if (
// 		typeof req.body.x !== 'undefined' &&
// 		typeof req.body.y !== 'undefined' &&
// 		typeof req.body.z !== 'undefined'
// 	) {
// 		var x = req.body.x, y = req.body.y, z = req.body.z;

// 		connection.query('INSERT INTO points VALUES (?, ?, ?, ?);',
// 			[id, x, y, z],
// 			function(err, result) {
// 		  		if (!err){

// 					if (result.affectedRows != 0) {
// 						response.push({'result' : 'success'});
// 					} else {
// 						response.push({'msg' : 'No Result Found'});
// 					}

// 					res.setHeader('Content-Type', 'application/json');
// 			    	res.status(200).send(JSON.stringify(response));
// 		  		} else {
// 				    res.status(400).send(err);
// 			  	}
// 			}
// 		);

// 	} else {
// 		response.push({'result' : 'error', 'msg' : 'Please fill required details'});
// 		res.setHeader('Content-Type', 'application/json');
//     	res.status(200).send(JSON.stringify(response));
// 	}
// });

// // app.delete('/product/delete/:id', function (req,res) {
// // 	var id = req.params.id;

// // 	connection.query('DELETE FROM nd_products WHERE id = ?', [id], function(err, result) {
// //   		if (!err){
// //   			var response = [];

// // 			if (result.affectedRows != 0) {
// // 				response.push({'result' : 'success'});
// // 			} else {
// // 				response.push({'msg' : 'No Result Found'});
// // 			}

// // 			res.setHeader('Content-Type', 'application/json');
// // 	    	res.status(200).send(JSON.stringify(response));
// //   		} else {
// // 		    res.status(400).send(err);
// // 	  	}
// // 	});
// // });

// app.get('/points/:id', function (req,res) {
// 	var id = req.params.id;

// 	connection.query('SELECT * from points where id = ?', [id], function(err, rows, fields) {
//   		if (!err){
//   			var response = [];

// 			if (rows.length != 0) {
// 				response.push({'result' : 'success', 'data' : rows});
// 			} else {
// 				response.push({'result' : 'error', 'msg' : 'No Results Found'});
// 			}

// 			res.setHeader('Content-Type', 'application/json');
// 	    	res.status(200).send(JSON.stringify(response));
//   		} else {
// 		    res.status(400).send(err);
// 	  	}
// 	});
// });

http.listen(3000, function(){
	console.log('Server listening on port: *:3000');
});
