const router = require('express').Router(); const c = require('../controllers/userController'); const { protect } = require('../middlewares/authMiddleware'); const { authorizeRoles } = require('../middlewares/roleMiddleware');
router.use(protect, authorizeRoles('admin')); router.get('/', c.getUsers); router.delete('/:id', c.deleteUser); module.exports = router;
