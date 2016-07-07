'use strict';

// Declare app level module which depends on views, and components
angular.module('app', [
  'app.convexHull',
  'ngRoute'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when("/convexHull", {
			templateUrl: 'views/convexHull.html',
			controller: 'convexHullCtrl'}).
		otherwise({redirectTo: '/convexHull'});
}]);
