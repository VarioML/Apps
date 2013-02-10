package handlers;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

/**
 * This handler examines the request and calls the 'handle' 
 * method of the appropriate handler. Hence the
 * <em>routing</em> handler.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class RoutingHandler extends AbstractHandler {

    public RoutingHandler() {
        super();
        routes = new HashMap<String, BaseHandler>();
    }
    
    /**
     * Bind a handler to a route.
     * 
     * @param route     the route (part of URL, or URI)
     * @param handler   the handler which will handle the
     *                  requests associated with the route
     */
    public void bind(String route, BaseHandler handler) {
        if (routes.containsKey(route) == false) {
            routes.put(route, handler);
        }
    }

    @Override
    public void handle(String target, Request baseRequest, HttpServletRequest request,
            HttpServletResponse response) throws IOException, ServletException {

        String path = request.getRequestURI();
        
        if (path.length() < MINIMUM_ROUTE_LENGTH) {
            if ("/".equals(path)) {
                path = "/index.html";
            }
        }
        
        /*
         * Say the requested path is '/projects/sviewer/images/lock.png'.
         * The proper handler for this path is found by trying, in the
         * listed order, these sub-paths:
                /projects/sviewer/images/lock.png
                /projects/sviewer/images
                /projects/sviewer
                /projects
         */
        RouteIterator it = new RouteIterator(path);
        while (it.hasNext()) {
            String route = it.next();
            if (routes.containsKey(route)) {
                BaseHandler h = routes.get(route);
                h.setRoute(route);
                h.handle(target, baseRequest, request, response);
                return;
            }
        }
    }
    
    private final HashMap<String, BaseHandler> routes;
    private final int MINIMUM_ROUTE_LENGTH = 2;
    private final String DELIMITER = "/";

    /**
     * Iterates a route--the input string--in a pre-determined
     * order.
     * <p>
     * Assume the requested route is '/projects/sviewer/images/lock.png'.
     * This iterator will "return" these subroutes in the 
     * specified order:
     * </p>
     * <ol>
     * <li>/projects/sviewer/images/lock.png</li>
     * <li>/projects/sviewer/images</li>
     * <li>/projects/sviewer</li>
     * <li>/projects</li>
     * </ol>
     * @author Tuomas Pellonperä
     *
     */
    private class RouteIterator implements Iterator<String> {

        public RouteIterator(String input) {
            super();
            this.input = input;
            this.routes = getRoutes(this.input);
            this.index = this.routes.size() - 1;
        }

        @Override
        public boolean hasNext() {
            return (this.index >= 0);
        }

        @Override
        public String next() {
            int end = this.routes.get(this.index);
            String s = this.input.substring(BEGIN, end);
            --this.index;
            return s;
        }

        @Override
        public void remove() {
            // Not implemented.
        }
        
        private Vector<Integer> getRoutes(String r) {
            int from = 1;
            int index = 0;
            Vector<Integer> indices = new Vector<Integer>(10);
            
            while ((index = r.indexOf(DELIMITER, from)) != -1) {
                indices.add(index);
                from = index + 1;
            }
            indices.add(r.length());
            indices.trimToSize();
            return indices;
        }

        private final String input;
        private final Vector<Integer> routes;
        private int index;
        private final int BEGIN = 0;
    }

}
