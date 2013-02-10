
package variomlws.tools

import variomlws.util.FileUtil
import variomlws.util.MutaBatchExecutor
import org.varioml.ws.jaxb.MutalyzerResults
import org.varioml.ws.jaxb.BatchError
import org.varioml.jaxb.Variant
import org.varioml.jaxb.VariantName
import org.varioml.jaxb.RefSeq
import org.varioml.jaxb.Aliases
import org.varioml.util.Util
import org.varioml.jaxb.Location
class HGVSVariantGenerator(data: Array[Byte], process: String, argument: String) {

  def stringToHgvsName(name: String): (VariantName, RefSeq) = {
    val v = new VariantName()
    val r = new RefSeq()
    val m = """^(\S[^:]+):(\S+)""".r
    val m(refseq, rest) = name;
    v.setScheme("HGVS")
    v.setString(rest)
    r.setSource("refseq")
    r.setAccession(refseq)
    return (v, r)
  }
  def processMutalyzerBatchData(): MutalyzerResults = {
    val exe = new MutaBatchExecutor();
    val res = exe.executeAndWait(data, process, argument);

    val errorRegEx = """^(chr\S+)[^(]+\(([^\)]+)\):(.+)$""".r
    val okRegEx = """^chr([^:]+):(\S+)\s+(.+)$""".r
    val locationRegEx = """^[a-zA-Z]+\.(\d+)_?(\d+)?\S*""".r
    val mutres = new MutalyzerResults()
    
    res split ("\\n") foreach ((l) => {
      l match {
        case errorRegEx(mut, error, rest) => {
          //println( mut,error,rest)
          val e = new BatchError(mut, error, rest)
          mutres.addBatchError(e)
        }
        case okRegEx(chr, genomic, cdnas) => {
          val mainVar = new Variant()
          val names = cdnas split ("\\s+")
          assert(names.size > 0)
          println(chr+" "+genomic)
          val locationRegEx(start,end) = genomic;
          if ( start != null ) {
            val loc = new Location()
            loc.setChr(chr)
            loc.setStart(start.toInt)
            val refSeq = new RefSeq()
            refSeq.setAccession(argument)
            loc.setRefSeq(refSeq) // should probably use chromosomal sequence
            if ( end != null) {
              loc.setEnd(end.toInt)
            }
            mainVar.addLocation(loc)
          }
          mainVar.setType("DNA")
          val name = stringToHgvsName(names(0))
          mainVar.setName(name._1)
          mainVar.setRefSeq(name._2)
          val aliases = new Aliases()
          names.tail.foreach((n) => {
            val alias = new Variant()
            val name = stringToHgvsName(n)
            alias.setName(name._1)
            alias.setRefSeq(name._2)
            alias.setType("DNA")
            aliases.addVariant(alias)
          })
          if (aliases.getVariantList() != null)
            mainVar.setAliases(aliases)
          mutres.addVariant(mainVar)
        }
        case _ => {
          //println(l) //error.. we het header here
        }
      }
    })
    return mutres;
  }

}

object HGVSVariantGenerator {

  def apply(data: Array[Byte], process: String, argument: String) = new HGVSVariantGenerator(data, process, argument);

  def main(args: Array[String]) {

    val util = new Util()
    val data = FileUtil.readData("data/mutalyzer_batch.txt");
    val process = "PositionConverter";
    val argument = "hg19";

    val gen = HGVSVariantGenerator(data, process, argument)

    val res = gen.processMutalyzerBatchData()
    util.writeXML("schema/variomlws.xsd","data/mutalyzer_out.xml", res)
    util.writeEXI("schema/variomlws.xsd","data/mutalyzer_out.exi", res)    
    util.writeJSON("data/mutalyzer_out.json", res)
    val tmp = util.readXML("schema/variomlws.xsd","data/mutalyzer_out.xml", classOf[MutalyzerResults])
    util.writeJSON("data/mutalyzer_out_2.json", tmp)
    
  }
}