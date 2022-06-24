/**
 * Determine the relative orientation of three points in two-dimensional space.
 * The result is also an approximation of twice the signed area of the triangle defined by the three points.
 * This method is fast - but not robust against issues of floating point precision. Best used with integer coordinates.
 * Adapted from https://github.com/mourner/robust-predicates
 * @memberof helpers
 *
 * @param {Point} a     An endpoint of segment AB, relative to which point C is tested
 * @param {Point} b     An endpoint of segment AB, relative to which point C is tested
 * @param {Point} c     A point that is tested relative to segment AB
 *
 * @returns {number}    The relative orientation of points A, B, and C
 *                      A positive value if the points are in counter-clockwise order (C lies to the left of AB)
 *                      A negative value if the points are in clockwise order (C lies to the right of AB)
 *                      Zero if the points A, B, and C are collinear.
 */
export function orient2dFast(a, b, c) {
  return (a.y - c.y) * (b.x - c.x) - (a.x - c.x) * (b.y - c.y);
}

/* -------------------------------------------- */

/**
 * Quickly test whether the line segment AB intersects with the line segment CD.
 * This method does not determine the point of intersection, for that use lineLineIntersection
 * @memberof helpers
 *
 * @param {Point} a                   The first endpoint of segment AB
 * @param {Point} b                   The second endpoint of segment AB
 * @param {Point} c                   The first endpoint of segment CD
 * @param {Point} d                   The second endpoint of segment CD
 *
 * @returns {boolean}                 Do the line segments intersect?
 */
export function lineSegmentIntersects(a, b, c, d) {

  // First test the orientation of A and B with respect to CD to reject collinear cases
  const xa = foundry.utils.orient2dFast(a, b, c);
  const xb = foundry.utils.orient2dFast(a, b, d);
  if ( !xa && !xb ) return false;
  const xab = (xa * xb) <= 0;

  // Also require an intersection of CD with respect to AB
  const xcd = (foundry.utils.orient2dFast(c, d, a) * foundry.utils.orient2dFast(c, d, b)) <= 0;
  return xab && xcd;
}

/* -------------------------------------------- */

/**
 * @typedef {Object}                  LineIntersection
 * @property {number} x               The x-coordinate of intersection
 * @property {number} y               The y-coordinate of intersection
 * @property {number} t0              The vector distance from A to B on segment AB
 * @property {number} [t1]            The vector distance from C to D on segment CD
 */

/**
 * An internal helper method for computing the intersection between two infinite-length lines.
 * Adapted from http://paulbourke.net/geometry/pointlineplane/
 * @memberof helpers
 *
 * @param {Point} a                   The first endpoint of segment AB
 * @param {Point} b                   The second endpoint of segment AB
 * @param {Point} c                   The first endpoint of segment CD
 * @param {Point} d                   The second endpoint of segment CD
 *
 * @returns {LineIntersection|null}   An intersection point, or null if no intersection occurred
 */
export function lineLineIntersection(a, b, c, d) {

  // If either line is length 0, they cannot intersect
  if (((a.x === b.x) && (a.y === b.y)) || ((c.x === d.x) && (c.y === d.y))) return null;

  // Check denominator - avoid parallel lines where d = 0
  const dnm = ((d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y));
  if (dnm === 0) return null;

  // Vector distance from a
  const t0 = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / dnm;

  // Return the point of intersection
  return {
    x: a.x + t0 * (b.x - a.x),
    y: a.y + t0 * (b.y - a.y),
    t0: t0
  }
}

/* -------------------------------------------- */

/**
 * An internal helper method for computing the intersection between two finite line segments.
 * Adapted from http://paulbourke.net/geometry/pointlineplane/
 * @memberof helpers
 *
 * @param {Point} a                   The first endpoint of segment AB
 * @param {Point} b                   The second endpoint of segment AB
 * @param {Point} c                   The first endpoint of segment CD
 * @param {Point} d                   The second endpoint of segment CD
 * @param {number} [epsilon]          A small epsilon which defines a tolerance for near-equality
 * *
 * @returns {LineIntersection|null}   An intersection point, or null if no intersection occurred
 */
export function lineSegmentIntersection(a, b, c, d, epsilon=1e-8) {

  // If either line is length 0, they cannot intersect
  if (((a.x === b.x) && (a.y === b.y)) || ((c.x === d.x) && (c.y === d.y))) return null;

  // Check denominator - avoid parallel lines where d = 0
  const dnm = ((d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y));
  if (dnm === 0) return null;

  // Vector distance from a
  const t0 = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / dnm;
  if ( !Number.between(t0, 0-epsilon, 1+epsilon) ) return null;

  // Vector distance from c
  const t1 = ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / dnm;
  if ( !Number.between(t1, 0-epsilon, 1+epsilon) ) return null;

  // Return the point of intersection and the vector distance from both line origins
  return {
    x: a.x + t0 * (b.x - a.x),
    y: a.y + t0 * (b.y - a.y),
    t0: Math.clamped(t0, 0, 1),
    t1: Math.clamped(t1, 0, 1)
  }
}

