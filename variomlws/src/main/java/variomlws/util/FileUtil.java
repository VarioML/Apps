package variomlws.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileChannel.MapMode;

public class FileUtil {
	
	public static byte[] readData(FileInputStream fin) throws Exception {
		FileChannel ch = null;
		try {
			ch = fin.getChannel();
			int size = (int) ch.size();
			MappedByteBuffer buf = ch.map(MapMode.READ_ONLY, 0, size);
			byte[] bytes = new byte[size];
			buf.get(bytes);
			return bytes;
		} catch (IOException e) {
			throw e;
		} finally {
			try {
				if (fin != null) {
					fin.close();
				}
				if (ch != null) {
					ch.close();
				}
			} catch (IOException e) {
				throw e;
			}
		}
	}

	public static byte[] readData(String fileName) throws Exception {
		File f = new File(fileName);
		return readData(new FileInputStream(f));
	}


}
