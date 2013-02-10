package network;

import java.util.Iterator;
import java.util.Map;
import java.util.Set;

public class QueryStringBuilder {
    
    /**
     * Build a query string.
     * 
     * @param map       java.util.Map to build the query string from
     * @return          the manufactured query string
     */
    public static String build(Map<String, String[]> map) {
        StringBuilder buf = new StringBuilder();
        Set<String> keys = map.keySet();
        Iterator<String> it = keys.iterator();
        boolean addEt = false;      // add '&' character.

        while (it.hasNext()) {
            String key = it.next();
            String[] values = map.get(key);
            if (buf.length() == 0) {
                buf.append('?');
            }
            for (String value : values) {
                if (addEt == false) {
                    addEt = true;
                } else {
                    buf.append('&');
                }
                buf.append(key);
                buf.append('=');
                buf.append(value);
            }
        }
        return buf.toString();
    }
}
