var express = require('express');
var router = express.Router();
var db = require('./db.js')

var redis = require('redis')
// var client = redis.createClient();
var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

client.on('connect', function() {
    console.log('Connected to Redis Database');
});



router.get('/', function(req, res){
	res.send("Hello world!");
});

router.get('/convert/:from/:to/:units', function (req, res) {
	db.convert(req.params.from, req.params.to, req.params.units);
	res.send("Convert request for "+req.params.units + "<br>from: " + req.params.from + "<br> to: " + req.params.to );
});

router.get('/rate/:currency', function (req, res) {
	// var rate=db.getRate(req.params.currency);
	// res.send(rate);

	console.log('Get specific rate');
	var resp=client.zscore('forex', req.params.currency, function (err, response) {
		if (err) throw err;
		res.send(response);
	});

});

router.get('/rates', function (req, res) {
	db.getRates();
	
	res.send("Rates");
});

router.get('/update', function (req, res) {
	console.log("Updaing Rates");
	db.updateRates();
	res.send("Rates");
});

router.get('*', function(req, res){
	res.send('Sorry, this is an invalid URL.');
});

module.exports = router;