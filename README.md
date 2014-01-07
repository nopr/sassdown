# sassdown

> Generates a documentation styleguide from Markdown comments in sass/scss directories using Handlebars

**Note: *This plugin is still in active development!* So expect it to be a little rough around the edges. If you have any questions, issues or suggestions get in touch. Currently on version `0.1.4`.**

1. [Getting started](#getting-started)
2. [The "sassdown" task](#the-sassdown-task)
    - [Overview](#overview)
    - [Options](#options)
    - [Usage](#usage)
3. [Markdown](#markdown)
4. [Handlebars](#handlebars)
5. [Compass? Sass?](#compass-sass)

## Getting started
Requires Grunt `~0.4.1`

_If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins._

Install this plugin with this command:

```bash
npm install sassdown --save-dev
```

Enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('sassdown');
```

## The "sassdown" Task

Run the task using `grunt sassdown`. Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide. **While in development** if you encounter any confusing issues, do try running `grunt sassdown --verbose` - this will output the full process.

### Overview
In your project's Gruntfile, add a section named `sassdown` to the data object passed into `grunt.initConfig()`.

```js
sassdown: {
    options: {
        // Task-specific options go here.
    },
    your_target: {
        // Target-specific file lists and/or options go here.
    },
},
```

### Options

#### options.assets
Type: `Array`
Default value: `null`

*Required*. Array of file paths. These will be included into result examples in the styleguide. Typically, these assets are your finished compiled stylesheets and/or javascript files.

#### options.template
Type: `String`
Default value: `null`

*Optional*. A path to a Handlebars file with structure for the styleguide. If unspecified reverts to a default.

#### options.theme
Type: `String`
Default value: `null`

*Optional*. A path to a stylesheet file containing the visual theme of the styleguide. If unspecified reverts to a default.

#### options.commentStart
Type: `RegExp`
Default value: `/\/\*/`

*Optional*. A regular expression to match beginning part of a comment block.

#### options.commentEnd
Type: `RegExp`
Default value: `/\*\//`

*Optional*. A regular expression to match ending part of a comment block.

#### options.excludeMissing
Type: `Boolean`
Default value: `false`

*Optional*. Exclude files without comments.

#### options.baseUrl
Type: `String`
Default value: `null`

*Optional*. A custom URL to use as base for styleguide links. If not provided it will default to the `dest` value of the `files` array.

#### options.readme
Type: `Boolean|String`
Default value: `true`

*Optional*. Path to a markdown file to be used as index page of the styleguide.

If set to `true` (default) will look for a `readme.md` into the `cwd` folder of the `files` array. Set the option to `false` to completely disable this feature.

### Usage

You will need to use an [expanded files object](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically), but here is roughly the minimum settings and setup required.
```js
sassdown: {
    styleguide: {
        options: {
            assets: ['assets/css/*.css']
        },
        files: [{
            expand: true,
            cwd: 'assets/sass',
            src: ['*.scss'],
            dest: 'styleguide/'
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
            template: 'src/styleguide/template.hbs'
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

### Example (_alerts.scss)

Here is an example of what a .scss file may look like with a Markdown comment block. Notice the indented HTML example. You may use any Markdown-compatible [heading syntax](https://github.com/nopr/sassdown/issues/7) you like. You may use any common style of [block-comment syntax](https://github.com/nopr/sassdown/issues/12#issuecomment-28219982) you like. Code blocks may be fenced or indented (four spaces).

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

# File Object

Sassdown parses through your files using Grunt and before compiling any Handlebars templates it generates a series of File objects. This object contains all data for the `.html` page that gets rendered.

Properties inside the File object can be accessed by the Handlebars template using `{{ helpers }}`. For example, the `heading` property is used in the default template like `<title>{{ heading }}</title>`.

```js
{
  slug: '_alerts',
  heading: 'Alerts',
  group: 'objects',
  path: 'public/styleguide/objects/_alerts.html',
  url: '/public/styleguide/objects/_alerts.html',
  original: 'assets/sass/partials/objects/_alerts.scss',
  prismLang: 'scss', //syntax highlight
  ext: 'scss' //file extension
  site: {
    root: 'styleguide/',
    rootUrl: '/public/styleguide/',
    groups: {
      modules: [Object],
      objects: [Object]
    },
    assets: '../../styleguide/assets/'
  },
  sections: [
    {
      id: 'cr3sor',
      prismLang: 'scss', //syntax highlight
      fileExt: 'scss' //file extension
      comment: '<h1>Alerts</h1>\n<p>Creates an alert box notification using the <code>.alert-</code> prefix. The following options are available:</p>',
      source: '<pre><code>&lt;div class=&quot;alert-success&quot;&gt;Success&lt;/div&gt;\n&lt;div class=&quot;alert-warning&quot;&gt;Warning&lt;/div&gt;\n&lt;div class=&quot;alert-error&quot;&gt;Error&lt;/div&gt;</code></pre>',
      cssSource: '<pre><code>@mixin alert($colour){\n    color: darken($colour, 50%);\n    background: $colour;\n    border-radius: 5px;\n    margin-bottom: 1em;\n    padding: 1em;\n}\n\n.alert-success { @include alert(#e2f3c1) }\n.alert-warning { @include alert(#fceabe) }\n.alert-error   { @include alert(#ffdcdc) }</code></pre>'
      result: '<div class="alert-success">Success</div> <div class="alert-warning">Warning</div> <div class="alert-error">Error</div>'
    }
  ]
}
```

# Handlebars

[Handlebars](http://handlebarsjs.com/) is a semantic templating syntax. Put simply, it allows you to output dynamic properties in HTML using `{{  }}` from a variety of data sources such as JSON.

Sassdown uses Handlebars to output data from the File Objects it creates. Your `.hbs` file specified in the `template` option may contain code that looks like this for example:

```html
{{#each sections}}
    <div class="section">
        {{#if comment}}
            <div class="comment">{{{comment}}}</div>
        {{/if}}
        {{#if result}}
            <div class="result">{{{result}}}</div>
        {{/if}}
        {{#if source}}
            <div class="source">{{{source}}}</div>
        {{/if}}
        {{#if cssSource}}
            <div class="source {{prismLang}}">{{{cssSource}}}</div>
        {{/if}}
    </div>
{{/each}}
```

## Compass? Sass?
Sassdown **does not** compile your .sass or .scss files. Since you're using Grunt, I would recommend the [grunt-contrib-compass](https://github.com/gruntjs/grunt-contrib-compass) plugin for this task.
