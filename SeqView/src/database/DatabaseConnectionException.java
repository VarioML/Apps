package database;

/**
 * Class for database connection exceptions.
 *  
 * @author Tuomas Pellonperä
 *
 */
public class DatabaseConnectionException extends Exception {

    public DatabaseConnectionException(String message) {
        super(message);
    }

    private static final long serialVersionUID = 1L;
}
