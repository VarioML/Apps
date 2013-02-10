package database;

import java.util.ArrayList;
import java.util.Map;
import java.util.regex.Pattern;

import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.QueryBuilder;

/**
 * Class for GeneNameDatabase using the MongoDB database system.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class GeneNameDatabaseMongoDB implements GeneNameDatabase {

    public GeneNameDatabaseMongoDB(DatabaseConfig config) 
            throws DatabaseConnectionException {
        
        super();
        this.connection = new MongoDatabaseConnection(config);
        this.collection = this.connection.getCollection();
        
    }

    @Override
    public HgncData getHgncData(String symbol) {
        DBObject query = new BasicDBObject();
        query.put("approved_symbol", symbol);
        DBObject data = collection.findOne(query);
        @SuppressWarnings("unchecked")
        Map<String, Object> map = data.toMap();
        return new HgncData(map);
    }
    
    @Override
    public DatabaseQueryResult getGeneNamesAndSymbols(String filterName) {

        DBCursor cursor = null;
        DatabaseQueryResult results = new DatabaseQueryResult();
        ArrayList<String> geneSymbols = new ArrayList<String>();
        ArrayList<String> geneNames = new ArrayList<String>();
        BasicDBObject query = new BasicDBObject();
        BasicDBObject refs = new BasicDBObject();
        results.set("symbols", geneSymbols);
        results.set("names", geneNames);
        
        /*
         * As an "optimization," if the filterName is not long 
         * enough, just return an empty result. Browsers tend to
         * hang if we constantly send more than 65.000 elements 
         * as a response (i.e. all the elements in the database).
         */
        if (filterName.length() < MINIMUM_FILTER_LENGTH) {
            return results;
        }
        
        // http://www.mongodb.org/display/DOCS/Java+Types#JavaTypes-RegularExpressions
        String regxeString = String.format(".*%s.*", filterName);
        Pattern p = Pattern.compile(regxeString, Pattern.CASE_INSENSITIVE);

        // http://stackoverflow.com/questions/11087628/mongodb-and-java-logical-or-with-regex-query
        QueryBuilder qb = QueryBuilder.start();
        DBObject dbObject1 = QueryBuilder.start("approved_name").regex(p).get();
        DBObject dbObject2 = QueryBuilder.start("approved_symbol").regex(p).get();
        query = (BasicDBObject) qb.or(dbObject1, dbObject2).get();
        
        refs.put("approved_name", 1);
        refs.put("approved_symbol", 1);
        
        try {
            cursor = this.collection.find(query, refs);
            while (cursor.hasNext()) {
                DBObject dobj = cursor.next();
                String symbol = (String) dobj.get("approved_symbol");
                String name = (String) dobj.get("approved_name");
                geneSymbols.add(symbol);
                geneNames.add(name);
            }
        }
        finally {
            cursor.close();
        }
        
        return results;
    }
    
    private final MongoDatabaseConnection connection;
    private final DBCollection collection;
    
    private static final int MINIMUM_FILTER_LENGTH = 3;
}
