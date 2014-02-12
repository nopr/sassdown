/*
    sassdown
    github.com/nopr/sassdown
    ------------------------
    Copyright (c) 2013 Jesper Hills, contributors
    Some rights reserved
*/
'use strict';

// Exposed global objects
// ======================
var Sassdown, grunt;

// Required Node modules
// =====================
var fs = require('fs');
var junk = require('junk');
var path = require('path');
var hljs = require('highlight.js');
var cssmin = require('cssmin');
var markdown = require('marked');
var Handlebars = require('handlebars');

// Quick utility functions
// =======================
function warning   (message)  { return grunt.verbose.warn(message); }
function unspace   (string)   { return string.replace(/\r\n|\n| /g,''); }
function datapath  (filename) { return path.resolve(__dirname, '..', 'data', filename); }
function sourcify  (section, file) {
    return file.data.split(section)[1].split(Sassdown.config.option.commentStart)[0];
}
function normalize (comment) {
    comment = comment.replace(Sassdown.config.option.commentStart, '');
    comment = comment.replace(Sassdown.config.option.commentEnd, '');
    comment = comment.trim().replace(/^\*/, '').replace(/\n \* |\n \*|\n /g, '\n').replace(/\n   /g, '\n    ');
    if (!comment.match('```') && comment.match('    ')) {
        comment = comment.replace(/    |```\n    /, '```\n    ');
        comment = comment.replace(/\n    /g, '\n').replace(/\n /g, '\n');
        comment += '\n```';
    }
    return comment;
}
function hashString(string) {
    var result = 0,
        length = string.length;
    for (var i = 0; i < length; i++) {
        result = result * 31 + string.charCodeAt(i);
    }
    return result;
}

// Exported Sassdown methods
// =========================
module.exports.init = function (_grunt) {
    grunt = _grunt;
    Sassdown = this;
};

module.exports.template = function () {
    // Check for existence of user defined template
    Sassdown.checkfor('template', datapath('template.hbs'));
    // Return Sassdown.config.template object
    Sassdown.config.template = {
        html: Handlebars.compile(grunt.file.read(Sassdown.config.option.template)),
        assets: null
    };
};

module.exports.theme = function () {
    // Check for existence of user defined theme
    Sassdown.checkfor('theme', datapath('theme.css'));
    // Read file using grunt
    var minify = grunt.file.read(Sassdown.config.option.theme);
    // Assign theme to Handlebars partial; minify this
    Handlebars.registerPartial('theme', '<style>'+cssmin(minify)+'</style>');
};

module.exports.highlight = function () {
    // Check for existence of user defined highlight style
    Sassdown.checkfor('highlight', 'github');
    // Read file using grunt
    var minify = grunt.file.read(datapath('highlight.'+Sassdown.config.option.highlight+'.css'));
    // Assign highlight style to Handlebars partial; minify this
    Handlebars.registerPartial('highlight', '<style>'+cssmin(minify)+'</style>');
};

module.exports.checkfor = function (requirement, defaults) {
    // If the requirement isn't met
    if (!Sassdown.config.option[requirement]) {
        warning('User ' + requirement + ' not specified. Using default.');
        Sassdown.config.option[requirement] = defaults;
    }
};

module.exports.assets = function () {
    // Check if we added includes option
    if (!Sassdown.config.option.assets) {
        warning('User assets not specified. Styleguide will be unstyled!');
    } else {
        // Create empty array
        var fileList = [];
        // Expand through matches in options and include both
        // internal and external files into the array
        Sassdown.config.option.assets.forEach( function (asset) {
            grunt.file.expand(asset).forEach( function (file) {
                fileList.push(file);
                grunt.verbose.write(file+'...').ok();
            });
            if (asset.match('http://')) {
                fileList.push(asset);
                grunt.verbose.write(asset+'...').ok();
            }
        });
        // Insert as list of files as new assets object
        Sassdown.config.assets = fileList;
    }
};

module.exports.include = function (file, dest) {
    // Output
    var output;
    // If this file is not external, build a local relative path
    if (!file.match('http://')) { file = path.relative(dest, file); }
    // Preserve correct path escaping for <iframe> embedded url paths
    if (file.match(/\\/)) { file = file.replace(/\\/g, '/'); }
    // Write <link> or <script> tag to include it
    if (file.split('.').pop() === 'css') { output = '<link rel="stylesheet" href="'+file+'" />'; }
    if (file.split('.').pop() === 'js') { output = '<script src="'+file+'"><\\/script>'; }
    // Return
    return output;
};

module.exports.scaffold = function () {
    // Define a path to destination root
    Sassdown.config.root = Sassdown.config.files[0].orig.dest;
    // Create the destination directory
    grunt.file.mkdir(path.resolve(Sassdown.config.root));
};

module.exports.files = function () {
    // Pages object exposed
    Sassdown.pages = [];
    Sassdown.excluded = [];
    // Map files matched by Grunt task to Sassdown.pages
    Sassdown.config.files.forEach( function (file) {
        // Store file source within file
        file.data = grunt.file.read(file.src[0]);
        file.body = file.data.match(Sassdown.matching());
        // Store file data within a page
        var page = Sassdown.getData(file);
        // No matching data
        if (!file.body) {
            grunt.verbose.warn('Comment missing');
            grunt.verbose.or.warn('Comment missing: ' + file.src[0]);
            page.sections = null;
            // Check if we should be exluding this page now
            if (Sassdown.config.option.excludeMissing) {
                Sassdown.excluded.push(page.src);
                return false;
            }
        } else {
            // Found sections
            grunt.verbose.ok('Comment found');
            page.sections = Sassdown.getSections(file);
        }
        // No matching title
        if (!file.title) {
            grunt.verbose.warn('Heading missing');
            grunt.verbose.or.warn('Heading missing: ' + file.src[0]);
            page.title = page.slug;
        } else {
            grunt.verbose.ok('Heading found');
            page.title = file.title;
        }
        // Add to pages
        Sassdown.pages.push(page);
    });
};

module.exports.getData = function (file) {
    return {
        title: null,
        slug: path.basename(file.src, path.extname(file.src[0])),
        href: path.relative(Sassdown.config.root, file.dest.replace(path.extname(file.src[0]), '.html')),
        dest: file.dest.replace(path.extname(file.src[0]), '.html'),
        src: file.src[0]
    };
};

module.exports.getSections = function (file) {
    // Create sections
    return file.body.map( function (section) {
        // Remove comment tags, indentation and group
        // encapsulate blocks of HTML with ``` fences
        var content = normalize(section);
        // Match the subsequent data (until a commentStart
        // is found) and split off, this are our styles
        var styles = sourcify(section, file);
        // Output object
        var output = Sassdown.formatting(content, styles);
        // Apply heading
        if (!file.title && output.comment.match('</h1>')) {
            file.title = output.comment.split('</h1>')[0].split('>')[1];
        }
        // Output
        return output;
    });
};

module.exports.formatting = function (content, styles) {
    // Create output object with unique id
    var output = {
        id: hashString(content).toString(36).substr(2,5)
    };
    //hljs.configure({useBR: true});
    // If we find code blocks
    if (content.match(/```/)) {
        // Show comment
        output.comment = markdown(content.split(/```/)[0]);
        // Show result
        output.result  = content.split(/```/)[1];
        // Show markup
        output.markup  = '<pre class="hljs"><code>'+hljs.highlight('html', content.split(/```/)[1].split(/```/)[0]).value+'</code></pre>';
        // Does styles consist of more than whitespace?
        if (unspace(styles).length > 0) {
            // Show styles
            output.styles  = '<pre class="hljs"><code>'+hljs.highlight('scss', styles).value+'</code></pre>';
        }
    }
    // If we don't find code blocks
    else {
        output.comment = markdown(content);
    }
    // Return
    return output;
};

module.exports.matching = function () {
    // Create a regular expression from our
    // comment start and comment end options
    var begin = Sassdown.config.option.commentStart.source;
    var end = Sassdown.config.option.commentEnd.source;
    // Return out a new RegExp object
    return new RegExp(begin+'([\\s\\S]*?)'+end, 'g');
};

module.exports.readme = function () {
    // Create file object
    var file = {};
    // Fill with data
    file.title = 'Styleguide';
    file.slug  = '_index';
    file.href  = 'index.html';
    file.dest  = Sassdown.config.root + file.href;
    // Has a README file been specified?
    if (Sassdown.config.option.readme) {
        // Use the README file for content
        file.src = Sassdown.config.option.readme;
        file.sections = [{
            comment: markdown(grunt.file.read(file.src))
        }];
    } else {
        // Don't fill with content
        file.src = file.dest;
        file.sections = null;
    }
    // Write out
    Sassdown.writeOut(file);
};

module.exports.recurse = function (filepath) {
    // Match a directory or file name
    var match = fs.lstatSync(filepath);
    var filename = path.basename(filepath);
    // Let's make sure this match isn't a junk
    // file, such as .svn or .gitignore or .DS_Store
    if (junk.isnt(filename)) {
        // Tree node
        var tree = {};
        // If the filepath matches to a directory,
        // set the type and create a 'children' node
        // where we run the function again in order
        // to map any child pages
        if ( match.isDirectory() ) {
            // Tree node
            tree.name = filename;
            tree.isDirectory = true;
            tree.pages = [];
            // Loop through directory and map child pages to tree node
            fs.readdirSync(filepath).map( function (child) {
                // Check this child isn't a junk file
                if (junk.isnt(child)) {
                    // Check whether this file should be included
                    if (Sassdown.excluded.indexOf(path.normalize(filepath+'/'+child)) === -1) {
                        // Run the recurse function again for this child
                        // to determine whether it's a directory or file
                        // while pushing to pages array of parent
                        tree.pages.push(
                            Sassdown.recurse(path.normalize(filepath+'/'+child))
                        );
                    }
                }
            });
            // Don't display as a directory if
            // this tree node has no pages
            if (tree.pages.length === 0) {
                tree.isDirectory = false;
            }
        }
        // If the filepath isn't a directory, try and grab
        // file data from the Sassdown.pages stack and
        // associate it. Ignore files that are not classed
        // as junk files (.gitignore, .svn, .DS_Store, thumbs.db, etc)
        if ( match.isFile() ) {
            // Loop through the Sassdown.pages
            Sassdown.pages.map( function (page) {
                // Check for a match to filepath
                if (path.normalize(filepath) === path.normalize(page.src)) { tree = page; }
            });
        }
        // Return this tree node
        return tree;
    }
};

module.exports.tree = function () {
    // Set the Sassdown.config.tree to be the returned object
    // literal from the file directory recursion
    Sassdown.config.tree = Sassdown.recurse(Sassdown.config.files[0].orig.cwd);
    // Return the complete tree (without root)
    return Sassdown.config.tree.pages;
};

module.exports.output = function () {
    // Run through each page from before
    return Sassdown.pages.map( function (page) {
        // Write this page out
        Sassdown.writeOut(page);
    });
};

module.exports.writeOut = function (page) {
    // Generate an indivdual path to root for this file
    var localRoot = path.normalize(path.relative(path.dirname(page.dest), Sassdown.config.root));
    // Make local to self if null (ie for index page)
    if (!localRoot) { localRoot = '.'; }
    // Generate asset string
    var localAssets = '';
    // Generate path to assets for this file
    Sassdown.config.assets.forEach( function (asset) {
        localAssets += Sassdown.include(asset, path.dirname(page.dest));
    });
    // Register two unique (local) partials
    Handlebars.registerPartial('root', localRoot);
    Handlebars.registerPartial('assets', localAssets);
    // Write file with Grunt
    grunt.file.write(page.dest, Sassdown.config.template.html({
        'page': page,
        'pages': Sassdown.config.tree.pages
    }));
};