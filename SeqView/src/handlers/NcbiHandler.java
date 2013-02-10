package handlers;

import java.io.IOException;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import network.QueryStringBuilder;
import network.Routes;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.eclipse.jetty.server.Request;

/**
 * This class handles requests related to fething files necessary
 * to the <a href="http://www.ncbi.nlm.nih.gov/projects/sviewer/">Sequence
 * Viewer</a>.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class NcbiHandler extends BaseHandler {

    @Override
    public void handle(String target, 
                       Request baseRequest,
                       HttpServletRequest request, 
                       HttpServletResponse response)
                throws IOException, 
                       ServletException {
        
        String route = this.getRoute();
        String path = request.getRequestURI();
        
        @SuppressWarnings("unchecked")
        Map<String, String[]> map = request.getParameterMap();
        String query = QueryStringBuilder.build(map);
        String url = "";
        HttpResponse res;
        
        if (route.equals(Routes.NCBI_IMAGES)) {
            
            url = makeUrl(path, route, IMAGES_URL);
            
        } else if (route.equals(Routes.NCBI_EXTJS)) {
            
            url = makeUrl(path, route, EXTJS_URL);
            
        } else if (route.equals(Routes.NCBISV)) {
            
            String cgi = path.split("/")[2];
            url = SVIEWER_URL.concat(cgi);
            
            // Avoid URISyntaxException. (http://perishablepress.com/how-to-write-valid-url-query-string-parameters/)
            url = url.concat(encodeCharacters(query));
            
        }
        
        HttpClient httpclient = new DefaultHttpClient();
        HttpGet httpget = new HttpGet(url);
        res = httpclient.execute(httpget);
        
        Header[] headers = res.getAllHeaders();
        HttpEntity entity = res.getEntity();
        long length = entity.getContentLength();
        String mime = "";
        for (Header h : headers) {
            response.setHeader(h.getName(), h.getValue());
            if (h.getName().equals("Content-Type")) {
                mime = h.getValue();
            }
        }
        this.sendStream(entity.getContent(), mime, length, 
                        baseRequest, request, response);

    }

    /**
     * Encode the "illegal" characters in the query string
     * (part of the URL). For more info, read the 
     * <a href="http://en.wikipedia.org/wiki/URL_encoding">Wikipedia</a>
     * page.
     * 
     * @param query     query string to encode
     * @return          encoded query string
     */
    private String encodeCharacters(String query) {
        String s = query.replace(" ", "%20") 
                        .replace("\\", "%5C")
                        .replace("%", "%25")
                        .replace("-", "%2D")
                        .replace(".", "%2E")
                        .replace("<", "%3C")
                        .replace(">", "%3E")
                        .replace("^", "%5E")
                        .replace("_", "%5F")
                        .replace("`", "%60")
                        .replace("{", "%7B")
                        .replace("|", "%7C")
                        .replace("}", "%7D")
                        .replace("~", "%7E");
        return s;
    }
    
    /**
     * Make an URL by substituting the first occurence of ROUTE in
     * PATH with the URL. 
     * 
     * @param path      the original path
     * @param route     route to be removed (at least the first occurence)
     * @param url       URL to add as a prefix
     * @return          created URL
     */
    private String makeUrl(String path, String route, String url) {
        String file = path.replaceFirst(route, "");
        
        // Now FILE begins with '/'. Let's fix that.
        file = file.substring(1);
        return url.concat(file);
    }
    
    private static final String BASE_URL = "http://www.ncbi.nlm.nih.gov";
    private static final String SVIEWER_URL = BASE_URL.concat("/projects/sviewer/");
    private static final String IMAGES_URL = BASE_URL.concat("/projects/sviewer/images/");
    private static final String EXTJS_URL = BASE_URL.concat("/core/extjs/ext-3.4.0/");

}
