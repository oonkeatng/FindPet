// Import the packages/libraries
var express = require('express');
var app = express();
var path = require("path");
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

//include bodyparser 
app.use(bodyParser.json());
app.use("/", express.static(__dirname));

// import the models
Pet = require('./models/pet');
Customer = require('./models/customers');
Counter = require('./models/counter');


// Assign port number to 8080 if not configured at server environment
const port = process.env.PORT || 8080;

//IP address 
var IPaddress = "localhost";

// Connect to MongoDB via Mongoose driver
mongoose.connect('mongodb://localhost/findapet');

// DB object
var db = mongoose.connection;

// // Handle GET request without API calls, render the main index page.
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname+'/index.html'));
 });


// Display all pets
app.get('/api/pets', function(req, res){
    Pet.getPets(function(err, pets){
        if(err){
            res.status(500).send(err);
        }
        res.status(200).json(pets);
    })

});

// Display a pet from given ID
app.get('/api/pets/:id', function(req, res){
    Pet.getPetById(req.params.id,function(err, pet){
        if(err){
            res.status(500).send(err);
            return;
        }
        res.json(pet);
    })

});

//Display an array of matching customer for the given pet
app.get('/api/pets/:id/matches', async function(req, res){

    //fetech the Pet record based on the given id
    var pet = await Pet.find({$and: [
            {id: req.params.id},
            {adopted: false}]})
    .limit(1)
    .exec()
    .then(doc => {
        return doc;
    })
    .catch(err => {
        res.status(500).send(err);
        return;
    });

    // if return empty result, send error
    if (!Object.keys(pet).length > 0)
    {
        res.status(500).send("Pet ID not found or unavailable!");
        return;
    }
        // extract the record information
        const petSpecies = pet[0].species;
        const petBreed = pet[0].breed;
        const petAge = pet[0].age;
        var petNum, breedNum = 0;

        // Assign the species type according to 3-bit bitwise operations
        switch(petSpecies)
        {
            //species: 1 - Dog, 2 - Cat, 4 - Rabbit
            case "dog":
            petNum = 1;
            break;

            case "cat":
            petNum = 2;
            break;

            case "rabbit":
            petNum = 4;
            break;

        }

        var retRes;

        // if species is a dog, then construct the breed with 4-bit bitwise operations
        if (petSpecies == "dog")
        {
            switch(petBreed)
            {
                //breed: 1 - labrador, 2 - poodle, 4 - spaniel, 8 - terrier
                case "labrador":
                breedNum = 1;
                break;

                case "poodle":
                breedNum = 2;
                break;

                case "spaniel":
                breedNum = 4;
                break;

                case "terrier":
                breedNum = 8;
                break;
            }
            // Search customer record 
             retRes = await Customer.find({ 
                $or: [
                        // preference.anything is true
                        {'preference.anything': true},

                        // OR
                        { $and: [
                            {'preference.species': 1}, // if species is dog, get the breed
                            {'preference.ageMax': {$gte: petAge}}, // AND age is between 1 to ageMax
                            {'preference.breed': {$bitsAllSet: breedNum}}, // AND breed is matched 
                            {adopted: false} // AND not adopted
                        ]}

                        
                    ]
            }).exec()
            .then(doc => {
                console.log(doc);
                return doc;
            })

        }
        else
        {
                    // Search customer record 
                    var retRes = await Customer.find({ 
                        $or: [
                            { $and: [
                                    {'preference.species': {$bitsAllSet: petNum}}, // all species other than dog
                                    {'preference.ageMax': {$gte: petAge}}, // AND age is between 1 to ageMax
                                    {adopted: false} // AND not adopted
                                ]},

                            { $and: [
                                // OR (preference.anything is true AND adopted is false)
                                {'preference.anything': true},
                                {adopted: false}]} 
                            ]
                    }).exec()
                    .then(doc => {
                        console.log(doc);
                        return doc;
                    })
        }

        
        res.json(retRes);
})



