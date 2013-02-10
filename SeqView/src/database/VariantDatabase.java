package database;

/**
 * Interface for variant databases.
 * 
 * @author Tuomas PellonperŠ
 *
 */
public interface VariantDatabase {

    /**
     * Get the HUGO Gene Nomenclature Committee 
     * (<a href="http://www.genenames.org/">HGNC</a>) data related to the gene.
     * 
     * @param gene      approved symbol of the gene
     * @return          HGNC data
     */
    abstract public DatabaseQueryResult getHgncData(String gene);

    /**
     * Get variant data corresponding to an ID.
     * <p><strong>NOTE</strong>: The ID doesn't need to have anything to do
     * with gene id's. It can be specified by the underlying database system.
     * The ID is used to single out genes and variants in the database.
     * 
     * @param id        id of the desired variant
     * @return          the desired variant
     */
    abstract public DatabaseQueryResult getVariantById(String id);

    /**
     * Get variants related to the gene.
     * 
     * @param gene      accession name of the gene
     * @param skip      number of variants to skip (in the database query)
     * @param limit     how many variants shall be returned
     * @return          variants produced by the database query
     */
    abstract public DatabaseQueryResult getVariantsData(String gene, 
                                                        int skip,
                                                        int limit);

    /**
     * Use geneDb as the gene name database.
     * 
     * @param geneDb        gene name database.
     */
    abstract public void setGeneNameDatabase(GeneNameDatabase geneDb);

}