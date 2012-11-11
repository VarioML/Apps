package org.varioml.ws.jaxb;

@org.codehaus.jackson.annotate.JsonAutoDetect(fieldVisibility = org.codehaus.jackson.annotate.JsonAutoDetect.Visibility.NONE, getterVisibility = org.codehaus.jackson.annotate.JsonAutoDetect.Visibility.NONE, setterVisibility = org.codehaus.jackson.annotate.JsonAutoDetect.Visibility.NONE)
@org.codehaus.jackson.map.annotate.JsonSerialize(include = org.codehaus.jackson.map.annotate.JsonSerialize.Inclusion.NON_NULL)
@javax.xml.bind.annotation.XmlRootElement(namespace = "http://varioml.org/xml/1.0", name = "batch_error")
@javax.xml.bind.annotation.XmlAccessorType(javax.xml.bind.annotation.XmlAccessType.FIELD)
@org.codehaus.jackson.annotate.JsonPropertyOrder(value = { "_attr_row_id","_attr_type", "__string" })
// __string is name for text node
public class BatchError {

	public BatchError() { } //we need this.. 
	
	// ===========-- type --===========
	@javax.xml.bind.annotation.XmlAttribute(required = false, name = "type")
	private String _attr_type;

	public void setType(String attr_type) {
		this._attr_type = attr_type;
	}

	public String getType() {
		return this._attr_type;
	}

	// ===========-- row_id --===========
	@javax.xml.bind.annotation.XmlAttribute(required = false, name = "row_id")
	private String _attr_row_id;

	public void setRowId(String row_id) {
		this._attr_row_id = row_id;
	}

	public String getRowId() {
		return this._attr_row_id;
	}

	// =========-- TEXT NODE --=========
	@org.codehaus.jackson.annotate.JsonProperty("string")
	@javax.xml.bind.annotation.XmlValue
	private String __string;

	public BatchError(String row_id, String type, String v) {
		this.__string = v;
		this._attr_type = type;
		this._attr_row_id = row_id;
	}

	public void setString(String v) {
		this.__string = v;
	}

	public String getString() {
		return this.__string;
	}

}
