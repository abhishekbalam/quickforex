var express = require('express');

var app = express();
var routes = require('./routes.js')

app.use('/', routes)
app.use(express.static('public'));


app.listen(4000);