// Add a new pet
app.post('/api/pets', async function(req, res){

    // check if the age is within the range
    if (req.body.age < 1 || req.body.age > 99)
    {
        res.status(500).send("age must be in between 1 and 99!");
        return;
    }

    // fetch the last_id from Counter
    var retCounter = await Counter.find()
    .limit(1)
    .select({last_id: true})
    .exec()
    .then(doc => {
        console.log(doc);
        //return doc[0].last_id + 1;
        return doc;
    })
    .catch(err => {
        console.error(err)
        return;
    });

    //increase the ID by 1
    var newID = retCounter[0].last_id + 1;
    req.body.id = newID;
    
    // retrieve the unique ID of the record 
    var ID = retCounter[0]._id;

    var pet = req.body;

    // if the species is dog, validate on the breed
    if(pet.species == "dog")
    {
        switch(pet.breed){
            case "labrador":
            case "poodle":
            case "spaniel":
            case "terrier":
            break;

            default:
            res.status(500).send("breed field accepts only: labrador, poodle, spaniel, terrier.");
            return;
        }

    }
    else if(pet.species == "cat" || pet.species == "rabbit")
    {
        if (pet.breed != "")
        {
            res.status(500).send("breed field is only applicable for species dog!");
            return;
        }
    }
    else
    {
        res.status(500).send("species must be either dog, cat or rabbit!");
        return;
    }

    Pet.addPet(pet, async function(err, pet){

        if(err){
            res.status(500).send(err);
        }

        res.json(pet);
    })

    // Create the object 
    var update = {
        last_id: newID
    }

    //Find and update the last_id to +1
    Counter.findByIdAndUpdate(ID, update, function(err, result){
        if(err){
            console.log(err);
        }
        console.log("RESULT: " + result);

     });

});

// Display all Counters
app.get('/api/counters', function(req, res){
    Counter.getCounters(function(err, counters){
        if(err){
            res.status(500).send({error:err.message});
            return;
        }
        res.json(counters);
    })

});


// Display all customers
app.get('/api/customers', function(req, res){
    Customer.getCustomers(function(err, customers){
        if(err){
            res.status(500).send({error:err.message});
            return;
        }

        res.json(customers);
    })

});

// Display a customer from given ID
app.get('/api/customers/:id', function(req, res){
    Customer.getCustomerById(req.params.id,function(err, customer){
        if(err){
            res.status(500).send(err);
        }
        res.json(customer);
    })

});

// Add a new customer
app.post('/api/customers', async function(req, res){

    // fetch the last_cid from Counter
    var retCounter = await Counter.find()
    .limit(1)
    .select({last_cid: true})
    .exec()
    .then(doc => {
        return doc;
    })
    .catch(err => {
        console.error(err);
        return;
    });

    //increase the ID by 1
    var newID = retCounter[0].last_cid + 1;
    req.body.id = newID;
    
    // retrieve the unique ID of the record 
    var ID = retCounter[0]._id;

    //Check if the species isn't a dog but breed is set
    if (((req.body.preference.species & 1) == 0) && (req.body.preference.breed > 0))
    {
        res.status(500).send("breed field is only applicable for species dog!")
        return;
    }
    //Check if the species is a dog and breed is not set
    else if ((req.body.preference.species & 1) && (req.body.preference.breed == 0))
    {
        res.status(500).send("breed field cannot be empty, it accepts only: labrador, poodle, spaniel, terrier.");
        return;
    }

    if(req.body.preference.ageMin > req.body.preference.ageMax)
    {
        res.status(500).send("ageMin cannot be greater than ageMax!");
        return;
    }

    var customer = req.body;

    Customer.addCustomer(customer, function(err, customer){

        if(err){
            res.status(500).send({error:err.message});
            return;
        }
        res.json(customer);
    })

    // Create the object 
    var update = {
        last_cid: newID
    }

    //Find and update the last_cid to +1
    Counter.findByIdAndUpdate(ID, update, function(err, result){
        if(err){
            console.log(err);
        }
        console.log("RESULT: " + result);

     });

});

