var system = require('system');
var page = require('webpage').create();
var fs = require('fs');

if (system.args.length === 3) {
	console.log('Usage: snap.js <some URL> <view port width> <target image name>');
	phantom.exit();
}

var url = system.args[1];
var image_name = system.args[3];
var view_port_width = system.args[2];
var current_requests = 0;
var last_request_timeout;
var final_timeout;


page.viewportSize = { width: view_port_width, height: 1500};
page.settings = { loadImages: true, javascriptEnabled: true };

// If you want to use additional phantomjs commands, place them here
page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.17';

// You can place custom headers here, example below.
// page.customHeaders = {

//      'X-Candy-OVERRIDE': 'https://api.live.bbc.co.uk/'

//  };

// If you want to set a cookie, just add your details below in the following way.

// phantom.addCookie({
//     'name': 'ckns_policy',
//     'value': '111',
//     'domain': '.bbc.co.uk'
// });
// phantom.addCookie({
//     'name': 'locserv',
//     'value': '1#l1#i=6691484:n=Oxford+Circus:h=e@w1#i=8:p=London@d1#1=l:2=e:3=e:4=2@n1#r=40',
//     'domain': '.bbc.co.uk'
// });

page.onResourceRequested = function (req) {
	current_requests += 1;
};

page.onResourceReceived = function (res) {
	if (res.stage === 'end') {
		current_requests -= 1;
		debounced_render();
	}
};

page.open(url, function (status) {
	if (status !== 'success') {
		console.log('Error with page ' + url);
		phantom.exit();
	}
});

function page_render() {
	console.log('Rendering....');
	var ret = page.evaluate(function () {

		
		var removeAll = function(elements) {
		        for (i = 0; i < elements.length; i++) {
		                elements[i].innerHTML = "";
		        }
		}


		window.localStorage.setItem('gu.prefs.messages', '{"value":["alpha"]}');

		var adDivs = document.getElementsByClassName('ad-slot');

		for (i = 0; i < adDivs.length; i++) {
			var node = adDivs[i];
			var imgUrl = 'http://placehold.it/' + node.offsetWidth + 'x' + node.offsetHeight;
			var img = document.createElement("img");
			img.src = imgUrl;
			img.width = node.offsetWidth
			img.height = node.offsetHeight


			while (node.hasChildNodes()) {
				node.removeChild(node.firstChild);
			}

			node.appendChild(img);

		}

		var adLabels = document.getElementsByClassName("ad-slot__label");
		removeAll(adLabels);

		var comments = document.getElementById("comments");
		comments.parentNode.removeChild(comments);

		var commentCounters = document.getElementsByClassName("trail__count--commentcount");
		removeAll(commentCounters);

		return "";
	});
	console.log('ret value was: ' + ret);

	page.render(image_name);
}


function debounced_render() {
	clearTimeout(last_request_timeout);
	clearTimeout(final_timeout);

	// If there's no more ongoing resource requests, wait for 1 second before
	// rendering, just in case the page kicks off another request
	if (current_requests < 1) {
		clearTimeout(final_timeout);
		last_request_timeout = setTimeout(function () {
			console.log('Snapping ' + url + ' at width ' + view_port_width);
			//page.render(image_name);
			page_render();
			phantom.exit();
		}, 1000);
	}

	// Sometimes, straggling requests never make it back, in which
	// case, timeout after 5 seconds and render the page anyway
	final_timeout = setTimeout(function () {
		console.log('Snapping ' + url + ' at width ' + view_port_width);
		//page.render(image_name);
		page_render();
		phantom.exit();
	}, 5000);
}

