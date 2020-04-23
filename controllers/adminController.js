const {Router} = require('express')
const router = Router()
const cookieParser = require('cookie-parser');
const md5 = require('js-md5');
const nodeSid = require('node-sid')

const devicesSchema = require('../models/devices');
const auditorySchema = require('../models/auditory');
const usersSchema = require('../models/users');

var check = require('../scripts/check');
var hsh = require('../scripts/hash');

exports.getEdit = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    if (!req.params.search) var device = await devicesSchema.find({}).lean() 
    else var device = await devicesSchema.find({ 
        $or: [ 
            { about: { $regex: req.params.search, $options: '-i' } }, 
            { name: { $regex: req.params.search, $options: '-i'  } },
            { type: { $regex: req.params.search, $options: '-i'  } }
        ] 
    }).lean()  
    res.render('edit', {
        title: 'Редактировать данные',
        Edit: true,
        search: req.params.search,
        status,
        device
    })
}

exports.postEdit = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    if (req.body.name && req.body.about && req.body.type && !req.body._id){
        const device = await devicesSchema.findOne({name: req.body.name}).lean()
        if (!device) {
            var new_device = new devicesSchema ({
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
        const device = await devicesSchema.findOneAndUpdate({_id: req.body._id}, {
            name: req.body.name,
            about: req.body.about,
            type: req.body.type
        }).lean()
        res.redirect('/edit')
    }
    else
        res.redirect('/edit/'+req.body.search)
}

exports.getDevices = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    if (!req.params.search) var device = await devicesSchema.find({}).lean()   
    else var device = await devicesSchema.find({ 
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
        status,
        search: req.params.search,
        have
    })
}

exports.postDevices = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    res.redirect('/devices/'+req.body.search)
}

exports.addDevice = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    if (req.body._id && req.body.code && req.body.auditory) { 
        var new_code = req.body.code    
        var check = await usersSchema.findOne({code: new_code})
        while (check){
            var date = new Date()
            var new_code = date.getTime()+'0'+(date.getSeconds()+10)            
            check = await usersSchema.findOne({code: new_code})
        }
        const new_device = new auditorySchema({
            device_id: req.body._id,
            code: new_code,
            auditory: req.body.auditory
        })
        await new_device.save()
        res.redirect('/devices')
    }
    else
        res.redirect('/devices')
}

exports.getUsers = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    if (!req.params.search) var users = await usersSchema.find({}).lean()
    else var users = await usersSchema.find({ 
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
        status,
        search: req.params.search,
        new_code: new_code,
        have
    })
}

exports.postUsers = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }   
    if (req.body.search)  res.redirect('/users/'+req.body.search);
    else res.redirect('/users/');
}

exports.addUser = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }  
    if (req.body.about && req.body.login && req.body.email 
        && req.body.type && req.body.phone && req.body.code) {  
        const user = await usersSchema.findById(req.body._id)
        if (user) { res.redirect('/users'); return 0;}
        else {          
            const new_user = new usersSchema({
                about: req.body.about,
                login: req.body.login.toLocaleLowerCase(),
                email:  req.body.email,
                phone:  req.body.phone,
                type: req.body.type,
                code: req.body.code,
                new_password: true,
                password:  hsh.getHash('1234567890', 'salt'),
                salt: 'salt'
            })
            await new_user.save();
            console.log(Date() + ': Пользователь (_id: '+req.cookies._id+') добавил пользователя '+req.body.login+' (_id: '+req.body._id+').');
            res.redirect('/users')
        }
    }
    else res.redirect('/users') 

}

exports.editUser = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }
    if (req.body.about && req.body.login && req.body._id && req.body.email 
        && req.body.type && req.body.phone && req.body.code) {            
        const user = await usersSchema.findByIdAndUpdate(req.body._id, {
            about: req.body.about,
            type: req.body.type,
            login: req.body.login.toLocaleLowerCase(),
            email: req.body.email,
            phone: req.body.phone,
            code: req.body.code
        })
        console.log(Date() + ': Пользователь (_id: '+req.cookies._id+') изменил пользователя '+req.body.login+' (_id: '+req.body._id+').');
        res.redirect('/users')
    }
    else res.redirect('/users')   

}

exports.deleteUser = async (req, res) => {
    var status = await check.check(req, res);
    if (!status.online) { res.redirect('/'); return; }
    if (!status.admin) { res.redirect('/lk'); return; }  
    console.log(Date() + ': Пользователь (_id: '+req.cookies._id+') удалил пользователя (_id: '+req.body._id+').');
    const user = await usersSchema.findByIdAndDelete(req.body._id)
    res.redirect('/users')
}
