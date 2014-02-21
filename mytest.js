/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
"use strict";
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "deepjs/deep", "./node_modules/test/index"], function(require, deep, test)
{
	console.log("mytest get test : ", test);
	return test;
});





*** desk-xx

- index.js
	require("smart-invoices-srv")(myConfig);
	require("smart-clients-srv-xx")(myConfig);

+ ../translations (should be gitted and pushed automaticaly)
	+ xx-en.json

+ node_modules
		+ smart-invoices-srv
			- index.js
				require("./services | ./html")
			- statics.js
			- services.js
			- html.js

		+ smart-clients-srv-xx
			- index.js
				require("smart-clients/...")
			+ node_modules
				+ smart-clients
					- index.js
					- services
					- html

+ www
	+ app.js
		require("smart-invoices-view")(myConfig);
		require("smart-clients-view-xx")(myConfig);
	+ libs
		+ smart-invoices-view
			+ widgets
			+ templates
			- index.js    should return a function that take a optional config layer  + (merged with) load and use config file to construct himself
			- protocols.js
			- routes.js
			- config.js  -> put here the configuration files of your views/widgets/stores/... return the configuration object


		+ smart-clients-view
			- index.js
			- protocols.js
			- routes.js

		+ smart-clients-view-xx
			- index.js
			- protocols.js
			- routes.js

//________________________________________________________________

+ smart-invoice-xx
	+ node_modules
		+ smart-invoice
			+ server
				+ config   		-> put here config file of your statics/html/services
				- statics, html, services, index
			  		../browser -> /libs/smart-invoice

			+ browser
				+ widgets
				+ templates
				+ config        -> put here the configuration files of your views/widgets/stores/...
				- routes.js
				- protocols.js
				- index.js
					require("./routes | ./protocols")

	+ server
		- index.js
			require("smart-invoice/server/statics","smart-invoice/server/html","smart-invoice/server/services");
			statics
			  ../browser -> /libs/smart-invoice 
			  ../node_modules/smart-invoice/browser -> /libs/smart-invoice

			  ATTENTION : ca veut dire ne pas pouvoir séparer services et vue

			localisation.js
				deep-localisation.translators.invoice = new Translator(../translations, ../node_modules/smart-invoice/translations/xx-en.json)

	+translations     (should be gitted and pushed automaticaly)
		+ xx-en.json

	+ browser

		-> should be empty : 
			if we put a file named index.js it will hide the other one.
				but	require("./routes | ./protocols")
				stills valid

du browser : 

	require("smart-invoice/index")


//_________________________________________________________________________________________________


//________________________________________________________________________________________________

	TRANSLATION : 


	middleware autobahn.language 
		-> set language in deep.context


	middleware deep-localisation.translate 
		-> check if uri start with /translate/
		-> take second url part to find  associate store in its 'translators' namespace 	

			-> if found : use it to get or patch datas
				-> check if datas exists before patch 
					-> post it if not there

				-> should manage default language (aka en-en.json)
					on get 
					-> try to fetch datas :
						if not : take default datas



==> the translator store founded by translate middleware are just a store a so could be of any kind

	==> here we will use a particular node.fs.Object manager that will manage a single file by language


autobahn.language -> deep-localisation.translate -> multi node.fs.Object manager -> node.fs.Object store -> somewhere/translations/invoice/xx-ln.json


