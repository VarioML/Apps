package security;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Control access to the file system.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class FileAccessControl {

    public FileAccessControl(String rootPath) {
        this.rootDir = new File(rootPath);
    }
    
    public void setDirectory(File dir) {
        if (dir.isDirectory() || dir.canRead()) {
            rootDir = dir;
        }
    }

    /**
     * Decide whether access should be allowed to the desired file.
     * 
     * @param path      the desired file
     * @return          a proper access status code (an integer)
     */
    public int pathAccessStatus(String path) {
        URI u;
        try {
            u = new URI(path);
            path = u.normalize().toString();
            path = rootDir.getAbsolutePath().concat(path);
            File f = new File(path);
            
            if (f.exists() == false) {
                return FILE_NOT_FOUND;
            }
            if (underRoot(f) == false) {
                return ACCESS_DENIED;
            }
            if (f.isFile() == false || f.canRead() == false) {
                return ACCESS_DENIED;
            }
            return ACCESS_ALLOWED;
        } catch (URISyntaxException e) {
            return FILE_NOT_FOUND;
        }
    }
    
    /**
     * Make sure that the input file is located either under 
     * the root directory, or under its subdirectories.
     * <p>The purpose is to prevent access to files outside 
     * the root directory.
     * 
     * @param f     input file
     * @return      true, the root directory is an ancestor (i.e. parent directory) 
     *              of the input file; false otherwise
     */
    private boolean underRoot(File f) {
        String rootPath;
        try {
            rootPath = rootDir.getCanonicalPath();
            String path = f.getCanonicalPath();
            return path.startsWith(rootPath);
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * The root directory to serve files from.
     */
    private File rootDir;
    
    public static final int ACCESS_ALLOWED = 0;
    public static final int ACCESS_DENIED = 1;
    public static final int FILE_NOT_FOUND = 2;
}