//Display an array of matching pet for the given customer
app.get('/api/customers/:id/matches', async function(req, res){

    //fetch a customer doc by ID
    var customer = await Customer.find({$and: [
                {id: req.params.id},
                {adopted: false}
    ]})
    .limit(1)
    .exec()
    .then(doc => {
        return doc;
    })
    .catch(err => {
        res.status(500).send(err);
    });

    // return error message when customer ID is invalid or adopted
    if(!Object.keys(customer).length > 0)
    {
        res.status(500).send("Customer ID is invalid or unavailable!");
        return;
    }
        // extract the information from returned record
        const petSpecies = customer[0].preference.species;
        const petBreed = customer[0].preference.breed;
        const petAgeMin = parseInt(customer[0].preference.ageMin);
        const petAgeMax = parseInt(customer[0].preference.ageMax);
        const petAny = customer[0].preference.anything;

        // variables for bitwise calculation
        var petNum, breedNum = 0;

        //declare string array for the query
        var strSpecies = [];
        var strBreed = [];

        //construct species array with bitwise operations
        //species: 1 - Dog, 2 - Cat, 4 - Rabbit
        if (petSpecies & 1) strSpecies.push('dog');
        if (petSpecies & 2) strSpecies.push('cat');
        if (petSpecies & 4) strSpecies.push('rabbit');

        //construct breed array with bitwise operations
        //breed: 1 - labrador, 2 - poodle, 4 - spaniel, 8 - terrier
        if (petBreed & 1) strBreed.push('labrador');
        if (petBreed & 2) strBreed.push('poodle');
        if (petBreed & 4) strBreed.push('spaniel');
        if (petBreed & 8) strBreed.push('terrier');


        var retRes; //variable to save the return doc

        //if customer is okay with anything, then extract all pets that are available
        if(petAny)
        {
            retRes = await Pet.find({adopted: false}).exec()
            .then(doc => {
                console.log(doc);
                return doc;
            })
        }
        else
        {
            retRes = await Pet.find({ 
                $and: [
                    {species: {$in: strSpecies}}, //if the species fit within the strSpecies
                    {age: {$gte: petAgeMin, $lte: petAgeMax}}, // AND age is in between ageMin and ageMax
                    {adopted: false} // AND not adopted
                ]


            }).exec()
            .then(doc => {
                console.log(doc);
                return doc;
            })
        }
        res.json(retRes);
})


//Adopt a pet
app.post('/api/customers/:id/adopt', async function(req, res){
    
    //initialize param_found false as default
    var param_found = false;

    // check if there is query parameter
    if(Object.keys(req.query).length > 0)
    {
        //iterate through the query parameters to ensure pet_id is found
        for (var param in req.query) {
        if(param == "pet_id" && req.query[param].length > 0)
        {
            param_found = true;
            break;
        }
     }
    }

    //if wrong or missing pet_id parameter, return error
     if(!param_found)
     {
        res.status(500).send("pet_id parameter is missing!");
        return;
     }

    //fetch a customer doc by ID and not adopted
    var customer = await Customer.find({
        $and: 
        [
            {id: req.params.id},
            {adopted: false}
        ]
    })
    .limit(1)
    .exec()
    .then(doc => {
        return doc;
    })
    .catch(err => {
        res.status(500).send(err);
    });

    // if the return doc is empty (ID not found or adopted)
    if (!Object.keys(customer).length > 0)
    {
        res.status(200).send("Customer ID not found or unavailable. Please try other ID.");
        return;
    }

    //fetch a pet doc by ID and not adopted
    var pet = await Pet.find({
        $and: 
        [
            {id: req.query.pet_id},
            {adopted: false}
        ]
    })
    .limit(1)
    .exec()
    .then(doc => {
        return doc;
    })
    .catch(err => {
        res.status(500).send(err);
    });

    // if the return doc is empty (ID not found or adopted)
    if (!Object.keys(pet).length > 0)
    {
        res.status(200).send("Pet ID not found or unavailable. Please try other pet.");
        return;
    }

    // Customer data with adopted set to true
    var customerUpdate = {
        id: customer[0].id,
        preference : {
            ageMin: customer[0].preference.ageMin,
            ageMax: customer[0].preference.ageMax,
            anything: customer[0].preference.anything,
            species: customer[0].preference.species,
            breed: customer[0].preference.breed,
        },
        adopted: true
    }

    // Pet data with adopted set to true
    var petUpdate = {
        id: pet[0].id,
        name : pet[0].name,
        available_from : pet[0].available_from,
        age : pet[0].age,
        species : pet[0].species,
        breed : pet[0].breed,
        adopted : true
        }

    var retResult;
    //Update adopted field in customer document to true
    Customer.findOneAndUpdate({id: customer[0].id}, customerUpdate, {new: true}, function(err, result)
    {
        if(err){
            res.status(500).send(err);
        }
        retResult = result;
    })

    //Update adopted field in pet document to true
    Pet.findOneAndUpdate({id: pet[0].id}, petUpdate, {new: true}, function(err, result)
    {
        if(err){
            res.status(500).send(err);
        }
        res.json("RESULT: " + retResult+result);
    })


});



// Listen to port 
app.listen(port, IPaddress, () => console.log(`Listening on port ${port}...`));
