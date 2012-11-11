package examples;

import nl.mutalyzer._2_0.services.CheckSyntaxOutput;
import nl.mutalyzer._2_0.services.Mutalyzer;
import nl.mutalyzer._2_0.services.MutalyzerServiceLocator;
import nl.mutalyzer._2_0.services.SoapMessage;
import variomlws.util.FileUtil;
import variomlws.util.MutaBatchExecutor;

public class MutalyzerTest {


	public static void main(String[] args) throws Exception {

		MutalyzerServiceLocator locator = new MutalyzerServiceLocator();
		Mutalyzer mut = locator.getMutalyzer();

		CheckSyntaxOutput co = mut.checkSyntax("c.12G>g");
		for (SoapMessage msg : co.getMessages()) {
			System.out.println("Message " + msg.getMessage());
		}
		byte data[] = FileUtil.readData("data/mutalyzer_batch.txt");
		String process = "PositionConverter";
		String argument = "hg19";

		MutaBatchExecutor exe = new MutaBatchExecutor() ;
		String res = exe.executeAndWait(data, process, argument) ;
		System.out.println(res);
		
	}
}
