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
            var store, data, win;

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

              /*
               * 2012-11-08:
               * This hard-coded data was added for demonstration 
               * purposes (no MongoDB database is needed to run the 
               * website).
               *
               * It remains a mystery why the grid stopped supporting
               * paging after data was made hard-coded.
               */
              data = {
                'variants': 
                  [ 
                    {
                      "id" : "50710ffb0364faf736de5ce2",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.-288C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0061
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0155
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0029
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100315752C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100315752,
                        "end" : 100315752
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce3",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.-244C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0060
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0183
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0026
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0054
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0050
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0258
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0067
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0053
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100315796C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100315796,
                        "end" : 100315796
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce4",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.-46G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100316553G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100316553,
                        "end" : 100316553
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce5",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.-10A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.4299
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.248
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4724
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5262
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4551
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4647
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4031
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4301
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5357
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6082
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4775
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.49
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2102
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2268
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3361
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4545
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4727
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4917
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.4352
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.425
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100316589A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100316589,
                        "end" : 100316589
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce6",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.112A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0151
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.065
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0739
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0464
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.082
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0105
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0194
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100327088A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100327088,
                        "end" : 100327088
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce7",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.188G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100327164G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100327164,
                        "end" : 100327164
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce8",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.207T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0147
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0166
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0343
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0176
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0968
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0364
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0171
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100327183T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100327183,
                        "end" : 100327183
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ce9",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.241T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0035
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0050
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100327217T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100327217,
                        "end" : 100327217
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5cea",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.256C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100327232C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100327232,
                        "end" : 100327232
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ceb",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.341G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100327860G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100327860,
                        "end" : 100327860
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5cec",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.609A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0055
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0152
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100330090A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100330090,
                        "end" : 100330090
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5ced",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.622T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100330103T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100330103,
                        "end" : 100330103
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5cee",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.686A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0371
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.065
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0608
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0315
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0119
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0294
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0112
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0309
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0337
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.03
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0909
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.067
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0246
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0909
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0545
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0333
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0429
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0317
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100335977A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100335977,
                        "end" : 100335977
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5cef",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.841A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100336132A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100336132,
                        "end" : 100336132
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf1",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.927G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100336394G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100336394,
                        "end" : 100336394
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffb0364faf736de5cf0",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.894C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.7418
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.9533
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7017
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6783
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6715
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6235
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6327
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7247
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6989
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7143
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7268
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6573
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.65
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 1.0
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.9485
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.8934
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7045
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7182
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6833
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.74
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.7434
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100336361C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100336361,
                        "end" : 100336361
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf2",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.968G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0027
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0054
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0258
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0035
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100340252G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100340252,
                        "end" : 100340252
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf3",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1119G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100340746G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100340746,
                        "end" : 100340746
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf4",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1155G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0133
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0166
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0303
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0176
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0806
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0273
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0167
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0143
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100340782G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100340782,
                        "end" : 100340782
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf5",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1160G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0563
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0061
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0912
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1469
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0040
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0054
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1649
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1236
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.15
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0246
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1591
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0727
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0333
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0571
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0556
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100340787G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100340787,
                        "end" : 100340787
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf6",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1218T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100340946T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100340946,
                        "end" : 100340946
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf7",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1319C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100342049C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100342049,
                        "end" : 100342049
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf8",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1480C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100343253C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100343253,
                        "end" : 100343253
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cf9",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1481G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0046
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0119
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0204
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0112
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0161
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0029
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0062
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100343254G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100343254,
                        "end" : 100343254
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cfa",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1503C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100343276C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100343276,
                        "end" : 100343276
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cfb",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1537A>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100343310A>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100343310,
                        "end" : 100343310
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cfc",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1694A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100345561A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100345561,
                        "end" : 100345561
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cfd",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1759C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346211C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346211,
                        "end" : 100346211
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cfe",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1810T>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0061
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346262T>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346262,
                        "end" : 100346262
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5cff",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1858C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346310C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346310,
                        "end" : 100346310
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d00",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1875G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0040
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346327G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346327,
                        "end" : 100346327
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d01",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1885G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0023
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0155
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0026
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346337G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346337,
                        "end" : 100346337
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d02",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1908A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0054
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346640A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346640,
                        "end" : 100346640
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d03",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1973G>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346705G>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346705,
                        "end" : 100346705
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d04",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.1979A>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346711A>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346711,
                        "end" : 100346711
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d05",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2004T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346850T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346850,
                        "end" : 100346850
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d06",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2088C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0061
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346934C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346934,
                        "end" : 100346934
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d07",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2101G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100346947G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100346947,
                        "end" : 100346947
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d08",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2390A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0055
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0152
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0026
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100349757A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100349757,
                        "end" : 100349757
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d09",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2486A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100349947A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100349947,
                        "end" : 100349947
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d0a",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2522C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0027
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0040
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0054
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0182
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0048
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100349983C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100349983,
                        "end" : 100349983
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d0b",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2670T>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100350248T>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100350248,
                        "end" : 100350248
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d0c",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2683C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100353535C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100353535,
                        "end" : 100353535
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d0d",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2802A>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0027
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0122
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0164
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0038
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100353654A>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100353654,
                        "end" : 100353654
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d0e",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2856G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100356819G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100356819,
                        "end" : 100356819
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d0f",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2883A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0081
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0114
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0164
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100356846A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100356846,
                        "end" : 100356846
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d10",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2885C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0124
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0528
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0511
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0567
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0492
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0095
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.015
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100356848C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100356848,
                        "end" : 100356848
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d11",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.2930G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0035
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0112
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100356893G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100356893,
                        "end" : 100356893
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d12",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3199C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.1085
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1402
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1188
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0227
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1478
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0882
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1888
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1573
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1505
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1429
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0206
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0393
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.01
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1932
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1186
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0984
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1364
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1091
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.1048
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.112
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100358103C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100358103,
                        "end" : 100358103
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d13",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3203A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0061
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0155
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100358107A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100358107,
                        "end" : 100358107
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d14",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3290G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100361872G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100361872,
                        "end" : 100361872
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d15",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3343G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.1021
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0061
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1381
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2028
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0712
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0941
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0612
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0393
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0968
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0357
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2062
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.264
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.145
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1742
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0909
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1417
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.1048
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0996
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100361925G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100361925,
                        "end" : 100361925
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d16",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3384G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0081
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0114
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0164
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100366213G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100366213,
                        "end" : 100366213
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d17",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3431T>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0026
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0118
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100366260T>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100366260,
                        "end" : 100366260
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d18",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3454G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0050
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100366283G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100366283,
                        "end" : 100366283
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d19",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3486G>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100366315G>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100366315,
                        "end" : 100366315
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d1a",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3543A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100366372A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100366372,
                        "end" : 100366372
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d1b",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3550C>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100366379C>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100366379,
                        "end" : 100366379
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d1c",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3619G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0069
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0305
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0284
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0464
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0079
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100368269G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100368269,
                        "end" : 100368269
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d1d",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3668G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0050
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100368318G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100368318,
                        "end" : 100368318
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffc0364faf736de5d1e",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3683G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100368333G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100368333,
                        "end" : 100368333
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d1f",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3696C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100368346C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100368346,
                        "end" : 100368346
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d20",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3758G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0092
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0332
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0619
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0112
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.025
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0106
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100376325G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100376325,
                        "end" : 100376325
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d21",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3764A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0050
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0224
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0114
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0464
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0026
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100376331A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100376331,
                        "end" : 100376331
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d22",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3792A>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100376359A>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100376359,
                        "end" : 100376359
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d23",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3822C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0081
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0206
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0026
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100376389C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100376389,
                        "end" : 100376389
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d24",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3849T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0133
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0166
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0303
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0176
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0806
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0273
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0167
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0143
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100377973T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100377973,
                        "end" : 100377973
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d25",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.3917T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100378041T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100378041,
                        "end" : 100378041
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d26",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4027G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0070
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0112
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0026
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100379160G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100379160,
                        "end" : 100379160
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d27",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4052A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100379185A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100379185,
                        "end" : 100379185
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d28",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4077T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100379210T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100379210,
                        "end" : 100379210
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d29",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4088A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100379221A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100379221,
                        "end" : 100379221
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d2a",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4263T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100381969T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100381969,
                        "end" : 100381969
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d2b",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4331A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0114
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100382037A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100382037,
                        "end" : 100382037
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d2c",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4430C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0073
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0325
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0341
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0464
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0086
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0062
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100382236C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100382236,
                        "end" : 100382236
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d2d",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4450G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0114
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100382256G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100382256,
                        "end" : 100382256
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d2e",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.4460G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0050
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100382266G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100382266,
                        "end" : 100382266
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d2f",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*181A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0051
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387388A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387388,
                        "end" : 100387388
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d30",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*240T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0057
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387447T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387447,
                        "end" : 100387447
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d31",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*272G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.3755
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0894
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4807
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5734
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3615
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3882
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.301
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3989
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3548
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4286
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6082
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5955
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.52
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0341
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0825
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1803
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5833
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3909
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.45
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.3781
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.373
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387479G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387479,
                        "end" : 100387479
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d32",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*459T>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0014
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0227
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387666T>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387666,
                        "end" : 100387666
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d33",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*575G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0133
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0569
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1023
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0206
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0492
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0143
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387782G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387782,
                        "end" : 100387782
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d34",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*604A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0055
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387811A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387811,
                        "end" : 100387811
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d35",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*732C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.6383
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5589
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6796
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6503
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6609
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6353
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6173
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.691
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7043
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6429
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6959
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.7079
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.555
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6023
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5515
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5082
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.75
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6182
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6583
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.64
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.6367
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387939C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387939,
                        "end" : 100387939
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d3a",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1038C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388245C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388245,
                        "end" : 100388245
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d36",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*739A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0133
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0166
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0303
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0176
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0806
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0273
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0167
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0143
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100387946A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100387946,
                        "end" : 100387946
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d37",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*832G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0040
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0054
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388039G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388039,
                        "end" : 100388039
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d38",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*960_*962delATG"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0133
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0166
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0303
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0176
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0102
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0806
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0273
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0167
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0143
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388167_100388169delATG"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388167,
                        "end" : 100388169
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d39",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1028C>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.5188
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4045
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5635
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5944
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5145
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5471
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4388
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5281
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5538
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6134
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6573
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.52
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4034
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4072
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4016
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6288
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.55
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.5257
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.5123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388235C>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388235,
                        "end" : 100388235
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d3b",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1103A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0013
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0059
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388310A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388310,
                        "end" : 100388310
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d3c",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1232G>T"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388439G>T"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388439,
                        "end" : 100388439
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d3d",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1244T>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0133
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0569
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0028
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1023
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0206
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0492
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0143
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0123
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388451T>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388451,
                        "end" : 100388451
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d3e",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1296A>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.4231
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.1931
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5055
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5682
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4235
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4412
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3776
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4775
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3978
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4643
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6082
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5899
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.51
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.142
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2113
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2377
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6061
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4182
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.475
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.4267
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.4198
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388503A>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388503,
                        "end" : 100388503
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d3f",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1434T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388641T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388641,
                        "end" : 100388641
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d40",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1541T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.4501
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3008
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5083
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5769
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4235
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4412
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3776
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4775
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3978
                      }, {
                        "samples" : 28,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "IBS",
                          "term" : "Iberian population in Spain",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4643
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6082
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.5955
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.53
                      }, {
                        "samples" : 176,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "YRI",
                          "term" : "Yoruba in Ibadan, Nigera",
                          "type" : "ethnic"
                        },
                        "freq" : 0.2955
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.299
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.3115
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.6061
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4182
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.4833
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.459
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.4418
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388748T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388748,
                        "end" : 100388748
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d41",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1553T>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0041
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "LWK",
                          "term" : "Luhya in Webuye, Kenya",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388760T>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388760,
                        "end" : 100388760
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d42",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1581G>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0070
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.015
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0029
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388788G>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388788,
                        "end" : 100388788
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d43",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1610T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0055
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0182
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388817T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388817,
                        "end" : 100388817
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d44",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1739C>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 5.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100388946C>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100388946,
                        "end" : 100388946
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d45",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1936A>G"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0018
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0070
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 200,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHS",
                          "term" : "Southern Han Chinese",
                          "type" : "ethnic"
                        },
                        "freq" : 0.015
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0026
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100389143A>G"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100389143,
                        "end" : 100389143
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d46",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1953G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0035
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "JPT",
                          "term" : "Japanese in Tokyo, Japan",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100389160G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100389160,
                        "end" : 100389160
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d47",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*1971T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0035
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0103
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0010
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 9.0E-4
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100389178T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100389178,
                        "end" : 100389178
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d48",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*2058G>A"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0060
                      }, {
                        "samples" : 492,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AFR",
                          "term" : "African",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0020
                      }, {
                        "samples" : 362,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "AMR",
                          "term" : "Ad Mixed American",
                          "type" : "ethnic"
                        },
                        "freq" : 0.011
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0106
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0235
                      }, {
                        "samples" : 196,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "TSI",
                          "term" : "Toscani in Italia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0153
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0056
                      }, {
                        "samples" : 122,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASW",
                          "term" : "Americans of African Ancestry in SW USA ",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0082
                      }, {
                        "samples" : 132,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "MXL",
                          "term" : "Mexican Ancestry from Los Angeles USA",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0152
                      }, {
                        "samples" : 110,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "PUR",
                          "term" : "Puerto Ricans from Puerto Rico",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0091
                      }, {
                        "samples" : 120,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CLM",
                          "term" : "Colombians from Medellin, Colombia",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0083
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0076
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0044
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100389265G>A"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100389265,
                        "end" : 100389265
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    }, {
                      "id" : "50710ffd0364faf736de5d49",
                      "uri" : "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000162688",
                      "genes" : [ {
                        "accession" : "AGL",
                        "source" : "hgnc.symbol"
                      } ],
                      "ref_seq" : {
                        "accession" : "NM_000642.2",
                        "source" : "refseq"
                      },
                      "name" : {
                        "scheme" : "HGVS",
                        "string" : "c.*2060T>C"
                      },
                      "panels" : [ {
                        "id" : "1000genomes"
                      } ],
                      "frequencies" : [ {
                        "samples" : 2184,
                        "type" : "allele",
                        "populations" : {
                          "term" : "All samples",
                          "type" : "group"
                        },
                        "freq" : 0.0037
                      }, {
                        "samples" : 572,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "ASN",
                          "term" : "East Asian",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0017
                      }, {
                        "samples" : 758,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "EUR",
                          "term" : "European",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0092
                      }, {
                        "samples" : 170,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CEU",
                          "term" : "Utah Residents (CEPH) with Northern and Western European ancestry",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0118
                      }, {
                        "samples" : 178,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "GBR",
                          "term" : "British in England and Scotland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0169
                      }, {
                        "samples" : 186,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "FIN",
                          "term" : "Finnish in Finland",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0108
                      }, {
                        "samples" : 194,
                        "type" : "allele",
                        "populations" : {
                          "accession" : "CHB",
                          "term" : "Han Chinese in Bejing, China",
                          "type" : "ethnic"
                        },
                        "freq" : 0.0052
                      }, {
                        "samples" : 1050,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Males",
                          "type" : "group"
                        },
                        "freq" : 0.0019
                      }, {
                        "samples" : 1134,
                        "type" : "allele",
                        "populations" : {
                          "term" : "Females",
                          "type" : "group"
                        },
                        "freq" : 0.0053
                      } ],
                      "aliases" : {
                        "variants" : [ {
                          "ref_seq" : {
                            "accession" : "NC_000001.10",
                            "source" : "refseq"
                          },
                          "name" : {
                            "scheme" : "HGVS",
                            "string" : "g.100389267T>C"
                          }
                        } ]
                      },
                      "locations" : [ {
                        "ref_seq" : {
                          "accession" : "NC_000001.10",
                          "source" : "refseq"
                        },
                        "start" : 100389267,
                        "end" : 100389267
                      } ],
                      "sharing_policy" : {
                        "type" : "openAccess"
                      }
                    } 
                  ]
              };

              store = Ext.create('Ext.data.Store', {
                model: 'Variant',
                data: data,
                proxy: {
                  type: 'memory',
                  reader: {
                    type: 'json',
                    root: 'variants',
                    totalProperty: data.variants.length
                    //totalProperty: 'totalCount'
                  }
                },
                pageSize: 10,
                autoLoad: true,
                /*
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
                */
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
                                  //conf.id = variant.ref_seq.accession;
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
                                    win = window.open('seqviewer.html', 
                                                      '_blank');
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

