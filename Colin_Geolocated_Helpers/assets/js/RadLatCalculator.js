// equation to calculate earth Radius by elevation
// R = √ [ (r1² * cos(B))² + (r2² * sin(B))² ] / [ (r1 * cos(B))² + (r2 * sin(B))² ] 

var seAvgRad = 6371.001;
var eqRad = 6378.137;
var poleRad = 6356.752;

//function to return elevation based on latitude and input height from google maps.
function getRadius (inputLat, inputHeight) {
	var a1 = (eqRad * eqRad) * Math.cos(inputLat);
	var a1Sq = a1 * a1;
	
	var a2 = (poleRad * poleRad) * Math.sin(inputLat);
	var a2Sq = a2 * a2;
	
	var aLat = a1Sq + a2Sq;
	
	var b1 = (eqRad) * Math.cos(inputLat);
	var b1Sq = b1 * b1;
	
	var b2 = (poleRad) * Math.sin(inputLat);
	var b2Sq = b2 * b2;
	
	var R = Math.sqrt( (a1Sq + a2Sq)/(b1Sq + b2Sq) );
	
	return R + (inputHeight * .001);
	
}