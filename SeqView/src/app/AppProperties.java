package app;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * This class represents the configurable properties of the
 * application.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class AppProperties {
    
    /**
     * The port number which the server will be listening on.
     */
    public static final String PORT = "port";

    /**
     * The path to a json file from which we load gene names.
     */
    public static final String GENEDB = "genedb";

    /**
     * The path to a json file from which we load variant data.
     */
    public static final String VARIANTDB = "variantdb";
    
    /**
     * The type of database to use.
     */
    public static final String DATABASE = "database";

    /**
     * Use an in-memory, or embedded, database. 
     * Give this value as a parameter to DATABASE.
     * 
     * @see AppProperties#DATABASE
     */
    public static final String DB_MEMORY = "memory";
    
    /**
     * Use MongoDB as database. 
     * Give this value as a parameter to DATABASE.
     * 
     * @see AppProperties#DATABASE
     */
    public static final String DB_MONGO = "mongo";

    /**
     * Select a directory to serve static files from.
     */
    public static final String WWWDIR = "wwwdir";

    /**
     * If the parameter does not take/need a value, use this
     * as a "place holder."
     */
    public static final String EMPTY_VALUE = "";
    
    public AppProperties() {
        super();
    }
    
    /**
     * A property exists if it has been set, or in case of 
     * a value-less property, if it has been seen.
     * 
     * @param property  Property name to check.
     * @return          true, if property has been set or seen.
     */
    public boolean exists(String property) {
        return properties.containsKey(property);
    }

    public String get(String property) {
        return properties.getProperty(property);
    }
    
    public void set(String key, String value) {
        properties.setProperty(key, value);
    }
    
    private final Properties defaults;
    private final Properties properties;
    
    {
        
        // Set some default values.
        defaults = new Properties();
        defaults.setProperty(PORT, "8080");
        defaults.setProperty(DATABASE, DB_MEMORY);
        
        properties = new Properties(defaults);
        try {
            // Read the application configuration file.
            InputStream file = new FileInputStream(CONFIG_FILE);
            properties.load(file);
        } 
        catch (FileNotFoundException e) {} 
        catch (IOException e) {}
    }
    
    private static final String CONFIG_FILE = 
            System.getProperty("user.dir")
            .concat(System.getProperty("file.separator"))
            .concat("app.config");
}
