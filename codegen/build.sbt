name := "codegen"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  "org.freemarker" % "freemarker" % "2.3.20",
  "postgresql" % "postgresql" % "9.1-901.jdbc4",
  "com.typesafe" % "config" % "1.0.0",
  "com.typesafe.slick" % "slick_2.10" % "2.0.0" 
)     

resolvers ++= Seq(
  "Typesafe Repository" at "http://repo.typesafe.com/repo/typesafe",
  "Typesafe" at "http://repo.typesafe.com/typesafe/repo",
  "repo.codahale.com" at "http://repo.codahale.com",
  "Scala Tools Snapshots" at "http://scala-tools.org/repo-snapshots/",
  "Sonatype releases"  at "http://oss.sonatype.org/content/repositories/releases"
)

EclipseKeys.createSrc := EclipseCreateSrc.Default + EclipseCreateSrc.Resource

resolvers += "Local Maven Repository" at "file:///"+Path.userHome+"/.m2/repository"


