function DCEL(p1, p2, p3)
{
    this.dcelTable = [];
    this.vertexTable = [];
    this.faceTable = [];

    this.vertexTable.push(
        new Vertex(p1, 0),
        new Vertex(p2, 1),
        new Vertex(p3, 2)
    );

    this.faceTable.push(
        new Face(0),
        new Face(0)
    );

    this.dcelTable.push(
        new Edge(0, 1, 1, 0, 2, 1),
        new Edge(1, 2, 1, 0, 0, 2),
        new Edge(2, 0, 1, 0, 1, 0)
    )
}

function Vertex(point, edgeIndex)
{
    this.point = point;
    this.edgeIndex = edgeIndex;
}

function Face(edgeIndex)
{
    this.edgeIndex = edgeIndex;
}

function Edge(vertexBeginIndex, vertexEndIndex, faceLeftIndex, faceRightIndex, edgePrevIndex, edgeNextIndex)
{
    this.vertexBeginIndex = vertexBeginIndex;
    this.vertexEndIndex = vertexEndIndex;
    this.faceLeftIndex = faceLeftIndex;
    this.faceRightIndex = faceRightIndex;
    this.edgePrevIndex = edgePrevIndex;
    this.edgeNextIndex = edgeNextIndex;
}

function Triangle()
{
    this.edges = [];
    this.vertices = [];
    this.faces = [];
}

