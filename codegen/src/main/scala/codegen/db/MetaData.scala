package codegen.db
import scala.collection.JavaConversions._
import scala.slick.jdbc.meta.MProcedure
import scala.slick.jdbc.meta.MTable
import scala.slick.jdbc.meta.MQName
import scala.slick.jdbc.JdbcBackend.Database
import scala.slick.jdbc.meta.MSchema

/*
 * Simple wrapper for Slicks's metadata object
 */ 
case class Column(name: String, typeName: String)
case class Table(qname: QName, tableType: String, columns: List[Column]) {
  val name = qname.name;
}
case class Procedure(name: String, columns: List[Column])
case class Schema(name: String, tables: List[Table], procedures: List[Procedure])
case class QName(catalog: Option[String], schema: Option[String], name: String)


class MetaData(configRoot: String) {

  val DB = Settings.db(configRoot)
  
  implicit def mqname2qname(mqname: MQName): QName = {
    QName(mqname.catalog, mqname.schema, mqname.name)
  }

  def getSchema(schemaName: String): Schema = {

    val dbSchema = MSchema.getSchemas(None, Option(schemaName))

    val tables = DB withTransaction {
      implicit s =>
        val tables = MTable.getTables(None, Option(schemaName), None, None).list()(s)
        for (t <- tables) yield {
          val columns = for (c <- (t.getColumns.list()))
            yield (Column(c.name, c.typeName))
        	  Table(t.name, t.tableType, columns)            
        }
    }
    val procedures = DB withTransaction {
      implicit s =>
        val procedures = MProcedure.getProcedures(new MQName(None, Option(schemaName), "%")).list()(s)
        for (t <- procedures) yield {
          val columns = for (c <- (t.getProcedureColumns("%").list()))
            yield (Column(c.specificName.get, c.typeName))
          Procedure(t.name.name, columns)
        }
    }

    Schema(schemaName, tables, procedures)
  }

  def printSchema(schema: Schema) {
    val out = Console.out
    out.println(schema.name)
    schema.procedures foreach {
      p =>
        out.println(" " + p.name)
        p.columns foreach {
          c =>
            out.print("  " + c.name + "(" + c.typeName + ")")
        }
        out.println()
    }
  }

}

object MetaData {
  val m = MetaData("db")

  def apply(name: String) = new MetaData(name)

  def main(args: Array[String]) {

    m.DB withSession {
      implicit s =>
        MSchema.getSchemas().list()(s).foreach {
          t =>
            println("NAME " + t.catalog + " " + t.schema)
            MTable.getTables(None, Option(t.schema), None, None).list()(s).foreach {
              t =>
                println(" TABLE: " + t.name)
                t.getColumns foreach {
                  c =>
                    println("   " + c.name + " " + c.typeName)
                }
            }
        }
    }

  }
}