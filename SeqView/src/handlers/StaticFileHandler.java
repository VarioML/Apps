package handlers;
// ========================================================================
// Copyright (c) 1999-2009 Mort Bay Consulting Pty. Ltd.
// ------------------------------------------------------------------------
// All rights reserved. This program and the accompanying materials
// are made available under the terms of the Eclipse Public License v1.0
// and Apache License v2.0 which accompanies this distribution.
// The Eclipse Public License is available at
// http://www.eclipse.org/legal/epl-v10.html
// The Apache License v2.0 is available at
// http://www.opensource.org/licenses/apache2.0.php
// You may elect to redistribute this code under either of these licenses.
// ========================================================================

import java.io.File;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Hashtable;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import network.MimeType;
import network.UriRewriter;

import org.eclipse.jetty.http.HttpMethods;
import org.eclipse.jetty.http.HttpStatus;
import org.eclipse.jetty.server.Request;

import security.FileAccessControl;

/**
 * This class handles requests to static files
 * (e.g. JavaScript files, CSS files, etc).
 * 
 * @author Tuomas Pellonperä
 *
 */
public class StaticFileHandler extends BaseHandler {
    public StaticFileHandler() {
        super();
        
        wwwDir = DEFAULT_WWW_DIR;
        accessControl = new FileAccessControl(DEFAULT_WWW_DIR);
    }
    
    /* ------------------------------------------------------------ */
    @Override
    public void doStart() throws Exception {
        super.doStart();
    }

    /* ------------------------------------------------------------ */
    /**
     * @see
     * org.eclipse.jetty.server.Handler#handle(javax.servlet.http.HttpServletRequest
     * , javax.servlet.http.HttpServletResponse, int)
     */
    @Override
    public void handle(String target, 
                       Request baseRequest,
                       HttpServletRequest request, 
                       HttpServletResponse response) throws IOException, ServletException {
        if (baseRequest.isHandled())
            return;
        
        String path = request.getRequestURI();
        
        // Assume that all requests are "GET"-requests.
        path = rewriter.rewrite(path);

        if (HttpMethods.GET.equals(request.getMethod())) {

            if (path.equals("/")) {
                path = "/index.html";
            }
            
            switch (accessControl.pathAccessStatus(path)) {
            case FileAccessControl.ACCESS_ALLOWED:
                String fullPath = wwwDir.concat(path);
                File file = new File(fullPath);
                String mime = getMimeType(request.getPathInfo());
                sendFile(file, mime, baseRequest, request, response);
                break;
            case FileAccessControl.ACCESS_DENIED:
                response.sendError(HttpStatus.FORBIDDEN_403);
                break;
            case FileAccessControl.FILE_NOT_FOUND:
                response.sendError(HttpStatus.NOT_FOUND_404);
                break;
            default:
                response.sendError(HttpStatus.FORBIDDEN_403);
                break;
            }
        }
    }
    
    public void setDirectory(String path) {
        File d = new File(path);
        if (d.isDirectory() || d.canRead()) {
            wwwDir = d.getAbsolutePath();
            accessControl.setDirectory(d);
        }
    }
    
    private String getMimeType(String path) {
        // As we are interested only in the suffix, there is 
        // no harm in converting the PATH to lower case.
        path = path.toLowerCase();
        
        Enumeration<String> keys = mimeTypes.keys();
        while (keys.hasMoreElements()) {
            String ext = keys.nextElement();
            if (path.endsWith(".".concat(ext))) {
                return mimeTypes.get(ext);
            }
        }
        return DEFAULT_MIME;
    }
    
    private String wwwDir;

    private final FileAccessControl accessControl;
    
    // Directory we will be serving the files from.
    private static final String DEFAULT_WWW_DIR = 
            System.getProperty("user.dir")
                  .concat(System.getProperty("file.separator"))
                  .concat("public");
    
    private static final String DEFAULT_MIME = "text/html;charset=utf-8";
    private static final Hashtable<String, String> mimeTypes = new Hashtable<String, String>();
    private static final UriRewriter rewriter = new UriRewriter();
    
    static {
        mimeTypes.put("css",        MimeType.CSS);
        mimeTypes.put("gif",        MimeType.GIF);
        mimeTypes.put("htm",        MimeType.HTM);
        mimeTypes.put("html",       MimeType.HTML);
        mimeTypes.put("jpeg",       MimeType.JPEG);
        mimeTypes.put("jpg",        MimeType.JPG);
        mimeTypes.put("js",         MimeType.JS);
        mimeTypes.put("json",       MimeType.JSON);
        mimeTypes.put("png",        MimeType.PNG);
        mimeTypes.put("svg",        MimeType.SVG);
        mimeTypes.put("txt",        MimeType.TXT);
        mimeTypes.put("xml",        MimeType.XML);
        
        rewriter.addStaticRule("/shared/example.css", 
                               "/extjs/css/shared/example.css");
        rewriter.addStaticRule("/ux/PreviewPlugin.js", 
                               "/extjs/js/ux/PreviewPlugin.js");
        rewriter.addPrefixRule("/resources/themes/images",
                               "/extjs/themes/images");
    }
}
