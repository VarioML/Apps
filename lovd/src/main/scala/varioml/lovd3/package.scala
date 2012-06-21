package varioml
import varioml.database._

package object lovd3 {

    implicit val connection = 
      Database.getConnection("jdbc:mysql://127.0.0.1:1111/lovd?user=lovd&password=genx12", "com.mysql.jdbc.Driver")
      //todo take from config... is the pkg object best place for this?

}
