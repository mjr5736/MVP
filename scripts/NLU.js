/**
 * Functions for the Natural Language Understanding service
 */
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const natural_language_understanding = new NaturalLanguageUnderstandingV1({
    'username': '6a943afa-8dcd-491a-9a1f-ecf8f82825e0',
    'password': 'KXMf2XnJLDxu',
    'version_date': '2017-02-27'
});
const wks_model_id = '10:8a548c53-a489-456b-904d-bc8fc4912ab6';

let ex = module.exports = {};

/**
 * check with the natural language understanding to see if the tweet's text is weather-related
 */
function classify ( tweet, addTweetToDB, clientCallback) {

    let parameters = {
        'text': tweet.text,
        'features': {
            'entities': {
                "model": wks_model_id
            },
            'categories': {
                "model": wks_model_id
            }
        }
    };

    natural_language_understanding.analyze(parameters, function ( err, response ) {

        if ( err )
            console.log( 'error:', err );
        else {
            try {
                let label = getLabel( response.categories );
                let entity = getEntity( response.entities );

                let isAWeatherTweet = ex.isWeather( label );
                let isAnInclementTweet = ex.isInclement( entity );

                // add highest matching label and most specific entity to tweet
                tweet.NLULabel = label;
                tweet.NLUEntity = entity;
                ex.printInfo( tweet, isAWeatherTweet, isAnInclementTweet );

                if ( isAWeatherTweet && isAnInclementTweet ) {
                    // add tweet to database
                    addTweetToDB( tweet );

                    // send data to client
                    clientCallback( tweet );
                }
            } catch ( err ) {
                console.log( err );
            }
        }
    });
}

/**
 * split the label that's returned by understanding to see if a category is weather
 * @param label
 * @returns {boolean}
 */
function isWeather ( label ) {
    let labels = label.split('/');
    return labels.includes( 'weather' );
}

/**
 * determins if the weather is an inclement subtype or not
 * @param entity
 * @returns {boolean}
 */
function isInclement( entity ) {
    return (
        entity === "INCLEMENT_WEATHER" ||
        entity === "RAIN" ||
        entity === "SNOW" ||
        entity === "SLEET" ||
        entity === "HAIL" ||
        entity === "WIND" ||
        entity === "ICE"
    );
}

/**
 * returns primary category label
 * @param categories
 * @returns {string}
 */
function getLabel ( categories ) {
    let label = '';
    if ( categories.length > 0 ) {
        label = categories[0].label.toString();
    }
    return label;
}

/**
 * returns primary entity type or subtype of first weather entity encountered
 * @param entities
 * @returns {*}
 */
function getEntity( entities ) {

    let entity = ' Could not Classify';

    if ( entities[0] !== undefined) {

        entity = entities[0].type;

        for (let i = 0; i < entities.length; i++) {

            let type = entities[i].type;
            let subtype =  entities[i].disambiguation.subtype[0];

            if ( type === 'WEATHER' ) {
                if ( subtype ) {
                    return subtype;
                }
            }
        }
    }
    return entity;
}

/**
 * prints info about the returned NLU JSON object and corresponding tweet
 */
function printInfo( tweet, weather, inclement ) {

    let label = tweet.NLULabel;
    let entity = tweet.NLUEntity;
    let text = tweet.text;

    if ( !weather || !inclement ) {
        console.log(
            '******* NLU Top Label *******\n' +
            label + '\n' +
            '******* WKS-NLU Entities *******\n' +
            entity + '\n' +

            '/******* Tweet Text *******\n' +
            text + '\n\n'
        );
    } else {
        console.log(
            '\\********************************************************\\\n' +
            '\\************************************************\\\n\n' +
            //'******* Response from NLU *******\n' +
            //JSON.stringify(response, null, 2) + '\n\n' +

            '******* NLU Top Label *******\n' +
            label + '\n\n' +

            '******* WKS-NLU Entities *******\n' +
            entity+ '\n' +

            '/******* Tweet Text *******\n' +
            text + '\n\n' +
            '\\************************************************\\\n' +
            '\\********************************************************\\\n'
        );
    }
}

ex.classify = classify;
ex.isWeather = isWeather;
ex.isInclement = isInclement;
ex.printInfo = printInfo;

