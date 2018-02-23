const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');

//bycrypt config
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

//Moje boje
let newAppUser = new Object;
let noData = new Boolean;
let responseData = new Object;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://mdtest:wow123@ds225308.mlab.com:25308/firstdatabasetest', {
 //   useMongoClient: true
});

const app = express();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug')
app.set('views', path.join(__dirname + '/views'))

app.get( '/', function(req, res){
    res.render('home-site.pug'); 
})

app.get('/register', function(req, res){
    res.render('registration.pug');
})

app.get('/loggin', function(req,res){
    res.render('loggin.pug');
})

app.listen(PORT, function() {
    console.log('Node app is running on port', PORT);
  });

//new user Schema and movie subSchema
const moviesSchema = new Schema({
    title : { type: String, required: true },
    score : { type: Number, required: true },
    movieId: { type: 'String', required: true, unique: true },
});

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    movies: [moviesSchema],
    created_at: Date,
    updated_at: Date
}, {collection: 'user-data'});

//Mongoose schema method
userSchema.methods.manify = function(next) {
    this.name = this.name + '-boy';

    return next(null, this.name);
};

//pre-save method
userSchema.pre('save', function(next) {
    let user = this;
  //  console.log('user.password  ' + user.password);
    bcrypt.hash(user.password, 10, function (err, hash){
        if (err){
            return next(err);
        }
        user.password = hash;
     //   console.log('user.password ' + user.password);
    });

    console.log('user password ' + user.password );
    
    //pobranie aktualnego czasu
    const currentDate = new Date();

    //zmiana pola na aktualny czas
    this.updated_at = currentDate;

    if (!this.created_at)
        this.created_at = currentDate;

    next();
});

//model based on userSchema
const User = mongoose.model('User', userSchema);

//
// New User Creation part:
//
const userCreation = function(req, res, next){
    if (req.body.password === req.body.confirmPassword){
        newAppUser = new User({
            username: req.body.username,
            password: req.body.password
        });
        newAppUser.save().then(()=> next());
    }
    else {
        console.log('niepoprawne hasło');
        res.render('registration.pug');
        return 
    }
 //   next();
}

const authentication2 = function(req, res, next){
    appendUserData(req.body.username, req.body.password).then(() => next())
};

app.post('/app-page', userCreation, authentication2, function(req, res){
    /*
    const obj = {
        name : req.body.username,
        movies : responseData.movies
    };
    */
    res.render('loggin.pug');
})

//
// Logg In Part
//

const authentication = function(req, res, next){
    appendUserData(req.query.username, req.query.password).then(() => next())
};

app.get('/app-page', authentication, function(req, res){
    if (noData == false){
        console.log('responseData.movies ' + responseData.movies.length);
        res.render('app-page.pug', {
        name : req.query.username,
        movies : responseData.movies,
        });
    }
    else {
        res.redirect('/');
    }
})

//
// Movie Add Part:
//

const movieAdd = function(req, res, next){
    User.findOne({ username : responseData.username }, function(err, user) {
        if (err) throw err;
        user.movies.push({ title: req.body.movie_title, score: req.body.movie_score, movieId: uuidv4()});
        user.save().then(() => next());
    });
/*
    const newMovie = {title : req.body.movie_title, score : req.body.movie_score, movieId: uuidv4()};
    console.log('responseData.username w movieAdd ' + responseData.username);
    User.findOne({username : responseData.username}, function(err, user){
        if (err) throw err;
        user.movies.push(newMovie);
       // user.movies = user.movies + newMovie;
        user.save().then(() => next());
    })
*/
};   

const getNewData = function(req, res, next){
    let userData = User.findOne({username: responseData.username, password: responseData.password}, function(err, res){
        if (err) throw err;
        if (res) {
            console.log('We have a response!');
            noData = false;
            responseData = res;
            return next();
        } else {
            console.log('no matching result  ' + res);
            noData = true
            return next();
        }
    });  
};

app.post('/addmovie', movieAdd, getNewData, function(req, res){
    res.redirect('back');
})

//
// Movie Delete:
//

app.get('/remove/:movieId', function (req, res) { 
   return User.findOne({username : responseData.username}, function(err, user){
       if (err) throw err;
        user.movies = user.movies.filter(movie => movie.movieId !== req.params.movieId);
      /*  user.save().then(() => res.render('app-page.pug', {
            name: responseData.username,
            movies: user.movies
        })); */
        user.save().then(() => res.redirect('back'));
    })
})

//
// Movie Edit
//

