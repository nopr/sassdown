/*
* sassdown
* github.com/nopr/sassdown
*
* Copyright (c) 2013 Jesper Hills, contributors
* Some rights reserved
*/

'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
            ],
            options: {
                jshintrc: '.jshintrc',
            },
        },

        test: 'xxx',

        // Before generating any new files, remove any previously-created files.
        clean: {
            example: ['test/*/styleguide/'],
        },

        // Configuration to be run (and then tested).
        sassdown: {
            defaultStyleguide: {
                options: {
                    assets: [
                        'test/example/assets/css/*.css',
                        'test/example/assets/js/*.js'
                    ]
                    //theme: 'test/theme.css',
                    //template: 'test/template.hbs'
                },
                files: [{
                    expand: true,
                    cwd: 'test/example/assets/sass/partials',
                    src: ['**/*.{scss,sass}'],
                    dest: 'test/example/styleguide/'
                }]
            },
            customStyleguide: {
                options: {
                    assets: [
                        'test/custom/assets/css/*.css'
                    ],
                    excludeMissing: true,
                    readme: false,
                    commentStart: /\/\* (?:[=]{4,}\n[ ]+|(?!\n))/,
                    commentEnd: /[ ]+[=]{4,} \*\//
                },
                files: [{
                    expand: true,
                    cwd: 'test/custom/assets/sass',
                    src: ['**/*.sass'],
                    dest: 'test/custom/styleguide/'
                }]
            }

        },

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['clean', 'jshint', 'sassdown']);

};
