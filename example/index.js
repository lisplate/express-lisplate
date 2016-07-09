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

app.listen(3000, function() {
  console.log('Express app listening on port 3000');
});
