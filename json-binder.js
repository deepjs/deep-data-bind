if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(["require","deepjs/deep"], function(require, deep){

		function editInPlaceBlur(clicked, prop)
		{
			var self = this;
			$(clicked).empty();
			var input = prop.input = $(self.createInputHtml(prop)).appendTo(clicked);

			$(clicked).find(".property-input:first")
			.blur(function (argument) {
				//console.log("BLURR property value input : ", self);
				var change = prop.change($(this).val());
				var me = this;
				deep.when(change)
				.done(function(change){
					if(change instanceof Error)
						return $(me).focus();
					if(prop.value === "")
						$(clicked).html("&nbsp;");
					else
						$(clicked).text(prop.value);
					prop.input = null;
					if(change === true)
						self.hasChange(prop);
				});
			})
			.focus()
			.mousedown(function (e) {
				e.stopPropagation();
				//console.log("input clicked")
			})
			.keydown(function(event){
				//console.log("keydown : code : ", event.keyCode);
				if (event.keyCode == 27)
				{
					prop.input = null;
					$(clicked).text(prop.value);
					prop.hideError();
					return;
				}
				if (event.keyCode == 13)
					$(this).blur();
			});
		}

		var JsonEditorController = function(){};

		JsonEditorController.prototype = {
			templates:{
				inputText:"swig::/libs/deep-data-bind/json-editor/input-text.html",
				node:"swig::/libs/deep-data-bind/json-editor/node.html",
				item:"swig::/libs/deep-data-bind/json-editor/item.html"
			},
			editKeyAccess:true,
			editValueInPlace:function(selector, prop){
				//console.log("edit value inplace : ", selector,  prop);
				var othis = this;
				$(selector).mousedown(function (e) {
					//console.log("Click on property value : ", this.propertyInfo);
					e.preventDefault();
					if(!prop.input)
						editInPlaceBlur.apply(othis, [this, prop]);
					else
						$(this).find(".property-input:first").blur();
				});
			},
			editKeyInPlace:function(selector, prop){
				var othis = this;
				$(selector).mousedown(function (e) {
					//console.log("Click on property value : ", $(this).text());
					e.preventDefault();
					var prop2 = {
						schema:{ type:"string" },
						path:prop.path,
						key:prop.key,
						value:prop.key
					};
					editInPlaceBlur.apply(othis, [this, prop2]);
				});
			},
			createInputHtml : function(prop){
				var r = this.templates.inputText(prop);
				//console.log("input created : ",r);
				return r;
			},
			createPropertyHtml : function(prop){
				return this.templates.item(prop);
			},
			createObjectNodeHtml : function(prop){
				return this.templates.node(prop);
			},
			createArrayNodeHtml : function(prop){
				return this.templates.node(prop);
			},
			createHiddenPropertyHtml : function(prop){
				return this.templates.item(prop);
			},
			placeEntries : function(object, parentSelector, parentProp)
			{
				var othis = this;
				//console.log("placeEntries : object =", object, " parentSelector = ", parentSelector);
				var properties = [];
				for (var i in object)
				{
					if(!object.hasOwnProperty(i))
						continue;
					properties.push({key:i,value:object[i] /* ,path:"", type:"array|object|pritmive", rootSchema, schema, appended, showError:Func, hideError:Func, change:Func */});
				}
				properties.forEach(function (prop)
				{
					othis.currentPath.push(prop.key);
					prop.path = othis.currentPath.join(".");
	
					if(prop.value instanceof Array)
						prop.type = 'array';
					else if(typeof prop.value === 'object')
						prop.type = 'object';
					else
						prop.type = 'primitive';
					prop.rootSchema = othis.schema;
					if(othis.schema)
						prop.schema = deep.utils.retrieveSchemaByPath(othis.schema, prop.path, ".");
					//console.log("property schema : ", prop.schema);
					var appended = null;
					if(prop.path != "id")
						switch(prop.type)
						{
							case 'array' :
								// create node array
								appended = $(othis.createArrayNodeHtml(prop)).appendTo(parentSelector);
								if(othis.editKeyAccess && (!parentProp || parentProp.type != 'array'))
									othis.editKeyInPlace($(appended).find(".property-key:first"), prop);
								othis.placeEntries(prop.value, $(appended).find(".property-childs:first"), prop);
								break;
							case 'object' :
								// create node object
								appended = $(othis.createObjectNodeHtml(prop)).appendTo(parentSelector);
								if(othis.editKeyAccess && (!parentProp || parentProp.type != 'array'))
									othis.editKeyInPlace($(appended).find(".property-key:first"), prop);
								othis.placeEntries(prop.value, $(appended).find(".property-childs:first"), prop);
								break;
							default :
								// all other are editable datas
								appended = $(othis.createPropertyHtml(prop)).appendTo(parentSelector);
								othis.editValueInPlace($(appended).find(".property-value:first"), prop);
								if(othis.editKeyAccess && (!parentProp || parentProp.type != 'array'))
									othis.editKeyInPlace($(appended).find(".property-key:first"), prop);
						}
					else
						appended = $(othis.createHiddenPropertyHtml(prop)).appendTo(parentSelector).css("display", "none");
					othis.currentPath.pop();
					prop.appended = appended;
					prop.showError = function(errors){
						//console.log("property .error : ", errors);
						this.errors = errors;
						var errorsString = "";
						errors.forEach(function(e){
							errorsString += e.detail;
						});
						if(!this.errorNode)
							this.errorNode = $('<span class="property-error label label-important">'+errorsString+"</span>").appendTo(this.appended);
						else
							this.errorNode.text(errorsString);
					};
					prop.hideError = function(){
						if(this.errorNode)
						{
							this.errorNode.remove();
							delete this.errorNode;
							delete this.errors;
						}
					};
					prop.change = function(newValue)
					{
						if(this.schema)
							newValue = deep.Validator.castAndCheck(newValue, this.schema, this.path);

						if(newValue instanceof Error)
						{
							this.showError(newValue.report.errorsMap[this.path].errors);
							return newValue;
						}
						else
						{
							this.hideError();
							if(newValue === this.value)
								return false;
							this.value = newValue;
							return true;
						}
					};
					appended.each(function(){
						this.propertyInfo = prop;
					});
				});
			},
			delegateHasChange:function(controller, propertyInfo){
				console.log("DEFAULT DELEGATE NOT BINDED : json-editor.delegateHasChange : ",propertyInfo);
			},
			hasChange:function(propertyInfo){
				//this.createOutput();
				this.delegateHasChange(this, propertyInfo);
			}
		};

		deep.ui = deep.ui || {};

		deep.ui.JSONBinder = JsonEditorController;

		deep.ui.toJSONBind= function(json, selector, schema, options)
		{
			options = options || {};
			var alls = [];
			var editor = new JsonEditorController();
			if(options.delegate)
				editor.delegateHasChange = options.delegate;
			var templates = options.templates || editor.templates;
			alls.push(deep(templates)
			.query(".//*?_schema.type=string")
			.load(null, true));
			alls.push(deep.when(deep.get(json)));
			if(schema)
				alls.push(deep.when(deep.get(schema)));
			return deep(deep.all(alls)
			.done(function (loaded) {
				loaded.shift();
				editor.currentPath = [];
				editor.json = loaded.shift();
				if(schema)
					editor.schema = loaded.shift();
				if(templates)
					editor.templates = templates;
				editor.editKeyAccess = options.editKey;
				$(selector).empty();
				editor.placeEntries(editor.json, selector, null);
				return editor;
			}));
		};
		deep.ui.fromJSONBind = function(selector, schema)
		{
			var output = {};
			var stack =  [output];
			var rootSchema = null;
			var errors = [];
			//console.log("fromEditable html : try: ", selector + " *[property-type]");
			var allNodes = $(selector).find(" *[json-property]").each(function()
			{
				var infos = this.propertyInfo;
				if(infos.errorNode)
					errors = errors.concat(infos.errors);
				//console.log("fromEditable html : each proprty : ", infos);
				deep.utils.setValueByPath(output, infos.path, infos.value, ".");
				rootSchema = infos.rootSchema;
			});
			if(errors.length > 0)
				return deep.when(deep.errors.PreconditionFail("deep.ui.fromJSONBind output missformed.", { errors:errors, schema:schema }));
			//console.log("created output : ", output);
			schema = rootSchema || schema;

			if(schema)
			{
				var report = deep.validate(output, schema);
				if(!report.valid)
				{
					allNodes.each(function()
					{
						var infos = this.propertyInfo;
						//console.log("fromJSONBind : error report : ",infos, report.errorsMap[infos.path]);
						if(report.errorsMap[infos.path])
							infos.showError(report.errorsMap[infos.path].errors);
					});
					return deep.when(deep.errors.PreconditionFail("deep.ui.fromJSONBind output missformed.", report));
				}
			}
			return deep.when(output);
		};

		//_____________________________________________ SIMPLE BINDERS

		deep.ui.createBindedProp = function(path){
			var request = deep.utils.parseRequest(path);
			//console.log("parsed request for prop : ", request);
			var splitted = request.uri.split("/");
			if(splitted[0] === "")
				splitted.shift();
			var prop = {
				request:request,
				objectID:splitted.shift(),
				key:splitted[splitted.length-1],
				value:null,
				path:splitted.join("/"),
				type:null,
				rootSchema:null,
				schema:{},
				appended:null,
				basePath:path
			};
			//console.log("will init prop : ", prop);
			prop.objectPath = request.protocol+"::"+prop.objectID;
			prop.rootSchemaPath = request.protocol+"::schema";
			if(prop.value instanceof Array)
				prop.type = 'array';
			else if(typeof prop.value === 'object')
				prop.type = 'object';
			else
				prop.type = 'primitive';

			prop.showError = function(errors){
				//console.log("property .error : ", errors);
				this.errors = errors;
				var errorsString = "";
				if(errors && errors.forEach)
					errors.forEach(function(e){
						//console.log("property .error foreach : ", e);
						errorsString += e.detail;
					});
				//console.log("this.errorNode : ", this.appended);

				if(!this.errorNode)
				{
					var tagName = $(this.appended).get(0).tagName.toLowerCase();
					if(tagName == "input" || tagName == "text-area" || tagName == "selection")
						this.errorNode = $(this.appended).after('<span class="property-error label label-important">'+errorsString+"</span>").next();
					else
						this.errorNode = $('<span class="property-error label label-important">'+errorsString+"</span>").appendTo(this.appended);
				}
				else
					this.errorNode.text(errorsString);
			};

			prop.hideError = function(){
				if(this.errorNode)
				{
					this.errorNode.remove();
					delete this.errorNode;
					delete this.errors;
				}
			};

			prop.load = function(){
				//console.log("prop.load :  ", prop);
				var self = this;
				return deep.getAll([this.objectPath, this.rootSchemaPath])
				.done(function(success){
					console.log("property loaded : ",success, self.path, "/")
					self.value = deep.utils.retrieveValueByPath(success.shift(), self.path, "/");
					self.rootSchema = success.shift() || {};
					self.schema = deep.utils.retrieveSchemaByPath(self.rootSchema, self.path, "/");
					return self;
				});
			};

			prop.change = function(newValue)
			{
				var self = this;
				if(self.schema)
					newValue = deep.Validator.castAndCheck(newValue, self.schema, self.path);

				if(newValue instanceof Error)
				{
					self.showError(newValue.report.errorsMap[self.path].errors);
					return newValue;
				}
				else
				{
					self.hideError();
					if(newValue === self.value)
						return false;
					self.value = newValue;
					return true;
				}
			};

			prop.save = function(){
				var obj = { id:this.objectID };
				deep.utils.setValueByPath(obj, this.path, this.value, "/");
				return deep.store(this.request.protocol).patch(obj);
			};

			return prop;
		};

		deep.ui.binded = {};
		(function( $ ) {
		var oldClean = jQuery.cleanData;
		$.cleanData = function( elems ) {
			for ( var i = 0, elem;
			(elem = elems[i]) !== undefined; i++ ) {
				$(elem).triggerHandler("destroyed");
				//$.event.remove( elem, 'destroyed' );
			}
			oldClean(elems);
		};
		})(jQuery);

		deep.ui.bind = function(selector, path, options)
		{
			options = options || {};
			var prop = deep.ui.createBindedProp(path);
			prop.value = $(selector).html();
			//console.log("bind : ", prop);
			prop.update = function(newValue){
				prop.value = newValue;
				$(selector).html(newValue);
			};
			if(typeof options.directPatch === 'undefined')
				options.directPatch = true;
			var minieditor = {
				template:"swig::/libs/deep-data-bind/json-editor/input-text.html",
				createInputHtml : function(prop){
					return this.template(prop);
				},
				hasChange:function(prop){
					if(options.directPatch)
						return prop.save()
						.done(function(success){
							deep.ui.bind.update(prop);
							if(options.callback)
								options.callback(prop);
						});
					deep.ui.bind.update(prop);
					if(options.callback)
						options.callback(prop);
				}
			};
			//console.log("bind will load : ", minieditor.externals);
			return deep.getAll([minieditor.template, prop.load()])
			.done(function(success){
				minieditor.template = success.shift();
				//prop = success.shift();
				deep.ui.binded[path] = deep.ui.binded[path] || [];
				deep.ui.binded[path].push(prop);
				$(selector)
				.html(prop.value)
				.each(function(){
					prop.appended = this;
					this.propertyInfo = prop;
					prop.bindID = Date.now().valueOf();
				})
				.on("destroyed", function(){
					deep.utils.remove(deep.ui.binded[path], './*?bindID='+prop.bindID);
					if(deep.ui.binded[path].length === 0)
						delete deep.ui.binded[path];
				})
				.mousedown(function(e){
					e.stopPropagation();
					e.preventDefault();
					if(!prop.input)
						editInPlaceBlur.apply(minieditor, [this, prop]);
					else
						$(this).find(".property-input:first").blur();
				});
				return prop.value;
			});
		};

		deep.ui.bindInput = function(selector, path, options)
		{
			options = options || {};
			var descriptor = {
				selector:selector,
				path:path,
				options:options,
				error:null,
				valid:function(){
					if(!this.prop)
						return false;
					return (!this.prop.errors || this.prop.errors.length === 0);
				},
				value:function(){
					if(!this.prop || !this.valid())
						return null;
					return this.prop.value;
				}
			};
			var prop = descriptor.prop = deep.ui.createBindedProp(path);
			// console.log("bindInput : ", prop);
			if(typeof options.directPatch === 'undefined')
				options.directPatch = true;
			function hasChange(prop){
				if(options.directPatch)
					return prop.save()
					.done(function(success){
						deep.ui.bind.update(prop);
						if(options.callback)
							options.callback(prop);
					});
				deep.ui.bind.update(prop);
				if(options.callback)
					options.callback(prop);
			}
			prop.update = function(newValue){
				prop.value = newValue;
				$(selector).val(newValue);
			};

			// console.log("prop will load");
			descriptor.promise = deep.when(prop.load())
			.done(function(prop){
				//console.log("INPUT binding prop loaded : ", prop);
				deep.ui.binded[path] = deep.ui.binded[path] || [];
				deep.ui.binded[path].push(prop);
				$(selector)
				.val(prop.value)
				.each(function(){
					if(prop.schema && prop.schema.description)
						$(this).attr("placeholder", prop.schema.description);
					prop.appended = this;
					this.propertyInfo = prop;
					prop.bindID = Date.now().valueOf();
				})
				.on("destroyed", function(){
					deep.utils.remove(deep.ui.binded[path], './*?bindID='+prop.bindID);
					if(deep.ui.binded[path].length === 0)
						delete deep.ui.binded[path];
				})
				.blur(function (event) {
					var self = this;
					deep.when(prop.change($(this).val()))
					.done(function(change){
						if(change instanceof Error)
							return $(self).focus();
						if(change === true)
							hasChange(prop);
					});
				})
				.keydown(function (event){
					if (event.keyCode == 27)
					{
						$(input).val(prop.value).blur();
						return;
					}
					if (event.keyCode == 13)
						$(this).blur();
				});
			})
			.fail(function(e){
				descriptor.error = e;
				return deep.errors.Error("error while binding : ", { error:e, descriptor:descriptor });
			});
			return descriptor;
		};

		deep.ui.bind.update = function(prop)
		{
			if(deep.ui.binded[prop.basePath])
				deep.ui.binded[prop.basePath].forEach(function(p){
					if(p.bindID != prop.bindID)
						p.update(prop.value);
				});
		};

		deep.ui.bindForm = function(selector, options){
			$(selector)
			.find("*[data-bind]")
			.each(function(e){
				var path = $(e).attr("data-bind");
				switch(e.tagName.toLowerCase())
				{
					case "input" :
					case "textarea" :
						deep.ui.bindInput(e, path, options);
						break;
					default :
						deep.ui.bind(e, path, options);
				}
			});
		};

		deep.ui.fromBind = function(selector, saveType)
		{
			var objects = {}, errors = [], promises = [];
			$(selector)
			.find("*[data-bind]")
			.each(function(e){

				function checkErrors(prop){
					if(prop.errors && prop.errors.length > 0)
					{
						errors = errors.concat(prop.errors);
						return true;	// continue
					}
					var cur = objects[prop.objectPath] = objects[prop.objectPath] || {};
					deep.utils.setValueByPath(cur, prop.path, prop.value, '/');
				}

				var prop = e.propertyInfo;
				if(!prop)
				{
					var path = $(e).attr("data-bind");
					prop = deep.ui.createBindedProp(path);
					var d = deep.when(prop.load())
					.done(function(){
						var val = null;
						switch(e.tagName.toLowerCase())
						{
							case "input" :
							case "textarea" :
								val = $(e).val();
								break;
							default :
								val = $(e).html();
						}
						prop.change(val);
						checkErrors(prop);
					});
					return promises.push(d);	// continue;
				}
				else checkErrors(prop);
			});

			function saveAll(){
				if(errors.length > 0)
					return deep.when(deep.errors.PreconditionFail("from bind failed : still errors.", errors));

				if(!saveType)
					return deep.when(objects);

				// save all
				var alls = [];
				for(var i in objects)
				{
					var d = deep.store(prop.request.protocol)[saveType](objects[i], { id:prop.objectID });
					alls.push(d);
				}

				return deep.all(alls)
				.done(function(success){
					if(success.length ==  1)
						return success.shift();
				});
			}

			if(promises.length > 0)
				return deep.all(promises)
				.done(function(success){
					return saveAll();
				});
			return saveAll();
		};

		deep.utils.up({
			propertyBind: function (descriptor) {
				descriptor.placed
				.find("div[property-bind]") // <div  data-bind="mp3::id/meta/artist" />
				.each(function() {
					//console.log("Binding property : ", $(this).attr("property-bind"));
					// apply bind
					// check if edit-on-click attr
					// check any schema related attrs
					deep.ui.bind(this, $(this).attr("property-bind"), {
						directPatch: true,
						callback: null
					});
				});
			},
			inputBind: function (descriptor) {
				descriptor.placed
				.find("input[input-bind]") // <div  data-bind="mp3::id/meta/artist" />
				.each(function() {
					//console.log("Binding input : ", $(this).attr("input-bind"));
					// apply bind
					// check if edit-on-click attr
					// check any schema related attrs
					deep.ui.bindInput(this, $(this).attr("input-bind"), {
						directPatch: true,
						callback: null
					});
				});
			},
			objectBind: function (descriptor) {
				var schema ={};
				descriptor.placed
				.find("div[object-bind]") // <div  object-bind="mp3::id" schema:"jsion::",  maxLength="12"> 
				.each(function() {
					var self = this;
					console.log("Binding object : ", $(this).attr("object-bind"));
					var uri = $(this).attr("object-bind");
					var request = deep.utils.parseRequest(uri);
					var schemapath = request.protocol+"::schema";
			
					// apply bind
					deep.getAll([uri,schemapath]).done(function (res) {
						deep.ui.toJSONBind(res[0], self, res[1] || {});
					});
				});
			}			
		},deep.ui.View.htmlEnhancers);

		return JsonEditorController;
});



