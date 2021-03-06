const {Router} = require('express')
const router = Router()
const cookieParser = require('cookie-parser');
const md5 = require('js-md5');
const nodeSid = require('node-sid');
const request = require('request');
const axios = require('axios');
var moment = require('moment');

moment.locale('ru'); 

const devicesSchema = require('../models/devices');
const auditorySchema = require('../models/auditory');
const usersSchema = require('../models/users');
const sidSchema = require('../models/sid');
const logsSchema = require('../models/logs');

var check = require('../scripts/check');
var hsh = require('../scripts/hash');



exports.getMain = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk')
    else  {
        res.render('index', {
            title: 'ADAS',
            isIndex: true,
            status
        })
    }
}

exports.getAuth = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk')
    else  {
        res.render('auth', {
            title: 'Авторизация'
        })
    }
}

exports.postAuth = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk')
    else {
        const user = await usersSchema.findOne({$or: [{login: req.body.login.toLocaleLowerCase()}, {email: req.body.login}]})
        if (!user) {
            res.render('auth', {
                title: 'Авторизация',
                error: 'ОШИБКА! Данный логин не существует или введён неверно.'
            }) 
        } else {
            if (hsh.getHash(req.body.password, user.salt) == user.password){    
                res.clearCookie('_id');
                res.clearCookie('sid');
                res.cookie('_id', user._id);    
                if (user.new_password) {   
                    var hash = md5(md5(user.login) + md5(Date.now.toString())); 
                    await usersSchema.findByIdAndUpdate(user._id, { 'new_password_hash': hash }); 
                    res.redirect('/new_password/'+hash); 
                    return 0; 
                } 
                const sid = nodeSid().create('SID', 32);
                res.cookie('sid', sid);
                const new_sid = new sidSchema({ user_id: user._id, sid: sid });
                await new_sid.save();
                console.log('Пользователь (_id: '+user._id+') вошёл в систему. Sid: '+sid);          
                res.redirect('/lk')
            } else {
                res.render('auth', {
                    title: 'Авторизация',
                    error: 'ОШИБКА! Пароль введен неверно.'
                }) 
            }
        }
    }
}

exports.getReg = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk')
    else  {       
        res.render('reg', {
            title: 'Авторизация'
        })
    }
}

exports.postReg = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk')
    else  {       
        const user = await usersSchema.findOne({login: req.body.login.toLocaleLowerCase()})
        if (user) {
            res.render('reg', {
                title: 'Регистрация',
                error: 'ОШИБКА! Данный пользователь уже зарегистрирован.'
            }) 
        } else if (req.body.password == '1234567890') {
            res.render('reg', {
                title: 'Регистрация',
                error: 'ОШИБКА! Пароль не должен совпадать со стандартным.'
            })
        }
        else {
            const salt = hsh.getSalt('', 8);
            const new_user = new usersSchema({
                about: req.body.about,
                login: req.body.login.toLocaleLowerCase(),
                email:  req.body.email,
                phone:  req.body.phone,
                password:  hsh.getHash(req.body.password, salt),
                salt: salt
            })
            await new_user.save();
            res.redirect('/auth');
        }  
    }
}


exports.getNewPassword = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk');
    else {
        const user = await usersSchema.findById(req.cookies._id)        
        if (!user) { res.redirect('/auth'); return 0 }     
        if (user.new_password_hash != req.params.hash) { res.redirect('/auth'); return 0 } 
        else  {
            res.render('new_password', {
                title: 'Смена пароля',
                login: user.login,
                hash: req.params.hash
            })
        }
    }
}

exports.postNewPassword = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  res.redirect('/lk');
    else {   
        const user = await usersSchema.findById(req.cookies._id)        
        if (!user) { res.redirect('/auth'); return 0 }     
        if (user.new_password_hash != req.params.hash) { res.redirect('/auth'); return 0 } 
        if (user.password == hsh.getHash(req.body.password, user.salt)) { 
            res.render('new_password', {
                title: 'Смена пароля',
                login: user.login,
                hash: req.params.hash,
                error: "ОШИБКА! Новый пароль не должен совпадать со стандартным или предыдущим!"
            })
        } else {   
            const salt = hsh.getSalt('', 8);
            await usersSchema.findByIdAndUpdate(req.cookies._id, {'password': hsh.getHash(req.body.password, salt), 'salt': salt, 'new_password': false, 'new_password_hash': ''})
            console.log('Пользователь (_id: '+req.cookies._id+') удачно сменил пароль.');
            res.clearCookie('_id');
            res.redirect('/auth')
        }
    }
}


