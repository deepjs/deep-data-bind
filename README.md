# deep-data-bind

json oriented ui data binder for deepjs.

## Simple usage

```javascript

deep("js::deep-data-bind/json-binder")
.done(function(binder){
    return deep.ui.toJSONBind(
        {
            hello:"world",
            other:{
                a:1,
                b:2
            },
            another:[
                "hi",
                "bye"
            ]
        }, 
        "#content",
        {}, 
        null, 
        false
    );
    
})
.log()
.done(function(){
    console.log("output : ", deep.ui.fromJSONBind("#content"));
});

```

## Example 2

```javascript

    
    var schema = {
        properties:{
            hello:{
                type:"string",
                description:"just a string.",
                minLength:2,
                "default":"world",
                required:true
            },
            title:{
                type:"string",
                description:"just a title.",
                required:false
            },
            obj:{
                properties:{
                    a:{ type:"number", required:true }
                }
            }
        }
    };
    // creating stores and protocols
    //deep.store.jqueryajax.JSON.createDefault();
    deep.protocols.swig.createDefault();
    deep.store.jstorage.Collection.create("myobjects", null, schema);

    var view = {
        refreshList : function(){
            return deep({
                template:"swig::/templates/list.html",
                context:{
                    items:"myobjects::?"
                }
            })
            .deepLoad()
            .done(function(obj){
                if(obj.context.items.length === 0)
                {
                    $("#items-list").html("");
                    return view.showForm();
                }
                $("#items-list")
                .html(obj.template(obj.context))
                .find(".item")
                .click(function(e){
                    e.preventDefault();
                    view.showForm($(this).attr("item-id"));
                });
            });
        },
        showForm : function(id)
        {
            var self = this;
            var obj = null;
            if(id)
            {
                $("#form-title").html("Edit : "+id);
                obj = "myobjects::"+id;
            }
            else
            {
                $("#form-title").html("Add");
                obj = deep.Validator.createDefault(schema);
            }
            return deep.get(obj)
            .done(function(object){
                return deep.ui.toJSONBind(object, "#item-form", schema, {
                    delegate:function(controller, property)
                    {
                        console.log("property changed : ", property);
                        if(id)
                            return self.save();
                    }
                });
            })
            .done(function(binder){
                if(!id)
                    $("<button>save</button>")
                    .appendTo("#item-form")
                    .click(function(e){
                        e.preventDefault();
                        self.save();
                    });
            });
        },
        save : function(){
            var self = this;
            return deep.ui.fromJSONBind("#item-form", schema)
            .done(function(output){
                var hasId = output.id;
                var d = deep.store("myobjects");
                if(hasId)
                    d.put(output);
                else
                    d.post(output);
                return d.done(function(success){
                    console.log("object saved : ", success);
                    if(!hasId) // we edit posted item only (puted item is already edited)
                        self.showForm(success.id);
                    self.refreshList();
                })
                .fail(function(e){
                    console.log("error while sending datas : ", e);
                });
            })
            .fail(function(e){
                console.log("error while collecting datas : ", e.status, e.report);
            });
        }
    };

    view.refreshList();
    $("<button>ADD</button>")
    .prependTo("#content")
    .click(function(e){
        e.preventDefault();
        view.showForm();
    });
    $("<button>Flush</button>")
    .prependTo("#content")
    .click(function(e){
        e.preventDefault();
        deep.protocols.myobjects.flush();
        view.refreshList();
    });


```

## Simples binds

```javascript

    var bindOptions = {
        callback:function(prop){
            list.refresh();
        },
        directPatch:true
    };

    // bind tag selector to a field in mp3 datas. (binded to the property /meta/artist from object 527a03....)
    // add in-place-edition capabilities to tag
    deep.ui.bind("#list-title", "mp3::527a03e0c9f5cf073d4d3570/meta/artist", bindOptions);

    // bind html input to a field in mp3 datas. (binded to the property /meta/year from object 527a03....)
    deep.ui.bindInput("#test-input", "mp3::527a03e0c9f5cf073d4d3570/meta/year", bindOptions);
    
```


See [deep-spa-sandbox](https://github.com/deepjs/deep-spa-sandbox) app controller for workable example.


