if(typeof define !== 'function'){
	var define = require('amdefine')(module);
}

define(["require","deepjs/deep"], function(require, deep){

		function editInPlaceBlur(clicked, prop)
		{
			var self = this;
			$(clicked)
			.html(self.createInputHtml(prop))
			.find(".property-input:first")
			.blur(function (argument) {
				//console.log("BLURR property value input : ", self)
				var change = prop.change($(this).val());
				if(change instanceof Error)
					return $(this).focus();
				if(prop.value === "")
					$(clicked).html("&nbsp;");
				else
					$(clicked).text(prop.value);
				if(change === true)
					self.hasChange(prop);
			})
			.focus()
			.click(function (e) {
				e.stopPropagation();
			})
			.keydown(function(event){
				//console.log("keydown : code : ", event.keyCode);
				if (event.keyCode == 27)
				{
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
				$(selector).click(function (e) {
					//console.log("Click on property value : ", this.propertyInfo);
					e.preventDefault();
					editInPlaceBlur.apply(othis, [this, prop]);
				});
			},
			editKeyInPlace:function(selector, prop){
				var othis = this;
				$(selector).click(function (e) {
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
						console.log("fromJSONBind : error report : ",infos, report.errorsMap[infos.path]);
						if(report.errorsMap[infos.path])
							infos.showError(report.errorsMap[infos.path].errors);
					});
					return deep.when(deep.errors.PreconditionFail("deep.ui.fromJSONBind output missformed.", report));
				}
			}
			return deep.when(output);
		};

		deep.ui.bind = function(selector, path, rootSchema, directPatch, callBack)
		{
			var request = deep.parseRequest(path);
			var splitted = request.uri.split("/");

			if(typeof directPatch === 'undefined')
				directPatch = true;
			var prop = {
				request:request,
				objectID:splitted.shift(),
				key:splitted[splitted.length-1],
				value:$(selector).html(),
				path:splitted.join("/"),
				type:null,
				rootSchema:rootSchema,
				schema:{},
				appended:null
			};
			if(prop.value instanceof Array)
				prop.type = 'array';
			else if(typeof prop.value === 'object')
				prop.type = 'object';
			else
				prop.type = 'primitive';
			if(rootSchema)
				prop.schema = deep.utils.retrieveSchemaByPath(rootSchema, prop.path, "/");


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
			$(selector).each(function(){
				prop.appended = this;
				this.propertyInfo = prop;
			});

			var minieditor = {
				templates:{
					inputText:"swig::/libs/deep-data-bind/json-editor/input-text.html"
				},
				createInputHtml : function(prop){
					var r = this.templates.inputText(prop);
					//console.log("input created : ",r);
					return r;
				},
				hasChange:function(prop){
					if(directPatch)
					{
						var obj = { id:prop.objectID };
						deep.utils.setValueByPath(obj, prop.path, prop.value, "/");
						deep.store(prop.request.protocole).patch(obj)
						.done(function(success){
							if(callBack)
								callBack(prop);
						});
					}
					else if(callBack)
						callBack(prop);
				}
			};

			deep(minieditor).query("./templates").deepLoad(null, true);

			$(selector)
			.click(function(e){
				e.preventDefault();
				editInPlaceBlur.apply(minieditor, [this, prop]);
			});
		};
		deep.ui.bindInput = function(selector, path, schema)
		{
			$(selector)
			.blur(function(e){
				e.preventDefault();
			});
		};
		return JsonEditorController;


		/**
		 * todo : 
		 *
		 * on any rendered DOM node : 
		 * we must have a function that permit to editInPlace it and to bind it to an uri (maybe _id_/my/path) with a schema
		 * schema here is for partial validation in UI. entire validation is done in store
		 *      	
		 * 		    binder.bind(selector, schema, delegate)
		 *
		 * 		to edit entire json : 
		 * 			hold descriptive node in DOM elements
		 * 				schema, path etc
		 * 				for partial validation in UI
		 *
		 *			hold casted/checked value in this node
		 *
		 * 			AND entire schema in root node
		 * 				(full descriptive node)
		 *
		 *
		 * 		allow to add anywhere in rendered dom : any new json edition DOM element
		 *
		 *
		 * 		add in deep-schema : 
		 * 			.convertAndCheck( input, schema )
		 * 
		 */
});












