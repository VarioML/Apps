package database;

import org.bson.BSON;
import org.bson.types.ObjectId;
import org.varioml.util.Util;

import com.mongodb.DBCollection;
import com.mongodb.DBDecoder;
import com.mongodb.DBObject;
import com.mongodb.DefaultDBDecoder;
import com.mongodb.util.JSON;

public class MongoUtil  extends Util {

	DBDecoder decoder = DefaultDBDecoder.FACTORY.create();

	protected ObjectId generateId() {
		return new ObjectId();
	}

	public DBObject create( DBCollection collection, Object variomlObject ) {
		DBObject d = decoder.decode(toBSON4MONGO(variomlObject),
				collection);
		ObjectId id = generateId();
		d.put("_id", id);
		return d;
	}
	public DBObject create( DBCollection collection, Object variomlObject, String asNamed ) {
		DBObject d = decoder.decode(toBSON4MONGO(variomlObject),
				collection);
		ObjectId id = generateId();
		DBObject _new = (DBObject)JSON.parse("{}");
		_new.put(asNamed, d);
		_new.put("_id", id);
		return _new;
	}

	public DBObject insert(DBCollection collection, Object variomlObject) {
		DBObject d = create( collection, variomlObject);
		collection.insert(d);
		return d;
	}

	public DBObject insert(DBCollection collection, Object variomlObject, String asNamed) {

		DBObject _new = create(collection, variomlObject, asNamed);
		collection.insert(_new);
		return _new;
	}

	public Object encode(DBObject dbObject, Class variomlClass) {
		Object _v = toVarioML(BSON.encode(dbObject), variomlClass,IGNORE_ID_FIELD);
		return  _v;
	}
	public Object encode(DBObject dbObject, Class variomlClass, String asNamed) {
		DBObject d = (DBObject)dbObject.get(asNamed);
		if ( d == null ) {
			//todo: use Logger
			throw new RuntimeException("Cannot encode DBObject ("+asNamed+"). Object not found");
		}
		Object _v = toVarioML(BSON.encode(d), variomlClass);
		return  _v;
	}

}
