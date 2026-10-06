package com.TravisL.tvtracker;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;

/** User-selected backup delivery through Android SAF. No broad storage permissions. */
@CapacitorPlugin(name = "BackupDocuments")
public class BackupDocumentsPlugin extends Plugin {
    private volatile boolean saving;

    @PluginMethod
    public void saveBackup(PluginCall call) {
        String filename = call.getString("filename");
        String json = call.getString("json");
        if (saving || filename == null || json == null || json.isEmpty()
                || !filename.matches("flicklet-backup-[0-9]{4}-[0-9]{2}-[0-9]{2}\\.json")) {
            finish(call, "failed", false);
            return;
        }
        saving = true;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        // Keep JSON in the saved Capacitor call, never in Intent extras (Binder size limit).
        getActivity().runOnUiThread(() -> {
            try {
                startActivityForResult(call, intent, "backupDestination");
            } catch (Exception failure) {
                finish(call, "failed", true);
            }
        });
    }

    @ActivityCallback
    private void backupDestination(PluginCall call, ActivityResult result) {
        if (call == null) { saving = false; return; }
        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            finish(call, "cancelled", true);
            return;
        }
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            finish(call, "failed", true);
            return;
        }
        execute(() -> {
            try {
                String json = call.getString("json");
                if (json == null) throw new IOException("Backup content unavailable");
                OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt");
                BackupDocumentWriter.write(stream, json);
                // Resolve only after close succeeds. A failed/partial write is never a saved backup.
                finish(call, "saved", true);
            } catch (Exception failure) {
                finish(call, "failed", true);
            }
        });
    }

    private void finish(PluginCall call, String status, boolean clearPending) {
        if (clearPending) saving = false;
        JSObject result = new JSObject();
        result.put("status", status);
        call.resolve(result);
    }
}