DCEL.prototype.findFaceOf = function(point, referencePoint)
{
    let currentVertexIndex = 3; // First position
    let currentEdgeIndex = null;
    let lastFace = null;
    let checkedFaces = [];
    let face = null;

    while (!face)
    {
        if (currentVertexIndex)
        {
            let currentFaces = [];
            let currentEdges = [];

            let startingEdge = this.vertexTable[currentVertexIndex].edgeIndex;

            if (this.dcelTable[startingEdge].vertexBeginIndex === currentVertexIndex)
            {
                if (checkedFaces.indexOf(this.dcelTable[startingEdge].faceLeftIndex) === -1)
                {
                    currentFaces.push(this.dcelTable[startingEdge].faceLeftIndex);
                    currentEdges.push(startingEdge);
                }

                currentEdgeIndex = this.dcelTable[startingEdge].edgePrevIndex;
            }
            else
            {
                if (checkedFaces.indexOf(this.dcelTable[startingEdge].faceRightIndex) === -1)
                {
                    currentFaces.push(this.dcelTable[startingEdge].faceRightIndex);
                    currentEdges.push(startingEdge);
                }

                currentEdgeIndex = this.dcelTable[startingEdge].edgeNextIndex;
            }

            while (startingEdge != currentEdgeIndex)
            {
                if (this.dcelTable[currentEdgeIndex].vertexBeginIndex === currentVertexIndex)
                {
                    if (checkedFaces.indexOf(this.dcelTable[currentEdgeIndex].faceLeftIndex) === -1)
                    {
                        currentFaces.push(this.dcelTable[currentEdgeIndex].faceLeftIndex);
                        currentEdges.push(currentEdgeIndex);
                    }
    
                    currentEdgeIndex = this.dcelTable[currentEdgeIndex].edgePrevIndex;    
                }
                else
                {
                    if (checkedFaces.indexOf(this.dcelTable[currentEdgeIndex].faceRightIndex) === -1)
                    {
                        currentFaces.push(this.dcelTable[currentEdgeIndex].faceRightIndex);
                        currentEdges.push(currentEdgeIndex);
                    }
    
                    currentEdgeIndex = this.dcelTable[currentEdgeIndex].edgeNextIndex;
                }
            }

            let triangles = [];
            for (let i = 0; i < currentFaces.length; ++i)
            {
                let triangle = this.findTriangle(currentFaces[i]);
                triangles.push(triangle);

                let vertexTriangle = [this.vertexTable[triangle.vertices[0]].point,
                this.vertexTable[triangle.vertices[1]].point,
                this.vertexTable[triangle.vertices[2]].point];

                if (classifyPointInTriangle(point, vertexTriangle) !== trianglePositionTypes.OUTSIDE)
                {
                    // https://www.youtube.com/watch?v=EIph0BJNrxo
                    face = currentFaces[i];
                    break;
                }
            }

            if (!face)
            {
                checkedFaces = checkedFaces.concat(currentFaces);

                let leave = false;
                for (let i = 0; i < triangles.length && !leave; ++i)
                {
                    let currentTriangle = triangles[i];
                    for (let j = 0; j < triangles[i].edges.length; ++j)
                    {
                        if (this.dcelTable[currentTriangle.edges[j]].vertexBeginIndex === currentVertexIndex ||
                            this.dcelTable[currentTriangle.edges[j]].vertexEndIndex === currentVertexIndex)
                            continue;

                        let s1 = {};
                        let s2 = {};
                        let beginVertexIndex = this.dcelTable[currentTriangle.edges[j]].vertexBeginIndex;
                        let endVertexIndex = this.dcelTable[currentTriangle.edges[j]].vertexEndIndex;
                        s2.from = this.vertexTable[beginVertexIndex].point;
                        s2.to = this.vertexTable[endVertexIndex].point;
                        s1.from = referencePoint;
                        s1.to = point;

                        let tracingIntersection = classifyIntersection(s1, s2);
                        if (tracingIntersection === intersectionTypes.NONE)
                            continue;

                        if (tracingIntersection === intersectionTypes.INTERIOR_POINT_S1)
                        {
                            // The only vertex that is not related to the current Edge
                            currentVertexIndex = this.vertexTable[beginVertexIndex];
                            currentEdgeIndex = null;
                            leave = true;
                            break;
                        }

                        if (tracingIntersection === intersectionTypes.INTERIOR_POINT_S2)
                        {
                            // The only vertex that is not related to the current Edge
                            currentVertexIndex = this.vertexTable[endVertexIndex];
                            currentEdgeIndex = null;
                            leave = true;
                            break;
                        }

                        if (tracingIntersection === intersectionTypes.CLASSIC)
                        {
                            currentVertexIndex = null;
                            currentEdgeIndex = currentTriangle.edges[j];
                            lastFace = currentFaces[i];
                            leave = true;
                            break;
                        }

                        if (tracingIntersection === intersectionTypes.ENDPOINT || 
                            tracingIntersection === intersectionTypes.OVERLAP)
                            {
                                console.log("ERROR: This shouldn't be possible at all")
                                debugger;
                            }
                    }
                }
            }
        }
        else
        {
            let currentFaceIndex = lastFace === this.dcelTable[currentEdgeIndex].faceLeftIndex ? 
                                   this.dcelTable[currentEdgeIndex].faceRightIndex :
                                   this.dcelTable[currentEdgeIndex].faceLeftIndex;

            let currentTriangle = this.findTriangle(currentFaceIndex);
            let vertexTriangle = [this.vertexTable[currentTriangle.vertices[0]].point,
                                    this.vertexTable[currentTriangle.vertices[1]].point,
                                    this.vertexTable[currentTriangle.vertices[2]].point];

            let triangleType = classifyPointInTriangle(point, vertexTriangle);

            if (triangleType !== trianglePositionTypes.OUTSIDE)
            {
                // https://www.youtube.com/watch?v=EIph0BJNrxo
                face = currentFaceIndex;
            }
            else
            {
                for (let i = 0; i < currentTriangle.edges.length; ++i)
                {
                    if (currentTriangle.edges[i] === currentEdgeIndex)
                        continue;

                    let s1 = {};
                    let s2 = {};
                    let beginVertexIndex = this.dcelTable[currentTriangle.edges[i]].vertexBeginIndex;
                    let endVertexIndex = this.dcelTable[currentTriangle.edges[i]].vertexEndIndex;
                    s2.from = this.vertexTable[beginVertexIndex].point;
                    s2.to = this.vertexTable[endVertexIndex].point;
                    s1.from = referencePoint;
                    s1.to = point;

                    let tracingIntersection = classifyIntersection(s1, s2);
                    if (tracingIntersection === intersectionTypes.NONE)
                        continue;

                    if (tracingIntersection === intersectionTypes.INTERIOR_POINT_S1)
                    {
                        // The only vertex that is not related to the current Edge
                        currentVertexIndex = this.vertexTable[beginVertexIndex];
                        currentEdgeIndex = null;
                        leave = true;
                        break;
                    }

                    if (tracingIntersection === intersectionTypes.INTERIOR_POINT_S2)
                    {
                        // The only vertex that is not related to the current Edge
                        currentVertexIndex = this.vertexTable[endVertexIndex];
                        currentEdgeIndex = null;
                        leave = true;
                        break;
                    }

                    if (tracingIntersection === intersectionTypes.CLASSIC)
                    {
                        currentVertexIndex = null;
                        currentEdgeIndex = currentTriangle.edges[i];
                        break;
                    }

                    if (tracingIntersection === intersectionTypes.ENDPOINT || 
                        tracingIntersection === intersectionTypes.OVERLAP)
                        {
                           console.log("ERROR: This shouldn't be possible at all");
                           debugger;
                        }
                }
            }

            lastFace = currentFaceIndex;
            checkedFaces.push(lastFace);
        }
    }

    return face;

}

