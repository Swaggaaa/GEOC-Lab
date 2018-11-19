/**
 TODO Replace this by your own, correct, triangulation function
 Triangles should be return as arrays of array of indexes
 e.g., [[1,2,3],[2,3,4]] encodes two triangles, where the indices are relative to the array points
**/
function computeTriangulation(points) {
	// Wrong code! Just connects consecutive three after sorting by x-coord
	// Note that this does NOT return a triangulation, just a subset of it
	//var newPoints = points.sort(function(a,b) { if ((a.x) < (b.x)) return -1; else return 1;})
	let k = Math.floor(points.length/3); 
	let outputTriangles = []
	let encTriangle = enclosingTriangle(points);
	points.unshift(encTriangle[0], encTriangle[1], encTriangle[2]);

	let dcel = new DCEL(encTriangle[0], encTriangle[1], encTriangle[2]);
	let referencePoint = points[3];
	dcel.add(referencePoint, 1);

	for (let i = 4; i < points.length; ++i)
	{
		dcel.add(points[i], dcel.findFaceOf(points[i], referencePoint));
	}

	return vertices = parseTriangleVertices(dcel);
}

function enclosingTriangle(points)
{
	// We get the min and max X coordinates points
	let pointMinX = new Point(Number.MAX_SAFE_INTEGER, 0, 0);
	let pointMaxX = new Point(Number.MIN_SAFE_INTEGER, 0, 0);
	for (let point of points)
	{
		pointMinX = point.x < pointMinX.x ? point : pointMinX;
		pointMaxX = point.x > pointMaxX.x ? point : pointMaxX;
	}

	// Degenerate case. Another point had the same X so the supporting line was vertical
	pointMinX = new Point(pointMinX.x - (pointMaxX.x - pointMinX.x), pointMinX.y, pointMinX.z);
	pointMaxX = new Point(pointMaxX.x + (pointMaxX.x - pointMinX.x) / 2, pointMaxX.y, pointMaxX.z);

	// We find the supporting lines from the min X point
	let supportingPointLeft = pointMaxX;
	let supportingPointRight = pointMaxX;
	for (let point of points)
	{
		if (point === pointMinX)
			continue;

			supportingPointLeft = orientationTest(pointMinX, supportingPointLeft, point) === orientations.LEFT ? point : supportingPointLeft;
			supportingPointRight = orientationTest(pointMinX, supportingPointRight, point) === orientations.RIGHT ? point : supportingPointRight;
	}

	let diff = supportingPointLeft.y - supportingPointRight.y;
	let p1 = new Point(supportingPointLeft.x, supportingPointLeft.y + diff/5, supportingPointLeft.z);
	let p2 = new Point(supportingPointRight.x, supportingPointRight.y - diff/5, supportingPointRight.z);
	var supportingLineLeft = new Vector(pointMinX, p1);
	var supportingLineRight = new Vector(pointMinX, p2);

	// Let's solve an equation. Look at me, I'm NP-smart
	// x = MaxX, y = (p2 - p1) * (slope)
	var externalPointRight = new Point(pointMaxX.x, (pointMaxX.x - pointMinX.x) * (supportingLineRight.y / supportingLineRight.x) + pointMinX.y, pointMaxX.z);
	var externalPointLeft = new Point(pointMaxX.x, (pointMaxX.x - pointMinX.x) * (supportingLineLeft.y / supportingLineLeft.x) + pointMinX.y, pointMaxX.z);

	// We add our triangle to the end of points array. We could ommit one point but for the sake of clarity, we'll add it anyway
	return [pointMinX, externalPointRight, externalPointLeft];
}

function parseTriangleVertices(dcel)
{
	let vertices = [];

	for (let i = 1; i < dcel.faceTable.length; ++i)
	{
		let triangle = dcel.findTriangle(i);
		vertices.push(triangle.vertices);
	}

	return vertices;
}