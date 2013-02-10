package database;

public interface GeneNameDatabase {

    /**
     * Search <a href="http://www.genenames.org/">HGNC</a> 
     * data using a filter and return all matching 
     * gene names and symbols.
     * 
     * @param filterName    matches both approved symbol name and approved name.
     * @return              an object containing two ArrayList<String> objects
     *                      (one for approved symbols, one for approved names)
     */
    abstract public DatabaseQueryResult getGeneNamesAndSymbols(String filterName);

    /**
     * Get <a href="http://www.genenames.org/">HGNC</a> 
     * (HUGO Gene Nomenclature Committee) data about a gene.
     * 
     * @param symbol    approved symbol name of the desired gene
     * @return          HGNC data 
     */
    abstract public HgncData getHgncData(String symbol);

}