DCEL.prototype.splitEdge = function(edgeIndex, pointIndex, faceIndex)
{
    let edge = Object.assign({}, this.dcelTable[edgeIndex]);
    let triangle = this.findTriangle(faceIndex);
    let oppositeFaceIndex = edge.faceLeftIndex === faceIndex ? edge.faceRightIndex : edge.faceLeftIndex;
    let oppositeTriangle = this.findTriangle(oppositeFaceIndex);
    let romboide = this.joinTriangles(triangle, oppositeTriangle, edgeIndex);

    this.faceTable.push(
        new Face(null),
        new Face(null));

    this.dcelTable.push(new Edge(null, null, null, null, null, null),
                        new Edge(null, null, null, null, null, null),
                        new Edge(null, null, null, null, null, null)); // To be updated later!!!

    for (let i = 0; i < 4; ++i)
    {
        if (this.dcelTable[romboide.edges[i]].faceLeftIndex === (i < 2 ? faceIndex : oppositeFaceIndex))
        {
            this.dcelTable[romboide.edges[i]].faceLeftIndex = romboide.faces[i];
            this.dcelTable[romboide.edges[i]].edgePrevIndex = romboide.internalEdges[i];
        }
        else
        {
            this.dcelTable[romboide.edges[i]].faceRightIndex = romboide.faces[i];
            this.dcelTable[romboide.edges[i]].edgeNextIndex = romboide.internalEdges[i];
        }

        this.vertexTable[romboide.vertices[i]].edgeIndex = romboide.internalEdges[i];

        this.faceTable[romboide.faces[i]].edgeIndex = romboide.edges[i];

        this.dcelTable[romboide.internalEdges[i]].vertexBeginIndex = pointIndex;
        this.dcelTable[romboide.internalEdges[i]].vertexEndIndex = romboide.vertices[i];
        this.dcelTable[romboide.internalEdges[i]].faceLeftIndex = romboide.faces[i];
        this.dcelTable[romboide.internalEdges[i]].faceRightIndex = romboide.faces[(i+3) % 4];
        this.dcelTable[romboide.internalEdges[i]].edgePrevIndex = romboide.internalEdges[(i+1) % 4]
        this.dcelTable[romboide.internalEdges[i]].edgeNextIndex = romboide.edges[(i+3) % 4];
    }

    return romboide;
}

