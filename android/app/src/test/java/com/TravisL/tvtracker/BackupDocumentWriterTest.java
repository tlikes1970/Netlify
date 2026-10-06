package com.TravisL.tvtracker;

import static org.junit.Assert.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

public class BackupDocumentWriterTest {
    @Test public void exactJsonAndUnicodeAreWrittenBeforeClosing() throws Exception {
        boolean[] closed = { false };
        ByteArrayOutputStream stream = new ByteArrayOutputStream() {
            @Override public void close() throws IOException { closed[0] = true; super.close(); }
        };
        String json = "{\"title\":\"España 🎬\"}";
        BackupDocumentWriter.write(stream, json);
        assertEquals(json, new String(stream.toByteArray(), StandardCharsets.UTF_8));
        assertTrue(closed[0]);
    }
    @Test public void missingProviderFails() {
        assertThrows(IOException.class, () -> BackupDocumentWriter.write(null, "{}"));
    }
    @Test public void writeFailureStillClosesAndFails() {
        boolean[] closed = { false };
        OutputStream stream = new OutputStream() {
            @Override public void write(int value) throws IOException { throw new IOException("write failed"); }
            @Override public void close() { closed[0] = true; }
        };
        assertThrows(IOException.class, () -> BackupDocumentWriter.write(stream, "{}"));
        assertTrue(closed[0]);
    }
    @Test public void flushFailureStillClosesAndFails() {
        boolean[] closed = { false };
        ByteArrayOutputStream stream = new ByteArrayOutputStream() {
            @Override public void flush() throws IOException { throw new IOException("flush failed"); }
            @Override public void close() { closed[0] = true; }
        };
        assertThrows(IOException.class, () -> BackupDocumentWriter.write(stream, "{}"));
        assertTrue(closed[0]);
    }
    @Test public void closeFailureCannotReportSuccess() {
        ByteArrayOutputStream stream = new ByteArrayOutputStream() {
            @Override public void close() throws IOException { throw new IOException("close failed"); }
        };
        assertThrows(IOException.class, () -> BackupDocumentWriter.write(stream, "{}"));
    }
}
