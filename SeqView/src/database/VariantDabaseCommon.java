package database;

/**
 * A common base class for variant databases.
 * 
 * @author Tuomas Pellonperä
 *
 */
public abstract class VariantDabaseCommon implements VariantDatabase {

    public VariantDabaseCommon(GeneNameDatabase geneDb) {
        super();
        this.geneDb = geneDb;
    }

    public VariantDabaseCommon() {
        super();
        geneDb = null;
    }
    
    /**
     * Get the Ensembl ID of the gene.
     * 
     * @param gene      symbol name of the gene
     * @return          Ensembl ID corresponding to the symbol
     */
    public String getEnsemblId(String gene) {
        HgncData hgnc = geneDb.getHgncData(gene);
        String id = (String) hgnc.get("ensembl_id_ensembl");
        return id;
    }

    @Override
    public DatabaseQueryResult getHgncData(String gene) {
        HgncData hgnc = geneDb.getHgncData(gene);
        DatabaseQueryResult result = new DatabaseQueryResult();
        result.set("hgnc", hgnc);
        return result;
    }

    @Override
    public void setGeneNameDatabase(GeneNameDatabase geneDb) {
        this.geneDb = geneDb;
    }

    protected final GeneNameDatabase getGeneNameDatabase() {
        return geneDb;
    }

    private GeneNameDatabase geneDb;

}