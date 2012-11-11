package examples
import com.codahale.logula.Logging
import org.apache.log4j.Level

class A {

}
class Test extends A with Logging {

  def test = {
    log.info("info")

  }
}

object TestMe extends Logging {

  def main(args: Array[String]) {

    Logging.configure {
      log =>
        log.registerWithJMX = true
        log.level = Level.ALL
        log.loggers("variomlws") = Level.OFF
        log.console.enabled = true
        log.console.threshold = Level.ALL

        log.file.enabled = true
        log.file.filename = "example-logging-run.log"
        log.file.threshold = Level.ALL

        log.syslog.enabled = false
        log.syslog.host = "localhost"
        log.syslog.facility = "LOCAL7"

    }
    println("Testing..")
    val t = new Test()
    t.test
    log.debug("hello")

    log.trace("Contemplating doing a thing.")
    log.debug("About to do a thing.")
    log.info("Doing a thing")
    log.warn("This may get ugly.")

    Console.flush()
  }

}