package database;

import java.net.UnknownHostException;

import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.Mongo;
import com.mongodb.MongoException;

/**
 * A class representing a connection to a MongoDB database.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class MongoDatabaseConnection extends DatabaseConnection {
    
    public MongoDatabaseConnection(DatabaseConfig config)
           throws DatabaseConnectionException {

        Mongo m = null;
        String hostName = config.get("host"); 
        String dbName = config.get("database");
        String collectionName = config.get("collection");
        
        try {
            m = new Mongo(hostName);
        } catch (UnknownHostException e) {
            throw new DatabaseConnectionException(e.getMessage());
        } catch (MongoException e) {
            throw new DatabaseConnectionException(e.getMessage());
        }
        
        this.database = m.getDB(dbName);
        this.collection = database.getCollection(collectionName);
        
    }

    public DBCollection getCollection() {
        return collection;
    }

    private final DB database;
    private final DBCollection collection;
}
