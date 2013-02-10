// This is the only name we pollute the global namespace with.
var FimmWidgets = {};
FimmWidgets.shared = {};      // For shared data.
FimmWidgets.util = {};        // For utility functions.

(function(fw) {

  fw.util.isArray = (function() {
    if (Array.isArray && typeof Array.isArray === 'function'){
      return Array.isArray;
    } else {
      return function(o){
        if (Object.prototype.toString.call( o ) === '[object Array]') {
          return true;
        }
        return false;
      };
    }
  }());

  /*
   * Equivalent to Object.create.
   * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
   */
  fw.util.create = (function() {
    if (! Object.create || typeof Object.create !== 'function') {
      return function(o) {
        if (arguments.length > 1) {
          throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
      };
    } else {
      return Object.create;
    }
  }());

  /* 
   * List "local" properties of an object. 
   * http://stackoverflow.com/questions/208016/how-to-list-the-properties-of-a-javascript-object
   */
  fw.util.properties = (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
        dontEnums = [ 
            'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
            'isPrototypeOf', 'propertyIsEnumerable', 'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(o) {
      var result = [];

      if (typeof o != "object" && typeof o != "function" || o === null) {
        return result;
      }
      for (var name in o) {
        if (hasOwnProperty.call(o, name))
          result.push(name);
      }
      if (hasDontEnumBug) {
        for (var i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(o, dontEnums[i]))
            result.push(dontEnums[i]);
        }
      }
      return result;
    };
  })();

  // http://software.intel.com/en-us/blogs/2010/05/22/dynamically-load-javascript-with-load-completion-notification/

  function loadDynamicFile(fileURL, props, params) {

    var onloadCallback = function(){
      /*
        Using setTimeout for "recursion" is just a precaution. 
        If there is a huge number of files to load--highly 
        unlikely--avoid blowing up the stack.
      */
      setTimeout(function(){
        doLoading(params);
      }, 10);
    };
    var elem = document.createElement(props.elem);
    // Get rid of the property 'elem', as it could mess up creating a
    // new DOM element.
    delete props.elem;
    for (var p in props){
      if (props.hasOwnProperty(p)){
        elem[p] = props[p];
      }
    }
    if (typeof (elem.addEventListener) !== 'undefined') {

      /* The FF, Chrome, Safari, Opera way */
      elem.addEventListener('load', onloadCallback, false);

    } else {

      /* The MS IE 8+ way */
      elem.attachEvent('onreadystatechange', function(){
        if (elem.readyState == 'loaded') {
          onloadCallback();
        }
      });
    }
    document.getElementsByTagName("head")[0].appendChild(elem);

  }

  function doLoading(params){

    var files = params.files;

    /*
    * Get properties based on the file's suffix.
    * These properties are used to create a DOM element.
    */
    var getProps = function(f){
      var lastDot = f.lastIndexOf('.') + 1;
      var sfx = f.substring(lastDot);
      var props = {};

      if (sfx === 'js'){
        props.elem = 'script';
        props.type = "text/javascript";
        props.src = f;
      } else if (sfx === 'css'){
        props.elem = 'link';
        props.type = "text/css";
        props.rel = 'stylesheet';
        props.href = f;
      }
      return props;
    };
    var file;
    
    if (files.length > 0){
      file = files.pop();
      loadDynamicFile(file, getProps(file), params);
    } else {
      if (typeof params.onready === 'function') {
        if (document.readyState === 'complete') {
          params.onready.call(null, params.config);
        } else {
          Ext.onReady(function() {
            params.onready.apply(null, params.config);
          }, null, true);
        }
      }
    }
  }; 
    
  function loadDynamically(){
    // http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array

    var args = arguments;
    var isArray = fw.util.isArray;
    var restArgs = [];
    var defaultFiles = [
      "../../resources/css/ext-all.css", 
      "../../ext-all-debug.js", 
      "fimmwidget.js", 
      "../shared/example.css"
    ];
    var files = defaultFiles;
    var conf = {};
    var params; 

    if (args.length > 0) {
      if (isArray(args[0])) {
        files = args[0];
      } else {
        conf = args[0];
      }
    }

    if (args.length > 1) {
      if (isArray(args[0])) {
        files = args[0];
      }
      if (typeof args[1] === 'object' && isArray(args[1]) === false) {
        conf = args[1];
      }
    }

    params = {
      onready: launch,
      config: conf
    };

    if (typeof files === 'string'){
      files = [files];
    }
    if (isArray(files) === true){
      files.reverse();
      params.files = files;
      doLoading(params);
    }
  }

  fw.loadDynamically = loadDynamically;

  function defaultConfig(config) {
    var defaultConfigValues = {

      /*
       * Id of the div which contains all the other divs; 
       * if no such div exists, it will be created automatically.
       */
      containerDivId: 'mainarea',

      /*
       * Id of the div where the search form widget will be placed;
       * if no such div exists, it will be created automatically.
       */
      searchFormDivId: 'search_form',

      // Id for the search form widget itself.
      searchFormId: Ext.id(),

      /*
       * Id of the div where the variant grid widget will be placed;
       * if no such div exists, it will be created automatically.
       */
      variantGridDivId: 'variant_grid', 

      // Id for the variant grid widget.
      variantGridId: Ext.id(),

      // These values will be passed to SequenceViewer.
      seqview: {},

      /*
       * Id for the gene search combobox. It is very unlikely that 
       * there's any need to set this explicitly. Maybe this grants
       * too fine-grained a control to the user.
       */
      geneSearchComboboxId: Ext.id(),

      /*
       * Id for the gene search combobox search button. 
       * It is very unlikely that there's any need to set this explicitly. 
       * Maybe this grants too fine-grained a control to the user.
       */
      geneSearchButtonId: Ext.id('gene-search')
    };
    var props = fw.util.properties(defaultConfigValues);
    var idx = 0;
    var prop;

    while (idx < props.length) {
      prop = props[idx];
      if (config.hasOwnProperty(prop) === false) {
        config[prop] = defaultConfigValues[prop];
      }
      idx += 1;
    }
    return config;
  }

  function createDivs(conf) {
    var ids = new Array(conf.containerDivId,    // MUST be first!
                        conf.searchFormDivId,
                        conf.variantGridDivId);
    var id = conf.containerDivId;
    var container = Ext.get(id);
    var div;

    // First, create the container div.
    if (container === null) {
      container = Ext.getBody().createChild({
        tag: 'div',
        id: id
      });
    }

    // Create a div for the search form.
    id = conf.searchFormDivId;
    div = Ext.get(id);
    if (div === null || container.contains(div) === true) {
      if (div !== null) {
        div.appendTo(container);
      } else {
        container.createChild({
          tag: 'div',
          id: id
        });
      }
    } 

    // Create a "spacer" div.
    container.createChild({
      tag: 'div', 
      cls: 'filler'
    });

    // Finally, create a div for the variant grid.
    id = conf.variantGridDivId;
    div = Ext.get(id);
    if (div === null || container.contains(div) === true) {
      if (div !== null) {
        div.appendTo(container);
      } else {
        container.createChild({
          tag: 'div',
          id: id
        });
      }
    } 
  }

  /*
   * This function can be called only after Ext JS files have been loaded.
   */
  function launch(appConfig) {

    // Set the default config values.
    appConfig = defaultConfig(appConfig);

    // Create necessary div-elements.
    createDivs(appConfig);

    // Parameters for the sequence viewer.
    fw.shared.seqviewConfig = appConfig.seqview;

    Ext.Loader.setConfig({enabled: true});
    Ext.Loader.setPath('Ext.ux', '../ux');

    Ext.require([
      'Ext.ModelManager',
      'Ext.data.*',
      'Ext.form.*',
      'Ext.grid.*',
      'Ext.layout.container.Column',
      'Ext.panel.*',
      'Ext.tab.Panel',
      'Ext.tip.QuickTipManager',
      'Ext.toolbar.Paging',
      'Ext.util.*',
      'Ext.ux.PreviewPlugin'
    ]);

    Ext.define('ValueRenderer', (function(base) {
      return {
        'renderVariantGenes': function(value, p, record) {
          if (value.length === 0) {
            return 'No variant genes';
          }
          if (value.length === 1) {
            var elem = value[0];
            //return Ext.String.format('{0} ({1})', elem["accession"], elem["source"]);
            return Ext.String.format('{0}', elem["accession"]);
          }
          return Ext.String.format('<b>{0}</b>', 'Details');
        },

        'renderName': function(value, p, record) {
          //var uri = record['data'].uri;
          var name = Ext.htmlDecode(value['string']);
          //var link = Ext.String.format('<a href="{0}" target="_blank"><b>{1}</b></a>', uri, name);
          var link = name;
          return link;
        },

        'renderFrequencies': function(value, p, record) {
          if (! Ext.isArray(value)){
            return 'no freqs';
          }
          return base.renderMultipleValues({
            record: record,
            title: "Frequencies",
            store: new Ext.data.ArrayStore({
              fields: [
              { name: 'samples' },
              { name: 'type' },
              { name: 'populations' },
              { name: 'freq', type: 'float'},
              ],
              data: Ext.Array.map(value, function(elem) {
                return [
                  elem['samples'],
                  elem['type'],
                  elem['populations'],
                  elem['freq']
                ];
              })
            }),
            columns: [
              new Ext.grid.RowNumberer(), 
                {
                  text: "Samples",
                  width: 50,
                  sortable: true,
                  dataIndex: 'samples'
                }, {
                  text: "Type",
                  width: 70,
                  sortable: true,
                  dataIndex: 'type'
                }, {
                  text: "Populations",
                  width: 200,
                  sortable: true,
                  renderer: function(p) {
                    return Ext.String.format("{0} ({1})", p.term, p.type);
                  },
                  dataIndex: 'populations'
                }, {
                  text: "Freq",
                  width: 70,
                  sortable: true,
                  dataIndex: 'freq'
                }
            ]
          });
        },

        'renderAccessionNumbers': function(value, p, record) {
          return value['accession'];
        }
      };
    })({ /* This is the "base" object. */
      'renderMultipleValues': function(params) {
        var id = Ext.id();
        var winId = Ext.id();
        var html = Ext.String.format('<div id="{0}"></div>', id);
        var geneName = params.record.data.name.string;
        var win = Ext.create('widget.window', {
          id: winId,
          title: Ext.String.format('Frequencies ("{0}")', geneName),
          width: 500,
          height: 300,
          layout: 'fit',
          items: [
            {
              border: false,
              xtype: 'grid',
              store: params.store,
              columns: params.columns
            }
          ]
        });
        Ext.defer(function() {
          Ext.create('Ext.Button', {
            text: 'Details',
            renderTo: id,
            handler: function() {
              win.show();
            }
          });
        }, 50);
        return html;
      }
    }));

    /*********** Models **********/

    Ext.define('GeneName', {
      extend: 'Ext.data.Model',
      fields: [
        {type: 'string', name: 'name'}
      ]
    });

    Ext.define('Variant', {
      extend: 'Ext.data.Model',
      fields: [
        'genes', 'ref_seq', 'name', 'panels', 'frequencies',
        'aliases', 'locations', 'sharing_policy', 'id', 'uri'
      ],
      idProperty: 'id'
    });

    /*********** Stores **********/

    Ext.define('VariantStore', {
      extend: 'Ext.data.Store',
      pageSize: 10,
      model: 'Variant',
      remoteSort: true,
      proxy: {
        type: 'ajax',
        url: '/variants',
        reader: {
          root: 'variants',
          totalProperty: 'totalCount'
        },
        simpleSortMode: false
      }
    });

    Ext.define('GeneNameStore', {
      extend:  'Ext.data.Store',
      model: 'GeneName',
      remoteFilter: true,
      proxy: {
        type: 'ajax',
        url: '/genes',
        reader: 'json'
      },
      autoLoad: false
    });

    /*********** Widgets **********/

    // http://stackoverflow.com/questions/6609275/extjs-4-how-to-extend-extjs-4-components
    // http://stackoverflow.com/questions/6181614/calling-lifecycle-template-methods-in-extjs-4
    // http://stackoverflow.com/questions/11323023/render-dynamic-components-in-extjs-4-gridpanel-column-with-ext-create
    Ext.define('GeneComboBox', {
      extend: 'Ext.form.field.ComboBox',
      alias: ['widget.gene-combobox'],

      config: {
        fieldLabel: 'Gene Name/symbol',
        emptyText: 'Name/symbol',
        displayField: 'name',
        hideTrigger: true,
        multiSelect: false,
        width: 320,
        labelWidth: 130,
        queryMode: 'remote',
        minChars: 3,
        typeAhead: true,
        typeAheadDelay: 1000
      },

      constructor: function(cnfg) {
        //this.callParent(arguments);
        this.callParent([cnfg]);
        this.initConfig(cnfg);
        this.store = Ext.create('GeneNameStore');
      },

      onRender: function() {
        this.callParent(arguments);
      }
    });

    Ext.define('GeneSearchComponent', {
      extend: 'Ext.panel.Panel',
      alias: 'widget.gene-search-component',
      collapsible: true,
      frame: true,
      title: 'Search',
      bodyPadding: '15 15 15 15',
      width: 350,
      layout: {
        type: 'vbox',
        align: 'left'
      },
      items: [
        {
          xtype: 'gene-combobox',
          id: appConfig.geneSearchComboboxId
        },
        {
          xtype: 'button',
          id: appConfig.geneSearchButtonId,
          text: 'Search',
          handler: function(){

            var geneName = Ext.getCmp(appConfig.geneSearchComboboxId).getValue();
            var grid = Ext.get(appConfig.variantGridId);
            var main = Ext.get(appConfig.containerDivId);
            var renderer = Ext.create('ValueRenderer');
            var svbtnId = Ext.id();       // Button to show seqviewer.
            var ensemblId = Ext.id();     // Button to open Ensembl page.
            var toolbarId = Ext.id();
            var store, win;

            if (typeof geneName !== 'string'){
              Ext.MessageBox.alert("No input given", "Please give a gene name.");
              return;
            }

            if (geneName.length > 2) {
              if (grid !== null) {
                grid.destroy();
              }

              store = Ext.create('Ext.data.Store', {
                pageSize: 10,
                model: 'Variant',
                autoLoad: true,
                remoteSort: true,
                proxy: {
                  // load using script tags for cross domain, if the data in on the same domain as
                  // this page, an HttpProxy would be better
                  type: 'ajax',
                  // /learning_extjs/extjs/examples/grid/variants?_dc=1347428880556&page=1&start=0&limit=50&sort=lastpost&dir=DESC&callback=Ext.data.JsonP.callback1
                  // /learning_extjs/extjs/examples/grid/variants
                  url: '/variants',
                  reader: {
                    root: 'variants',
                    totalProperty: 'totalCount'
                  },
                  extraParams: {
                    gene: geneName
                  },
                  simpleSortMode: false
                }
              });
              grid = Ext.create('Ext.grid.Panel', {
                width: 700,
                height: 450,
                title: 'Browse Variants',
                id: appConfig.variantGridId,
                renderTo: appConfig.variantGridDivId,
                store: store,
                selModel: {
                  allowDeselect: true,
                  mode: 'SINGLE'
                },
                loadMask: true,
                listeners: {
                  selectionchange: {
                    fn: function(rowModel, selected, eOpts) {
                      var btn = Ext.getCmp(svbtnId);
                      var ens = Ext.getCmp(ensemblId);
                      var toolbar = Ext.getCmp(toolbarId);
                      var sel = {};
                      var variant;

                      if (selected.length > 0) {
                        variant = selected[0];
                        sel.variant = variant;
                        sel.symbol = variant.data.genes[0].accession;
                        sel.uri = variant.get('uri')
                        sel.id = variant.get('id')
                        fw.shared.selected = sel;
                        toolbar.enable();
                        btn.enable();
                        ens.enable();
                      } else {
                        fw.shared.selected = null;
                        toolbar.disable();
                        btn.disable();
                        ens.disable();
                      }
                    }
                  }
                },
                viewConfig: {
                  id: 'gv',
                  trackOver: false,
                  stripeRows: false,
                },
                // grid columns
                columns:[
                  {
                    text: "Name",
                    dataIndex: 'name',
                    flex: 1,
                    renderer: renderer.renderName,
                    sortable: true
                  }, {
                    text: "Accession",
                    dataIndex: 'ref_seq',
                    flex: 1,
                    renderer: renderer.renderAccessionNumbers,
                    sortable: false
                  }, {
                    text: "Variant Gene",
                    dataIndex: 'genes',
                    flex: 1,
                    renderer: renderer.renderVariantGenes,
                    sortable: false
                  }, {
                    text: "Frequencies",
                    dataIndex: 'frequencies',
                    flex: 1,
                    renderer: renderer.renderFrequencies,
                    sortable: false
                  }
                ],
                tbar: [
                  {
                    text: 'Variant',
                    id: toolbarId,
                    disabled: true,
                    menu: {
                      xtype: 'menu',
                      items: [
                        {
                          xtype: 'menuitem',
                          id: svbtnId,
                          text: 'SeqView',
                          disabled: true,
                          listeners: {
                            click: function(){
                              var selected = fw.shared.selected;

                              Ext.Ajax.request({
                                url: '/seqviewer',
                                method: 'GET',
                                params: {
                                  'id': selected.id,
                                  'symbol': selected.symbol
                                },
                                success: function(res){
                                  var json = Ext.JSON.decode(res.responseText);
                                  var variant = json.variant;
                                  var hgnc = json.hgnc;
                                  var win = fw.shared.win;
                                  var conf = fw.util.create(fw.shared.seqviewConfig);
                                  var start = Number(variant.locations[0].start);
                                  var end = Number(variant.locations[0].end);
                                  /*
                                    How many times are we going to check the availability
                                    of 'show_sequence_viewer' method.
                                  */
                                  var tries = 10;
                                  function showsv(w){
                                    if (tries == 0){
                                      console.log('After 10 attempts, seqview window still does not have "show_sequence_viewer" method.');
                                      return;
                                    }
                                    tries -= 1;
                                    /*
                                      It is not enough to check the 'readyState' property. 
                                      Chrome and Safari seem to handle it in a different 
                                      way compared to Firefox. They don't make the 
                                      'show_sequence_viewer' method available immediately.
                                    */
                                    if (w.document.readyState === 'complete'
                                        && w['show_sequence_viewer'] !== undefined
                                        && typeof w['show_sequence_viewer'] === 'function'){
                                      w.show_sequence_viewer(conf);
                                    } else {
                                      setTimeout(function(){
                                        showsv(w);
                                      }, 500);
                                    }
                                  };

                                  conf.start = start;
                                  conf.end = end;
                                  conf.id = variant.ref_seq.accession;
                                  if (conf.end - conf.start < 100) {
                                    (function(c) {
                                      var sep = Number(c.end - c.start).toFixed();
                                      var rem = 100 - sep;
                                      rem = Number(rem / 2).toFixed();
                                      rem = parseInt(rem, 10);
                                      if (Number(c.start - rem) > 0) {
                                        c.start = Number(c.start - rem);
                                      }
                                      c.end = Number(c.end + rem);
                                    }(conf));
                                  }
                                  conf.mk = String(start).concat(':')
                                                         .concat(end)
                                                         .concat("|00ff00");

                                  if (!win || win.closed === true) {
                                    win = window.open('http://localhost:8080/index.html', '_blank');
                                    fw.shared.win = win;
                                  }
                                  showsv(win);
                                }
                              });
                            }
                          },
                        },
                        {
                          xtype: 'menuitem',
                          text: 'Ensembl',
                          id: ensemblId,
                          disabled: true,
                          listeners: {
                            click: function(){
                              var sel = fw.shared.selected;
                              window.open(sel.uri, '_blank');
                            }
                          }
                        }
                      ]
                    }
                  }
                ],
                // paging bar on the bottom
                bbar: Ext.create('Ext.PagingToolbar', {
                  store: store,
                  displayInfo: true,
                  displayMsg: 'Displaying variants {0} - {1} of {2}',
                  emptyMsg: "No variants to display",
                })
              });
            }
          }
        }
      ]
    });

    Ext.application({
      name: 'FW',
      launch: function() {
        Ext.widget('gene-search-component', {
          id: appConfig.searchFormId,
          renderTo: appConfig.searchFormDivId
        });
      }
    });

  }

  fw.launch = launch;

}(FimmWidgets));

/*
  Requested path: /learning_extjs/extjs/examples/form/dynamic.html
  Requested path: /learning_extjs/extjs/resources/css/ext-all.css
  Requested path: /learning_extjs/extjs/ext-all.js
  Requested path: /learning_extjs/extjs/examples/form/dynamic-gene1.js
  Requested path: /learning_extjs/extjs/examples/shared/example.css
  Requested path: /learning_extjs/extjs/examples/ux/PreviewPlugin.js
  Requested path: /learning_extjs/extjs/resources/themes/images/default/form/trigger.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/form/exclamation.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/tools/tool-sprites.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/form/text-bg.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/loading.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/button/arrow.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/page-first-disabled.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/page-prev-disabled.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/page-next-disabled.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/page-last-disabled.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/refresh.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/page-next.gif
  Requested path: /learning_extjs/extjs/resources/themes/images/default/grid/page-last.gif
*/
