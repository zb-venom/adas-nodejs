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

router.route('/lk').get(appController.getLk);
router.route('/lk/:id').get(appController.getLk);

router.route('/search').get(appController.getSearch).post(appController.postSearch);
router.route('/search/:search').get(appController.getSearch).post(appController.postSearch);

router.route('/edit').get(adminController.getEdit).post(adminController.postEdit);
router.route('/edit/:search').get(adminController.getEdit).post(adminController.postEdit);

router.route('/devices').get(adminController.getDevices).post(adminController.postDevices);
router.route('/devices/:search').get(adminController.getDevices).post(adminController.postDevices);
router.route('/device/add').post(adminController.addDevice);

router.route('/users').get(adminController.getUsers).post(adminController.postUsers);
router.route('/users/:search').get(adminController.getUsers).post(adminController.postUsers);
router.route('/user/add').post(adminController.addUser);
router.route('/user/edit').post(adminController.editUser);
router.route('/user/delete').post(adminController.deleteUser);

module.exports = router