DCEL.prototype.joinTriangles = function(triangle, oppositeTriangle, edgeIndex)
{
    let edgeIndex1, edgeIndex2;

    for (let i = 0; i < 3; ++i)
    {
        if (triangle.edges[i] === edgeIndex)
            edgeIndex1 = i;
        
        if (oppositeTriangle.edges[i] === edgeIndex)
            edgeIndex2 = i;
    }

    let romboide = {};
    romboide.edges = [
        triangle.edges[(edgeIndex1 + 1) % 3],
        triangle.edges[(edgeIndex1 + 2) % 3],
        oppositeTriangle.edges[(edgeIndex2 + 1) % 3],
        oppositeTriangle.edges[(edgeIndex2 + 2) % 3]];

    romboide.vertices = [
        triangle.vertices[(edgeIndex1 + 1) % 3],
        triangle.vertices[(edgeIndex1 + 2) % 3],
        oppositeTriangle.vertices[(edgeIndex2 + 1) % 3], 
        oppositeTriangle.vertices[(edgeIndex2 + 2) % 3]];

    romboide.faces = [
        triangle.faces[0],
        oppositeTriangle.faces[0],
        this.faceTable.length,
        this.faceTable.length + 1];

    romboide.internalEdges = [
        edgeIndex,
        this.dcelTable.length,
        this.dcelTable.length + 1,
        this.dcelTable.length + 2
    ];

    return romboide;
}

DCEL.prototype.findTriangle = function(faceIndex)
{
    var triangle = {};

    let currentEdgeIndex = this.faceTable[faceIndex].edgeIndex;
    let currentEdge = this.dcelTable[currentEdgeIndex];
    let edge2Index = currentEdge.faceLeftIndex === faceIndex ? currentEdge.edgePrevIndex : currentEdge.edgeNextIndex;
    let edge2 = this.dcelTable[edge2Index];
    let edgeIndex = edge2.faceLeftIndex === faceIndex ? edge2.edgePrevIndex : edge2.edgeNextIndex;
    let edge = this.dcelTable[edgeIndex];

    triangle.edges = [currentEdgeIndex, edgeIndex, edge2Index];
    triangle.vertices = [
        currentEdge.faceLeftIndex === faceIndex ? currentEdge.vertexBeginIndex : currentEdge.vertexEndIndex,
        edge.faceLeftIndex === faceIndex ? edge.vertexBeginIndex : edge.vertexEndIndex,
        edge2.faceLeftIndex === faceIndex ? edge2.vertexBeginIndex : edge2.vertexEndIndex,
    ];
    triangle.faces = [faceIndex, this.faceTable.length, this.faceTable.length + 1];

    return triangle;
}

DCEL.prototype.getOverlappingLine = function(point, edges)
{
    for (let i = 0; i < 3; ++i)
    {
        if (orientationTest(
            this.vertexTable[this.dcelTable[edges[i]].vertexBeginIndex].point,
            this.vertexTable[this.dcelTable[edges[i]].vertexEndIndex].point,
            point) === orientations.ON_LINE)
        {
            return edges[i];
        }
    }

    return null;
}

DCEL.prototype.applyDelaunay = function(pointIndex, faces)
{
    for (let face of faces)
    {
        let triangle = this.findTriangle(face);

        for (let edge of triangle.edges)
        {
            if (this.dcelTable[edge].vertexBeginIndex === pointIndex ||
                this.dcelTable[edge].vertexEndIndex === pointIndex)
                continue;

            let oppositeFace = this.dcelTable[edge].faceLeftIndex === face ?
                                    this.dcelTable[edge].faceRightIndex :
                                    this.dcelTable[edge].faceLeftIndex;

            // Infinity face
            if (oppositeFace === 0)
                continue;

            let oppositeTriangle = this.findTriangle(oppositeFace);

            let points = oppositeTriangle.vertices.map(vertex => this.vertexTable[vertex].point);
            let contains = circleContains(this.vertexTable[pointIndex].point, points);
            if (contains === circleContainTypes.BOUNDARY || contains === circleContainTypes.INTERIOR)
            {
                this.delaunayFlip(pointIndex, edge, face, oppositeTriangle);
                faces.push(oppositeFace);
                faces.push(face);
            }
        }
    }
}

