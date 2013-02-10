package database;

import java.util.HashMap;
import java.util.Map;

/**
 * Class for configuring database systems.
 * <p>Basically, this class is just a wrapper over 
 * java.util.Map.</p>
 * 
 * @author Tuomas Pellonperä
 *
 */
public class DatabaseConfig {
    
    public DatabaseConfig() {
        this.properties = new HashMap<String, String>();
    }
    
    /**
     * Set a configuration value.
     * 
     * @param name      parameter name 
     * @param value     parameter value
     * @return          this DatabaseConfig object 
     *                  (useful for chaining calls to 'set' together)
     */
    public DatabaseConfig set(String name, String value) {
        this.properties.put(name, value);
        return this;
    }
    
    /**
     * Get the configuration value.
     * 
     * @param name      parameter name to get.
     * @return          value of the parameter.
     */
    public String get(String name) {
        if (this.properties.containsKey(name)) {
            return this.properties.get(name);
        }
        return null;
    }

    private final Map<String, String> properties;
}
