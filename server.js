// server.js
// call the packages we need
var express    = require('express');        
var app        = express();                 
var bodyParser = require('body-parser');
var crypto = require('crypto');
var r = require('./jsrsasign.js');
var fs = require('fs');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = process.env.PORT || 8080;        // set our port
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'welcome to the api!' });   
});



// on routes that end in /mvcr

router.route('/jwk')
.get(function(req, res) {
	res.json(app.pubKey);
});

router.route('/mvcr')
.post(function(req, res) {

	// Header
	var oHeader = {alg: 'RS256', typ: 'JWT'};
	var sHeader = JSON.stringify(oHeader);
	// Payload
	var oPayload = req.body; //what was posted
	var rPayload = {}; //what we will return

	var token = crypto.randomBytes(64).toString('hex');
	oPayload['jti'] = token;

	var iat = Math.floor(Date.now()/1000);
	oPayload['iat'] = iat;

	var iss = "http://api.consentreceipt.org";
	oPayload['iss'] = iss;
	
	//data validation
	function checkstring(param, localvar, friendly){
		if (!param) {
			res.status(400);
			res.send('Error: ' + friendly + ' is a required field');
		}
		if (typeof param == "string") {
			var localvar = param;
		}else{
			res.status(400);
			res.send('Error: ' + friendly + ' field must be a string');
		}
	}

	function checkstringnotreq(param, localvar, friendly){
		if (param) {
			if (typeof param == "string") {
				var localvar = param;
			}else{
				res.status(400);
				res.send('Error: ' + friendly + ' field must be a string');
			}
		}
	}


	function checkarray(param, localvar, friendly){
		if (!param) {
			res.status(400);
			res.send('Error: ' + friendly + ' is a required field');
		}
		if (param  instanceof Array) {
			var localvar = param;
		}else{
			res.status(400);
			res.send('Error: ' + friendly + ' field must be an array');
		}
	}

	function checkobject(param, localvar, friendly){
		if (!param) {
			res.status(400);
			res.send('Error: ' + friendly + ' is a required field');
		}
		if (typeof param == "object") {
			var localvar = param;
		}else{
			res.status(400);
			res.send('Error: ' + friendly + ' field must be an object');
		}
	}

	var jurisdiction,
	sub,
	svc,
	notice,
	policy_uri,
	data_controller,
	consent_payload,
	purpose,
	pii_collected,
	sensitive,
	sharing,
	context,
	aud,
	scopes;

	checkstring(oPayload.jurisdiction, jurisdiction, 'jurisdiction');
	checkstring(oPayload.sub, sub, 'sub');
	checkarray(oPayload.svc, svc, 'svc');
	checkstring(oPayload.notice, notice, 'notice');
	checkstring(oPayload.policy_uri, policy_uri, 'policy_uri');
	checkobject(oPayload.data_controller, data_controller, 'data_controller');	
	checkobject(oPayload.consent_payload, consent_payload, 'consent_payload');
	checkarray(oPayload.purpose, purpose, 'purpose');
	checkobject(oPayload.pii_collected, pii_collected, 'pii_collected');
	checkarray(oPayload.sensitive, sensitive, 'sensitive');
	checkarray(oPayload.sharing, sharing, 'sharing');
	checkarray(oPayload.context, context, 'context');
	checkstringnotreq(oPayload.aud, aud, 'aud');
	checkstringnotreq(oPayload.scopes, scopes, 'scopes');


	rPayload.jurisdiction = oPayload.jurisdiction;
	rPayload.sub = oPayload.sub;
	rPayload.svc = oPayload.svc;
	rPayload.notice = oPayload.notice;
	rPayload.policy_uri = oPayload.policy_uri
	rPayload.data_controller = oPayload.data_controller
	rPayload.consent_payload = oPayload.consent_payload
	rPayload.purpose = oPayload.purpose
	rPayload.pii_collected = oPayload.pii_collected
	rPayload.sensitive = oPayload.sensitive
	rPayload.sharing = oPayload.sharing
	rPayload.context = oPayload.context;
	rPayload.aud = oPayload.aud;
	rPayload.scopes = oPayload.scopes;
	rPayload.jti = oPayload.jti;
	rPayload.iat = oPayload.iat;
	rPayload.iss = oPayload.iss;

	
	var sPayload = JSON.stringify(rPayload);
	//read key
	console.log(rPayload);

	//sign jwt
	var sJWT = KJUR.jws.JWS.sign("RS256", sHeader, sPayload, app.okey);
	
	
	// Return JWT
	res.set('Content-Type', 'application/jwt');
	res.send(sJWT);
});

// register routes
app.use('/api', router);

fs.readFile('key.jwk', 'utf8', function (err, data) {
	if (err) throw err;

	var key = JSON.parse(data);
	app.okey = r.KEYUTIL.getKey(key);
	
	// create the public key
	delete key['d'];
	app.pubKey = {'keys': [key]};

	// start server
	app.listen(port);
	console.log('Magic happens on port ' + port);

});