/* -------------------------------------------- */

/**
 * @typedef {Object} LineCircleIntersection
 * @property {boolean} aInside        Is point A inside the circle?
 * @property {boolean} bInside        Is point B inside the circle?
 * @property {boolean} contained      Is the segment AB contained within the circle?
 * @property {boolean} outside        Is the segment AB fully outside the circle?
 * @property {boolean} tangent        Is the segment AB tangent to the circle?
 * @property {Point[]} intersections  Intersection points: zero, one, or two
 */

/**
 * Determine the intersection between a candidate wall and the circular radius of the polygon.
 * @memberof helpers
 *
 * @param {Point} a                   The initial vertex of the candidate edge
 * @param {Point} b                   The second vertex of the candidate edge
 * @param {Point} center              The center of the bounding circle
 * @param {number} radius             The radius of the bounding circle
 * @param {number} epsilon            A small tolerance for floating point precision
 *
 * @returns {LineCircleIntersection}  The intersection of the segment AB with the circle
 */
export function lineCircleIntersection(a, b, center, radius, epsilon=1e-8) {
  const r2 = Math.pow(radius, 2);
  let intersections = [];

  // Test whether endpoint A is contained
  const ar2 = Math.pow(a.x - center.x, 2) + Math.pow(a.y - center.y, 2);
  const aInside = ar2 <= r2 + epsilon;

  // Test whether endpoint B is contained
  const br2 = Math.pow(b.x - center.x, 2) + Math.pow(b.y - center.y, 2);
  const bInside = br2 <= r2 + epsilon;

  // Find quadratic intersection points
  const contained = aInside && bInside;
  if ( !contained ) {
    intersections = quadraticIntersection(a, b, center, radius, epsilon);
  }

  // Return the intersection data
  return {
    aInside,
    bInside,
    contained,
    outside: !contained && !intersections.length,
    tangent: !aInside && !bInside && intersections.length === 1,
    intersections
  };
}

/* -------------------------------------------- */

/**
 * Identify the point closest to C on segment AB
 * @memberof helpers
 *
 * @param {Point} c     The reference point C
 * @param {Point} a     Point A on segment AB
 * @param {Point} b     Point B on segment AB
 *
 * @returns {Point}     The closest point to C on segment AB
 */
export function closestPointToSegment(c, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (( dx === 0 ) && ( dy === 0 )) {
    throw new Error("Zero-length segment AB not supported");
  }
  const u = (((c.x - a.x) * dx) + ((c.y - a.y) * dy)) / (dx * dx + dy * dy);
  if ( u < 0 ) return a;
  if ( u > 1 ) return b;
  else return {
    x: a.x + (u * dx),
    y: a.y + (u * dy)
  }
}

/* -------------------------------------------- */

/**
 * Determine the points of intersection between a line segment (p0,p1) and a circle.
 * There will be zero, one, or two intersections
 * See https://math.stackexchange.com/a/311956
 * @memberof helpers
 *
 * @param {Point} p0            The initial point of the line segment
 * @param {Point} p1            The terminal point of the line segment
 * @param {Point} center        The center of the circle
 * @param {number} radius       The radius of the circle
 * @param {number} [epsilon=0]  A small tolerance for floating point precision
 */
export function quadraticIntersection(p0, p1, center, radius, epsilon=0) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;

  // Quadratic terms where at^2 + bt + c = 0
  const a = Math.pow(dx, 2) + Math.pow(dy, 2);
  const b = (2 * dx * (p0.x - center.x)) + (2 * dy * (p0.y - center.y));
  const c = Math.pow(p0.x - center.x, 2) + Math.pow(p0.y - center.y, 2) - Math.pow(radius, 2);

  // Discriminant
  const disc2 = Math.pow(b, 2) - (4 * a * c);
  if ( disc2 <= 0 ) return []; // no intersections

  // Roots
  const disc = Math.sqrt(disc2);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);

  // If t1 hits (between 0 and 1) it indicates an "entry"
  const intersections = [];
  if ( t1.between(0-epsilon, 1+epsilon) ) {
    intersections.push({
      x: p0.x + (dx * t1),
      y: p0.y + (dy * t1)
    });
  }

  // If t2 hits (between 0 and 1) it indicates an "exit"
  if ( t2.between(0-epsilon, 1+epsilon) ) {
    intersections.push({
      x: p0.x + (dx * t2),
      y: p0.y + (dy * t2)
    });
  }
  return intersections;
}