app.get('/edit/:movieId', function(req, res){
    return User.findOne({username : responseData.username}, function(err, user){
        if (err) throw err;
        user.movies.map((movie) => {
            if (movie.movieId == req.params.movieId){
                res.render('edit.pug', {
                    movies: responseData.movies,
                    movie: movie.title,
                    score: movie.score,
                    id: movie.movieId
                })
            }
        })
    });
})

const postEdition = function(req, res, next){
    return User.findOne({username: responseData.username}, function(err, user){
        if (err) throw err;
        user.movies = user.movies.map(movie => {
           // console.log('request in post - req.params.movieId ' + req.params.movieId);
           // console.log('request movie.movieId ' + movie.movieId);
            if (movie.movieId == req.params.movieId){
              //  console.log('req.body.movie_title ' + req.body.movie_title);
              //  console.log('movie title: ' + movie.title);
                movie.title = req.body.movie_title;
                movie.score = req.body.movie_score;
              //  console.log('movie title po zmianie: ' + movie.title);
            }
            return movie;
        });
        console.log('user movies: ' + user.movies[0]);
        user.save().then(() => next());
    });
};

app.post('/edit/:movieId', postEdition, getNewData, function(req, res){
    res.render('app-page.pug', {
        name : responseData.username,
        movies : responseData.movies
    })
})

//
// Functions
//

function appendUserData(username, password) {
    return User.findOne({username, password}).then((res) => {
        noData = false;
        responseData = res;
        return responseData;
    })
}

/*
function appendUserData(username, password) {
    return User.findOne({username, password}, function(err, res) {
        console.log('appendUser Data: ' + username + ' ' + password);
        if (err) throw err;
        if (res) {
            noData = 'no';
            responseData = res;
            console.log('res dotarł do responseData');
        } else {
            console.log('no matching result in appendUserData ' + res);
            noData = 'yes'
        }
    });
}
*/
/*
//instancje klasy User
const kenny = new User({
    name: 'Kenny',
    username: 'Kenny_the_boy',
    password: 'password'
});

kenny.manify(function(err, name) {
    if (err) throw err;
    console.log('Twoje nowe imię to: ' + name);
});

const benny = new User({
    name: 'Benny',
    username: 'Benny_the_boy',
    password: 'password'
});

benny.manify(function(err, name) {
    if (err) throw err;
    console.log('Twoje nowe imię to: ' + name);
});

const mark = new User({
    name: 'Mark',
    username: 'Mark_the_boy',
    password: 'password'
});

mark.manify(function(err, name) {
    if (err) throw err;
    console.log('Twoje nowe imię to: ' + name);
});

const findAllUsers = function() {
    // find all users
    return User.find({}, function(err, res) {
        if (err) throw err;
        console.log('Actual database records are ' + res);
    });
}

const findSpecificRecord = function() {
    // find specific record
    return User.find({ username: 'Kenny_the_boy' }, function(err, res) {
        if (err) throw err;
        console.log('Record you are looking for is ' + res);
    })
}

const updadeUserPassword = function() {
    // update user password
    return User.findOne({ username: 'Kenny_the_boy' })
        .then(function(user) {
            console.log('Old password is ' + user.password);
            console.log('Name ' + user.name);
            user.password = 'newPassword';
            console.log('New password is ' + user.password);
            return user.save(function(err) {
                if (err) throw err;

                console.log('Uzytkownik ' + user.name + ' zostal pomyslnie zaktualizowany');
            })
        })
}

const updateUsername = function() {
    // update username
    return User.findOneAndUpdate({ username: 'Benny_the_boy' }, { username: 'Benny_the_man' }, function(err, user) {
        if (err) throw err;

        console.log('Nazwa uzytkownika po aktualizacji to ' + user.username);
    })
}

const findMarkAndDelete = function() {
    // find specific user and delete
    return User.findOne({ username: 'Mark_the_boy' })
        .then(function(user) {
            return user.remove(function() {
                console.log('User successfully deleted');
            });
        })
}

const findKennyAndDelete = function() {
    // find specific user and delete
    return User.findOne({ username: 'Kenny_the_boy' })
        .then(function(user) {
            return user.remove(function() {
                console.log('User successfully deleted');
            });
        });
}

const findBennyAndRemove = function() {
    // find specific user and delete
    return User.findOneAndRemove({ username: 'Benny_the_man' })
        .then(function(user) {
            return user.remove(function() {
                console.log('User successfully deleted');
            });
        });
}

Promise.all([kenny.save(), mark.save(), benny.save()])
    .then(findAllUsers)
    .then(findSpecificRecord)
    .then(updadeUserPassword)
    .then(updateUsername)
    .then(findMarkAndDelete)
    .then(findKennyAndDelete)
    .then(findBennyAndRemove)
    .catch(console.log.bind(console))
*/