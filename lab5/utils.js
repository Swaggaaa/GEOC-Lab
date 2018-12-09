const orientations =
{
	RIGHT: -1,
	ON_LINE: 0,
	LEFT: 1
}

const intersectionTypes =
{
	"NONE": {"value": 0, "description": "There's no intersection"},
	"ENDPOINT": {"value": 1, "description": "Both segments share an endpoint"},
	"INTERIOR_POINT_S1": {"value": 2, "description": "One segment contains an endpoint of the other one"},
	"INTERIOR_POINT_S2": {"value": 5, "description": "One segment contains an endpoint of the other one"},
	"OVERLAP": {"value": 3, "description": "Both segments overlap each other, partially or completely"},
	"CLASSIC": {"value": 4, "description": "The segments intersect each other without sharing any endpoint at all"}
};

const trianglePositionTypes =
{
  	"INTERIOR" : { "description" : "The point lies in the interior of the triangle"},
	"VERTEX" : { "description" : "The point lies in a vertex of the triangle"},
	"BOUNDARY" : { "description" : "The point lies in an edge of the triangle"},
	"OUTSIDE" : { "description" : "The point lies outside of the triangle"}
};

const circleContainTypes =
{
  	  "INTERIOR" : { "description" : "The point lies in the interior of the circle"},
	  "BOUNDARY" : { "description" : "The point lies in the boundary of the circle"},
	  "OUTSIDE" : { "description" : "The point lies outside of the circle"}
};


function orientationTest(p, q, r)
{
	var det = determinant(p, q, r);

	if (det < 0)
		return orientations.RIGHT;

	if (det === 0)
		return orientations.ON_LINE;
	
	return orientations.LEFT;
}

function determinant(p, q, r)
{
	return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
}

// Cross-Product of 2 vectors
function crossProduct(v1, v2)
{
    return v1.x * v2.y - v1.y * v2.x;
}

function allSameValue()
{
    for (var i = 1; i < arguments.length; ++i)
    {
        if (arguments[i] !== arguments[0])
            return false;
    }

    return true;
}

function equalPoints(p1, p2)
{
    return p1.x === p2.x && p1.y === p2.y;
}

function classifyIntersection(s1, s2)
{
	var vectors = { "s1Vec" : { "x" : (s1.to.x - s1.from.x), "y" : (s1.to.y - s1.from.y) },
		"s2Vec" : { "x" : s2.to.x - s2.from.x, "y" : s2.to.y - s2.from.y },
		"s1Fs2F" : { "x" : s2.from.x - s1.from.x, "y" : s2.from.y - s1.from.y},
		"s1Fs2T" : { "x" : s2.to.x - s1.from.x, "y" : s2.to.y - s1.from.y},
		"s2Fs1F" : { "x" : s1.from.x - s2.from.x, "y" : s1.from.y - s2.from.y},
		"s2Fs1T" : { "x" : s1.to.x - s2.from.x, "y" : s1.to.y - s2.from.y} };
	
	var crossProds = { 	"s1s2F" : crossProduct(vectors.s1Vec, vectors.s1Fs2F),
						"s1s2T" : crossProduct(vectors.s1Vec, vectors.s1Fs2T),
						"s2s1F" : crossProduct(vectors.s2Vec, vectors.s2Fs1F),
						"s2s1T" : crossProduct(vectors.s2Vec, vectors.s2Fs1T) };
						
	var orientations = {"LEFT" : 0, "RIGHT" : 1};
						
	var amountOfZeros = (crossProds.s1s2F === 0) + (crossProds.s1s2T === 0) + (crossProds.s2s1F === 0) + (crossProds.s2s1T === 0);
	
	
	if (amountOfZeros === 0)
	{
		// Orientation tests. We check if the endpoint has different orientations compared to the origin point
		return (orientationTest(s1.from, s1.to, s2.from) != orientationTest(s1.from, s1.to, s2.to) &&
		orientationTest(s2.from, s2.to, s1.from) != orientationTest(s2.from, s2.to, s1.to) ?
		intersectionTypes.CLASSIC :
		intersectionTypes.NONE);
	}
	// Interior point or nothing
	else if (amountOfZeros === 1)
	{
		/* We need to check the 2 determinants that aren't 0 if they have same value. If they do,
		 * it means that the from and to of the vector is positioned to the same side respectively to the point. Therefore, NO interior point.
		*/
		if (crossProds.s1s2F === 0)
		{
			return (crossProds.s2s1F * crossProds.s2s1T < 0) ?
					intersectionTypes.INTERIOR_POINT_S1 :
					intersectionTypes.NONE;
		}

		if (crossProds.s1s2T === 0)
		{
			return (crossProds.s2s1F * crossProds.s2s1T < 0) ?
					intersectionTypes.INTERIOR_POINT_S2 :
					intersectionTypes.NONE;
		}
		
		return (crossProds.s1s2F * crossProds.s1s2T < 0) ? 
				intersectionTypes.INTERIOR_POINT :
				intersectionTypes.NONE;
	}
	// Endpoint. 100% sure
	else if (amountOfZeros === 2)
	{
		return intersectionTypes.ENDPOINT;
	}
	// Overlap, endpoint or nothing
	else if (amountOfZeros === 4)
	{
			if (!allSameValue(s2.from.x - s1.from.x < 0, s2.from.x - s1.to.x < 0, s2.to.x - s1.from.x < 0, s2.to.x - s1.to.x < 0) ||
                !allSameValue(s2.from.y - s1.from.y < 0, s2.from.y - s1.to.y < 0, s2.to.y - s1.from.y < 0, s2.to.y - s1.to.y < 0))
            {
                // They are collinear and they overlap each other (partially or completely)
                return intersectionTypes.OVERLAP;
            }
			
			// They share an endpoint
			if (equalPoints(s1.from, s2.from) || equalPoints(s1.from, s2.to) || equalPoints(s1.to, s2.from) || equalPoints(s1.to, s2.to))
			{
				return intersectionTypes.ENDPOINT;
			}
			
			return intersectionTypes.NONE;
	}
	
	return intersectionTypes.NONE;
}

