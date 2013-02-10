package database;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import network.EnsemblURL;

import org.bson.types.ObjectId;

import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

/**
 * Variant database using the MongoDB database system.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class VariantDatabaseMongoDB extends VariantDabaseCommon implements VariantDatabase {

    public VariantDatabaseMongoDB(DatabaseConfig config) 
           throws DatabaseConnectionException {
        
        super();
        this.connection = new MongoDatabaseConnection(config);
        this.collection = this.connection.getCollection();
        
        // Make sure database connection is properly closed when the 
        // program terminates.
        // http://www.developerfeed.com/threads/tutorial/understanding-java-shutdown-hook
        Runtime.getRuntime().addShutdownHook(new Thread() {
            @Override
            public void run() {
                closeConnection();
            }

            private void closeConnection() {}
        });
    }
    
    @Override
    public DatabaseQueryResult getVariantById(String id) {
        DatabaseQueryResult result = new DatabaseQueryResult();
        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));
        DBObject d = this.collection.findOne(query);
        @SuppressWarnings("unchecked")
        Map<String, Object> m = d.toMap();
        result.set("variant", m);
        return result;
    }

    @Override
    public DatabaseQueryResult getVariantsData(String gene, int skip, int limit) {
        
        long count = 0;
        List<Map<String, Object>> variants = new ArrayList<Map<String, Object>>();
        DBCursor cursor = null;
        BasicDBObject query = new BasicDBObject();
        
        query.put("genes.accession", gene);
        
        try {
            cursor = this.collection.find(query);
            count = cursor.count();
            cursor = cursor.skip( skip ).limit( limit );
            while (cursor.hasNext()) {
                DBObject dobj = cursor.next();

                /*
                 * Looks like Ext JS grid widget requires an ID for every 
                 * element it displays (note that the ID field is not 
                 * necessarily displayed). For now, we will use the builtin
                 * MongoDB ID-field.
                 */
                dobj.put("id", dobj.get("_id").toString());
                dobj.put("uri", EnsemblURL.uri(getEnsemblId(gene)));
                @SuppressWarnings("unchecked")
                Map<String, Object> map = dobj.toMap();
                variants.add(map);
            }
        }
        finally {
            cursor.close();
        }
        
        DatabaseQueryResult results = new DatabaseQueryResult();
        results.set("total_count", new Long(count));
        results.set("variants", variants);
        
        return results;
    }   

    private final MongoDatabaseConnection connection;
    //private DB database;
    private final DBCollection collection;

}