exports.getLogout = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) res.redirect('/')
    else  {       
        console.log('Пользователь (_id: '+req.cookies._id+') вышел из системы. Sid: '+req.cookies.sid);
        res.clearCookie('_id');
        await sidSchema.findOneAndUpdate({ sid: req.cookies.sid }, { online: false, close: Date() });
        res.clearCookie('sid');
        res.redirect('/')
    }
}

exports.getLk = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online)  res.redirect('/')
    else {
        if (!req.params.id) { res.redirect('/lk/'+req.cookies._id); return 0; }
        var myLk = false;
        if (req.cookies._id == req.params.id) { myLk = true; }
        const user = await usersSchema.findById(req.params.id).lean()
        const auditory = await auditorySchema.find({taken: user._id}).lean()
        const have = []
        for (i = 0; auditory.length > i; i++) {
            var device = await devicesSchema.findOne({_id: auditory[i].device_id}).lean()
            have[i] = Object.assign({name: device.name}, auditory[i])
        }
        uidAddRender = true;
        uidDelRender = true;
        error = req.cookies.error ? req.cookies.error : NaN;
        res.clearCookie('error');
        if (user.vk_uid && user.google_uid && user.ya_uid)
            uidAddRender = false;
        if (!user.vk_uid && !user.google_uid && !user.ya_uid)
            uidDelRender = false;
        res.render('lk', {
            title: 'Личный кабинет',
            status,
            user: user,
            myLk,
            uidAddRender,
            uidDelRender,
            have,
            error
        })
    }
}

exports.getSearch = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online)  res.redirect('/')
    else {
        if (!req.params.search && !req.params.type) var device = await devicesSchema.find({}).lean(); 
        else if (req.params.search && req.params.type) var device = await devicesSchema.find({ 
            $and: [ {
                $or: [ 
                    { about: { $regex: req.params.search, $options: '-i' } }, 
                    { name: { $regex: req.params.search, $options: '-i'  } }
                ] },
                {  type : { $regex: req.params.type, $options: '-i' } }
            ]
        }).lean() 
        else if (req.params.search) var device = await devicesSchema.find({ 
                $or: [ 
                    { about: { $regex: req.params.search, $options: '-i' } }, 
                    { name: { $regex: req.params.search, $options: '-i'  } }
                ]
        }).lean() 
        else if (req.params.type) var device = await devicesSchema.find({ type : { $regex: req.params.type, $options: '-i' } }).lean() 
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
            status,
            search: req.params.search,
            type: req.params.type,
            device
        })
    }
}

exports.postSearch = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online)  res.redirect('/');
    if (req.body.search && req.body.type)
        res.redirect('/search/'+req.body.search+'/type/'+req.body.type);
    else if (req.body.search)
        res.redirect('/search/'+req.body.search);
    else if (req.body.type)
        res.redirect('/search/type/'+req.body.type);
    else res.redirect('/search/')
}

exports.getLogs = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online)  res.redirect('/')
    else {
        var logs = await logsSchema.find({}).lean() 
        for (var i = 0; i < logs.length; i++){
            user = await usersSchema.findById(logs[i].user_id).lean();
            logs[i].user = user ? user.about : logs[i].user_id + ' (Пользователь удалён из базы)';
            auditory = await auditorySchema.findById(logs[i].device_id);
            var device = '';
            if (auditory)
                device = await devicesSchema.findById(auditory.device_id).lean();
            logs[i].device = device ? device.name : logs[i].device_id + ' (Устройство удалено из базы)';
            logs[i].received = moment(logs[i].received).utcOffset('GMT+07:00').format('lll');
            if (logs[i].returned)
                logs[i].returned = moment(logs[i].returned).utcOffset('GMT+07:00').format('lll');
            else    
                logs[i].returned = "На руках"
        }
        res.render('logs', {
            title: 'Журнал',
            Logs: true,
            status,
            logs
        })
    }
}


