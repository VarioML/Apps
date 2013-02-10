package network;

public class EnsemblURL {
    
    /**
     * Generate a full URI to the 
     * <a href="http://www.ensembl.org/index.html">Ensembl Genome Browser</a>
     * website.
     * 
     * @param id        Ensembl ID for gene
     * @return          URI to the Ensembl website
     */
    public static String uri(String id) {
        String uri = ensemblUrl.concat(id);
        return uri;
    }
    
    private static final String ensemblUrl = "http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=";
}
