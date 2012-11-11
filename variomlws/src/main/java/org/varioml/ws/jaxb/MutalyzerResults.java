package org.varioml.ws.jaxb;

import java.util.ArrayList;
import java.util.List;

import org.varioml.jaxb.Variant;

@org.codehaus.jackson.annotate.JsonAutoDetect(fieldVisibility = org.codehaus.jackson.annotate.JsonAutoDetect.Visibility.NONE, getterVisibility = org.codehaus.jackson.annotate.JsonAutoDetect.Visibility.NONE, setterVisibility = org.codehaus.jackson.annotate.JsonAutoDetect.Visibility.NONE)
@org.codehaus.jackson.map.annotate.JsonSerialize(include = org.codehaus.jackson.map.annotate.JsonSerialize.Inclusion.NON_NULL)
@javax.xml.bind.annotation.XmlRootElement(namespace = "http://varioml.org/xml/1.0", name = "mutalyzer_results")
@javax.xml.bind.annotation.XmlAccessorType(javax.xml.bind.annotation.XmlAccessType.FIELD)
@javax.xml.bind.annotation.XmlType(propOrder = { "_variant", "_batch_error" })
@org.codehaus.jackson.annotate.JsonPropertyOrder(value = { "_variant","_batch_error" })
public class MutalyzerResults {

	public MutalyzerResults(){};
	
	// ===========-- variant --===========
	@org.codehaus.jackson.annotate.JsonProperty("variants")
	@javax.xml.bind.annotation.XmlElement(required = false, name = "variant", type = Variant.class, namespace = "http://varioml.org/xml/1.0")
	private List<Variant> _variant;

	public void setVariantList(List<Variant> variant) {
		this._variant = variant;
	}

	public List<Variant> getVariantList() {
		return this._variant;
	}

	public void addVariant(Variant item) {
		if (this._variant == null) {
			this._variant = new ArrayList<Variant>();
		}
		this._variant.add(item);
	}

	// ===========-- batch_error --===========
	@org.codehaus.jackson.annotate.JsonProperty("batch_errors")
	@javax.xml.bind.annotation.XmlElement(required = false, name = "batch_error", type = BatchError.class, namespace = "http://varioml.org/xml/1.0")
	private List<BatchError> _batch_error;

	public void setBatchError(List<BatchError> batch_error) {
		this._batch_error = batch_error;
	}

	public List<BatchError> getBatchError() {
		return this._batch_error;
	}

	public void addBatchError(BatchError item) {
		if (this._batch_error == null) {
			this._batch_error = new ArrayList<BatchError>();
		}
		this._batch_error.add(item);
	}

	
}
