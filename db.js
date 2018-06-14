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
		today=today();
		var db=this;
		console.log('init: check if the db is updated for '+ today);

		client.get('timestamp', function(error, result) {
			if (error) throw error;
			
			if(result != null){
				console.log('Last Timestamp: ', result);
				if(result==today){
					console.log('Timestamp is latest.');
				}
				else{
					console.log('Updating Rates: ' + today);
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
				var list=['forex'];
				for (var key in rates.rates){
					list.push(rates.rates[key]);
					list.push(key);
				}
				
				client.zadd(list, function (err, response) {
					if (err) throw err;
    				console.log('Redis List Result: '+ response);
				});
				
				client.set('timestamp', today , function (err, response) {
					if (err) throw err;
					console.log('Redis Timestamp Result: '+ response);
					console.log('Database Refreshed!')
				});
			})
			.catch((err) =>{
				console.log(err)
			});
	}

	getRate(currency,cb){
		console.log('Get specific rate');
		var resp=client.zscore('forex', currency.toUpperCase(), function (err, response) {
			if (err) throw err;
			response=(Math.round(response * 100) / 100)+'';
			console.log(response);
			cb(response);
		});

	}

	getRates(){
		console.log('Get all rates');
	}

}

db = new Database();
module.exports = db;