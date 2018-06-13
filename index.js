var express = require('express');

var app = express();
var routes = require('./routes.js')

app.use('/', routes)
app.use(express.static('public'));

const PORT = process.env.PORT || 4000;

app.listen(PORT);