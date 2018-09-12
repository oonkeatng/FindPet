var mongoose = require('mongoose');

// Pet Schema - Example
// id - integer
// name - string
// available_from - timestamp
// age - integer
// species - string
// cat
// dog
// rabbit
// breed - string (for a dog)
// labrador
// poodle
// spaniel
// terrier

// define pet schema
var petSchema = mongoose.Schema({
    id : {
        type: Number,
        require: true
    },
    name : {
        type: String,
        require: true
    },
    available_from : {
        type: Date
    },
    age : {
        type: Number,
        require: true
    },
    species : {
        type: String,
        trim: true,
        require: true
    },
    breed : {
        type: String,
        trim: true
    },
    adopted :  {
        type: Boolean,
        require: true,
        default: false
    }
});

// export the model
var Pet = module.exports = mongoose.model('Pet', petSchema);

// Get All Pets
module.exports.getPets = function(callback, limit){
    Pet.find(callback).limit(limit);
};

// Get Pet by ID
module.exports.getPetById = function(id, callback){
    var query = {id: id};
    Pet.find(query, callback);
};


// Add Pet
module.exports.addPet = function(pet, callback){
    Pet.create(pet, callback);
    
};

