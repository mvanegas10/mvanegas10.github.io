(function() {
	'use strict';

	angular
	.module( 'app', [ 
		'ngMaterial',
		]);


	angular
	.module( 'app' )
	.controller('MainController', MainController );

	MainController.$inject = [ '$scope', '$mdToast' ];

	function MainController($scope, $mdToast) {
		var tabs = [
		{ title: 'Zero', content: 'Woah...that is a really long title!' },
		{ title: 'One', content: "Tabs will become paginated if there isn't enough room for them."},
		{ title: 'Two', content: "You can swipe left and right on a mobile device to change tabs."},
		{ title: 'Three', content: "You can bind the selected tab via the selected attribute on the md-tabs element."},
		{ title: 'Four', content: "If you set the selected tab binding to -1, it will leave no tab selected."},
		],
		selected = null,
		previous = null;
		$scope.tabs = tabs;
		$scope.selectedIndex = 0;
		$scope.$watch('selectedIndex', function(current, old){
			previous = selected;
			selected = tabs[current];
			if ( old + 1 && (old != current)) console.log('Goodbye ' + previous.title + '!');
			if ( current + 1 )                console.log('Hello ' + selected.title + '!');
		});
	}

})();
