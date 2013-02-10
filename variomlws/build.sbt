name  := "variomlws"

version  := "1.0-SNAPSHOT"

retrieveManaged := false

resolvers ++= Seq(
        "Novus Releases" at "http://repo.novus.com/releases/",
        "BioJava" at "http://www.biojava.org/download/maven",
        "Jensembl" at "http://jensembl.sourceforge.net/m2-repo",
        "Typesafe Repository" at "http://repo.typesafe.com/repo/typesafe",
        "Typesafe" at "http://repo.typesafe.com/typesafe/repo",
        "restlet" at "http://maven.restlet.org/",
        "repo.codahale.com" at "http://repo.codahale.com",
        "Scala Tools Snapshots" at "http://scala-tools.org/repo-snapshots/",
        "Sonatype releases"  at "http://oss.sonatype.org/content/repositories/releases"
)

//https://github.com/harrah/xsbt/wiki/Getting-Started-Library-Dependencies

libraryDependencies ++= Seq(
        "org.slf4j" % "slf4j-log4j12" % "1.6.6" ,
        "commons-logging" % "commons-logging" % "1.1.1",
        "org.restlet.jse" % "org.restlet" % "2.1.0",
        "org.restlet.jse" % "org.restlet.ext.fileupload" % "2.1.0",
        //"org.biojava" % "biojava" % "3.0.4",
        "uk.ac.roslin" % "ensembl-data-access" % "1.14",
	"uk.ac.roslin" % "ensembl-config" % "1.69",
        //"commons-fileupload" % "commons-fileupload" % "1.2.2",
     	"javax.activation" % "activation" %  "1.1.1",
	"javax.mail" %  "mail" % "1.4.5",
	"org.apache.axis"  % "axis"  % "1.4",
	"org.apache.axis" % "axis-jaxrpc" % "1.4",
	"commons-discovery" %  "commons-discovery" % "0.4",
	"wsdl4j" %"wsdl4j" % "1.6.2",
	"com.typesafe" % "config" % "1.0.0",
        "org.codehaus.jackson" % "jackson-core-lgpl" %  "1.9.9",
        "org.codehaus.jackson" % "jackson-xc" %  "1.9.9",
        "org.codehaus.jackson" % "jackson-mapper-lgpl" %  "1.9.9",
	"de.undercouch" %  "bson4jackson" % "1.3.0",
//	"xerces" % "xercesImpl" % "2.11.0",
	"joda-time" % "joda-time" % "2.1",
        "com.codahale" % "logula_2.9.1" % "2.1.3"
)


