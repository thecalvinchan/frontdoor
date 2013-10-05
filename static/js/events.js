var dates = {
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
};

angular.module('EventsModule', [], function($provide) {
    $provide.factory('events', ['$http', function(http) {
        var events = [];
        getEvents(http,events);
        return events;
    }]);
});

function eventCtrl(scope,notifyService) {
    $scope.events = notifyService();
}

eventCtrl.$inject = ['$scope','events'];

function getEvents(http,container) {
    http.get({method: 'GET', url: 'graph.facebook.com/me/?fields=id,events.fields(name,owner,cover,id,start_time)'}).success(parseEvents(container)).error(console.log(err));
}
    
function parseEvents(container) {
    return function(data, status, headers, config) {
        var events = data.events.data;
        for (i in events) {
            if (events[i].owner.id == data.id) {
                var start_time = new Date(events[i].start_time);
                $container.push({
                    month: dates.months[start_time.getMonth()],
                    date: start_time.getDate(),
                    title: events[i].name,
                    day: dates.days[start_time.getDay()]
                });
            }
        }
    }
}