DCEL.prototype.delaunayFlip = function(pointIndex, edge, face, oppositeTriangle)
{
    let triangle = this.findTriangle(face);

    let romboide = this.joinTriangles(triangle, oppositeTriangle, edge);
    romboide.previousFaces = [face, face, oppositeTriangle.faces[0], oppositeTriangle.faces[0]];
    romboide.newFaces = [face, oppositeTriangle.faces[0], oppositeTriangle.faces[0], face];
    romboide.newEdges = [romboide.edges[3], edge, romboide.edges[1], edge];

    this.vertexTable[romboide.vertices[0]].edgeIndex = romboide.edges[0];
    this.vertexTable[romboide.vertices[2]].edgeIndex = romboide.edges[1];

    this.faceTable[face].edgeIndex = edge;
    this.faceTable[oppositeTriangle.faces[0]].edgeIndex = edge;

    this.dcelTable[edge].vertexBeginIndex = pointIndex;
    this.dcelTable[edge].vertexEndIndex = romboide.vertices[3];
    this.dcelTable[edge].faceLeftIndex = face;
    this.dcelTable[edge].faceRightIndex = oppositeTriangle.faces[0]; // Original face
    this.dcelTable[edge].edgePrevIndex = romboide.edges[0];
    this.dcelTable[edge].edgeNextIndex = romboide.edges[2];

    for (let i = 0; i < romboide.edges.length; ++i)
    {
        if (this.dcelTable[romboide.edges[i]].faceLeftIndex === romboide.previousFaces[i])
        {
            this.dcelTable[romboide.edges[i]].faceLeftIndex = romboide.newFaces[i];
            this.dcelTable[romboide.edges[i]].edgePrevIndex = romboide.newEdges[i];
        }
        else
        {
            this.dcelTable[romboide.edges[i]].faceRightIndex = romboide.newFaces[i]
            this.dcelTable[romboide.edges[i]].edgeNextIndex = romboide.newEdges[i];
        }
    }
}

DCEL.prototype.add = function(point, faceIndex)
{
    this.vertexTable.push(
        new Vertex(point, this.dcelTable.length) // Length = the new edge to be added
    );

    let triangle = this.findTriangle(faceIndex);
    let pointIndex = this.vertexTable.length - 1;

    let overlappingEdgeIndex = this.getOverlappingLine(point, triangle.edges);

    let faces = null;

    // Degenerate cases. We need to partitionate an edge into 2 and create 2 more (and 2 faces)
    if (overlappingEdgeIndex)
    {
        let romboide = this.splitEdge(overlappingEdgeIndex, this.vertexTable.length - 1, faceIndex);
        faces = romboide.faces;
    }
    else
    {
        let edge1 = new Edge(
            pointIndex,
            triangle.vertices[0],
            triangle.faces[0],
            triangle.faces[2],
            this.dcelTable.length + 1,
            triangle.edges[2]
        );

        let edge2 = new Edge(
            pointIndex,
            triangle.vertices[1],
            triangle.faces[1],
            triangle.faces[0],
            this.dcelTable.length + 2,
            triangle.edges[0]
        );

        let edge3 = new Edge(
            pointIndex,
            triangle.vertices[2],
            triangle.faces[2],
            triangle.faces[1],
            this.dcelTable.length,
            triangle.edges[1]
        );

        this.dcelTable.push(edge1, edge2, edge3);
        for (let i = 0; i < 3; ++i)
        {
            if (this.dcelTable[triangle.edges[i]].faceLeftIndex === faceIndex)
            {
                this.dcelTable[triangle.edges[i]].faceLeftIndex = triangle.faces[i];
                this.dcelTable[triangle.edges[i]].edgePrevIndex = this.dcelTable.length - 3 + i;
            }
            else
            {
                this.dcelTable[triangle.edges[i]].faceRightIndex = triangle.faces[i];
                this.dcelTable[triangle.edges[i]].edgeNextIndex = this.dcelTable.length - 3 + i;
            }
        }

        this.faceTable.push(
            new Face(triangle.edges[1]),
            new Face(triangle.edges[2])
        );

        faces = [faceIndex, this.faceTable.length - 2, this.faceTable.length - 1];
    }

    this.applyDelaunay(pointIndex, faces);
}

