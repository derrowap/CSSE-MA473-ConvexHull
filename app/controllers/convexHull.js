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

  /*
  With a given fileName, it will open the corresponding text file and return
  a js promise which can be used to get the text file data.
  */
  var openFile = function (fileName) {
    return $http.get('files/' + fileName + '.txt').then(function (data) {
      convexHullCtrl.error = null;
      return(data.data);
    }, function (error) {
      console.log("ERROR:", error);
      convexHullCtrl.error = error;
      return("")
    });
  }

  /*
  Opens the current indicated file from the textbox, and formats all the points
  into a js object. After all of the points are formatted, it begins to execute
  the proper algorithm to solve the Convex Hull problem.
  */
  this.startAlgorithm = function (isQuickhull) {
    var promise = openFile($scope.data.fileName);
    promise.then(function (data) {
      var numbers = data.match(/[0-9]{3,4}|[0-9]{1,2}/g);
      var output = {};
      var max_x = 0;
      var max_y = 0;
      for (var i = 0; i < numbers.length; i += 2) {
        output[i/2] = {
          'x': parseInt(numbers[i]),
          'y': parseInt(numbers[i+1]),
          'isConvex': false
        };
        max_x = Math.max(max_x, parseInt(numbers[i]));
        max_y = Math.max(max_y, parseInt(numbers[i+1]));
      }
      console.log("max x:", max_x, "max y:", max_y);
      convexHullCtrl.points = output;
      isQuickhull ? startQuickhull() : startConvexhull();
    });
  }

  /* 
  Expects the points are loaded inside convexHullCtrl.points, and draws them
  all on the canvas as red points. It will draw them with the current value for
  convexHullCtrl.pointSize, which can be changed by the user. To clear
  any previous drawings, it first draws a cyan colored background.
  */
  var drawPoints = function() {
    // clear current screen
    ctx.fillStyle = "cyan";
    ctx.fillRect(0,0,WIDTH, HEIGHT);

    // draw points
    ctx.fillStyle = "red";
    var size = Object.keys(convexHullCtrl.points).length;
    for (var i = 0; i < size; i++) {
      ctx.fillRect(convexHullCtrl.points[i].x, convexHullCtrl.points[i].y, convexHullCtrl.pointSize, convexHullCtrl.pointSize);
    }
  }

  /*
  TODO
  */
  var startQuickhull = function() {
    console.log("Quickhull:", convexHullCtrl.points);
    drawPoints();
  }

  /*
  TODO
  */
  var startConvexhull = function() {
    console.log("Convexhull:", convexHullCtrl.points);
    drawPoints();
  }

  /*
  TODO
  */
  $scope.$watch(function () { return convexHullCtrl.pointSize; },
    function () {
      // this function is executed every time the value of convexHullCtrl.pointSize changes value
      // that is, every time a user changes the range value for the size, it will redraw the points at that size
      drawPoints();
    });
});