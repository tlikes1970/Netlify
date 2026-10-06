package com.TravisL.tvtracker;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Completes the exact UTF-8 backup before the bridge may report success. */
final class BackupDocumentWriter {
    private BackupDocumentWriter() {}

    static void write(OutputStream destination, String json) throws IOException {
        if (destination == null) throw new IOException("Document provider unavailable");
        try (OutputStream stream = destination) {
            stream.write(json.getBytes(StandardCharsets.UTF_8));
            stream.flush();
        }
    }
}
