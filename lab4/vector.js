function Vector(a, b, c)
{
	// We are getting 2 points
	if (c === undefined)
	{
		var point = Point.substract(a, b);
		this.x = point.x;
		this.y = point.y;
		this.z = point.z;
	}
	else // We are getting 3 coordinates
	{
			this.x = a;
			this.y = b;
			this.z = c;
	}
}