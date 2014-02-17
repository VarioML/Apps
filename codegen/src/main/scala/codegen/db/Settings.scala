package codegen.db
import java.sql.Driver
import java.sql.DriverManager
import com.typesafe.config.ConfigFactory
import scala.slick.jdbc.JdbcBackend.Database

object Settings {

  val conf = ConfigFactory.load()

  def getString(par: String): String = {
    assert(conf.hasPath(par), "property " + par + " do not exist. Config: ")
    val value = conf.getString(par)
    assert(value != null && !value.isEmpty(), "check configuration file. Property " + par + " not found")
    return value
  }
  def isDefined(par: String) = {
    conf.hasPath(par)
  }

  def db(configRoot: String): Database = {
    val password = Settings.getString(configRoot + ".password")
    val user = Settings.getString(configRoot + ".user")
    val url = Settings.getString(configRoot + ".url")
    val driverStr = Settings.getString(configRoot + ".driver")
    val driver = Class.forName(driverStr).newInstance().asInstanceOf[Driver]
    DriverManager.registerDriver(driver);
    Database.forDriver(driver, url, user, password)
  }

}