function classifyPointInTriangle(p, triangle)
{	
	var dets = [determinant(triangle[0], triangle[1], p),
				determinant(triangle[1], triangle[2], p),
				determinant(triangle[2], triangle[0], p)];
  
	var pos = -1;
	var count = 0;
	// Find out which determinant is 0
	for (var i = 0; i < 3; ++i)
	{
	  if (dets[i] === 0)
	  {
		pos = i;
		++count;
	  }
	}
  
	// The point lies in a vertex
	if (count === 2)
	{
	  return trianglePositionTypes.VERTEX;
	}
  
	// The point may lie in an edge        
	if (pos !== -1)
	{
	  var nextPoint = triangle[(pos + 1) % 3];
	  // Could have been done with orientation tests as well, checking whether 2 consecutive determinants had the same sign
	  if (!allSameValue(triangle[pos].x - p.x < 0, nextPoint.x - p.x < 0) ||
		  !allSameValue(triangle[pos].y - p.y < 0, nextPoint.y - p.y < 0))
	  {
		return trianglePositionTypes.BOUNDARY;
	  }
	  
	  // Collinear but not contained by the edge
	  return trianglePositionTypes.OUTSIDE;
	}
  
	// If all the determinants have the same sign, the orientation test indicates it's inside, else it's ouside
	return ((dets[0] < 0) === (dets[1] < 0)) && ((dets[1] < 0) === (dets[2] < 0)) ? trianglePositionTypes.INTERIOR : trianglePositionTypes.OUTSIDE; 
}

function determinant4(x, a, b, c)
{
    var matrix =
    [
      [b.x - a.x, b.y - a.y, (b.x - a.x) * (b.x + a.x) + (b.y - a.y) * (b.y + a.y)],
      [c.x - a.x, c.y - a.y, (c.x - a.x) * (c.x + a.x) + (c.y - a.y) * (c.y + a.y)],
      [x.x - a.x, x.y - a.y, (x.x - a.x) * (x.x + a.x) + (x.y - a.y) * (x.y + a.y)]
    ];
    
    /* 
    *          a b c
    * matrix = d e f
    *          g h i
    * 
    * determinant = a*(e*i - f*h) - b*(d*i-f*g) + c*(d*h - e*g)
    * 
    */

    return matrix[0][0] * (matrix[1][1]*matrix[2][2] - matrix[1][2]*matrix[2][1]) -
         matrix[0][1] * (matrix[1][0]*matrix[2][2] - matrix[1][2]*matrix[2][0]) +
         matrix[0][2] * (matrix[1][0]*matrix[2][1] - matrix[1][1]*matrix[2][0]);
}

function determinant3(circle_points)
{
  return (circle_points[1].x - circle_points[0].x) * (circle_points[2].y - circle_points[0].y) - (circle_points[1].y - circle_points[0].y) * (circle_points[2].x - circle_points[0].x);
}

function circleContains(p, circle_points) {
	var det = determinant4(p, circle_points[0], circle_points[1], circle_points[2]);
  
	var clockwise = determinant3(circle_points);
	
	if (det === 0)
	  return circleContainTypes.BOUNDARY;
  
	if (det * clockwise < 0)
	  return circleContainTypes.INTERIOR;
  
	return circleContainTypes.OUTSIDE;
  }