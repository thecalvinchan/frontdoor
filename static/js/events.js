var dates = {
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
};

angular.module('EventsModule', [], function($provide) {
    $provide.factory('events', ['$http', function(http) {
        var events = {events:[]};
        getEvents(http,events);
        return events;
    }]);
});

function eventCtrl(scope,events) {
    scope.events = events;
}

eventCtrl.$inject = ['$scope','events'];

function getEvents(http,container) {
        http({method: 'GET', url: '/api/events'}).success(parseEvents(container)).error(function(err) {console.log(err)});
}
    
function parseEvents(container) {
    return function(data, status, headers, config) {
        container.events = data.events;
    }
}
