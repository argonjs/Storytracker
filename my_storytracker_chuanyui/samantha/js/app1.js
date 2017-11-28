$(function() {
    //Global Variables
    var Cesium = Argon.Cesium;
    var Cartesian3 = Argon.Cesium.Cartesian3;
    var ReferenceFrame = Argon.Cesium.ReferenceFrame;
    var app = Argon.init();

    app.context.subscribeGeolocation({ enableHighAccuracy: true });

    // THREE js initialization
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera();
    var stage = new THREE.Object3D;
    var user = new THREE.Object3D;
    scene.add(camera);
    scene.add(stage);
    scene.add(user);

    var renderer = new THREE.WebGLRenderer({
        alpha: true,
        logarithmicDepthBuffer: true,
        antialias: Argon.suggestedWebGLContextAntialiasAttribute
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    // Tell argon what local coordinate system you want
    app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
    app.view.setLayers([
        { source: renderer.domElement }
    ]);

    // All geospatial objects need to have an Object3D linked to a Cesium Entity.
    // We need to do this because Argon needs a mapping between Entities and Object3Ds.
    var boxGeoObject = new THREE.Object3D;
    var box = new THREE.Object3D();
    var loader = new THREE.TextureLoader();
    loader.load('samantha/images/box.png', function (texture) {
        var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        var material = new THREE.MeshBasicMaterial({ map: texture });
        var mesh = new THREE.Mesh(geometry, material);
        box.add(mesh);
    });
    var boxGeoEntity = new Argon.Cesium.Entity({
        name: "I have a box",
        position: Cartesian3.fromDegrees(33.7741337,-84.3988109,21),
        orientation: Cesium.Quaternion.IDENTITY
    });
    boxGeoObject.add(box);
    boxGeoObject.position = boxGeoEntity.position;
    scene.add(boxGeoObject);

    //add second box for testing
    var boxGeoObject2 = new THREE.Object3D;
    var box2 = new THREE.Object3D();
    var loader2 = new THREE.TextureLoader();
    loader2.load('samantha/images/box.png', function (texture) {
        var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        var material = new THREE.MeshBasicMaterial({ map: texture });
        var mesh = new THREE.Mesh(geometry, material);
        box2.add(mesh);
    });
    var boxGeoEntity2 = new Argon.Cesium.Entity({
        name: "I have a box",
        position: Cartesian3.fromDegrees(33.7748386,-84.3955992,21),
        orientation: Cesium.Quaternion.IDENTITY
    });
    boxGeoObject2.add(box2);
    boxGeoObject2.position = boxGeoEntity2.position;
    scene.add(boxGeoObject2);

    var boxInit = false;

    app.updateEvent.addEventListener(function(frame) {
        var positions = [];
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
        var userPose = app.context.getEntityPose(app.context.user);

    // set the pose of our THREE user object
        if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
            user.position.copy(userPose.position);
            user.quaternion.copy(userPose.orientation);
        }
    // get the pose of the "stage" to anchor our content.
    // The "stage" defines an East-Up-South coordinate system
    // (assuming geolocation is available).
        var stagePose = app.context.getEntityPose(app.context.stage);
    // set the pose of our THREE stage object
        if (stagePose.poseStatus & Argon.PoseStatus.KNOWN) {
            stage.position.copy(stagePose.position);
            stage.quaternion.copy(stagePose.orientation);
        }
        // the first time through, we create a geospatial position for
    // the box somewhere near us
        if (!boxInit) {
            var defaultFrame = app.context.getDefaultReferenceFrame();
            // set the box's position to 10 meters away from the user.
            // First, clone the userPose postion, and add 10 to the X
            var boxPos_1 = userPose.position.clone();
            var box2Pos_1 = userPose.position.clone();
            // var boxPos_1 = new Cartesian3.fromDegrees(33.7741337,-84.3988109,21);
            // var box2Pos_1= new Cartesian3.fromDegrees(33.7748386,-84.3955992,21);
            boxPos_1.z -= 10;
            box2Pos_1.z -= 10;
            box2Pos_1.x += 3;

            // set the value of the box Entity to this local position, by
            // specifying the frame of reference to our local frame
            boxGeoEntity.position.setValue(boxPos_1, defaultFrame);
            boxGeoEntity2.position.setValue(box2Pos_1, defaultFrame);
            // orient the box according to the local world frame
            boxGeoEntity.orientation.setValue(Cesium.Quaternion.IDENTITY);
            boxGeoEntity2.orientation.setValue(Cesium.Quaternion.IDENTITY);
            // now, we want to move the box's coordinates to the FIXED frame, so
            // the box doesn't move if the local coordinate system origin changes.
            if (Argon.convertEntityReferenceFrame(boxGeoEntity, frame.time, ReferenceFrame.FIXED) &&
                Argon.convertEntityReferenceFrame(boxGeoEntity2, frame.time, ReferenceFrame.FIXED)) {
                // we will keep trying to reset it to FIXED until it works!

                // get the local coordinates of the local box, and set the THREE object
                var boxPose = app.context.getEntityPose(boxGeoEntity);
                if (boxPose.poseStatus & Argon.PoseStatus.KNOWN) {
                    boxGeoObject.position.copy(boxPose.position);
                    boxGeoObject.quaternion.copy(boxPose.orientation);
                    console.log("here 2");
                    positions.push(new THREE.Vector3(boxGeoObject.position.x,boxGeoObject.position.y, boxGeoObject.position.z))
                }

                var boxPose2 = app.context.getEntityPose(boxGeoEntity2);
                if (boxPose2.poseStatus & Argon.PoseStatus.KNOWN) {
                    boxGeoObject2.position.copy(boxPose2.position);
                    boxGeoObject2.quaternion.copy(boxPose2.orientation);
                    positions.push(new THREE.Vector3(boxGeoObject2.position.x,boxGeoObject2.position.y, boxGeoObject2.position.z));
                }
                
                if (positions.length >= 2) {
                    //extrapolate points to make path
                    var pipeSpline = new THREE.CatmullRomCurve3([new THREE.Vector3(boxGeoObject2.position.x,boxGeoObject2.position.y,
                        boxGeoObject2.position.z),
                        new THREE.Vector3(boxGeoObject.position.x,
                            boxGeoObject.position.y,
                            boxGeoObject.position.z)]);
                    var material = new THREE.MeshLambertMaterial( { color: 0xff00ff } );
                    var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0xFF0000, opacity: 0.3, wireframe: true, transparent: true } );
                    var params =  {
                        scale: 2,
                        extrusionSegments: 100,
                        radius: 2,
                        radiusSegments: 3,
                        closed: false,
                        animationView: false,
                        lookAhead: false,
                        cameraHelper: false
                    };
                    tubeGeometry = new THREE.TubeBufferGeometry( pipeSpline, params.extrusionSegments, params.radius, params.radiusSegments, params.closed );
                    var group = THREE.SceneUtils.createMultiMaterialObject( tubeGeometry, [ material, wireframeMaterial ] );
                    group.scale.set( params.scale, params.scale, params.scale );
                    scene.add(group);
                }
                boxInit = true;
            }
        }
    });

    app.renderEvent.addEventListener(function () {
        // set the renderers to know the current size of the viewport.
        // This is the full size of the viewport, which would include
        // both views if we are in stereo viewing mode
        var view = app.view;
        renderer.setSize(view.renderWidth, view.renderHeight, false);
        renderer.setPixelRatio(app.suggestedPixelRatio);

        // there is 1 subview in monocular mode, 2 in stereo mode
        for (var _i = 0, _a = app.view.subviews; _i < _a.length; _i++) {
            var subview = _a[_i];
            var frustum = subview.frustum;
            // set the position and orientation of the camera for
            // this subview
            camera.position.copy(subview.pose.position);
            camera.quaternion.copy(subview.pose.orientation);
            // the underlying system provide a full projection matrix
            // for the camera.
            camera.projectionMatrix.fromArray(subview.frustum.projectionMatrix);
            // set the webGL rendering parameters and render this view
            // set the viewport for this view
            var _b = subview.renderViewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
            renderer.setViewport(x, y, width, height);
            renderer.setScissor(x, y, width, height);
            renderer.setScissorTest(true);
            renderer.render(scene, camera);
            // set the viewport for this view
            var _c = subview.viewport, x = _c.x, y = _c.y, width = _c.width, height = _c.height;
            // set the CSS rendering up, by computing the FOV, and render this view
            camera.fov = THREE.Math.radToDeg(frustum.fovy);
        }
    });
});
