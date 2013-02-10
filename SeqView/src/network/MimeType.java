package network;

import java.util.Hashtable;

/**
 * This class deals with <a href="http://en.wikipedia.org/wiki/MIME">MIME types</a>.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class MimeType {
    private MimeType() {}
    
    public static String getMimeByExtension(String type) {
        if (mimeTypes.containsKey(type)) {
            return mimeTypes.get(type);
        }
        return "UNKNOWN TYPE EXTENSION";
    }
    
    public static boolean knownMimeTypeExtension(String ext) {
        return mimeTypes.containsKey(ext);
    }
    
    private static final Hashtable<String, String> mimeTypes = new Hashtable<String, String>();
    
    public static final String CSS          = "text/css";
    public static final String GIF          = "image/gif";
    public static final String HTM          = "text/html";
    public static final String HTML         = "text/html";
    public static final String JAVASCRIPT   = "text/javascript";
    public static final String JPEG         = "image/jpeg";
    public static final String JPG          = "image/jpeg";
    public static final String JS           = "text/javascript";
    public static final String JSON         = "application/json";
    public static final String PNG          = "image/png";
    public static final String SVG          = "image/svg+xml";
    public static final String TXT          = "text/plain";
    public static final String XML          = "text/xml";
    
    static {
        mimeTypes.put("css",        CSS);
        mimeTypes.put("gif",        GIF);
        mimeTypes.put("htm",        HTM);
        mimeTypes.put("html",       HTML);
        mimeTypes.put("jpeg",       JPEG);
        mimeTypes.put("jpg",        JPG);
        mimeTypes.put("js",         JS);
        mimeTypes.put("json",       JSON);
        mimeTypes.put("png",        PNG);
        mimeTypes.put("svg",        SVG);
        mimeTypes.put("txt",        TXT);
        mimeTypes.put("xml",        XML);
    }

}
