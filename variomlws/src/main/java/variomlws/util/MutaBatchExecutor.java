package variomlws.util;

import java.math.BigInteger;
import java.rmi.RemoteException;

import javax.xml.rpc.ServiceException;

import nl.mutalyzer._2_0.services.Mutalyzer;
import nl.mutalyzer._2_0.services.MutalyzerServiceLocator;

public class MutaBatchExecutor {

	public String  executeAndWait(byte data[], String process, String argument) 
			throws ServiceException, RemoteException, InterruptedException {

		MutalyzerServiceLocator locator = new MutalyzerServiceLocator();
		Mutalyzer mut = locator.getMutalyzer();

		String result  = null ;
		BigInteger job_id;
		try {
			job_id = mut.submitBatchJob(data, process, argument);
			boolean notFound = true;
			while (notFound) {
				Thread.sleep(1000);
				BigInteger left = mut.monitorBatchJob(job_id);
				if (left.intValue() == 0) {
					byte out[] = mut.getBatchJob(job_id);
					notFound = false;
					result = new String(out);
				} else {
					//todo: add event handler
				}
			}

		} catch (RemoteException e) {
			throw e;
		} catch (InterruptedException e) {
			throw e;
		}
		return result;
	}
}
