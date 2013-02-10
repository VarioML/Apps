package security;

/**
 * Combat security vulnerabilities arising from 
 * <a href="http://en.wikipedia.org/wiki/SQL_injection">SQL injections</a>.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class SqlParameter {
    
    /**
     * Check that the input string contains only alpha-numeric
     * characters.
     * 
     * @param s     input string
     * @return      true, if the input string contains only 
     *              alpha-numeric characters; false otherwise
     */
    public static boolean sqlInjectionResistant(String s) {
        return sqlInjectionResistant(s, ALPHANUMERIC);    
    }
    
    /**
     * Check that the input string contains only characters which
     * the mode allows.
     * <p>Single modes, such as the one for lowercase letters,
     * are represented as integers. You can "chain" them together
     * using the bitwise OR operator ('|' in Java).
     * 
     * @param s     input string
     * @param mode  the mode
     * @return      true, if the input string does not contain
     *              <em>illegal</em> characters; false otherwise
     */
    public static boolean sqlInjectionResistant(String s, int mode) {
        StringBuilder classes = new StringBuilder();
        
        if ((mode & UPPERCASE) != 0) {
            classes.append("A-Z");
        }
        if ((mode & LOWERCASE) != 0) {
            classes.append("a-z");
        }
        if ((mode & NUMBERS) != 0) {
            classes.append("0-9");
        }
        if ((mode & HYPHEN) != 0) {
            classes.append("\\-");
        }
        if ((mode & SPACE) != 0) {
            classes.append(" ");
        }
        if ((mode & PARENTHESES) != 0) {
            classes.append("()");
        }
        if ((mode & BRACKETS) != 0) {
            classes.append("\\[\\]");
        }
        if ((mode & BRACES) != 0) {
            classes.append("{}");
        }
        if ((mode & COMMA) != 0) {
            classes.append(",");
        }
        
        String pattern = String.format("^[%s]+$", classes.toString());
        return s.matches(pattern);
    }
    
    /**
     * Mode for the uppercase letters ('A', 'B', ..., 'Z').
     */
    public static final int UPPERCASE;
    
    /**
     * Mode for the lowercase letters ('a', 'b', ..., 'z').
     */
    public static final int LOWERCASE;
    
    /**
     * Mode for the digits (0, 1, ..., 9).
     */
    public static final int NUMBERS;
    
    /**
     * Mode for '-'.
     */
    public static final int HYPHEN;
    
    /**
     * Mode for the space (' ').
     */
    public static final int SPACE;
    
    /**
     * Mode for the normal parenthesis ('(', ')').
     */
    public static final int PARENTHESES;
    
    /**
     * Mode for the brackets ('[', ']').
     */
    public static final int BRACKETS;
    
    /**
     * Mode for the curly braces ('{', '}').
     */
    public static final int BRACES;
    
    /**
     * Mode for the comma (',').
     */
    public static final int COMMA;
    
    /**
     * Mode for the alphabetical letters (e.g. uppercase
     * and lowercase letters).
     */
    public static final int ALPHABET;
    
    /**
     * Mode for the alpha-numeric characters
     * (e.g. lowercase and uppercase letters, digits).
     */
    public static final int ALPHANUMERIC;
    
    /**
     * Allow <strong>any</strong> type of character. 
     * <p><em>Use at your own risk!</em>
     */
    public static final int EVERYTHING = Integer.MAX_VALUE;
    
    static {
        int i = 1;
        
        UPPERCASE           = i;        i <<= 1;
        LOWERCASE           = i;        i <<= 1;
        NUMBERS             = i;        i <<= 1;
        HYPHEN              = i;        i <<= 1;
        SPACE               = i;        i <<= 1;
        PARENTHESES         = i;        i <<= 1;
        BRACKETS            = i;        i <<= 1;
        BRACES              = i;        i <<= 1;
        COMMA               = i;        i <<= 1;
        
        ALPHABET            = UPPERCASE | LOWERCASE;
        ALPHANUMERIC        = UPPERCASE | LOWERCASE | NUMBERS;
    }
}
