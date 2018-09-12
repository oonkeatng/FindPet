var mongoose = require('mongoose');

// define the counter for pet ID and customer ID
var counterSchema = mongoose.Schema({
    last_id : { //Pet last ID
        type: Number,
        unique: true
    },
    last_cid: { // customer last ID
        type: Number,
        unique: true
    }
});

// export counter model
var Counter = module.exports = mongoose.model('Counter', counterSchema);

// Get Counter records
module.exports.getCounters = function(callback, limit){
    Counter.find(callback).limit(limit);
};

// Update Counter
module.exports.updateCounter = function(id, counter, options, callback){
    var query = {last_id: id};
    var update = {
        last_id: id,
    }
    Counter.findOneAndUpdate(query, update, options, callback);
};