package database;

import java.io.IOException;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.codehaus.jackson.annotate.JsonProperty;

/**
 * Class for database query results. Essentially, this class is
 * a subclass of java.util.Map.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class DatabaseQueryResult
       extends java.util.AbstractMap<String, Object>
       implements Serializable {
    
    private static final long serialVersionUID = 637464719022820L;

    public DatabaseQueryResult() {
        results = new HashMap<String, Object>();
    }

    public DatabaseQueryResult(Map<String, Object> map) {
        results = new HashMap<String, Object>(map);
    }

    @Override
    public Set<java.util.Map.Entry<String, Object>> entrySet() {
        return this.results.entrySet();
    }
    
    public DatabaseQueryResult set(String name, Object value) {
        results.put(name, value);
        return this;
    }
    
    public Object get(String key) {
        return results.get(key);
    }
    
    @Override
    public Object get(Object key) {
        if (key instanceof String) {
            return this.get((String) key);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void readObject(java.io.ObjectInputStream s) 
            throws IOException, ClassNotFoundException {
        
        s.defaultReadObject();
        results = (HashMap<String, Object>) s.readObject();
        
    }

    private void writeObject(java.io.ObjectOutputStream s) 
            throws IOException {
        
        s.defaultWriteObject();
        s.writeObject(results);
        
    }

    @JsonProperty
    private Map<String, Object> results;
}
