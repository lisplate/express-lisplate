var app = require('express')();

app.engine('ltml', require('../')({
  viewModelDirectory: './viewmodels',
  stringsDirectory: './strings'
}));
app.set('views', './views');
app.set('view engine', 'ltml');

app.use(require('../').localizationInit);

app.get('/', function(req, res) {
  res.render('helloworld');
});

app.get('/page', function(req, res) {
  res.render('this-page', {
    subheading: 'testing'
  });
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Express app listening on port ' + port);
});
