'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
    },
    regarde: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile'],
        spawn: true
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib'],
        spawn: true
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test'],
        spawn: true
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-regarde');

  // Default task.
  grunt.registerTask('default', ['jshint']);
};
