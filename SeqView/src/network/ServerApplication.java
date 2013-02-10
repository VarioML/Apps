package network;

import handlers.GeneNameHandler;
import handlers.NcbiHandler;
import handlers.RoutingHandler;
import handlers.StaticFileHandler;
import handlers.VariantHandler;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.nio.SelectChannelConnector;

import app.AppProperties;
import database.DatabaseConfig;
import database.DatabaseConnectionException;
import database.GeneNameDatabase;
import database.GeneNameDatabaseInMemory;
import database.GeneNameDatabaseMongoDB;
import database.VariantDatabase;
import database.VariantDatabaseInMemory;
import database.VariantDatabaseMongoDB;

/**
 * This class embeds the 
 * <a href="http://www.eclipse.org/jetty/">Jetty</a> webserver 
 * into the application. It is the starting point of the
 * custom made web server which provides users with an interface
 * to searching gene variants and access to 
 * <a href="http://www.ensembl.org/index.html">Ensembl</a> website and
 * <a href="http://www.ncbi.nlm.nih.gov/projects/sviewer/">NCBI Sequence Viewer</a>.
 * 
 * @author Tuomas Pellonperä
 */

public class ServerApplication {
    public static void main(String[] args) {
        
        AppProperties config = new AppProperties();
        
        // Parse command-line arguments.
        for (String arg : args) {
            if (arg.startsWith("-")) {
                arg = arg.substring(1);
                int index = arg.indexOf('=');
                if (index != -1) {
                    String key = arg.substring(0, index);
                    String value = arg.substring(index + 1);
                    config.set(key, value);
                } else {
                    // The argument does not take a value.
                    config.set(arg, AppProperties.EMPTY_VALUE);
                }
            }
        }
        
        Server server = new Server();
        SelectChannelConnector connector = new SelectChannelConnector();
        connector.setPort(new Integer(config.get(AppProperties.PORT)));
        server.addConnector(connector);
        
        RoutingHandler router = new RoutingHandler();
        StaticFileHandler staticHandler = new StaticFileHandler();
        VariantHandler variantHandler = new VariantHandler();
        GeneNameHandler geneHandler = new GeneNameHandler();
        NcbiHandler ncbiHandler = new NcbiHandler();
        
        if (config.exists(AppProperties.WWWDIR)) {
            String dir = config.get(AppProperties.WWWDIR);
            staticHandler.setDirectory(dir);
        }
        
        VariantDatabase variantDb = null;
        GeneNameDatabase geneDb = null;
        String dbType = config.get(AppProperties.DATABASE);
        
        if (dbType.compareTo(AppProperties.DB_MEMORY) == 0) {
            
            // Use in-memory database.
            
            String source = "";
            if (config.exists(AppProperties.VARIANTDB)) {
                source = config.get(AppProperties.VARIANTDB);
            }
            variantDb = new VariantDatabaseInMemory(source);
            
            source = "";
            if (config.exists(AppProperties.GENEDB)) {
                source = config.get(AppProperties.GENEDB);
            }
            geneDb = new GeneNameDatabaseInMemory(source);
            
        } else if (dbType.compareTo(AppProperties.DB_MONGO) == 0) {
            
            // Use MongoDB.

            try {
                variantDb = 
                    new VariantDatabaseMongoDB(
                            new DatabaseConfig()
                                .set("host", "localhost")
                                .set("database", "variodb")
                                .set("collection", "variants"));
                geneDb = 
                    new GeneNameDatabaseMongoDB(
                            new DatabaseConfig()
                                .set("host", "localhost")
                                .set("database", "variodb")
                                .set("collection", "hgnc_genes"));
            } catch (DatabaseConnectionException e) {
                System.err.println("Could not initialize the Mongo database.");
                e.printStackTrace();
                System.exit(1);
            }
            
        }

        variantHandler.setDatabase(variantDb);
        geneHandler.setDatabase(geneDb);
        variantHandler.setGeneNameDatabase(geneDb);

        // Associate routes with handlers.
        router.bind(Routes.GENES,               geneHandler);
        router.bind(Routes.NCBISV,              ncbiHandler);
        router.bind(Routes.NCBI_IMAGES,         ncbiHandler);
        router.bind(Routes.NCBI_EXTJS,          ncbiHandler);
        router.bind(Routes.SVIEW_DATA,          variantHandler);
        router.bind(Routes.VARIANTS,            variantHandler);
        
        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[] { router, staticHandler });
        server.setHandler(handlers);

        try {
            server.start();
            server.join();
        } catch (Exception e) {
            System.err.println("Could not start the webserver.");
            e.printStackTrace();
        }
    }
    
}