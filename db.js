var rp = require('request-promise')
var redis = require('redis')

// var client = redis.createClient();
var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});

client.on('connect', function() {
    console.log('Connected to Redis Database');
});


function today() {

	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;

	var yyyy = today.getFullYear();
	if(dd<10){
	    dd='0'+dd;
	} 
	if(mm<10){
	    mm='0'+mm;
	} 
	var today = dd+'/'+mm+'/'+yyyy;
	return today;
}

class Database{

	constructor(){
		this.today=today();
		this.check()
	}

	check(){
		var db=this;
		console.log('init: check if the db is updated for '+ this.today);

		client.get('timestamp', function(error, result) {
			if (error) throw error;
			
			if(result != null){
				console.log('Last Timestamp: ', result);
				if(result==this.today){
					console.log('Timestamp is latest.');
				}
				else{
					console.log('Updating Rates: ' + db.today);
					db.updateRates();
				}
			}
			else{
				console.log('Setting Up Database');
				db.updateRates();
			}
		});
	}

	updateRates(){
		var rates;
		const options = {
			method: 'GET',
			uri: 'https://openexchangerates.org/api/latest.json',
			qs: {
				app_id: 'dfd0870499744281809def37cd81e0ec',
				}
			}

		rp(options)
			.then((data) =>{
				rates=JSON.parse(data);
				console.log('Openforex Timestamp:' + rates.timestamp);
				var list=['rates'];
				for (var key in rates.rates){
					list.push(rates.rates[key]);
					list.push(key);
				}
				
				client.zadd(list, function (err, response) {
					if (err) throw err;
    				console.log('Redis rates Result: '+ response);
				});
				
				client.set('timestamp', this.today , function (err, response) {
					if (err) throw err;
					console.log('Redis Timestamp Result: '+ response);
					console.log('Database Refreshed!')
				});
			})
			.catch((err) =>{
				console.log(err)
			});

		const options1 = {
			method: 'GET',
			uri: 'https://openexchangerates.org/api/currencies.json',
			qs: {
				app_id: 'dfd0870499744281809def37cd81e0ec',
				}
			}

		rp(options1)
			.then((data) =>{
				var currencies=JSON.parse(data);
				var list=['currencies'];
				
				for (var key in currencies){
					list.push(key);
					list.push(currencies[key]);
				}
				
				client.hset(list, function (err, response) {
					if (err) throw err;
    				console.log('Redis currencies Result: '+ response);
					console.log('Currencies Refreshed!')
				});
			})
			.catch((err) =>{
				console.log(err)
			});
		


	}

	getRate(currency,cb){
		this.check();
		console.log('Get specific rate in USD.');
		var resp=client.zscore('rates', currency.toUpperCase(), function (err, response) {
			if (err) throw err;
			response=(Math.round(response * 100) / 100)+'';
			console.log(response);
			cb(response);
		});

	}

	getAllRates(cb){
		console.log('Get all rates in USD.');
		var args=['rates', 0, -1, 'WITHSCORES']
		var resp=client.zrange(args, function (err, response) {
			if (err) throw err;
			
			var obj = new Object();
			for(var key=0; key<response.length ; key++){
				if(key % 2 == 0) {
					obj[response[key]]=response[key+1];
				}
			}
			cb(obj);
			
		});
	
	}

	getCurrencies(cb){
		console.log('Get Symbols for all currencies.');
		var resp=client.hgetall('currencies', function (err, response) {
			if (err) throw err;
			// console.log(response);
			cb(response);
		});

	}

}

db = new Database();
module.exports = db;