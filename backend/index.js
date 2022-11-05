const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')
let _ = require('lodash');
const path = require('path');

const app = express();
const port = 9090;

app.use(cors());
app.use(bodyParser.json());

const DoctorsSchema = new mongoose.Schema({
    name: { type: String, required: true, },
    address: { type: String, required: true, },
    location: { type: String, required: true, },
    schedule: { type: [{ type: String, lowercase: true }], required: true, },
    speciality: { type: Array, index: true },
});

const SpecialityLookupSchema = new mongoose.Schema({
    specialityName: { type: String, required: true, },
    tags: {
        type: [{ type: String, lowercase: true }],
        required: true,
        unique: true,
        index: true,
    },
});

const Doctor = mongoose.model('Doctors', DoctorsSchema, "Doctors");
const Speciality = mongoose.model('SpecialityLookup', SpecialityLookupSchema, "SpecialityLookup");

app.use(express.static('dist'))
//
// app.get('/', (req,res)=>{
//     res.sendFile('/dist/index.html');
// })

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

app.get('/tagslookup-all', (req, res) => {
    Speciality.find({}, (dberr, dbres) => {
        let retVal = [];
        if (dberr) res.send(dberr);

        dbres.forEach((spec)=>{
            spec.tags.forEach((tag)=>{
                retVal.push(_.startCase(tag))
            })
        });
        res.send(retVal.sort());


        // dbres.map((item) => {
        //     // console.log(item.tags)
        //     retVal.push(...item.tags)
        // });
        // console.log(_.sta);
        // res.send(dbres);
    }).select('tags');
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
app.post('/doctors', (req, res) => {
    let jsonReq = req.body;
    /**
     * Sample JSON Request
    {
        "spec" : "obgyn"
    }
     * 
    **/
    let tag = _.kebabCase(req.body.tag);
    if(tag.length > 0 ){
        Speciality.findOne({ tags: _.kebabCase(req.body.tag) }, (specErr, specRes) => {
            console.log(specRes)
            if (specErr || specRes == null) {
                res.send({success : false})
            } else {
                Doctor.find({speciality : specRes.specialityName}, (docErr, docRes)=>{
                    if (docErr || docRes == null){
                        res.send({success : false});
                    } else {
                        res.send(docRes);
                    }
                });
            }

        }).select('specialityName')
    } else {
        res.send({success : false});
    }

});

// Create Speciality
app.post('/addtag', async (req, res) => {
    /**
     * Sample JSON Request
     {
        "_id" : "635b922de28bf22f389ad664",
        "tag" : "mickey, "minnie"
    }
     *
     **/

    // let req = { body :{
    //     "_id" : "63634e0e0eb1716e0ed557b9",
    //     "tag" :
    // }}

    let newTags = req.body.tag = sanitizeInput(req.body.tags);
    Speciality.find({ tags : {$in : newTags}}, (err, dbRes)=>{
        switch (true) {
            case dbRes.length > 0 && err == null:
                let foundTags = [];
                dbRes.forEach(item => foundTags = [...item.tags, ...foundTags])
                console.log(foundTags)
                // console.log(foundTags);
                newTags = sanitizeRepeats(newTags, foundTags);
                console.log(newTags)
                if(newTags.length === 0){
                    res.send({success: true, msg : "no update"})
                    break;
                }
            case dbRes.length === 0 && err == null:
                console.log(newTags)
                Speciality.updateOne({ _id: req.body._id }, { $addToSet: { tags : { $each: newTags }}})
                    .then(resp => {
                        console.log(resp);
                        res.send({success : true})
                });
                break;
            default :
                res.send({success : false});
        }
    }).select('tags');
});

function sanitizeInput(inputTextToArray){
    const temp = _.compact((inputTextToArray.replace(/[0-9]/g, '')).split(","));
    return temp.map(item => _.kebabCase(item));
}

function sanitizeRepeats(mainTags, repeatTags){
    return mainTags.filter( ( el ) => !repeatTags.includes( el ) );
}


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
        tags: sanitizeInput(jsonReq.tags[0])
    }, (dberr, dbres) => {
        console.log(dberr)
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
