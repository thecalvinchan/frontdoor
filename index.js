var express = require('express');
var graph = require('fbgraph');

var app = express();
var conf = {
    scope: 'email, user_photos, user_events, friends_photos, create_event',
    redirect_uri: 'http://localhost:1337/login'
};

app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(app.router);
    app.use(express.session({secret:'secret here'}));
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
}).get('/login', function(req, res){
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
        res.redirect('/events?access_token='+fbres.access_token);
    });
}).get('/events', function(req, res) {
    res.sendfile('events.html');
}).listen(1337);
console.log('Listening on port 1337');
