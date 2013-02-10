SeqViewDemo
===========

This is a webserver (implemented using [Jetty](http://www.eclipse.org/jetty/))
and a graphical user interface (implented using [Ext JS](http://www.sencha.com/products/extjs/))
for browsing gene variants. Interface to [NCBI Sequence Viewer](http://www.ncbi.nlm.nih.gov/projects/sviewer/)
is also provided.

How to run the server
---------------------

To launch the web server, run src/network/ServerApplication.java as "Java application." 
The server reads options from the file "app.config" and from the command line. The default 
port is 8080. When the server is running, browse to 
  [localhost](http://localhost:8080/fimmwidget.html).

The code depends on the following jar files:
  * VarioML.jar"
  * commons-codec-1.6.jar"
  * commons-logging-1.1.1.jar"
  * fluent-hc-4.2.1.jar"
  * httpclient-4.2.1.jar"
  * httpclient-cache-4.2.1.jar"
  * httpcore-4.2.1.jar"
  * httpmime-4.2.1.jar"
  * jackson-all-1.9.9.jar"
  * javax.servlet-api-3.0.1.jar"
  * jetty-all-7.6.5.v20120716.jar"
  * mongo-2.8.0.jar"
  * mongo-jackson-mapper-1.4.2.jar"
  * servlet-api-2.5.jar"
  * orient-commons-1.2.0.jar
  * orientdb-core-1.2.0.jar

note: code moved from https://github.com/tuope/SeqViewDemo.git
UTF-8 is used in Java files
