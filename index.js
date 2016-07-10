var fs = require('fs');
var path = require('path');

var Lisplate = require('lisplate');
var cache = {};

var engineOptions = {};

function tryLoadingStrings(stringsPath, langs, done) {
  var filepath = stringsPath;
  if (langs && langs.length) {
    filepath += '__' + langs.pop();
  }
  filepath += '.json';

  fs.readFile(filepath, 'utf-8', function(err, json) {
    if (err) {
      if (langs) {
        tryLoadingStrings(stringsPath, langs, done);
      } else {
        done();
      }
      return;
    }

    done(null, JSON.parse(json));
  });
}

function makeEngine(options, data) {
  var viewModelLoader = null;
  var stringsLoader = null;

  if (options.viewModelDirectory) {
    if (typeof options.viewModelDirectory === 'function') {
      viewModelLoader = options.viewModelDirectory;
    } else {
      viewModelLoader = function(templatePath) {
        var filepath = path.resolve(options.viewModelDirectory, templatePath + '.js');
        var viewmodel = null;

        try {
          viewmodel = require(filepath);
        } catch (e) {
        }

        return viewmodel;
      };
    }
  }

  if (options.stringsDirectory) {
    if (typeof options.stringsDirectory === 'function') {
      stringsLoader = options.stringsDirectory;
    } else {
      stringsLoader = function(templatePath, callback) {
        var filepath = path.resolve(options.stringsDirectory, templatePath);
        tryLoadingStrings(filepath, data._locals.$_langs, callback);
      };
    }
  }

  return new Lisplate({
    sourceLoader: function(templatePath, callback) {
      if (path.extname(templatePath) === '') {
        templatePath = templatePath + '.' + options.ext;
      }

      if (templatePath[0] !== '/') {
        templatePath = options.viewDirectory + '/' + templatePath;
      }

      fs.readFile(templatePath, 'utf-8', callback);
    },

    viewModelLoader: viewModelLoader,
    stringsLoader: stringsLoader
  });
}

function render(filepath, options, done) {
  var ext = 'ltml';
  var viewDirectory = '.';

  var templateName = (this ? this.name : null) || filepath;

  if (options) {
    if (options.ext) {
      ext = options.ext;
    }
    if (options.views) {
      viewDirectory = options.views;
    }
    if (options.settings && options.settings.views) {
      viewDirectory = options.settings.views;
    }

    // if (options.cache === false) {
    //   engine.cache = {};
    // }
  }

  var engine = makeEngine({
    ext: ext,
    viewDirectory: viewDirectory,
    viewModelDirectory: engineOptions.viewModelDirectory,
    stringsDirectory: engineOptions.stringsDirectory
  }, options);

  var toRender = templateName;
  if (cache[templateName]) {
    toRender = {templateName: templateName, renderFactory: cache[templateName]};
  }

  engine.renderTemplate(toRender, options, function(err, out) {
    if (err) {
      done(err);
      return;
    }

    cache[templateName] = engine.cache[templateName];
    done(null, out);
  });
}

module.exports = function(options) {
  if (options) {
    if (options.viewModelDirectory) {
      engineOptions.viewModelDirectory = options.viewModelDirectory;
    }
    if (options.stringsDirectory) {
      engineOptions.stringsDirectory = options.stringsDirectory;
    }
  }

  return render;
};

module.exports.localizationInit = function(req, res, next) {
  var languages = req.headers['accept-language'];
  if (languages) {
    languages = languages.split(',');

    var scores = {};
    languages = languages.map(function(langInfo) {
      var parts = langInfo.split(';q=');
      var lang = parts[0];
      if (parts.length === 2) {
        scores[lang] = parseFloat(parts[1]) || 0.0;
      } else {
        scores[lang] = 1.0;
      }

      return lang;
    }).filter(function(lang) {
      return scores[lang] > 0.0;
    }).sort(function(a, b) {
      // sorted smallest first, to use pop from array
      return scores[a] < scores[b];
    });
  }

  req.langs = languages;
  res.locals.$_langs = languages;
  next();
};
