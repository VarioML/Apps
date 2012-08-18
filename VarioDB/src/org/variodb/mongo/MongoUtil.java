package org.variodb.mongo;

import org.bson.BSON;
import org.bson.types.ObjectId;
import org.varioml.jaxb.Variant;
import org.varioml.util.Util;

import com.mongodb.DBCollection;
import com.mongodb.DBDecoder;
import com.mongodb.DBObject;
import com.mongodb.DefaultDBDecoder;

public class MongoUtil  extends Util {

	DBDecoder decoder = DefaultDBDecoder.FACTORY.create();

	protected ObjectId generateId() {
		return new ObjectId();
	}

	public DBObject insert(DBCollection collection, Object variomlObject) {

		DBObject d = decoder.decode(toBSON4MONGO(variomlObject),
				collection);
		ObjectId id = generateId();
		d.put("_id", id);
		collection.insert(d);
		return d;
	}

	public Object encode(DBObject dbObject, Class variomlClass) {
		//dbObject.removeField("_id");
		Object _v = toVarioML(BSON.encode(dbObject), variomlClass,IGNORE_ID_FIELD);
		return  _v;
	}

}