DCEL.prototype.pruneBoundaries = function(boundaries)
{
    for (let boundary of boundaries)
	{
		// Simple case
		if (boundary.length === 1)
		{
			let vertex = this.vertexTable[boundary[0] + 3];
			let edgeIndex = vertex.edgeIndex;
			let currentEdge = null;

			if (this.dcelTable[edgeIndex].vertexBeginIndex === boundary[0] + 3)
			{
				this.faceTable[this.dcelTable[edgeIndex].faceLeftIndex].external = true;
				currentEdge = this.dcelTable[edgeIndex].edgePrevIndex;
			}
			else
			{
				this.faceTable[this.dcelTable[edgeIndex].faceRightIndex].external = true;
				currentEdge = this.dcelTable[edgeIndex].edgeNextIndex;
            }

			while (currentEdge != edgeIndex)
			{
				if (this.dcelTable[currentEdge].vertexBeginIndex === boundary[0] + 3)
				{
					this.faceTable[this.dcelTable[currentEdge].faceLeftIndex].external = true;
					currentEdge = this.dcelTable[currentEdge].edgePrevIndex;
				}
				else
				{
					this.faceTable[this.dcelTable[currentEdge].faceRightIndex].external = true;
					currentEdge = this.dcelTable[currentEdge].edgeNextIndex;
				}
            }
		}
		else //O boi, here we go
		{
            let prevVertex = boundary[boundary.length - 1] + 3;
            let currentVertex = boundary[0] + 3;
            let nextVertex = boundary[1] + 3;

            let currentEdgeIndex = this.vertexTable[currentVertex].edgeIndex;
            let found = false;
            while (!found)
            {
                if ((this.dcelTable[currentEdgeIndex].vertexBeginIndex === currentVertex && this.dcelTable[currentEdgeIndex].vertexEndIndex === prevVertex) ||
                (this.dcelTable[currentEdgeIndex].vertexEndIndex === currentVertex && this.dcelTable[currentEdgeIndex].vertexBeginIndex === prevVertex))
                {
                    found = true;
                }
                else
                {
                    currentEdgeIndex = this.dcelTable[currentEdgeIndex].vertexBeginIndex === currentVertex ?
                                        this.dcelTable[currentEdgeIndex].edgePrevIndex :
                                        this.dcelTable[currentEdgeIndex].edgeNextIndex
                }
            }

            for (let i = 0; i < boundary.length; ++i)
            {
                while ((this.dcelTable[currentEdgeIndex].vertexBeginIndex !== currentVertex || this.dcelTable[currentEdgeIndex].vertexEndIndex !== nextVertex) &&
                        (this.dcelTable[currentEdgeIndex].vertexBeginIndex !== nextVertex || this.dcelTable[currentEdgeIndex].vertexEndIndex !== currentVertex))
                {
                    if (this.dcelTable[currentEdgeIndex].vertexBeginIndex === currentVertex)
                    {
                        this.faceTable[this.dcelTable[currentEdgeIndex].faceLeftIndex].external = true;
                        currentEdgeIndex = this.dcelTable[currentEdgeIndex].edgePrevIndex;
                    }
                    else
                    {
                        this.faceTable[this.dcelTable[currentEdgeIndex].faceRightIndex].external = true;
                        currentEdgeIndex = this.dcelTable[currentEdgeIndex].edgeNextIndex;
                    }
                }

                prevVertex = currentVertex;
                currentVertex = nextVertex;
                nextVertex = boundary[(i + 2) % boundary.length] + 3;
            }
		}
	}
}