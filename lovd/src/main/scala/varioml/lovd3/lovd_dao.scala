package varioml.lovd3
import anorm._
import anorm.SqlParser._
import anorm.Pk
import org.varioml.util._
import org.varioml.jaxb._
import scala.collection.immutable.List
import varioml.database._
import com.mysql.jdbc.Connection
import scala.collection.JavaConversions._

/*
 * http://www.underflow.ca/blog/606/scala-play-and-databases
 * 
 * note: implicit connection is given in package object 
 */
abstract class Dao(  val table : String) {
  
  def getPK( id: Pk[Long]): Pk[Long] = {
    if ( id.isDefined ) {
      return new Id(id.get) ;
    } else {
	    val pk: Long = SQL("select max(id) from "+table).as(scalar[Long].single)
	    return new Id(pk + 1);      
    }
  }
  
  

}
case class LovdAllele(val id: Pk[Long] = NotAssigned, name: String, 
    display_order: Boolean)  
	extends Dao("lovd_allele") 

object LovdAllele {

  //parser for all fields
  val simple = {
    get[Pk[Long]]("id") ~
      get[String]("name") ~
      get[Boolean]("display_order") map {
        case id ~ name ~ display_order => LovdAllele(id, name, display_order)
      }
  }
  def findAll(): Seq[LovdAllele] = {
    SQL("select * from lovd_alleles").as(LovdAllele.simple *)
  }
  def findById(id: Pk[Long]): LovdAllele = {
    SQL("select * from lovd_alleles id = {id}").on('id -> id.get).using(LovdAllele.simple).single()
  }
  def findByUniqueName(name: String): Option[LovdAllele] = {
    SQL("select * from lovd_alleles where name = {name}").on('name -> name).using(LovdAllele.simple).singleOpt()
  }
  def getNextPK(): Pk[Long] = {
    val pk: Long = SQL("select max(id) from lovd_alleles").as(scalar[Long].single)
    return new Id(pk + 1);
  }

  def create(allele: LovdAllele): LovdAllele = {
    val id = allele.getPK(allele.id).get;
    val res = SQL("insert into lovd_alleles(id,name, display_order) values ({id},{name}, {display_order})").on(
      'id -> id,
      'name -> allele.name,
      'display_order -> allele.display_order).executeUpdate()
    return LovdAllele(id = Id(id), name = allele.name, display_order = allele.display_order)
  }

  def main(args: Array[String]) {

    findAll() foreach ((l) => {
      Console.println(l.id, l.name, l.display_order)
    })

    val a = LovdAllele(name = "test2", display_order = true)
    val b = findByUniqueName("Both (homozygous)")
    //create(a)
    if (b.isDefined) {
      println(b.get.name)
    }
  }
}


