const mongoose = require("mongoose")

const urlSchema = new mongoose.Schema({
    urlCode: { type: String, require: true,lowercase:true,unique:true, trim:true},
    longUrl: { type: String, require: true, trim: true },
    shortUrl: { type: String, required: true, trim: true },
    
}, { timestamps: true },{versionKey:false})

module.exports = mongoose.model("Url", urlSchema)

