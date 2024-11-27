const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busName: { type: String, required: true },
  timings: { type: String, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Bus', busSchema);
