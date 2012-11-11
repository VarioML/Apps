package examples
import org.varioml.util.Util
import java.net.URL
import java.io.BufferedReader
import org.varioml.jaxb.CafeVariome
import java.io.InputStreamReader

object TestVarioML {

  def main(args: Array[String]) {
	  
    	val u = new Util(); 
		
		val url1 = new URL("https://raw.github.com/VarioML/VarioML/master/xml/cafe_variome/examples/alamut_example.xml");
		val url2 = new URL("https://raw.github.com/VarioML/VarioML/master/xml/cafe_variome/examples/cafe_variome_example.xml");
		val in = new BufferedReader( new InputStreamReader(url1.openStream()));
		
		val cv1 = u.readXML("schema/cafe_variome.xsd", url1.openStream(), classOf[CafeVariome]);
		u.writeJSON("data/alamut_example.json", cv1);
		val cv2 = u.readXML("schema/cafe_variome.xsd", url2.openStream(), classOf[CafeVariome]);
		u.writeJSON("data/cafe_variome_example.json", cv2);
		u.writeBSON("data/cafe_variome_example.bson", cv2);
		val cv3 = u.readJSON("data/cafe_variome_example.json",classOf[CafeVariome])
		u.writeXML("data/cafe_variome_example.xml", cv2);
		u.writeEXI("schema/cafe_variome.xsd","data/cafe_variome_example.exi", cv3);
		val cv4 = u.readEXI("schema/cafe_variome.xsd","data/cafe_variome_example.exi",classOf[CafeVariome])
		u.writeXML("data/cafe_variome_example.tmp", cv4);

  }
}