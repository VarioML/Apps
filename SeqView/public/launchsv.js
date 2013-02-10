window.show_sequence_viewer = function(conf){
  var divId = "seqviewer01";
  var app, div, body, link;
  if (document.readyState === 'complete') {
    div = Ext.get(divId);
    if (div){
      div.remove();
      body = Ext.getBody();
      body.createChild({ tag: 'div', id: divId });
    }
    link = "?embedded=panorama&appname=FimmWidget";
    link += "&id=".concat(conf.id);
    link += "&v=".concat(conf.start);
    link += ":".concat(conf.end);
    for (var p in conf) {
      if (p === 'id' || p === 'start' || p === 'end') {
        continue;
      }
      if (conf.hasOwnProperty(p)) {
        link = link.concat('&'.concat(p.concat("=" + conf[p])));
      }
    }
    app = new SeqView.App(divId);
    app.load(link);
  }
};

