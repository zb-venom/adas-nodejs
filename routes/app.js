const {Router} = require('express');
const router = Router()

const md5 = require('js-md5');
const cookieParser = require('cookie-parser');
router.use(cookieParser('50454e4953'));

var appController = require('../controllers/appController');
var adminController = require('../controllers/adminController');

router.route('/').get(appController.getMain);
router.route('/auth').get(appController.getAuth).post(appController.postAuth);
router.route('/reg').get(appController.getReg).post(appController.postReg);
router.route('/new_password/:hash').get(appController.getNewPassword).post(appController.postNewPassword);
router.route('/logout').get(appController.getLogout);

router.route('/api/auth').post(appController.postApiAuth);
router.route('/api/delete/vk/:uid').get(appController.deleteVk);
router.route('/api/delete/ya/:uid').get(appController.deleteYa);
router.route('/api/delete/google/:uid').get(appController.deleteGoogle);

router.route('/lk').get(appController.getLk);
router.route('/lk/:id').get(appController.getLk);

router.route('/search').get(appController.getSearch).post(appController.postSearch);
router.route('/search/:search').get(appController.getSearch).post(appController.postSearch);
router.route('/search/type/:type').get(appController.getSearch).post(appController.postSearch);
router.route('/search/:search/type/:type').get(appController.getSearch).post(appController.postSearch);

router.route('/logs').get(appController.getLogs)

router.route('/edit').get(adminController.getEdit).post(adminController.postEdit);
router.route('/edit/:search').get(adminController.getEdit).post(adminController.postEdit);
router.route('/device/delete').post(adminController.deleteDevice);

router.route('/devices').get(adminController.getDevices).post(adminController.postDevices);
router.route('/devices/:search').get(adminController.getDevices).post(adminController.postDevices);
router.route('/device/add').post(adminController.addDevice);
router.route('/devices/delete/:_id').get(adminController.deleteDevices);

router.route('/users').get(adminController.getUsers).post(adminController.postUsers);
router.route('/users/:search').get(adminController.getUsers).post(adminController.postUsers);
router.route('/user/add').post(adminController.addUser);
router.route('/user/edit/:_id').get(adminController.editFormUser);
router.route('/user/edit').post(adminController.editUser);
router.route('/user/delete').post(adminController.deleteUser);

router.get('/*', (req, res) => {
    res.render('404',{
        title: "Страница не найдена"
    })
})

module.exports = router