/**
 * Created by koo on 6/24/15.
 */



var Crawler = require("crawler");
var fs = require('fs');
var sleep = require('sleep');
var url = require("url");
var id_map = [];
var ilbe_url = "http://www.ilbe.com";
var number = 0;

var c = new Crawler({
    maxConnections: 1,
    skipDuplicates: true,
    // This will be called for each crawled page
    callback: function (error, result, $) {
        // $ is Cheerio by default
        // a lean implementation of core jQuery designed specifically for the server
        if ($) {
            $('a').each(function (index, a) {
                var toQueueUrl = $(a).attr('href');
                var id = toQueueUrl.substr(toQueueUrl.lastIndexOf('/') + 1);
                var num_id = Number(id);
                if (isInteger(num_id) && num_id > 6000000000) {
                    c.queue([
                        {
                            uri: ilbe_url + toQueueUrl,
                            forceUTF8: true,
                            // The global callback won't be called
                            callback: function (error, result, $) {
                                console.log('Grabbed', result.body.length, 'bytes');

                                var filename = result.uri.substr(result.uri.lastIndexOf('/') + 1);
                                if (result.body) {
                                    var text = extractIlbeText(result.body, filename, $);

                                    console.log(filename, text);
                                    fs.writeFile("/tmp/trendUrl/" + filename, text, {encoding: "UTF-8"}, function (err) {

                                        if (err) {
                                            return console.log(err);
                                        }

                                        console.log("The file was saved!");
                                    });
                                }
                                sleep.sleep(1);
                            }
                        }
                    ]);
                }
            });
        }
    },
    onDrain: function () {
        number += 1;
        console.log("finish work and run again");
        sleep.sleep(5);
        c.queue("http://www.ilbe.com?v=" + number);
    }
});


// Queue just one URL, with default callback
c.queue("http://www.ilbe.com");

function extractIlbeText(html, id, $) {
    var contentBody = $(html).find(
            '.title > h1 > a, ' +
            '.document_' + id + ' p, ' +
            '.document_' + id + ' div, ' +
            '.document_' + id + ' span, ' +
            '.document_' + id + ' strong');
    var text = '';
    for (i in contentBody) {
        var p = contentBody[i];
        if (p.children) {
            for (j in p.children) {
                if (p.children[j].data && p.children[j].type != "comment")
                    text += p.children[j].data.trim() + '\n';
            }
        }
    }
    return text;
}

function isInteger(nVal) {
    return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
}