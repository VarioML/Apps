name := "lovd"

resolvers += "Typesafe repository" at "http://repo.typesafe.com/typesafe/releases/"

resolvers += "Play Ivy Repo" at "http://download.playframework.org/ivy-releases/"

scalaVersion := "2.9.1"


libraryDependencies ++= Seq(
 "play" %% "anorm" % "2.0",
 "mysql" % "mysql-connector-java" % "5.1.12",
 "org.scalatest" %% "scalatest" % "1.8" % "test"
)


//# eclips plugin:
//#  ~/.sbt/plugins/build.sbt
//# 
//#resolvers += Classpaths.typesafeSnapshots
//#addSbtPlugin("com.typesafe.sbteclipse" % "sbteclipse-plugin" % "2.1.0-SNAPSHOT")


