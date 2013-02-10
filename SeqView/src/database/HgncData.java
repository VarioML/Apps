package database;

import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.codehaus.jackson.annotate.JsonProperty;

/**
 * A serializable class for 
 * <a href="http://www.genenames.org/">HGNC</a> data.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class HgncData
       extends java.util.AbstractMap<String, Object>
       implements Serializable {
    
    private static final long serialVersionUID = 2485880557707709L;

    public HgncData() {
        super();
        this.data = new HashMap<String, Object>();
    }
    
    public HgncData(Map<String, Object> data) {
        super();
        this.data = new HashMap<String, Object>(data);
    }
    
    @Override
    public Set<java.util.Map.Entry<String, Object>> entrySet() {
        return this.data.entrySet();
    }

    public Object get(String key) {
        return data.get(key);
    }
    
    @SuppressWarnings("unchecked")
    private void readObject(java.io.ObjectInputStream s) 
            throws IOException, ClassNotFoundException {
        
        s.defaultReadObject();
        data = (HashMap<String, Object>) s.readObject();
        
    }

    private void writeObject(java.io.ObjectOutputStream s) 
            throws IOException {
        
        s.defaultWriteObject();
        s.writeObject(data);
        
    }

    @JsonProperty
    private HashMap<String, Object> data;
}
