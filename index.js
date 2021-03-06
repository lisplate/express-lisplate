var fs = require('fs');
var path = require('path');

var Lisplate = require('lisplate');

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
        tryLoadingStrings(stringsPath, langs.length ? langs : null, done);
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

  if (options.viewModelDirectory != null) {
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

  if (options.stringsDirectory != null) {
    if (typeof options.stringsDirectory === 'function') {
      stringsLoader = options.stringsDirectory;
    } else {
      stringsLoader = function(templatePath, renderContext, callback) {
        var filepath = path.resolve(options.stringsDirectory, templatePath);
        tryLoadingStrings(filepath, renderContext.languages.slice(), callback);
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
    stringsLoader: stringsLoader,
    cacheEnabled: options.shouldCache
  });
}

function render(filepath, options, done) {
  var ext = 'ltml';
  var viewDirectory = '.';
  var shouldCache = false;

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

    if (options.cache === true) {
      shouldCache = true;
    }
  }

  var engine = makeEngine({
    ext: ext,
    shouldCache: shouldCache,
    viewDirectory: viewDirectory,
    viewModelDirectory: engineOptions.viewModelDirectory,
    stringsDirectory: engineOptions.stringsDirectory
  }, options);

  engine.renderTemplate(templateName, options, options.$_renderContext, done);
}

module.exports = function(options) {
  if (options) {
    engineOptions.viewModelDirectory = options.viewModelDirectory;
    engineOptions.stringsDirectory = options.stringsDirectory;
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

  if (!res.locals.$_renderContext) {
    res.locals.$_renderContext = {};
  }
  res.locals.$_renderContext.languages = languages;
  next();
};
