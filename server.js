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
  password : 'thytran4498',
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

    // Check if table exists, if not create one
    checkTableExist();

	socket.on('post', function(name, mList) {
        if(!mList) {
            console.log("There is no points");
            return;
        }
        var points = JSON.stringify(mList);
        connection.query('INSERT INTO points (name, points) VALUES (?, ?);',
            [name, points],
            function(err, result) {
                console.log("POSTED!, Affected row:" + result.affectedRows);
            }
        );
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
                'name TINYTEXT NOT NULL,' +
                'points LONGTEXT NOT NULL,' +
                'PRIMARY KEY (id)' +
                ');'
            , (err, result) => {
                if(err) throw err;

                console.log('Tables does not exist, created one');
            });
        }
    });
}

http.listen(3000, function(){
	console.log('Server listening on port: *:3000');
});
