package varioml.database
 

object Database {
  
  
  import java.sql.{DriverManager, Connection}

  private var driverLoaded = false

  private def loadDriver( driver : String)  {
    try{
      Class.forName( driver).newInstance
      driverLoaded = true
    }catch{
      case e: Exception  => {
        println("ERROR: Driver not available: " + e.getMessage)
        throw e
      }
    }
  }

  def getConnection(connectionStr : String, driver: String ): Connection =  {
    // Only load driver first time
    this.synchronized {
      if(! driverLoaded) loadDriver( driver)
    }

    // Get the connection
    try{
      DriverManager.getConnection(connectionStr)
    }catch{
      case e: Exception  => {
        println("ERROR: No connection: " + e.getMessage)
        throw e
      }
    }
  }

}

