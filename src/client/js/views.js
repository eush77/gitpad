'use strict';

var Notepad = require('./models').Notepad;

var Backbone = require('backbone');


var NotepadView = Backbone.View.extend({
  Model: Notepad,
  el: '#notepad',

  initialize: function () {
    this.$editor = this.$('.notepad');

    this.model.fetch();
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    var content = this.model.get('content');
    this.$editor.val(content);
  },

  events: {
    'input .notepad': 'input',
    'click .commit': 'commit',
    'click .revert': 'revert'
  },

  input: function () {
    this.model.set('content', this.$editor.val());
  },

  commit: function () {
    this.model.set('revert', false);
    this.model.save();
  },

  revert: function () {
    this.model.set('revert', true);
    this.model.save();
  }
});


exports.AppView = Backbone.View.extend({
  initialize: function () {
    this.notepadView = new NotepadView({
      model: new Notepad()
    });
  },

  render: function () {
    this.notepadView.render();
  }
});
