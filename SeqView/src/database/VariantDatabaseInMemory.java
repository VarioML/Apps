package database;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import network.EnsemblURL;

import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

import security.SqlParameter;

import com.orientechnologies.orient.core.db.document.ODatabaseDocumentTx;
import com.orientechnologies.orient.core.iterator.ORecordIteratorCluster;
import com.orientechnologies.orient.core.record.impl.ODocument;
import com.orientechnologies.orient.core.sql.query.OSQLSynchQuery;
import com.orientechnologies.orient.core.storage.OStorage;

/**
 * This class implements an in-memory database for gene variants.
 * <p>The idea is to give users a chance to use a 
 * <a href="http://www.json.org/">JSON</a> file of their own 
 * and feed it into the database engine. All this without 
 * any extensive application configuration.</p>
 * <p><strong>Note:</strong> the JSON file must include an 
 * <em>array</em> of proper objects.
 * <p>The database engine used is 
 * <a href="http://www.orientdb.org/">OrientDB</a>.</p>
 * 
 * @author Tuomas Pellonperä
 *
 */

public class VariantDatabaseInMemory extends VariantDabaseCommon {
    
    public VariantDatabaseInMemory(String src) {
        super();
        source = new File(src);
        if (source.isDirectory() || !source.exists() || !source.canRead()) {
            source = new File(DEFAULT_VARIANT_DATA);
        }
        dbInMemory = false;
        initdb();
    }

    public VariantDatabaseInMemory() {
        this(DEFAULT_VARIANT_DATA);
    }
    
    @Override
    public DatabaseQueryResult getVariantById(String id) {
        DatabaseQueryResult result = new DatabaseQueryResult();

        if (dbInMemory == false) {
            initdb();
            if (dbInMemory == false) {
                return result;
            }
        }
        
        // Protect against SQL injections.
        if (!SqlParameter.sqlInjectionResistant(id, SqlParameter.ALPHANUMERIC)) {
            System.err.println("Possibly dangerous query parameter (id): '" + id + "'");
            return result;
        }

        String fmt = "SELECT FROM cluster:%s WHERE id = ?";
        String sql = String.format(fmt, CLUSTER_NAME);
        OSQLSynchQuery<ODocument> query = new OSQLSynchQuery<ODocument>(sql);
        List<ODocument> queryResult = database.command(query).execute(id);
        if (queryResult.size() > 0) {
            result.set("variant", doc2map(queryResult.get(0)));
        }
        return result;
    }

    @Override
    public DatabaseQueryResult getVariantsData(String gene, int skip, int limit) {
        final String COUNT_PROPERTY = "total_count";
        final String VARIANTS_PROPERTY = "variants";
        
        DatabaseQueryResult result = new DatabaseQueryResult();
        result.set(COUNT_PROPERTY, new Long(0));
        result.set(VARIANTS_PROPERTY, new ArrayList<Map<String, Object>>());

        skip = (skip < 0 ? DEFAULT_SKIP : skip);
        limit = (limit < 0 ? DEFAULT_LIMIT : limit);
        
        if (dbInMemory == false) {
            initdb();

            if (dbInMemory == false) {
                // For some reason, we cannot open the database.
                // Return an empty query result.
                return result;
            }
        }
        
        ORecordIteratorCluster<ODocument> cit = database.browseCluster(CLUSTER_NAME);
        @SuppressWarnings("unchecked")
        ArrayList<Map<String, Object>> variants = 
                (ArrayList<Map<String, Object>>) result.get(VARIANTS_PROPERTY);
        long count = 0;
        for (ODocument d : cit) {
            if (matches(d, gene)) {
                ++count;
                if (skip > 0) {
                    --skip;
                    continue;
                }
                if (limit > 0) {
                    --limit;
                    Map<String, Object> m = doc2map(d);
                    m.put("uri", EnsemblURL.uri(getEnsemblId(gene)));
                    variants.add(m);
                }
            }
        }
        result.set(COUNT_PROPERTY, count);
        return result;
    }
    
    /**
     * Determine if the document is equivalent to the gene.
     * 
     * @param d     OrientDB document
     * @param gene  approved symbol (accession) of the gene to be matched against
     * @return      true if document "matches" the gene
     */
    private boolean matches(ODocument d, String gene) {
        @SuppressWarnings("rawtypes")
        ArrayList<LinkedHashMap> l = d.field("genes");
        for (@SuppressWarnings("rawtypes") LinkedHashMap s : l) {
            String accession = (String) s.get("accession");
            if (accession.compareTo(gene) == 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * "Cast" an OrientDB document to a java.util.Map.
     * 
     * @param d         document to cast
     * @return          document cast into java.util.Map
     */
    private Map<String, Object> doc2map(ODocument d) {
        String[] fields = d.fieldNames();
        Map<String, Object> m = new HashMap<String, Object>();
        for (String f : fields) {
            m.put(f, d.field(f));
        }
        return m;
    }
    
    /**
     * Establish a connection to the database, or initialize the database.
     */
    private void initdb() {
        database = new ODatabaseDocumentTx(DATABASE_NAME).create();
        database.addCluster(CLUSTER_NAME, OStorage.CLUSTER_TYPE.MEMORY);
        try {
            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            ArrayList<Map<String,?>> objects = mapper.readValue(source, ArrayList.class);
            int size = objects.size();
            for (int i = 0; i < size; ++i) {
                @SuppressWarnings("unchecked")
                Map<String, Object> o = (Map<String, Object>) objects.get(i);
                database.save(new ODocument(o), CLUSTER_NAME);
            }
        } catch (JsonParseException e) {
            e.printStackTrace();
            return;
        } catch (JsonMappingException e) {
            e.printStackTrace();
            return;
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }
        dbInMemory = true;
    }
    
    private static String abspath(String filename) {
        return HOMEDIR.concat(SEPARATOR).concat(filename);
    }

    private static final String HOMEDIR = System.getProperty("user.dir");
    private static final String SEPARATOR = System.getProperty("file.separator");
    private static final String DEFAULT_VARIANT_DATA;
    
    private static final String DATABASE_NAME = "memory:variants";
    private static final String CLUSTER_NAME = "variants";
    
    private static final int DEFAULT_SKIP = 0;
    private static final int DEFAULT_LIMIT = 20;
    
    private File source;
    private boolean dbInMemory;
    private ODatabaseDocumentTx database;
    
    static {
        DEFAULT_VARIANT_DATA = abspath("genedata/variants.json");
    }
}
