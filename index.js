var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var url = require('url');
var Gettext = require('node-gettext');
var sprintf = require('sprintf');
var fs = require('fs');
var locale = require('locale');
var gt = new Gettext();

// Set port for the app to run on
app.set('port', (process.env.PORT || 5000));

//Serve files in the 'public' directory
app.use(express.static('public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Set supported locales
var supportedLocales = ["en", "es"];
app.use(locale(supportedLocales));


var fileContentsEnglish = fs.readFileSync("./data/strings/en.po");
gt.addTextdomain("en", fileContentsEnglish);
var fileContentsSpanish = fs.readFileSync("./data/strings/es.po");
gt.addTextdomain("es", fileContentsSpanish);


// Let EJS templates use Gettext and sprintf
app.use(function (req, res, next) {
    gt.textdomain(req.locale);
    res.locals.gt = gt;
    res.locals.sprintf = sprintf;
    next();
});


/* Fields */
function getMeta(request) {
    var path = './data/strings/' + request.locale + '/meta.json';
    return JSON.parse(fs.readFileSync(path, 'utf8')).meta;
};

function getHotels(request) {
    var path = './data/strings/' + request.locale + '/hotels.json';
    return JSON.parse(fs.readFileSync(path, 'utf8')).hotels;
};

function getLocations(request) {
    path = './data/strings/' + request.locale + '/locations.json';
    return JSON.parse(fs.readFileSync(path, 'utf8')).locations;
}
/* Fields */

/* Hotel Results */
app.get('/browse/:city', function (request, response) {
    var city = request.params.city;

    var hotels = getHotels(request);
    var locations = getLocations(request);
    var meta = getMeta(request);

    var results = [];
    var titleText = "";
    var description = "";


    for (var i = 0; i < hotels.length; i++) {
        var hotel = hotels[i];
        if (hotel.prevLink.toLowerCase() === city.toLowerCase()) {
            results.push(hotel);
        }
    }

    var currentLocation = "";
    for (var i = 0; i < locations.length; i++) {
        if (locations[i].link === city) {
            currentLocation = locations[i].txt;
            break;
        }
    }

    if (results.length > 0) {

        titleText = meta.browse.titleText;
        description = sprintf(gt.gettext('SmartlingHotels is currently displaying all hotels present in the SmartlingHotels Database that are located in the area of: %s'), currentLocation);

        response.render('pages/hotel_results', {

            hotels: results,
            locations: locations,
            city: currentLocation,
            titleText: titleText,
            description: description

        });
    }
    else {
        results = 0;

        titleText = meta.results404.titleText;
        description = meta.results404.description;

        response.render('pages/results404', {

            locations: locations,
            city: city,
            results: results,
            titleText: titleText,
            description: description
        });
    }
});

/* About Us */
app.get('/about_us', function (request, response) {

    var meta = getMeta(request);

    var titleText = meta.about_us.titleText;
    var description = meta.about_us.description;

    response.render('pages/about_us', {titleText: titleText, description: description});
});

/* Browse */
app.get('/browse', function (request, response) {

    var locations = getLocations(request);
    var meta = getMeta(request);

    var titleText = meta.browse.titleText;
    var description = meta.browse.description;
    response.render('pages/browse', {locations: locations, titleText: titleText, description: description});
});

/* Site Map */
app.get('/site_map', function (request, response) {

    var meta = getMeta(request);

    var titleText = meta.site_map.titleText;
    var description = meta.site_map.description;

    response.render('pages/site_map', {titleText: titleText, description: description});
});

/* Support */
app.get('/support', function (request, response) {

    var meta = getMeta(request);

    var titleText = meta.support.titleText;
    var description = meta.support.description;

    response.render('pages/support', {titleText: titleText, description: description});
});

/* Reservation Confirmed*/
app.get('/:hotelPath/checkout/reservation_confirmed', function (request, response) {
    var hotelPath = request.params.hotelPath;

    var hotels = getHotels(request);
    var meta = getMeta(request);

    var currentHotel = {};
    var titleText = "";
    var description = "";
    for (var i = 0; i < hotels.length; i++) {
        var hotel = hotels[i];
        if (hotel.link.toLowerCase() === hotelPath.toLowerCase()) {
            currentHotel = hotel;
        }
    }
    if (Object.keys(currentHotel).length > 0) {

        titleText = meta.thank_you.titleText;
        description = meta.thank_you.description;

        response.render('pages/thank_you', {

            hotel: currentHotel,
            titleText: titleText,
            description: description
        });
    } else {

        titleText = meta.checkout404.titleText;
        description = meta.checkout404.description;

        response.render('pages/checkout404', {

            locations: locations,
            titleText: titleText,
            description: description
        });
    }
});

/* Checkout */
app.get('/:hotelPath/book?', function (request, response) {
    var hotelPath = request.params.hotelPath;

    var hotels = getHotels(request);
    var meta = getMeta(request);

    var currentHotel = {};
    var titleText = "";
    var description = "";
    for (var i = 0; i < hotels.length; i++) {
        var hotel = hotels[i];
        if (hotel.link.toLowerCase() === hotelPath.toLowerCase()) {
            currentHotel = hotel;
        }
    }
    if (Object.keys(currentHotel).length > 0) {
        var formData = {
            "firstName": request.query.firstName,
            "lastName": request.query.lastName,
            "email": request.query.email,
            "nights": parseInt(request.query.nights)
        };

        titleText = meta.checkout.titleText;
        description = meta.checkout.description;

        response.render('pages/checkout', {

            hotel: currentHotel,
            titleText: titleText,
            description: description,
            formData: formData
        });
    } else {

        titleText = meta.checkout404.titleText;
        description = meta.checkout404.description;

        response.render('pages/checkout404', {

            titleText: titleText,
            description: description
        });
    }
});


/* Hotel Page */
app.get('/:hotelPath', function (request, response) {
    var hotelPath = request.params.hotelPath;

    var hotels = getHotels(request);
    var locations = getLocations(request);
    var meta = getMeta(request);

    var currentHotel = {};
    var titleText = "";
    var description = "";
    for (var i = 0; i < hotels.length; i++) {
        var hotel = hotels[i];
        if (hotel.link.toLowerCase() === hotelPath.toLowerCase()) {
            currentHotel = hotel;
            titleText = currentHotel.name + " | SmartlingHotels";
            description = hotel.description1;
        }
    }
    if (Object.keys(currentHotel).length > 0) {

        response.render('pages/hotel_page', {

            hotel: currentHotel,
            locations: locations,
            titleText: titleText,
            description: description
        });
    } else {

        titleText = meta.page404.titleText;
        description = meta.page404.description;

        response.render('pages/page404', {

            locations: locations,
            titleText: titleText,
            description: description
        });
    }
});


/*
 app.get('/:language/', function(request, response) {
 var language = request.params.language;
 var data = JSON.parse(require('fs').readFileSync('./data/strings/en/data.json', 'utf8'));
 response.render('pages/index', { data: data});
 });
 */

/* Index */
app.get('/', function (request, response) {

    var meta = getMeta(request);
    var titleText = meta.index.titleText
    var description = meta.index.description;
    response.render('pages/index', {titleText: titleText, description: description});
});


// This is for parsing query strings, might want it later
//var urlData = url.parse(request.url,true).query;


// Set the server listening for requests
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});








