var express = require('express');
var router = express.Router();
var db = require('./db.js')

var redis = require('redis')
// var client = redis.createClient();
var cleint = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

client.on('connect', function() {
    console.log('Connected to Redis Database');
});

router.get('/', function(req, res){
	res.send("Welcome to Quickforex API !");
});

router.get('/convert/:from/:to/:units', function (req, res) {
	
	var to=req.params.to.toUpperCase();
	var from=req.params.from.toUpperCase();
	var units=req.params.units;
	
	console.log('To convert '+ req.params.units +'\nfrom:' + req.params.from + '\nto:' + req.params.to);
	
	var resp=client.zscore('forex', from, function (err, response) {
		if (err) throw err;
		var fromRate=(Math.round(response * 100) / 100);
		console.log(fromRate);
		
		var resp=client.zscore('forex', to, function (err, response) {
			if (err) throw err;
			var toRate=(Math.round(response * 100) / 100);
			console.log(toRate);
		
			var result=((toRate/fromRate)*units)
			result=(Math.round(result * 100) / 100);
			
			res.send(result+' '+to)
		});
	});
});

router.get('/rate/:currency', function (req, res) {
	var currencies=db.getRate(req.params.currency,res.send.bind(res));
});

router.get('/rates', function (req, res) {
	var rates=db.getAllRates(res.send.bind(res));
});

router.get('/update', function (req, res) {
	console.log("Updaing Rates");
	db.updateRates();
	res.send("DB Updated!");
});

router.get('/currencies', function (req, res) {
	console.log("Getting Currencies");
	var rate=db.getCurrencies(res.send.bind(res));
});

router.get('*', function(req, res){
	res.send('Sorry, this is an invalid URL.');
});

module.exports = router;