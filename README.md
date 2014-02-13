# sassdown

> Grunt plugin for building living styleguides with Handlebars from Markdown comments in CSS, SASS and LESS files.

**Note: *This plugin is still in active development!* So expect it to be a little rough around the edges. If you have any questions, issues or suggestions get in touch. Currently on version `0.2.6`.**

1. [Getting started](#getting-started)
2. [Sassdown task](#sassdown-task)
    - [Overview](#overview)
    - [Options](#options)
    - [Usage](#usage)
3. [Markdown](#markdown)
4. [Handlebars](#handlebars)
5. [Highlight.js](#highlightjs)
6. [Data Objects](#data-objects)
    - [Page](#page)
    - [Pages](#pages)
7. [Template](#template)
8. [SASS](#sass)

### What's new in version 0.2.6?

- Path resolving is relative; no more issues serving from localhost or using file:// protocols
- Whitespace and preformatting is preserved in markup results
- Source styles shown in conjunction with markup and result
- Pages are served form an array-literal node tree; meaning clearer and nested navigation
- Comment block matching is modifiable via regular expressions
- Choice of syntax highlighting styles from various popular Highlight.js themes
- Syntax highlighting is done with Node before templates compile; faster page loads

## Getting started

Install this plugin with this command:

```bash
npm install sassdown --save-dev
```

Enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('sassdown');
```

## Sassdown Task

Run the task using `grunt sassdown`. Task targets, files and options may be specified according to the grunt [configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Overview
In your project's Gruntfile, add a section named `sassdown` to the data object passed into `grunt.initConfig()`.

```js
sassdown: {
    options: {
        // Task-specific options go here.
    },
    target: {
        // Target-specific file lists and/or options go here.
    },
},
```

### Options

#### options.assets
Type: `Array`<br/>
Default: `null`

*Optional*. Array of file paths. Will be included into the styleguide output. Supports [globbing](http://gruntjs.com/configuring-tasks#globbing-patterns). Supports relative and external file paths (eg. http:// or https://).

#### options.template
Type: `String`<br/>
Default: `null`

*Optional*. A path to a Handlebars template file. Will use default Sassdown template if left blank.

#### options.theme
Type: `String`<br/>
Default: `null`

*Optional*. A path to a theme stylesheet. Will use default Sassdown theme if left blank.

#### options.readme
Type: `String`<br/>
Default: `null`

*Optional*. Path to a README file. When set, this file will be parsed with Markdown and used as the index page for the styleguide.

#### options.highlight
Type: `String`<br/>
Default: `github`

*Optional*. Choice of syntax highlighting style. Defaults to `github`, but other available options are: `docco`, `monokai`, `solarized-light`, `solarized-dark` or `xcode`.

#### options.commentStart
Type: `RegExp`<br/>
Default: `/\/\*/`

*Optional*. A regular expression to match beginning part of a comment block. Defaults to regular block comment (`/*`).

#### options.commentEnd
Type: `RegExp`<br/>
Default: `/\*\//`

*Optional*. A regular expression to match ending part of a comment block. Defaults to regular block comment (`*/`).

#### options.excludeMissing
Type: `Boolean`<br/>
Default: `false`

*Optional*. When set to true, Sassdown will ignore any files that do not contain matching or valid comment blocks.

### Usage

You will need to use an [expanded files object](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically), but here is roughly the minimum configuration required.
```js
sassdown: {
    styleguide: {
        options: {
            assets: ['public/css/*.css']
        },
        files: [{
            expand: true,
            cwd: 'src/sass',
            src: ['*.scss'],
            dest: 'public/styleguide/'
        }]
    }
},
```

On larger projects you may need to include additional assets and customise the output with a user theme and template.
```js
sassdown: {
    styleguide: {
        options: {
            assets: [
                'public/css/**/*.min.css',
                'public/js/*.min.js',
                'http://use.typekit.net/sea5yvm.js',
            ],
            theme: 'src/styleguide/theme.css',
            template: 'src/styleguide/template.hbs',
            readme: 'src/assets/sass/readme.md',
            highlight: 'monokai',
            excludeMissing: true
        },
        files: [{
            expand: true,
            cwd: 'src/assets/sass',
            src: [
                'partials/**/*.{scss,sass}',
                'modules/**/*.{scss,sass}'
            ],
            dest: 'public/styleguide/'
        }]
    }
},
```

# Markdown

Sassdown uses [Markdown](https://github.com/chjj/marked) to parse any block comments in your SASS files. From these, it generates the text content in the styleguide. Any recognised code blocks will be rendered as HTML/SCSS source-result pairs.

## Structure

You may use any Markdown-compatible [heading syntax](https://github.com/nopr/sassdown/issues/7) you like. You may use any common style of [block-comment syntax](https://github.com/nopr/sassdown/issues/12#issuecomment-28219982) you like. Code blocks may be fenced or indented (four spaces). Below are several examples; each will be correctly parsed by Sassdown into identical output.

### Example .scss file

```scss
/*

Alerts
======

Creates an alert box notification using the `.alert-` prefix. The following options are available:

    <div class="alert-success">Success</div> 
    <div class="alert-warning">Warning</div> 
    <div class="alert-error">Error</div>

*/
@mixin alert($colour){
    color: darken($colour, 50%);
    background: $colour;
    border-radius: 5px;
    margin-bottom: 1em;
    padding: 1em;
}
.alert-success { @include alert(#e2f3c1) }
.alert-warning { @include alert(#fceabe) }
.alert-error   { @include alert(#ffdcdc) }
```

# Handlebars

[Handlebars](http://handlebarsjs.com/) is a semantic templating syntax. Put simply, it allows you to output dynamic properties in HTML using `{{var}}` from a variety of data sources such as JSON.

Sassdown uses Handlebars to output data from the [data objects](#data-objects) it creates. Your `.hbs` file specified in the `template` option may contain code that looks like this for example:

```html
{{#each page.sections}}
    <div class="section">
        {{#if comment}}
            <div class="comment">{{{comment}}}</div>
        {{/if}}
        {{#if result}}
            <div class="result">{{{result}}}</div>
        {{/if}}
        {{#if markup}}
            <div class="markup">{{{markup}}}</div>
        {{/if}}
        {{#if styles}}
            <div class="styles">{{{styles}}}</div>
        {{/if}}
    </div>
{{/each}}
```

### Common partials

Sassdown also provides a series of Handlebars **partials**, which can be used to output specific information on each page. These are:

* `{{> root}}`<br>Outputs a path to the root directory of the styleguide, relative to whatever page you are on.
 
* `{{> assets}}`<br>Outputs a set of `<link />` or `<script>` tags that include assets specified in the Grunt task options.
 
* `{{> theme}}`<br>Outputs the theme stylesheet, minified, into a `<style>` tag.

# Highlight.js

Sassdown uses the popular and well-supported [Highlight.js](http://highlightjs.org/) for syntax highlighting. Markup is parsed by a Node module and highlighted before being output through the template. Various popular themes are supported via the task options.

# Data Objects

Two objects are parsed into the Handlebars template; `Page` and `Pages`. **Page** contains json data for the current page only; **Pages** is an array literal containing all Page objects in a nested node tree.

Any property within these objects can be output by Handlebars using `{{helpers}}`. You can iterate through objects using `{{#each}} ... {{/each}}`, for example.

## Page

```js
{
  title: 'Alerts',
  slug: '_alerts',
  href: 'objects/user/_alerts.html',
  dest: 'test/example/styleguide/objects/user/_alerts.html',
  src: 'test/example/assets/sass/partials/objects/user/_alerts.scss',
  sections: [ 
    {
      id: 'mswbu',
      comment: '<h1 id="alerts">Alerts</h1>\n<p>Creates an alert box notification using the <code>.alert-</code> prefix. The following options are available:</p>\n',
      result: '\n<div class="alert-success">Success</div> \n<div class="alert-warning">Warning</div> \n<div class="alert-error">Error</div>\n',
      markup: '<pre><code><span class="token tag" ><span class="token tag" ><span class="token punctuation" >&lt;</span>div</span> <span class="token attr-name" >class</span><span class="token attr-value" ><span class="token punctuation" >=</span>&quot;alert-success&quot;&gt;</span></span>Success<span class="token tag" ><span class="token tag" ><span class="token punctuation" >&lt;/</span>div</span><span class="token punctuation" >&gt;</span></span> \n<span class="token tag" ><span class="token tag" ><span class="token punctuation" >&lt;</span>div</span> <span class="token attr-name" >class</span><span class="token attr-value" ><span class="token punctuation" >=</span>&quot;alert-warning&quot;&gt;</span></span>Warning<span class="token tag" ><span class="token tag" ><span class="token punctuation" >&lt;/</span>div</span><span class="token punctuation" >&gt;</span></span> \n<span class="token tag" ><span class="token tag" ><span class="token punctuation" >&lt;</span>div</span> <span class="token attr-name" >class</span><span class="token attr-value" ><span class="token punctuation" >=</span>&quot;alert-error&quot;&gt;</span></span>Error<span class="token tag" ><span class="token tag" ><span class="token punctuation" >&lt;/</span>div</span><span class="token punctuation" >&gt;</span></span></code></pre>\n',
      styles: '<pre><code><span class="token keyword" >@mixin</span> alert(<span class="token variable" >$colour</span>)<span class="token punctuation" >{</span>\n    <span class="token property" >color</span><span class="token punctuation" >:</span> darken(<span class="token variable" >$colour</span>, 50%)<span class="token punctuation" >;</span>\n    <span class="token property" >background</span><span class="token punctuation" >:</span> <span class="token variable" >$colour</span><span class="token punctuation" >;</span>\n    <span class="token property" >border-radius</span><span class="token punctuation" >:</span> 5px<span class="token punctuation" >;</span>\n    <span class="token property" >margin-bottom</span><span class="token punctuation" >:</span> 1em<span class="token punctuation" >;</span>\n    <span class="token property" >padding</span><span class="token punctuation" >:</span> 1em<span class="token punctuation" >;</span>\n<span class="token punctuation" >}</span>\n\n.alert-success <span class="token punctuation" >{</span> <span class="token keyword" >@include</span> alert(#e2f3c1) <span class="token punctuation" >}</span>\n.alert-warning <span class="token punctuation" >{</span> <span class="token keyword" >@include</span> alert(#fceabe) <span class="token punctuation" >}</span>\n.alert-error   <span class="token punctuation" >{</span> <span class="token keyword" >@include</span> alert(#ffdcdc) <span class="token punctuation" >}</span></code></pre>\n'
    }
  ]
}
```

## Pages

```js
[
  {
    name: 'base',
    isDirectory: true,
    pages: [
      [Object],
      {
        name: 'typography',
        isDirectory: true,
        pages: [
          [Object],
          [Object],
          [Object]
        ]
      },
      [Object],
      [Object]
    ]
  },
  {
    name: 'partials',
    isDirectory: true,
    pages: [
      [Object],
      [Object]
    ]
  },
  {
    name: 'modules',
    isDirectory: true,
    pages: [
      [Object] 
    ]
  },
  {
    name: 'objects',
    isDirectory: true,
    pages: [
      [Object],
      [Object], 
      [Object]
    ]
  }
]
```

# Template

Should you wish to create a new Sassdown template, you may wish to use the [existing default template.hbs](https://github.com/nopr/sassdown/blob/master/tasks/data/template.hbs) as a base to work from. 

# Sass

It should be noted that, despite the name, Sassdown does not explicitly read only SASS files. It works just fine with .sass, .less, .css or even .txt files.

Sassdown **does not** compile your source files. Assuming you are using SASS, and since you're using Grunt, I would recommend the [grunt-contrib-compass](https://github.com/gruntjs/grunt-contrib-compass) plugin for this task. However you may also want to look at [grunt-contrib-stylus](https://github.com/gruntjs/grunt-contrib-stylus).

# Project Milestones

*Current [milestones](https://github.com/nopr/sassdown/issues/milestones) for this project*

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
