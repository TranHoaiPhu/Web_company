const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

// CRUD
router.post('/', locationController.createLocation);
router.post('/find-or-create', locationController.findOrCreateByCoordinates); // Find by coordinates or create new
router.get('/', locationController.getLocations);
router.get('/tree', locationController.getLocationTree);
router.get('/active', locationController.getActiveLocations);
router.get('/:id', locationController.getLocationById);
router.put('/:id', locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;
