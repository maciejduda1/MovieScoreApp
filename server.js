const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

//bycrypt config
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

//Moje boje
let newAppUser = new Object;
let noData = new String;
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
    console.log('Node app is running on port', app.get('port'));
  });

//new user Schema
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    movies: [],
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
    console.log('user.password  ' + user.password);
    bcrypt.hash(user.password, 10, function (err, hash){
        if (err){
            return next(err);
        }
        user.password = hash;
        console.log('user.password ' + user.password);
    })

    
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

const userCreation = function(req, res, next){
    if (req.body.password === req.body.confirmPassword){
        newAppUser = new User({
            username: req.body.username,
            password: req.body.password
        });
        newAppUser.save();
    }
    else {
        console.log('niepoprawne hasło');
        res.render('registration.pug');
        return 
    }
    next();
}

const getNewData = function(req, res, next){
    let userData = User.findOne({username: req.body.username, password: req.body.password}, function(err, res){
        if (err) throw err;
        if (res) {
            noData = 'no';
            responseData = res;
            return next();
        } else {
            console.log('no matching result  ' + res);
            noData = 'yes'
            return next();
        }
    });  
};


app.post('/app-page', userCreation, function(req, res){
   // console.log(req.body.password + ' i ' + req.body.confirmPassword);
    res.render('app-page.pug');
})

const movieAdd = function(req, res, next){
    const newMovie = {title : req.body.movie_title , score : req.body.movie_score};
    console.log('responseData[0].username w movieAdd' + responseData.username)
    let theUserWithMovies = User.findOne({username : responseData.username}, function(err, user){
        if (err) throw err;
        user.movies.push(newMovie);
       // user.movies = user.movies + newMovie;
        user.save();
    })
    next();
};   

app.post('/addmovie', movieAdd, getNewData, function(req, res){
    res.redirect('back');
})

const authentication = function(req, res, next){
    let userData = User.findOne({username: req.query.username, password: req.query.password}, function(err, res){
        if (err) throw err;
        if (res) {
            noData = 'no';
            responseData = res;
            return next();
        } else {
            console.log('no matching result  ' + res);
            noData = 'yes'
            return next();
        }
    });  
}

app.get('/app-page', authentication, function(req, res){
    if (noData == 'no'){
        console.log('responseData.movies ' + responseData.movies.length);
        res.render('app-page.pug', {
        name : req.query.username,
        movies : responseData.movies,
        deleteMovie: () => findMovieAndDelete()
        });
    }
    else {
        res.redirect('/');
    }
})

const findMovieAndDelete = function(thisUser, thisMovie) {
    return User.findOne({ username: thisUser, movie: thisMovie })
        .then(function(user) {
            console.log('user ' + user);
/*            if (user.movies.title == thisMovie.title){
                return user.remove(function() {
                    console.log('User successfully deleted');
                             }); 
            }*/
        })
}


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