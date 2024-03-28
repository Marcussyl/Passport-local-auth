if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config() //load environment variables from a .env file into process.env
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

//use a local variable to store the users, in a real app, you would use a database
const users = []

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false })) //make URL-encoded data available in req.body
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, //determine whether the session store should be updated with an unchanged session
    saveUninitialized: false //determine whether a session that is new but not modified is saved to the store
}))
app.use(methodOverride('_method')) //override the method of the request (e.g. POST to DELETE
app.use(passport.initialize())
app.use(passport.session())

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async(req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    console.log(users)
})

app.delete('/logout', (req, res) => {
    req.logOut((err) => {
            if (err) {
                return next(err)
            }
            res.redirect('/login')
        }) //passport function to remove the req.user property and clear the login session
})

//logout the user and redirect them to the login page (do not allow them to access the home page if they are not logged in)
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

//if the user is authenticated, redirect them to the home page (do not allow them to access the login or register pages if they have logged in)
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { //passport function to check if the user is authenticated
        return res.redirect('/')
    }
    next()
}

app.listen(3000)