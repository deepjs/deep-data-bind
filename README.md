# deep-data-bind

json oriented ui data binder for deepjs.

## usage

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

## Todo

* schema management on both 'to' and 'from' functions : done !
* store link pattern : done !
* debug editLKey : false : done !
* add single dom element editable in place : editInPlace("selector to editable", "protocole::id/path/to/var", schema,  { delegate:function(){} } ) function
* add single input binding : bindInput("input selector", "protoc::id/pathto/var", schema, { delegate:function(){} } ) function


