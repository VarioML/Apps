package handlers;
import java.io.IOException;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import network.MimeType;
import network.Routes;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.eclipse.jetty.http.HttpMethods;
import org.eclipse.jetty.server.Request;
import org.varioml.util.Util;

import database.DatabaseQueryResult;
import database.GeneNameDatabase;
import database.HgncData;
import database.VariantDatabase;

/**
 * This class handles requests which need queries to a variant 
 * database.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class VariantHandler extends BaseHandler {

    public VariantHandler() {
        super();
        geneDb = null;
    }
    
    public VariantHandler(VariantDatabase db) {
        super();
        this.db = db;
    }
    
    public void setDatabase(VariantDatabase db) {
        this.db = db;
    }
    
    public void setGeneNameDatabase(GeneNameDatabase geneDb) {
        this.geneDb = geneDb;
        this.db.setGeneNameDatabase(geneDb);
    }

    @Override
    public void handle(String target, 
                       Request baseRequest,
                       HttpServletRequest request, 
                       HttpServletResponse response)
            throws IOException, ServletException {
        
        if (baseRequest.isHandled()) {
            return;
        }

        String method = request.getMethod();
        String path = request.getRequestURI();
        String route = this.getRoute();

        // http://prideafrica.blogspot.fi/2007/01/javalangclasscastexception.html
        @SuppressWarnings("unchecked")
        Map<String, String[]> params = request.getParameterMap();
        Util util = new Util();

        if (HttpMethods.GET.equals(method)) {
            
            if (route.equals(Routes.SVIEW_DATA)) {
                
                String symbolKey = "symbol";
                if (! params.containsKey(symbolKey) ) {
                    return;
                }
                String idKey = "id";
                if (! params.containsKey(idKey) ) {
                    return;
                }

                String gene = params.get(symbolKey)[0];
                DatabaseQueryResult r1 = db.getHgncData(gene);
                HgncData hgnc = (HgncData) r1.get("hgnc");
                String id = params.get(idKey)[0];
                DatabaseQueryResult r2 = db.getVariantById(id);
                @SuppressWarnings("unchecked")
                Map<String, Object> variant = (Map<String, Object>) r2.get("variant");
                
                String jsonFormat = "{\"variant\": %s, \"hgnc\": %s}";
                
                ObjectMapper mapper = new ObjectMapper();
                SerializationConfig conf = mapper.getSerializationConfig();
                conf.without(SerializationConfig.Feature.FAIL_ON_EMPTY_BEANS);
                StringWriter writer = new StringWriter();
                mapper.writeValue(writer, hgnc);
                String hgncJson = writer.toString();
                String variantJson = util.toJSONString(variant);
                String json = String.format(jsonFormat, variantJson, hgncJson);
                sendString(json, MimeType.JSON, baseRequest, request, response);
                return;
                
            } else if (route.equals(Routes.VARIANTS)) {
                
                int pageNumber = DEFAULT_PAGE;
                int skip = DEFAULT_SKIP;
                int limit = DEFAULT_SKIP;
                Matcher regex = pattern.matcher(path);
                if (! regex.matches()) {
                    return;
                }
                
                String gene = params.get("gene")[0];
                gene = gene.split(" ", 2)[0];
                
                pageNumber = paramValue(params, "page", DEFAULT_PAGE);
                skip = paramValue(params, "start", DEFAULT_SKIP, true);
                limit = paramValue(params, "limit", DEFAULT_LIMIT);
                
                DatabaseQueryResult data = db.getVariantsData(gene, skip, limit);
                long count = (Long) data.get("total_count");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> variants = (List<Map<String, Object>>) data.get("variants");
                if (variants.isEmpty()) {
                    sendString(String.format(JSON_STRING_PATTERN, count, "[]"), 
                               MimeType.JSON, 
                               baseRequest, 
                               request, 
                               response);
                    return;
                }

                String json = String.format(JSON_STRING_PATTERN, 
                                            count, 
                                            util.toJSONString(variants));
                sendString(json, MimeType.JSON, baseRequest, request, response);
                return;
                
            }
        } else if (HttpMethods.POST.equals(method)) {

            String msg = " ";
            
            if (path.equals(SEARCH_URL)) {

                if (params.containsKey(GENE_NAME_PARAMETER)) {
                    String p = params.get(GENE_NAME_PARAMETER)[0];
                    String geneName = p.split(" ", 2)[0];
                    msg = String.format("Path: %s; gene: %s", 
                                        request.getRequestURI(), geneName);
                }
            }

            sendString(msg, MimeType.TXT, baseRequest, request, response);
            return;
        }
    }

    /**
     * Get a proper value corresponding to the key NAME in PARAMS.
     * Allow zero as a return value.
     * 
     * @param params        map to look up values from
     * @param name          name, or key, to look up
     * @param defaultValue  default value (if the key was not found)
     * @return              a proper integer value
     */
    private int paramValue(Map<String, String[]> params,
                        String name,
                        int defaultValue) {
        
        return paramValue(params, name, defaultValue, true /* zero allowed */);
        
    }
    
    /**
     * Get a proper value corresponding to the key NAME in PARAMS.
     * 
     * @param params        map to look up values from
     * @param name          name, or key, to look up
     * @param defaultValue  default value (if the key was not found)
     * @param zeroAllowed   true if zero is a valid return value
     * @return              a proper integer value
     */
    private int paramValue(Map<String, String[]> params,
                          String name,
                          int defaultValue,
                          boolean zeroAllowed) {
        
        int value = defaultValue;
        
        if (params.containsKey(name)) {
            try {
                value = Integer.parseInt(params.get(name)[0]);
            } catch (NumberFormatException e) {
                value = defaultValue;
            } finally {
                value = Math.abs(value);
                if (zeroAllowed == false) {
                    value = (value > 0) ? value : defaultValue;
                }
            }
        }
        return value;
        
    }
    
    private VariantDatabase db;
    private GeneNameDatabase geneDb;

    static private Pattern pattern = Pattern.compile("^/variants");
    
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_SKIP = 0;
    private static final int DEFAULT_LIMIT = 10;
    private static final String JSON_STRING_PATTERN = "{\"totalCount\": \"%d\", \"variants\": %s}";
    private static final String GENE_NAME_PARAMETER = "genename";
    private static final String SEARCH_URL = "/variants/search";

}
