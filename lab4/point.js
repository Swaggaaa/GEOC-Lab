function Point(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

Point.substract = function(p1, p2)
{
	return new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
}

Point.add = function(p1, p2)
{
	return new Point(p1.x + p2.x, p1.y + p2.y, p1.z + p2.z);
}
