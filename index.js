var express = require('express');
var graph = require('fbgraph');
var http = require('http');
var querystring = require('querystring');

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
app.post('/api/schedule', scheduleEvent);

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
        for (var i in events) {
            if (events[i].owner.id == fbres.id) {
                var start_time = new Date(events[i].start_time);
                container.events.push({
                    id: events[i].id,
                    month: dates.months[start_time.getMonth()],
                    date: start_time.getDate(),
                    title: events[i].name,
                    day: dates.days[start_time.getDay()],
                    scheduled: false
                });
            }
        }
        res.send(JSON.stringify(container));
    });
}

function scheduleEvent(req, res) {
    var event_id = req.body.event_id;
    console.log(event_id);
    graph.get(event_id+'?fields=attending&access_token='+req.session.access_token, function(err, fbres) {
        var attendees = fbres.attending.data;
        console.log(attendees);
        var data = {};
        var processed = 0;
        for (var x in attendees) {
            data[attendees[x].id] = {
                id: attendees[x].id,
                name: attendees[x].name
            }
            retrieveUserPictures(data[attendees[x].id], req, function(pictures) {
                console.log(data);
                processed++;
                if (processed == attendees.length) {
                    //console.log(processed);
                    var query = JSON.stringify(data);
                    var headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': query.length
                    };
                    var options = {
                        host: '54.200.89.7',
                        port: 80,
                        path: '/',
                        method: 'POST',
                        headers: headers
                    };
                    var req = http.request(options, function(res) {
                        res.setEncoding('utf-8');   
                        var responseString = '';
                        res.on('data', function(data) {
                            responseString += data;
                        });
                        res.on('end',function() {
                            console.log(responseString);
                        });
                    });
                    req.on('error', function(err) {
                        console.log(err);
                    });
                    req.write(query);
                    req.end();
                }
            });
        }
    });
}

//API Helper Functions

function retrieveUserPictures(user,req,callback) {
    var user_id = user.id;
    user.pictures = [];
    graph.get(user_id+'?fields=albums.fields(name)&access_token='+req.session.access_token, function(err, fbres) {
        for (var x in fbres.albums.data) {
            if (fbres.albums.data[x].name == "Profile Pictures") {
                var album_id = fbres.albums.data[x].id;
                graph.get(album_id+'?fields=photos.fields(picture,source)&access_token='+req.session.access_token, function(err2, fbres2) {
                    for (var y in fbres2.photos.data) {
                        user.pictures.push(fbres2.photos.data[y].picture);
                    }
                    callback();
                });   
                break;
            }
        }
    });
}


app.listen(1337);
console.log('Listening on port 1337');
