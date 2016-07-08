'use strict';

angular.module('app.convexHull', []).
controller('convexHullCtrl', function($scope, $http) {
  var canvas = document.getElementById("myCanvas");
  var ctx = canvas.getContext("2d");
  var HEIGHT = 1024;
  var WIDTH = 1280;
  this.pointSize = 3; // default value of the size of points drawn on canvas

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
      return "";
    });
  };

  /**
   * Opens the current indicated file from the textbox, and formats all the points
   * into a js object. After all of the points are formatted, it begins to execute
   * the proper algorithm to solve the Convex Hull problem.
   */
  this.startAlgorithm = function (isQuickhull) {
    var promise = openFile($scope.data.fileName);
    promise.then(function (data) {
      var numbers = data.match(/[0-9]{3,4}|[0-9]{1,2}/g);
      var output = {};
      // var max_x = 0;
      // var max_y = 0;
      for (var i = 0; i < numbers.length; i += 2) {
        output[i/2] = {
          'x': parseInt(numbers[i]),
          'y': parseInt(numbers[i+1]),
          'extremePoint': false
        };
        // max_x = Math.max(max_x, parseInt(numbers[i]));
        // max_y = Math.max(max_y, parseInt(numbers[i+1]));
      }
      // console.log("max x:", max_x, "max y:", max_y);
      convexHullCtrl.points = output;
      isQuickhull ? startQuickhull() : startConvexhull();
    });
  };

  /**
   * Expects the points are loaded inside convexHullCtrl.points, and draws them
   * all on the canvas as red points. It will draw them with the current value for
   * convexHullCtrl.pointSize, which can be changed by the user. To clear
   * any previous drawings, it first draws a cyan colored background.
   */
  var drawPoints = function () {
    // clear current screen
    ctx.fillStyle = "cyan";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw points
    var size = Object.keys(convexHullCtrl.points).length;
    for (var i = 0; i < size; i++) {
      ctx.fillStyle = convexHullCtrl.points[i].extremePoint ? "red" : "black";
      ctx.fillRect(convexHullCtrl.points[i].x, convexHullCtrl.points[i].y, convexHullCtrl.pointSize, convexHullCtrl.pointSize);
    }
  };

  var drawLines = function () {
    var size = convexHullCtrl.convexConnections.length;
    for (var i = 0; i < size; i++) {
      // console.log("connection:", convexHullCtrl.convexConnections[i]);
      ctx.beginPath();
      ctx.moveTo(convexHullCtrl.points[convexHullCtrl.convexConnections[i][0]].x, convexHullCtrl.points[convexHullCtrl.convexConnections[i][0]].y);
      ctx.lineTo(convexHullCtrl.points[convexHullCtrl.convexConnections[i][1]].x, convexHullCtrl.points[convexHullCtrl.convexConnections[i][1]].y);
      ctx.stroke();
    }
  };

  /**
   * TODO
   */
  var startQuickhull = function () {
    console.log("Quickhull:", convexHullCtrl.points);
    drawPoints();
  };

  /**
   * TODO
   */
  var startConvexhull = function () {
    drawPoints();
    convexHullCtrl.convexConnections = [];
    var size = Object.keys(convexHullCtrl.points).length;

    var runtime = new Date().getTime(); // start calculation of runtime
    for (var i = 0; i < size - 1; i++) {
      for (var j = i + 1; j < size; j++) {
        var point1 = convexHullCtrl.points[i];
        var point2 = convexHullCtrl.points[j];
        if ((point1.x == point2.x) && (point1.y == point2.y)) {
          // point1 and point2 are at the same spot, ignore this case and continue

          //console.log("repeated point:", point1, point2, i, j);
          continue;
        }
        
        // ax + by = c
        var a = point2.y - point1.y;
        var b = point1.x - point2.x;
        var c = (point1.x * point2.y) - (point1.y * point2.x);

        var isGreater = null; // check for all points on same side of line
        for (var k = 0; k < size; k++) {
          if ((k == i) || (k == j)) {
            // point at index k is either point1 or point2, ignore this case and continue
            continue;
          }
          
          // ax + by
          var comparison = (a * convexHullCtrl.points[k].x) + (b * convexHullCtrl.points[k].y);

          if (comparison == c) {
            // they are on the same line
            if ((convexHullCtrl.points[k].x < Math.max(point1.x, point2.x)) && (convexHullCtrl.points[k].x > Math.min(point1.x, point2.x))) {
              // this point is inside the x range of point1 and point2, cannot be a connection in the Convex Hull
              isGreater = 'fail';
              break;
            } else {
              // this point is outside the x range of point1 and point2, this is okay, continue
              continue;
            }
          } else if (isGreater == null) {
            // if we have not yet set which side the initial point is on
            isGreater = comparison > c;
          } else if ((comparison > c) != isGreater) {
            // this point is not on the same side of the line as all previous points, cannot be a connection in the Convex Hull

            // console.log("failed:", comparison, isGreater);
            // if ((i == 86) && (j == 140)) {
            //   console.log("SPECIAL CASE1:", point1, point2, convexHullCtrl.points[k], comparison, isGreater, k);
            // }
            // if ((i == 86) && (j == 115)) {
            //   console.log("SPECIAL CASE2:", point1, point2, convexHullCtrl.points[k], comparison, isGreater, k);
            // }
            isGreater = 'fail';
            break;
          } // else we try next point
        }
        if ((isGreater != 'fail') && (isGreater != null)) {
          // All points in the set are on the same side of the line that makes up the connection of point1 and point2.
          // This is a connection on the Convex Hull, so make them extreme points and record this connection.

          // console.log("push connection:", point1, point2, i, j);
          convexHullCtrl.convexConnections.push([i, j]);
          convexHullCtrl.points[i].extremePoint = true;
          convexHullCtrl.points[j].extremePoint = true;
        }
      }
    }
    runtime = (new Date().getTime()) - runtime; // calculate the final runtime of algorithm
    console.log("Runtime:", runtime, "ms");

    drawPoints(); // update graphics for new extreme points
    drawLines();  // draw lines for all connections in the Convex Hull
  };

  /**
   * TODO
   */
  $scope.$watch(function () { return convexHullCtrl.pointSize; },
    function () {
      // this function is executed every time the value of convexHullCtrl.pointSize changes value
      // that is, every time a user changes the range value for the size, it will redraw the points at that size
      drawPoints();
      drawLines();
    });
});