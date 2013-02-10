package handlers;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.http.HttpHeaders;
import org.eclipse.jetty.io.WriterOutputStream;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

/**
 * To produce a response to a request, Jetty requires a 
 * <a href="http://download.eclipse.org/jetty/stable-7/apidocs/org/eclipse/jetty/server/Handler.html">Handler</a> 
 * to be set on the server. 
 * <p>A handler may</p>
 * <ul>
 * <li>examine/modify the HTTP request.</li>
 * <li>generate the complete HTTP response. </li>
 * <li>call another Handler.</li>
 * <li>select one or many Handlers to call.</li>
 * </ul>
 * <p>This class is the base class for other handlers in this application. 
 * The subclasses must implement the 'handle' method.</p>
 * 
 * @author Tuomas Pellonperä
 *
 */
public abstract class BaseHandler extends AbstractHandler {
    
    public BaseHandler() {
        super();
        this.handled = false;
    }

    /**
     * An object of the RoutingHandler attaches the matched route 
     * to the corresponding handler.
     * 
     * @return  the associated/matched route
     */
    protected final String getRoute() {
        return myRoute;
    }

    /**
     * Set the associated/matched route.
     * 
     * @param route     the route this handler was matched with
     */
    protected final void setRoute(String route) {
        this.myRoute = route;
    }

    protected void setRequestHandled(org.eclipse.jetty.server.Request req) {
        req.setHandled(true);
        this.handled = true;
    }
    
    protected boolean wasRequestHandled() {
        return handled;
    }

    /**
     * Sends a stream as a response to the request.
     * 
     * @param input         stream to be sent
     * @param mime          MIME type
     * @param length        length of the (byte) stream
     * @param baseRequest   base request
     * @param request       the request the stream is sent as the
     *                      response to
     * @param response      the response to be sent
     * @throws IOException
     */
    protected void sendStream(InputStream input, 
                              String mime, 
                              long length,
                              Request baseRequest,
                              HttpServletRequest request, 
                              HttpServletResponse response)
                    throws IOException {

        this.send(input, mime, length, baseRequest, request, response);

    }

    /**
     * Send the file as a response to the request.
     * 
     * @param file          file to be sent
     * @param mime          MIME type of the file
     * @param baseRequest   base request
     * @param request       the request the file is sent as the
     *                      response to
     * @param response      the response to be sent
     * @throws IOException
     */
    protected void sendFile(File file, 
                            String mime, 
                            Request baseRequest,
                            HttpServletRequest request, 
                            HttpServletResponse response)
            throws IOException {
        
        FileInputStream input = new FileInputStream(file);
        this.send(input, mime, file.length(), baseRequest, request, response);

    }

    /**
     * Send a character string as the response to the request.
     * 
     * @param string        string to be sent
     * @param mime          MIME type of the string
     * @param baseRequest   base request
     * @param request       the request the string is sent as the
     *                      response to
     * @param response      response to be sent
     * @throws IOException
     */
    protected void sendString(String string, 
                              String mime, 
                              Request baseRequest,
                              HttpServletRequest request, 
                              HttpServletResponse response) throws IOException {
        
        byte[] buf = string.getBytes();
        ByteArrayInputStream input = new ByteArrayInputStream(buf);
        this.send(input, mime, buf.length, baseRequest, request, response);
        
    }

    /**
     * Send the stream, of the specified length, as the response 
     * to the request.
     * 
     * @param input         stream to be sent
     * @param mime          MIME type of the stream
     * @param length        length of the stream
     * @param baseRequest   base request
     * @param request       the request the stream is sent as the
     *                      response to
     * @param response      response to be sent
     * @throws IOException
     */
    private void send(InputStream input, 
                      String mime, 
                      long length,
                      Request baseRequest,
                      HttpServletRequest request, 
                      HttpServletResponse response) throws IOException {

        OutputStream out = null;
        final int BUFFER_SIZE = 1024 * 1024;
        byte[] buf = new byte[BUFFER_SIZE];
        int numRead = 0;

        try {
            out = response.getOutputStream();
        } catch (IllegalStateException e) {
            out = new WriterOutputStream(response.getWriter());
        }

        response.setContentType(mime);
        response.setHeader(HttpHeaders.CONTENT_LENGTH, Long.toString(length));
        response.setStatus(HttpServletResponse.SC_OK);
        while (true) {
            numRead = input.read(buf, 0, buf.length);
            if (numRead == -1) {
                break;
            }
            out.write(buf, 0, numRead);
        }
        out.flush();
        out.close();
        this.setRequestHandled(baseRequest);

    }

    // Set this true when the request has been handled.
    private boolean handled;
    
    private String myRoute;
}