exports.postApiAuth = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  {
        if (req.body.token)  {                    
            await axios.get('http://ulogin.ru/token.php?token='+req.body.token+'&host=https://adas-tusur.herokuapp.com/')
            .then(async function (resp) {
                if (resp.data.network == 'vkontakte') { 
                    var user = await usersSchema.findOne({vk_uid: resp.data.uid});
                    if (!user) await usersSchema.findByIdAndUpdate(req.cookies._id, { 'vk_uid' : resp.data.uid})
                    else {
                        res.cookie('error', 'Данный id уже привяз к другому аккаунту.');
                        res.redirect('/lk');
                        return;
                    }
                }
                if (resp.data.network == 'google') { 
                    var user = await usersSchema.findOne({google_uid: resp.data.uid});
                    if (!user) await usersSchema.findByIdAndUpdate(req.cookies._id, { 'google_uid' : resp.data.uid})
                    else {
                        res.cookie('error', 'Данный id уже привяз к другому аккаунту.');
                        res.redirect('/lk');
                        return;
                    }
                }
                if (resp.data.network == 'yandex') { 
                    var user = await usersSchema.findOne({ya_uid: resp.data.uid});
                    if (!user) await usersSchema.findByIdAndUpdate(req.cookies._id, { 'ya_uid' :resp.data.uid})
                    else {
                        res.cookie('error', 'Данный id уже привяз к другому аккаунту.');
                        res.redirect('/lk');
                        return;
                    }
                }
                console.log('Пользователь (_id: '+req.cookies._id+') успешно привязал '+resp.data.network+' (uid: '+resp.data.uid+').');     
            });
        }    
        res.redirect('/lk');
        return;
    }
    else {
        if (req.body.token)  {                    
            await axios.get('http://ulogin.ru/token.php?token='+req.body.token+'&host=https://adas-tusur.herokuapp.com/')
            .then(async function (resp) {
                var user = await usersSchema.findOne({$or: [{vk_uid: resp.data.uid}, {google_uid: resp.data.uid}, {ya_uid: resp.data.uid}]});
                if (user) {
                    res.clearCookie('_id');
                        res.clearCookie('sid');
                        res.cookie('_id', user._id);    
                        if (user.new_password) {   
                            var hash = md5(md5(user.login) + md5(Date.now.toString())); 
                            await usersSchema.findByIdAndUpdate(user._id, { 'new_password_hash': hash }); 
                            res.redirect('/new_password/'+hash); 
                            return 0; 
                        } 
                        const sid = nodeSid().create('SID', 32);
                        res.cookie('sid', sid);
                        const new_sid = new sidSchema({ user_id: user._id, sid: sid });
                        await new_sid.save();
                        console.log('Пользователь (_id: '+user._id+') вошёл в систему в помощью '+resp.data.network+'. Sid: '+sid);          
                        res.redirect('/lk')
                        return;
                }  
                res.redirect('/lk');
            });
        } 
    }
}

exports.deleteVk = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  {
        var user = await usersSchema.findOne({vk_uid: req.params.uid});
        if (user._id == req.cookies._id)  {
            await usersSchema.findByIdAndUpdate(req.cookies._id, { 'vk_uid' : ''})
            console.log('Пользователь (_id: '+user._id+') отвязал VK');     
        }
        res.redirect('/lk');
        return;
    }
    res.redirect('/');
}

exports.deleteYa = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  {
        var user = await usersSchema.findOne({ya_uid: req.params.uid});
        if (user._id == req.cookies._id)  {
            await usersSchema.findByIdAndUpdate(req.cookies._id, { 'ya_uid' : ''})
            console.log('Пользователь (_id: '+user._id+') отвязал Yandex');     
        }
        res.redirect('/lk');
        return;
    }
    res.redirect('/');
}

exports.deleteGoogle = async (req, res) => {
    var status = await check.check(req, res);
    if (status.online)  {
        var user = await usersSchema.findOne({google_uid: req.params.uid});
        if (user._id == req.cookies._id) {
            await usersSchema.findByIdAndUpdate(req.cookies._id, { 'google_uid' : ''})
            console.log('Пользователь (_id: '+user._id+') отвязал Google');     
        }
        res.redirect('/lk');
        return;
    }
    res.redirect('/');
}