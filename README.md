# express-lisplate
LisplateJS bindings for Express render

## Installation
```sh
npm install express-lisplate
```

## Example Use
```js
var app = require('express')();

app.engine('ltml', require('express-lisplate')({
  viewModelDirectory: './viewmodels',
  stringsDirectory: './strings'
}));
app.set('views', './views');
app.set('view engine', 'ltml');

app.get('/', function(req, res) {
  res.render('helloworld');
});

app.listen(3000, function() {
  console.log('Express app listening on port 3000');
});
```
