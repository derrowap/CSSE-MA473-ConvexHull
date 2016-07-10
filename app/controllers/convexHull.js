'use strict';

/*
TODO:

UI options:
  resize screen based on max of points

screenshots of 2 or 3 runs (not 25 points file)

Document on time analysis:
  Analyze time results
  graph (file-size vs calculation time)
    fit data to approprate curve Ex: O(n^3)
  How large a file can you process in a reasonable amoutn of time with each algorithm?
    Try running it with graphics turned off

Brief document stating I did not recieve code from anyone else or share my code for this project with anyone else
*/

angular.module('app.convexHull', []).
controller('convexHullCtrl', function($scope, $http) {
  var canvas = document.getElementById("myCanvas");
  var ctx = canvas.getContext("2d");
  var HEIGHT = 1080; // Height constant of the canvas
  var WIDTH = 1920; // Width constant of the canvas
  this.nonExtremePointSize = 3; // default value of the size of non-extreme points drawn on canvas
  this.extremePointSize = 3; // default value of the size of extreme points drawn on canvas
  this.lineThickness = 1; // default value for thickness of lines of connections on the Convex Hull


  /*
  Text inputs in order:
    25.txt,     x: 350,  y: 500
    250.txt,    x: 350,  y: 500
    1250.txt,   x: 350,  y: 500
    2500.txt,   x: 350,  y: 500
    5000.txt,   x: 350,  y: 500
    10000.txt,  x: 350,  y: 500
    25000.txt,  x: 683,  y: 500
    100000.txt, x: 683,  y: 500
    200000.txt, x: 1003, y: 600
    500000.txt  x: 1730, y: 998
  */

  var convexHullCtrl = this; // to allow controller variables to be referenced inside functions
  $scope.data = {}; // for text input data

  /**
   * With a given fileName, it will open the corresponding text file and return
   * a js promise which can be used to get the text file data.
   */
  var openFile = function (fileName) {
    return $http.get('files/' + fileName + '.txt').then(function (data) {
      convexHullCtrl.error = null;
      return data.data;
    }, function (error) {
      console.log("ERROR:", error);
      convexHullCtrl.error = error;
      return;
    });
  };

  /**
   * Opens the current indicated file from the textbox, and formats all the points
   * into a js object. After all of the points are formatted, it draws them
   * on the canvas.
   */
  this.loadFile = function() {
    convexHullCtrl.convexConnections = [];
    convexHullCtrl.runtime = null;
    var promise = openFile($scope.data.fileName);
    if (promise == null) { return; }
    promise.then(function (data) {
      // RegExp to get array of all points in text file
      var numbers = data.match(/[0-9]{3,4}|[0-9]{1,2}/g);
      var output = {};
      // var max_x = 0;
      // var max_y = 0;
      for (var i = 0; i < numbers.length; i += 2) {
        output[i/2] = {
          'x': parseInt(numbers[i]),
          'y': parseInt(numbers[i+1]),
          'extremePoint': false,
          'index': i/2
        };
        // max_x = Math.max(max_x, parseInt(numbers[i]));
        // max_y = Math.max(max_y, parseInt(numbers[i+1]));
      }
      // console.log("max x:", max_x, "max y:", max_y);
      convexHullCtrl.points = output;
      var size = Object.keys(convexHullCtrl.points).length;
      convexHullCtrl.pointsArray = [];
      for (var i = 0; i < size; i++) {
        convexHullCtrl.pointsArray.push(convexHullCtrl.points[i]);
      }
      drawPoints();
    });
  }

  /**
   * If there are points loaded, it will compute the indicated algorithm
   * based on which button the user clicked.
   */
  this.startAlgorithm = function (isQuickhull) {
    convexHullCtrl.runtime = null;
    convexHullCtrl.convexConnections = [];
    if ((convexHullCtrl.pointsArray == null) || (convexHullCtrl.pointsArray.length == 0)) {
      convexHullCtrl.error = "You first must load a text file of points!";
      return;
    }
    isQuickhull ? startQuickhull() : startConvexhull();
  };

  /**
   * Expects the points are loaded inside convexHullCtrl.points, and draws them
   * all on the canvas.
   *
   * If the point is an extreme point, such that it is in the Convex Hull,
   * the color will be red, else it is black.
   *
   * The user can independently change the size of both extreme and non-exteme
   * points by sliders on the webpage.
   */
  var drawPoints = function () {
    // clear current screen
    ctx.fillStyle = "cyan";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw points
    var size = Object.keys(convexHullCtrl.points).length;
    for (var i = 0; i < size; i++) {
      if (convexHullCtrl.points[i].extremePoint) {
        ctx.fillStyle = "red";
        ctx.fillRect(convexHullCtrl.points[i].x, convexHullCtrl.points[i].y, convexHullCtrl.extremePointSize, convexHullCtrl.extremePointSize);
      } else {
        ctx.fillStyle = "black";
        ctx.fillRect(convexHullCtrl.points[i].x, convexHullCtrl.points[i].y, convexHullCtrl.nonExtremePointSize, convexHullCtrl.nonExtremePointSize);
      }
    }
  };

  /**
   * Expects all connections in the Convex Hull to be loaded into
   * convexHullCtrl.convexConnections. Draws them on the canvas with the
   * user controllable line thickness.
   */
  var drawLines = function () {
    var size = convexHullCtrl.convexConnections.length;
    ctx.lineWidth = convexHullCtrl.lineThickness;
    for (var i = 0; i < size; i++) {
      ctx.beginPath();
      ctx.moveTo(convexHullCtrl.convexConnections[i][0].x, convexHullCtrl.convexConnections[i][0].y);
      ctx.lineTo(convexHullCtrl.convexConnections[i][1].x, convexHullCtrl.convexConnections[i][1].y);
      ctx.stroke();
    }
  };

  /**
   * Implements a merge sorting algorithm to sort all points in the input, arr.
   * Sorts them in nondecreasing order of their x-coordinate with ties
   * resolved by increasing y-coordinates.
   *
   * Runtime: O(N log(N))
   */
  var mergeSort = function (arr) {
    var len = arr.length;
    if (len < 2)
      return arr;
    var mid = Math.floor(len / 2),
        left = arr.slice(0, mid),
        right = arr.slice(mid);
    return merge(mergeSort(left), mergeSort(right));
  }

  /**
   * Helper function for mergeSort, which merges two sections
   * of the array together in their proper order.
   */
  var merge = function (left, right) {
    var result = [],
        lLen = left.length,
        rLen = right.length,
        l = 0,
        r = 0;
    while (l < lLen && r < rLen) {
      if (left[l].x < right[r].x) {
        result.push(left[l++]);
      } else if ((left[l].x == right[r].x) && (left[l].y < right[r].y)) {
        result.push(left[l++]);
      } else {
        result.push(right[r++]);
      }
    }
    return result.concat(left.slice(l)).concat(right.slice(r));
  }

  /**
   * Returns a function to compute the determinant with these two given
   * points and one extra point as an input to the returned function.
   * I did it like this because it would be more efficient to compute
   * everything I could from the inital two points, since this function
   * will be used for every other point in worst case.
   */
  var determinantPartial = function (q1, q2) {
    var part1 = q1.x * q2.y - q2.x * q1.y,
        part2 = q1.y - q2.y,
        part3 = q2.x - q1.x;
    return function (x, y) {
      return part1 + x * part2 + y * part3;
    };
  };

  /**
   * Using the determinant of the two extreme points and a third from the
   * set, S, we partition the set into two groups, left & right.
   * If the sign of the determinant is positive, we push it into the left set,
   * if the sign of the determinant is negative, we push it into the right set,
   * else it is 0, which means it is on the line, and we know for sure it is
   * inside the two extreme points by their definition of being an extreme
   * point, so we ignore it because it cannot be considered for being in the
   * Convex Hull.
   */
  var partitionLeftRight = function (S, q1, q2) {
    var left = [];
    var right = [];
    var detFunction = determinantPartial(q1, q2);
    for (var i = 0; i < S.length; i++) {
      var determinant = detFunction(S[i].x, S[i].y);
      if (determinant > 0) {
        // determinant is positive, push to left set
        left.push(S[i]);
      } else if (determinant < 0) {
        // determinant is negative, push to right set
        right.push(S[i]);
      } // else determinant == 0, and we don't consider this point anymore
    }
    return {'left': left, 'right': right};
  }

  /**
   * Sets everything up to begin the quickhull algorithm to solve for the
   * Convex Hull of the loaded points.
   *
   * First sorts all of the points (as required by this algorithm), and then
   * removes any duplicate points that shouldn't be there.
   * The leftmost and rightmost points are the first and last point in the
   * sorted list respectively. We then partition the remaining points into
   * the left and right of the line between these two extreme points.
   * We then send them off to the quickhull algorithm to recursively solve
   * for the upper and lower hull.
   */
  var startQuickhull = function () {
    // start calculation of runtime
    var runtime = 0 - (new Date().getTime());

    // sort points O(N log(N))
    var points = mergeSort(convexHullCtrl.pointsArray);

    // remove duplicates O(N)
    for (var i = 0; i < points.length - 1; i++) {
      if ((points[i].x == points[i+1].x) && (points[i].y == points[i+1].y)) {
        points.splice(i, 1);
        i -= 1; // in case there are more than one duplicate
      }
    }

    // two outer-most points
    var q1 = points[0];
    var q2 = points[points.length-1];

    // Separate into two sets, left and right O(N)
    var partitioned = partitionLeftRight(points, q1, q2);

    // start quickhull algorithm on them 
    quickhull(partitioned.left, q1, q2);  // upper hull
    quickhull(partitioned.right, q2, q1); // lower hull

    // end calculation of runtime
    runtime += new Date().getTime();
    console.log("Runtime of Quickhull:", runtime, "ms");
    convexHullCtrl.runtime = runtime;

    drawPoints();
    drawLines();
  };

  /**
   * Implements the quickhull algorithm for solving for the Convex Hull
   * of a given set and the two outermost points, q1 & q2.
   * Finds the furthest point away from the line made by q1 & q2 by the
   * determinant of q1, q2, and q3. We then recursively repeat this step
   * with the two sets partitioned outside of the triangle q1, q2, and q3.
   */
  var quickhull = function (S, q1, q2) {
    // Add to convexConnections if S is empty
    if (S.length == 0) {
      convexHullCtrl.convexConnections.push([q1, q2]);
      convexHullCtrl.points[q1.index].extremePoint = true;
      convexHullCtrl.points[q2.index].extremePoint = true;
      return;
    }

    // find furthest point, q3 is q1 only as a placeholder O(N)
    var q3 = q1;
    q3.determinant = 0;
    var detFunction = determinantPartial(q1, q2);
    for (var i = 0; i < S.length; i++) {
      var determinant = detFunction(S[i].x, S[i].y);
      if (determinant > q3.determinant) {
        q3 = S[i];
        q3.determinant = determinant;
      }
    }

    // find section left of line (q1, q3) and left of (q3, q2) O(N)
    var S1 = partitionLeftRight(S, q1, q3);
    var S2 = partitionLeftRight(S1.right, q3, q2);

    // continue algorithm for these new sections outside of triangle
    quickhull(S1.left, q1, q3);
    quickhull(S2.left, q3, q2);
  }

  /**
   * Implements the brute force algorithm for solving for the Convex Hull
   * of the loaded points. First sorts the points (unnecessary for this
   * algorithm) to then easily remove repeated points that shouldn't be there.
   * Then by using the standard form of a line for two points, we consider
   * wether is should be a connection for the Convex Hull by checking that
   * every other point in the set is on the same side of the line.
   * If points A, B, and C are on the same line, only points A & C can form
   * a connection on the Convex Hull.
   *
   * Runtime: O(N^3)
   */
  var startConvexhull = function () {
    // start calculation of runtime
    var runtime = 0 - (new Date().getTime());

    // sort points (unecessary for this algorithm, but makes removing duplicates easier)
    var points = mergeSort(convexHullCtrl.pointsArray);

    // remove duplicates
    for (var i = 0; i < points.length - 1; i++) {
      if ((points[i].x == points[i+1].x) && (points[i].y == points[i+1].y)) {
        points.splice(i, 1);
        i -= 1; // in case thereare more than one duplicate
      }
    }

    for (var i = 0; i < points.length - 1; i++) {
      for (var j = i + 1; j < points.length; j++) {
        // two points being considered as a connection on the Convex Hull
        var point1 = points[i];
        var point2 = points[j];

        // ax + by = c
        var a = point2.y - point1.y;
        var b = point1.x - point2.x;
        var c = (point1.x * point2.y) - (point1.y * point2.x);

        var isGreater = null; // check for all points on same side of line
        for (var k = 0; k < points.length; k++) {
          if ((k == i) || (k == j)) {
            // point at index k is either point1 or point2, ignore this case and continue
            continue;
          }
          
          // ax + by
          var comparison = (a * points[k].x) + (b * points[k].y);

          if (comparison == c) {
            // they are on the same line
            if ((points[k].x > Math.max(point1.x, point2.x)) || (points[k].x < Math.min(point1.x, point2.x))) {
              // this point is outside the x range of point1 and point2, cannot be a connection in the Convex Hull
              isGreater = 'fail';
              break;
            } else {
              // this point is inside the x range of point1 and point2, this is okay, continue
              continue;
            }
          } else if (isGreater == null) {
            // if we have not yet set which side the initial point is on
            isGreater = comparison > c;
          } else if ((comparison > c) != isGreater) {
            // this point is not on the same side of the line as all previous points, cannot be a connection in the Convex Hull
            isGreater = 'fail';
            break;
          } // else we try next point
        }
        if ((isGreater != 'fail') && (isGreater != null)) {
          // All points in the set are on the same side of the line that makes up the connection of point1 and point2.
          // This is a connection on the Convex Hull, so make them extreme points and record this connection.

          convexHullCtrl.convexConnections.push([point1, point2]);
          convexHullCtrl.points[point1.index].extremePoint = true;
          convexHullCtrl.points[point2.index].extremePoint = true;
        }
      }
    }
    runtime += new Date().getTime(); // calculate the final runtime of algorithm
    console.log("Runtime of Convex Hull:", runtime, "ms");
    convexHullCtrl.runtime = runtime;

    drawPoints(); // update graphics for new extreme points
    drawLines();  // draw lines for all connections in the Convex Hull
  };

  /**
   * Any time the user changes the size for either the extreme or non-extreme
   * points or the line thickness, this will detect the change and update
   * the graphics by redrawing them.
   */
  $scope.$watch(
    function () {
      // check for new values
      return [
        convexHullCtrl.extremePointSize,
        convexHullCtrl.nonExtremePointSize,
        convexHullCtrl.lineThickness
      ]; 
    },
    function () {
      // update graphics based on new values
      drawPoints();
      drawLines();
    },
    true
  );

});