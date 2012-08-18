package test;

import java.util.List;
import java.util.Set;

import org.bson.BSON;
import org.variodb.mongo.MongoUtil;
import org.varioml.jaxb.CafeVariome;
import org.varioml.jaxb.Variant;

import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;

public class TestMongo {

	
	public static void main(String[] args) throws Exception {
		
		MongoUtil util = new MongoUtil();
		
		Mongo m = new Mongo( "localhost" );
		DB db = m.getDB( "test" );
		Set<String> colls = db.getCollectionNames();
		for (String s : colls) {
		    System.out.println(s);
		}
		DBCollection collection = db.getCollection("uusix");
		collection.drop() ;
		
		CafeVariome cafeVariome  = (CafeVariome)util.readEXI("schema/cafe_variome.xsd", "data/1KG.exi",CafeVariome.class);
		List<Variant> variants = cafeVariome.getVariantList();
		for (Variant variant : variants) {
			DBObject obj = util.insert(collection, variant);
		}
		DBCursor cursor = collection.find();
        try {
            while(cursor.hasNext()) {
                DBObject v = cursor.next();
                Variant _v = (Variant)util.encode(v, Variant.class);
                System.err.println(_v.getName().getString()+" JSON: "+((DBObject)v.get("name")).get("string"));
            }
        } finally {
            cursor.close();
        }


		
	}
}
