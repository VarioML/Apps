package network;

import java.util.HashMap;
import java.util.Random;
import java.util.Vector;

import org.eclipse.jetty.http.HttpMethods;

/**
 * Rewrite URIs. Change one URI into another.
 * URIs are distinguished based on the HTTP method
 * (GET, POST, etc.). They can be rewritten either
 * fully (static rules), or just their prefix can
 * be rewritten (prefix rules).
 * <p>Static rules take precedence over prefix ones.
 * 
 * @author Tuomas Pellonperä
 *
 */
public class UriRewriter {
    
    public UriRewriter() {
        super();
        staticRules = new HashMap<String,   /* method */ 
                                  HashMap<String, String> /* rules */>();
        prefixRules = new HashMap<String, Vector<String>>();
        prefixRuleMap = new HashMap<String, String>();
        salts = new HashMap<String, String>();
        random = new Random(708833134193L);
    }
    
    /**
     * Rewrite the URI assuming it uses the HTTP GET method.
     * 
     * @param uri   URI to be rewritten
     * @return      rewritten URI
     */
    public String rewrite(String uri) {
        return rewrite(HttpMethods.GET, uri);
    }
    
    /**
     * Rewrite the URI, making no assumptions on the HTTP method.
     * <p>If both a static rule and a prefix rule match the URI,
     * then the URI is rewritten based on the <em>static</em>
     * rule.
     * <p>If several prefix rules match the URI, then the 
     * <em>longest</em> one will be used to rewrite the URI.
     * <p>If no rule matches the URI, then it will be returned
     * <em>unmodified</em>.
     * 
     * @param method    HTTP method
     * @param uri       URI to be written
     * @return          rewritten URI (or if no matching rules are found, 
     *                  then the input URI will be returned)
     */
    public String rewrite(String method, String uri) {

        // First, check if there's a static rule.
        // Static rules take precedence over prefix rules.
        if (staticRules.containsKey(method)) {
            HashMap<String, String> map = staticRules.get(method);
            if (map.containsKey(uri)) {
                return map.get(uri);
            }
        }

        // No static rule, so check if there's a prefix one.
        if (prefixRules.containsKey(method)) {
            Vector<String> v = prefixRules.get(method);
            String prefix = "";    // The longest prefix.
            
            // Find the longest matching prefix of uri.
            for (int i = 0; i < v.size(); ++i) {
                String s = v.get(i);
                if (uri.startsWith(s)) {
                    if (s.length() > prefix.length()) {
                        prefix = s;
                    }
                }
            }
            if (prefix.length() > 0) {
                String salt = salts.get(method);
                String key = salt.concat(prefix);
                String replacement = prefixRuleMap.get(key);
                return uri.replaceFirst(prefix, replacement);
            }
        }

        // No rewrite rule found. Return the uri itself.
        return uri;
     }
    
    /**
     * Add a prefix rule for the HTTP GET method.
     * 
     * @param from      original string
     * @param to        replacement string
     */
    public void addPrefixRule(String from, String to) {
        addPrefixRule(HttpMethods.GET, from, to);
    }

    /**
     * Add a prefix rule for the specified HTTP method.
     * 
     * @param method    HTTP method (GET, POST, etc)
     * @param from      original string
     * @param to        replacement string
     */
    public void addPrefixRule(String method, String from, String to) {
        if (! prefixRules.containsKey(method)) {
            prefixRules.put(method, new Vector<String>());
            salts.put(method, Long.toString(random.nextLong()));
        }
        if (prefixRuleMap.containsKey(from)) {
            // Simply replace the old value.
            prefixRuleMap.put(from, to);
        } else {
            Vector<String> v = prefixRules.get(method);
            String salt = salts.get(method);
            v.add(from);
            prefixRuleMap.put(salt.concat(from), to);
        }
    }

    /**
     * Add a static rule for the HTTP GET method.
     * 
     * @param from      original string
     * @param to        replacement string
     */
    public void addStaticRule(String from, String to) {
        addStaticRule(HttpMethods.GET, from, to);
    }

    /**
     * Add a static rule for the specified HTTP method.
     * 
     * @param method    HTTP method (GET, POST, etc)
     * @param from      original string
     * @param to        replacement string
     */
    public void addStaticRule(String method, String from, String to) {
        if (! staticRules.containsKey(method)) {
            staticRules.put(method, new HashMap<String, String>());
        }
        staticRules.get(method).put(from, to);
    }

    private final HashMap<String, HashMap<String, String>> staticRules;
    private final HashMap<String, Vector<String>> prefixRules;
    private final HashMap<String, String> prefixRuleMap;
    
    // For dynamic rules, different key may appear in several methods.
    // Hence, use a per-method salt.
    private final HashMap<String, String> salts;
    
    private static Random random;
    
}
