package ir.nightcast.app;

import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Opens Android's system Sharesheet for podcast links and messages. */
@CapacitorPlugin(name = "NightCastShare")
public class NightCastShare extends Plugin {

    @PluginMethod
    public void share(PluginCall call) {
        String title = call.getString("title", "پیشنهاد شنیدنی از NightCast");
        String text = call.getString("text", "");
        String url = call.getString("url", "");

        StringBuilder message = new StringBuilder();
        if (text != null && !text.trim().isEmpty()) {
            message.append(text.trim());
        }
        if (url != null && !url.trim().isEmpty() &&
                (message.length() == 0 || !message.toString().contains(url.trim()))) {
            if (message.length() > 0) message.append("\n");
            message.append(url.trim());
        }

        if (message.length() == 0) {
            call.reject("متن اشتراک‌گذاری خالی است.");
            return;
        }

        try {
            Intent sendIntent = new Intent(Intent.ACTION_SEND);
            sendIntent.setType("text/plain");
            sendIntent.putExtra(Intent.EXTRA_TEXT, message.toString());

            Intent chooser = Intent.createChooser(sendIntent,
                    title == null || title.trim().isEmpty()
                            ? "اشتراک‌گذاری با NightCast"
                            : title);
            getActivity().startActivity(chooser);

            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("باز کردن فهرست برنامه‌های اشتراک‌گذاری ممکن نشد.", error);
        }
    }
}
