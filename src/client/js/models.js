'use strict';

var Backbone = require('backbone');


exports.Notepad = Backbone.Model.extend({
  defaults: {
    content: ''
  },

  initialize: function () {
    this.on('error', function () {
      throw new Error(JSON.stringify([].slice.call(arguments)));
    });
  },

  sync: function (method, model) {
    if (method == 'read') {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
          model.set('content', this.responseText);
        }
      };
      xhr.open('GET', '/content');
      xhr.send();
    }
    else if (method == 'create' || method == 'update') {
      var request;
      var xhr = new XMLHttpRequest();

      if (model.get('revert')) {
        request = JSON.stringify({
          action: 'revert'
        });

        xhr.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status != 200) {
              model.trigger('error', 'Status ' + this.status);
              return;
            }

            model.set('content', this.responseText);
          }
        };
      }
      else {
        request = JSON.stringify({
          action: 'commit',
          content: model.get('content')
        });

        xhr.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status != 200) {
              model.trigger('error', 'Status ' + this.status);
            }
          }
        };
      }

      xhr.open('POST', '/content');
      xhr.send(request);
    }
    else {
      model.trigger('error', 'Invalid sync method: ' + method);
    }
  }
});