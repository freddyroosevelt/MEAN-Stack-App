var User = require('../models/user');
var Post = require('../models/post');
var config = require('../../config');
var secretKey = config.secretKey;
var jsonwebtoken = require('jsonwebtoken');


//Web Token func
function createToken(user) {

	var token = jsonwebtoken.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expirtesInMinute: 1440
	});

	return token;
}

// API
module.exports = function(app, express, io) {
	var api = express.Router();
	api.get('/all_stories', function(req, res) {
		Story.find({}, function(err, stories) {
			if(err){
				res.send(err);
				return;
			}
			res.json(stories);
		});
	});
	api.post('/signup', function(req, res) {
		var user = new User({
			name: req.body.name,
			username: req.body.username,
			password: req.body.password
		});

		var token = createToken(user);

		// Save to the database
		user.save(function(err) {
			if (err) {
				res.send(err);
				return;
			}

			res.json({
				success: true,
				message: 'User has been created!',
				token: token
			});
		});
	});


	// Check if user exist or not
	api.get('/users', function(req, res) {
		User.find({}, function(err, users) {
			if (err) {
				res.send(err);
				return;
			}

			// if no error
			res.json(users);
		});
	});


	// Token - Login API
	api.post('/login', function(req, res) {

		User.findOne({
			username: req.body.username
		}).select('name username password').exec(function(err, user) {

			if (err) throw err;

			if (!user) {
				res.send({ message: "User doesnt exist"});
			}else if(user) {

				var validPassword = user.comparePassword(req.body.password);

				if(!validPassword) {
					res.send({ message: "Invalid Password"});
				}else {

					// token - succes login
					var token = createToken(user);
					res.json({
						succes: true,
						message: "Successfuly Login",
						token: token
					});
				}
			}
		});
	});



	// Custom Middleware
	api.use(function(req, res, next) {

		console.log("Somone just came to the app!");

		var token = req.body.token || req.param('token') || req.headers['x-access-token'];

		//Check if token exist
		if(token) {
			jsonwebtoken.verify(token, secretKey, function(err, decoded) {
				if(err) {
					res.status(403).send({ succes: false, message: "Failed to auth user"});
				}else {
					// go to next route
					req.decoded = decoded;
					next();
				}
			});

		}else {
			res.status(403).send({ succes: false, message: "No Token provided"});
		}
	});


	// Destination B - Home route  // provide a legitimate token
	/*api.get('/', function(req, res) {
		res.json("Hello World!");
	});*/

	// Do multipy http request on single route - this is used instead of code above it
	api.route('/')
		.post(function(req, res) {

			var post = new Post({
				creator: req.decoded.id,
				content: req.body.content
			});

			post.save(function(err, newStory) {
				if (err){
					res.send(err);
					return;
				}
				io.emit('story', newStory);
				res.json({ message: "New Post Created!"});
			});
		})

		// Get all post by a User
		.get(function(req, res) {
			Post.find({ creator: req.decoded.id}, function(err, posts) {
				if (err){
					res.send(err);
					return;
				}

				res.json(posts);
			});

		});

	// Api for the html Angular.js files to fetch login user data
	api.get('/me', function(req, res) {
		res.json(res.decoded);
	});





//localhost:3000/api/signup

	// Test Api
	return api;
};
