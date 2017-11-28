$(function() {
    var socket = io.connect('http://localhost:3000');

    $('#point_form').on('submit', function(event) {
      var points = {x: $('#x').val(), y: $('#y').val(), z: $('#z').val()};
      socket.emit('post', points);

      return false;
    });

    socket.on('respond', function(res, points) {
      $('#point').text(res.affectedRows + ': (' + points.x + ',' + points.y + ',' + points.z + ')');
    });

    $('#draw').click(function() {
        socket.emit('request');
    });

    socket.on('draw', function(pointsArray) {
        pointsArray.forEach(function(points) { 
            $('#point').append(showPointsPretty(points));
        });
        threejs(pointsArray);
    });

    var showPointsPretty = function(points) {
        return 'id: ' + points.id + ' ' +
                '(' + points.x +
                ',' + points.y +
                ',' + points.z +
                ') <br>';
    }

    var threejs = function(pointsArray) {
        
        // THREEJS
        var scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xeeeeee );
        var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        // Create spline object
        var numPoints = 100; //smoothing

        var vectors = [];
        pointsArray.forEach(function(points) {
            vectors.push(new THREE.Vector3(points.x, points.y, points.z));
        });
        spline = new THREE.SplineCurve3(vectors);

        var material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
        });
        var geometry = new THREE.Geometry();
        var splinePoints = spline.getPoints(numPoints);
        for(var i = 0; i < splinePoints.length; i++){
            geometry.vertices.push(splinePoints[i]);  
        }
        var line = new THREE.Line(geometry, material);
        scene.add(line);


        // Rendering
        camera.position.z = 50;
        var animate = function () {
            requestAnimationFrame( animate );
            renderer.render(scene, camera);
        };

        animate();
    }   
});

