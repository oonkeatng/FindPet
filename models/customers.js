var mongoose = require('mongoose');

// Custom message and validation values
const ageMin = [1, 'The value of path `{PATH}` ({VALUE}) is beneath the limit ({MIN}).'];
const ageMax = [99, 'The value of path `{PATH}` ({VALUE}) exceeds the limit ({MAX}).'];

const speciesMin = [1, 'The value of path `{PATH}` ({VALUE}) is beneath the limit ({MIN}).'];
const speciesMax = [7, 'The value of path `{PATH}` ({VALUE}) exceeds the limit ({MAX}).'];

const breedMin = [0, 'The value of path `{PATH}` ({VALUE}) is beneath the limit ({MIN}).'];
const breedMax = [15, 'The value of path `{PATH}` ({VALUE}) exceeds the limit ({MAX}).'];


// define customer schema
var customerSchema = mongoose.Schema({
    id : {
        type: Number,
        require: true
    },
    preference : {
        //Age range
        ageMin: {type: Number, min: ageMin, max: ageMax, default:1, require:true},
        ageMax: {type: Number, min: ageMin, max: ageMax, default:1, require:true},

        anything: {type: Boolean, default:false},

        //species: 1 - Dog, 2 - Cat, 4 - Rabbit
        species: {type: Number, min: speciesMin, max: speciesMax, require:true},
        
        //breed: 1 - labrador, 2 - poodle, 4 - spaniel, 8 - terrier, 0 - not applicable
        breed: {type: Number, min: breedMin, max: breedMax, default: 0}
    },
    adopted: {type: Boolean, default: false, require: true}
    
});

// Export the model
var Customer = module.exports = mongoose.model('Customer', customerSchema);


// Get Customers
module.exports.getCustomers = function(callback, limit){
    Customer.find(callback).limit(limit);
};

// Get Customer by ID
module.exports.getCustomerById = function(id, callback){
    console.log(id);
    var query = {id: id};
    Customer.find(query, callback);
};

// Add Customer
module.exports.addCustomer = function(customer, callback){
    Customer.create(customer, callback);
};

