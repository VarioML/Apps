package codegen.gen

import freemarker.template.Configuration
import freemarker.template.Version
import java.io.File
import java.util.Locale
import freemarker.template.TemplateExceptionHandler
import java.util.HashMap
import codegen.db.MetaData
import java.io.FileWriter
import freemarker.template.ObjectWrapper
import codegen.db.Settings
import codegen.db.Schema

class Generator {

  val fm = initFreemaker

  def initFreemaker: Configuration = {

    val cfg = new Configuration();
    val dir = new File("templates")
    assert(dir.exists())

    cfg.setDirectoryForTemplateLoading(new File("templates"));
    cfg.setIncompatibleImprovements(new Version(2, 3, 20));
    cfg.setDefaultEncoding("UTF-8");
    cfg.setLocale(Locale.US);
    cfg.setObjectWrapper(ObjectWrapper.BEANS_WRAPPER)
    cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);

    return cfg
  }

  def generateAuditFeatures(schema: Schema) {

    val template = fm.getTemplate("audit_features.ftl");

    schema.tables.filter(f => (
      !f.name.toLowerCase().endsWith("_audit") // we do not generate triggers for audit tables
      && f.tableType == "TABLE")).foreach {
      table =>
        println("Genertaing... " + table.name + " " + table.tableType)
        val meta = new HashMap[String, Object]();
        val fileOut = new FileWriter(new File("out/audit_" + table.name + ".sql"));
        meta.put("table", table);
        try {
          template.process(meta, fileOut);
        } finally {
          fileOut.close();
        }
    }
  }

}
object Generator {

  def main(args: Array[String]) {

    val metadata = MetaData("db")
    val schema = metadata.getSchema("public");

    val generator = new Generator()
    generator.generateAuditFeatures(schema)

  }
}