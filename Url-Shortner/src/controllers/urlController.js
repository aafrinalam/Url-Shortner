const urlModel = require("../Models/urlModel");
const shortId = require("shortid");
const redis = require('redis')
const { promisify } = require("util");


// ====================================================== redisClient ===================================================================

const redisClient = redis.createClient(
    19837,
    "redis-19837.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("ceul8MIokpMHPhOwDYe3DZENKHnI1D5z", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);


// ====================================================== createUrl ===================================================================

const createUrl = async function (req, res) {
    try {
        const baseUrl = "http://localhost:3000/";
        if (!/^https?:\/\/\w/.test(baseUrl.trim())) { return res.status(400).send({ status: false, msg: "baserUrl is not valid" }) }

        const longUrl = req.body.longUrl
        if (!longUrl) { return res.status(400).send({ status: false, msg: "please provide a longUrl" }) }

        // VALIDATING LONG-URL:
        if (!/^https?:\/\/([\w\d\-]+\.)+\w{2,}(\/.+)?$/.test(longUrl.trim())) { return res.status(400).send({ status: false, msg: "longUrl is invalid" }) }

        let longUrlAlredyUesd = await GET_ASYNC(`${longUrl}`)
        if (longUrlAlredyUesd) { return res.status(200).send({ status: true,msg:"data that ur", data:JSON.parse(longUrlAlredyUesd)}) }

        let longurl= await urlModel.findOne({ longUrl: longUrl })
        if(longurl) {
            await SET_ASYNC(`${longUrl}`,JSON.stringify(longurl))
            return res.status(200).send({status:true,data:longurl})
        }
        
        let urlCode = shortId.generate()
        let shortUrl = baseUrl + urlCode;
        let data = {
            longUrl: longUrl,
            shortUrl: shortUrl,
            urlCode: urlCode,
        }
        const savedUrl = await urlModel.create(data);
        let result = {
            longUrl: savedUrl.longUrl,
            shortUrl: savedUrl.shortUrl,
            urlCode: savedUrl.urlCode
        }
        return res.status(201).send({ status: true, msg: "url-shortend", data: result })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message });
    }
};

// ====================================================== getUrlCode ===================================================================

const getUrlcode = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        // const urlCode = req.params.urlCode
        if (urlCode.trim().length == 0) {
            return res.status(400).send({ status: false, msg: "params value is not present" })
        }

        if ((urlCode.length != 9)) { 
            return res.status(400).send({ status: false, message: "Invalid Url" }) 
        }
        let urlDetails = await GET_ASYNC(`${urlCode}`)
        if (urlDetails) {
            let changeToObject = JSON.parse(urlDetails)
            console.log("redis")
            return res.status(302).redirect(changeToObject.longUrl)
        }

        let url = await urlModel.findOne({ urlCode: urlCode })
        if (url) {
            await SET_ASYNC(`${urlCode}`, JSON.stringify(url), "EX", 60)
            console.log()
            return res.status(302).redirect(url.longUrl)
        }
        else {
            return res.status(404).send({ status: false, msg: "urlCode not exist" })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ msg: error.message })
    }
}

module.exports.createUrl = createUrl;
module.exports.getUrlcode = getUrlcode;
