var express = require('express');
var graph = require('fbgraph');

var app = express();
var conf = {
    client_id: '1396222487276613',
    client_secret: '5fe1a8204d64461118258eb715c86759',
    scope: 'email, user_photos, user_events, friends_photos, create_event',
    redirect_uri: 'http://localhost:1337/login'
};

var dates = {
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
};

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({secret:'VmBO4r35NLkY8G9'}));
    app.use(app.router);
    app.use(express.static('static'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/',function(req, res){
    res.sendfile('index.html');
});
app.get('/login', function(req, res){
    if (!req.query.code) {
        var authUrl = graph.getOauthUrl({
            'client_id': conf.client_id,
            'redirect_uri': conf.redirect_uri,
            'scope': conf.scope
        });

        if (!req.query.error) {
            res.redirect(authUrl);
        } else {
            res.send('access denied');
        }
        return;
    }

    graph.authorize({
        'client_id': conf.client_id,
        'redirect_uri': conf.redirect_uri,
        'client_secret': conf.client_secret,
        'code': req.query.code
    }, function(err, fbres) {
        console.log(fbres);
        req.session.access_token = fbres.access_token;
        graph.setAccessToken();
        res.redirect('/events');
    });
});
app.get('/events', function(req, res) {
    if (req.session.access_token) {
        res.sendfile('events.html');
    } else {
        res.redirect('/login');
    }
});

//RESTFUL API
app.get('/api/events', getEvents);

//API Functions
function getEvents(req, res) {
    if (!req.session.access_token) {
        console.log("No Access Token");
        res.send();
        return;
    }
    graph.get('me?fields=id,events.fields(name,owner,cover,id,start_time)&access_token='+req.session.access_token,function(err, fbres) {
        var container = {events:[]}; 
        var events = fbres.events.data;
        console.log(fbres.events.data);
        for (i in events) {
            if (events[i].owner.id == fbres.id) {
                var start_time = new Date(events[i].start_time);
                container.events.push({
                    month: dates.months[start_time.getMonth()],
                    date: start_time.getDate(),
                    title: events[i].name,
                    day: dates.days[start_time.getDay()]
                });
            }
        }
        res.send(JSON.stringify(container));
    });
}

app.listen(1337);
console.log('Listening on port 1337');
