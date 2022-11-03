const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();
const port = 9090;

app.use(cors());
app.use(bodyParser.json());

const doctorsSchema = new mongoose.Schema({
    name: { type: String, required: true, },
    address: { type: String, required: true, },
    location: { type: String, required: true, },
    schedule: { type: [{ type: String, lowercase: true }], required: true, },
    speciality: { type: Array, index: true },
});

const specialityLookupSchema = new mongoose.Schema({
    specialityName: { type: String, required: true, },
    tags: {
        type: [{ type: String, lowercase: true }],
        required: true,
        unique: true,
        index: true,
    },
});

const Spec = mongoose.model('Tank', specialityLookupSchema);

specialityLookupSchema.pre('updateOne', function (next) {

    console.log(
        'sdasdssdsd'
    )
    var self = this;
    console.log(self)
    Spec.find({tags : self.name}, function (err, docs) {
        console.log(docs)
        if (!docs.length){
            next();
        }else{
            console.log('user exists: ',self.name);
            next(new Error("User exists!"));
        }
    });
}) ;

const Doctor = mongoose.model('doctors', doctorsSchema, "Doctors");
const Speciality = mongoose.model('specialitylookup', specialityLookupSchema, "SpecialityLookup");

// Read ALL DOCTORS
app.get('/doctors-all', (req, res) => {
    console.log('dasdas');
    Doctor.find({}, (dberr, dbres) => {
        if (dberr) res.send(dberr);
        res.send(dbres);
    })
});

// Read ALL SPECIALITY
app.get('/specialitylookup-all', (req, res) => {
    Speciality.find({}, (dberr, dbres) => {
        if (dberr) res.send(dberr);
        res.send(dbres);
    })
});

// Find a speciality
app.get('/specialitylookup', (req, res) => {
    let jsonReq = req.body;
    /**
     * Sample JSON Request
    {
        "spec" : "obgyn"
    }
     * 
    **/

    Speciality.find({ tags: req.body.spec }, (dberr, dbres) => {
        if (dberr) res.send(dberr);
        res.send(dbres);
    })
});

// Find a doctor from a tag
app.get('/doctors', (req, res) => {
    let jsonReq = req.body;
    /**
     * Sample JSON Request
    {
        "spec" : "obgyn"
    }
     * 
    **/

    Doctor.find({ speciality: req.body.spec }, (dberr, dbres) => {
        if (dberr) res.send(dberr);
        res.send(dbres);
    })
});

// Create Speciality
app.post('/addtag', async (CHANGEEM, res) => {
    /**
     * Sample JSON Request
     {
        "_id" : "635b922de28bf22f389ad664",
        "tag" : "mickey"
    }
     *
     **/

    let req = { body :{
        "_id" : "63634e0e0eb1716e0ed557b9",
        "tag" : ["mickey", "minnie"]
    }}



    // console.log(req.body)
    Speciality.updateOne({ _id: req.body._id }, { $addToSet: { tags : { $each: req.body.tag }}})
        .then(resp => {
            console.log(resp);
            res.send({success : true})

    });
});


// Create Speciality
app.post('/specialitylookup', (req, res) => {
    /**
     * Sample JSON Request
    {
        "specialityName" : "optometry",
        "tags" : ["optometry", "optalmology"]
    }
     * 
    **/
    console.log(req.body)
    let jsonReq = req.body;

    Speciality.create({
        specialityName: jsonReq.specialityName,
        tags: jsonReq.tags
    }, (dberr, dbres) => {
        if (dberr) res.send(dberr);
        res.send(dbres);
    });
});

// Create Doctor
app.post('/doctor', (req, res) => {
    /**
     * Sample JSON Request
    {
        "name" : "Edwin Micheals",
        "address" : "UCSF Hospital",
        "location" : "San Francisco CA",
        "speciality" : ["optometry", "optalmology"],
        "schedule" : ["wednesday", "saturday"]
    }
     * 
    **/
    let jsonReq = req.body;

    Doctor.create({
        name: jsonReq.name,
        address: jsonReq.address,
        location: jsonReq.location,
        speciality: jsonReq.speciality,
        schedule: jsonReq.schedule,

    }, (dberr, dbres) => {
        if (dberr) res.send(dberr);
        res.send(dbres);
    });

});

app.listen(port, () => {
    mongoose.connect('mongodb+srv://developer:Pdfflv030@cluster0.nuicfdx.mongodb.net/FindMyDoctor?retryWrites=true&w=majority');

    console.log(`Example app listening on port ${port}`)
});
