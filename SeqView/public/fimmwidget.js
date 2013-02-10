// This is the only name we pollute the global namespace with.
var FimmWidgets = {};
FimmWidgets.shared = {};      // For shared data.
FimmWidgets.util = {};        // For utility functions.

(function(fw) {

  /*
   * Returns true if the first parameter is an array object.
   */
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
   *
   * As JavaScript uses prototypes rather than classes for inheritance, this function
   * is the preferred way to create objects (therefore, don't use 'new').
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
   * List "local" properties of an object (and return them as an array).
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

  /***************************************************************************
   * Functions 'loadDynamicFile', 'doLoading', and 'loadDynamically' are used 
   * to load JavaScript and CSS files dynamically. This saves the user from 
   * the trouble of specifying the files by hand (and inserting the required 
   * code into the HTML page).
   *
   * The function 'loadDynamically' sets the ball rolling; i.e. this function 
   * calls the other two functions. It is recommended that the other two 
   * functions are *not* called externally.
   *
   * The functions 'loadDynamicFile' and 'doLoading' call each other in a 
   * circular fashion.
   **************************************************************************/

  /**
   * Load the file at fileURL. (This variable is not used in this method, 
   * because the same value is found in one of properties of the 'props' 
   * object.)
   *
   * @param fileURL       The URL of the file to be loaded
   * @param props         An object which has the data necessary for creating 
   *                      a new element in the HEAD section of the document.
   * @param params        An object which has, among other things, the list of 
   *                      files pending loading. We feed this to the 
   *                      'doLoading' function.
   *
   * The following resource was used to aid in writing this function.
   * http://software.intel.com/en-us/blogs/2010/05/22/dynamically-load-javascript-with-load-completion-notification/
   */
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

  /**
   * If there are more files to load, create an object which has the necessary 
   * data to create a DOM element, and call 'loadDynamicFile'. Otherwise, call
   * the "finalizer" function to signal that all the desired files have been
   * loaded dynamically.
   */
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

      // No more files to load. Now it's time to call the "onready" function.

      if (typeof params.onready === 'function') {
        if (document.readyState === 'complete') {
          params.onready.call(null, params.config);
        } else {

          /*
           * TODO It would preferable if we could avoid using here any 
           * functions defined by Ext JS.
           */
          Ext.onReady(function() {
            params.onready.apply(null, params.config);
          }, null, true);
        }
      }
    }
  }; 
    
  /*
   * This is the "starting point" of loading files dynamically. You need to call 
   * this function on your HTML page (see fimmwidget.html for an example).
   *
   * You don't need to give this function any parameters. When called without 
   * parameters, a default list of files will be used. If you do call this function
   * with parameter(s), an ARRAY parameter will be used a list of files to be 
   * loaded, and an OBJECT parameter will be used as a configuration object which
   * will be feeded to the sequence viewer.
   *
   * You can give this function BOTH an array AND an object as parameters, but 
   * make sure the array parameter is the first parameter.
   */
  function loadDynamically(){

    var args = arguments;
    var isArray = fw.util.isArray;
    var restArgs = [];
    var defaultFiles = [
      "extjs/css/ext-all.css", 
      "extjs/js/ext-all.js", 
      "extjs/css/shared/example.css"
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
      // The function to call when all the files have been loaded
      onready: launch,

      // An object to give as parameter to 'onready' member function
      config: conf,

      // An array of files to load. Note that for efficiency reasons, we will
      // be popping files from the end.
      files: null
    };

    if (typeof files === 'string'){
      files = [files];
    }

    if (isArray(files) === true){
      // Reverse the file array so that we can remove them one at a time from 
      // the end in an efficient manner.
      files.reverse();
      params.files = files;
      doLoading(params);
    }
  }

  // Make 'loadDynamically' publicly available.
  fw.loadDynamically = loadDynamically;

  /**
   * Supplement the parameter object with the necessary properties (and 
   * assign a default value to them) if it doesn't already have them. 
   * The object returned will be used to configure the application.
   */
  function defaultConfig(config) {

    // TODO Should this object be moved outside the 'defaultConfig' function
    // so as to make sure it is initialized only once?
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

      // Id of the div element which contains the variant title.
      variantTitleDivId: Ext.id(),

      // Class name of the div element which contains the variant title.
      variantTitleDivClass: 'variant_title',

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

  /*
   * Create the necessary div elements on the HTML page.
   */
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

    // Create a div element for the variant title.
    container.createChild({
      tag: 'div', 
      id: conf.variantTitleDivId,
      cls: conf.variantTitleDivClass,
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
   * This function does the "heavy lifting" of variant search. It can be
   * called by pressing the search button, or by pressing the Enter key 
   * in the search text field.
   */
  function doSearch(appConfig) {
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

      fw.shared.geneName = geneName;
      (function(name) {
        var div = Ext.get(appConfig.variantTitleDivId);
        if (div.child('h2') !== null) {
          div.child('h2').remove();
        }
        div.createChild({
          tag: 'h2',
          html: name
        });
      }(geneName));

      store = Ext.create('Ext.data.Store', {
        pageSize: 10,
        model: 'Variant',
        autoLoad: true,
        remoteSort: true,
        proxy: {
          type: 'ajax',
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
          /*
           * This callback function is called whenever variants are selected 
           * or de-selected on the displayed grid.
           */
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
        // Toolbar
        tbar: [
          {
            text: 'Display',
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
                    // Callback for clicking the search button.
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
                          var marker = selected.variant.data.name.string;
                          var color = '00ff00';
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
                          conf.id = variant.locations[0].ref_seq.accession;
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
                          conf.mk = Ext.String.format('{0}:{1}|{2}|{3}',
                                                      start, end, marker, color);

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

    /*
     * Used for rendering values on the variant grid.
     */
    Ext.define('ValueRenderer', (function(base) {
      return {
        'renderVariantGenes': function(value, p, record) {
          if (value.length === 0) {
            return 'No variant genes';
          }
          if (value.length === 1) {
            var elem = value[0];
            return Ext.String.format('{0}', elem["accession"]);
          }
          return Ext.String.format('<b>{0}</b>', 'Details');
        },

        'renderName': function(value, p, record) {
          var name = Ext.htmlDecode(value['string']);
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

    /*
     * Class for the search box (with auto-completion).
     */
    Ext.define('GeneComboBox', {
      extend: 'Ext.form.field.ComboBox',
      alias: ['widget.gene-combobox'],

      constructor: function(cnfg) {
        this.callParent([cnfg]);
        this.initConfig(cnfg);
        this.store = Ext.create('GeneNameStore');
      },

      onRender: function() {
        this.callParent(arguments);
      }
    });

    /*
     * Class for the whole search component.
     */
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
          id: appConfig.geneSearchComboboxId,
          fieldLabel: 'Gene Name/symbol',
          value: 'AGL (amylo-alpha-1, 6-glucosidase, 4-alpha-glucanotransferase)',
          displayField: 'name',
          hideTrigger: true,
          multiSelect: false,
          width: 320,
          labelWidth: 130,
          queryMode: 'remote',
          enableKeyEvents: true,
          listeners: {
            keypress: {
              fn: function(combo, evnt){
                if (evnt.getKey() === 13) {
                  // Enter key was pressed.
                  doSearch(appConfig);
                }
              }
            }
          },
          minChars: 3,
          typeAhead: true,
          typeAheadDelay: 1000
        },
        {
          xtype: 'button',
          id: appConfig.geneSearchButtonId,
          text: 'Search',
          handler: function(){
            doSearch(appConfig);
          }
        }
      ]
    });

    // Fire up the application!
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

