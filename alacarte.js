/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
 
if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require"], function AlaCarteDefine(require){
	var alacarte = deep.compose.Classes(function(){

	},{
		register:function(entryOptions){
			/*
				{
					renderable:{
						view:{
							how:function(input){
								return input;
							},
							done:function(where, how, what)
							{
								
							}
						},
						edit:{
							
						}
					},
					schema:{
						
					}
				}
			*/
		}
	});
	return alacarte;
});