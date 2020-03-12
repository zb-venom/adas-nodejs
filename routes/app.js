const {Router} = require('express');
const userSchema = require('../models/users')
const auditorySchema = require('../models/auditory')
const deviceSchema = require('../models/devices')
const md5 = require('js-md5');
const cookieParser = require('cookie-parser')
const mongoJoin = require("mongo-join-query");

const router = Router();
router.use(cookieParser('secret key'))

router.get('/', async (req, res) => {
    if (req.cookies.online)  res.redirect('/lk')
    else 
    res.render('index', {
        title: 'ADAS',
        isIndex: true,
        online: req.cookies.online, 
        admin: req.cookies.admin
    })
})

router.get('/auth', async (req, res) => {
    if (req.cookies.online) res.redirect('/lk');
    else  {
        res.render('auth', {
            title: 'Авторизация',
            phone: req.cookies.phone, 
            admin: req.cookies.admin
        })
    }
})

router.get('/reg', async (req, res) => {
    if (req.cookies.online) res.redirect('/lk');
    else 
    res.render('reg', {
        title: 'Регистрация',
        online: req.cookies.online, 
        admin: req.cookies.admin
    })
})

router.post('/reg', async (req, res) => {
    if (req.cookies.online) res.redirect('/lk');
    const user = await userSchema.findOne({login: req.body.login.toLocaleLowerCase()})
    if (user) {
        res.render('reg', {
            title: 'Регистрация',
            error: 'ОШИБКА! Данный пользователь уже зарегистрирован.'
        }) 
    }
    else {
        const new_user = new userSchema({
            about: req.body.about,
            login: req.body.login.toLocaleLowerCase(),
            email:  req.body.email,
            phone:  req.body.phone,
            password:  md5(req.body.password),
        })
        await new_user.save();
        res.redirect('/auth');
    }    
})

router.post('/auth', async (req, res) => {
    if (req.cookies.online) res.redirect('/lk');
    const user = await userSchema.findOne({$or: [{login: req.body.login.toLocaleLowerCase()}, {email: req.body.login}]})
    if (!user) {
        res.render('auth', {
            title: 'Авторизация',
            error: 'ОШИБКА! Данный логин не существует или введён неверно.'
        }) 
    } else {
        if (md5(req.body.password) == user.password){
            res.cookie('login', user.login)
            res.cookie('type', user.type)
            if (user.type == 1)
                res.cookie('admin', 'admin')                
            if (user.type == 0)
                res.cookie('none', 'none')
            res.cookie('online', 'online')
            res.redirect('/lk')
        } else {
            res.render('auth', {
                title: 'Авторизация',
                error: 'ОШИБКА! Пароль введен неверно.'
            }) 
        }
    }
    
})

router.get('/logout', async (req, res) => {
    if (req.cookies.online) {
        res.clearCookie('online')
        res.clearCookie('admin')
        res.clearCookie('none')
        res.redirect('/')
    }
    else {
        res.redirect('/')
    }
})

router.get('/lk', async (req, res) => {
    if (!req.cookies.online) res.redirect('/');
    const user = await userSchema.findOne({login: req.cookies.login}).lean()
    const auditory = await auditorySchema.find({taken: user._id}).lean()
    const have = []
    for (i = 0; auditory.length > i; i++) {
        var device = await deviceSchema.findOne({_id: auditory[i].device_id}).lean()
        have[i] = Object.assign({name: device.name}, auditory[i])
    }
    res.render('lk', {
        title: 'Личный кабинет',
        online: req.cookies.online, 
        admin: req.cookies.admin,
        user: user,
        have
    })
})

router.get('/search', async (req, res) => {
    if (!req.cookies.online) res.redirect('/');
    const device = await deviceSchema.find({}).lean() 
    const have = []
    for (i = 0; device.length > i; i++) {
        var count_404 = await auditorySchema.find({device_id: device[i]._id, auditory: '404'}).countDocuments()
        var count_707 = await auditorySchema.find({device_id: device[i]._id, auditory: '707'}).countDocuments()
        if (count_707 == 0 && count_404 == 0)
            count_none = true;
        else 
            count_none= false;
        have[i] = Object.assign(device[i], { count_404: count_404 }, { count_707: count_707}, {count_none: count_none})
    } 
    res.render('search', {
        title: 'Поиск оборудования',
        Search: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        device
    })
})

router.get('/search/:search', async (req, res) => {
    if (!req.cookies.online) res.redirect('/');
    const device = await deviceSchema.find({ 
        $or: [ 
            { about: { $regex: req.params.search, $options: '-i' } }, 
            { name: { $regex: req.params.search, $options: '-i'  } },
            { type: { $regex: req.params.search, $options: '-i'  } }
        ] 
    }).lean() 
    const have = []
    for (i = 0; device.length > i; i++) {
        var count_404 = await auditorySchema.find({device_id: device[i]._id, auditory: '404'}).countDocuments()
        var count_707 = await auditorySchema.find({device_id: device[i]._id, auditory: '707'}).countDocuments()
        if (count_707 == 0 && count_404 == 0)
            count_none = true;
        else 
            count_none= false;
        have[i] = Object.assign(device[i], { count_404: count_404 }, { count_707: count_707}, {count_none: count_none})
    } 
    res.render('search', {
        title: 'Поиск оборудования',
        Search: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        search: req.params.search,
        device
    })
})

router.post('/search', async (req, res) => {
    if (!req.cookies.online) res.redirect('/');
    res.redirect('/search/'+req.body.search)
})

router.get('/edit', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; } 
    const device = await deviceSchema.find({}).lean() 
    res.render('edit', {
        title: 'Редактировать данные',
        Edit: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        device
    })
})

