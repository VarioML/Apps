package network;

import java.util.ArrayList;
import java.util.Arrays;

import org.eclipse.jetty.http.HttpURI;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.util.MultiMap;

/**
 * Abstraction over a URL. Extracts some useful information
 * from the Request object.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class URL {
    
    public URL(Request request) {
        super();
        this.uri = request.getUri();
        paths = new ArrayList<String>(Arrays.asList(uri.getPath().split("/")));
        paths.remove(0);
        params = request.getParameters();
    }
    
    public String getRoute() {
        return getPathComponent(0);
    }
    
    /**
     * Return the <em>i</em>:th path component.
     * 
     * @param i     index 
     * @return      <em>i</em>:th component, or an empty string 
     *              if the index value is invalid
     */
    public String getPathComponent(int i) {
        if (i < 0) {
            return "";
        }
        if (i < paths.size()) {
            return paths.get(i);
        }
        return "";
    }

    @Override
    public String toString() {
        return uri.toString();
    }

    private final HttpURI uri;
    ArrayList<String> paths;
    MultiMap<String> params;
}
