const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const exphbs = require('express-handlebars')
const appRoutes = require('./routes/app')
const cookieParser = require('cookie-parser')
const colors = require('colors');
const config = require('./config/default')
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 3000

const app = express()

const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs'
})

app.use(
    bodyParser.urlencoded({
      extended: true
    })
  )
app.use(bodyParser.json())

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(appRoutes)
app.use(cookieParser('secret key'))



const db = 'mongodb+srv://'+config.login+':'+config.password+'@'+config.cluster+'/adas';


async function start() {
    try {
        await mongoose.connect(
            db,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            }
        )
        app.listen(PORT, () => {
            console.log('\nСервер запущен...\nПриложение доступно по ссылке http://localhost:3000\n'.green)
        })
    } catch (e) {
        console.log(e)
    }
}

start()