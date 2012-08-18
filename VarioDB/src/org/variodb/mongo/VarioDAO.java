package org.variodb.mongo;

import org.bson.types.ObjectId;

public class VarioDAO {

	private ObjectId oid ;
	private Object object;
	public VarioDAO(ObjectId oid, Object object) {
		super();
		this.oid = oid;
		this.object = object;
	}
	public ObjectId getOid() {
		return oid;
	}
	public void setOid(ObjectId oid) {
		this.oid = oid;
	}
	public Object getObject() {
		return object;
	}
	public void setObject(Object object) {
		this.object = object;
	}
	
	
}