router.get('/edit/:search', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    const device = await deviceSchema.find({ 
        $or: [ 
            { about: { $regex: req.params.search, $options: '-i' } }, 
            { name: { $regex: req.params.search, $options: '-i'  } },
            { type: { $regex: req.params.search, $options: '-i'  } }
        ] 
    }).lean()  
    res.render('edit', {
        title: 'Редактировать данные',
        Edit: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        search: req.params.search,
        device
    })
})

router.post('/edit', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    if (req.body.name && req.body.about && req.body.type && !req.body._id){
        const device = await deviceSchema.findOne({name: req.body.name}).lean()
        if (!device) {
            var new_device = new deviceSchema ({
                name: req.body.name,
                about: req.body.about,
                type: req.body.type
            })
            await new_device.save();
            res.redirect('/edit')
        }
        res.redirect('/edit')
    }
    if (req.body.name && req.body.about && req.body.type && req.body._id){
        const device = await deviceSchema.findOneAndUpdate({_id: req.body._id}, {
            name: req.body.name,
            about: req.body.about,
            type: req.body.type
        }).lean()
        res.redirect('/edit')
    }
    else
        res.redirect('/edit/'+req.body.search)
})

router.get('/devices', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    const device = await deviceSchema.find({}).lean()     
    const have = []
    var date = new Date()
    var new_code = date.getTime()+'0'+(date.getSeconds()+10)
    for (i = 0; device.length > i; i++) {
        var auditory = await auditorySchema.find({device_id: device[i]._id}).lean()  
        have[i] = Object.assign(device[i], {auditory: auditory}, {new_code: new_code})
    } 
    res.render('devices', {
        title: 'Оборудование',
        Devices: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        have
    })
})

router.get('/devices/:search', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    const device = await deviceSchema.find({ 
        $or: [ 
            { about: { $regex: req.params.search, $options: '-i' } }, 
            { name: { $regex: req.params.search, $options: '-i'  } },
            { type: { $regex: req.params.search, $options: '-i'  } }
        ] 
    }).lean()   
    const have = []
    var date = new Date()
    var new_code = date.getTime()+'0'+(date.getSeconds()+10)
    for (i = 0; device.length > i; i++) {
        var auditory = await auditorySchema.find({device_id: device[i]._id}).lean()  
        have[i] = Object.assign(device[i], {auditory: auditory}, {new_code: new_code})
    } 
    res.render('devices', {
        title: 'Оборудование',
        Devices: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        search: req.params.search,
        have
    })
})

router.post('/devices', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    res.redirect('/devices/'+req.body.search)
})

router.post('/device/add', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }    
    if (req.body._id && req.body.code && req.body.auditory) { 
        var new_code = req.body.code    
        var check = await userSchema.findOne({code: new_code})
        while (check){
            var date = new Date()
            var new_code = date.getTime()+'0'+(date.getSeconds()+10)            
            check = await userSchema.findOne({code: new_code})
        }
        const new_device = new auditorySchema({
            device_id: req.body._id,
            code: new_code,
            auditory: req.body.auditory
        })
        await new_device.save()
        res.redirect('/devices/')
    }
    else
        res.redirect('/devices')
})

router.get('/users', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    const users = await userSchema.find({}).lean()     
    var date = new Date()
    var new_code = '7'+(date.getSeconds()+10)+''+date.getTime()
    var have = []
    for (i = 0; users.length > i; i++) {
        if (users[i].type == 1)
            var full_type = 'Администратор'
        else if (users[i].type == 0)
            var full_type = 'Не подтвержден'
        else if (users[i].type == 2)
            var full_type = 'Студент'
        have[i] = Object.assign(users[i], {new_code: new_code}, {full_type: full_type})
    } 
    res.render('users', {
        title: 'Пользователи',
        Users: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        have
    })
})

router.get('/users/:search', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    const users = await userSchema.find({ 
        $or: [ 
            { about: { $regex: req.params.search, $options: '-i' } }, 
            { login: { $regex: req.params.search, $options: '-i'  } },
            { email: { $regex: req.params.search, $options: '-i'  } },
            { phone: { $regex: req.params.search, $options: '-i'  } }
        ] 
    }).lean()     
    var date = new Date()
    var new_code = '7'+(date.getSeconds()+10)+''+date.getTime()
    var have = []
    for (i = 0; users.length > i; i++) {
        if (users[i].type == 1)
            var full_type = 'Администратор'
        else if (users[i].type == 0)
            var full_type = 'Не подтвержден'
        else if (users[i].type == 2)
            var full_type = 'Студент'
        have[i] = Object.assign(users[i], {new_code: new_code}, {full_type: full_type})
    } 
    res.render('users', {
        title: 'Пользователи',
        Users: true,
        online: req.cookies.online, 
        admin: req.cookies.admin,
        have
    })
})

router.post('/users', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    res.redirect('/users/'+req.body.search)
})

router.post('/users/edit', async (req, res) => {
    if (!req.cookies.online) { res.redirect('/'); return 0; }
    if (!req.cookies.admin) { res.redirect('/lk'); return 0; }
    if (req.body.about && req.body.login && req.body._id && req.body.email 
        && req.body.type && req.body.phone && req.body.code) {            
        const user = await userSchema.findOneAndUpdate({_id: req.body._id}, {
            about: req.body.about,
            type: req.body.type,
            login: req.body.login,
            email: req.body.email,
            phone: req.body.phone,
            code: req.body.code
        })
        res.redirect('/users')
    }
    else res.redirect('/users')
})

module.exports = router